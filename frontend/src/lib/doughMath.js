// Baker's percentages engine. Flour = 100%. Supports percent & grams input modes,
// biga management (TA 45% vs Frigo 60%, 1% fresh yeast on biga flour, +0.5% diastatic malt).

const num = (v) => Number(v) || 0;

export function bigaHydrationFor(management) {
  return management === "frigo" ? 60 : 45;
}

export function computeDough(p) {
  const gramsMode = p.input_mode === "grams";
  const type = p.preferment_type || "diretto";
  const prefFlourPct = num(p.preferment_flour_percent);
  const isBiga = type === "biga";
  const prefHydration = isBiga
    ? bigaHydrationFor(p.biga_management)
    : type === "poolish"
    ? 100
    : type === "water_roux"
    ? 500
    : 0;

  let flour, hydration, salt, yeast, oil, sugar, malt, totalDough;

  if (gramsMode) {
    flour = num(p.flour_g);
    const pct = (g) => (flour ? (num(g) / flour) * 100 : 0);
    hydration = pct(p.water_g);
    salt = pct(p.salt_g);
    oil = pct(p.oil_g);
    sugar = pct(p.sugar_g);
    yeast = isBiga ? prefFlourPct * 0.01 : pct(p.yeast_g);
    malt = isBiga ? Math.max(pct(p.malt_g), 0.5) : pct(p.malt_g);
    totalDough = flour + (flour * (hydration + salt + yeast + oil + sugar + malt)) / 100;
  } else {
    hydration = num(p.hydration);
    salt = num(p.salt);
    oil = num(p.oil);
    sugar = num(p.sugar);
    yeast = isBiga ? prefFlourPct * 0.01 : num(p.yeast);
    malt = isBiga ? Math.max(num(p.malt), 0.5) : num(p.malt);
    totalDough = (num(p.pieces) || 1) * num(p.piece_weight);
    const sumPct = 100 + hydration + salt + yeast + oil + sugar + malt;
    flour = sumPct > 0 ? (totalDough * 100) / sumPct : 0;
  }

  const g = (pct) => (flour * pct) / 100;
  const base = {
    totalDough,
    flour,
    water: g(hydration),
    salt: g(salt),
    yeast: g(yeast),
    oil: g(oil),
    sugar: g(sugar),
    malt: g(malt),
    hydrationPct: hydration,
    saltPct: salt,
    yeastPct: yeast,
    maltPct: malt,
    oilPct: oil,
    sugarPct: sugar,
    isBiga,
    bigaManagement: p.biga_management || "ta",
    bigaFridgeHours: num(p.biga_fridge_hours) || 20,
  };

  let preferment = null;
  if (type !== "diretto" && prefFlourPct > 0) {
    const prefFlour = (flour * prefFlourPct) / 100;
    let prefWater = 0;
    let prefYeast = 0;
    if (isBiga) {
      prefWater = (prefFlour * prefHydration) / 100;
      prefYeast = (prefFlour * 1) / 100; // 1% lievito fresco sulla farina della biga
    } else if (type === "poolish") {
      prefWater = prefFlour;
      prefYeast = base.yeast;
    } else if (type === "water_roux") {
      prefWater = prefFlour * 5;
    }
    preferment = {
      type,
      hydration: prefHydration,
      flour: prefFlour,
      water: prefWater,
      yeast: prefYeast,
      final: {
        flour: flour - prefFlour,
        water: Math.max(0, base.water - prefWater),
        yeast: Math.max(0, base.yeast - prefYeast),
      },
    };
  }

  return { ...base, preferment };
}

export function computeBlend(flours) {
  const valid = (flours || []).filter((f) => Number(f.percent) > 0);
  const totalPct = valid.reduce((s, f) => s + Number(f.percent), 0);
  const wAvg =
    totalPct > 0
      ? valid.reduce((s, f) => s + Number(f.w || 0) * Number(f.percent), 0) / totalPct
      : 0;
  return { wAvg: Math.round(wAvg), totalPct };
}

export function suggestFermentation(w) {
  if (!w) return "Inserisci il valore W delle farine per un suggerimento sui tempi.";
  if (w < 220) return "Farina debole (W<220): 4-6 ore a TA (23-25°C). Ideale per lievitazioni brevi e biscotteria.";
  if (w < 260) return "W 220-260: 8-12 ore complessive. Ottima per pizza tonda diretta e focaccia.";
  if (w < 300) return "W 260-300: 12-24 ore, anche con maturazione in frigo. Perfetta per teglia e alta idratazione.";
  if (w < 350) return "W 300-350: 24-48 ore con lunga maturazione in frigo (4°C). Pizza contemporanea e teglia.";
  return "Farina forte (W≥350): 48-72 ore in frigo. Indicata per grandi lievitati e lunghissime maturazioni.";
}

// Suggested biga fermentation schedule as ferment steps
export function bigaSchedule(management, fridgeHours) {
  if (management === "frigo") {
    return [
      { label: "Biga · 1h a TA", location: "TA", temperature: 20, hours: 1 },
      { label: "Biga · maturazione frigo", location: "Frigo", temperature: 4, hours: Number(fridgeHours) || 20 },
    ];
  }
  return [{ label: "Biga · 18°C", location: "TA", temperature: 18, hours: 18 }];
}

export function computeFlourGrams(params) {
  const list = params.flours || [];
  const dough = computeDough(params);
  const grams = {};
  const split = (idxs, total) => {
    const pctSum = idxs.reduce((s, i) => s + Number(list[i].percent || 0), 0);
    idxs.forEach((i) => {
      grams[i] = pctSum > 0 ? (total * Number(list[i].percent || 0)) / pctSum : 0;
    });
  };
  if (params.preferment_type === "biga") {
    const bigaIdx = list.map((f, i) => (f.use === "biga" ? i : -1)).filter((i) => i >= 0);
    const impIdx = list.map((f, i) => (f.use !== "biga" ? i : -1)).filter((i) => i >= 0);
    split(bigaIdx, dough.preferment ? dough.preferment.flour : 0);
    split(impIdx, dough.preferment ? dough.preferment.final.flour : dough.flour);
  } else {
    split(list.map((_, i) => i), dough.flour);
  }
  return grams;
}

export function round(n, d = 1) {
  const f = Math.pow(10, d);
  return Math.round((Number(n) || 0) * f) / f;
}
