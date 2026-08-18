import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Layout } from "../components/Layout";
import { RecipeCard } from "../components/RecipeCard";
import { CATEGORIES } from "../lib/categories";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";
import { Plus, Calculator, ArrowRight } from "@phosphor-icons/react";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/recipes").then((r) => setRecipes(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const counts = recipes.reduce((acc, r) => {
    acc[r.category] = (acc[r.category] || 0) + 1;
    return acc;
  }, {});

  const firstName = user?.name?.split(" ")[0] || "";

  return (
    <Layout>
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-espresso text-paper p-8 md:p-14 mb-12">
        <img
          src="https://images.unsplash.com/photo-1537734796389-e1fc293cf856?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAxODF8MHwxfHNlYXJjaHwzfHxiYWtlciUyMGtuZWFkaW5nJTIwZG91Z2h8ZW58MHx8fHwxNzg3MDkxNzI1fDA&ixlib=rb-4.1.0&q=85"
          alt=""
          className="absolute right-0 top-0 h-full w-1/2 object-cover opacity-40 hidden md:block"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-espresso via-espresso/90 to-transparent" />
        <div className="relative max-w-xl">
          <p className="text-crust font-medium tracking-widest uppercase text-sm mb-3">Ciao {firstName}</p>
          <h1 className="font-heading tracking-tight text-4xl sm:text-5xl lg:text-6xl leading-[0.95]">
            Il tuo laboratorio,<br />sempre in tasca.
          </h1>
          <div className="flex flex-wrap gap-3 mt-8">
            <button
              data-testid="dashboard-new-recipe"
              onClick={() => navigate("/ricette/nuova")}
              className="inline-flex items-center gap-2 bg-crust hover:bg-crustDark text-paper font-medium px-6 py-3 rounded-full transition-colors duration-300"
            >
              <Plus size={20} weight="bold" /> Nuova ricetta
            </button>
            <button
              data-testid="dashboard-open-calculator"
              onClick={() => navigate("/calcolatore")}
              className="inline-flex items-center gap-2 bg-paper/10 hover:bg-paper/20 text-paper font-medium px-6 py-3 rounded-full transition-colors duration-300"
            >
              <Calculator size={20} /> Calcolatore
            </button>
          </div>
        </div>
      </section>

      {/* Categories */}
      <div className="flex items-baseline justify-between mb-6">
        <h2 className="font-heading text-3xl tracking-tight text-ink">Categorie</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-14">
        {CATEGORIES.map((c, i) => (
          <motion.button
            key={c.id}
            data-testid={`category-${c.id}`}
            onClick={() => navigate(`/ricette?categoria=${c.id}`)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="group relative h-40 rounded-3xl overflow-hidden border border-line text-left"
          >
            <img src={c.image} alt={c.label} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            <div className="absolute inset-0 bg-gradient-to-t from-espresso/85 via-espresso/20 to-transparent" />
            <div className="absolute bottom-0 p-4 text-paper">
              <p className="font-heading text-2xl tracking-tight leading-tight">{c.label}</p>
              <p className="text-paper/70 text-xs mt-0.5">{counts[c.id] || 0} ricette</p>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Recent recipes */}
      <div className="flex items-baseline justify-between mb-6">
        <h2 className="font-heading text-3xl tracking-tight text-ink">Ricette recenti</h2>
        {recipes.length > 0 && (
          <button data-testid="dashboard-see-all" onClick={() => navigate("/ricette")} className="text-crust hover:text-crustDark text-sm font-medium flex items-center gap-1">
            Vedi tutte <ArrowRight size={16} />
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-clay">Caricamento…</p>
      ) : recipes.length === 0 ? (
        <div className="bg-card border border-dashed border-line rounded-3xl p-12 text-center">
          <p className="font-heading text-3xl tracking-tight text-ink mb-2">Nessuna ricetta ancora</p>
          <p className="text-clay mb-6">Crea la tua prima ricetta o parti dal calcolatore.</p>
          <button
            data-testid="empty-new-recipe"
            onClick={() => navigate("/ricette/nuova")}
            className="inline-flex items-center gap-2 bg-crust hover:bg-crustDark text-paper font-medium px-6 py-3 rounded-full transition-colors duration-300"
          >
            <Plus size={20} weight="bold" /> Crea ricetta
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.slice(0, 6).map((r, i) => (
            <RecipeCard key={r.id} recipe={r} index={i} />
          ))}
        </div>
      )}
    </Layout>
  );
}
