export type VerdictType = "SAFE" | "SUSPICIOUS";

export interface RiskEvidenceItem {
  signal: string;
  evidence: string;
  severity?: "high" | "medium" | "low" | "info";
  location?: string;
}

export interface ImageForensics {
  impersonated_entity?: string;
  channel_analysis?: string;
  manipulation_detected?: boolean;
  tampering_details?: string;
  scam_category?: string;
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
  forensics?: ImageForensics;
}

export interface AnalysisResponse {
  verdict: VerdictType;
  confidence: number;
  detected_category?: string;
  summary: string;
  risk_signals: string[];
  evidence: RiskEvidenceItem[];
  guidance: string[];
  forensics?: ImageForensics;
  extraction_details?: ExtractionMetadata;
}

export interface DossierOptions {
  victimName?: string;
  bankName?: string;
  amountLost?: string;
  transactionRef?: string;
  incidentDate?: string;
  jurisdiction?: "US" | "IN" | "UK" | "INTL";
  suspectContact?: string;
  paymentMethod?: string;
}

export interface IncidentDossier {
  bankDisputeLetter: string;
  cybercrimeComplaint: string;
  takedownNotice: string;
  abuseEmailTarget: string;
  legalStatutesCited: string[];
  emergencyChecklist: {
    phase: string;
    action: string;
    urgency: "immediate" | "within_1_hour" | "within_24_hours";
    details: string;
  }[];
}
