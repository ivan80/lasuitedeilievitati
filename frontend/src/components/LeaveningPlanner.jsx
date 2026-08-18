import React, { useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Plus, Trash, Snowflake, Thermometer, Clock } from "@phosphor-icons/react";
import { round } from "../lib/doughMath";

function fmt(date) {
  return date.toLocaleString("it-IT", { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export const LeaveningPlanner = ({ steps, setSteps, editable = true }) => {
  const now = new Date();
  const [start, setStart] = useState(
    new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
  );

  const update = (i, key, val) => setSteps((prev) => prev.map((s, idx) => (idx === i ? { ...s, [key]: val } : s)));
  const add = () => setSteps((p) => [...p, { label: "Nuova fase", location: "TA", temperature: 24, hours: 2 }]);
  const remove = (i) => setSteps((p) => p.filter((_, idx) => idx !== i));

  let cursor = new Date(start);
  const timeline = (steps || []).map((s) => {
    const from = new Date(cursor);
    cursor = new Date(cursor.getTime() + (Number(s.hours) || 0) * 3600000);
    return { ...s, from, to: new Date(cursor) };
  });
  const totalHours = (steps || []).reduce((sum, s) => sum + (Number(s.hours) || 0), 0);

  return (
    <div className="space-y-5" data-testid="leavening-planner">
      <div className="flex flex-col sm:flex-row sm:items-end gap-4">
        <div>
          <label className="text-clay text-sm">Inizio impasto</label>
          <Input
            data-testid="planner-start"
            type="datetime-local"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="mt-1.5 bg-card border-line"
          />
        </div>
        <div className="flex items-center gap-2 text-clay text-sm pb-2">
          <Clock size={18} className="text-crust" /> Durata totale: <span className="font-bold text-ink">{round(totalHours, 1)}h</span>
        </div>
      </div>

      <div className="relative pl-6">
        <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-line" />
        {timeline.map((s, i) => (
          <div key={i} className="relative pb-5">
            <div className={`absolute -left-[22px] top-1.5 w-4 h-4 rounded-full border-2 border-paper ${s.location === "Frigo" ? "bg-olive" : "bg-crust"}`} />
            {editable ? (
              <div className="grid grid-cols-12 gap-2 items-center bg-card border border-line rounded-2xl p-3">
                <Input
                  data-testid={`step-label-${i}`}
                  className="col-span-4 bg-transparent border-line h-9"
                  value={s.label}
                  onChange={(e) => update(i, "label", e.target.value)}
                  placeholder="Fase"
                />
                <div className="col-span-3">
                  <Select value={s.location} onValueChange={(v) => update(i, "location", v)}>
                    <SelectTrigger data-testid={`step-location-${i}`} className="h-9 bg-transparent border-line">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TA">TA (ambiente)</SelectItem>
                      <SelectItem value="Frigo">Frigo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 relative">
                  <Input
                    data-testid={`step-hours-${i}`}
                    type="number"
                    className="bg-transparent border-line h-9 pr-6"
                    value={s.hours}
                    onChange={(e) => update(i, "hours", Number(e.target.value))}
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-clay text-xs">h</span>
                </div>
                <div className="col-span-2 relative">
                  <Input
                    data-testid={`step-temp-${i}`}
                    type="number"
                    className="bg-transparent border-line h-9 pr-6"
                    value={s.temperature ?? ""}
                    onChange={(e) => update(i, "temperature", Number(e.target.value))}
                  />
                  <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-clay text-xs">°C</span>
                </div>
                <button data-testid={`step-remove-${i}`} onClick={() => remove(i)} className="col-span-1 text-clay hover:text-crust flex justify-center">
                  <Trash size={16} />
                </button>
                <p className="col-span-12 text-xs text-clay/80 pl-1">
                  {fmt(s.from)} → {fmt(s.to)}
                </p>
              </div>
            ) : (
              <div className="bg-card border border-line rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-ink flex items-center gap-2">
                    {s.location === "Frigo" ? <Snowflake size={16} className="text-olive" /> : <Thermometer size={16} className="text-crust" />}
                    {s.label}
                  </span>
                  <span className="text-sm text-clay">{s.hours}h · {s.location}{s.temperature ? ` · ${s.temperature}°C` : ""}</span>
                </div>
                <p className="text-xs text-clay/80 mt-1">{fmt(s.from)} → {fmt(s.to)}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {editable && (
        <Button data-testid="planner-add-step" onClick={add} variant="outline" className="border-line text-clay rounded-full">
          <Plus size={16} className="mr-1" /> Aggiungi fase
        </Button>
      )}
    </div>
  );
};
