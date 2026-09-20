import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResponse, DossierOptions, IncidentDossier } from "../src/types.js";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateIncidentDossier(
  analysis: AnalysisResponse,
  options: DossierOptions
): Promise<IncidentDossier> {
  const jurisdiction = options.jurisdiction || "US";
  const victimName = options.victimName?.trim() || "[Victim / Account Holder Name]";
  const bankName = options.bankName?.trim() || "[Bank / Card Issuer Name]";
  const amountLost = options.amountLost?.trim() || "[Amount in Currency / e.g. $500]";
  const transactionRef = options.transactionRef?.trim() || "[UTR / Transaction ID / Ref #]";
  const incidentDate = options.incidentDate?.trim() || new Date().toISOString().split("T")[0];
  const targetEntity = analysis.extraction_details?.target || "Suspect Channel / Link";
  const suspectContact = options.suspectContact?.trim() || "Unknown handle / identified in evidence";
  const paymentMethod = options.paymentMethod?.trim() || "Electronic Transfer / Card / UPI";

  // Build key evidence bullet points for legal insertion
  const evidenceSummary = analysis.evidence
    .slice(0, 5)
    .map((e, idx) => `  ${idx + 1}. [${e.signal}]: ${e.evidence}`)
    .join("\n");

  const riskSignalsSummary = analysis.risk_signals.slice(0, 4).join(", ");

  // Identify registrar abuse email if domain exists
  let abuseEmailTarget = "abuse@domain-registrar.com";
  const domain = analysis.extraction_details?.domain;
  if (domain) {
    if (domain.endsWith(".xyz") || domain.endsWith(".top") || domain.endsWith(".club")) {
      abuseEmailTarget = "abuse@nic.xyz / abuse@namesilo.com";
    } else {
      abuseEmailTarget = `abuse@${domain.split(".").slice(-2).join(".")} or registrar-abuse`;
    }
  }

  // Attempt AI generation with fast model for nuanced legal narrative
  let aiDossier: any = null;
  try {
    const prompt = `
You are an expert financial fraud attorney, digital cybercrime investigator, and compliance officer.
Generate a structured, formal incident dossier for a victim of digital fraud/scam.

Case Details:
- Target/Link/Source: ${targetEntity}
- Suspected Category: ${analysis.detected_category || "Deceptive Cybercrime / Online Scam"}
- Confidence: ${analysis.confidence}% (${analysis.verdict})
- Impersonated Entity: ${analysis.forensics?.impersonated_entity || "Undisclosed / Mocked Official"}
- Risk Signals: ${riskSignalsSummary}
- Technical & Visual Evidence:
${evidenceSummary}

Victim Context:
- Victim Name: ${victimName}
- Bank / Financial Institution: ${bankName}
- Disputed Amount: ${amountLost}
- Transaction / Reference ID: ${transactionRef}
- Incident Date: ${incidentDate}
- Jurisdiction: ${jurisdiction} (US=United States IC3/CFPB, IN=India 1930/Cybercell/RBI, UK=Action Fraud/CRM Code, INTL=International/Interpol)
- Suspect Contact/Handle: ${suspectContact}
- Payment Channel: ${paymentMethod}

Requirements:
1. "bankDisputeLetter": A formal, assertive, legally grounded dispute letter for the victim's bank/payment provider demanding immediate recall, freeze, or chargeback. Cite statutory regulations (e.g., Regulation E / UCC for US, RBI Circular on Customer Liability for India, CRM Code for UK).
2. "cybercrimeComplaint": A comprehensive police/cybercell complaint narrative organized into chronological sections (Complainant, Accused / Fraudulent Medium, Modus Operandi, Transaction Chronology, Technical Forensics, Prayer / Requested Relief).
3. "takedownNotice": A standard RFC-compliant Abuse Takedown email to send to the domain registrar or hosting provider demanding immediate suspension of the fraudulent host/account under Anti-Phishing Terms of Service.
4. "legalStatutesCited": List of 2-4 actual statutes or regulatory rules cited.
`;

    const candidateModels = ["gemini-2.5-flash", "gemini-3.8-flash", "gemini-3.1-flash-lite"];
    for (const model of candidateModels) {
      try {
        const res = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            temperature: 0.15,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                bankDisputeLetter: { type: Type.STRING },
                cybercrimeComplaint: { type: Type.STRING },
                legalStatutesCited: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: [
                "bankDisputeLetter",
                "cybercrimeComplaint",
                "legalStatutesCited",
              ],
            },
          },
        });

        if (res.text) {
          aiDossier = JSON.parse(res.text);
          break;
        }
      } catch (innerErr: any) {
        console.warn(`Model ${model} was unavailable (${innerErr?.status || innerErr?.message || "transient error"}), trying next model or fallback...`);
      }
    }
  } catch (err: any) {
    console.warn("AI generation error for dossier, smoothly activating deterministic legal engine:", err?.message || err);
  }

  // If AI generation succeeded, enrich with emergency checklist
  if (aiDossier && aiDossier.bankDisputeLetter && aiDossier.cybercrimeComplaint) {
    return {
      bankDisputeLetter: aiDossier.bankDisputeLetter,
      cybercrimeComplaint: aiDossier.cybercrimeComplaint,
      takedownNotice: aiDossier.takedownNotice,
      abuseEmailTarget,
      legalStatutesCited: aiDossier.legalStatutesCited || getDefaultStatutes(jurisdiction),
      emergencyChecklist: getEmergencyChecklist(jurisdiction),
    };
  }

  // Fallback: Deterministic Legal Engine (Guarantees instant, flawless legal documentation)
  return generateDeterministicDossier({
    analysis,
    options,
    victimName,
    bankName,
    amountLost,
    transactionRef,
    incidentDate,
    targetEntity,
    suspectContact,
    paymentMethod,
    evidenceSummary,
    jurisdiction,
    abuseEmailTarget,
  });
}

