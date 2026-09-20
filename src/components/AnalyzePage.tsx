import React, { useState, useRef, useEffect } from "react";
import { ArrowRight, Loader2, AlertCircle, Check, Globe, Image as ImageIcon, Upload, X, ShieldAlert } from "lucide-react";

interface AnalyzePageProps {
  onAnalyzeUrl: (url: string) => Promise<void>;
  onAnalyzeUpload: (data: { fileName: string; fileType: string; base64Data?: string; textContent?: string }) => Promise<void>;
  isLoading: boolean;
  activeProgressStage: number; // 1, 2, 3, 4
}

// Canvas-based image optimizer to keep large screenshots under 2MB while preserving crisp text
async function processImageFile(file: File): Promise<{ base64: string; mimeType: string; previewUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.onerror = () => {
        const mime = file.type || "image/png";
        resolve({ base64: dataUrl, mimeType: mime, previewUrl: dataUrl });
      };
      img.onload = () => {
        const MAX_DIM = 2000;
        let width = img.width;
        let height = img.height;

        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const optimized = canvas.toDataURL("image/jpeg", 0.92);
            resolve({ base64: optimized, mimeType: "image/jpeg", previewUrl: optimized });
            return;
          }
        }
        resolve({ base64: dataUrl, mimeType: file.type || "image/png", previewUrl: dataUrl });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

// Creates a realistic simulated scam screenshot canvas for immediate testing
function generateSampleScamScreenshot(): { base64: string; fileName: string } {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 420;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return {
      base64: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      fileName: "sample_scam_chat.png"
    };
  }

  // Telegram/WhatsApp style chat background
  ctx.fillStyle = "#EFEAE2";
  ctx.fillRect(0, 0, 640, 420);

  // Top header bar
  ctx.fillStyle = "#075E54";
  ctx.fillRect(0, 0, 640, 60);
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 16px sans-serif";
  ctx.fillText("Global Recruitment HR @Official_Career_Desk", 20, 36);

  // Chat message bubble 1
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.roundRect(30, 80, 520, 160, 10);
  ctx.fill();

  ctx.fillStyle = "#111827";
  ctx.font = "14px sans-serif";
  ctx.fillText("👋 Hello! We found your profile on LinkedIn / Naukri.", 45, 110);
  ctx.fillText("PART-TIME ONLINE WORK: Earn ₹3,000 - ₹8,000 per day!", 45, 135);
  ctx.fillText("Job Task: Simply like and subscribe to 5 YouTube merchant videos.", 45, 160);
  ctx.fillText("No experience needed. Daily instant payouts via UPI / GPay.", 45, 185);
  ctx.fillStyle = "#6B7280";
  ctx.font = "11px sans-serif";
  ctx.fillText("10:42 AM", 490, 225);

  // Chat message bubble 2 (Urgency & Fee Demand)
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.roundRect(30, 260, 540, 130, 10);
  ctx.fill();

  ctx.fillStyle = "#DC2626";
  ctx.font = "bold 13px sans-serif";
  ctx.fillText("⚠️ MANDATORY ONBOARDING REQUIREMENT:", 45, 290);
  ctx.fillStyle = "#111827";
  ctx.font = "13px sans-serif";
  ctx.fillText("A refundable merchant deposit of ₹999 is required before your first task.", 45, 315);
  ctx.fillText("Send payment screenshot to @vip_agent_task_bot to unlock your tasks immediately!", 45, 340);
  ctx.fillStyle = "#6B7280";
  ctx.font = "11px sans-serif";
  ctx.fillText("10:44 AM", 510, 375);

  return {
    base64: canvas.toDataURL("image/png"),
    fileName: "fake_job_telegram_scam.png"
  };
}

