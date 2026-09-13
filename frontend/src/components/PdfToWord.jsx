import React, { useState, useRef } from "react";
import api from "../api/axios";
import {
  FileText,
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
  ShieldAlert,
} from "lucide-react";

const formatBytes = (bytes, decimals = 2) => {
  if (!bytes || bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

const PdfToWord = () => {
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
    setProgressStatus("Uploading PDF file to engine...");

    const timer1 = setTimeout(() => {
      setProgress(50);
      setProgressStatus("Analyzing pages, tables & typography...");
    }, 600);

    const timer2 = setTimeout(() => {
      setProgress(85);
      setProgressStatus("Formatting output Word (.docx) document...");
    }, 1400);

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

    const formData = new FormData();
    formData.append("file", file);

    setIsConverting(true);
    setError("");
    setDownload("");
    setMessage("");

    const cleanupTimers = simulateProgress();

    try {
      const res = await api.post("pdf-to-word/", formData);
      const downloadUrl = "http://127.0.0.1:8000" + res.data.file;

      setProgress(100);
      setProgressStatus("Conversion Complete!");
      setDownload(downloadUrl);
      setMessage(res.data.message || "PDF converted successfully to editable Word document.");

      // Save to localStorage history
      try {
        const historyItem = {
          type: "pdf-to-word",
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
      const rawErr = err.response?.data?.error || err.response?.data?.detail || err.message;
      const errorText = typeof rawErr === "string" ? rawErr : (typeof rawErr === "object" ? (rawErr.message || JSON.stringify(rawErr)) : "Conversion failed. Please verify your PDF file and try again.");
      setError(errorText);
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
      {/* Header Banner */}
      <div className="text-center mb-8">
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 mb-4 shadow-inner">
          <FileText className="w-3.5 h-3.5" /> High-Fidelity Converter
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold font-heading text-white tracking-tight">
          Convert <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-pink-400 to-amber-300">PDF to Word</span>
        </h1>
        <p className="text-slate-400 text-sm sm:text-base mt-2 max-w-lg mx-auto">
          Transform your PDF documents into fully editable DOCX files while preserving text formatting, images, and page layouts.
        </p>
      </div>

      {/* Main Glass Card */}
      <div className="glass-panel p-6 sm:p-10 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
        {/* Glow accent effect */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {!download ? (
          <div>
            {/* Drag & Drop Area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-300 ${
                isDragging
                  ? "border-rose-500 bg-rose-500/10 scale-[1.01]"
                  : file
                  ? "border-emerald-500/50 bg-slate-900/60"
                  : "border-slate-700/80 hover:border-indigo-500/60 bg-slate-900/40 hover:bg-slate-900/80"
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
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-500/20 to-pink-500/20 border border-rose-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <UploadCloud className="w-8 h-8 text-rose-400" />
                  </div>
                  <h3 className="text-lg font-bold font-heading text-white mb-1">
                    Drag & Drop your PDF here
                  </h3>
                  <p className="text-slate-400 text-xs sm:text-sm mb-4">
                    or click to browse from your computer
                  </p>
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-600/30 transition-all">
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
                    className="text-xs text-rose-400 hover:text-rose-300 underline font-medium"
                  >
                    Change selected file
                  </button>
                </div>
              )}
            </div>

            {/* Progress Bar */}
            {isConverting && (
              <div className="mt-6 space-y-2">
                <div className="flex justify-between text-xs text-slate-300">
                  <span className="flex items-center gap-1.5 font-medium">
                    <RefreshCw className="w-3.5 h-3.5 text-rose-400 animate-spin" />
                    {progressStatus}
                  </span>
                  <span className="font-mono font-semibold">{progress}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
                  <div
                    className="h-full bg-gradient-to-r from-rose-500 via-pink-500 to-amber-400 rounded-full transition-all duration-300 shadow-lg shadow-rose-500/50"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Convert Action Button */}
            <button
              onClick={handleConvert}
              disabled={!file || isConverting}
              className={`w-full py-4 mt-6 rounded-2xl font-bold font-heading text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl transition-all duration-300 ${
                !file || isConverting
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50"
                  : "bg-gradient-to-r from-rose-600 via-pink-600 to-rose-600 hover:from-rose-500 hover:to-pink-500 text-white shadow-rose-600/30 hover:scale-[1.01] active:scale-[0.99]"
              }`}
            >
              {isConverting ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" /> Converting Document...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" /> Convert PDF to Word (.docx)
                </>
              )}
            </button>
          </div>
        ) : (
          /* Result Download Card */
          <div className="text-center py-4 space-y-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/10 animate-bounce">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            </div>

            <div>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
                Conversion Successful
              </span>
              <h3 className="text-2xl font-bold font-heading text-white">
                Your Word File is Ready!
              </h3>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">
                {message}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <a
                href={download}
                download
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all hover:scale-105"
              >
                <Download className="w-4 h-4" /> Download Word File
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
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Convert another PDF document
              </button>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mt-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">{error}</div>
          </div>
        )}
      </div>

      {/* Info footer note */}
      <div className="flex items-center justify-center gap-2 text-xs text-slate-500 mt-6 text-center">
        <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
        <span>Text-based PDFs yield editable text. Scanned PDFs fallback to clear image page snapshots.</span>
      </div>
    </div>
  );
};

export default PdfToWord;