function getDefaultStatutes(jurisdiction: string): string[] {
  switch (jurisdiction) {
    case "IN":
      return [
        "Section 66C & 66D, Information Technology Act, 2000 (Identity Theft & Cheating by Personation)",
        "Section 318(4) Bharatiya Nyaya Sanhita (BNS) / Section 420 Indian Penal Code (Cheating and Dishonestly Inducing Delivery of Property)",
        "RBI Circular DBR.No.Leg.BC.78/09.07.005/2017-18 (Customer Protection – Limiting Liability in Unauthorised Electronic Banking Transactions)",
      ];
    case "UK":
      return [
        "Payment Services Regulations 2017 (Regulations 76 & 77 - Unauthorized Payments)",
        "Contingent Reimbursement Model (CRM) Code for Authorised Push Payment (APP) Scams",
        "Fraud Act 2006 (Section 2 - Fraud by False Representation)",
      ];
    case "US":
      return [
        "Electronic Fund Transfer Act (EFTA) / Regulation E (12 CFR Part 1005)",
        "Uniform Commercial Code (UCC) § 4A-202 (Funds Transfers Security Procedures)",
        "Federal Trade Commission Act (15 U.S.C. § 45 - Unfair or Deceptive Acts or Practices)",
      ];
    default:
      return [
        "International Financial Consumer Protection Framework (G20/OECD Principles)",
        "VISA Core Rules / Mastercard Chargeback Guidelines (Condition 10.4 / Reason Code 4853 - Fraud / Deception)",
        "United Nations Convention against Transnational Organized Crime (Cybercrime provisions)",
      ];
  }
}

