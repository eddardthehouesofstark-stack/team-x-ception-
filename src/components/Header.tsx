import React from "react";
import { Shield } from "lucide-react";

export type NavTab = "home" | "analyze" | "results" | "guidance";

interface HeaderProps {
  currentTab: NavTab;
  onNavigate: (tab: NavTab) => void;
  hasResult: boolean;
  verdict?: "SAFE" | "SUSPICIOUS";
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onNavigate,
  hasResult,
  verdict,
}) => {
  const navItems: { id: NavTab; label: string }[] = [
    { id: "home", label: "Home" },
    { id: "analyze", label: "Analyze" },
    { id: "results", label: "Results" },
    { id: "guidance", label: "Guidance" },
  ];

  return (
    <header className="w-full border-b border-slate-200 bg-white sticky top-0 z-30" id="app-header">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        {/* Brand */}
        <button
          type="button"
          onClick={() => onNavigate("home")}
          className="flex items-center gap-2.5 text-left focus:outline-hidden group"
          id="nav-brand-btn"
        >
          <div className="w-7 h-7 rounded bg-slate-900 flex items-center justify-center text-white shrink-0">
            <Shield className="w-3.5 h-3.5 stroke-[2.2]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold tracking-tight text-slate-900 leading-none">
              Web Verification
            </span>
            <span className="hidden sm:inline-block text-[11px] text-slate-500 font-normal leading-none">
              Security Engine
            </span>
          </div>
        </button>

        {/* 4 Navigation Items ONLY: Home | Analyze | Results | Guidance */}
        <nav className="flex items-center gap-1 sm:gap-1" aria-label="Main Navigation" id="main-navigation">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-${item.id}-btn`}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`relative px-3 py-1.5 text-xs sm:text-sm transition-colors rounded flex items-center gap-1.5 focus:outline-hidden ${
                  isActive
                    ? "text-slate-950 font-semibold bg-slate-100"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium"
                }`}
              >
                <span>{item.label}</span>
                {item.id === "results" && hasResult && (
                  <span
                    className="inline-block w-1.5 h-1.5 rounded-full bg-slate-600"
                    title="Analysis result available"
                    aria-label="Analysis result available"
                  />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};

