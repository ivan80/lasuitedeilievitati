import React, { useState } from "react";
import api from "../lib/api";
import { Sparkle, PaperPlaneRight } from "@phosphor-icons/react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { computeDough, round } from "../lib/doughMath";
import { PREFERMENT_LABELS, YEAST_LABELS, CATEGORY_MAP } from "../lib/categories";

function buildContext(params) {
  const d = computeDough(params);
  const cat = CATEGORY_MAP[params.category]?.label || params.category || "n/d";
  const flours = (params.flours || []).filter((f) => f.percent > 0).map((f) => `${f.name || "farina"} W${f.w || "?"} (${f.percent}%)`).join(", ") || "n/d";
  const ferment = (params.ferment_steps || []).map((s) => `${s.label || "fase"}: ${s.hours}h ${s.location}${s.temperature ? " " + s.temperature + "°C" : ""}`).join("; ") || "n/d";
  return [
    `Categoria: ${cat}`,
    `Pezzi: ${params.pieces} x ${round(params.piece_weight, 0)}g (impasto totale ${round(d.totalDough, 0)}g)`,
    `Idratazione: ${params.hydration}%`,
    `Sale: ${params.salt}%`,
    `Lievito: ${params.yeast}% (${YEAST_LABELS[params.yeast_type] || params.yeast_type})`,
    `Olio: ${params.oil}% | Zucchero: ${params.sugar}% | Malto: ${params.malt}%`,
    `Metodo: ${PREFERMENT_LABELS[params.preferment_type]}${params.preferment_type !== "diretto" ? ` (${params.preferment_flour_percent}% farina nel preimpasto)` : ""}`,
    `Farine: ${flours}`,
    `Lievitazione: ${ferment}`,
    `Farina calcolata: ${round(d.flour, 0)}g, acqua ${round(d.water, 0)}g`,
  ].join("\n");
}

export const AISuggest = ({ params }) => {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState("");

  const ask = async (q) => {
    setLoading(true);
    setAnswer("");
    try {
      const res = await api.post("/ai/suggest", { context: buildContext(params), question: q });
      setAnswer(res.data.suggestion);
    } catch (e) {
      setAnswer("⚠️ Il consulente AI non è disponibile al momento. Riprova tra poco.");
    } finally {
      setLoading(false);
    }
  };

  const quick = [
    "Consigli generali su questo impasto",
    "Come regolo i tempi di lievitazione TA/frigo?",
    "L'idratazione è corretta per questa preparazione?",
  ];

  return (
    <div className="bg-espresso text-paper rounded-3xl p-6 md:p-8" data-testid="ai-suggest">
      <div className="flex items-center gap-2 mb-4">
        <Sparkle size={22} weight="fill" className="text-crust" />
        <h4 className="font-heading text-2xl tracking-tight">Consulente AI</h4>
      </div>
      <p className="text-paper/60 text-sm mb-5">
        Consigli professionali su idratazione, forza farina, tempi e correzioni. Basato sui parametri correnti.
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        {quick.map((q) => (
          <button
            key={q}
            data-testid={`ai-quick-${q.slice(0, 8)}`}
            onClick={() => ask(q)}
            disabled={loading}
            className="text-xs px-3 py-1.5 rounded-full bg-paper/10 hover:bg-paper/20 transition-colors duration-200 disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          data-testid="ai-question-input"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && question.trim() && ask(question)}
          placeholder="Fai una domanda al maestro…"
          className="bg-paper/10 border-paper/20 text-paper placeholder:text-paper/40"
        />
        <Button
          data-testid="ai-ask-button"
          onClick={() => question.trim() && ask(question)}
          disabled={loading}
          className="bg-crust hover:bg-crustDark text-paper rounded-xl shrink-0"
        >
          <PaperPlaneRight size={18} weight="fill" />
        </Button>
      </div>

      {loading && (
        <div className="mt-5 flex items-center gap-3 text-paper/70">
          <div className="w-5 h-5 border-2 border-paper/30 border-t-crust rounded-full animate-spin" />
          Sto ragionando sul tuo impasto…
        </div>
      )}
      {answer && !loading && (
        <div data-testid="ai-answer" className="mt-5 bg-paper/5 border border-paper/10 rounded-2xl p-5 whitespace-pre-wrap text-sm leading-relaxed text-paper/90">
          {answer}
        </div>
      )}
    </div>
  );
};
