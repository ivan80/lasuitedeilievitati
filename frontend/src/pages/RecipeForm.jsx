import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Layout } from "../components/Layout";
import { DoughForm } from "../components/DoughForm";
import { DoughBreakdown } from "../components/DoughBreakdown";
import { FlourBlend } from "../components/FlourBlend";
import { LeaveningPlanner } from "../components/LeaveningPlanner";
import { CATEGORIES } from "../lib/categories";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { toast } from "sonner";
import api from "../lib/api";
import { ArrowLeft, FloppyDisk, UploadSimple, Plus, Trash } from "@phosphor-icons/react";

const DEFAULTS = {
  name: "",
  category: "pizza_tonda",
  description: "",
  image_path: null,
  pieces: 4,
  piece_weight: 250,
  hydration: 65,
  salt: 2.5,
  yeast: 0.3,
  yeast_type: "fresco",
  oil: 0,
  sugar: 0,
  malt: 0,
  preferment_type: "diretto",
  preferment_flour_percent: 0,
  flours: [{ name: "", w: 260, percent: 100 }],
  ferment_steps: [{ label: "Puntata TA", location: "TA", temperature: 24, hours: 2 }],
  steps: [""],
  notes: "",
};

export default function RecipeForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [params, setParams] = useState(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imgPreview, setImgPreview] = useState(null);
  const fileRef = useRef();

  useEffect(() => {
    if (isEdit) {
      api.get(`/recipes/${id}`).then((r) => {
        const data = r.data;
        setParams({ ...DEFAULTS, ...data, flours: data.flours?.length ? data.flours : DEFAULTS.flours, steps: data.steps?.length ? data.steps : [""], ferment_steps: data.ferment_steps?.length ? data.ferment_steps : DEFAULTS.ferment_steps });
        if (data.image_path) {
          api.get(`/files/${data.image_path}`, { responseType: "blob" }).then((res) => setImgPreview(URL.createObjectURL(res.data))).catch(() => {});
        }
      }).catch(() => { toast.error("Ricetta non trovata"); navigate("/ricette"); });
    }
  }, [id]);

  const set = (k, v) => setParams((p) => ({ ...p, [k]: v }));
  const setFlours = (updater) => setParams((p) => ({ ...p, flours: typeof updater === "function" ? updater(p.flours) : updater }));
  const setFerment = (updater) => setParams((p) => ({ ...p, ferment_steps: typeof updater === "function" ? updater(p.ferment_steps) : updater }));

  const setStep = (i, v) => setParams((p) => ({ ...p, steps: p.steps.map((s, idx) => (idx === i ? v : s)) }));
  const addStep = () => setParams((p) => ({ ...p, steps: [...p.steps, ""] }));
  const removeStep = (i) => setParams((p) => ({ ...p, steps: p.steps.filter((_, idx) => idx !== i) }));

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      set("image_path", res.data.path);
      setImgPreview(URL.createObjectURL(file));
      toast.success("Foto caricata");
    } catch (e) {
      toast.error("Errore nel caricamento");
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!params.name.trim()) { toast.error("Inserisci il nome della ricetta"); return; }
    setSaving(true);
    const payload = { ...params, steps: params.steps.filter((s) => s.trim()), flours: params.flours.filter((f) => f.name || f.percent) };
    try {
      let res;
      if (isEdit) res = await api.put(`/recipes/${id}`, payload);
      else res = await api.post("/recipes", payload);
      toast.success(isEdit ? "Ricetta aggiornata" : "Ricetta salvata");
      navigate(`/ricette/${res.data.id}`);
    } catch (e) {
      toast.error("Errore nel salvataggio");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-clay hover:text-ink mb-6">
        <ArrowLeft size={18} /> Indietro
      </button>

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <h1 className="font-heading text-4xl sm:text-5xl tracking-tight text-ink">
          {isEdit ? "Modifica ricetta" : "Nuova ricetta"}
        </h1>
        <button
          data-testid="save-recipe-button"
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 bg-crust hover:bg-crustDark text-paper font-medium px-6 py-3 rounded-full transition-colors duration-300 disabled:opacity-60 self-start"
        >
          <FloppyDisk size={20} weight="fill" /> {saving ? "Salvataggio…" : "Salva ricetta"}
        </button>
      </div>

      <div className="grid lg:grid-cols-5 gap-8">
        {/* Left: form */}
        <div className="lg:col-span-3 space-y-8">
          {/* Anagrafica */}
          <div className="bg-card border border-line rounded-2xl p-6 space-y-5">
            <div>
              <Label className="text-clay text-sm">Nome ricetta</Label>
              <Input data-testid="input-name" value={params.name} onChange={(e) => set("name", e.target.value)} placeholder="Es. Napoletana canotto 24h" className="mt-1.5 bg-paper border-line" />
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <Label className="text-clay text-sm">Categoria</Label>
                <Select value={params.category} onValueChange={(v) => set("category", v)}>
                  <SelectTrigger data-testid="select-category" className="mt-1.5 bg-paper border-line"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-clay text-sm">Foto</Label>
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleUpload} data-testid="input-image" />
                <button
                  type="button"
                  data-testid="upload-image-button"
                  onClick={() => fileRef.current?.click()}
                  className="mt-1.5 w-full flex items-center justify-center gap-2 border border-line bg-paper hover:border-clay rounded-xl py-2 text-clay transition-colors"
                >
                  <UploadSimple size={18} /> {uploading ? "Caricamento…" : imgPreview ? "Cambia foto" : "Carica foto"}
                </button>
              </div>
            </div>
            {imgPreview && <img src={imgPreview} alt="anteprima" className="h-40 w-full object-cover rounded-xl border border-line" />}
            <div>
              <Label className="text-clay text-sm">Descrizione</Label>
              <Textarea data-testid="input-description" value={params.description} onChange={(e) => set("description", e.target.value)} placeholder="Breve descrizione della ricetta" className="mt-1.5 bg-paper border-line" rows={2} />
            </div>
          </div>

          {/* Calcolatori */}
          <Tabs defaultValue="impasto">
            <TabsList className="bg-sand">
              <TabsTrigger value="impasto" data-testid="tab-impasto">Impasto</TabsTrigger>
              <TabsTrigger value="farine" data-testid="tab-farine">Farine (W)</TabsTrigger>
              <TabsTrigger value="lievitazione" data-testid="tab-lievitazione">Lievitazione</TabsTrigger>
            </TabsList>
            <TabsContent value="impasto" className="pt-6">
              <DoughForm params={params} setParams={setParams} />
            </TabsContent>
            <TabsContent value="farine" className="pt-6">
              <FlourBlend flours={params.flours} setFlours={setFlours} />
            </TabsContent>
            <TabsContent value="lievitazione" className="pt-6">
              <LeaveningPlanner steps={params.ferment_steps} setSteps={setFerment} editable />
            </TabsContent>
          </Tabs>

          {/* Procedimento */}
          <div className="bg-card border border-line rounded-2xl p-6">
            <h4 className="font-heading text-2xl tracking-tight text-ink mb-4">Procedimento</h4>
            <div className="space-y-3">
              {params.steps.map((s, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <span className="shrink-0 w-7 h-7 mt-1 rounded-full bg-crust/10 text-crust font-bold flex items-center justify-center text-sm">{i + 1}</span>
                  <Textarea data-testid={`step-input-${i}`} value={s} onChange={(e) => setStep(i, e.target.value)} placeholder={`Passo ${i + 1}`} className="bg-paper border-line" rows={2} />
                  <button data-testid={`step-remove-btn-${i}`} onClick={() => removeStep(i)} className="text-clay hover:text-crust mt-2"><Trash size={18} /></button>
                </div>
              ))}
            </div>
            <button data-testid="add-step-button" onClick={addStep} className="mt-4 inline-flex items-center gap-1 text-crust hover:text-crustDark text-sm font-medium">
              <Plus size={16} /> Aggiungi passo
            </button>
          </div>

          <div className="bg-card border border-line rounded-2xl p-6">
            <Label className="text-clay text-sm">Note</Label>
            <Textarea data-testid="input-notes" value={params.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Consigli, temperatura forno, osservazioni…" className="mt-1.5 bg-paper border-line" rows={3} />
          </div>
        </div>

        {/* Right: live preview */}
        <div className="lg:col-span-2">
          <div className="sticky top-24">
            <h4 className="font-heading text-2xl tracking-tight text-ink mb-4">Anteprima dosi</h4>
            <DoughBreakdown params={params} />
          </div>
        </div>
      </div>
    </Layout>
  );
}
