import React from "react";
import { ArrowRight, ArrowLeft } from "lucide-react";
import type { AnalysisResponse } from "../types.js";

interface GuidancePageProps {
  result: AnalysisResponse | null;
  onAnalyzeAnother: () => void;
  onBackToResults?: () => void;
}

export const GuidancePage: React.FC<GuidancePageProps> = ({
  result,
  onAnalyzeAnother,
  onBackToResults,
}) => {
  const isSuspicious = result?.verdict === "SUSPICIOUS";

  // Standard 5-step numbered checklist
  const standardChecklist = [
    {
      num: "1.",
      title: "Do not make any payment.",
      detail: "Do not send registration fees, security deposits, or gift cards for interviews or unverified offers.",
    },
    {
      num: "2.",
      title: "Do not share OTPs or passwords.",
      detail: "Legitimate organizations never ask for one-time verification codes, bank PINs, or credentials.",
    },
    {
      num: "3.",
      title: "Verify the company through its official website.",
      detail: "Navigate directly to the official domain rather than clicking links sent via unsolicited messages.",
    },
    {
      num: "4.",
      title: "Independently verify the recruiter.",
      detail: "Cross-reference recruiter identity through corporate email domains and verified LinkedIn profiles.",
    },
    {
      num: "5.",
      title: "Confirm the information before taking action.",
      detail: "Verify the offer independently through public corporate switchboards or trusted contacts.",
    },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto py-8 sm:py-12 space-y-8" id="guidance-page">
      {/* Section Title */}
      <div className="space-y-1.5">
        <div className="text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold">
          USER GUIDANCE
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
          WHAT SHOULD YOU DO NEXT?
        </h1>
        <p className="text-sm text-slate-600">
          {result ? (
            <span>
              Precautionary checklist following {isSuspicious ? "a suspicious" : "a safe"} evaluation
              {result.extraction_details?.target ? ` for ${result.extraction_details.target}` : ""}.
            </span>
          ) : (
            <span>
              Standard verification checklist to follow when evaluating suspicious websites or offers.
            </span>
          )}
        </p>
      </div>

      {/* Target-Specific Guidance (if present in result) */}
      {result && result.guidance && result.guidance.length > 0 && (
        <div 
          className={`border rounded p-5 ${
            isSuspicious 
              ? "bg-rose-50/60 border-rose-200 text-rose-950" 
              : "bg-emerald-50/60 border-emerald-200 text-emerald-950"
          }`}
          id="tailored-guidance-box"
        >
          <div className="text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold mb-2.5">
            Specific Observations for this Target
          </div>
          <ul className="space-y-2 text-sm text-slate-800 leading-relaxed">
            {result.guidance.map((item, index) => (
              <li key={index} className="flex items-start gap-2.5">
                <span className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 ${
                  isSuspicious ? "bg-rose-500" : "bg-emerald-500"
                }`} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Numbered 01-05 Checklist */}
      <section className="bg-white border border-slate-200 rounded p-6 sm:p-7 space-y-6" id="verification-checklist">
        <div className="space-y-5">
          {standardChecklist.map((item) => (
            <div 
              key={item.num} 
              className="flex items-start gap-4 pb-4 border-b border-slate-100 last:border-0 last:pb-0"
              id={`checklist-step-${item.num}`}
            >
              <div className="text-xs font-mono font-medium text-slate-400 shrink-0 pt-0.5 w-6">
                {item.num}
              </div>
              <div className="space-y-0.5">
                <h2 className="text-sm sm:text-base font-semibold text-slate-900 leading-snug">
                  {item.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {item.detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Reporting Note */}
      <div className="text-xs text-slate-500 space-y-1 p-4 bg-slate-50 rounded border border-slate-200" id="safety-precautions">
        <div className="font-semibold text-slate-700 font-mono uppercase text-[11px]">
          Official Reporting
        </div>
        <p className="leading-relaxed">
          If you have been targeted by financial fraud, preserve screenshots and communication records. In India, file complaints at cybercrime.gov.in (Helpline: 1930). In the US, file at reportfraud.ftc.gov or ic3.gov.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200">
        {result && onBackToResults ? (
          <button
            id="guidance-back-results-btn"
            type="button"
            onClick={onBackToResults}
            className="w-full sm:w-auto h-10 px-4 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-medium text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Results</span>
          </button>
        ) : (
          <div />
        )}

        <button
          id="guidance-analyze-another-btn"
          type="button"
          onClick={onAnalyzeAnother}
          className="w-full sm:w-auto h-10 px-5 rounded bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <span>Analyze Another URL</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

