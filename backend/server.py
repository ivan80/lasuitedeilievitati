from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header, Request, Response, UploadFile, File
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone, timedelta
import requests
from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

# ---------------- Object Storage ----------------
STORAGE_BASE = (os.environ.get("INTEGRATION_PROXY_URL") or "").strip() or "https://integrations.emergentagent.com"
STORAGE_URL = STORAGE_BASE.rstrip("/") + "/objstore/api/v1/storage"
APP_NAME = "panetteria"
storage_key = None


def init_storage(force: bool = False):
    global storage_key
    if storage_key and not force:
        return storage_key
    resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_LLM_KEY}, timeout=30)
    resp.raise_for_status()
    storage_key = resp.json()["storage_key"]
    return storage_key


def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    resp = requests.put(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key, "Content-Type": content_type}, data=data, timeout=120)
    if resp.status_code == 404:
        key = init_storage(force=True)
        resp = requests.put(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key, "Content-Type": content_type}, data=data, timeout=120)
    resp.raise_for_status()
    return resp.json()


def get_object(path: str):
    key = init_storage()
    resp = requests.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key}, timeout=60)
    if resp.status_code == 404:
        key = init_storage(force=True)
        resp = requests.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key}, timeout=60)
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")


# ---------------- App / Router ----------------
app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


# ---------------- Models ----------------
class FlourItem(BaseModel):
    name: str = ""
    w: Optional[int] = None
    percent: float = 0
    use: str = "impasto"  # impasto | biga


class FermentStep(BaseModel):
    label: str = ""
    location: str = "TA"  # TA (temperatura ambiente) | Frigo
    temperature: Optional[float] = None
    hours: float = 0


class RecipeInput(BaseModel):
    name: str
    category: str
    description: Optional[str] = ""
    image_path: Optional[str] = None
    input_mode: str = "percent"  # percent | grams
    pieces: int = 1
    piece_weight: float = 250
    hydration: float = 65
    salt: float = 2.5
    yeast: float = 0.3
    yeast_type: str = "fresco"  # fresco | secco | madre
    oil: float = 0
    sugar: float = 0
    malt: float = 0
    # grams mode (total ingredients in grams)
    flour_g: float = 0
    water_g: float = 0
    salt_g: float = 0
    yeast_g: float = 0
    oil_g: float = 0
    sugar_g: float = 0
    malt_g: float = 0
    preferment_type: str = "diretto"  # diretto | biga | poolish | water_roux
    preferment_flour_percent: float = 0
    biga_management: str = "ta"  # ta | frigo
    biga_fridge_hours: int = 20
    flours: List[FlourItem] = []
    ferment_steps: List[FermentStep] = []
    steps: List[str] = []
    notes: Optional[str] = ""


class Recipe(RecipeInput):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None


class SessionInput(BaseModel):
    session_id: str


class AIRequest(BaseModel):
    context: str
    question: Optional[str] = ""


class FlourInput(BaseModel):
    name: str
    brand: Optional[str] = ""
    w: Optional[int] = None
    protein: Optional[float] = None
    absorption: Optional[float] = None
    notes: Optional[str] = ""
    datasheet_path: Optional[str] = None


class FlourDoc(FlourInput):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


