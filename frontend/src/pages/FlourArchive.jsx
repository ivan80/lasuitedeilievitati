import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Layout } from "../components/Layout";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import api, { API } from "../lib/api";
import { toast } from "sonner";
import { Flask, Plus, Trash, FileArrowDown, UploadSimple, Gauge } from "@phosphor-icons/react";

const EMPTY = { name: "", brand: "", w: "", protein: "", absorption: "", notes: "", datasheet_path: null };

export default function FlourArchive() {
  const [flours, setFlours] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const load = () => api.get("/flours").then((r) => setFlours(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      set("datasheet_path", res.data.path);
      toast.success("Scheda tecnica caricata");
    } catch (e) {
      toast.error("Errore nel caricamento");
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!form.name.trim()) { toast.error("Inserisci il nome della farina"); return; }
    setSaving(true);
    try {
      await api.post("/flours", {
        name: form.name,
        brand: form.brand,
        w: form.w ? Number(form.w) : null,
        protein: form.protein ? Number(form.protein) : null,
        absorption: form.absorption ? Number(form.absorption) : null,
        notes: form.notes,
        datasheet_path: form.datasheet_path,
      });
      toast.success("Farina salvata in archivio");
      setForm(EMPTY);
      if (fileRef.current) fileRef.current.value = "";
      load();
    } catch (e) {
      toast.error("Errore nel salvataggio");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    await api.delete(`/flours/${id}`);
    toast.success("Farina rimossa");
    load();
  };

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl tracking-tight text-ink">Archivio farine</h1>
        <p className="text-clay mt-2 max-w-2xl">
          Salva le schede tecniche delle tue farine (W, proteine, assorbimento) per richiamarle al volo nei calcoli e nelle ricette.
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-8">
        {/* Form */}
        <div className="lg:col-span-2">
          <div className="sticky top-24 bg-card border border-line rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Flask size={22} weight="duotone" className="text-crust" />
              <h3 className="font-heading text-2xl tracking-tight text-ink">Nuova farina</h3>
            </div>
            <div>
              <Label className="text-clay text-sm">Nome</Label>
              <Input data-testid="flour-form-name" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Es. Nuvola" className="mt-1.5 bg-paper border-line" />
            </div>
            <div>
              <Label className="text-clay text-sm">Marca / Molino</Label>
              <Input data-testid="flour-form-brand" value={form.brand} onChange={(e) => set("brand", e.target.value)} placeholder="Es. Caputo" className="mt-1.5 bg-paper border-line" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-clay text-sm">W</Label>
                <Input data-testid="flour-form-w" type="number" value={form.w} onChange={(e) => set("w", e.target.value)} placeholder="300" className="mt-1.5 bg-paper border-line" />
              </div>
              <div>
                <Label className="text-clay text-sm">Prot. %</Label>
                <Input data-testid="flour-form-protein" type="number" value={form.protein} onChange={(e) => set("protein", e.target.value)} placeholder="13" className="mt-1.5 bg-paper border-line" />
              </div>
              <div>
                <Label className="text-clay text-sm">Assorb. %</Label>
                <Input data-testid="flour-form-absorption" type="number" value={form.absorption} onChange={(e) => set("absorption", e.target.value)} placeholder="60" className="mt-1.5 bg-paper border-line" />
              </div>
            </div>
            <div>
              <Label className="text-clay text-sm">Note</Label>
              <Textarea data-testid="flour-form-notes" value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Utilizzo consigliato, maturazione…" className="mt-1.5 bg-paper border-line" rows={2} />
            </div>
            <div>
              <Label className="text-clay text-sm">Scheda tecnica (PDF/immagine)</Label>
              <input ref={fileRef} type="file" accept="image/*,application/pdf" hidden onChange={handleUpload} data-testid="flour-form-file" />
              <button
                type="button"
                data-testid="flour-form-upload"
                onClick={() => fileRef.current?.click()}
                className="mt-1.5 w-full flex items-center justify-center gap-2 border border-line bg-paper hover:border-clay rounded-xl py-2 text-clay transition-colors"
              >
                <UploadSimple size={18} /> {uploading ? "Caricamento…" : form.datasheet_path ? "File caricato ✓" : "Carica scheda"}
              </button>
            </div>
            <Button data-testid="flour-form-save" onClick={save} disabled={saving} className="w-full bg-crust hover:bg-crustDark text-paper rounded-full">
              <Plus size={18} className="mr-1" /> {saving ? "Salvataggio…" : "Aggiungi all'archivio"}
            </Button>
          </div>
        </div>

        {/* List */}
        <div className="lg:col-span-3">
          {flours.length === 0 ? (
            <div className="bg-card border border-dashed border-line rounded-3xl p-12 text-center">
              <p className="font-heading text-3xl tracking-tight text-ink mb-2">Archivio vuoto</p>
              <p className="text-clay">Aggiungi la prima farina per richiamarla nei calcoli.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4" data-testid="flour-list">
              {flours.map((f, i) => (
                <motion.div
                  key={f.id}
                  data-testid={`flour-item-${f.id}`}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-card border border-line rounded-2xl p-5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-heading text-2xl tracking-tight text-ink leading-tight">{f.name}</h4>
                      {f.brand && <p className="text-clay text-sm">{f.brand}</p>}
                    </div>
                    <button data-testid={`flour-delete-${f.id}`} onClick={() => remove(f.id)} className="text-clay hover:text-crust transition-colors">
                      <Trash size={18} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {f.w != null && <Badge className="bg-crust/10 text-crust hover:bg-crust/10 flex items-center gap-1"><Gauge size={13} /> W {f.w}</Badge>}
                    {f.protein != null && <Badge variant="outline" className="border-line text-clay">Prot. {f.protein}%</Badge>}
                    {f.absorption != null && <Badge variant="outline" className="border-line text-clay">Assorb. {f.absorption}%</Badge>}
                  </div>
                  {f.notes && <p className="text-clay text-sm mt-3 leading-relaxed">{f.notes}</p>}
                  {f.datasheet_path && (
                    <a
                      data-testid={`flour-datasheet-${f.id}`}
                      href={`${API}/files/${f.datasheet_path}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 mt-4 text-crust hover:text-crustDark text-sm font-medium"
                    >
                      <FileArrowDown size={16} /> Scheda tecnica
                    </a>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
