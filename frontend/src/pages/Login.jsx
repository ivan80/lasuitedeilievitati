import React from "react";
import { CookingPot, ArrowRight, Timer, Scales, Flask } from "@phosphor-icons/react";

// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
export default function Login() {
  const handleLogin = () => {
    const redirectUrl = window.location.origin + "/dashboard";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-paper">
      {/* Left: content */}
      <div className="flex flex-col justify-between p-8 md:p-14 lg:p-16 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-crust flex items-center justify-center">
            <CookingPot size={24} weight="duotone" className="text-paper" />
          </div>
          <span className="font-heading text-2xl tracking-tight text-ink">Impasto</span>
        </div>

        <div className="max-w-lg py-16">
          <p className="text-crust font-medium tracking-widest uppercase text-sm mb-5">
            Laboratorio digitale del panificatore
          </p>
          <h1 className="font-heading tracking-tight text-ink text-5xl sm:text-6xl lg:text-7xl leading-[0.95]">
            Le tue ricette,
            <br />
            calcolate alla perfezione.
          </h1>
          <p className="text-clay text-base md:text-lg mt-7 leading-relaxed">
            Pizza tonda, teglia, focaccia, pane e grandi lievitati. Calcolo dosi in
            percentuale del panificatore, biga, poolish e water roux, forza delle farine (W),
            pianificazione della lievitazione TA/frigo e consigli AI. Tutto in un unico posto.
          </p>

          <button
            data-testid="login-google-button"
            onClick={handleLogin}
            className="group mt-10 inline-flex items-center gap-3 bg-crust hover:bg-crustDark text-paper font-medium text-base px-7 py-4 rounded-full transition-colors duration-300"
          >
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="Google"
              className="w-5 h-5 bg-white rounded-full p-0.5"
            />
            Accedi con Google
            <ArrowRight size={20} weight="bold" className="group-hover:translate-x-1 transition-transform duration-300" />
          </button>

          <div className="flex flex-wrap gap-x-8 gap-y-3 mt-12 text-clay text-sm">
            <span className="flex items-center gap-2"><Scales size={18} className="text-olive" /> Calcolo dosi</span>
            <span className="flex items-center gap-2"><Flask size={18} className="text-olive" /> Preimpasti & W</span>
            <span className="flex items-center gap-2"><Timer size={18} className="text-olive" /> Lievitazione TA/Frigo</span>
          </div>
        </div>

        <p className="text-clay/70 text-sm">Fatto con farina, acqua e pazienza.</p>
      </div>

      {/* Right: image */}
      <div className="relative hidden lg:block overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1549413468-cd78edb7e75c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMjh8MHwxfHNlYXJjaHw0fHxhcnRpc2FuJTIwc291cmRvdWdoJTIwYnJlYWR8ZW58MHx8fHwxNzg3MDkxNzI1fDA&ixlib=rb-4.1.0&q=85"
          alt="Pane artigianale"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-espresso/70 via-espresso/10 to-transparent" />
        <div className="absolute bottom-12 left-12 right-12 text-paper">
          <p className="font-heading text-4xl tracking-tight">"La qualità è la miglior ricetta."</p>
        </div>
      </div>
    </div>
  );
}
