import React, { useState } from "react";
import { Header, type NavTab } from "./components/Header.js";
import { HomePage } from "./components/HomePage.js";
import { AnalyzePage } from "./components/AnalyzePage.js";
import { ResultsPage } from "./components/ResultsPage.js";
import { GuidancePage } from "./components/GuidancePage.js";
import type { AnalysisResponse } from "./types.js";
import { AlertCircle } from "lucide-react";

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>("home");
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeProgressStage, setActiveProgressStage] = useState<number>(1);
  const [apiError, setApiError] = useState<string | null>(null);

  const handleAnalyzeUrl = async (url: string) => {
    setIsLoading(true);
    setApiError(null);
    setActiveProgressStage(1); // 1: Fetching webpage

    // Progress stage simulation for crisp step-by-step transparency
    const timer1 = setTimeout(() => {
      setActiveProgressStage(2); // 2: Extracting evidence
    }, 1100);

    const timer2 = setTimeout(() => {
      setActiveProgressStage(3); // 3: Analyzing content
    }, 2400);

    const timer3 = setTimeout(() => {
      setActiveProgressStage(4); // 4: Generating result
    }, 4000);

    try {
      const response = await fetch("/api/analyze-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);

      const data = await response.json();

      if (!response.ok && !data.verdict) {
        throw new Error(data.error || "Failed to complete website analysis.");
      }

      setResult(data);
      // After analysis, automatically take the user to the Results section
      setCurrentTab("results");
    } catch (err: any) {
      console.error("URL Analysis error:", err);
      setApiError(err.message || "An unexpected error occurred while analyzing the target.");
    } finally {
      setIsLoading(false);
      setActiveProgressStage(1);
    }
  };

  const handleAnalyzeUpload = async (uploadData: {
    fileName: string;
    fileType: string;
    base64Data?: string;
    textContent?: string;
  }) => {
    setIsLoading(true);
    setApiError(null);
    setActiveProgressStage(2); // Extracting evidence directly

    const timer = setTimeout(() => {
      setActiveProgressStage(3); // Analyzing content
    }, 1800);

    try {
      const response = await fetch("/api/analyze-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(uploadData),
      });

      clearTimeout(timer);
      const data = await response.json();

      if (!response.ok && !data.verdict) {
        throw new Error(data.error || "Failed to complete upload analysis.");
      }

      setResult(data);
      // Automatically take user to Results section
      setCurrentTab("results");
    } catch (err: any) {
      console.error("Upload Analysis error:", err);
      setApiError(err.message || "An unexpected error occurred while analyzing the uploaded file.");
    } finally {
      setIsLoading(false);
      setActiveProgressStage(1);
    }
  };

  const handleStartAnalysis = () => {
    setApiError(null);
    setCurrentTab("analyze");
  };

  const handleAnalyzeAnother = () => {
    setApiError(null);
    setCurrentTab("analyze");
  };

  const handleViewResults = () => {
    setCurrentTab("results");
  };

  const handleViewGuidance = () => {
    setCurrentTab("guidance");
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-slate-900 flex flex-col font-sans antialiased selection:bg-slate-900 selection:text-white">
      {/* Persistent Navigation with ONLY 4 items: Home, Analyze, Results, Guidance */}
      <Header
        currentTab={currentTab}
        onNavigate={(tab) => {
          setApiError(null);
          setCurrentTab(tab);
        }}
        hasResult={!!result}
        verdict={result?.verdict}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 flex flex-col justify-start">
        {apiError && (
          <div className="w-full mt-6 p-4 rounded bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-3 text-sm">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Notice</p>
              <p className="mt-0.5 text-rose-800 text-xs sm:text-sm">{apiError}</p>
            </div>
          </div>
        )}

        {/* 1. HOME */}
        {currentTab === "home" && (
          <HomePage
            onStartAnalysis={handleStartAnalysis}
            hasResult={!!result}
            onViewResults={handleViewResults}
          />
        )}

        {/* 2. ANALYZE */}
        {currentTab === "analyze" && (
          <AnalyzePage
            onAnalyzeUrl={handleAnalyzeUrl}
            onAnalyzeUpload={handleAnalyzeUpload}
            isLoading={isLoading}
            activeProgressStage={activeProgressStage}
          />
        )}

        {/* 3. RESULTS */}
        {currentTab === "results" && (
          <ResultsPage
            result={result}
            onViewGuidance={handleViewGuidance}
            onAnalyzeAnother={handleAnalyzeAnother}
          />
        )}

        {/* 4. GUIDANCE */}
        {currentTab === "guidance" && (
          <GuidancePage
            result={result}
            onAnalyzeAnother={handleAnalyzeAnother}
            onBackToResults={result ? handleViewResults : undefined}
          />
        )}
      </main>

      {/* Minimal Footer */}
      <footer className="w-full border-t border-slate-200 bg-white py-4 text-xs text-slate-500 mt-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Web Verification Platform</span>
          <span className="font-mono text-[11px] text-slate-400">SUBMIT &bull; UNDERSTAND &bull; VERIFY</span>
        </div>
      </footer>
    </div>
  );
}

