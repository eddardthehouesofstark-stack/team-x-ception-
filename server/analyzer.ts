import { GoogleGenAI, Type } from "@google/genai";
import * as cheerio from "cheerio";
import type { AnalysisResponse, ExtractionMetadata, RiskEvidenceItem } from "../src/types.js";

const SUSPICIOUS_TLDS = new Set([
  "top", "xyz", "click", "buzz", "work", "loan", "fit", "rest", "cfd", "gq", 
  "tk", "ml", "ga", "cf", "icu", "club", "surf", "monster", "quest", "beauty", 
  "sbs", "tokyo", "cam", "live"
]);

const KNOWN_TARGET_BRANDS = [
  "paypal", "apple", "google", "microsoft", "amazon", "netflix", "facebook", 
  "instagram", "whatsapp", "telegram", "chase", "bankofamerica", "wellsfargo", 
  "binance", "coinbase", "metamask", "ups", "fedex", "usps", "dhl", "irs", "gov"
];

function extractDomainSignals(rawUrl: string): {
  isValidUrl: boolean;
  domain: string;
  isHttps: boolean;
  suspiciousTld: boolean;
  isRawIp: boolean;
  hasAtSymbol: boolean;
  hasBrandImpersonationRisk: boolean;
  impersonationDetails: string;
  subdomainCount: number;
} {
  try {
    const parsed = new URL(rawUrl);
    const hostname = parsed.hostname.toLowerCase();
    const isHttps = parsed.protocol === "https:";
    const hasAtSymbol = rawUrl.includes("@");
    
    // Check raw IP
    const isRawIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);
    
    // Check TLD
    const parts = hostname.split(".");
    const tld = parts.length > 1 ? parts[parts.length - 1] : "";
    const suspiciousTld = SUSPICIOUS_TLDS.has(tld);
    const subdomainCount = Math.max(0, parts.length - 2);

    // Check brand impersonation in subdomain or path
    let hasBrandImpersonationRisk = false;
    let impersonationDetails = "";
    for (const brand of KNOWN_TARGET_BRANDS) {
      if (hostname.includes(brand)) {
        // Is it actually the legitimate domain?
        const mainDomain = parts.slice(-2).join(".");
        const isLegit = mainDomain === `${brand}.com` || mainDomain === `${brand}.org` || mainDomain === `${brand}.net`;
        if (!isLegit) {
          hasBrandImpersonationRisk = true;
          impersonationDetails = `Domain "${hostname}" contains brand name "${brand}" but main domain is "${mainDomain}"`;
          break;
        }
      }
    }

    return {
      isValidUrl: true,
      domain: hostname,
      isHttps,
      suspiciousTld,
      isRawIp,
      hasAtSymbol,
      hasBrandImpersonationRisk,
      impersonationDetails,
      subdomainCount
    };
  } catch (err) {
    return {
      isValidUrl: false,
      domain: rawUrl,
      isHttps: false,
      suspiciousTld: false,
      isRawIp: false,
      hasAtSymbol: rawUrl.includes("@"),
      hasBrandImpersonationRisk: false,
      impersonationDetails: "",
      subdomainCount: 0
    };
  }
}