function getEmergencyChecklist(jurisdiction: string) {
  const helpline =
    jurisdiction === "IN"
      ? "National Cyber Crime Helpline: 1930 (or report online at cybercrime.gov.in)"
      : jurisdiction === "US"
      ? "FBI Internet Crime Complaint Center (ic3.gov) & FTC ReportFraud.ftc.gov"
      : jurisdiction === "UK"
      ? "Action Fraud: 0300 123 2040 (or actionfraud.police.uk)"
      : "National Police Financial Cyber Desk & Local Cybercrime Division";

  return [
    {
      phase: "Phase 1 (Immediate - 0 to 15 mins)",
      action: "Freeze Payment Method & Demand Transaction Recall",
      urgency: "immediate" as const,
      details:
        "Contact your bank's 24/7 Fraud Hotline or emergency card-blocking IVR immediately. Inform them the transaction was induced by fraudulent deception and demand a 'beneficiary account lien' before funds are withdrawn.",
    },
    {
      phase: "Phase 2 (Immediate - 15 to 45 mins)",
      action: `Lodge National Cybercrime Report (${helpline.split(":")[0]})`,
      urgency: "immediate" as const,
      details: `Call or lodge an online complaint via ${helpline}. Keep the generated Incident Acknowledgment Number handy to quote to your bank manager.`,
    },
    {
      phase: "Phase 3 (Within 2 hours)",
      action: "Submit Formal Bank Dispute Letter with Evidence Dossier",
      urgency: "within_1_hour" as const,
      details:
        "Send the generated Bank Dispute Letter along with this forensic report to your bank branch and grievance redressal officer via registered email to preserve your zero-liability rights.",
    },
    {
      phase: "Phase 4 (Within 24 hours)",
      action: "Credential Reset & Device Sanitization",
      urgency: "within_24_hours" as const,
      details:
        "If you entered passwords, OTPs, or downloaded remote desktop apps (AnyDesk, TeamViewer, RustDesk), immediately revoke active sessions, change banking passwords from a separate clean device, and scan for remote tooling.",
    },
  ];
}

