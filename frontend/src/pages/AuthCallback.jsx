import React, { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";

// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
export default function AuthCallback() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const hash = location.hash || window.location.hash;
    const sessionId = new URLSearchParams(hash.replace("#", "")).get("session_id");

    (async () => {
      if (!sessionId) {
        navigate("/login");
        return;
      }
      try {
        const res = await api.post("/auth/session", { session_id: sessionId });
        setUser(res.data);
        window.history.replaceState({}, "", window.location.pathname);
        navigate("/dashboard", { state: { user: res.data } });
      } catch (e) {
        navigate("/login");
      }
    })();
  }, []); // eslint-disable-line

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-line border-t-crust rounded-full animate-spin mx-auto" />
        <p className="mt-6 font-heading text-2xl text-ink">Accesso in corso…</p>
      </div>
    </div>
  );
}