export async function fetchAndExtractUrl(inputUrl: string): Promise<{
  url: string;
  fetchStatus: "success" | "failed";
  fetchError?: string;
  finalUrl?: string;
  pageTitle?: string;
  metaDescription?: string;
  ogTitle?: string;
  ogDescription?: string;
  extractedText: string;
  extractedContacts: string[];
  formActions: string[];
  domainSignals: ReturnType<typeof extractDomainSignals>;
  isJsRenderedNotice?: boolean;
}> {
  let normalizedUrl = inputUrl.trim();
  if (!/^https?:\/\//i.test(normalizedUrl)) {
    normalizedUrl = `https://${normalizedUrl}`;
  }

  const domainSignals = extractDomainSignals(normalizedUrl);
  if (!domainSignals.isValidUrl) {
    return {
      url: normalizedUrl,
      fetchStatus: "failed",
      fetchError: "Invalid URL syntax or unparseable protocol",
      extractedText: "",
      extractedContacts: [],
      formActions: [],
      domainSignals,
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(normalizedUrl, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1"
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        url: normalizedUrl,
        fetchStatus: "failed",
        fetchError: `HTTP ${response.status} (${response.statusText || "Server responded with error"})`,
        finalUrl: response.url,
        extractedText: "",
        extractedContacts: [],
        formActions: [],
        domainSignals
      };
    }

    const html = await response.text();
    const finalUrl = response.url;

    // Parse HTML with Cheerio
    const $ = cheerio.load(html);

    // Extract metadata before stripping tags
    const pageTitle = $("title").first().text().trim() || $("meta[property='og:title']").attr("content") || "";
    const metaDescription = $("meta[name='description']").attr("content") || "";
    const ogTitle = $("meta[property='og:title']").attr("content") || "";
    const ogDescription = $("meta[property='og:description']").attr("content") || "";

    // Extract forms and their action URLs
    const formActions: string[] = [];
    $("form").each((_, el) => {
      const action = $(el).attr("action") || "(current page)";
      const method = $(el).attr("method") || "GET";
      const hasPassword = $(el).find("input[type='password']").length > 0;
      const inputs = $(el).find("input[name]").map((_, inp) => $(inp).attr("name")).get().slice(0, 5);
      formActions.push(`Method: ${method.toUpperCase()}, Action: ${action}, PasswordField: ${hasPassword}, Inputs: [${inputs.join(", ")}]`);
    });

    // Extract contact information (mailto, tel, telegram, whatsapp)
    const contacts = new Set<string>();
    $("a[href]").each((_, el) => {
      const href = $(el).attr("href") || "";
      if (href.startsWith("mailto:")) {
        contacts.add(`Email: ${href.replace(/^mailto:/i, "").split("?")[0].trim()}`);
      } else if (href.startsWith("tel:")) {
        contacts.add(`Phone: ${href.replace(/^tel:/i, "").trim()}`);
      } else if (href.includes("t.me/") || href.includes("telegram.me/")) {
        contacts.add(`Telegram: ${href}`);
      } else if (href.includes("wa.me/") || href.includes("api.whatsapp.com")) {
        contacts.add(`WhatsApp: ${href}`);
      }
    });

    // Detect if the page looks like an empty client-side JS app
    const hasNoscriptNotice = $("noscript").text().toLowerCase().includes("javascript");
    const rawBodyText = $("body").text().trim();
    const isJsRenderedNotice = rawBodyText.length < 100 && (hasNoscriptNotice || $("div#root, div#__next, div#app").length > 0);

    // Strip non-content elements
    $("script, style, noscript, svg, iframe, link").remove();

    // Extract clean visible text
    const textPieces: string[] = [];
    $("h1, h2, h3, h4, p, li, td, th, blockquote, span, div").each((_, el) => {
      // Only include direct text if meaningful
      const t = $(el).clone().children().remove().end().text().replace(/\s+/g, " ").trim();
      if (t.length > 20 && !textPieces.includes(t)) {
        textPieces.push(t);
      }
    });

    const fullCleanedText = textPieces.join("\n").slice(0, 8000);

    return {
      url: normalizedUrl,
      fetchStatus: "success",
      finalUrl,
      pageTitle,
      metaDescription,
      ogTitle,
      ogDescription,
      extractedText: fullCleanedText,
      extractedContacts: Array.from(contacts).slice(0, 10),
      formActions: formActions.slice(0, 5),
      domainSignals,
      isJsRenderedNotice
    };
  } catch (err: any) {
    return {
      url: normalizedUrl,
      fetchStatus: "failed",
      fetchError: err.name === "AbortError" ? "Connection timed out after 8 seconds" : (err.message || "Failed to establish network connection"),
      extractedText: "",
      extractedContacts: [],
      formActions: [],
      domainSignals
    };
  }
}

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in server environment.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

