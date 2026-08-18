import React, { useEffect, useRef, useState } from "react";
import { Play, Pause, ArrowCounterClockwise, Bell, Snowflake, Thermometer } from "@phosphor-icons/react";
import { toast } from "sonner";

function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.type = "sine";
    o.frequency.value = 880;
    g.gain.setValueAtTime(0.001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.05);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
    o.start();
    o.stop(ctx.currentTime + 1.3);
  } catch (e) {}
}

function fmt(sec) {
  if (sec < 0) sec = 0;
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const PhaseTimer = ({ recipeId, index, step }) => {
  const key = `timer:${recipeId}:${index}`;
  const total = (Number(step.hours) || 0) * 3600;
  const load = () => {
    try {
      return JSON.parse(localStorage.getItem(key));
    } catch (e) {
      return null;
    }
  };
  const [state, setState] = useState(load); // {mode:'running',endAt} | {mode:'paused',remaining} | null
  const firedRef = useRef(false);

  let remaining;
  if (state?.mode === "running") remaining = Math.max(0, Math.round((state.endAt - Date.now()) / 1000));
  else if (state?.mode === "paused") remaining = state.remaining;
  else remaining = total;

  const running = state?.mode === "running" && remaining > 0;
  const paused = state?.mode === "paused";
  const done = state?.mode === "running" && remaining === 0;
  const pct = total > 0 ? ((total - remaining) / total) * 100 : 0;

  useEffect(() => {
    if (done && !firedRef.current) {
      firedRef.current = true;
      beep();
      toast.success(`Timer completato: ${step.label}`, { icon: "🔔" });
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Timer completato", { body: `${step.label} · ${step.location}` });
      }
    }
    if (remaining > 0) firedRef.current = false;
  }, [remaining, done]); // eslint-disable-line

  const save = (s) => {
    localStorage.setItem(key, JSON.stringify(s));
    setState(s);
  };

  const start = () => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
    const base = paused ? state.remaining : total;
    save({ mode: "running", endAt: Date.now() + base * 1000 });
    firedRef.current = false;
  };
  const pause = () => {
    save({ mode: "paused", remaining });
  };
  const reset = () => {
    localStorage.removeItem(key);
    setState(null);
    firedRef.current = false;
  };

  return (
    <div
      data-testid={`phase-timer-${index}`}
      className={`bg-card border rounded-2xl p-4 ${done ? "border-olive" : "border-line"}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-ink flex items-center gap-2 text-sm">
          {step.location === "Frigo" ? <Snowflake size={16} className="text-olive" /> : <Thermometer size={16} className="text-crust" />}
          {step.label}
        </span>
        <span className="text-xs text-clay">{step.hours}h · {step.location}</span>
      </div>

      <div className="flex items-center gap-3">
        <span className={`font-body tabular-nums text-2xl tracking-tight ${done ? "text-olive" : running ? "text-crust" : "text-ink"}`}>
          {done ? "Pronto!" : fmt(remaining)}
        </span>
        <div className="flex-1" />
        {!running && !done && (
          <button data-testid={`timer-start-${index}`} onClick={start} className="w-9 h-9 rounded-full bg-crust hover:bg-crustDark text-paper flex items-center justify-center transition-colors">
            <Play size={16} weight="fill" />
          </button>
        )}
        {running && (
          <button data-testid={`timer-pause-${index}`} onClick={pause} className="w-9 h-9 rounded-full bg-ink text-paper flex items-center justify-center">
            <Pause size={16} weight="fill" />
          </button>
        )}
        {(state || done) && (
          <button data-testid={`timer-reset-${index}`} onClick={reset} className="w-9 h-9 rounded-full bg-sand text-clay hover:text-crust flex items-center justify-center transition-colors">
            <ArrowCounterClockwise size={16} />
          </button>
        )}
      </div>

      <div className="mt-3 h-1.5 bg-sand rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-[width] duration-500 ${done ? "bg-olive" : "bg-crust"}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

export const TimersPanel = ({ recipeId, steps }) => {
  const [, setNow] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setNow((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  if (!steps || steps.length === 0) return null;

  return (
    <div data-testid="timers-panel">
      <div className="flex items-center gap-2 mb-4">
        <Bell size={20} weight="duotone" className="text-crust" />
        <h4 className="font-heading text-2xl tracking-tight text-ink">Timer lievitazione</h4>
      </div>
      <p className="text-clay text-sm mb-4">Avvia un timer per ogni fase. Riceverai un avviso sonoro al termine, anche ricaricando la pagina.</p>
      <div className="space-y-3">
        {steps.map((s, i) => (
          <PhaseTimer key={i} recipeId={recipeId} index={i} step={s} />
        ))}
      </div>
    </div>
  );
};
