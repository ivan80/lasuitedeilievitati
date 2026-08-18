import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { CookingPot, House, BookOpen, Calculator, SignOut } from "@phosphor-icons/react";

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const links = [
    { to: "/dashboard", label: "Dashboard", icon: House },
    { to: "/ricette", label: "Ricette", icon: BookOpen },
    { to: "/calcolatore", label: "Calcolatore", icon: Calculator },
  ];

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-paper/80 border-b border-line print:hidden">
      <div className="max-w-7xl mx-auto px-5 md:px-8 h-16 flex items-center justify-between">
        <button
          data-testid="nav-logo"
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2.5"
        >
          <div className="w-9 h-9 rounded-xl bg-crust flex items-center justify-center">
            <CookingPot size={20} weight="duotone" className="text-paper" />
          </div>
          <span className="font-heading text-xl tracking-tight text-ink">Impasto</span>
        </button>

        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              data-testid={`nav-${l.label.toLowerCase()}`}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
                  isActive ? "bg-ink text-paper" : "text-clay hover:bg-sand"
                }`
              }
            >
              <l.icon size={18} weight="regular" />
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {user?.picture ? (
            <img src={user.picture} alt={user.name} className="w-9 h-9 rounded-full object-cover border border-line" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-olive text-paper flex items-center justify-center text-sm font-bold">
              {user?.name?.[0] || "?"}
            </div>
          )}
          <button
            data-testid="logout-button"
            onClick={logout}
            className="p-2 rounded-full text-clay hover:bg-sand hover:text-crust transition-colors duration-200"
            title="Esci"
          >
            <SignOut size={20} />
          </button>
        </div>
      </div>

      {/* mobile nav */}
      <nav className="md:hidden flex items-center justify-around border-t border-line bg-paper/90">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-0.5 py-2 text-xs font-medium ${
                isActive ? "text-crust" : "text-clay"
              }`
            }
          >
            <l.icon size={20} />
            {l.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
};

export const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-paper grain">
      <Navbar />
      <main className="max-w-7xl mx-auto px-5 md:px-8 py-8 md:py-12">{children}</main>
    </div>
  );
};