function generateDeterministicDossier(params: {
  analysis: AnalysisResponse;
  options: DossierOptions;
  victimName: string;
  bankName: string;
  amountLost: string;
  transactionRef: string;
  incidentDate: string;
  targetEntity: string;
  suspectContact: string;
  paymentMethod: string;
  evidenceSummary: string;
  jurisdiction: string;
  abuseEmailTarget: string;
}): IncidentDossier {
  const {
    analysis,
    victimName,
    bankName,
    amountLost,
    transactionRef,
    incidentDate,
    targetEntity,
    suspectContact,
    paymentMethod,
    evidenceSummary,
    jurisdiction,
    abuseEmailTarget,
  } = params;

  let bankLetter = "";
  let complaint = "";
  let takedown = "";
  const statutes = getDefaultStatutes(jurisdiction);

  if (jurisdiction === "IN") {
    bankLetter = `To,
The Branch Manager / Nodal Fraud & Grievance Officer,
${bankName}

Date: ${incidentDate}
Subject: URGENT: Fraud Incident Notice, Disputed Electronic Transaction, and Request for Immediate Fund Recall / Beneficiary Account Freeze (Ref: ${transactionRef})

Respected Sir / Madam,

I am writing to formally report an unauthorized, fraudulent transaction orchestrated through cyber-enabled deception and financial impersonation.

TRANSACTION DETAILS:
- Account Holder: ${victimName}
- Disputed Transaction Amount: ${amountLost}
- Transaction / UTR Reference ID: ${transactionRef}
- Date & Approximate Time: ${incidentDate}
- Mode of Payment: ${paymentMethod}
- Beneficiary / Suspect Handle: ${suspectContact}
- Target Platform / Suspect URL: ${targetEntity}

INCIDENT SUMMARY & FORENSIC FINDINGS:
This transaction was unlawfully procured through an organized online fraud scheme [Category: ${
      analysis.detected_category || "Online Financial Scam"
    }]. Independent technical analysis confirmed the following high-risk indicators:
${evidenceSummary}

LEGAL AND REGULATORY CITATION:
As per Reserve Bank of India (RBI) Circular DBR.No.Leg.BC.78/09.07.005/2017-18 regarding "Customer Protection – Limiting Liability of Customers in Unauthorised Electronic Banking Transactions", I am lodging this complaint within the statutory window. Furthermore, Section 43A and Section 66D of the Information Technology Act, 2000 mandate strict institutional coordination to prevent cyber-fraud dissipation.

PRAYER / REQUESTED ACTIONS:
1. Immediately flag transaction ref ${transactionRef} as FRAUD and initiate an interbank SWIFT / IMPS / UPI recall through NPCI / beneficiary bank.
2. Mark a temporary debit freeze / lien on the recipient mule account to safeguard the disputed sum.
3. Provide me with the Formal Dispute Tracking / Token Number and furnish the recipient account details as required for Cybercrime Portal (1930) documentation.

I affirm that I am cooperating fully with law enforcement and will provide the National Cyber Crime Reporting Portal acknowledgment number upon registration.

Sincerely,
${victimName}
Email / Phone: [Your Contact Info]`;

    complaint = `OFFICIAL CYBERCRIME COMPLAINT NARRATIVE
(Standard Format for National Cyber Crime Reporting Portal / cybercrime.gov.in / Helpline 1930)

1. COMPLAINANT PARTICULARS:
   - Full Name: ${victimName}
   - Contact Number / Email: [Your Contact Details]
   - Bank / Financial Institution: ${bankName}

2. PARTICULARS OF THE ACCUSED / SUSPECT MEDIUM:
   - Suspect Channel / Handle: ${suspectContact}
   - Fraudulent Website / Link / App: ${targetEntity}
   - Impersonated Entity: ${analysis.forensics?.impersonated_entity || "Official Entity / Brand"}
   - Channel of Contact: ${analysis.forensics?.channel_analysis || "WhatsApp / Telegram / SMS / Web Link"}

3. NATURE OF CYBERCRIME & MODUS OPERANDI:
   - Offense Category: ${analysis.detected_category || "Online Fraud & Financial Impersonation"}
   - Relevant Offenses: Section 66C (Identity Theft), Section 66D (Cheating by personation using computer resource) of Information Technology Act 2000; Section 318(4) Bharatiya Nyaya Sanhita (BNS) / Sec 420 IPC.
   - Modus Operandi: The accused used fraudulent misrepresentation, deceptive psychological coercion, and counterfeit online artifacts to induce an electronic financial transfer under false pretenses.

4. TRANSACTION CHRONOLOGY:
   - Amount Defrauded: ${amountLost}
   - Transaction Reference / UTR: ${transactionRef}
   - Date of Transfer: ${incidentDate}
   - Payment Mechanism: ${paymentMethod}

5. TECHNICAL FORENSIC EVIDENCE:
   - Forensic Analysis Verdict: ${analysis.verdict} (${analysis.confidence}% Confidence)
${evidenceSummary}
   - Summary of Evidence: ${analysis.summary}

6. PRAYER TO LAW ENFORCEMENT:
   - It is respectfully requested to register an FIR / Cyber Incident Log against the accused.
   - Direct the relevant intermediary / payment aggregator to freeze the recipient bank/wallet account.
   - Issue Section 91 CrPC notices to the telecom provider and hosting registrar to identify the culprits.

Place: [Your City / State]
Date: ${incidentDate}
Complainant Signature / Submission`;
  } else {
    // US / UK / International Format
    bankLetter = `To: Fraud Dispute Department / Cardholder Services
Entity: ${bankName}
Date: ${incidentDate}
Subject: URGENT: Notice of Fraudulent Transaction & Claim for Chargeback / Fund Recall (Ref: ${transactionRef})

Dear Claims Specialist / Fraud Department,

I am writing to formally dispute the following unauthorized or deceitfully induced transaction on my account.

INCIDENT & DISPUTED TRANSACTION DETAILS:
- Account Holder Name: ${victimName}
- Disputed Amount: ${amountLost}
- Transaction / Reference ID: ${transactionRef}
- Date of Transaction: ${incidentDate}
- Method: ${paymentMethod}
- Merchant / Recipient Identifier: ${suspectContact}
- Associated Domain / Platform: ${targetEntity}

FACTUAL SUMMARY & TECHNICAL FRAUD PROOF:
The merchant or recipient in this transaction engaged in deceptive misrepresentation and fraud [Category: ${
      analysis.detected_category || "Deceptive Merchant Fraud"
    }]. Forensic review of the transaction channel revealed critical risk signals:
${evidenceSummary}

APPLICABLE REGULATIONS & STATUTORY RIGHTS:
- Disputed under ${statutes[0]} and merchant deception chargeback provisions.
- As the consumer, I acted in good faith upon fraudulent communications and am notifying you within the prescribed notice period.

ACTION REQUESTED:
1. Immediately issue a temporary or provisional credit in the amount of ${amountLost} pending dispute resolution.
2. Initiate a formal chargeback or interbank wire/ACH recall to reverse funds from the recipient processing bank.
3. Block any subsequent recurring debits or authorization requests from this fraudulent entity.

Thank you for your prompt action on this matter.

Sincerely,
${victimName}`;

    complaint = `INCIDENT REPORT FOR CYBERCRIME LAW ENFORCEMENT
(Standard Schema for FBI IC3 / FTC / UK Action Fraud / Interpol Financial Cyber Unit)

I. INCIDENT METADATA:
   - Reporting Date: ${incidentDate}
   - Primary Offense Category: ${analysis.detected_category || "Online Impersonation & Financial Fraud"}
   - Forensic Threat Level: ${analysis.verdict} (${analysis.confidence}% Confidence)

II. VICTIM INFORMATION:
   - Full Legal Name: ${victimName}
   - Financial Institution: ${bankName}
   - Disputed Sum: ${amountLost}
   - Transaction Identifier: ${transactionRef}

III. SUSPECT INFORMATION & CHANNELS:
   - Fraudulent Entity / URL: ${targetEntity}
   - Accused Identifier / Phone / Email / Handle: ${suspectContact}
   - Purported Entity Impersonated: ${analysis.forensics?.impersonated_entity || "Official Entity"}

IV. FORENSIC EXHIBITS & RISK SIGNALS:
${evidenceSummary}
   - Forensic Narrative: ${analysis.summary}

V. LEGAL STATUTES GOVERNING COMPLAINT:
   ${statutes.map((s) => `- ${s}`).join("\n   ")}

VI. RELIEF SOUGHT:
   - Formal intake and logging for intelligence collation and recipient account tracing.
   - Coordination with financial compliance desks to disrupt mule accounts and assist victim restitution.`;
  }

  takedown = `From: ${victimName} <victim-alert@fraud-reporting.net>
To: ${abuseEmailTarget}
Subject: URGENT: Phishing & Fraud Abuse Takedown Notification - Host: ${targetEntity}

Dear Abuse & Compliance Team,

Pursuant to your Acceptable Use Policy (AUP) and standard anti-phishing compliance mandates, I am providing formal notification that the following domain/host under your administration is actively facilitating deceptive cybercrime and unauthorized financial solicitation:

SUSPICIOUS RESOURCE:
- Target URL / Domain: ${targetEntity}
- Modus Operandi: ${analysis.detected_category || "Phishing / Task & Deposit Scam"}
- Impersonated Entity: ${analysis.forensics?.impersonated_entity || "Generic Brand / Entity"}

TECHNICAL EVIDENCE & FORENSIC SIGNALS:
${evidenceSummary}

REQUESTED ENFORCEMENT ACTION:
In order to mitigate active financial harm to the public:
1. Immediately suspend DNS resolution / hosting service for the offending host.
2. Preserve server access logs, registration information, and IP access timestamps for law enforcement subpoena.
3. Confirm receipt of this abuse ticket.

Thank you for your vigilance in maintaining internet safety.

Sincerely,
${victimName}`;

  return {
    bankDisputeLetter: bankLetter,
    cybercrimeComplaint: complaint,
    takedownNotice: takedown,
    abuseEmailTarget,
    legalStatutesCited: statutes,
    emergencyChecklist: getEmergencyChecklist(jurisdiction),
  };
}
