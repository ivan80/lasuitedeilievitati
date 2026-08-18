import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Layout } from "../components/Layout";
import { RecipeCard } from "../components/RecipeCard";
import { CATEGORIES } from "../lib/categories";
import api from "../lib/api";
import { Plus } from "@phosphor-icons/react";

export default function Recipes() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const active = searchParams.get("categoria") || "tutte";
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = active !== "tutte" ? { category: active } : {};
    api.get("/recipes", { params }).then((r) => setRecipes(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [active]);

  const setFilter = (id) => {
    if (id === "tutte") setSearchParams({});
    else setSearchParams({ categoria: id });
  };

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-4xl sm:text-5xl tracking-tight text-ink">Ricettario</h1>
          <p className="text-clay mt-1">{recipes.length} ricette</p>
        </div>
        <button
          data-testid="recipes-new-button"
          onClick={() => navigate("/ricette/nuova")}
          className="inline-flex items-center gap-2 bg-crust hover:bg-crustDark text-paper font-medium px-6 py-3 rounded-full transition-colors duration-300 self-start"
        >
          <Plus size={20} weight="bold" /> Nuova ricetta
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-10">
        {[{ id: "tutte", label: "Tutte" }, ...CATEGORIES].map((c) => (
          <button
            key={c.id}
            data-testid={`filter-${c.id}`}
            onClick={() => setFilter(c.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 border ${
              active === c.id ? "bg-ink text-paper border-ink" : "bg-card text-clay border-line hover:border-clay"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-clay">Caricamento…</p>
      ) : recipes.length === 0 ? (
        <div className="bg-card border border-dashed border-line rounded-3xl p-12 text-center">
          <p className="font-heading text-3xl tracking-tight text-ink mb-2">Nessuna ricetta in questa categoria</p>
          <button
            onClick={() => navigate("/ricette/nuova")}
            className="mt-4 inline-flex items-center gap-2 bg-crust hover:bg-crustDark text-paper font-medium px-6 py-3 rounded-full transition-colors duration-300"
          >
            <Plus size={20} weight="bold" /> Crea ricetta
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((r, i) => (
            <RecipeCard key={r.id} recipe={r} index={i} />
          ))}
        </div>
      )}
    </Layout>
  );
}
