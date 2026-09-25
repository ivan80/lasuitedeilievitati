import React from "react";
import { Slider } from "./ui/slider";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { PREFERMENT_LABELS, YEAST_LABELS } from "../lib/categories";
import { Info } from "@phosphor-icons/react";

const SliderField = ({ label, value, onChange, min, max, step, unit, testid }) => (
  <div>
    <div className="flex items-baseline justify-between mb-2">
      <Label className="text-clay text-sm">{label}</Label>
      <span className="font-body tabular-nums text-ink font-bold text-sm">
        {value}
        {unit}
      </span>
    </div>
    <Slider data-testid={testid} value={[Number(value)]} onValueChange={(v) => onChange(v[0])} min={min} max={max} step={step} />
  </div>
);

const NumField = ({ label, value, onChange, unit, testid, min = 0, step = 1, disabled }) => (
  <div>
    <Label className="text-clay text-sm">{label}</Label>
    <div className="relative mt-1.5">
      <Input
        data-testid={testid}
        type="number"
        min={min}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="bg-card border-line pr-10 disabled:opacity-60"
      />
      {unit && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-clay text-sm">{unit}</span>}
    </div>
  </div>
);

export const DoughForm = ({ params, setParams }) => {
  const up = (k, v) => setParams((p) => ({ ...p, [k]: v }));
  const mode = params.input_mode || "percent";
  const isBiga = params.preferment_type === "biga";

  return (
    <div className="space-y-8">
      {/* Input mode toggle */}
      <div className="inline-flex p-1 bg-sand rounded-full">
        <button
          data-testid="mode-percent"
          onClick={() => up("input_mode", "percent")}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${mode === "percent" ? "bg-ink text-paper" : "text-clay"}`}
        >
          Percentuali
        </button>
        <button
          data-testid="mode-grams"
          onClick={() => up("input_mode", "grams")}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${mode === "grams" ? "bg-ink text-paper" : "text-clay"}`}
        >
          Grammi totali
        </button>
      </div>

      {mode === "percent" ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            <NumField label="Numero pezzi" value={params.pieces} onChange={(v) => up("pieces", Number(v))} testid="input-pieces" min={1} />
            <NumField label="Peso a pezzo" value={params.piece_weight} onChange={(v) => up("piece_weight", Number(v))} unit="g" testid="input-piece-weight" step={5} />
            <div className="col-span-2">
              <Label className="text-clay text-sm">Tipo di lievito</Label>
              <Select value={params.yeast_type} onValueChange={(v) => up("yeast_type", v)}>
                <SelectTrigger data-testid="select-yeast-type" className="mt-1.5 bg-card border-line"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(YEAST_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-x-10 gap-y-6">
            <SliderField label="Idratazione" value={params.hydration} onChange={(v) => up("hydration", v)} min={40} max={100} step={1} unit="%" testid="slider-hydration" />
            <SliderField label="Sale" value={params.salt} onChange={(v) => up("salt", v)} min={0} max={5} step={0.1} unit="%" testid="slider-salt" />
            {!isBiga && <SliderField label="Lievito" value={params.yeast} onChange={(v) => up("yeast", v)} min={0} max={5} step={0.05} unit="%" testid="slider-yeast" />}
            <SliderField label="Olio" value={params.oil} onChange={(v) => up("oil", v)} min={0} max={15} step={0.5} unit="%" testid="slider-oil" />
            <SliderField label="Zucchero" value={params.sugar} onChange={(v) => up("sugar", v)} min={0} max={30} step={0.5} unit="%" testid="slider-sugar" />
            <SliderField label="Malto diastasico" value={params.malt} onChange={(v) => up("malt", v)} min={0} max={5} step={0.1} unit="%" testid="slider-malt" />
          </div>
        </>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          <NumField label="Farina totale" value={params.flour_g} onChange={(v) => up("flour_g", Number(v))} unit="g" testid="input-flour-g" step={10} />
          <NumField label="Acqua" value={params.water_g} onChange={(v) => up("water_g", Number(v))} unit="g" testid="input-water-g" step={10} />
          <NumField label="Sale" value={params.salt_g} onChange={(v) => up("salt_g", Number(v))} unit="g" testid="input-salt-g" step={1} />
          <NumField label="Lievito" value={params.yeast_g} onChange={(v) => up("yeast_g", Number(v))} unit="g" testid="input-yeast-g" step={0.5} disabled={isBiga} />
          <NumField label="Olio" value={params.oil_g} onChange={(v) => up("oil_g", Number(v))} unit="g" testid="input-oil-g" step={1} />
          <NumField label="Zucchero" value={params.sugar_g} onChange={(v) => up("sugar_g", Number(v))} unit="g" testid="input-sugar-g" step={1} />
          <NumField label="Malto" value={params.malt_g} onChange={(v) => up("malt_g", Number(v))} unit="g" testid="input-malt-g" step={0.5} disabled={isBiga} />
          <p className="col-span-2 md:col-span-4 text-sm text-clay flex items-start gap-2">
            <Info size={18} className="text-olive shrink-0 mt-0.5" />
            La "Farina totale" viene ripartita tra i vari tipi di farina nella scheda <span className="font-medium text-ink">Farine (W)</span>{isBiga ? ", divisa automaticamente tra biga e impasto finale." : "."}
          </p>
        </div>
      )}

      {/* Preferment */}
      <div className="grid md:grid-cols-2 gap-5 items-end">
        <div>
          <Label className="text-clay text-sm">Metodo / Preimpasto</Label>
          <Select value={params.preferment_type} onValueChange={(v) => up("preferment_type", v)}>
            <SelectTrigger data-testid="select-preferment" className="mt-1.5 bg-card border-line"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(PREFERMENT_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {params.preferment_type !== "diretto" && (
          <SliderField
            label={isBiga ? "% farina nella biga" : "% farina nel preimpasto"}
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

      {/* Biga management */}
      {isBiga && (
        <div className="bg-olive/10 border border-olive/30 rounded-2xl p-5 space-y-4" data-testid="biga-management">
          <div className="grid md:grid-cols-2 gap-5 items-end">
            <div>
              <Label className="text-clay text-sm">Gestione biga</Label>
              <Select value={params.biga_management} onValueChange={(v) => up("biga_management", v)}>
                <SelectTrigger data-testid="select-biga-management" className="mt-1.5 bg-card border-line"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ta">Temperatura ambiente 18°C (45% idr.)</SelectItem>
                  <SelectItem value="frigo">In frigo (60% idr.)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {params.biga_management === "frigo" && (
              <div>
                <Label className="text-clay text-sm">Ore in frigo</Label>
                <Select value={String(params.biga_fridge_hours)} onValueChange={(v) => up("biga_fridge_hours", Number(v))}>
                  <SelectTrigger data-testid="select-biga-hours" className="mt-1.5 bg-card border-line"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[18, 19, 20, 21, 22, 23, 24].map((h) => <SelectItem key={h} value={String(h)}>{h} ore</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <p className="text-sm text-clay flex items-start gap-2">
            <Info size={18} className="text-olive shrink-0 mt-0.5" />
            {params.biga_management === "frigo"
              ? `Biga al 60% di idratazione, 1% di lievito fresco sulla farina della biga. Dopo l'impasto: 1 ora a TA, poi ${params.biga_fridge_hours} ore in frigo. Aggiunto 0,5% di malto diastasico (consigliato).`
              : "Biga al 45% di idratazione, 1% di lievito fresco sulla farina della biga, ~18 ore a 18°C. Aggiunto 0,5% di malto diastasico (consigliato)."}
          </p>
        </div>
      )}
    </div>
  );
};