export const AnalyzePage: React.FC<AnalyzePageProps> = ({
  onAnalyzeUrl,
  onAnalyzeUpload,
  isLoading,
  activeProgressStage,
}) => {
  const [activeTab, setActiveTab] = useState<"url" | "image">("url");
  const [url, setUrl] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  // File upload state
  const [selectedFile, setSelectedFile] = useState<{
    file?: File;
    name: string;
    previewUrl?: string;
    isImage: boolean;
    base64?: string;
    sizeKb?: number;
  } | null>(null);
  const [pastedText, setPastedText] = useState<string>("");
  const [isProcessingFile, setIsProcessingFile] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Listen for clipboard paste on window (Ctrl+V / Cmd+V screenshot paste)
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      if (activeTab !== "image") return;
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf("image") !== -1) {
          const blob = item.getAsFile();
          if (blob) {
            e.preventDefault();
            setErrorMessage("");
            setIsProcessingFile(true);
            try {
              const { base64, previewUrl } = await processImageFile(blob);
              setSelectedFile({
                file: blob,
                name: `pasted_screenshot_${Date.now()}.png`,
                previewUrl,
                isImage: true,
                base64,
                sizeKb: Math.round(blob.size / 1024)
              });
            } catch {
              setErrorMessage("Failed to process pasted screenshot.");
            } finally {
              setIsProcessingFile(false);
            }
            break;
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [activeTab]);

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    if (!url.trim()) {
      setErrorMessage("Please enter a website URL to check.");
      return;
    }
    onAnalyzeUrl(url.trim());
  };

  const handleSelectedFileObj = async (file: File) => {
    setErrorMessage("");
    setIsProcessingFile(true);

    const isImg = 
      file.type.startsWith("image/") || 
      /\.(png|jpe?g|webp|gif|bmp|svg|avif|heic|heif)$/i.test(file.name);

    if (isImg) {
      try {
        const { base64, previewUrl } = await processImageFile(file);
        setSelectedFile({
          file,
          name: file.name,
          previewUrl,
          isImage: true,
          base64,
          sizeKb: Math.round(file.size / 1024)
        });
      } catch (err) {
        console.error("Image processing error:", err);
        setErrorMessage("Failed to read image. Please try another file.");
      } finally {
        setIsProcessingFile(false);
      }
    } else {
      // Plain text or document
      setSelectedFile({
        file,
        name: file.name,
        isImage: false,
        sizeKb: Math.round(file.size / 1024)
      });
      setIsProcessingFile(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleSelectedFileObj(e.target.files[0]);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleSelectedFileObj(e.dataTransfer.files[0]);
    }
  };

  const loadSampleScreenshot = () => {
    setErrorMessage("");
    const sample = generateSampleScamScreenshot();
    setSelectedFile({
      name: sample.fileName,
      previewUrl: sample.base64,
      isImage: true,
      base64: sample.base64,
      sizeKb: 35
    });
    setPastedText("Received on Telegram from an unknown recruitment agent offering daily salary for YouTube tasks.");
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!selectedFile && !pastedText.trim()) {
      setErrorMessage("Please select a screenshot or paste message text to analyze.");
      return;
    }

    if (selectedFile?.isImage && selectedFile.base64) {
      await onAnalyzeUpload({
        fileName: selectedFile.name,
        fileType: selectedFile.file?.type || "image/png",
        base64Data: selectedFile.base64,
        textContent: pastedText.trim() || undefined,
      });
    } else if (selectedFile?.file && !selectedFile.isImage) {
      const reader = new FileReader();
      reader.onload = async () => {
        const text = reader.result as string;
        await onAnalyzeUpload({
          fileName: selectedFile.name,
          fileType: selectedFile.file?.type || "text/plain",
          textContent: (text + "\n\n" + pastedText).trim(),
        });
      };
      reader.readAsText(selectedFile.file);
    } else {
      await onAnalyzeUpload({
        fileName: "pasted_message.txt",
        fileType: "text/plain",
        textContent: pastedText.trim(),
      });
    }
  };

  const urlStages = [
    { num: 1, title: "Fetching webpage" },
    { num: 2, title: "Extracting content" },
    { num: 3, title: "Analyzing evidence" },
    { num: 4, title: "Preparing result" },
  ];

  const imageStages = [
    { num: 1, title: "Processing visual evidence" },
    { num: 2, title: "Extracting OCR text & graphic signals" },
    { num: 3, title: "Analyzing for scam, tampering & impersonation" },
    { num: 4, title: "Compiling forensic report" },
  ];

  const currentStages = activeTab === "url" ? urlStages : imageStages;

  return (
    <div className="w-full max-w-xl mx-auto py-10 sm:py-16 space-y-8" id="analyze-page">
      {/* Page Title */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
          {activeTab === "url" ? "Analyze a Website" : "Image & Screenshot Forensics"}
        </h1>
        <p className="text-sm text-slate-600">
          {activeTab === "url"
            ? "Paste the URL you want to inspect for phishing, scams, or clone domains."
            : "Upload screenshots of suspicious chats, fake receipts, warrants, or job offers."}
        </p>
      </div>

      {/* Main Interaction Section */}
      <div className="bg-white border border-slate-200 rounded p-6 sm:p-8 space-y-6 shadow-xs">
        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg text-sm font-medium">
          <button
            type="button"
            id="tab-url-mode"
            onClick={() => { setActiveTab("url"); setErrorMessage(""); }}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md transition-all cursor-pointer ${
              activeTab === "url"
                ? "bg-white text-slate-900 shadow-xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Check Website URL</span>
          </button>
          <button
            type="button"
            id="tab-image-mode"
            onClick={() => { setActiveTab("image"); setErrorMessage(""); }}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md transition-all cursor-pointer ${
              activeTab === "image"
                ? "bg-white text-slate-900 shadow-xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Upload Screenshot / Image</span>
          </button>
        </div>

        {activeTab === "url" ? (
          /* Primary URL Input */
          <form onSubmit={handleUrlSubmit} className="space-y-4" id="url-submit-form">
            <div className="space-y-1.5">
              <label htmlFor="url-input" className="sr-only">
                Paste website URL
              </label>
              <input
                id="url-input"
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isLoading}
                placeholder="https://example.com or domain name"
                className="w-full px-4 py-3 text-base border border-slate-300 rounded text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-slate-900 transition-colors"
                autoFocus
              />
            </div>

            {errorMessage && (
              <div className="flex items-center gap-2 text-sm text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2 rounded">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Quick samples for tester convenience */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>Try:</span>
              <button
                type="button"
                onClick={() => { setUrl("https://en.wikipedia.org/wiki/Phishing"); setErrorMessage(""); }}
                className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                Safe URL (Wikipedia)
              </button>
              <button
                type="button"
                onClick={() => { setUrl("http://paypal-verification-account-security.xyz/login"); setErrorMessage(""); }}
                className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                Phishing domain
              </button>
            </div>

            {/* Primary Action Button */}
            <div className="pt-2">
              <button
                id="analyze-url-btn"
                type="submit"
                disabled={isLoading}
                className="w-full h-11 px-5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-medium text-sm rounded flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-300" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <span>Analyze URL</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* File / Screenshot Upload Form */
          <form onSubmit={handleUploadSubmit} className="space-y-4" id="upload-submit-form">
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              onClick={() => !selectedFile && fileInputRef.current?.click()}
              className={`border border-dashed rounded-lg p-6 text-center transition-colors ${
                selectedFile
                  ? "border-slate-300 bg-slate-50"
                  : "border-slate-300 hover:border-slate-400 bg-slate-50/50 cursor-pointer"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.txt,.pdf,.eml"
                onChange={handleFileChange}
                className="hidden"
              />

              {isProcessingFile ? (
                <div className="flex flex-col items-center justify-center py-4 gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-700" />
                  <p className="text-xs text-slate-600">Processing &amp; optimizing image resolution...</p>
                </div>
              ) : selectedFile ? (
                <div className="flex items-center justify-between gap-4 p-2">
                  <div className="flex items-center gap-3 min-w-0">
                    {selectedFile.isImage && selectedFile.previewUrl ? (
                      <img
                        src={selectedFile.previewUrl}
                        alt="Preview"
                        className="w-16 h-16 object-cover rounded border border-slate-200 shrink-0 bg-white"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded bg-slate-200 flex items-center justify-center shrink-0">
                        <Upload className="w-5 h-5 text-slate-600" />
                      </div>
                    )}
                    <div className="text-left truncate">
                      <p className="text-sm font-semibold text-slate-900 truncate">{selectedFile.name}</p>
                      <p className="text-xs text-slate-500">
                        {selectedFile.sizeKb ? `${selectedFile.sizeKb} KB` : "Ready"} &bull; Visual OCR &amp; Forensics Enabled
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer shrink-0"
                    title="Remove file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2 py-2">
                  <div className="w-10 h-10 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      Click to upload or drag screenshot here
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Or press <kbd className="px-1.5 py-0.5 bg-slate-200 rounded text-slate-700 font-mono text-[11px]">Ctrl+V</kbd> to paste clipboard screenshot
                    </p>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    WhatsApp/Telegram chats, fake payment receipts, digital arrest warrants, job offers (PNG, JPG, WEBP)
                  </p>
                </div>
              )}
            </div>

            {/* Quick Sample Button for testing */}
            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <span>Need a sample to test?</span>
              <button
                type="button"
                onClick={loadSampleScreenshot}
                className="text-slate-900 hover:underline font-medium cursor-pointer"
              >
                Load Sample Scam Screenshot
              </button>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="message-text" className="block text-xs font-medium text-slate-700">
                Optional: Add context or paste suspicious message text:
              </label>
              <textarea
                id="message-text"
                rows={2}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="e.g., 'Received from unknown number demanding registration fee before interview...'"
                className="w-full p-2.5 text-sm border border-slate-300 rounded text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-slate-900"
              />
            </div>

            {errorMessage && (
              <div className="flex items-center gap-2 text-sm text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2 rounded">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="pt-2">
              <button
                id="analyze-upload-btn"
                type="submit"
                disabled={isLoading || isProcessingFile}
                className="w-full h-11 px-5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-medium text-sm rounded flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-300" />
                    <span>Analyzing Image...</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-4 h-4" />
                    <span>Analyze Image &amp; Forensics</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Progress State During Processing */}
      {isLoading && (
        <div className="bg-white border border-slate-200 rounded p-5 sm:p-6 space-y-3" id="analysis-progress-state">
          <div className="text-xs font-mono uppercase text-slate-400 font-semibold tracking-wide">
            Analysis Progress
          </div>

          <div className="space-y-1 pt-1">
            {currentStages.map((stage, idx) => {
              const isCompleted = activeProgressStage > stage.num;
              const isCurrent = activeProgressStage === stage.num;

              return (
                <React.Fragment key={stage.num}>
                  <div
                    className={`flex items-center gap-3 py-1 text-sm ${
                      isCurrent
                        ? "text-slate-950 font-medium"
                        : isCompleted
                        ? "text-slate-800"
                        : "text-slate-400"
                    }`}
                  >
                    <div className="w-4 h-4 flex items-center justify-center shrink-0">
                      {isCompleted ? (
                        <Check className="w-3.5 h-3.5 text-slate-900 stroke-[2.5]" />
                      ) : isCurrent ? (
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                      ) : (
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                      )}
                    </div>
                    <span>{stage.title}</span>
                  </div>

                  {idx < currentStages.length - 1 && (
                    <div className="pl-1.5 py-0.5 text-slate-300 text-xs leading-none select-none">
                      ↓
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};


