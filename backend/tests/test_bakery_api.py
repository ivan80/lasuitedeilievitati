"""Backend API tests for the Panetteria (Italian bakery) app."""
import os
import io
import time
import pytest
import requests
from datetime import datetime, timezone, timedelta
from pymongo import MongoClient

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://bakery-recipe-app.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "test_database")


@pytest.fixture(scope="session")
def token():
    """Seed a session in Mongo and return the bearer token."""
    mc = MongoClient(MONGO_URL)
    db = mc[DB_NAME]
    uid = f"test-user-{int(time.time())}"
    tok = f"test_session_{int(time.time())}"
    db.users.insert_one({
        "user_id": uid,
        "email": f"qa.{int(time.time())}@example.com",
        "name": "QA Baker",
        "picture": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    db.user_sessions.insert_one({
        "user_id": uid,
        "session_token": tok,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    yield tok
    # Cleanup: delete recipes, user, session
    db.recipes.delete_many({"user_id": uid})
    db.users.delete_one({"user_id": uid})
    db.user_sessions.delete_one({"session_token": tok})
    mc.close()


@pytest.fixture
def client(token):
    s = requests.Session()
    s.headers.update({"Authorization": f"Bearer {token}", "Content-Type": "application/json"})
    return s


# ---------------- Auth ----------------
class TestAuth:
    def test_me_requires_auth(self):
        r = requests.get(f"{API}/auth/me")
        assert r.status_code == 401

    def test_me_with_bearer(self, client):
        r = client.get(f"{API}/auth/me")
        assert r.status_code == 200
        data = r.json()
        assert data["email"].startswith("qa.")
        assert data["name"] == "QA Baker"
        assert "user_id" in data

    def test_recipes_require_auth(self):
        r = requests.get(f"{API}/recipes")
        assert r.status_code == 401


# ---------------- Recipes CRUD ----------------
class TestRecipes:
    def test_full_crud_and_filter(self, client):
        payload = {
            "name": "TEST_Pizza Tonda",
            "category": "pizza_tonda",
            "description": "Napoletana classica",
            "pieces": 4,
            "piece_weight": 250,
            "hydration": 65,
            "salt": 2.5,
            "yeast": 0.3,
            "yeast_type": "fresco",
            "preferment_type": "diretto",
            "preferment_flour_percent": 0,
        }
        # Create
        r = client.post(f"{API}/recipes", json=payload)
        assert r.status_code == 200, r.text
        recipe = r.json()
        assert recipe["name"] == payload["name"]
        assert recipe["category"] == "pizza_tonda"
        assert recipe["pieces"] == 4
        rid = recipe["id"]

        # Get
        r = client.get(f"{API}/recipes/{rid}")
        assert r.status_code == 200
        assert r.json()["id"] == rid

        # List
        r = client.get(f"{API}/recipes")
        assert r.status_code == 200
        ids = [x["id"] for x in r.json()]
        assert rid in ids

        # Filter by category
        r = client.get(f"{API}/recipes", params={"category": "pizza_tonda"})
        assert r.status_code == 200
        cats = {x["category"] for x in r.json()}
        assert cats == {"pizza_tonda"}

        r = client.get(f"{API}/recipes", params={"category": "focaccia"})
        assert r.status_code == 200
        assert all(x["id"] != rid for x in r.json())

        # Update
        payload["hydration"] = 70
        payload["name"] = "TEST_Pizza Tonda Updated"
        r = client.put(f"{API}/recipes/{rid}", json=payload)
        assert r.status_code == 200
        assert r.json()["hydration"] == 70
        assert r.json()["name"] == "TEST_Pizza Tonda Updated"

        # Delete
        r = client.delete(f"{API}/recipes/{rid}")
        assert r.status_code == 200

        # Verify gone
        r = client.get(f"{API}/recipes/{rid}")
        assert r.status_code == 404


# ---------------- Duplicate ----------------
class TestDuplicate:
    def test_duplicate_recipe(self, client):
        payload = {
            "name": "TEST_Focaccia Base",
            "category": "focaccia",
            "description": "Focaccia genovese",
            "pieces": 1,
            "piece_weight": 800,
            "hydration": 75,
            "salt": 2.0,
            "yeast": 0.5,
            "yeast_type": "secco",
            "preferment_type": "diretto",
            "preferment_flour_percent": 0,
        }
        r = client.post(f"{API}/recipes", json=payload)
        assert r.status_code == 200, r.text
        original = r.json()
        oid = original["id"]

        # Duplicate
        r = client.post(f"{API}/recipes/{oid}/duplicate")
        assert r.status_code == 200, r.text
        dup = r.json()
        assert dup["id"] != oid
        assert dup["name"] == "TEST_Focaccia Base (copia)"
        assert dup["category"] == "focaccia"
        assert dup["hydration"] == 75

        # GET verifies persistence
        r = client.get(f"{API}/recipes/{dup['id']}")
        assert r.status_code == 200
        assert r.json()["name"] == "TEST_Focaccia Base (copia)"

        # Original still present
        r = client.get(f"{API}/recipes/{oid}")
        assert r.status_code == 200

        # Cleanup
        client.delete(f"{API}/recipes/{oid}")
        client.delete(f"{API}/recipes/{dup['id']}")

    def test_duplicate_nonexistent_returns_404(self, client):
        r = client.post(f"{API}/recipes/nonexistent-id-xyz/duplicate")
        assert r.status_code == 404


# ---------------- Flours ----------------
class TestFlours:
    def test_flour_crud_and_scoping(self, client, token):
        # Create
        payload = {"name": "TEST_Caputo Cuoco", "brand": "Caputo", "w": 320, "protein": 13.0, "absorption": 60.0, "notes": "pizza napoletana"}
        r = client.post(f"{API}/flours", json=payload)
        assert r.status_code == 200, r.text
        flour = r.json()
        assert flour["name"] == payload["name"]
        assert flour["w"] == 320
        assert flour["protein"] == 13.0
        assert "id" in flour and "user_id" in flour
        fid = flour["id"]

        # List
        r = client.get(f"{API}/flours")
        assert r.status_code == 200
        assert any(f["id"] == fid for f in r.json())

        # Delete
        r = client.delete(f"{API}/flours/{fid}")
        assert r.status_code == 200

        # 404 after delete
        r = client.delete(f"{API}/flours/{fid}")
        assert r.status_code == 404

    def test_flour_scoping_other_user(self, client, token):
        # Create as user A
        r = client.post(f"{API}/flours", json={"name": "TEST_SoloA", "w": 280})
        assert r.status_code == 200
        fid = r.json()["id"]

        # Different user session
        mc = MongoClient(MONGO_URL)
        db = mc[DB_NAME]
        uid2 = f"test-user-b-{int(time.time())}"
        tok2 = f"test_session_b_{int(time.time())}"
        db.users.insert_one({"user_id": uid2, "email": f"qb.{int(time.time())}@example.com", "name": "QA B", "picture": None, "created_at": datetime.now(timezone.utc).isoformat()})
        db.user_sessions.insert_one({"user_id": uid2, "session_token": tok2, "expires_at": (datetime.now(timezone.utc)+timedelta(days=1)).isoformat(), "created_at": datetime.now(timezone.utc).isoformat()})
        try:
            s2 = requests.Session()
            s2.headers.update({"Authorization": f"Bearer {tok2}"})
            # B cannot see A's flour
            r = s2.get(f"{API}/flours")
            assert r.status_code == 200
            assert not any(f["id"] == fid for f in r.json())
            # B cannot delete A's flour
            r = s2.delete(f"{API}/flours/{fid}")
            assert r.status_code == 404
        finally:
            db.flour_archive.delete_many({"user_id": uid2})
            db.users.delete_one({"user_id": uid2})
            db.user_sessions.delete_one({"session_token": tok2})
            mc.close()

        # Cleanup A
        client.delete(f"{API}/flours/{fid}")


# ---------------- Recipe biga persistence ----------------
class TestRecipeBiga:
    def test_biga_fridge_recipe_persists(self, client):
        payload = {
            "name": "TEST_Teglia Biga Frigo",
            "category": "pizza_teglia",
            "description": "biga frigo 22h",
            "pieces": 1,
            "piece_weight": 1000,
            "hydration": 75,
            "salt": 2.5,
            "yeast": 0.0,
            "yeast_type": "fresco",
            "preferment_type": "biga",
            "preferment_flour_percent": 50,
            "biga_management": "frigo",
            "biga_fridge_hours": 22,
        }
        r = client.post(f"{API}/recipes", json=payload)
        assert r.status_code == 200, r.text
        rid = r.json()["id"]
        r = client.get(f"{API}/recipes/{rid}")
        assert r.status_code == 200
        d = r.json()
        assert d["preferment_type"] == "biga"
        assert d["biga_management"] == "frigo"
        assert d["biga_fridge_hours"] == 22
        client.delete(f"{API}/recipes/{rid}")

    def test_grams_mode_recipe_persists(self, client):
        payload = {
            "name": "TEST_Grams Mode",
            "category": "focaccia",
            "input_mode": "grams",
            "flour_g": 1000,
            "water_g": 700,
            "salt_g": 25,
            "yeast_g": 3,
            "pieces": 1,
            "piece_weight": 1728,
        }
        r = client.post(f"{API}/recipes", json=payload)
        assert r.status_code == 200, r.text
        rid = r.json()["id"]
        r = client.get(f"{API}/recipes/{rid}")
        assert r.status_code == 200
        d = r.json()
        assert d["input_mode"] == "grams"
        assert d["flour_g"] == 1000
        assert d["water_g"] == 700
        client.delete(f"{API}/recipes/{rid}")


# ---------------- Upload / Files ----------------
class TestUpload:
    def test_upload_and_download(self, token):
        # PNG 1x1
        png = bytes.fromhex(
            "89504E470D0A1A0A0000000D49484452000000010000000108060000001F15C4"
            "890000000A49444154789C63000100000500010D0A2DB40000000049454E44AE426082"
        )
        files = {"file": ("t.png", io.BytesIO(png), "image/png")}
        r = requests.post(f"{API}/upload", files=files, headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 200, r.text
        path = r.json()["path"]
        assert path

        r = requests.get(f"{API}/files/{path}", headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 200
        assert r.headers.get("content-type", "").startswith("image/")
        assert len(r.content) > 0


# ---------------- AI ----------------
class TestAI:
    def test_ai_suggest(self, client):
        payload = {
            "context": "Pizza tonda napoletana, 4 panetti da 250g, idratazione 65%, sale 2.5%, lievito 0.3%.",
            "question": "Quanto tempo di lievitazione TA a 24 gradi?",
        }
        r = client.post(f"{API}/ai/suggest", json=payload, timeout=90)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "suggestion" in data
        assert isinstance(data["suggestion"], str)
        assert len(data["suggestion"]) > 20