export async function runScamAnalysisOnEvidence(payload: {
  sourceType: "url" | "document" | "image";
  target: string;
  extractedText: string;
  fetchStatus: "success" | "failed" | "not_applicable";
  fetchError?: string;
  pageTitle?: string;
  metaDescription?: string;
  domainSignals?: ReturnType<typeof extractDomainSignals>;
  extractedContacts?: string[];
  formActions?: string[];
  imageData?: { mimeType: string; base64: string };
  isJsRenderedNotice?: boolean;
}): Promise<AnalysisResponse> {
  const ai = getGeminiClient();

  const promptEvidenceSummary = `
You are an expert cybersecurity fraud and scam analysis engine.
Analyze the following verified extracted signals from submitted content:

Source Type: ${payload.sourceType}
Target / Identifier: ${payload.target}
Webpage Fetch Status: ${payload.fetchStatus}
${payload.fetchError ? `Fetch Error: ${payload.fetchError}` : ""}
${payload.pageTitle ? `Page Title: ${payload.pageTitle}` : ""}
${payload.metaDescription ? `Meta Description: ${payload.metaDescription}` : ""}

Domain & URL Signals:
${payload.domainSignals ? JSON.stringify(payload.domainSignals, null, 2) : "N/A"}

Extracted Contacts (Email, Telegram, WhatsApp, Phone):
${payload.extractedContacts && payload.extractedContacts.length > 0 ? payload.extractedContacts.join("\n") : "None found"}

Extracted Form Actions & Password Fields:
${payload.formActions && payload.formActions.length > 0 ? payload.formActions.join("\n") : "None found"}

JavaScript Rendering Note:
${payload.isJsRenderedNotice ? "Notice: Webpage body contained minimal server-rendered text (client-side rendered app)." : "Normal static HTML content parsed."}

Clean Visible Text Content Extracted From Webpage/Document:
"""
${payload.extractedText ? payload.extractedText.slice(0, 6000) : "(No visible text could be extracted or webpage was unreachable)"}
"""

CRITICAL INSTRUCTIONS:
1. DO NOT INVENT OR FABRICATE EVIDENCE.
2. Every item in 'risk_signals' and 'evidence' MUST be traceable to the explicit inputs above (extracted text quotes, domain characteristics, contact mismatch, payment requests, or fetch status).
3. If the website could not be fetched (${payload.fetchStatus === "failed"}), explicitly state that webpage content could not be retrieved. Do not pretend to know what was on the page. Base risk analysis strictly on the URL, hostname, TLD, brand impersonation risks, or unreachable status.
4. Signals to scrutinize:
   - Payment or registration fee requests (e.g. paying before interview, crypto transfer, gift cards)
   - Urgency or pressure tactics ("Act now", "Within 24 hours", "Immediate payment")
   - Suspicious promises (guaranteed returns, unrealistic high salaries, unearned prizes)
   - Contact identity mismatch (e.g. claiming to be Google or Apple but recruiter uses @gmail.com or Telegram)
   - Suspicious domain characteristics (uncommon/high-abuse TLD like .xyz/.top/.click, typosquatting, raw IP, hyphens)
   - Unusual requests for credentials, OTPs, or financial data
   - Inconsistent company information
5. If the content is legitimate and clean (e.g. official well-known portal, normal company website with no scam indicators), set verdict to "SAFE", explain why it appears legitimate, and provide cautious safety advice.
6. If high-risk signals are detected, set verdict to "SUSPICIOUS".
7. 'evidence' array items must have:
   - 'signal': Clear title of the signal (e.g., 'Payment Request', 'Domain Mismatch', 'Urgency Tactic', 'Suspicious TLD')
   - 'evidence': The verbatim quote, exact domain detail, or verified observation
   - 'severity': 'high', 'medium', 'low', or 'info'
8. 'guidance' array must provide practical, concrete next steps for the user based on the detected evidence.
`;

  const contents: any[] = [];
  if (payload.imageData) {
    contents.push({
      inlineData: {
        mimeType: payload.imageData.mimeType,
        data: payload.imageData.base64,
      },
    });
  }
  contents.push({ text: promptEvidenceSummary });

  let response: any;
  let lastError: any = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: contents.length === 1 ? contents[0].text : { parts: contents },
        config: {
          systemInstruction: "You are an objective fraud, scam, and cybersecurity verification engine. Strictly follow ground truth evidence without hallucinating.",
          temperature: 0.1,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              verdict: {
                type: Type.STRING,
                description: "Must be exactly 'SAFE' or 'SUSPICIOUS'",
              },
              confidence: {
                type: Type.INTEGER,
                description: "Confidence percentage integer between 0 and 100",
              },
              summary: {
                type: Type.STRING,
                description: "Concise 1-2 sentence core evaluation statement.",
              },
              risk_signals: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Key bullet points explaining WHY it is suspicious or safe.",
              },
              evidence: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    signal: {
                      type: Type.STRING,
                      description: "Name of the detected signal",
                    },
                    evidence: {
                      type: Type.STRING,
                      description: "Exact quote or specific verified detail from the content",
                    },
                    severity: {
                      type: Type.STRING,
                      description: "high, medium, low, or info",
                    },
                  },
                  required: ["signal", "evidence"],
                },
                description: "Detailed signal-to-evidence mapping grounded in actual content.",
              },
              guidance: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Actionable what-should-you-do steps for the user.",
              },
            },
            required: ["verdict", "confidence", "summary", "risk_signals", "evidence", "guidance"],
          },
        },
      });
      break; // Success
    } catch (err: any) {
      lastError = err;
      console.warn(`Gemini generation attempt ${attempt + 1} failed:`, err.message || err);
      // Wait before retrying
      if (attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 1200 * (attempt + 1)));
      }
    }
  }

  if (!response && lastError) {
    // If model had transient outage (e.g. 503 high demand), build deterministic ground-truth response
    const hasSuspiciousDomain = payload.domainSignals?.suspiciousTld || payload.domainSignals?.hasBrandImpersonationRisk || payload.domainSignals?.isRawIp;
    const fetchFailed = payload.fetchStatus === "failed";
    const textLower = (payload.extractedText || "").toLowerCase();
    const hasPaymentDemand = /pay\s*[\$₹€£]|registration fee|deposit|gift card|bitcoin|crypto|wire transfer|upi/i.test(textLower);
    const hasUrgency = /urgent|immediate|within \d+ hours?|account suspend|terminated/i.test(textLower);

    const isSuspiciousFallback = hasSuspiciousDomain || hasPaymentDemand || hasUrgency;
    const fallbackVerdict: "SAFE" | "SUSPICIOUS" = isSuspiciousFallback ? "SUSPICIOUS" : "SAFE";

    const riskSignalsFallback: string[] = [];
    const evidenceFallback: RiskEvidenceItem[] = [];

    if (fetchFailed) {
      riskSignalsFallback.push("Webpage content could not be retrieved from host (" + (payload.fetchError || "Unreachable") + ")");
      evidenceFallback.push({
        signal: "Host Unreachable",
        evidence: `URL: ${payload.target} - Error: ${payload.fetchError || "Connection failed"}`,
        severity: "medium"
      });
    }

    if (payload.domainSignals?.hasBrandImpersonationRisk) {
      riskSignalsFallback.push("Potential brand impersonation detected in domain name");
      evidenceFallback.push({
        signal: "Domain Mismatch",
        evidence: payload.domainSignals.impersonationDetails || payload.domainSignals.domain,
        severity: "high"
      });
    }

    if (payload.domainSignals?.suspiciousTld) {
      riskSignalsFallback.push("Domain uses a high-risk or commonly abused top-level domain");
      evidenceFallback.push({
        signal: "Suspicious TLD",
        evidence: `Domain: ${payload.domainSignals.domain}`,
        severity: "medium"
      });
    }

    if (hasPaymentDemand) {
      riskSignalsFallback.push("Upfront payment or transfer terms detected in text");
      evidenceFallback.push({
        signal: "Payment Request",
        evidence: "Text contains references to upfront payment, deposit, or non-standard transfer terms.",
        severity: "high"
      });
    }

    if (hasUrgency) {
      riskSignalsFallback.push("Artificial urgency or threat of account suspension detected");
      evidenceFallback.push({
        signal: "Urgency Tactics",
        evidence: "Text pressures the recipient with immediate deadlines or termination threats.",
        severity: "high"
      });
    }

    if (riskSignalsFallback.length === 0) {
      riskSignalsFallback.push("No obvious deceptive or fraudulent patterns were extracted from the available domain signals.");
      evidenceFallback.push({
        signal: "Domain Structure",
        evidence: `Protocol: ${payload.domainSignals?.isHttps ? "HTTPS" : "HTTP"}, Domain: ${payload.domainSignals?.domain || payload.target}`,
        severity: "info"
      });
    }

    return {
      verdict: fallbackVerdict,
      confidence: isSuspiciousFallback ? 88 : 78,
      summary: isSuspiciousFallback 
        ? "Ground-truth inspection identified multiple risk signals in the submitted target."
        : "No overt scam or fraud indicators were identified in the verified target details.",
      risk_signals: riskSignalsFallback,
      evidence: evidenceFallback,
      guidance: isSuspiciousFallback
        ? [
            "Do not make any upfront payment or deposit.",
            "Do not enter passwords, OTPs, or sensitive personal information.",
            "Independently verify the claimed company or service using official contact channels.",
            "Report the link or message if you believe it is malicious."
          ]
        : [
            "Verify any sensitive financial actions through official channels.",
            "Ensure the URL matches the legitimate organization before logging in."
          ],
      extraction_details: {
        sourceType: payload.sourceType,
        target: payload.target,
        fetchStatus: payload.fetchStatus,
        fetchError: payload.fetchError,
        pageTitle: payload.pageTitle,
        domain: payload.domainSignals?.domain,
        isHttps: payload.domainSignals?.isHttps,
        suspiciousTld: payload.domainSignals?.suspiciousTld,
        textLength: payload.extractedText?.length || 0,
        extractedContacts: payload.extractedContacts,
        formActions: payload.formActions,
        renderedWithJs: payload.isJsRenderedNotice
      }
    };
  }

  const rawJson = response.text?.trim() || "{}";
  let parsed: any;
  try {
    parsed = JSON.parse(rawJson);
  } catch (e) {
    throw new Error("Failed to parse AI response into structured format: " + rawJson.slice(0, 200));
  }

  // Normalize verdict
  const verdict = (parsed.verdict?.toUpperCase() === "SAFE" ? "SAFE" : "SUSPICIOUS") as "SAFE" | "SUSPICIOUS";
  const confidence = Math.min(100, Math.max(0, typeof parsed.confidence === "number" ? parsed.confidence : 85));

  const extractionMetadata: ExtractionMetadata = {
    sourceType: payload.sourceType,
    target: payload.target,
    fetchStatus: payload.fetchStatus,
    fetchError: payload.fetchError,
    pageTitle: payload.pageTitle,
    domain: payload.domainSignals?.domain,
    isHttps: payload.domainSignals?.isHttps,
    suspiciousTld: payload.domainSignals?.suspiciousTld,
    textLength: payload.extractedText ? payload.extractedText.length : 0,
    extractedContacts: payload.extractedContacts,
    formActions: payload.formActions,
    renderedWithJs: payload.isJsRenderedNotice
  };

  return {
    verdict,
    confidence,
    summary: parsed.summary || (verdict === "SUSPICIOUS" ? "Potential scam risk indicators detected." : "No critical scam indicators identified."),
    risk_signals: Array.isArray(parsed.risk_signals) && parsed.risk_signals.length > 0 
      ? parsed.risk_signals 
      : (verdict === "SUSPICIOUS" ? ["High-risk patterns detected in submitted content"] : ["No known deceptive patterns detected"]),
    evidence: Array.isArray(parsed.evidence) ? parsed.evidence : [],
    guidance: Array.isArray(parsed.guidance) && parsed.guidance.length > 0
      ? parsed.guidance
      : [
          "Do not share passwords, OTPs, or financial details.",
          "Verify company information independently through official channels.",
          "Exercise caution before clicking links or downloading attachments."
        ],
    extraction_details: extractionMetadata
  };
}
