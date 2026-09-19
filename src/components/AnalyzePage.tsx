import React, { useState, useRef } from "react";
import { ArrowRight, Loader2, AlertCircle, Check } from "lucide-react";

interface AnalyzePageProps {
  onAnalyzeUrl: (url: string) => Promise<void>;
  onAnalyzeUpload: (data: { fileName: string; fileType: string; base64Data?: string; textContent?: string }) => Promise<void>;
  isLoading: boolean;
  activeProgressStage: number; // 1, 2, 3, 4
}

export const AnalyzePage: React.FC<AnalyzePageProps> = ({
  onAnalyzeUrl,
  onAnalyzeUpload,
  isLoading,
  activeProgressStage,
}) => {
  const [url, setUrl] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [showFileUpload, setShowFileUpload] = useState<boolean>(false);

  // File upload state
  const [selectedFile, setSelectedFile] = useState<{
    file: File;
    previewUrl?: string;
    isImage: boolean;
  } | null>(null);
  const [pastedText, setPastedText] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    if (!url.trim()) {
      setErrorMessage("Please enter a website URL to check.");
      return;
    }
    onAnalyzeUrl(url.trim());
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage("");
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const isImage = file.type.startsWith("image/");
      const previewUrl = isImage ? URL.createObjectURL(file) : undefined;
      setSelectedFile({ file, previewUrl, isImage });
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setErrorMessage("");
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const isImage = file.type.startsWith("image/");
      const previewUrl = isImage ? URL.createObjectURL(file) : undefined;
      setSelectedFile({ file, previewUrl, isImage });
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!selectedFile && !pastedText.trim()) {
      setErrorMessage("Please select a file or paste message text to analyze.");
      return;
    }

    if (selectedFile) {
      const reader = new FileReader();
      if (selectedFile.isImage) {
        reader.onload = () => {
          const base64 = reader.result as string;
          onAnalyzeUpload({
            fileName: selectedFile.file.name,
            fileType: selectedFile.file.type,
            base64Data: base64,
            textContent: pastedText.trim() || undefined,
          });
        };
        reader.readAsDataURL(selectedFile.file);
      } else {
        reader.onload = () => {
          const text = reader.result as string;
          onAnalyzeUpload({
            fileName: selectedFile.file.name,
            fileType: selectedFile.file.type || "text/plain",
            textContent: (text + "\n\n" + pastedText).trim(),
          });
        };
        reader.readAsText(selectedFile.file);
      }
    } else {
      onAnalyzeUpload({
        fileName: "pasted_message.txt",
        fileType: "text/plain",
        textContent: pastedText.trim(),
      });
    }
  };

  const stages = [
    { num: 1, title: "Fetching webpage" },
    { num: 2, title: "Extracting content" },
    { num: 3, title: "Analyzing evidence" },
    { num: 4, title: "Preparing result" },
  ];

  return (
    <div className="w-full max-w-xl mx-auto py-10 sm:py-16 space-y-8" id="analyze-page">
      {/* Page Title and instructions */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
          Analyze a Website
        </h1>
        <p className="text-sm text-slate-600">
          Paste the URL you want to check.
        </p>
      </div>

      {/* Main Interaction Section */}
      <div className="bg-white border border-slate-200 rounded p-6 sm:p-8 space-y-6">
        {!showFileUpload ? (
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
                placeholder="Paste website URL"
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
          /* File / Message Upload Form */
          <form onSubmit={handleUploadSubmit} className="space-y-4" id="upload-submit-form">
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border border-dashed border-slate-300 hover:border-slate-400 rounded p-6 text-center cursor-pointer transition-colors bg-slate-50/50"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.txt,.pdf,.eml"
                onChange={handleFileChange}
                className="hidden"
              />
              {selectedFile ? (
                <div className="flex items-center justify-center gap-3">
                  {selectedFile.isImage && selectedFile.previewUrl && (
                    <img
                      src={selectedFile.previewUrl}
                      alt="Preview"
                      className="w-12 h-12 object-cover rounded border border-slate-200"
                    />
                  )}
                  <div className="text-left">
                    <p className="text-sm font-medium text-slate-900">{selectedFile.file.name}</p>
                    <p className="text-xs text-slate-500">
                      {(selectedFile.file.size / 1024).toFixed(1)} KB &bull; Click to replace
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-700">
                    Click or drag file here
                  </p>
                  <p className="text-xs text-slate-500">
                    PNG, JPG, WEBP screenshots, or text documents
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="message-text" className="block text-xs font-medium text-slate-600">
                Or paste text from a suspicious message:
              </label>
              <textarea
                id="message-text"
                rows={3}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="e.g., 'Registration fee of ₹999 required before interview...'"
                className="w-full p-3 text-sm border border-slate-300 rounded text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-slate-900"
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
                    <span>Analyze Content</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Secondary upload toggle */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Supported: URLs, domain checks, screenshots</span>
          <button
            type="button"
            onClick={() => { setShowFileUpload(!showFileUpload); setErrorMessage(""); }}
            className="text-slate-700 hover:text-slate-950 font-medium underline underline-offset-2 cursor-pointer"
          >
            {showFileUpload ? "Switch to URL input" : "Upload document or image instead"}
          </button>
        </div>
      </div>

      {/* Progress State During Processing */}
      {isLoading && (
        <div className="bg-white border border-slate-200 rounded p-5 sm:p-6 space-y-3" id="analysis-progress-state">
          <div className="text-xs font-mono uppercase text-slate-400 font-semibold tracking-wide">
            Analysis Progress
          </div>

          <div className="space-y-1 pt-1">
            {stages.map((stage, idx) => {
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

                  {idx < stages.length - 1 && (
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

