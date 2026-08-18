// Baker's percentages engine. Flour = 100%.

export function computeDough(p) {
  const pieces = Number(p.pieces) || 1;
  const pieceWeight = Number(p.piece_weight) || 0;
  const hydration = Number(p.hydration) || 0;
  const salt = Number(p.salt) || 0;
  const yeast = Number(p.yeast) || 0;
  const oil = Number(p.oil) || 0;
  const sugar = Number(p.sugar) || 0;
  const malt = Number(p.malt) || 0;

  const totalDough = pieces * pieceWeight;
  const sumPct = 100 + hydration + salt + yeast + oil + sugar + malt;
  const flour = sumPct > 0 ? (totalDough * 100) / sumPct : 0;

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
  };

  // Preferment breakdown
  const type = p.preferment_type || "diretto";
  const prefFlourPct = Number(p.preferment_flour_percent) || 0;
  let preferment = null;

  if (type !== "diretto" && prefFlourPct > 0) {
    const prefFlour = (flour * prefFlourPct) / 100;
    let prefWater = 0;
    let prefHydration = 0;
    let prefYeast = 0;
    if (type === "biga") {
      prefHydration = 45;
      prefWater = (prefFlour * 45) / 100;
      prefYeast = base.yeast; // solitamente tutto il lievito nella biga
    } else if (type === "poolish") {
      prefHydration = 100;
      prefWater = prefFlour; // 1:1
      prefYeast = base.yeast;
    } else if (type === "water_roux") {
      prefHydration = 500;
      prefWater = prefFlour * 5; // 1:5, cotto a 65°C
      prefYeast = 0;
    }
    const finalFlour = flour - prefFlour;
    const finalWater = base.water - prefWater;
    const finalYeast = base.yeast - prefYeast;
    preferment = {
      type,
      hydration: prefHydration,
      flour: prefFlour,
      water: prefWater,
      yeast: prefYeast,
      final: {
        flour: finalFlour,
        water: finalWater > 0 ? finalWater : 0,
        yeast: finalYeast > 0 ? finalYeast : 0,
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

export function round(n, d = 1) {
  const f = Math.pow(10, d);
  return Math.round((Number(n) || 0) * f) / f;
}
