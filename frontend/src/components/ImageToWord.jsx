import React, { useState, useRef, useEffect } from "react";
import api from "../api/axios";
import { validateFileSize, formatErrorMessage, getDownloadUrl, executeApiCall } from "../utils/apiHelpers";
import {
  FileText,
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
  X,
  FilePlus,
  ScanText,
  Edit3,
  Layers,
  ArrowUp,
  ArrowDown,
  Plus,
  Trash2,
  BookOpen,
} from "lucide-react";

const formatBytes = (bytes, decimals = 2) => {
  if (!bytes || bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

const ImageToWord = () => {
  // fileItems is an array of { id, file, previewUrl }
  const [fileItems, setFileItems] = useState([]);
  const [download, setDownload] = useState("");
  const [outputPagesCount, setOutputPagesCount] = useState(1);
  const [extractedText, setExtractedText] = useState("");
  const [sections, setSections] = useState([]);
  const [activeTab, setActiveTab] = useState("all"); // 'all' or section index
  const [stats, setStats] = useState({ wordCount: 0, charCount: 0, lineCount: 0 });
  const [error, setError] = useState("");
  const [isConverting, setIsConverting] = useState(false);
  const [isUpdatingDoc, setIsUpdatingDoc] = useState(false);
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

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
    const validExtensions = /\.(jpg|jpeg|png|webp|bmp|tiff|tif|gif|svg|ico|jfif|avif)$/i;

    const validFiles = rawFiles.filter((f) =>
      validExtensions.test(f.name) || (f.type && f.type.startsWith("image/"))
    );

    if (validFiles.length === 0) {
      setError("Please select valid image files (PNG, JPG, WEBP, BMP, TIFF, SVG, etc.).");
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
    setExtractedText("");
    setSections([]);
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
    setExtractedText("");
    setSections([]);
    setMessage("");
    setProgress(15);
    setProgressStatus(`Extracting text from ${rawFiles.length} image page(s) using high-accuracy OCR...`);

    try {
      const res = await executeApiCall("image-to-word/", rawFiles, {}, (pct, statusText) => {
        setProgress(pct);
        if (statusText) setProgressStatus(statusText);
      });

      const downloadUrl = getDownloadUrl(res.data.file);
      const totalPages = res.data.pages_count || rawFiles.length;
      setOutputPagesCount(totalPages);

      const returnedSections = res.data.sections || [];
      setSections(returnedSections);

      // Build structured text with clear page breaks between multiple images
      let combinedText = res.data.extracted_text || "";
      if (returnedSections.length > 1) {
        combinedText = returnedSections
          .map((sec, idx) => `=== ${sec.title || `Page ${idx + 1}`} ===\n${sec.text}`)
          .join("\n\n--- Page Break ---\n\n");
      }
      setExtractedText(combinedText);

      setStats({
        wordCount: res.data.word_count || (combinedText.trim() ? combinedText.trim().split(/\s+/).length : 0),
        charCount: res.data.char_count || combinedText.length,
        lineCount: res.data.line_count || (combinedText ? combinedText.splitlines?.()?.length || combinedText.split("\n").length : 0),
      });

      setProgress(100);
      setProgressStatus("Conversion Complete!");
      setDownload(downloadUrl);
      setMessage(res.data.message || `Extracted text from ${rawFiles.length} image(s) and compiled into a ${totalPages}-page Word document (.docx).`);

      try {
        const historyItem = {
          type: "image-to-word",
          originalName: rawFiles.length === 1 ? rawFiles[0].name : `${rawFiles.length} Images (${totalPages} Pages).docx`,
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
      setError(formatErrorMessage(err, "Image to Word conversion failed. Please try again."));
      setMessage("");
    } finally {
      setIsConverting(false);
    }
  };

  const handleUpdateDocumentFromText = async () => {
    if (!extractedText.trim()) return;
    setIsUpdatingDoc(true);
    setError("");
    try {
      const res = await api.post("image-to-word/", { text: extractedText });
      const downloadUrl = getDownloadUrl(res.data.file);
      setDownload(downloadUrl);
      if (res.data.pages_count) {
        setOutputPagesCount(res.data.pages_count);
      }
      setMessage("Word document successfully re-generated from your edited text!");
      if (res.data.word_count !== undefined) {
        setStats({
          wordCount: res.data.word_count,
          charCount: res.data.char_count,
          lineCount: res.data.line_count,
        });
      }
    } catch (err) {
      setError(formatErrorMessage(err, "Failed to update Word document."));
    } finally {
      setIsUpdatingDoc(false);
    }
  };

  const copyLinkToClipboard = () => {
    if (!download) return;
    navigator.clipboard.writeText(download);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const copyTextToClipboard = () => {
    if (!extractedText) return;
    navigator.clipboard.writeText(extractedText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const resetForm = () => {
    fileItems.forEach((item) => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    });
    setFileItems([]);
    setDownload("");
    setOutputPagesCount(1);
    setExtractedText("");
    setSections([]);
    setActiveTab("all");
    setStats({ wordCount: 0, charCount: 0, lineCount: 0 });
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
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-4 shadow-inner">
          <ScanText className="w-3.5 h-3.5" /> Multi-Page OCR & Word Converter
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold font-heading text-white tracking-tight">
          Convert <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-300">Images to Word</span>
        </h1>
        <p className="text-slate-400 text-sm sm:text-base mt-2 max-w-xl mx-auto">
          Upload single or multiple images to extract readable text via OCR, organize pages in custom order, and compile into an editable Word document (.docx).
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
                  ? "border-blue-500 bg-blue-500/10 scale-[1.01]"
                  : fileItems.length > 0
                  ? "border-blue-500/40 bg-slate-900/50 hover:bg-slate-900/70"
                  : "border-slate-700/80 hover:border-blue-500/60 bg-slate-900/40 hover:bg-slate-900/80"
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
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-500/20 to-indigo-500/20 border border-blue-500/30 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-base sm:text-lg font-bold font-heading text-white mb-1">
                  Drag & Drop multiple images here
                </h3>
                <p className="text-slate-400 text-xs sm:text-sm mb-3">
                  PNG, JPG, WEBP, BMP, TIFF, SVG (Select multiple pages)
                </p>
                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/30 transition-all">
                  <Plus className="w-4 h-4" /> Browse & Select Images
                </span>
              </div>
            </div>

            {/* Selected Images List with Reordering Controls */}
            {fileItems.length > 0 && (
              <div className="mt-6 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400">
                      <Layers className="w-4 h-4" /> {fileItems.length} {fileItems.length === 1 ? "Image Page" : "Image Pages"} ({formatBytes(totalSizeBytes)})
                    </span>
                    <span className="text-[11px] text-slate-500 hidden sm:inline">
                      • Reorder pages using ↑ ↓
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
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 text-xs font-semibold transition-colors"
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
                        <span className="shrink-0 px-2 py-1 rounded-md bg-blue-500/15 border border-blue-500/30 text-blue-300 font-bold text-[11px] font-mono">
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
                            <ImageIcon className="w-4 h-4 text-blue-400" />
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
                    <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                    {progressStatus}
                  </span>
                  <span className="font-mono font-semibold">{progress}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-400 rounded-full transition-all duration-300 shadow-lg shadow-blue-500/50"
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
            <div className="mt-6">
              <button
                type="button"
                onClick={handleConvert}
                disabled={fileItems.length === 0 || isConverting}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-500 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-400 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-sm text-white shadow-xl shadow-blue-600/25 flex items-center justify-center gap-2 transition-all transform active:scale-[0.99]"
              >
                {isConverting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Extracting Text & Generating Word Document...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Extract Text & Convert {fileItems.length} {fileItems.length === 1 ? "Image" : "Images"} to Word (.docx)
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Result & Extracted Text View */
          <div className="space-y-6">
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-emerald-500/10 animate-bounce">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>

              <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
                Conversion Successful • {outputPagesCount} {outputPagesCount === 1 ? "Page" : "Pages"}
              </span>
              <h3 className="text-2xl font-bold font-heading text-white mb-2">
                Your Multi-Page Word Document is Ready!
              </h3>
              <p className="text-slate-400 text-xs sm:text-sm max-w-md mx-auto">
                {message || `Extracted text from ${outputPagesCount} page(s) and converted into an editable DOCX document.`}
              </p>
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-lg mx-auto">
              <a
                href={download}
                download
                className="w-full sm:w-auto flex-1 py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-sm shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all hover:scale-105"
              >
                <Download className="w-4 h-4" /> Download Word DOCX ({outputPagesCount} {outputPagesCount === 1 ? "Page" : "Pages"})
              </a>

              <button
                type="button"
                onClick={copyLinkToClipboard}
                className="w-full sm:w-auto px-4 py-3.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copiedLink ? "Copied Link!" : "Copy Link"}
              </button>
            </div>

            {/* Stats Bar */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs font-mono">
              <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                Pages: <span className="text-blue-400 font-bold">{outputPagesCount}</span>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                Words: <span className="text-emerald-400 font-bold">{stats.wordCount.toLocaleString()}</span>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                Chars: <span className="text-indigo-400 font-bold">{stats.charCount.toLocaleString()}</span>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                Lines: <span className="text-violet-400 font-bold">{stats.lineCount.toLocaleString()}</span>
              </div>
            </div>

            {/* Extracted Text Preview & Live Editor */}
            {extractedText && (
              <div className="space-y-3 bg-slate-900/90 rounded-2xl border border-slate-800 p-4 sm:p-5 text-left">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3 mb-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                    <Edit3 className="w-4 h-4 text-indigo-400" />
                    <span>Extracted Text (Editable Preview)</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={copyTextToClipboard}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                    >
                      {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedText ? "Copied!" : "Copy Text"}
                    </button>
                  </div>
                </div>

                {/* Per-Page Section Tabs if multiple sections */}
                {sections.length > 1 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-2 custom-scrollbar">
                    <button
                      type="button"
                      onClick={() => setActiveTab("all")}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                        activeTab === "all"
                          ? "bg-blue-600 text-white"
                          : "bg-slate-800 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      All Pages Combined
                    </button>
                    {sections.map((sec, sIdx) => (
                      <button
                        key={sIdx}
                        type="button"
                        onClick={() => setActiveTab(sIdx)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                          activeTab === sIdx
                            ? "bg-blue-600 text-white"
                            : "bg-slate-800 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        Page {sIdx + 1}
                      </button>
                    ))}
                  </div>
                )}

                {/* Textarea View: All pages or single section */}
                {activeTab === "all" ? (
                  <textarea
                    rows={10}
                    value={extractedText}
                    onChange={(e) => setExtractedText(e.target.value)}
                    placeholder="Extracted text from image(s)..."
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-indigo-500 font-sans leading-relaxed resize-y custom-scrollbar"
                  />
                ) : (
                  <div className="space-y-2">
                    <div className="text-[11px] font-mono text-slate-400 bg-slate-950/50 px-2.5 py-1 rounded-md border border-slate-800 inline-block">
                      {sections[activeTab]?.title || `Page ${activeTab + 1}`}
                    </div>
                    <textarea
                      rows={8}
                      value={sections[activeTab]?.text || ""}
                      readOnly
                      className="w-full bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-xs sm:text-sm text-slate-200 focus:outline-none font-sans leading-relaxed resize-y custom-scrollbar"
                    />
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <span className="text-[11px] text-slate-400">
                    Use <code className="text-indigo-400 bg-slate-800 px-1 py-0.5 rounded">--- Page Break ---</code> to separate pages when editing.
                  </span>
                  <button
                    type="button"
                    onClick={handleUpdateDocumentFromText}
                    disabled={isUpdatingDoc}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    {isUpdatingDoc ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Updating Document...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" /> Update & Download DOCX
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Error Message inside result view */}
            {error && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3 text-rose-400 text-xs sm:text-sm">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            <div className="pt-4 border-t border-slate-800 text-center">
              <button
                type="button"
                onClick={resetForm}
                className="text-xs text-blue-400 hover:text-blue-300 font-semibold inline-flex items-center gap-1"
              >
                Convert More Images <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageToWord;
