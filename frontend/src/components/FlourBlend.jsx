import React, { useState } from "react";
import { computeBlend, suggestFermentation } from "../lib/doughMath";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Plus, Trash, Gauge } from "@phosphor-icons/react";
import { Badge } from "./ui/badge";

export const FlourBlend = ({ flours, setFlours }) => {
  const { wAvg, totalPct } = computeBlend(flours);

  const update = (i, key, val) => {
    setFlours((prev) => prev.map((f, idx) => (idx === i ? { ...f, [key]: val } : f)));
  };
  const add = () => setFlours((p) => [...p, { name: "", w: 260, percent: 0 }]);
  const remove = (i) => setFlours((p) => p.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-5" data-testid="flour-blend">
      <div className="space-y-3">
        {(flours || []).map((f, i) => (
          <div key={i} className="grid grid-cols-12 gap-3 items-center">
            <Input
              data-testid={`flour-name-${i}`}
              className="col-span-5 bg-card border-line"
              placeholder="Nome farina (es. Caputo Nuvola)"
              value={f.name}
              onChange={(e) => update(i, "name", e.target.value)}
            />
            <div className="col-span-3 relative">
              <Input
                data-testid={`flour-w-${i}`}
                type="number"
                className="bg-card border-line pl-7"
                placeholder="W"
                value={f.w ?? ""}
                onChange={(e) => update(i, "w", Number(e.target.value))}
              />
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-clay text-sm">W</span>
            </div>
            <div className="col-span-3 relative">
              <Input
                data-testid={`flour-percent-${i}`}
                type="number"
                className="bg-card border-line pr-7"
                placeholder="%"
                value={f.percent ?? ""}
                onChange={(e) => update(i, "percent", Number(e.target.value))}
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-clay text-sm">%</span>
            </div>
            <button
              data-testid={`flour-remove-${i}`}
              onClick={() => remove(i)}
              className="col-span-1 text-clay hover:text-crust transition-colors"
            >
              <Trash size={18} />
            </button>
          </div>
        ))}
      </div>

      <Button data-testid="flour-add-button" onClick={add} variant="outline" className="border-line text-clay rounded-full">
        <Plus size={16} className="mr-1" /> Aggiungi farina
      </Button>

      <div className="bg-card border border-line rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-crust/10 flex items-center justify-center">
            <Gauge size={28} weight="duotone" className="text-crust" />
          </div>
          <div>
            <p className="text-clay text-sm">Forza media del mix</p>
            <p className="font-heading text-4xl tracking-tight text-ink">
              W {wAvg || "—"}
            </p>
          </div>
        </div>
        <div className="flex-1">
          {totalPct !== 100 && totalPct > 0 && (
            <Badge className="bg-crust/10 text-crust hover:bg-crust/10 mb-2">
              Somma percentuali: {totalPct}% (dovrebbe essere 100%)
            </Badge>
          )}
          <p className="text-clay text-sm leading-relaxed">{suggestFermentation(wAvg)}</p>
        </div>
      </div>
    </div>
  );
};