# ---------------- Auth helpers ----------------
async def get_current_user(request: Request, authorization: Optional[str] = Header(None)) -> User:
    token = request.cookies.get("session_token")
    if not token and authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ", 1)[1]
    if not token:
        raise HTTPException(status_code=401, detail="Non autenticato")
    sess = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not sess:
        raise HTTPException(status_code=401, detail="Sessione non valida")
    expires_at = sess["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Sessione scaduta")
    user = await db.users.find_one({"user_id": sess["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Utente non trovato")
    return User(**user)


# ---------------- Auth routes ----------------
@api_router.post("/auth/session", response_model=User)
async def create_session(body: SessionInput, response: Response):
    r = requests.get(
        "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
        headers={"X-Session-ID": body.session_id}, timeout=30,
    )
    if r.status_code != 200:
        raise HTTPException(status_code=401, detail="Autenticazione fallita")
    data = r.json()
    email = data["email"]
    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
        await db.users.update_one({"email": email}, {"$set": {"name": data.get("name", ""), "picture": data.get("picture")}})
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id, "email": email, "name": data.get("name", ""),
            "picture": data.get("picture"), "created_at": datetime.now(timezone.utc).isoformat(),
        })
    session_token = data["session_token"]
    expires = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.insert_one({
        "user_id": user_id, "session_token": session_token,
        "expires_at": expires.isoformat(), "created_at": datetime.now(timezone.utc).isoformat(),
    })
    response.set_cookie("session_token", session_token, httponly=True, secure=True, samesite="none", path="/", max_age=7 * 24 * 60 * 60)
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return User(**user)


@api_router.get("/auth/me", response_model=User)
async def auth_me(user: User = Depends(get_current_user)):
    return user


@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    token = request.cookies.get("session_token")
    if token:
        await db.user_sessions.delete_one({"session_token": token})
    response.delete_cookie("session_token", path="/", samesite="none", secure=True)
    return {"ok": True}


# ---------------- Recipe routes ----------------
@api_router.get("/recipes", response_model=List[Recipe])
async def list_recipes(user: User = Depends(get_current_user), category: Optional[str] = None):
    q = {"user_id": user.user_id}
    if category:
        q["category"] = category
    docs = await db.recipes.find(q, {"_id": 0}).sort("updated_at", -1).to_list(1000)
    return [Recipe(**d) for d in docs]


@api_router.post("/recipes", response_model=Recipe)
async def create_recipe(body: RecipeInput, user: User = Depends(get_current_user)):
    recipe = Recipe(user_id=user.user_id, **body.model_dump())
    await db.recipes.insert_one(recipe.model_dump())
    return recipe


