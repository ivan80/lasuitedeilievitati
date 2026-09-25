import React, { useEffect, useState } from "react";
import { computeBlend, suggestFermentation } from "../lib/doughMath";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Plus, Trash, Gauge, Archive } from "@phosphor-icons/react";
import { Badge } from "./ui/badge";
import api from "../lib/api";

const FlourRow = ({ f, i, update, remove, archive }) => (
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
    <div className="col-span-3">
      {archive.length > 0 ? (
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
          <SelectTrigger data-testid={`flour-archive-${i}`} className="bg-card border-line text-clay text-xs h-9">
            <Archive size={14} className="mr-1" />
            <SelectValue placeholder="Archivio" />
          </SelectTrigger>
          <SelectContent>
            {archive.map((a) => (
              <SelectItem key={a.id} value={a.id}>{a.brand ? `${a.brand} ${a.name}` : a.name} {a.w ? `(W${a.w})` : ""}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <span className="text-xs text-clay/60">—</span>
      )}
    </div>
    <button data-testid={`flour-remove-${i}`} onClick={() => remove(i)} className="col-span-1 text-clay hover:text-crust transition-colors flex justify-center">
      <Trash size={18} />
    </button>
  </div>
);

const Group = ({ title, items, indices, update, remove, add, archive }) => {
  const { wAvg, totalPct } = computeBlend(items);
  return (
    <div className="space-y-3">
      {title && <p className="font-medium text-ink text-sm">{title}</p>}
      {indices.map((idx, k) => (
        <FlourRow key={idx} f={items[k]} i={idx} update={update} remove={remove} archive={archive} />
      ))}
      <div className="flex items-center justify-between">
        <Button data-testid={`flour-add-${title || "single"}`} onClick={add} variant="outline" className="border-line text-clay rounded-full h-8 text-xs">
          <Plus size={14} className="mr-1" /> Aggiungi
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

export const FlourBlend = ({ flours, setFlours, bigaMode = false }) => {
  const [archive, setArchive] = useState([]);

  useEffect(() => {
    api.get("/flours").then((r) => setArchive(r.data)).catch(() => {});
  }, []);

  const list = flours || [];
  const update = (i, key, val) => setFlours((prev) => prev.map((f, idx) => (idx === i ? { ...f, [key]: val } : f)));
  const remove = (i) => setFlours((prev) => prev.filter((_, idx) => idx !== i));
  const addWithUse = (use) => setFlours((prev) => [...prev, { name: "", w: 260, percent: 0, use }]);

  const { wAvg } = computeBlend(list);

  if (!bigaMode) {
    return (
      <div className="space-y-5" data-testid="flour-blend">
        <Group
          title=""
          items={list}
          indices={list.map((_, i) => i)}
          update={update}
          remove={remove}
          add={() => addWithUse("impasto")}
          archive={archive}
        />
        <div className="bg-card border border-line rounded-2xl p-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-crust/10 flex items-center justify-center">
            <Gauge size={28} weight="duotone" className="text-crust" />
          </div>
          <p className="text-clay text-sm leading-relaxed flex-1">{suggestFermentation(wAvg)}</p>
        </div>
      </div>
    );
  }

  const bigaItems = list.filter((f) => f.use === "biga");
  const bigaIdx = list.map((f, i) => (f.use === "biga" ? i : -1)).filter((i) => i >= 0);
  const impItems = list.filter((f) => f.use !== "biga");
  const impIdx = list.map((f, i) => (f.use !== "biga" ? i : -1)).filter((i) => i >= 0);

  return (
    <div className="space-y-6" data-testid="flour-blend">
      <div className="bg-olive/10 border border-olive/30 rounded-2xl p-5">
        <Group title="Farine per la biga" items={bigaItems} indices={bigaIdx} update={update} remove={remove} add={() => addWithUse("biga")} archive={archive} />
      </div>
      <div className="bg-crust/5 border border-crust/20 rounded-2xl p-5">
        <Group title="Farine per l'impasto finale" items={impItems} indices={impIdx} update={update} remove={remove} add={() => addWithUse("impasto")} archive={archive} />
      </div>
      <Badge className="bg-crust/10 text-crust hover:bg-crust/10">{suggestFermentation(wAvg)}</Badge>
    </div>
  );
};
