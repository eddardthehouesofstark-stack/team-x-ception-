import React, { useState } from "react";
import { 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  FileCode, 
  ExternalLink,
  Lock,
  Unlock,
  Info
} from "lucide-react";
import type { AnalysisResponse } from "../types.js";

interface AnalysisResultViewProps {
  result: AnalysisResponse;
  onNewAnalysis: () => void;
}

export const AnalysisResultView: React.FC<AnalysisResultViewProps> = ({
  result,
  onNewAnalysis,
}) => {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const isSuspicious = result.verdict === "SUSPICIOUS";

  return (
    <div className="w-full space-y-6" id="analysis-result-view">
      {/* 1. Core Verdict Header */}
      <div 
        className={`rounded-xl border p-6 sm:p-8 transition-colors ${
          isSuspicious 
            ? "bg-rose-50/70 border-rose-200 text-rose-950" 
            : "bg-emerald-50/70 border-emerald-200 text-emerald-950"
        }`}
        id="verdict-banner"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5 border-stone-200/80">
          <div className="flex items-center gap-3.5">
            <div 
              className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                isSuspicious ? "bg-rose-600 text-white" : "bg-emerald-600 text-white"
              }`}
            >
              {isSuspicious ? (
                <ShieldAlert className="w-6 h-6" />
              ) : (
                <ShieldCheck className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="text-xs font-semibold tracking-wider uppercase text-stone-500">
                RESULT
              </div>
              <div 
                className={`text-2xl sm:text-3xl font-bold tracking-tight ${
                  isSuspicious ? "text-rose-700" : "text-emerald-700"
                }`}
                id="result-verdict-label"
              >
                {result.verdict}
              </div>
            </div>
          </div>

          {/* Confidence Display */}
          <div className="flex items-baseline sm:items-end flex-col bg-white/80 border border-stone-200 px-4 py-2.5 rounded-lg">
            <span className="text-xs text-stone-500 uppercase font-medium">Confidence</span>
            <div className="text-2xl font-bold text-stone-900 leading-none mt-0.5">
              {result.confidence}%
            </div>
          </div>
        </div>

        {/* 1-2 sentence core evaluation summary */}
        <p className="mt-4 text-base font-normal text-stone-800 leading-relaxed">
          {result.summary}
        </p>

        {result.extraction_details && (
          <div className="mt-4 pt-3 border-t border-stone-200/60 flex flex-wrap items-center gap-3 text-xs text-stone-600">
            <span className="font-semibold text-stone-700">Target Evaluated:</span>
            <span className="font-mono bg-white/90 px-2 py-0.5 rounded border border-stone-200 truncate max-w-md">
              {result.extraction_details.target}
            </span>
            {result.extraction_details.fetchStatus === "failed" && (
              <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                <AlertTriangle className="w-3 h-3" />
                Webpage Unreachable &bull; Analyzed via Domain Signals
              </span>
            )}
          </div>
        )}
      </div>

      {/* 2. WHY SUSPICIOUS OR SAFE + EVIDENCE SECTION */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 sm:p-8 space-y-8" id="why-and-evidence-section">
        
        {/* WHY? */}
        <section id="section-why">
          <h2 className="text-base font-bold text-stone-900 uppercase tracking-wide flex items-center gap-2 mb-3">
            <AlertTriangle className={`w-4 h-4 ${isSuspicious ? "text-rose-600" : "text-emerald-600"}`} />
            WHY?
          </h2>
          <ul className="space-y-2 text-stone-800">
            {result.risk_signals.map((signal, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-sm sm:text-base leading-relaxed">
                <span className={`inline-block w-1.5 h-1.5 rounded-full mt-2 shrink-0 ${
                  isSuspicious ? "bg-rose-500" : "bg-emerald-500"
                }`} />
                <span>{signal}</span>
              </li>
            ))}
          </ul>
        </section>

        <div className="border-t border-stone-200" />

        {/* EVIDENCE */}
        <section id="section-evidence">
          <div className="mb-4">
            <h2 className="text-base font-bold text-stone-900 uppercase tracking-wide">
              EVIDENCE
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Verified ground-truth evidence extracted directly from the submitted target content.
            </p>
          </div>

          {result.evidence && result.evidence.length > 0 ? (
            <div className="grid grid-cols-1 gap-3.5">
              {result.evidence.map((item, idx) => (
                <div 
                  key={idx}
                  className="rounded-lg border border-stone-200 bg-stone-50/60 p-4 transition-colors"
                  id={`evidence-item-${idx}`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-stone-400" />
                      Signal: {item.signal}
                    </div>
                    {item.severity && (
                      <span className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded border ${
                        item.severity === "high"
                          ? "bg-rose-100 text-rose-800 border-rose-200"
                          : item.severity === "medium"
                          ? "bg-amber-100 text-amber-800 border-amber-200"
                          : "bg-stone-200 text-stone-700 border-stone-300"
                      }`}>
                        {item.severity} Risk
                      </span>
                    )}
                  </div>

                  <div className="text-sm font-mono text-stone-800 bg-white p-3 rounded border border-stone-200/80 whitespace-pre-wrap leading-relaxed">
                    {item.evidence}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-stone-600 bg-stone-50 p-4 rounded-lg border border-stone-200">
              No overt fraudulent evidence snippets were isolated from the parsed text.
            </div>
          )}
        </section>
      </div>

      {/* 3. USER GUIDANCE: "WHAT SHOULD YOU DO?" */}
      <section className="bg-white border border-stone-200 rounded-xl p-6 sm:p-8" id="guidance-section">
        <div className="mb-4">
          <h2 className="text-base font-bold text-stone-900 uppercase tracking-wide flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-stone-700" />
            WHAT SHOULD YOU DO?
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Practical security steps tailored to the findings.
          </p>
        </div>

        <div className="space-y-2.5">
          {result.guidance.map((step, idx) => (
            <div 
              key={idx} 
              className="flex items-start gap-3 p-3 rounded-lg border border-stone-200/80 bg-stone-50/40 text-stone-800 text-sm leading-relaxed"
            >
              <div className="w-5 h-5 rounded-full bg-stone-900 text-white text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">
                {idx + 1}
              </div>
              <div className="font-normal">{step}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Extracted Evidence Verification & Technical Grounding Drawer */}
      {result.extraction_details && (
        <div className="bg-stone-50 border border-stone-200 rounded-xl overflow-hidden" id="technical-details-card">
          <button
            type="button"
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="w-full px-6 py-4 flex items-center justify-between text-left text-xs font-medium text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-stone-500" />
              <span>Inspection Grounding Details (HTTP, Cheerio HTML Parse, Domain Signals)</span>
            </div>
            {showTechnicalDetails ? (
              <ChevronUp className="w-4 h-4 text-stone-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-stone-500" />
            )}
          </button>

          {showTechnicalDetails && (
            <div className="p-6 pt-0 border-t border-stone-200 space-y-4 text-xs font-mono text-stone-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
                <div className="bg-white p-3 rounded border border-stone-200">
                  <span className="text-stone-400 block mb-0.5 font-sans uppercase text-[10px]">Fetch Status</span>
                  <span className={`font-semibold ${result.extraction_details.fetchStatus === "success" ? "text-emerald-700" : "text-amber-700"}`}>
                    {result.extraction_details.fetchStatus?.toUpperCase()}
                    {result.extraction_details.fetchError ? ` (${result.extraction_details.fetchError})` : ""}
                  </span>
                </div>

                <div className="bg-white p-3 rounded border border-stone-200">
                  <span className="text-stone-400 block mb-0.5 font-sans uppercase text-[10px]">Clean Text Extracted</span>
                  <span className="font-semibold text-stone-800">
                    {result.extraction_details.textLength || 0} characters parsed
                  </span>
                </div>

                <div className="bg-white p-3 rounded border border-stone-200">
                  <span className="text-stone-400 block mb-0.5 font-sans uppercase text-[10px]">Extracted Page Title</span>
                  <span className="font-semibold text-stone-800 truncate block">
                    {result.extraction_details.pageTitle || "(None)"}
                  </span>
                </div>

                <div className="bg-white p-3 rounded border border-stone-200">
                  <span className="text-stone-400 block mb-0.5 font-sans uppercase text-[10px]">Protocol &amp; TLD Risk</span>
                  <span className="font-semibold text-stone-800">
                    {result.extraction_details.isHttps ? "HTTPS Enabled" : "Insecure HTTP"} &bull;{" "}
                    {result.extraction_details.suspiciousTld ? "Suspicious High-Abuse TLD" : "Standard TLD"}
                  </span>
                </div>
              </div>

              {result.extraction_details.extractedContacts && result.extraction_details.extractedContacts.length > 0 && (
                <div className="bg-white p-3 rounded border border-stone-200">
                  <span className="text-stone-400 block mb-1 font-sans uppercase text-[10px]">Extracted Contact Links in Webpage</span>
                  <ul className="list-disc pl-4 space-y-0.5">
                    {result.extraction_details.extractedContacts.map((contact, i) => (
                      <li key={i}>{contact}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.extraction_details.formActions && result.extraction_details.formActions.length > 0 && (
                <div className="bg-white p-3 rounded border border-stone-200">
                  <span className="text-stone-400 block mb-1 font-sans uppercase text-[10px]">Detected Form Submissions</span>
                  <ul className="list-disc pl-4 space-y-0.5">
                    {result.extraction_details.formActions.map((form, i) => (
                      <li key={i}>{form}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Action Footer */}
      <div className="flex justify-center pt-2">
        <button
          id="analyze-another-btn"
          type="button"
          onClick={onNewAnalysis}
          className="px-6 py-2.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 font-medium text-sm transition-colors shadow-xs"
        >
          Analyze Another Target
        </button>
      </div>
    </div>
  );
};
