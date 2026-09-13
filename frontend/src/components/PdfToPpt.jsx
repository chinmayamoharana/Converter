import React, { useState, useRef } from "react";
import api from "../api/axios";
import { validateFileSize, formatErrorMessage, getDownloadUrl } from "../utils/apiHelpers";
import {
  Presentation,
  UploadCloud,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  Download,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

const formatBytes = (bytes, decimals = 2) => {
  if (!bytes || bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

const PdfToPpt = () => {
  const [file, setFile] = useState(null);
  const [download, setDownload] = useState("");
  const [error, setError] = useState("");
  const [isConverting, setIsConverting] = useState(false);
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef(null);

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;
    if (selectedFile.type !== "application/pdf" && !selectedFile.name.endsWith(".pdf")) {
      setError("Invalid file format. Please select a valid PDF file (.pdf).");
      setFile(null);
      return;
    }
    const sizeErr = validateFileSize(selectedFile);
    if (sizeErr) {
      setError(sizeErr);
      setFile(null);
      return;
    }
    setFile(selectedFile);
    setError("");
    setDownload("");
    setMessage("");
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const simulateProgress = () => {
    setProgress(15);
    setProgressStatus("Uploading PDF file...");

    const timer1 = setTimeout(() => {
      setProgress(55);
      setProgressStatus("Rendering pages as presentation slides...");
    }, 100);

    const timer2 = setTimeout(() => {
      setProgress(85);
      setProgressStatus("Building PowerPoint (.pptx) deck...");
    }, 250);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  };

  const handleConvert = async () => {
    if (!file) {
      setError("Please select a PDF file first.");
      return;
    }

    const sizeErr = validateFileSize(file);
    if (sizeErr) {
      setError(sizeErr);
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setIsConverting(true);
    setError("");
    setDownload("");
    setMessage("");

    const cleanupTimers = simulateProgress();

    try {
      const res = await api.post("pdf-to-ppt/", formData);
      const downloadUrl = getDownloadUrl(res.data.file);

      setProgress(100);
      setProgressStatus("Conversion Complete!");
      setDownload(downloadUrl);
      setMessage(res.data.message || "PDF converted successfully to PowerPoint presentation.");

      try {
        const historyItem = {
          type: "pdf-to-ppt",
          originalName: file.name,
          downloadUrl: downloadUrl,
          date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        const existing = JSON.parse(localStorage.getItem("omni_conversions_history") || "[]");
        const updated = [historyItem, ...existing.slice(0, 9)];
        localStorage.setItem("omni_conversions_history", JSON.stringify(updated));
        window.dispatchEvent(new Event("conversionAdded"));
      } catch (err) {
        console.error("Failed to save history", err);
      }

    } catch (err) {
      setError(formatErrorMessage(err, "PDF to PPT conversion failed. Please try again."));
      setMessage("");
    } finally {
      cleanupTimers();
      setIsConverting(false);
    }
  };

  const copyToClipboard = () => {
    if (!download) return;
    navigator.clipboard.writeText(download);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetForm = () => {
    setFile(null);
    setDownload("");
    setError("");
    setMessage("");
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="max-w-3xl mx-auto my-8">
      <div className="text-center mb-8">
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-4 shadow-inner">
          <Presentation className="w-3.5 h-3.5" /> Presentation Converter
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold font-heading text-white tracking-tight">
          Convert <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-rose-300">PDF to PPT</span>
        </h1>
        <p className="text-slate-400 text-sm sm:text-base mt-2 max-w-lg mx-auto">
          Convert PDF pages into PowerPoint slide decks (.pptx) ready for presenting.
        </p>
      </div>

      <div className="glass-panel p-6 sm:p-10 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
        {!download ? (
          <div>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-300 ${
                isDragging
                  ? "border-amber-500 bg-amber-500/10 scale-[1.01]"
                  : file
                  ? "border-emerald-500/50 bg-slate-900/60"
                  : "border-slate-700/80 hover:border-amber-500/60 bg-slate-900/40 hover:bg-slate-900/80"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={(e) => handleFileSelect(e.target.files[0])}
                className="hidden"
              />

              {!file ? (
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <UploadCloud className="w-8 h-8 text-amber-400" />
                  </div>
                  <h3 className="text-lg font-bold font-heading text-white mb-1">
                    Drag & Drop PDF here
                  </h3>
                  <p className="text-slate-400 text-xs sm:text-sm mb-4">
                    or click to browse PDF files from your device
                  </p>
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-lg shadow-amber-600/30 transition-all">
                    Select PDF File <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mb-4">
                    <FileCheck className="w-8 h-8 text-emerald-400" />
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
                    File Selected
                  </span>
                  <h4 className="text-base font-bold text-white max-w-xs truncate mb-1">
                    {file.name}
                  </h4>
                  <p className="text-xs text-slate-400 mb-4 font-mono">
                    {formatBytes(file.size)}
                  </p>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      resetForm();
                    }}
                    className="text-xs text-amber-400 hover:text-amber-300 underline font-medium"
                  >
                    Change selected file
                  </button>
                </div>
              )}
            </div>

            {isConverting && (
              <div className="mt-6 space-y-2">
                <div className="flex justify-between text-xs text-slate-300">
                  <span className="flex items-center gap-1.5 font-medium">
                    <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                    {progressStatus}
                  </span>
                  <span className="font-mono font-semibold">{progress}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-400 rounded-full transition-all duration-300 shadow-lg shadow-amber-500/50"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleConvert}
              disabled={!file || isConverting}
              className={`w-full py-4 mt-6 rounded-2xl font-bold font-heading text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl transition-all duration-300 ${
                !file || isConverting
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50"
                  : "bg-gradient-to-r from-amber-600 via-orange-600 to-amber-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-amber-600/30 hover:scale-[1.01]"
              }`}
            >
              {isConverting ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" /> Converting to PPT...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" /> Convert PDF to PowerPoint (.pptx)
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="text-center py-4 space-y-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/10 animate-bounce">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            </div>

            <div>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
                Conversion Successful
              </span>
              <h3 className="text-2xl font-bold font-heading text-white">
                Your PowerPoint File is Ready!
              </h3>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">{message}</p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <a
                href={download}
                download
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all hover:scale-105"
              >
                <Download className="w-4 h-4" /> Download PPTX Deck
              </a>

              <button
                onClick={copyToClipboard}
                className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 font-semibold text-sm flex items-center justify-center gap-2 border border-slate-700 transition-all"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-400" /> Copy Link
                  </>
                )}
              </button>
            </div>

            <div className="pt-4 border-t border-slate-800/80">
              <button
                onClick={resetForm}
                className="text-xs text-amber-400 hover:text-amber-300 font-medium inline-flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Convert another PDF document
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">{error}</div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-2 text-xs text-slate-500 mt-6 text-center">
        <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
        <span>PDF pages are embedded as high-resolution presentation slides with matching aspect ratios.</span>
      </div>
    </div>
  );
};

export default PdfToPpt;
