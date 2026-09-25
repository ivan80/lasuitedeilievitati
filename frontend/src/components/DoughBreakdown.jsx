import React from "react";
import { computeDough, round } from "../lib/doughMath";
import { PREFERMENT_LABELS, YEAST_LABELS } from "../lib/categories";

const Row = ({ label, value, unit = "g", strong }) => (
  <div className={`flex items-baseline justify-between py-2.5 border-b border-line/70 ${strong ? "font-bold text-ink" : ""}`}>
    <span className={strong ? "text-ink" : "text-clay"}>{label}</span>
    <span className="font-body tabular-nums text-ink">
      {round(value, 1)} <span className="text-clay text-xs">{unit}</span>
    </span>
  </div>
);

export const DoughBreakdown = ({ params }) => {
  const d = computeDough(params);
  const pref = d.preferment;

  return (
    <div className="space-y-6" data-testid="dough-breakdown">
      <div className="bg-card border border-line rounded-2xl p-6">
        <div className="flex items-baseline justify-between mb-4">
          <h4 className="font-heading text-2xl tracking-tight text-ink">Ricetta finale</h4>
          <span className="text-sm text-clay">Impasto totale {round(d.totalDough, 0)}g</span>
        </div>
        <Row label="Farina" value={d.flour} strong />
        <Row label={`Acqua (${round(d.hydrationPct, 0)}%)`} value={d.water} />
        <Row label={`Sale (${round(d.saltPct, 1)}%)`} value={d.salt} />
        <Row label={`${YEAST_LABELS[params.yeast_type] || "Lievito"} (${round(d.yeastPct, 2)}%)`} value={d.yeast} />
        {d.oil > 0 && <Row label={`Olio (${round(d.oilPct, 1)}%)`} value={d.oil} />}
        {d.sugar > 0 && <Row label={`Zucchero (${round(d.sugarPct, 1)}%)`} value={d.sugar} />}
        {d.malt > 0 && <Row label={`Malto diastasico (${round(d.maltPct, 2)}%)`} value={d.malt} />}
      </div>

      {pref && (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-olive/10 border border-olive/30 rounded-2xl p-6">
            <h5 className="font-heading text-xl tracking-tight text-ink mb-1">
              Preimpasto · {PREFERMENT_LABELS[pref.type]}
            </h5>
            <p className="text-xs text-clay mb-3">
              Idratazione {round(pref.hydration, 0)}%
              {d.isBiga && (d.bigaManagement === "frigo" ? ` · frigo ${d.bigaFridgeHours}h (dopo 1h TA)` : " · ~18h a 18°C")}
            </p>
            <Row label="Farina" value={pref.flour} />
            <Row label="Acqua" value={pref.water} />
            {pref.yeast > 0 && <Row label="Lievito fresco (1%)" value={pref.yeast} />}
          </div>
          <div className="bg-crust/5 border border-crust/20 rounded-2xl p-6">
            <h5 className="font-heading text-xl tracking-tight text-ink mb-1">Impasto finale</h5>
            <p className="text-xs text-clay mb-3">Da aggiungere al preimpasto</p>
            <Row label="Farina" value={pref.final.flour} />
            <Row label="Acqua" value={pref.final.water} />
            {pref.final.yeast > 0 && <Row label="Lievito" value={pref.final.yeast} />}
            {d.malt > 0 && <Row label="Malto diastasico" value={d.malt} />}
          </div>
        </div>
      )}
    </div>
  );
};
