import React, { useState } from "react";
import { ArrowRight, ChevronDown, ChevronUp, AlertCircle, FileText, ShieldAlert, Scale } from "lucide-react";
import type { AnalysisResponse } from "../types.js";
import { IncidentDossierModal } from "./IncidentDossierModal.js";

interface ResultsPageProps {
  result: AnalysisResponse | null;
  onViewGuidance: () => void;
  onAnalyzeAnother: () => void;
}

export const ResultsPage: React.FC<ResultsPageProps> = ({
  result,
  onViewGuidance,
  onAnalyzeAnother,
}) => {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [expandedEvidence, setExpandedEvidence] = useState<Record<number, boolean>>({});
  const [isDossierOpen, setIsDossierOpen] = useState(false);

  // Empty State if no analysis yet
  if (!result) {
    return (
      <div className="w-full max-w-xl mx-auto py-16 text-center space-y-6" id="results-empty-state">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            No analysis yet
          </h1>
          <p className="text-sm text-slate-600">
            Submit a URL to see the analysis.
          </p>
        </div>

        <div>
          <button
            id="empty-state-analyze-btn"
            type="button"
            onClick={onAnalyzeAnother}
            className="h-10 px-5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm rounded inline-flex items-center gap-2 transition-colors cursor-pointer"
          >
            <span>Analyze a URL</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  const isSuspicious = result.verdict === "SUSPICIOUS";

  const toggleEvidenceExpand = (index: number) => {
    setExpandedEvidence((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const isImageResult = result.extraction_details?.sourceType === "image";

  return (
    <div className="w-full max-w-2xl mx-auto py-8 sm:py-12 space-y-8" id="results-page">
      {/* 1. Clear Verdict Header */}
      <div 
        className={`border rounded p-6 sm:p-7 ${
          isSuspicious 
            ? "bg-rose-50/60 border-rose-200 text-rose-950" 
            : "bg-emerald-50/60 border-emerald-200 text-emerald-950"
        }`}
        id="result-header-card"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-mono tracking-wider uppercase text-slate-500">
              {isImageResult ? "IMAGE FORENSIC RESULT" : "ANALYSIS RESULT"}
            </div>
            <div 
              className={`text-2xl sm:text-3xl font-semibold tracking-tight ${
                isSuspicious ? "text-rose-700" : "text-emerald-700"
              }`}
              id="result-verdict-title"
            >
              [{result.verdict}]
            </div>
            {result.detected_category && (
              <div className="text-xs font-medium text-slate-600 pt-0.5">
                Category: <span className="font-semibold text-slate-900">{result.detected_category}</span>
              </div>
            )}
          </div>

          <div className="text-right">
            <span className="text-xs font-mono uppercase text-slate-500 block">Confidence</span>
            <span className="text-xl font-semibold text-slate-900">
              {result.confidence}%
            </span>
          </div>
        </div>

        <p className="mt-4 text-sm sm:text-base text-slate-800 leading-relaxed">
          {result.summary}
        </p>

        {result.extraction_details?.fetchStatus === "failed" && (
          <div className="mt-4 p-3 rounded bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-700" />
            <div>
              <p className="font-semibold">Unable to retrieve webpage content.</p>
              <p className="text-amber-800 text-xs mt-0.5">
                Evaluation conducted strictly using domain infrastructure, hostname signals, and protocol checks without fabricating webpage contents.
              </p>
            </div>
          </div>
        )}

        {result.extraction_details?.target && (
          <div className="mt-4 pt-3 border-t border-slate-200/70 text-xs text-slate-600 flex items-center gap-2 font-mono truncate">
            <span className="font-sans text-slate-400">Target:</span>
            <span className="truncate">{result.extraction_details.target}</span>
          </div>
        )}
      </div>

      {/* Incident Dossier & Evidence Preservation Action Card - ONLY FOR SUSPICIOUS / FRAUD DETECTIONS */}
      {isSuspicious && (
        <div 
          className="border rounded-lg p-5 sm:p-6 transition-all shadow-xs bg-slate-900 border-slate-800 text-white" 
          id="incident-dossier-card"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider font-semibold flex items-center gap-1 border bg-rose-500/20 text-rose-300 border-rose-500/30">
                  <ShieldAlert className="w-3 h-3" />
                  Incident Response &amp; Evidence Lock
                </span>
                <span className="text-xs text-slate-300">
                  Did you send funds, OTPs, or credentials?
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-white">
                1-Click Legal Incident Dossier &amp; Dispute Pack
              </h3>
              <p className="text-xs leading-relaxed max-w-xl text-slate-300">
                Instantly compile formal bank fund-recall letters (Regulation E / RBI Zero Liability), formatted cybercell complaints (1930 / IC3), and a prioritized emergency checklist.
              </p>
            </div>

            <button
              type="button"
              id="open-dossier-btn"
              onClick={() => setIsDossierOpen(true)}
              className="px-4 py-2.5 text-xs sm:text-sm font-semibold rounded shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0 bg-rose-600 hover:bg-rose-700 text-white"
            >
              <FileText className="w-4 h-4" />
              <span>Generate Incident Dossier</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. WHY THIS RESULT? Section */}
      <section className="bg-white border border-slate-200 rounded p-6 sm:p-7 space-y-4" id="results-why-section">
        <h2 className="text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold">
          WHY THIS RESULT?
        </h2>

        <ul className="space-y-2">
          {result.risk_signals.map((signal, idx) => (
            <li key={idx} className="flex items-start gap-2.5 text-sm sm:text-base text-slate-800 leading-relaxed">
              <span className="text-slate-400 select-none font-bold shrink-0">•</span>
              <span>{signal}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* 3. EVIDENCE Section */}
      <section className="bg-white border border-slate-200 rounded p-6 sm:p-7 space-y-4" id="results-evidence-section">
        <div className="space-y-1">
          <h2 className="text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold">
            EVIDENCE
          </h2>
          <p className="text-xs text-slate-500">
            {isImageResult 
              ? "Verified visual evidence extracted from text, logos, layout, and messaging channels."
              : "Actual supporting evidence extracted directly from content and domain signals."}
          </p>
        </div>

        {result.evidence && result.evidence.length > 0 ? (
          <div className="space-y-4 pt-2">
            {result.evidence.map((item, idx) => {
              const isLong = item.evidence.length > 180;
              const isExpanded = !!expandedEvidence[idx];
              const displayEvidence = isLong && !isExpanded 
                ? item.evidence.slice(0, 180) + "..." 
                : item.evidence;

              return (
                <div 
                  key={idx}
                  className="space-y-1.5"
                  id={`evidence-item-${idx}`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono uppercase font-semibold text-slate-700 tracking-wide">
                      {item.signal}
                      {item.location ? ` (${item.location})` : ""}
                    </span>
                    {item.severity && (
                      <span className="text-[11px] text-slate-500 uppercase font-mono">
                        {item.severity} severity
                      </span>
                    )}
                  </div>

                  <div className="font-mono text-xs sm:text-sm text-slate-800 bg-slate-50 border border-slate-200 p-3 rounded leading-relaxed whitespace-pre-wrap">
                    &ldquo;{displayEvidence}&rdquo;
                  </div>

                  {isLong && (
                    <button
                      type="button"
                      onClick={() => toggleEvidenceExpand(idx)}
                      className="text-xs text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 cursor-pointer"
                    >
                      {isExpanded ? (
                        <>
                          <span>Show less</span>
                          <ChevronUp className="w-3.5 h-3.5" />
                        </>
                      ) : (
                        <>
                          <span>Expand snippet</span>
                          <ChevronDown className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-sm text-slate-600 bg-slate-50 p-4 rounded border border-slate-200">
            No overt fraudulent evidence snippets were isolated from the parsed content.
          </div>
        )}
      </section>

      {/* 4. Technical Details Drawer */}
      {result.extraction_details && (
        <div className="border border-slate-200 rounded overflow-hidden" id="technical-details-card">
          <button
            type="button"
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="w-full px-5 py-3.5 flex items-center justify-between text-left text-xs font-mono text-slate-600 hover:text-slate-900 bg-slate-50 transition-colors cursor-pointer"
          >
            <span>{isImageResult ? "Forensic Metadata & Channel Analysis" : "Technical details (DNS, HTTP headers, extracted text)"}</span>
            {showTechnicalDetails ? (
              <ChevronUp className="w-4 h-4 text-slate-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-500" />
            )}
          </button>

          {showTechnicalDetails && (
            <div className="p-5 border-t border-slate-200 space-y-3 bg-white text-xs font-mono text-slate-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {isImageResult ? (
                  <>
                    <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                      <span className="text-slate-400 block mb-0.5 uppercase text-[10px]">Evidence Source</span>
                      <span className="font-semibold text-slate-800">Visual Screenshot / Image OCR</span>
                    </div>

                    <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                      <span className="text-slate-400 block mb-0.5 uppercase text-[10px]">Impersonated Entity</span>
                      <span className="font-semibold text-slate-800">
                        {result.forensics?.impersonated_entity || "None isolated"}
                      </span>
                    </div>

                    <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                      <span className="text-slate-400 block mb-0.5 uppercase text-[10px]">Channel Analysis</span>
                      <span className="font-semibold text-slate-800">
                        {result.forensics?.channel_analysis || "Direct visual document inspection"}
                      </span>
                    </div>

                    <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                      <span className="text-slate-400 block mb-0.5 uppercase text-[10px]">Digital Alterations</span>
                      <span className="font-semibold text-slate-800">
                        {result.forensics?.tampering_details || "No overt alteration isolated"}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                      <span className="text-slate-400 block mb-0.5 uppercase text-[10px]">Fetch Status</span>
                      <span className="font-semibold text-slate-800">
                        {result.extraction_details.fetchStatus?.toUpperCase()}
                        {result.extraction_details.fetchError ? ` (${result.extraction_details.fetchError})` : ""}
                      </span>
                    </div>

                    <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                      <span className="text-slate-400 block mb-0.5 uppercase text-[10px]">Visible Text Length</span>
                      <span className="font-semibold text-slate-800">
                        {result.extraction_details.textLength || 0} characters parsed
                      </span>
                    </div>

                    <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                      <span className="text-slate-400 block mb-0.5 uppercase text-[10px]">Page Title</span>
                      <span className="font-semibold text-slate-800 truncate block">
                        {result.extraction_details.pageTitle || "(None)"}
                      </span>
                    </div>

                    <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                      <span className="text-slate-400 block mb-0.5 uppercase text-[10px]">Protocol &amp; TLD</span>
                      <span className="font-semibold text-slate-800">
                        {result.extraction_details.isHttps ? "HTTPS" : "Insecure HTTP"} &bull;{" "}
                        {result.extraction_details.suspiciousTld ? "High-Abuse TLD" : "Standard TLD"}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. Navigation Actions */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            id="results-analyze-another-btn"
            type="button"
            onClick={onAnalyzeAnother}
            className="w-full sm:w-auto h-10 px-4 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-medium text-sm transition-colors cursor-pointer"
          >
            Check Another Link / Image
          </button>

          {isSuspicious && (
            <button
              id="footer-open-dossier-btn"
              type="button"
              onClick={() => setIsDossierOpen(true)}
              className="w-full sm:w-auto h-10 px-3.5 rounded border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-800 font-medium text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              title="Generate bank recall and cybercrime complaint dossier"
            >
              <Scale className="w-4 h-4 text-rose-600" />
              <span>Dispute &amp; Dossier</span>
            </button>
          )}
        </div>

        <button
          id="results-view-guidance-btn"
          type="button"
          onClick={onViewGuidance}
          className="w-full sm:w-auto h-10 px-5 rounded bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <span>View Guidance</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* 6. Incident Dossier Modal */}
      <IncidentDossierModal
        isOpen={isDossierOpen}
        onClose={() => setIsDossierOpen(false)}
        analysis={result}
      />
    </div>
  );
};

