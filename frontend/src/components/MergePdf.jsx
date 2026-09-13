import React, { useState, useRef } from "react";
import api from "../api/axios";
import { validateFileSize, formatErrorMessage, getDownloadUrl, executeApiCall } from "../utils/apiHelpers";
import {
  Combine,
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
  Trash2,
  MoveUp,
  MoveDown,
} from "lucide-react";

const formatBytes = (bytes, decimals = 2) => {
  if (!bytes || bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

const MergePdf = () => {
  const [files, setFiles] = useState([]);
  const [download, setDownload] = useState("");
  const [error, setError] = useState("");
  const [isConverting, setIsConverting] = useState(false);
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef(null);

  const handleFilesSelect = (selectedFiles) => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    const fileArray = Array.from(selectedFiles);
    const validPdfs = fileArray.filter(
      (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
    );

    if (validPdfs.length !== fileArray.length) {
      setError("Some selected files were ignored because they are not valid PDFs (.pdf).");
    } else {
      setError("");
    }

    const updatedList = [...files, ...validPdfs];
    const sizeErr = validateFileSize(updatedList);
    if (sizeErr) {
      setError(sizeErr);
      return;
    }

    setFiles(updatedList);
    setDownload("");
    setMessage("");
  };

  const handleRemoveFile = (index) => {
    const updated = files.filter((_, i) => i !== index);
    setFiles(updated);
    if (updated.length < 2) {
      setError("Please select at least 2 PDF files to merge.");
    } else {
      setError("");
    }
  };

  const handleMoveFile = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= files.length) return;
    const updated = [...files];
    const [moved] = updated.splice(index, 1);
    updated.splice(newIndex, 0, moved);
    setFiles(updated);
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
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelect(e.dataTransfer.files);
    }
  };

  const handleConvert = async () => {
    if (files.length < 2) {
      setError("Please select at least 2 PDF files to merge.");
      return;
    }

    const sizeErr = validateFileSize(files);
    if (sizeErr) {
      setError(sizeErr);
      return;
    }

    setIsConverting(true);
    setError("");
    setDownload("");
    setMessage("");
    setProgress(10);
    setProgressStatus("Preparing chunked upload for selected PDF files...");

    try {
      const res = await executeApiCall("merge-pdf/", files, {}, (pct, statusText) => {
        setProgress(pct);
        if (statusText) setProgressStatus(statusText);
      });

      const downloadUrl = getDownloadUrl(res.data.file);

      setProgress(100);
      setProgressStatus("Merge Complete!");
      setDownload(downloadUrl);
      setMessage(res.data.message || "PDF documents merged into a single file successfully.");

      try {
        const historyItem = {
          type: "merge-pdf",
          originalName: `${files.length} PDFs Merged`,
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
      setError(formatErrorMessage(err, "PDF Merge failed. Please try again."));
      setMessage("");
    } finally {
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
    setFiles([]);
    setDownload("");
    setError("");
    setMessage("");
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="max-w-3xl mx-auto my-8">
      <div className="text-center mb-8">
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-4 shadow-inner">
          <Combine className="w-3.5 h-3.5" /> PDF Organizer
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold font-heading text-white tracking-tight">
          Merge <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-300">PDF Files</span>
        </h1>
        <p className="text-slate-400 text-sm sm:text-base mt-2 max-w-lg mx-auto">
          Combine multiple PDF files into one seamless document.
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
              className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 ${
                isDragging
                  ? "border-indigo-500 bg-indigo-500/10 scale-[1.01]"
                  : files.length > 0
                  ? "border-indigo-500/50 bg-slate-900/60"
                  : "border-slate-700/80 hover:border-indigo-500/60 bg-slate-900/40 hover:bg-slate-900/80"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="application/pdf"
                onChange={(e) => handleFilesSelect(e.target.files)}
                className="hidden"
              />

              <div className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500/20 to-violet-500/20 border border-indigo-500/30 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-7 h-7 text-indigo-400" />
                </div>
                <h3 className="text-base font-bold font-heading text-white mb-1">
                  Drag & Drop PDF files to merge
                </h3>
                <p className="text-slate-400 text-xs mb-3">
                  Select 2 or more PDF documents
                </p>
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all">
                  Browse PDF Files <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            {files.length > 0 && (
              <div className="mt-6 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-300 font-semibold px-1">
                  <span className="flex items-center gap-1 text-indigo-400">
                    <FileText className="w-4 h-4" /> Selected PDFs ({files.length})
                  </span>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="text-xs text-rose-400 hover:underline"
                  >
                    Clear All
                  </button>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                  {files.map((fileItem, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span className="w-5 h-5 rounded-md bg-indigo-500/20 text-indigo-400 font-mono text-[10px] flex items-center justify-center font-bold">
                          {idx + 1}
                        </span>
                        <span className="text-slate-200 truncate font-medium">{fileItem.name}</span>
                        <span className="text-slate-500 font-mono text-[11px] shrink-0">
                          {formatBytes(fileItem.size)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="text-slate-400 hover:text-rose-400 p-1 rounded-md hover:bg-slate-800 transition-colors shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isConverting && (
              <div className="mt-6 space-y-2">
                <div className="flex justify-between text-xs text-slate-300">
                  <span className="flex items-center gap-1.5 font-medium">
                    <RefreshCw className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                    {progressStatus}
                  </span>
                  <span className="font-mono font-semibold">{progress}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-400 rounded-full transition-all duration-300 shadow-lg shadow-indigo-500/50"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleConvert}
              disabled={files.length < 2 || isConverting}
              className={`w-full py-4 mt-6 rounded-2xl font-bold font-heading text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl transition-all duration-300 ${
                files.length < 2 || isConverting
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50"
                  : "bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-indigo-600/30 hover:scale-[1.01]"
              }`}
            >
              {isConverting ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" /> Merging Documents...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" /> Merge {files.length} PDF Documents
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
                Merge Successful
              </span>
              <h3 className="text-2xl font-bold font-heading text-white">
                Merged PDF Document Ready!
              </h3>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">{message}</p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <a
                href={download}
                download
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all hover:scale-105"
              >
                <Download className="w-4 h-4" /> Download Merged PDF
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
                <RefreshCw className="w-3.5 h-3.5" /> Merge more PDF documents
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
        <span>PDF pages are merged sequentially into a single high-quality document.</span>
      </div>
    </div>
  );
};

export default MergePdf;
