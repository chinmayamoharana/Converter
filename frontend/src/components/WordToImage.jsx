import React, { useState, useRef } from "react";
import { validateFileSize, formatErrorMessage, getDownloadUrl, executeApiCall } from "../utils/apiHelpers";
import {
  FileText,
  Image as ImageIcon,
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
  Archive,
} from "lucide-react";

const formatBytes = (bytes, decimals = 2) => {
  if (!bytes || bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

const WordToImage = () => {
  const [file, setFile] = useState(null);
  const [download, setDownload] = useState("");
  const [pagesCount, setPagesCount] = useState(1);
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
    const isWord =
      selectedFile.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      selectedFile.type === "application/msword" ||
      /\.(docx|doc)$/i.test(selectedFile.name);

    if (!isWord) {
      setError("Invalid file format. Please select a valid Word file (.docx or .doc).");
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

  const handleConvert = async () => {
    if (!file) {
      setError("Please select a Word (.docx) file first.");
      return;
    }

    const sizeErr = validateFileSize(file);
    if (sizeErr) {
      setError(sizeErr);
      return;
    }

    setIsConverting(true);
    setError("");
    setDownload("");
    setMessage("");
    setProgress(15);
    setProgressStatus("Preparing Word file upload...");

    try {
      const res = await executeApiCall("word-to-image/", file, {}, (pct, statusText) => {
        setProgress(pct);
        if (statusText) setProgressStatus(statusText);
      });

      const downloadUrl = getDownloadUrl(res.data.file);
      const detectedPages = res.data.pages_count || (downloadUrl.endsWith(".zip") ? 2 : 1);
      setPagesCount(detectedPages);

      setProgress(100);
      setProgressStatus("Conversion Complete!");
      setDownload(downloadUrl);
      setMessage(res.data.message || (detectedPages === 1 ? "Word document exported as 1 page PNG image." : `Exported ${detectedPages} Word pages into PNG Zip package.`));

      try {
        const historyItem = {
          type: "word-to-image",
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
      setError(formatErrorMessage(err, "Word to Image conversion failed. Please try again."));
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
    setFile(null);
    setDownload("");
    setPagesCount(1);
    setError("");
    setMessage("");
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const isZip = download.endsWith(".zip");

  return (
    <div className="max-w-3xl mx-auto my-8">
      {/* Header Banner */}
      <div className="text-center mb-8">
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 mb-4 shadow-inner">
          <ImageIcon className="w-3.5 h-3.5" /> High-Resolution Media Export
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold font-heading text-white tracking-tight">
          Convert <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-pink-400 to-amber-300">Word to Image</span>
        </h1>
        <p className="text-slate-400 text-sm sm:text-base mt-2 max-w-lg mx-auto">
          Render and export Word document pages (.docx) into crisp high-resolution PNG images or a ZIP package.
        </p>
      </div>

      {/* Main Glass Card */}
      <div className="glass-panel p-6 sm:p-10 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
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
                  : "border-slate-700/80 hover:border-rose-500/60 bg-slate-900/40 hover:bg-slate-900/80"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".docx,.doc"
                onChange={(e) => handleFileSelect(e.target.files[0])}
                className="hidden"
              />

              {!file ? (
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-500/20 to-pink-500/20 border border-rose-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <UploadCloud className="w-8 h-8 text-rose-400" />
                  </div>
                  <h3 className="text-lg font-bold font-heading text-white mb-1">
                    Drag & Drop Word file here
                  </h3>
                  <p className="text-slate-400 text-xs sm:text-sm mb-4">
                    or click to browse .docx / .doc files from your device
                  </p>
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-600/30 transition-all">
                    Select DOCX File <ArrowRight className="w-3.5 h-3.5" />
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

            {/* Error Message */}
            {error && (
              <div className="mt-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3 text-rose-400 text-xs sm:text-sm">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {/* Action Button */}
            <div className="mt-6">
              <button
                type="button"
                onClick={handleConvert}
                disabled={!file || isConverting}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-rose-600 via-pink-600 to-amber-500 hover:from-rose-500 hover:via-pink-500 hover:to-amber-400 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-sm text-white shadow-xl shadow-rose-600/25 flex items-center justify-center gap-2 transition-all transform active:scale-[0.99]"
              >
                {isConverting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Rendering Document Pages...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Convert to Image{file ? " Now" : ""}
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Download Result View */
          <div className="text-center py-6">
            <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/10 animate-bounce">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            </div>

            <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-3">
              Export Successful
            </span>
            <h3 className="text-2xl font-bold font-heading text-white mb-2">
              {pagesCount === 1 ? "Your Single Page Image is Ready!" : `Your ${pagesCount} Page Images Are Ready!`}
            </h3>
            <p className="text-slate-400 text-sm max-w-sm mx-auto mb-8">
              {message || (isZip ? `All ${pagesCount} pages rendered and packed into a ZIP archive.` : "Single-page Word document exported as high-resolution PNG image.")}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
              <a
                href={download}
                download
                className="w-full sm:w-auto flex-1 py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-sm shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all"
              >
                {isZip ? <Archive className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                {isZip ? `Download Images ZIP (${pagesCount} Pages)` : "Download PNG Image (1 Page)"}
              </a>

              <button
                type="button"
                onClick={copyToClipboard}
                className="w-full sm:w-auto px-4 py-3.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied Link!" : "Copy Link"}
              </button>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-800">
              <button
                type="button"
                onClick={resetForm}
                className="text-xs text-rose-400 hover:text-rose-300 font-semibold inline-flex items-center gap-1"
              >
                Convert Another Word Document <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WordToImage;

