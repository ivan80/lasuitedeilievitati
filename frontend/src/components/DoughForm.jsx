import React from "react";
import { Slider } from "./ui/slider";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { PREFERMENT_LABELS, YEAST_LABELS } from "../lib/categories";

const SliderField = ({ label, value, onChange, min, max, step, unit, testid }) => (
  <div>
    <div className="flex items-baseline justify-between mb-2">
      <Label className="text-clay text-sm">{label}</Label>
      <span className="font-body tabular-nums text-ink font-bold text-sm">
        {value}
        {unit}
      </span>
    </div>
    <Slider
      data-testid={testid}
      value={[Number(value)]}
      onValueChange={(v) => onChange(v[0])}
      min={min}
      max={max}
      step={step}
    />
  </div>
);

const NumField = ({ label, value, onChange, unit, testid, min = 0, step = 1 }) => (
  <div>
    <Label className="text-clay text-sm">{label}</Label>
    <div className="relative mt-1.5">
      <Input
        data-testid={testid}
        type="number"
        min={min}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-card border-line pr-10"
      />
      {unit && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-clay text-sm">{unit}</span>}
    </div>
  </div>
);

export const DoughForm = ({ params, setParams }) => {
  const up = (k, v) => setParams((p) => ({ ...p, [k]: v }));

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        <NumField label="Numero pezzi" value={params.pieces} onChange={(v) => up("pieces", Number(v))} testid="input-pieces" min={1} />
        <NumField label="Peso a pezzo" value={params.piece_weight} onChange={(v) => up("piece_weight", Number(v))} unit="g" testid="input-piece-weight" step={5} />
        <div className="col-span-2">
          <Label className="text-clay text-sm">Tipo di lievito</Label>
          <Select value={params.yeast_type} onValueChange={(v) => up("yeast_type", v)}>
            <SelectTrigger data-testid="select-yeast-type" className="mt-1.5 bg-card border-line">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(YEAST_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-x-10 gap-y-6">
        <SliderField label="Idratazione" value={params.hydration} onChange={(v) => up("hydration", v)} min={40} max={100} step={1} unit="%" testid="slider-hydration" />
        <SliderField label="Sale" value={params.salt} onChange={(v) => up("salt", v)} min={0} max={5} step={0.1} unit="%" testid="slider-salt" />
        <SliderField label="Lievito" value={params.yeast} onChange={(v) => up("yeast", v)} min={0} max={5} step={0.05} unit="%" testid="slider-yeast" />
        <SliderField label="Olio" value={params.oil} onChange={(v) => up("oil", v)} min={0} max={15} step={0.5} unit="%" testid="slider-oil" />
        <SliderField label="Zucchero" value={params.sugar} onChange={(v) => up("sugar", v)} min={0} max={30} step={0.5} unit="%" testid="slider-sugar" />
        <SliderField label="Malto" value={params.malt} onChange={(v) => up("malt", v)} min={0} max={5} step={0.1} unit="%" testid="slider-malt" />
      </div>

      <div className="grid md:grid-cols-2 gap-5 items-end">
        <div>
          <Label className="text-clay text-sm">Metodo / Preimpasto</Label>
          <Select value={params.preferment_type} onValueChange={(v) => up("preferment_type", v)}>
            <SelectTrigger data-testid="select-preferment" className="mt-1.5 bg-card border-line">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PREFERMENT_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {params.preferment_type !== "diretto" && (
          <SliderField
            label="% farina nel preimpasto"
            value={params.preferment_flour_percent}
            onChange={(v) => up("preferment_flour_percent", v)}
            min={0}
            max={params.preferment_type === "water_roux" ? 15 : 100}
            step={1}
            unit="%"
            testid="slider-preferment-flour"
          />
        )}
      </div>
    </div>
  );
};
