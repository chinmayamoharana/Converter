import React, { useState, useRef } from "react";
import api from "../api/axios";
import { validateFileSize, formatErrorMessage, getDownloadUrl } from "../utils/apiHelpers";
import {
  RotateCw,
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

const RotatePdf = () => {
  const [file, setFile] = useState(null);
  const [angle, setAngle] = useState(90);
  const [download, setDownload] = useState("");
  const [error, setError] = useState("");
  const [isRotating, setIsRotating] = useState(false);
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
    setProgress(25);
    setProgressStatus("Reading PDF document pages...");

    const timer1 = setTimeout(() => {
      setProgress(70);
      setProgressStatus(`Rotating pages by ${angle}°...`);
    }, 100);

    const timer2 = setTimeout(() => {
      setProgress(95);
      setProgressStatus("Rebuilding PDF document...");
    }, 250);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  };

  const handleRotate = async () => {
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
    formData.append("angle", angle);

    setIsRotating(true);
    setError("");
    setDownload("");
    setMessage("");

    const cleanupTimers = simulateProgress();

    try {
      const res = await api.post("rotate-pdf/", formData);
      const downloadUrl = getDownloadUrl(res.data.file);

      setProgress(100);
      setProgressStatus("Rotation Complete!");
      setDownload(downloadUrl);
      setMessage(res.data.message || `PDF pages rotated by ${angle}° successfully.`);

      const historyItem = {
        id: Date.now(),
        fileName: file.name,
        action: `Rotate PDF (${angle}°)`,
        downloadUrl,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      const existing = JSON.parse(localStorage.getItem("converter_history") || "[]");
      localStorage.setItem("converter_history", JSON.stringify([historyItem, ...existing.slice(0, 9)]));
    } catch (err) {
      setError(formatErrorMessage(err, "PDF rotation failed. Please try again."));
    } finally {
      cleanupTimers();
      setIsRotating(false);
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
    setIsRotating(false);
    setMessage("");
    setProgress(0);
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mb-4">
          <Sparkles className="w-3.5 h-3.5" /> Instant Page Orientation Fix
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold font-heading text-white tracking-tight">
          Rotate PDF Pages
        </h1>
        <p className="text-slate-400 mt-2 text-base max-w-xl mx-auto">
          Rotate sideways or upside-down PDF pages clockwise by 90°, 180°, or 270°.
        </p>
      </div>

      {/* Main Glass Card */}
      <div className="glass-card rounded-3xl p-6 sm:p-10 relative overflow-hidden border border-slate-800 shadow-2xl">
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

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
                  ? "border-cyan-500 bg-cyan-500/10 scale-[0.99]"
                  : file
                  ? "border-cyan-500/50 bg-cyan-500/5"
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
                  <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4 shadow-inner">
                    <UploadCloud className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">
                    Drag & Drop your PDF file here
                  </h3>
                  <p className="text-slate-400 text-sm mb-4">
                    Supports all PDF documents
                  </p>
                  <span className="px-5 py-2.5 rounded-xl bg-cyan-600 text-white text-xs font-semibold hover:bg-cyan-500 transition-colors shadow-lg shadow-cyan-600/20">
                    Browse File
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between p-2">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
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

            {/* Rotation Angle Selector */}
            {file && (
              <div className="mt-6 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <RotateCw className="w-4 h-4 text-cyan-400" /> Select Rotation Angle:
                </span>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {[90, 180, 270].map((deg) => (
                    <button
                      key={deg}
                      type="button"
                      onClick={() => setAngle(deg)}
                      className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                        angle === deg
                          ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-md shadow-cyan-500/10"
                          : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-750 hover:text-white"
                      }`}
                    >
                      {deg}° CW
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="mt-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center space-x-3 text-rose-400 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Progress Bar */}
            {isRotating && (
              <div className="mt-6 space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-cyan-400 flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> {progressStatus}
                  </span>
                  <span className="text-slate-400 font-mono">{progress}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-400 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Action Button */}
            <div className="mt-8 flex justify-center">
              <button
                onClick={handleRotate}
                disabled={!file || isRotating}
                className={`w-full sm:w-auto px-8 py-4 rounded-2xl font-bold text-sm flex items-center justify-center space-x-2 transition-all duration-300 shadow-xl ${
                  !file || isRotating
                    ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50"
                    : "bg-cyan-600 text-white hover:bg-cyan-500 shadow-cyan-600/25 hover:shadow-cyan-500/40 hover:-translate-y-0.5"
                }`}
              >
                {isRotating ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Rotating PDF...</span>
                  </>
                ) : (
                  <>
                    <RotateCw className="w-5 h-5 mr-1" />
                    <span>Rotate PDF {angle}°</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Success Screen */
          <div className="text-center py-6">
            <div className="w-20 h-20 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold font-heading text-white mb-2">
              Rotation Complete!
            </h3>
            <p className="text-slate-400 text-sm mb-8 max-w-md mx-auto">{message}</p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
              <a
                href={download}
                download
                className="w-full sm:w-1/2 py-3.5 px-5 bg-cyan-600 text-white rounded-xl font-bold text-sm hover:bg-cyan-500 transition-all flex items-center justify-center space-x-2 shadow-lg shadow-cyan-600/20"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </a>

              <button
                onClick={handleCopyLink}
                className="w-full sm:w-1/2 py-3.5 px-5 bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 rounded-xl font-bold text-sm transition-all flex items-center justify-center space-x-2"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-cyan-400" />
                    <span className="text-cyan-400">Copied!</span>
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
                <RefreshCw className="w-3.5 h-3.5" /> Rotate another PDF file
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RotatePdf;
