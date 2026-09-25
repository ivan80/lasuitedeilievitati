import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Layout } from "../components/Layout";
import { DoughBreakdown } from "../components/DoughBreakdown";
import { LeaveningPlanner } from "../components/LeaveningPlanner";
import { AISuggest } from "../components/AISuggest";
import { TimersPanel } from "../components/TimersPanel";
import { CATEGORY_MAP, PREFERMENT_LABELS } from "../lib/categories";
import { computeBlend, computeDough, computeFlourGrams, round } from "../lib/doughMath";
import { exportRecipePdf } from "../lib/pdf";
import api from "../lib/api";
import { toast } from "sonner";
import { PencilSimple, Printer, Trash, ArrowLeft, Gauge, Copy, FilePdf } from "@phosphor-icons/react";
import { Badge } from "../components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "../components/ui/alert-dialog";

export default function RecipeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState(null);
  const [imgSrc, setImgSrc] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/recipes/${id}`).then((r) => setRecipe(r.data)).catch(() => { toast.error("Ricetta non trovata"); navigate("/ricette"); }).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    let url;
    if (recipe?.image_path) {
      api.get(`/files/${recipe.image_path}`, { responseType: "blob" }).then((res) => {
        url = URL.createObjectURL(res.data);
        setImgSrc(url);
      }).catch(() => {});
    }
    return () => url && URL.revokeObjectURL(url);
  }, [recipe?.image_path]);

  const handleDelete = async () => {
    await api.delete(`/recipes/${id}`);
    toast.success("Ricetta eliminata");
    navigate("/ricette");
  };

  const handleDuplicate = async () => {
    try {
      const res = await api.post(`/recipes/${id}/duplicate`);
      toast.success("Ricetta duplicata");
      navigate(`/ricette/${res.data.id}`);
    } catch (e) {
      toast.error("Errore nella duplicazione");
    }
  };

  if (loading || !recipe) {
    return <Layout><p className="text-clay">Caricamento…</p></Layout>;
  }

  const cat = CATEGORY_MAP[recipe.category];
  const { wAvg } = computeBlend(recipe.flours);
  const dough = computeDough(recipe);
  const validFlours = (recipe.flours || []).filter((f) => f.name || f.percent);

  return (
    <Layout>
      <button data-testid="back-button" onClick={() => navigate("/ricette")} className="flex items-center gap-2 text-clay hover:text-ink mb-6 print:hidden">
        <ArrowLeft size={18} /> Torna al ricettario
      </button>

      {/* Header */}
      <div className="grid lg:grid-cols-5 gap-8 mb-10" id="print-area">
        <div className="lg:col-span-3">
          <Badge className="bg-crust/10 text-crust hover:bg-crust/10 mb-3">{cat?.label || recipe.category}</Badge>
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl tracking-tight text-ink leading-[0.95]">{recipe.name}</h1>
          {recipe.description && <p className="text-clay mt-4 text-lg leading-relaxed">{recipe.description}</p>}
          <div className="flex flex-wrap gap-2 mt-5">
            <Badge variant="outline" className="border-line text-clay">{PREFERMENT_LABELS[recipe.preferment_type]}</Badge>
            <Badge variant="outline" className="border-line text-clay">Idratazione {round(dough.hydrationPct, 0)}%</Badge>
            {wAvg > 0 && <Badge variant="outline" className="border-line text-clay flex items-center gap-1"><Gauge size={14} /> W {wAvg}</Badge>}
          </div>

          <div className="flex flex-wrap gap-3 mt-7 print:hidden">
            <button data-testid="edit-recipe-button" onClick={() => navigate(`/ricette/${id}/modifica`)} className="inline-flex items-center gap-2 bg-ink hover:bg-espresso text-paper font-medium px-5 py-2.5 rounded-full transition-colors duration-300">
              <PencilSimple size={18} /> Modifica
            </button>
            <button data-testid="print-recipe-button" onClick={() => window.print()} className="inline-flex items-center gap-2 bg-card border border-line hover:border-clay text-ink font-medium px-5 py-2.5 rounded-full transition-colors duration-300">
              <Printer size={18} /> Stampa
            </button>
            <button data-testid="export-pdf-button" onClick={() => exportRecipePdf(recipe)} className="inline-flex items-center gap-2 bg-card border border-line hover:border-clay text-ink font-medium px-5 py-2.5 rounded-full transition-colors duration-300">
              <FilePdf size={18} /> Esporta PDF
            </button>
            <button data-testid="duplicate-recipe-button" onClick={handleDuplicate} className="inline-flex items-center gap-2 bg-card border border-line hover:border-clay text-ink font-medium px-5 py-2.5 rounded-full transition-colors duration-300">
              <Copy size={18} /> Duplica
            </button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button data-testid="delete-recipe-button" className="inline-flex items-center gap-2 text-crust hover:bg-crust/10 font-medium px-5 py-2.5 rounded-full transition-colors duration-300">
                  <Trash size={18} /> Elimina
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Eliminare questa ricetta?</AlertDialogTitle>
                  <AlertDialogDescription>L'azione è irreversibile.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annulla</AlertDialogCancel>
                  <AlertDialogAction data-testid="confirm-delete-button" onClick={handleDelete} className="bg-crust hover:bg-crustDark">Elimina</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        <div className="lg:col-span-2">
          <div className="h-64 rounded-3xl overflow-hidden border border-line">
            <img src={imgSrc || cat?.image} alt={recipe.name} className="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 space-y-8">
          <DoughBreakdown params={recipe} />

          {validFlours.length > 0 && (
            <div className="bg-card border border-line rounded-2xl p-6">
              <h4 className="font-heading text-2xl tracking-tight text-ink mb-4">Mix di farine · W {wAvg}</h4>
              <div className="space-y-2">
                {(() => {
                  const grams = computeFlourGrams(recipe);
                  const isBiga = recipe.preferment_type === "biga";
                  return (recipe.flours || []).map((f, i) => {
                    if (!f.name && !f.percent) return null;
                    return (
                      <div key={i} className="flex items-center justify-between py-1.5 border-b border-line/60 text-sm">
                        <span className="text-ink flex items-center gap-2">
                          {f.name || "Farina"}
                          {isBiga && (
                            <span className={`text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded ${f.use === "biga" ? "bg-olive/20 text-olive" : "bg-crust/10 text-crust"}`}>
                              {f.use === "biga" ? "biga" : "impasto"}
                            </span>
                          )}
                        </span>
                        <span className="text-clay tabular-nums">
                          W {f.w || "—"} · {f.percent}% · <span className="font-medium text-ink">{round(grams[i] || 0, 0)}g</span>
                        </span>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}

          {(recipe.steps || []).filter(Boolean).length > 0 && (
            <div className="bg-card border border-line rounded-2xl p-6">
              <h4 className="font-heading text-2xl tracking-tight text-ink mb-4">Procedimento</h4>
              <ol className="space-y-4">
                {recipe.steps.filter(Boolean).map((s, i) => (
                  <li key={i} className="flex gap-4">
                    <span className="shrink-0 w-8 h-8 rounded-full bg-crust/10 text-crust font-bold flex items-center justify-center text-sm">{i + 1}</span>
                    <p className="text-clay leading-relaxed pt-1">{s}</p>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {recipe.notes && (
            <div className="bg-sand border border-line rounded-2xl p-6">
              <h4 className="font-heading text-xl tracking-tight text-ink mb-2">Note</h4>
              <p className="text-clay leading-relaxed whitespace-pre-wrap">{recipe.notes}</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-8 print:hidden">
          {(recipe.ferment_steps || []).length > 0 && (
            <TimersPanel recipeId={recipe.id} steps={recipe.ferment_steps} />
          )}
          {(recipe.ferment_steps || []).length > 0 && (
            <div>
              <h4 className="font-heading text-2xl tracking-tight text-ink mb-4">Programma lievitazione</h4>
              <LeaveningPlanner steps={recipe.ferment_steps} setSteps={() => {}} editable={false} />
            </div>
          )}
          <AISuggest params={recipe} />
        </div>
      </div>
    </Layout>
  );
}
