export type VerdictType = "SAFE" | "SUSPICIOUS";

export interface RiskEvidenceItem {
  signal: string;
  evidence: string;
  severity?: "high" | "medium" | "low" | "info";
}

export interface ExtractionMetadata {
  sourceType: "url" | "document" | "image";
  target: string;
  fetchStatus?: "success" | "failed" | "not_applicable";
  fetchError?: string;
  pageTitle?: string;
  domain?: string;
  isHttps?: boolean;
  suspiciousTld?: boolean;
  textLength?: number;
  extractedContacts?: string[];
  formActions?: string[];
  renderedWithJs?: boolean;
}

export interface AnalysisResponse {
  verdict: VerdictType;
  confidence: number;
  summary: string;
  risk_signals: string[];
  evidence: RiskEvidenceItem[];
  guidance: string[];
  extraction_details?: ExtractionMetadata;
}
