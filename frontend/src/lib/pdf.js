import { jsPDF } from "jspdf";
import { computeDough, computeBlend, computeFlourGrams, round } from "./doughMath";
import { CATEGORY_MAP, PREFERMENT_LABELS, YEAST_LABELS } from "./categories";

const CRUST = [194, 83, 59];
const INK = [28, 25, 23];
const CLAY = [87, 83, 78];

export function exportRecipePdf(recipe) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 48;
  let y = margin;

  const d = computeDough(recipe);
  const { wAvg } = computeBlend(recipe.flours);

  const line = (gap = 16) => {
    y += gap;
    if (y > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      y = margin;
    }
  };

  // Header band
  doc.setFillColor(...CRUST);
  doc.rect(0, 0, pageW, 8, "F");

  doc.setTextColor(...CRUST);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text((CATEGORY_MAP[recipe.category]?.label || recipe.category || "").toUpperCase(), margin, y);
  line(24);

  doc.setTextColor(...INK);
  doc.setFont("times", "bold");
  doc.setFontSize(30);
  doc.text(recipe.name || "Ricetta", margin, y);
  line(20);

  if (recipe.description) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(...CLAY);
    const desc = doc.splitTextToSize(recipe.description, pageW - margin * 2);
    doc.text(desc, margin, y);
    line(14 * desc.length + 8);
  }

  // Meta
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...CLAY);
  const meta = `${PREFERMENT_LABELS[recipe.preferment_type]}  •  Idratazione ${round(d.hydrationPct, 0)}%  •  ${recipe.pieces} × ${round(recipe.piece_weight, 0)}g${wAvg ? `  •  W ${wAvg}` : ""}`;
  doc.text(meta, margin, y);
  line(28);

  const section = (title) => {
    doc.setFont("times", "bold");
    doc.setFontSize(16);
    doc.setTextColor(...INK);
    doc.text(title, margin, y);
    line(6);
    doc.setDrawColor(230, 228, 221);
    doc.line(margin, y, pageW - margin, y);
    line(18);
  };

  const row = (label, value) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(...CLAY);
    doc.text(label, margin, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...INK);
    doc.text(value, pageW - margin, y, { align: "right" });
    line(18);
  };

  // Ingredients
  section("Ricetta finale");
  row("Farina", `${round(d.flour, 1)} g`);
  row(`Acqua (${round(d.hydrationPct, 0)}%)`, `${round(d.water, 1)} g`);
  row(`Sale (${round(d.saltPct, 1)}%)`, `${round(d.salt, 1)} g`);
  row(`${YEAST_LABELS[recipe.yeast_type] || "Lievito"} (${round(d.yeastPct, 2)}%)`, `${round(d.yeast, 2)} g`);
  if (d.oil > 0) row(`Olio (${round(d.oilPct, 1)}%)`, `${round(d.oil, 1)} g`);
  if (d.sugar > 0) row(`Zucchero (${round(d.sugarPct, 1)}%)`, `${round(d.sugar, 1)} g`);
  if (d.malt > 0) row(`Malto diastasico (${round(d.maltPct, 2)}%)`, `${round(d.malt, 1)} g`);

  if (d.preferment) {
    line(10);
    const bigaNote = d.isBiga ? (d.bigaManagement === "frigo" ? ` · 1h TA + ${d.bigaFridgeHours}h frigo` : " · ~18h a 18°C") : "";
    section(`Preimpasto · ${PREFERMENT_LABELS[d.preferment.type]} (${round(d.preferment.hydration, 0)}%${bigaNote})`);
    row("Farina", `${round(d.preferment.flour, 1)} g`);
    row("Acqua", `${round(d.preferment.water, 1)} g`);
    if (d.preferment.yeast > 0) row("Lievito fresco (1%)", `${round(d.preferment.yeast, 2)} g`);
    line(6);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.setTextColor(...CLAY);
    doc.text("Impasto finale (da aggiungere):", margin, y);
    line(16);
    row("Farina", `${round(d.preferment.final.flour, 1)} g`);
    row("Acqua", `${round(d.preferment.final.water, 1)} g`);
    if (d.preferment.final.yeast > 0) row("Lievito", `${round(d.preferment.final.yeast, 2)} g`);
  }

  const flours = (recipe.flours || []).filter((f) => f.name || f.percent);
  if (flours.length) {
    line(10);
    section(`Mix di farine · W ${wAvg}`);
    const grams = computeFlourGrams(recipe);
    const isBiga = recipe.preferment_type === "biga";
    (recipe.flours || []).forEach((f, i) => {
      if (!f.name && !f.percent) return;
      const tag = isBiga ? (f.use === "biga" ? " [biga]" : " [impasto]") : "";
      row(`${f.name || "Farina"}${tag}`, `W ${f.w || "—"} · ${f.percent}% · ${round(grams[i] || 0, 0)} g`);
    });
  }

  const steps = (recipe.ferment_steps || []);
  if (steps.length) {
    line(10);
    section("Lievitazione");
    steps.forEach((s) => row(`${s.label} (${s.location})`, `${s.hours}h${s.temperature ? ` · ${s.temperature}°C` : ""}`));
  }

  const proc = (recipe.steps || []).filter(Boolean);
  if (proc.length) {
    line(10);
    section("Procedimento");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    proc.forEach((s, i) => {
      doc.setTextColor(...CRUST);
      doc.setFont("helvetica", "bold");
      doc.text(`${i + 1}.`, margin, y);
      doc.setTextColor(...CLAY);
      doc.setFont("helvetica", "normal");
      const txt = doc.splitTextToSize(s, pageW - margin * 2 - 20);
      doc.text(txt, margin + 20, y);
      line(14 * txt.length + 6);
    });
  }

  if (recipe.notes) {
    line(10);
    section("Note");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(...CLAY);
    const n = doc.splitTextToSize(recipe.notes, pageW - margin * 2);
    doc.text(n, margin, y);
  }

  const safe = (recipe.name || "ricetta").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  doc.save(`${safe}.pdf`);
}
