import React, { useState, useEffect } from "react";
import {
  FileText,
  ShieldAlert,
  Copy,
  Check,
  Download,
  ExternalLink,
  Clock,
  Building2,
  Scale,
  Printer,
  X,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  AlertTriangle,
  Lock
} from "lucide-react";
import { AnalysisResponse, DossierOptions, IncidentDossier } from "../types.js";

interface IncidentDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: AnalysisResponse;
}

export const IncidentDossierModal: React.FC<IncidentDossierModalProps> = ({
  isOpen,
  onClose,
  analysis,
}) => {
  const [activeTab, setActiveTab] = useState<"bank" | "police" | "checklist">("bank");
  const [showConfig, setShowConfig] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Form options
  const [options, setOptions] = useState<DossierOptions>({
    jurisdiction: "US",
    victimName: "",
    bankName: "",
    amountLost: "",
    transactionRef: "",
    suspectContact: "",
    paymentMethod: "Bank Transfer / Card / UPI",
    incidentDate: new Date().toISOString().split("T")[0],
  });

  const [dossier, setDossier] = useState<IncidentDossier | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});

  // Auto-fetch dossier on open
  useEffect(() => {
    if (isOpen && !dossier) {
      loadDossier();
    }
  }, [isOpen]);

  const loadDossier = async (overrideOptions?: DossierOptions) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/generate-dossier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysis,
          options: overrideOptions || options,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setDossier(data);
      }
    } catch (err) {
      console.error("Failed to generate dossier:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownload = (filename: string, content: string) => {
    const element = document.createElement("a");
    const file = new Blob([content], { type: "text/plain;charset=utf-8" });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const toggleStep = (idx: number) => {
    setCompletedSteps((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  if (!isOpen) return null;

  const jurisdictionPortals: Record<string, { name: string; url: string; phone?: string }> = {
    US: {
      name: "FBI IC3 (Internet Crime Complaint Center)",
      url: "https://www.ic3.gov/",
      phone: "FTC Helpline: 1-877-FTC-HELP",
    },
    IN: {
      name: "National Cyber Crime Reporting Portal (cybercrime.gov.in)",
      url: "https://cybercrime.gov.in/",
      phone: "National Helpline: 1930",
    },
    UK: {
      name: "Action Fraud (National Fraud & Cyber Crime Reporting)",
      url: "https://www.actionfraud.police.uk/",
      phone: "Hotline: 0300 123 2040",
    },
    INTL: {
      name: "Interpol Cybercrime Directorate & Global Desks",
      url: "https://www.interpol.int/en/Crimes/Cybercrime",
    },
  };

  const currentPortal = jurisdictionPortals[options.jurisdiction || "US"] || jurisdictionPortals.US;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-2 sm:p-5 overflow-y-auto"
      id="incident-dossier-modal"
    >
      <div className="bg-white border border-slate-200 rounded-xl max-w-5xl w-full max-h-[94vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-900 text-white flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1 font-semibold">
                <ShieldAlert className="w-3 h-3" />
                Legal &amp; Cybercrime Dispatch
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Case ID: #{Math.abs((analysis.extraction_details?.target || "case").length || 10).toString(16).toUpperCase()}-{Date.now().toString().slice(-4)}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-white">
              Incident Dossier &amp; Dispute Generator
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl">
              Automated legal dispute documentation, official law enforcement complaint filings, and statutory citations.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Customization Details Bar (Collapsible) */}
        <div className="border-b border-slate-200 bg-slate-50 px-5 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs font-medium text-slate-700">
              <span className="flex items-center gap-1.5 font-semibold text-slate-900">
                <Building2 className="w-3.5 h-3.5 text-slate-600" />
                Jurisdiction:
              </span>
              <div className="flex items-center gap-1 bg-white border border-slate-300 rounded p-0.5">
                {(["US", "IN", "UK", "INTL"] as const).map((jur) => (
                  <button
                    key={jur}
                    type="button"
                    onClick={() => {
                      const newOpts = { ...options, jurisdiction: jur };
                      setOptions(newOpts);
                      loadDossier(newOpts);
                    }}
                    className={`px-2 py-1 text-xs font-mono rounded cursor-pointer transition-colors ${
                      options.jurisdiction === jur
                        ? "bg-slate-900 text-white font-semibold"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {jur === "US" ? "🇺🇸 US (IC3/CFPB)" : jur === "IN" ? "🇮🇳 IN (1930/RBI)" : jur === "UK" ? "🇬🇧 UK (Action Fraud)" : "🌐 Global (Interpol)"}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowConfig(!showConfig)}
              className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
            >
              <span>{showConfig ? "Hide details form" : "Customize victim & transaction details"}</span>
              {showConfig ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Form fields for victim context */}
          {showConfig && (
            <div className="mt-4 pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-slate-600 mb-1 font-medium">Victim / Account Name</label>
                <input
                  type="text"
                  placeholder="e.g., John Doe"
                  value={options.victimName}
                  onChange={(e) => setOptions({ ...options, victimName: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">Bank / Card Issuer Name</label>
                <input
                  type="text"
                  placeholder="e.g., Chase Bank / HDFC / Revolut"
                  value={options.bankName}
                  onChange={(e) => setOptions({ ...options, bankName: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">Disputed Amount &amp; Currency</label>
                <input
                  type="text"
                  placeholder="e.g., $450 USD or ₹12,000 INR"
                  value={options.amountLost}
                  onChange={(e) => setOptions({ ...options, amountLost: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">Transaction / UTR Reference ID</label>
                <input
                  type="text"
                  placeholder="e.g., TXN8923184912"
                  value={options.transactionRef}
                  onChange={(e) => setOptions({ ...options, transactionRef: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">Suspect Channel / Recipient Identifier</label>
                <input
                  type="text"
                  placeholder="e.g., @vip_agent_bot or 9876543210"
                  value={options.suspectContact}
                  onChange={(e) => setOptions({ ...options, suspectContact: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-slate-900"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => loadDossier()}
                  disabled={isLoading}
                  className="w-full h-8 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white rounded font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                  <span>Update Dossier</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 3 High-Visibility Action Modules Selector */}
        <div className="p-3 sm:p-4 bg-slate-100/90 border-b border-slate-200" id="dossier-action-selector">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-3">
            {/* 1. Bank Dispute Letter */}
            <button
              type="button"
              id="dossier-tab-bank"
              onClick={() => setActiveTab("bank")}
              className={`text-left p-3 sm:p-3.5 rounded-lg border transition-all cursor-pointer flex flex-col justify-between gap-2.5 relative ${
                activeTab === "bank"
                  ? "bg-slate-900 border-slate-900 text-white shadow-md ring-2 ring-slate-900/30"
                  : "bg-white border-slate-300 hover:border-slate-400 hover:bg-slate-50/80 text-slate-800 shadow-xs"
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-md flex items-center justify-center ${
                    activeTab === "bank"
                      ? "bg-blue-500/20 text-blue-300 border border-blue-400/30"
                      : "bg-blue-50 text-blue-700 border border-blue-200"
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                </div>
                <span
                  className={`text-[10px] font-mono uppercase font-bold px-1.5 py-0.5 rounded ${
                    activeTab === "bank"
                      ? "bg-blue-500/30 text-blue-200 border border-blue-400/40"
                      : "bg-slate-100 text-slate-600 border border-slate-200"
                  }`}
                >
                  STEP 01
                </span>
              </div>

              <div>
                <h3
                  className={`text-xs sm:text-sm font-bold tracking-tight ${
                    activeTab === "bank" ? "text-white" : "text-slate-900"
                  }`}
                >
                  1. Bank Dispute &amp; Recall
                </h3>
                <p
                  className={`text-[11px] leading-tight line-clamp-2 mt-0.5 ${
                    activeTab === "bank" ? "text-slate-300" : "text-slate-500"
                  }`}
                >
                  Demand fund recall &amp; freeze mule recipient account
                </p>
              </div>

              {activeTab === "bank" && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 bg-blue-500 rounded-full" />
              )}
            </button>

            {/* 2. Cybercrime Complaint Form */}
            <button
              type="button"
              id="dossier-tab-police"
              onClick={() => setActiveTab("police")}
              className={`text-left p-3 sm:p-3.5 rounded-lg border transition-all cursor-pointer flex flex-col justify-between gap-2.5 relative ${
                activeTab === "police"
                  ? "bg-slate-900 border-slate-900 text-white shadow-md ring-2 ring-slate-900/30"
                  : "bg-white border-slate-300 hover:border-slate-400 hover:bg-slate-50/80 text-slate-800 shadow-xs"
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-md flex items-center justify-center ${
                    activeTab === "police"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-400/30"
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}
                >
                  <Scale className="w-4 h-4" />
                </div>
                <span
                  className={`text-[10px] font-mono uppercase font-bold px-1.5 py-0.5 rounded ${
                    activeTab === "police"
                      ? "bg-amber-500/30 text-amber-200 border border-amber-400/40"
                      : "bg-slate-100 text-slate-600 border border-slate-200"
                  }`}
                >
                  STEP 02
                </span>
              </div>

              <div>
                <h3
                  className={`text-xs sm:text-sm font-bold tracking-tight ${
                    activeTab === "police" ? "text-white" : "text-slate-900"
                  }`}
                >
                  2. Cybercrime Report
                </h3>
                <p
                  className={`text-[11px] leading-tight line-clamp-2 mt-0.5 ${
                    activeTab === "police" ? "text-slate-300" : "text-slate-500"
                  }`}
                >
                  Structured filing for 1930 / IC3 / Action Fraud
                </p>
              </div>

              {activeTab === "police" && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 bg-amber-500 rounded-full" />
              )}
            </button>

            {/* 3. Golden Hour Action Checklist */}
            <button
              type="button"
              id="dossier-tab-checklist"
              onClick={() => setActiveTab("checklist")}
              className={`text-left p-3 sm:p-3.5 rounded-lg border transition-all cursor-pointer flex flex-col justify-between gap-2.5 relative ${
                activeTab === "checklist"
                  ? "bg-slate-900 border-slate-900 text-white shadow-md ring-2 ring-slate-900/30"
                  : "bg-white border-slate-300 hover:border-slate-400 hover:bg-slate-50/80 text-slate-800 shadow-xs"
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-md flex items-center justify-center ${
                    activeTab === "checklist"
                      ? "bg-rose-500/20 text-rose-300 border border-rose-400/30"
                      : "bg-rose-50 text-rose-700 border border-rose-200"
                  }`}
                >
                  <Clock className="w-4 h-4" />
                </div>
                <span
                  className={`text-[10px] font-mono uppercase font-bold px-1.5 py-0.5 rounded ${
                    activeTab === "checklist"
                      ? "bg-rose-500/30 text-rose-200 border border-rose-400/40"
                      : "bg-slate-100 text-slate-600 border border-slate-200"
                  }`}
                >
                  STEP 03 &bull; EMERGENCY
                </span>
              </div>

              <div>
                <h3
                  className={`text-xs sm:text-sm font-bold tracking-tight ${
                    activeTab === "checklist" ? "text-white" : "text-slate-900"
                  }`}
                >
                  3. "Golden Hour" Plan
                </h3>
                <p
                  className={`text-[11px] leading-tight line-clamp-2 mt-0.5 ${
                    activeTab === "checklist" ? "text-slate-300" : "text-slate-500"
                  }`}
                >
                  Immediate 0–2 hour critical response protocol
                </p>
              </div>

              {activeTab === "checklist" && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 bg-rose-500 rounded-full" />
              )}
            </button>
          </div>
        </div>

        {/* Tab Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 bg-slate-50/50">
          {isLoading ? (
            <div className="py-16 text-center space-y-3">
              <RefreshCw className="w-8 h-8 mx-auto text-slate-700 animate-spin" />
              <p className="text-sm font-medium text-slate-800">
                Compiling legal evidence dossier &amp; statutory citations...
              </p>
              <p className="text-xs text-slate-500">
                Formatting dispute according to {options.jurisdiction} banking laws and cyber forensic standards.
              </p>
            </div>
          ) : !dossier ? (
            <div className="py-12 text-center text-sm text-slate-500">
              Failed to load dossier. Please click "Update Dossier" above.
            </div>
          ) : (
            <>
              {/* TAB 1: BANK DISPUTE LETTER */}
              {activeTab === "bank" && (
                <div className="space-y-4">
                  {/* Action Banner */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-blue-50/80 border border-blue-200 rounded text-xs text-blue-900">
                    <div className="flex items-start gap-2.5">
                      <Lock className="w-4 h-4 text-blue-700 mt-0.5 shrink-0" />
                      <div>
                        <span className="font-semibold block">Submit to your bank within 72 hours</span>
                        <span className="text-blue-800/90">
                          Timely notification establishes statutory zero-liability protection and triggers emergency beneficiary account recall.
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCopy(dossier.bankDisputeLetter, "bank")}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        {copiedKey === "bank" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedKey === "bank" ? "Copied!" : "Copy Letter"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownload(`bank_dispute_${options.jurisdiction}.txt`, dossier.bankDisputeLetter)}
                        className="px-3 py-1.5 bg-white border border-blue-300 hover:bg-blue-50 text-blue-900 rounded font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download .txt</span>
                      </button>
                    </div>
                  </div>

                  {/* Statutes Cited */}
                  <div className="p-3 bg-white border border-slate-200 rounded text-xs space-y-1.5">
                    <span className="text-slate-500 font-mono uppercase tracking-wider text-[10px] font-semibold block">
                      STATUTES &amp; RULES EMBEDDED IN THIS LETTER
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {dossier.legalStatutesCited?.map((statute, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-mono text-[11px] border border-slate-200"
                        >
                          {statute}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Letter Text Document */}
                  <div className="bg-white border border-slate-300 rounded shadow-xs p-5 font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed select-text overflow-x-auto max-h-[380px]">
                    {dossier.bankDisputeLetter}
                  </div>
                </div>
              )}

              {/* TAB 2: CYBERCRIME COMPLAINT */}
              {activeTab === "police" && (
                <div className="space-y-4">
                  {/* Action Banner */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-amber-50/80 border border-amber-200 rounded text-xs text-amber-950">
                    <div className="space-y-0.5">
                      <span className="font-semibold block">Official Police &amp; Cyberdesk Intake Schema</span>
                      <span className="text-amber-900">
                        Portal: <strong>{currentPortal.name}</strong> {currentPortal.phone ? `(${currentPortal.phone})` : ""}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={currentPortal.url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded font-medium flex items-center gap-1.5 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Open Reporting Portal</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => handleCopy(dossier.cybercrimeComplaint, "police")}
                        className="px-3 py-1.5 bg-white border border-amber-300 hover:bg-amber-100/50 text-amber-950 rounded font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        {copiedKey === "police" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedKey === "police" ? "Copied!" : "Copy Complaint"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownload(`cybercrime_complaint_${options.jurisdiction}.txt`, dossier.cybercrimeComplaint)}
                        className="px-3 py-1.5 bg-white border border-amber-300 hover:bg-amber-100/50 text-amber-950 rounded font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>

                  {/* Complaint Document */}
                  <div className="bg-white border border-slate-300 rounded shadow-xs p-5 font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed select-text overflow-x-auto max-h-[380px]">
                    {dossier.cybercrimeComplaint}
                  </div>
                </div>
              )}

              {/* TAB 3: GOLDEN HOUR EMERGENCY CHECKLIST */}
              {activeTab === "checklist" && (
                <div className="space-y-4">
                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded text-xs text-rose-950 flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                    <div className="space-y-0.5">
                      <span className="font-semibold block">The "Golden 2 Hours" Incident Rule</span>
                      <p className="text-rose-900">
                        Funds transferred through fraudulent electronic payments can only be frozen before mule syndicates withdraw them via ATMs or crypto-exchanges. Complete these actions in exact chronological order:
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {dossier.emergencyChecklist?.map((step, idx) => {
                      const isDone = !!completedSteps[idx];
                      return (
                        <div
                          key={idx}
                          onClick={() => toggleStep(idx)}
                          className={`p-4 rounded border transition-all cursor-pointer ${
                            isDone
                              ? "bg-slate-50 border-slate-200 opacity-60 line-through"
                              : "bg-white border-slate-300 hover:border-slate-400 shadow-xs"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <div
                                className={`w-5 h-5 rounded flex items-center justify-center mt-0.5 shrink-0 border ${
                                  isDone
                                    ? "bg-emerald-600 border-emerald-600 text-white"
                                    : "border-slate-400 bg-white"
                                }`}
                              >
                                {isDone && <Check className="w-3.5 h-3.5" />}
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-mono font-semibold uppercase text-slate-500">
                                    {step.phase}
                                  </span>
                                  {step.urgency === "immediate" && (
                                    <span className="px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 text-[10px] font-bold font-mono">
                                      CRITICAL
                                    </span>
                                  )}
                                </div>
                                <h4 className="text-sm font-semibold text-slate-900">{step.action}</h4>
                                <p className="text-xs text-slate-600 leading-relaxed">{step.details}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-slate-400" />
            <span>Prepared according to ISO 27037 Digital Evidence Handling &amp; Statutory Consumer Laws</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Dossier</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-white font-medium transition-colors cursor-pointer"
            >
              Done / Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
