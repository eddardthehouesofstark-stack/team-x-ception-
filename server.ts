import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { fetchAndExtractUrl, runScamAnalysisOnEvidence } from "./server/analyzer.js";

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Body parsing with generous limit for document/image uploads
  app.use(express.json({ limit: "25mb" }));
  app.use(express.urlencoded({ extended: true, limit: "25mb" }));

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // 1. URL Analysis Endpoint
  // Pipeline: URL -> Backend HTTP request -> Fetch webpage HTML -> Parse HTML with Cheerio
  // -> Extract relevant visible text & metadata -> Clean extracted content -> Collect domain signals
  // -> Send structured evidence to AI -> Validate and return structured JSON
  app.post("/api/analyze-url", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url || typeof url !== "string" || !url.trim()) {
        res.status(400).json({ error: "Please provide a valid website URL." });
        return;
      }

      // Step 1: Perform real backend HTTP fetch and HTML extraction
      const extracted = await fetchAndExtractUrl(url.trim());

      // Step 2: Send structured extracted evidence to Gemini for scam/fraud verification
      const analysisResult = await runScamAnalysisOnEvidence({
        sourceType: "url",
        target: extracted.url,
        fetchStatus: extracted.fetchStatus,
        fetchError: extracted.fetchError,
        pageTitle: extracted.pageTitle,
        metaDescription: extracted.metaDescription,
        extractedText: extracted.extractedText,
        domainSignals: extracted.domainSignals,
        extractedContacts: extracted.extractedContacts,
        formActions: extracted.formActions,
        isJsRenderedNotice: extracted.isJsRenderedNotice
      });

      res.json(analysisResult);
    } catch (err: any) {
      console.error("Error in /api/analyze-url:", err);
      res.status(500).json({
        error: err.message || "Failed to analyze URL.",
        verdict: "SUSPICIOUS",
        confidence: 50,
        summary: "Analysis failed due to a server error. Proceed with extreme caution.",
        risk_signals: ["Server could not verify content safely: " + (err.message || "Unknown error")],
        evidence: [],
        guidance: ["Do not proceed or submit sensitive credentials until the target can be verified independently."]
      });
    }
  });

  // 2. Document / Image Upload Analysis Endpoint
  // For screenshots of suspicious emails, fake job offers, scam messages, PDF/text docs
  app.post("/api/analyze-upload", async (req, res) => {
    try {
      const { fileName, fileType, base64Data, textContent } = req.body;

      if (!base64Data && !textContent) {
        res.status(400).json({ error: "Please upload an image, document, or provide text content." });
        return;
      }

      const isImage = 
        fileType?.startsWith("image/") || 
        /\.(png|jpe?g|webp|gif|bmp|heic|heif|avif|tiff)$/i.test(fileName || "") ||
        (typeof base64Data === "string" && base64Data.startsWith("data:image/"));

      let analysisResult;
      if (isImage && base64Data) {
        let mimeType = fileType;
        if (typeof base64Data === "string") {
          const match = base64Data.match(/^data:(image\/[a-zA-Z0-9.+_-]+);base64,/);
          if (match) {
            mimeType = match[1];
          }
        }
        if (!mimeType || !mimeType.startsWith("image/")) {
          if (/\.jpe?g$/i.test(fileName || "")) mimeType = "image/jpeg";
          else if (/\.webp$/i.test(fileName || "")) mimeType = "image/webp";
          else if (/\.gif$/i.test(fileName || "")) mimeType = "image/gif";
          else mimeType = "image/png";
        }

        // Clean base64 header if included and strip all whitespace/newlines
        const cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, "").replace(/[\r\n\s]/g, "");

        analysisResult = await runScamAnalysisOnEvidence({
          sourceType: "image",
          target: fileName || "uploaded_image",
          extractedText: textContent || "Visual image evidence provided for fraud, scam, and impersonation detection.",
          fetchStatus: "not_applicable",
          imageData: {
            mimeType,
            base64: cleanBase64
          }
        });
      } else {
        // Plain text or document
        analysisResult = await runScamAnalysisOnEvidence({
          sourceType: "document",
          target: fileName || "uploaded_document",
          extractedText: textContent || "",
          fetchStatus: "not_applicable"
        });
      }

      res.json(analysisResult);
    } catch (err: any) {
      console.error("Error in /api/analyze-upload:", err);
      res.status(500).json({
        error: err.message || "Failed to analyze uploaded content.",
        verdict: "SUSPICIOUS",
        confidence: 50,
        summary: "Analysis encountered an error. Proceed with extreme caution.",
        risk_signals: ["File could not be fully parsed: " + (err.message || "Unknown error")],
        evidence: [],
        guidance: ["Do not trust unverified documents or follow suspicious payment instructions."]
      });
    }
  });

  // Vite middleware for development vs static build in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Fraud and Scam Detection server listening at http://0.0.0.0:${PORT}`);
  });
}

startServer();
