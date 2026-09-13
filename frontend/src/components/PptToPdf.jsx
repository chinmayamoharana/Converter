import React, { useState, useRef } from "react";
import api from "../api/axios";
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

const PptToPdf = () => {
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
    const isPpt =
      selectedFile.name.endsWith(".pptx") ||
      selectedFile.name.endsWith(".ppt");
    if (!isPpt) {
      setError("Invalid file format. Please select a PowerPoint file (.pptx or .ppt).");
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
    setProgress(20);
    setProgressStatus("Uploading presentation deck...");

    const timer1 = setTimeout(() => {
      setProgress(60);
      setProgressStatus("Processing slides and vector graphics...");
    }, 700);

    const timer2 = setTimeout(() => {
      setProgress(90);
      setProgressStatus("Generating output PDF document...");
    }, 1500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  };

  const handleConvert = async () => {
    if (!file) {
      setError("Please select a PowerPoint file first.");
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
      const res = await api.post("ppt-to-pdf/", formData);
      const downloadUrl = "http://127.0.0.1:8000" + res.data.file;

      setProgress(100);
      setProgressStatus("Conversion Complete!");
      setDownload(downloadUrl);
      setMessage(res.data.message || "PowerPoint presentation converted to PDF successfully.");

      try {
        const historyItem = {
          type: "ppt-to-pdf",
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
      const errorText = typeof rawErr === "string" ? rawErr : (typeof rawErr === "object" ? (rawErr.message || JSON.stringify(rawErr)) : "PPT to PDF conversion failed. Please try another file.");
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
      <div className="text-center mb-8">
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20 mb-4 shadow-inner">
          <Presentation className="w-3.5 h-3.5" /> Presentation Converter
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold font-heading text-white tracking-tight">
          Convert <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-300">PPT to PDF</span>
        </h1>
        <p className="text-slate-400 text-sm sm:text-base mt-2 max-w-lg mx-auto">
          Convert PowerPoint presentations (.pptx, .ppt) to PDF documents with layout preservation.
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
                  ? "border-orange-500 bg-orange-500/10 scale-[1.01]"
                  : file
                  ? "border-emerald-500/50 bg-slate-900/60"
                  : "border-slate-700/80 hover:border-orange-500/60 bg-slate-900/40 hover:bg-slate-900/80"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pptx,.ppt"
                onChange={(e) => handleFileSelect(e.target.files[0])}
                className="hidden"
              />

              {!file ? (
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-orange-500/20 to-amber-500/20 border border-orange-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <UploadCloud className="w-8 h-8 text-orange-400" />
                  </div>
                  <h3 className="text-lg font-bold font-heading text-white mb-1">
                    Drag & Drop PPT / PPTX here
                  </h3>
                  <p className="text-slate-400 text-xs sm:text-sm mb-4">
                    or click to select presentation files from your computer
                  </p>
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold shadow-lg shadow-orange-600/30 transition-all">
                    Select PPT File <ArrowRight className="w-3.5 h-3.5" />
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
                    className="text-xs text-orange-400 hover:text-orange-300 underline font-medium"
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
                    <RefreshCw className="w-3.5 h-3.5 text-orange-400 animate-spin" />
                    {progressStatus}
                  </span>
                  <span className="font-mono font-semibold">{progress}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-400 rounded-full transition-all duration-300 shadow-lg shadow-orange-500/50"
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
                  : "bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600 hover:from-orange-500 hover:to-amber-500 text-white shadow-orange-600/30 hover:scale-[1.01]"
              }`}
            >
              {isConverting ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" /> Converting to PDF...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" /> Convert PPT to PDF (.pdf)
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
                Your PDF Document is Ready!
              </h3>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">{message}</p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <a
                href={download}
                download
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all hover:scale-105"
              >
                <Download className="w-4 h-4" /> Download PDF Document
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
                className="text-xs text-orange-400 hover:text-orange-300 font-medium inline-flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Convert another presentation
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
        <span>PowerPoint vector slides and fonts are rendered into high quality PDF document pages.</span>
      </div>
    </div>
  );
};

export default PptToPdf;
