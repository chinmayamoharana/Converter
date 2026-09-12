import React, { useState, useRef } from "react";
import api from "../api/axios";
import {
  FileSpreadsheet,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Download,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  ArrowRight,
  FileText,
} from "lucide-react";

const formatBytes = (bytes, decimals = 2) => {
  if (!bytes || bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

const PdfToExcel = () => {
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
    const isPdf =
      selectedFile.name.endsWith(".pdf") ||
      selectedFile.type === "application/pdf";
    if (!isPdf) {
      setError("Invalid file format. Please select a PDF file (.pdf).");
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
    setProgressStatus("Uploading PDF document...");

    const timer1 = setTimeout(() => {
      setProgress(60);
      setProgressStatus("Extracting tabular data & text blocks...");
    }, 700);

    const timer2 = setTimeout(() => {
      setProgress(90);
      setProgressStatus("Formatting Excel workbook (.xlsx)...");
    }, 1500);

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
      const res = await api.post("pdf-to-excel/", formData);
      const downloadUrl = "http://127.0.0.1:8000" + res.data.file;

      setProgress(100);
      setProgressStatus("Extraction Complete!");
      setDownload(downloadUrl);
      setMessage(res.data.message || "PDF content extracted into Excel workbook (.xlsx).");

      const historyItem = {
        id: Date.now(),
        fileName: file.name,
        action: "PDF to Excel",
        downloadUrl,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      const existing = JSON.parse(localStorage.getItem("converter_history") || "[]");
      localStorage.setItem("converter_history", JSON.stringify([historyItem, ...existing.slice(0, 9)]));
    } catch (err) {
      setError(
        err.response?.data?.error || "PDF to Excel extraction failed. Please try again."
      );
    } finally {
      cleanupTimers();
      setIsConverting(false);
    }
  };

  const handleCopyLink = () => {
    if (!download) return;
    navigator.clipboard.writeText(download);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetAll = () => {
    setFile(null);
    setDownload("");
    setError("");
    setIsConverting(false);
    setMessage("");
    setProgress(0);
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-4">
          <Sparkles className="w-3.5 h-3.5" /> High Precision Data Extraction
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold font-heading text-white tracking-tight">
          Convert PDF to Excel
        </h1>
        <p className="text-slate-400 mt-2 text-base max-w-xl mx-auto">
          Extract tables, data cells, and layout blocks from PDF documents into editable Excel spreadsheets (.xlsx).
        </p>
      </div>

      {/* Main Glass Card */}
      <div className="glass-card rounded-3xl p-6 sm:p-10 relative overflow-hidden border border-slate-800 shadow-2xl">
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {!download ? (
          <div>
            {/* Upload Box */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 ${
                isDragging
                  ? "border-emerald-500 bg-emerald-500/10 scale-[0.99]"
                  : file
                  ? "border-emerald-500/50 bg-emerald-500/5"
                  : "border-slate-800 hover:border-slate-700 hover:bg-slate-900/60"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={(e) => handleFileSelect(e.target.files[0])}
                className="hidden"
              />

              {!file ? (
                <div className="flex flex-col items-center py-4">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 shadow-inner">
                    <UploadCloud className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">
                    Drag & Drop your PDF file here
                  </h3>
                  <p className="text-slate-400 text-sm mb-4">
                    Supports all PDF documents
                  </p>
                  <span className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-600/20">
                    Browse File
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between p-2">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-white text-base truncate max-w-xs sm:max-w-md">
                        {file.name}
                      </p>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">
                        {formatBytes(file.size)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      resetAll();
                    }}
                    className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors text-xs font-semibold"
                  >
                    Change
                  </button>
                </div>
              )}
            </div>

            {/* Error Display */}
            {error && (
              <div className="mt-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center space-x-3 text-rose-400 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Progress Bar */}
            {isConverting && (
              <div className="mt-6 space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-emerald-400 flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> {progressStatus}
                  </span>
                  <span className="text-slate-400 font-mono">{progress}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Action Button */}
            <div className="mt-8 flex justify-center">
              <button
                onClick={handleConvert}
                disabled={!file || isConverting}
                className={`w-full sm:w-auto px-8 py-4 rounded-2xl font-bold text-sm flex items-center justify-center space-x-2 transition-all duration-300 shadow-xl ${
                  !file || isConverting
                    ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50"
                    : "bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-600/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5"
                }`}
              >
                {isConverting ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Extracting to Excel...</span>
                  </>
                ) : (
                  <>
                    <span>Convert to Excel</span>
                    <ArrowRight className="w-5 h-5 ml-1" />
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Success Screen */
          <div className="text-center py-6">
            <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold font-heading text-white mb-2">
              Extraction Complete!
            </h3>
            <p className="text-slate-400 text-sm mb-8 max-w-md mx-auto">{message}</p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
              <a
                href={download}
                download
                className="w-full sm:w-1/2 py-3.5 px-5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-500 transition-all flex items-center justify-center space-x-2 shadow-lg shadow-emerald-600/20"
              >
                <Download className="w-4 h-4" />
                <span>Download Excel</span>
              </a>

              <button
                onClick={handleCopyLink}
                className="w-full sm:w-1/2 py-3.5 px-5 bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 rounded-xl font-bold text-sm transition-all flex items-center justify-center space-x-2"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-800 flex justify-center">
              <button
                onClick={resetAll}
                className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Convert another PDF file
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PdfToExcel;
