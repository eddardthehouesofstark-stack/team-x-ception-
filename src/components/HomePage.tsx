import React from "react";
import { ArrowRight } from "lucide-react";

interface HomePageProps {
  onStartAnalysis: () => void;
  hasResult: boolean;
  onViewResults: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onStartAnalysis,
  hasResult,
  onViewResults,
}) => {
  return (
    <div className="w-full max-w-3xl mx-auto py-8 sm:py-12 space-y-10 sm:space-y-12" id="home-page">
      {/* Hero Section */}
      <section className="text-center space-y-5">
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-slate-950 leading-[1.12]">
          Check Before You Trust.
        </h1>

        <p className="text-base sm:text-lg text-slate-600 max-w-lg mx-auto font-normal leading-relaxed">
          Analyze suspicious websites, understand the evidence, and know what to verify next.
        </p>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            id="hero-analyze-btn"
            type="button"
            onClick={onStartAnalysis}
            className="w-full sm:w-auto h-11 px-6 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm rounded flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <span>Analyze a URL</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {hasResult && (
            <button
              id="hero-view-results-btn"
              type="button"
              onClick={onViewResults}
              className="w-full sm:w-auto h-11 px-5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-medium text-sm rounded flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <span>View Analysis</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </section>

      {/* Three-step process using typography and spacing */}
      <section className="border-t border-slate-200 pt-8 sm:pt-10" id="three-step-process">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {/* 01 — Submit */}
          <div className="space-y-1.5">
            <div className="text-xs font-mono text-slate-400 font-medium">
              01 — Submit
            </div>
            <p className="text-sm text-slate-700 leading-relaxed font-normal">
              Paste a suspicious website address.
            </p>
          </div>

          {/* 02 — Understand */}
          <div className="space-y-1.5">
            <div className="text-xs font-mono text-slate-400 font-medium">
              02 — Understand
            </div>
            <p className="text-sm text-slate-700 leading-relaxed font-normal">
              See why the website may be suspicious or safe, with supporting evidence.
            </p>
          </div>

          {/* 03 — Verify */}
          <div className="space-y-1.5">
            <div className="text-xs font-mono text-slate-400 font-medium">
              03 — Verify
            </div>
            <p className="text-sm text-slate-700 leading-relaxed font-normal">
              Follow practical steps before taking action.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

