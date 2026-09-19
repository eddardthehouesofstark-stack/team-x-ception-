import React, { useState, useRef } from "react";
import { Globe, Upload, FileText, ArrowRight, Loader2, Image as ImageIcon, AlertCircle } from "lucide-react";

interface SubmitSectionProps {
  onAnalyzeUrl: (url: string) => Promise<void>;
  onAnalyzeUpload: (data: { fileName: string; fileType: string; base64Data?: string; textContent?: string }) => Promise<void>;
  isLoading: boolean;
  loadingStep: string;
}

export const SubmitSection: React.FC<SubmitSectionProps> = ({
  onAnalyzeUrl,
  onAnalyzeUpload,
  isLoading,
  loadingStep,
}) => {
  const [tab, setTab] = useState<"url" | "file">("url");
  const [url, setUrl] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

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
      setErrorMessage("Please enter a website URL to evaluate.");
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
      setErrorMessage("Please select a file or paste suspicious message text to analyze.");
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
            textContent: pastedText.trim() || undefined
          });
        };
        reader.readAsDataURL(selectedFile.file);
      } else {
        // Read text from text/document file
        reader.onload = () => {
          const text = reader.result as string;
          onAnalyzeUpload({
            fileName: selectedFile.file.name,
            fileType: selectedFile.file.type || "text/plain",
            textContent: (text + "\n\n" + pastedText).trim()
          });
        };
        reader.readAsText(selectedFile.file);
      }
    } else {
      // Just pasted text
      onAnalyzeUpload({
        fileName: "pasted_suspicious_message.txt",
        fileType: "text/plain",
        textContent: pastedText.trim()
      });
    }
  };

  const setSampleUrl = (sampleUrl: string) => {
    setTab("url");
    setUrl(sampleUrl);
    setErrorMessage("");
  };

  const setSampleText = (text: string) => {
    setTab("file");
    setSelectedFile(null);
    setPastedText(text);
    setErrorMessage("");
  };

  return (
    <section className="w-full bg-white border border-stone-200 rounded-xl p-6 sm:p-8 shadow-xs" id="submit-section">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-stone-900 tracking-tight">
          1. Submit Target for Inspection
        </h2>
        <p className="text-sm text-stone-600 mt-1">
          The backend will fetch the actual webpage HTML, extract visible text and metadata, evaluate domain signals, and verify risk evidence.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stone-200 mb-6 gap-6">
        <button
          id="tab-url"
          type="button"
          onClick={() => { setTab("url"); setErrorMessage(""); }}
          className={`pb-3 text-sm font-medium transition-colors flex items-center gap-2 relative ${
            tab === "url"
              ? "text-stone-900 border-b-2 border-stone-900 font-semibold"
              : "text-stone-500 hover:text-stone-700"
          }`}
        >
          <Globe className="w-4 h-4" />
          Website URL
        </button>

        <button
          id="tab-file"
          type="button"
          onClick={() => { setTab("file"); setErrorMessage(""); }}
          className={`pb-3 text-sm font-medium transition-colors flex items-center gap-2 relative ${
            tab === "file"
              ? "text-stone-900 border-b-2 border-stone-900 font-semibold"
              : "text-stone-500 hover:text-stone-700"
          }`}
        >
          <FileText className="w-4 h-4" />
          Document / Screenshot / Message
        </button>
      </div>

      {/* URL Input Form */}
      {tab === "url" ? (
        <form onSubmit={handleUrlSubmit} className="space-y-4" id="url-submit-form">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-stone-400">
              <Globe className="w-5 h-5" />
            </div>
            <input
              id="url-input"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isLoading}
              placeholder="Enter or paste full website URL (e.g. https://example.com or suspicious-bank-login.xyz)"
              className="w-full pl-11 pr-4 py-3.5 text-base border border-stone-300 rounded-lg text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-all"
            />
          </div>

          {errorMessage && (
            <div className="flex items-center gap-2 text-sm text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2 rounded-md">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
            {/* Quick test samples */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-stone-500">Quick Test:</span>
              <button
                type="button"
                onClick={() => setSampleUrl("https://en.wikipedia.org/wiki/Phishing")}
                className="text-xs px-2.5 py-1 rounded bg-stone-100 text-stone-700 hover:bg-stone-200 transition-colors"
              >
                Safe URL (Wikipedia)
              </button>
              <button
                type="button"
                onClick={() => setSampleUrl("http://paypal-verification-account-security.xyz/login")}
                className="text-xs px-2.5 py-1 rounded bg-stone-100 text-stone-700 hover:bg-stone-200 transition-colors"
              >
                Phishing Domain (.xyz)
              </button>
            </div>

            <button
              id="analyze-url-btn"
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto px-6 py-3 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-400 text-white font-medium text-sm rounded-lg flex items-center justify-center gap-2 transition-colors shadow-xs"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <span>Analyze Website</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        /* Document / Image Form */
        <form onSubmit={handleUploadSubmit} className="space-y-4" id="upload-submit-form">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-stone-300 hover:border-stone-400 rounded-lg p-6 text-center cursor-pointer transition-colors bg-stone-50/50"
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
                {selectedFile.isImage && selectedFile.previewUrl ? (
                  <img
                    src={selectedFile.previewUrl}
                    alt="Preview"
                    className="w-16 h-16 object-cover rounded border border-stone-200"
                  />
                ) : (
                  <FileText className="w-8 h-8 text-stone-600" />
                )}
                <div className="text-left">
                  <p className="text-sm font-medium text-stone-900">{selectedFile.file.name}</p>
                  <p className="text-xs text-stone-500">
                    {(selectedFile.file.size / 1024).toFixed(1)} KB &bull; Click to change file
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center mx-auto text-stone-600">
                  <Upload className="w-5 h-5" />
                </div>
                <p className="text-sm font-medium text-stone-700">
                  Click or drag and drop suspicious screenshot or document
                </p>
                <p className="text-xs text-stone-500">
                  Supports PNG, JPG, WEBP screenshots, TXT, or PDF documents
                </p>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="message-text" className="block text-xs font-medium text-stone-700 mb-1.5">
              Or paste suspicious email / SMS / offer text directly:
            </label>
            <textarea
              id="message-text"
              rows={3}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="e.g. 'Congratulations! You have been selected for Google Remote Specialist. Pay ₹999 security deposit to confirm your interview slot...'"
              className="w-full p-3 text-sm border border-stone-300 rounded-lg text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent"
            />
          </div>

          {errorMessage && (
            <div className="flex items-center gap-2 text-sm text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2 rounded-md">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-stone-500">Quick Test:</span>
              <button
                type="button"
                onClick={() => setSampleText("URGENT: Your Netflix membership will be terminated in 12 hours due to payment failure. Click here immediately to update credit card details: http://netflix-secure-billing-update.top/account")}
                className="text-xs px-2.5 py-1 rounded bg-stone-100 text-stone-700 hover:bg-stone-200 transition-colors"
              >
                Sample Phishing SMS
              </button>
              <button
                type="button"
                onClick={() => setSampleText("Job Offer from Microsoft HR: You are selected for Senior Product Manager role at ₹45,00,000/yr. To proceed, remit refundable registration fee of ₹1,500 via UPI to hr-microsoft-verify@okhdfcbank before 6 PM.")}
                className="text-xs px-2.5 py-1 rounded bg-stone-100 text-stone-700 hover:bg-stone-200 transition-colors"
              >
                Sample Job Scam
              </button>
            </div>

            <button
              id="analyze-upload-btn"
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto px-6 py-3 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-400 text-white font-medium text-sm rounded-lg flex items-center justify-center gap-2 transition-colors shadow-xs"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
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

      {/* Real-time pipeline execution status */}
      {isLoading && (
        <div className="mt-6 p-4 rounded-lg bg-stone-50 border border-stone-200 text-stone-700 flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-stone-900 animate-spin shrink-0" />
          <div className="text-sm">
            <p className="font-semibold text-stone-900">Executing Verification Pipeline</p>
            <p className="text-xs text-stone-600 mt-0.5">{loadingStep || "Fetching webpage and extracting evidence..."}</p>
          </div>
        </div>
      )}
    </section>
  );
};
