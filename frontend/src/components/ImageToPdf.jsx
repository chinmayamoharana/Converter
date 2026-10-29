import React, { useState, useRef, useEffect } from "react";
import { validateFileSize, formatErrorMessage, getDownloadUrl, executeApiCall } from "../utils/apiHelpers";
import {
  Image as ImageIcon,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Download,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Layers,
  X,
  ArrowUp,
  ArrowDown,
  Plus,
  Trash2,
} from "lucide-react";

const formatBytes = (bytes, decimals = 2) => {
  if (!bytes || bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

const ImageToPdf = () => {
  // fileItems is an array of { id, file, previewUrl }
  const [fileItems, setFileItems] = useState([]);
  const [download, setDownload] = useState("");
  const [outputPagesCount, setOutputPagesCount] = useState(1);
  const [error, setError] = useState("");
  const [isConverting, setIsConverting] = useState(false);
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef(null);
  const addMoreInputRef = useRef(null);

  // Clean up object URLs when unmounting or clearing
  useEffect(() => {
    return () => {
      fileItems.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });
    };
  }, []);

  const handleFilesSelect = (selectedFiles) => {
    if (!selectedFiles || selectedFiles.length === 0) return;
    const rawFiles = Array.from(selectedFiles);
    const validExtensions = /\.(jpg|jpeg|png|webp|bmp|tiff|tif|svg|gif|ico|jfif|avif)$/i;
    
    const validFiles = rawFiles.filter((f) =>
      validExtensions.test(f.name) || (f.type && f.type.startsWith("image/"))
    );

    if (validFiles.length === 0) {
      setError("Please select valid image files (JPG, PNG, WEBP, BMP, TIFF, SVG, etc.).");
      return;
    }

    const currentRawFiles = fileItems.map((item) => item.file);
    const candidateFiles = [...currentRawFiles, ...validFiles];
    const sizeErr = validateFileSize(candidateFiles);
    if (sizeErr) {
      setError(sizeErr);
      return;
    }

    const newItems = validFiles.map((file) => ({
      id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 9)}`,
      file,
      previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
    }));

    setFileItems((prev) => [...prev, ...newItems]);
    setError("");
    setDownload("");
    setMessage("");
  };

  const removeFile = (index) => {
    setFileItems((prev) => {
      const removed = prev[index];
      if (removed && removed.previewUrl) {
        URL.revokeObjectURL(removed.previewUrl);
      }
      return prev.filter((_, idx) => idx !== index);
    });
  };

  const moveUp = (index) => {
    if (index <= 0) return;
    setFileItems((prev) => {
      const updated = [...prev];
      const temp = updated[index - 1];
      updated[index - 1] = updated[index];
      updated[index] = temp;
      return updated;
    });
  };

  const moveDown = (index) => {
    setFileItems((prev) => {
      if (index >= prev.length - 1) return prev;
      const updated = [...prev];
      const temp = updated[index + 1];
      updated[index + 1] = updated[index];
      updated[index] = temp;
      return updated;
    });
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
    if (fileItems.length === 0) {
      setError("Please select at least one image file.");
      return;
    }

    const rawFiles = fileItems.map((item) => item.file);
    const sizeErr = validateFileSize(rawFiles);
    if (sizeErr) {
      setError(sizeErr);
      return;
    }

    setIsConverting(true);
    setError("");
    setDownload("");
    setMessage("");
    setProgress(10);
    setProgressStatus(`Preparing ${rawFiles.length} image page(s)...`);

    try {
      const res = await executeApiCall("image-to-pdf/", rawFiles, {}, (pct, statusText) => {
        setProgress(pct);
        if (statusText) setProgressStatus(statusText);
      });

      const downloadUrl = getDownloadUrl(res.data.file);
      const totalPages = res.data.pages_count || rawFiles.length;
      setOutputPagesCount(totalPages);

      setProgress(100);
      setProgressStatus("PDF Ready!");
      setDownload(downloadUrl);
      setMessage(res.data.message || `Successfully converted ${rawFiles.length} image(s) into a ${totalPages}-page PDF document.`);

      try {
        const historyItem = {
          type: "image-to-pdf",
          originalName: `${rawFiles.length} Images (${totalPages} Pages).pdf`,
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
      setError(formatErrorMessage(err, "Image to PDF conversion failed. Please try again."));
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
    fileItems.forEach((item) => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    });
    setFileItems([]);
    setDownload("");
    setOutputPagesCount(1);
    setError("");
    setMessage("");
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (addMoreInputRef.current) addMoreInputRef.current.value = "";
  };

  const totalSizeBytes = fileItems.reduce((acc, item) => acc + item.file.size, 0);

  return (
    <div className="max-w-4xl mx-auto my-8">
      {/* Header Banner */}
      <div className="text-center mb-8">
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-4 shadow-inner">
          <ImageIcon className="w-3.5 h-3.5" /> Multi-Page PDF Compiler
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold font-heading text-white tracking-tight">
          Convert <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-300">Images to PDF</span>
        </h1>
        <p className="text-slate-400 text-sm sm:text-base mt-2 max-w-xl mx-auto">
          Convert multiple images into a single multi-page PDF document. Add images in batches, reorder pages, and compile with high fidelity.
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
              className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center cursor-pointer transition-all duration-300 ${
                isDragging
                  ? "border-emerald-500 bg-emerald-500/10 scale-[1.01]"
                  : fileItems.length > 0
                  ? "border-emerald-500/40 bg-slate-900/50 hover:bg-slate-900/70"
                  : "border-slate-700/80 hover:border-emerald-500/60 bg-slate-900/40 hover:bg-slate-900/80"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.webp,.bmp,.tiff,.tif,.svg,.gif,.ico,.jfif,.avif"
                onChange={(e) => handleFilesSelect(e.target.files)}
                className="hidden"
              />

              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-base sm:text-lg font-bold font-heading text-white mb-1">
                  Drag & Drop multiple images here
                </h3>
                <p className="text-slate-400 text-xs sm:text-sm mb-3">
                  JPG, PNG, WEBP, BMP, TIFF, SVG (Select multiple pages at once)
                </p>
                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/30 transition-all">
                  <Plus className="w-4 h-4" /> Browse & Select Images
                </span>
              </div>
            </div>

            {/* Selected Images List with Reordering Controls */}
            {fileItems.length > 0 && (
              <div className="mt-6 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                      <Layers className="w-4 h-4" /> {fileItems.length} {fileItems.length === 1 ? "Image" : "Images"} ({formatBytes(totalSizeBytes)})
                    </span>
                    <span className="text-[11px] text-slate-500 hidden sm:inline">
                      • Arrange page sequence using ↑ ↓
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Add More Images Button */}
                    <input
                      ref={addMoreInputRef}
                      type="file"
                      multiple
                      accept="image/*,.webp,.bmp,.tiff,.tif,.svg,.gif,.ico,.jfif,.avif"
                      onChange={(e) => handleFilesSelect(e.target.files)}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => addMoreInputRef.current?.click()}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-semibold transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add More
                    </button>

                    <button
                      type="button"
                      onClick={resetForm}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Clear All
                    </button>
                  </div>
                </div>

                {/* Draggable/Orderable Page Items */}
                <div className="max-h-64 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {fileItems.map((item, idx) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs hover:border-slate-700 transition-all"
                    >
                      {/* Left side: Page badge, thumbnail & filename */}
                      <div className="flex items-center gap-3 truncate min-w-0">
                        {/* Page Number Badge */}
                        <span className="shrink-0 px-2 py-1 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold text-[11px] font-mono">
                          Page {idx + 1}
                        </span>

                        {/* Thumbnail / Icon */}
                        {item.previewUrl ? (
                          <img
                            src={item.previewUrl}
                            alt={`Preview ${idx + 1}`}
                            className="w-9 h-9 object-cover rounded-lg border border-slate-700 shrink-0 bg-slate-950"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                            <ImageIcon className="w-4 h-4 text-emerald-400" />
                          </div>
                        )}

                        {/* File Details */}
                        <div className="truncate min-w-0">
                          <p className="text-slate-200 font-medium truncate">{item.file.name}</p>
                          <p className="text-slate-500 font-mono text-[11px]">
                            {formatBytes(item.file.size)}
                          </p>
                        </div>
                      </div>

                      {/* Right side: Reordering (Up/Down) & Remove */}
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        {/* Move Up */}
                        <button
                          type="button"
                          onClick={() => moveUp(idx)}
                          disabled={idx === 0}
                          title="Move page up"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-20 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>

                        {/* Move Down */}
                        <button
                          type="button"
                          onClick={() => moveDown(idx)}
                          disabled={idx === fileItems.length - 1}
                          title="Move page down"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-20 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>

                        {/* Remove item */}
                        <button
                          type="button"
                          onClick={() => removeFile(idx)}
                          title="Remove image"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors ml-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Conversion Progress Bar */}
            {isConverting && (
              <div className="mt-6 space-y-2">
                <div className="flex justify-between text-xs text-slate-300">
                  <span className="flex items-center gap-1.5 font-medium">
                    <RefreshCw className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                    {progressStatus}
                  </span>
                  <span className="font-mono font-semibold">{progress}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-400 rounded-full transition-all duration-300 shadow-lg shadow-emerald-500/50"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mt-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1">{error}</div>
              </div>
            )}

            {/* Main Action Button */}
            <button
              onClick={handleConvert}
              disabled={fileItems.length === 0 || isConverting}
              className={`w-full py-4 mt-6 rounded-2xl font-bold font-heading text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl transition-all duration-300 ${
                fileItems.length === 0 || isConverting
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50"
                  : "bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/30 hover:scale-[1.01]"
              }`}
            >
              {isConverting ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" /> Compiling {fileItems.length} Page(s) into PDF...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" /> Convert {fileItems.length} {fileItems.length === 1 ? "Image" : "Images"} into Multi-Page PDF
                </>
              )}
            </button>
          </div>
        ) : (
          /* Result View */
          <div className="text-center py-4 space-y-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/10 animate-bounce">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            </div>

            <div>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
                Conversion Successful • {outputPagesCount} {outputPagesCount === 1 ? "Page" : "Pages"}
              </span>
              <h3 className="text-2xl font-bold font-heading text-white">
                Your Multi-Page PDF Document is Ready!
              </h3>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">{message}</p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 max-w-md mx-auto">
              <a
                href={download}
                download
                className="w-full sm:w-auto flex-1 px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all hover:scale-105"
              >
                <Download className="w-4 h-4" /> Download PDF ({outputPagesCount} {outputPagesCount === 1 ? "Page" : "Pages"})
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
                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium inline-flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Convert More Images
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-2 text-xs text-slate-500 mt-6 text-center">
        <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
        <span>Each image is accurately compiled as its own page with native resolution and aspect ratio.</span>
      </div>
    </div>
  );
};

export default ImageToPdf;
