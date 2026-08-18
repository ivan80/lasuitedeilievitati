import React, { useState } from "react";
import { Layout } from "../components/Layout";
import { DoughForm } from "../components/DoughForm";
import { DoughBreakdown } from "../components/DoughBreakdown";
import { FlourBlend } from "../components/FlourBlend";
import { LeaveningPlanner } from "../components/LeaveningPlanner";
import { AISuggest } from "../components/AISuggest";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Label } from "../components/ui/label";
import { CATEGORIES } from "../lib/categories";

const DEFAULTS = {
  category: "pizza_tonda",
  pieces: 4,
  piece_weight: 250,
  hydration: 65,
  salt: 2.5,
  yeast: 0.3,
  yeast_type: "fresco",
  oil: 0,
  sugar: 0,
  malt: 0,
  preferment_type: "diretto",
  preferment_flour_percent: 0,
  flours: [{ name: "", w: 260, percent: 100 }],
  ferment_steps: [
    { label: "Puntata TA", location: "TA", temperature: 24, hours: 2 },
    { label: "Maturazione frigo", location: "Frigo", temperature: 4, hours: 24 },
    { label: "Appretto TA", location: "TA", temperature: 24, hours: 4 },
  ],
};

export default function Calculator() {
  const [params, setParams] = useState(DEFAULTS);
  const setFlours = (u) => setParams((p) => ({ ...p, flours: typeof u === "function" ? u(p.flours) : u }));
  const setFerment = (u) => setParams((p) => ({ ...p, ferment_steps: typeof u === "function" ? u(p.ferment_steps) : u }));

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl tracking-tight text-ink">Calcolatore professionale</h1>
        <p className="text-clay mt-2 max-w-2xl">
          Dosi in percentuale del panificatore, preimpasti (biga, poolish, water roux), forza delle farine e
          pianificazione della lievitazione. Con consulente AI integrato.
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 space-y-8">
          <div className="flex items-center gap-3">
            <Label className="text-clay text-sm shrink-0">Preparazione</Label>
            <Select value={params.category} onValueChange={(v) => setParams((p) => ({ ...p, category: v }))}>
              <SelectTrigger data-testid="calc-category" className="bg-card border-line max-w-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <Tabs defaultValue="impasto">
            <TabsList className="bg-sand">
              <TabsTrigger value="impasto" data-testid="calc-tab-impasto">Impasto</TabsTrigger>
              <TabsTrigger value="farine" data-testid="calc-tab-farine">Farine (W)</TabsTrigger>
              <TabsTrigger value="lievitazione" data-testid="calc-tab-lievitazione">Lievitazione</TabsTrigger>
            </TabsList>
            <TabsContent value="impasto" className="pt-6"><DoughForm params={params} setParams={setParams} /></TabsContent>
            <TabsContent value="farine" className="pt-6"><FlourBlend flours={params.flours} setFlours={setFlours} /></TabsContent>
            <TabsContent value="lievitazione" className="pt-6"><LeaveningPlanner steps={params.ferment_steps} setSteps={setFerment} editable /></TabsContent>
          </Tabs>

          <AISuggest params={params} />
        </div>

        <div className="lg:col-span-2">
          <div className="sticky top-24">
            <h4 className="font-heading text-2xl tracking-tight text-ink mb-4">Dosi calcolate</h4>
            <DoughBreakdown params={params} />
          </div>
        </div>
      </div>
    </Layout>
  );
}