@api_router.get("/recipes/{recipe_id}", response_model=Recipe)
async def get_recipe(recipe_id: str, user: User = Depends(get_current_user)):
    doc = await db.recipes.find_one({"id": recipe_id, "user_id": user.user_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Ricetta non trovata")
    return Recipe(**doc)


@api_router.put("/recipes/{recipe_id}", response_model=Recipe)
async def update_recipe(recipe_id: str, body: RecipeInput, user: User = Depends(get_current_user)):
    doc = await db.recipes.find_one({"id": recipe_id, "user_id": user.user_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Ricetta non trovata")
    updated = {**body.model_dump(), "updated_at": datetime.now(timezone.utc).isoformat()}
    await db.recipes.update_one({"id": recipe_id, "user_id": user.user_id}, {"$set": updated})
    doc = await db.recipes.find_one({"id": recipe_id, "user_id": user.user_id}, {"_id": 0})
    return Recipe(**doc)


@api_router.delete("/recipes/{recipe_id}")
async def delete_recipe(recipe_id: str, user: User = Depends(get_current_user)):
    res = await db.recipes.delete_one({"id": recipe_id, "user_id": user.user_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Ricetta non trovata")
    return {"ok": True}


@api_router.post("/recipes/{recipe_id}/duplicate", response_model=Recipe)
async def duplicate_recipe(recipe_id: str, user: User = Depends(get_current_user)):
    doc = await db.recipes.find_one({"id": recipe_id, "user_id": user.user_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Ricetta non trovata")
    base = RecipeInput(**{k: v for k, v in doc.items() if k in RecipeInput.model_fields})
    copy = Recipe(user_id=user.user_id, **base.model_dump())
    copy.name = f"{doc.get('name', 'Ricetta')} (copia)"
    await db.recipes.insert_one(copy.model_dump())
    return copy


# ---------------- Flour archive routes ----------------
@api_router.get("/flours", response_model=List[FlourDoc])
async def list_flours(user: User = Depends(get_current_user)):
    docs = await db.flour_archive.find({"user_id": user.user_id}, {"_id": 0}).sort("name", 1).to_list(1000)
    return [FlourDoc(**d) for d in docs]


@api_router.post("/flours", response_model=FlourDoc)
async def create_flour(body: FlourInput, user: User = Depends(get_current_user)):
    doc = FlourDoc(user_id=user.user_id, **body.model_dump())
    await db.flour_archive.insert_one(doc.model_dump())
    return doc


@api_router.delete("/flours/{flour_id}")
async def delete_flour(flour_id: str, user: User = Depends(get_current_user)):
    res = await db.flour_archive.delete_one({"id": flour_id, "user_id": user.user_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Farina non trovata")
    return {"ok": True}


# ---------------- Upload / Files ----------------
@api_router.post("/upload")
async def upload(file: UploadFile = File(...), user: User = Depends(get_current_user)):
    ext = file.filename.split(".")[-1].lower() if "." in file.filename else "bin"
    path = f"{APP_NAME}/uploads/{user.user_id}/{uuid.uuid4()}.{ext}"
    data = await file.read()
    result = put_object(path, data, file.content_type or "application/octet-stream")
    await db.files.insert_one({
        "id": str(uuid.uuid4()), "storage_path": result["path"], "user_id": user.user_id,
        "original_filename": file.filename, "content_type": file.content_type,
        "size": result.get("size", len(data)), "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"path": result["path"]}


@api_router.get("/files/{path:path}")
async def download(path: str, user: User = Depends(get_current_user)):
    record = await db.files.find_one({"storage_path": path, "is_deleted": False}, {"_id": 0})
    if not record:
        raise HTTPException(status_code=404, detail="File non trovato")
    data, content_type = get_object(path)
    return Response(content=data, media_type=record.get("content_type") or content_type)


# ---------------- AI Suggestions ----------------
AI_SYSTEM = (
    "Sei un maestro panificatore e pizzaiolo professionista italiano con decenni di esperienza in pizza tonda "
    "napoletana e contemporanea, pizza in teglia ad alta idratazione, focaccia, pane a lievitazione naturale e "
    "grandi lievitati. Dai consigli tecnici, precisi e pratici in italiano su idratazione, sale, lievito, forza "
    "della farina (W), preimpasti (biga, poolish, water roux/tangzhong), tempi e temperature di lievitazione e "
    "maturazione (TA e frigo), impasto, staglio, stesura e cottura. Rispondi in modo chiaro e strutturato con "
    "elenchi puntati quando utile. Sii conciso ma completo. Non inventare valori impossibili."
)


async def llm_generate(prompt: str) -> str:
    chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=str(uuid.uuid4()), system_message=AI_SYSTEM).with_model("openai", "gpt-5.4-mini")
    result = ""
    async for ev in chat.stream_message(UserMessage(text=prompt)):
        if isinstance(ev, TextDelta):
            result += ev.content
        elif isinstance(ev, StreamDone):
            break
    return result


@api_router.post("/ai/suggest")
async def ai_suggest(body: AIRequest, user: User = Depends(get_current_user)):
    q = body.question.strip() if body.question else "Analizza questo impasto e dammi consigli professionali per migliorarlo (idratazione, forza farina, lievito, tempi TA/frigo, eventuali correzioni)."
    prompt = f"Dati dell'impasto/ricetta:\n{body.context}\n\nDomanda: {q}"
    try:
        text = await llm_generate(prompt)
    except Exception as e:
        logger.error(f"AI error: {e}")
        raise HTTPException(status_code=502, detail="Servizio AI non disponibile al momento")
    return {"suggestion": text}


@api_router.get("/")
async def root():
    return {"message": "Lievita API"}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    try:
        init_storage()
        logger.info("Storage initialized")
    except Exception as e:
        logger.error(f"Storage init failed: {e}")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
