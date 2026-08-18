import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CATEGORY_MAP, PREFERMENT_LABELS } from "../lib/categories";
import { computeDough, round } from "../lib/doughMath";
import { Drop, Barbell, Timer } from "@phosphor-icons/react";
import { API } from "../lib/api";

export const RecipeCard = ({ recipe, index = 0 }) => {
  const navigate = useNavigate();
  const cat = CATEGORY_MAP[recipe.category];
  const dough = computeDough(recipe);
  const totalHours = (recipe.ferment_steps || []).reduce((s, f) => s + (Number(f.hours) || 0), 0);
  const [imgSrc, setImgSrc] = useState(cat?.image);

  useEffect(() => {
    let url;
    if (recipe.image_path) {
      import("../lib/api").then(({ default: api }) => {
        api
          .get(`/files/${recipe.image_path}`, { responseType: "blob" })
          .then((res) => {
            url = URL.createObjectURL(res.data);
            setImgSrc(url);
          })
          .catch(() => {});
      });
    }
    return () => url && URL.revokeObjectURL(url);
  }, [recipe.image_path]);

  return (
    <motion.button
      data-testid={`recipe-card-${recipe.id}`}
      onClick={() => navigate(`/ricette/${recipe.id}`)}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      className="group text-left bg-card border border-line rounded-3xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-[transform,box-shadow] duration-300"
    >
      <div className="relative h-44 overflow-hidden">
        <img
          src={imgSrc}
          alt={recipe.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-espresso/50 to-transparent" />
        <span className="absolute top-3 left-3 text-xs font-medium px-3 py-1 rounded-full bg-paper/90 text-ink">
          {cat?.label || recipe.category}
        </span>
      </div>
      <div className="p-5">
        <h3 className="font-heading text-2xl tracking-tight text-ink leading-tight">{recipe.name}</h3>
        <p className="text-clay text-sm mt-1">{PREFERMENT_LABELS[recipe.preferment_type]}</p>
        <div className="flex flex-wrap gap-3 mt-4 text-sm text-clay">
          <span className="flex items-center gap-1.5"><Drop size={16} className="text-crust" /> {round(recipe.hydration, 0)}% idr.</span>
          <span className="flex items-center gap-1.5"><Barbell size={16} className="text-crust" /> {recipe.pieces}×{round(recipe.piece_weight, 0)}g</span>
          {totalHours > 0 && (
            <span className="flex items-center gap-1.5"><Timer size={16} className="text-crust" /> {round(totalHours, 0)}h</span>
          )}
        </div>
        <p className="text-xs text-clay/70 mt-3">Farina totale ≈ {round(dough.flour, 0)}g</p>
      </div>
    </motion.button>
  );
};
