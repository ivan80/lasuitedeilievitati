import React, { useEffect, useState } from "react";
import { computeBlend, computeDough, suggestFermentation, round } from "../lib/doughMath";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Plus, Trash, Gauge, Archive } from "@phosphor-icons/react";
import { Badge } from "./ui/badge";
import api from "../lib/api";

const FlourRow = ({ f, i, grams, update, remove, archive }) => (
  <div className="grid grid-cols-12 gap-2 items-center">
    <div className="col-span-4">
      <Input
        data-testid={`flour-name-${i}`}
        className="bg-card border-line"
        placeholder="Nome farina"
        value={f.name}
        onChange={(e) => update(i, "name", e.target.value)}
      />
    </div>
    <div className="col-span-2 relative">
      <Input data-testid={`flour-w-${i}`} type="number" className="bg-card border-line pl-6" placeholder="W" value={f.w ?? ""} onChange={(e) => update(i, "w", Number(e.target.value))} />
      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-clay text-xs">W</span>
    </div>
    <div className="col-span-2 relative">
      <Input data-testid={`flour-percent-${i}`} type="number" className="bg-card border-line pr-6" placeholder="%" value={f.percent ?? ""} onChange={(e) => update(i, "percent", Number(e.target.value))} />
      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-clay text-xs">%</span>
    </div>
    <div className="col-span-2 flex items-center">
      <span data-testid={`flour-grams-${i}`} className="font-body tabular-nums text-ink text-sm font-medium">
        {grams > 0 ? `${round(grams, 0)}g` : "—"}
      </span>
    </div>
    <div className="col-span-1">
      {archive.length > 0 && (
        <Select
          value=""
          onValueChange={(id) => {
            const a = archive.find((x) => x.id === id);
            if (a) {
              update(i, "name", a.brand ? `${a.brand} ${a.name}` : a.name);
              if (a.w) update(i, "w", a.w);
            }
          }}
        >
          <SelectTrigger data-testid={`flour-archive-${i}`} className="bg-card border-line text-clay h-9 px-2">
            <Archive size={16} />
          </SelectTrigger>
          <SelectContent>
            {archive.map((a) => (
              <SelectItem key={a.id} value={a.id}>{a.brand ? `${a.brand} ${a.name}` : a.name} {a.w ? `(W${a.w})` : ""}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
    <button data-testid={`flour-remove-${i}`} onClick={() => remove(i)} className="col-span-1 text-clay hover:text-crust transition-colors flex justify-center">
      <Trash size={18} />
    </button>
  </div>
);

const Group = ({ title, subtitle, items, indices, gramsMap, update, remove, add, archive }) => {
  const { wAvg, totalPct } = computeBlend(items);
  const groupGrams = indices.reduce((s, idx) => s + (gramsMap[idx] || 0), 0);
  return (
    <div className="space-y-3">
      {title && (
        <div className="flex items-baseline justify-between">
          <div>
            <p className="font-medium text-ink text-sm">{title}</p>
            {subtitle && <p className="text-xs text-clay">{subtitle}</p>}
          </div>
          {groupGrams > 0 && <span className="text-xs text-clay">Tot. {round(groupGrams, 0)}g</span>}
        </div>
      )}
      <div className="grid grid-cols-12 gap-2 px-1 text-[11px] uppercase tracking-wide text-clay/60">
        <span className="col-span-4">Farina</span>
        <span className="col-span-2">Forza</span>
        <span className="col-span-2">Quota</span>
        <span className="col-span-2">Grammi</span>
        <span className="col-span-2" />
      </div>
      {indices.map((idx, k) => (
        <FlourRow key={idx} f={items[k]} i={idx} grams={gramsMap[idx] || 0} update={update} remove={remove} archive={archive} />
      ))}
      <div className="flex items-center justify-between">
        <Button data-testid={`flour-add-${title || "single"}`} onClick={add} variant="outline" className="border-line text-clay rounded-full h-8 text-xs">
          <Plus size={14} className="mr-1" /> Aggiungi farina
        </Button>
        <div className="flex items-center gap-2 text-sm">
          {totalPct !== 100 && totalPct > 0 && <span className="text-crust text-xs">Σ {totalPct}%</span>}
          <span className="text-clay">W medio</span>
          <span className="font-heading text-2xl tracking-tight text-ink">{wAvg || "—"}</span>
        </div>
      </div>
    </div>
  );
};

export const FlourBlend = ({ flours, setFlours, bigaMode = false, params = {} }) => {
  const [archive, setArchive] = useState([]);

  useEffect(() => {
    api.get("/flours").then((r) => setArchive(r.data)).catch(() => {});
  }, []);

  const list = flours || [];
  const dough = computeDough(params);
  const update = (i, key, val) => setFlours((prev) => prev.map((f, idx) => (idx === i ? { ...f, [key]: val } : f)));
  const remove = (i) => setFlours((prev) => prev.filter((_, idx) => idx !== i));
  const addWithUse = (use) => setFlours((prev) => [...prev, { name: "", w: 260, percent: 0, use }]);
  const { wAvg } = computeBlend(list);

  // grams per flour index, split by group and by percent within the group
  const gramsMap = {};
  const splitGroup = (idxs, flourTotal) => {
    const pctSum = idxs.reduce((s, i) => s + Number(list[i].percent || 0), 0);
    idxs.forEach((i) => {
      gramsMap[i] = pctSum > 0 ? (flourTotal * Number(list[i].percent || 0)) / pctSum : 0;
    });
  };

  if (!bigaMode) {
    const idxs = list.map((_, i) => i);
    splitGroup(idxs, dough.flour);
    return (
      <div className="space-y-5" data-testid="flour-blend">
        <Group title="Farine" subtitle="Le quote suddividono la farina totale" items={list} indices={idxs} gramsMap={gramsMap} update={update} remove={remove} add={() => addWithUse("impasto")} archive={archive} />
        <div className="bg-card border border-line rounded-2xl p-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-crust/10 flex items-center justify-center">
            <Gauge size={28} weight="duotone" className="text-crust" />
          </div>
          <p className="text-clay text-sm leading-relaxed flex-1">{suggestFermentation(wAvg)}</p>
        </div>
      </div>
    );
  }

  const bigaIdx = list.map((f, i) => (f.use === "biga" ? i : -1)).filter((i) => i >= 0);
  const impIdx = list.map((f, i) => (f.use !== "biga" ? i : -1)).filter((i) => i >= 0);
  const bigaFlourTotal = dough.preferment ? dough.preferment.flour : 0;
  const finalFlourTotal = dough.preferment ? dough.preferment.final.flour : dough.flour;
  splitGroup(bigaIdx, bigaFlourTotal);
  splitGroup(impIdx, finalFlourTotal);

  return (
    <div className="space-y-6" data-testid="flour-blend">
      <div className="bg-olive/10 border border-olive/30 rounded-2xl p-5">
        <Group
          title="Farine per la biga"
          subtitle={`${round(bigaFlourTotal, 0)}g di farina nella biga`}
          items={bigaIdx.map((i) => list[i])}
          indices={bigaIdx}
          gramsMap={gramsMap}
          update={update}
          remove={remove}
          add={() => addWithUse("biga")}
          archive={archive}
        />
      </div>
      <div className="bg-crust/5 border border-crust/20 rounded-2xl p-5">
        <Group
          title="Farine per l'impasto finale (rinfresco)"
          subtitle={`${round(finalFlourTotal, 0)}g di farina nel rinfresco`}
          items={impIdx.map((i) => list[i])}
          indices={impIdx}
          gramsMap={gramsMap}
          update={update}
          remove={remove}
          add={() => addWithUse("impasto")}
          archive={archive}
        />
      </div>
      <Badge className="bg-crust/10 text-crust hover:bg-crust/10">{suggestFermentation(wAvg)}</Badge>
    </div>
  );
};
