import React, { useState, useRef, useMemo } from "react";
import api from "../api/axios";
import { validateFileSize, formatErrorMessage, getDownloadUrl, executeApiCall } from "../utils/apiHelpers";
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
  Search,
  ScanText,
  Layers,
  FileCode,
  ListFilter,
} from "lucide-react";

const formatBytes = (bytes, decimals = 2) => {
  if (!bytes || bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

const ExtractText = () => {
  const [file, setFile] = useState(null);
  const [resultData, setResultData] = useState(null);
  const [error, setError] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // 'all', 'sections', 'json'

  const fileInputRef = useRef(null);

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;
    const sizeErr = validateFileSize(selectedFile);
    if (sizeErr) {
      setError(sizeErr);
      setFile(null);
      return;
    }
    setFile(selectedFile);
    setError("");
    setResultData(null);
    setSearchQuery("");
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

  const handleExtractText = async () => {
    if (!file) {
      setError("Please select a file first.");
      return;
    }

    const sizeErr = validateFileSize(file);
    if (sizeErr) {
      setError(sizeErr);
      return;
    }

    setIsExtracting(true);
    setError("");
    setResultData(null);
    setProgress(15);
    setProgressStatus("Preparing file for text analysis...");

    try {
      const res = await executeApiCall("extract-text/", file, {}, (pct, statusText) => {
        setProgress(pct);
        if (statusText) setProgressStatus(statusText);
      });

      if (res.data && res.data.extracted_text !== undefined) {
        setProgress(100);
        setProgressStatus("Text extraction completed!");
        setResultData(res.data);
      } else {
        throw new Error(res.data.error || "Text extraction returned empty result.");
      }
    } catch (err) {
      console.error("Text Extraction Error:", err);
      setError(formatErrorMessage(err, "Failed to extract text. Please check the file format and try again."));
    } finally {
      setIsExtracting(false);
    }
  };

  const handleCopyText = () => {
    if (!resultData?.extracted_text) return;
    navigator.clipboard.writeText(resultData.extracted_text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleReset = () => {
    setFile(null);
    setResultData(null);
    setError("");
    setProgress(0);
    setProgressStatus("");
    setSearchQuery("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Memoized filter text & search match calculation for ultra-fast UI rendering
  const filteredText = resultData?.extracted_text || "";
  const matchCount = useMemo(() => {
    if (!searchQuery.trim() || !filteredText) return 0;
    try {
      const escaped = searchQuery.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
      const matches = filteredText.match(new RegExp(escaped, "gi"));
      return matches ? matches.length : 0;
    } catch {
      return 0;
    }
  }, [searchQuery, filteredText]);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header Section */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
          <ScanText className="w-3.5 h-3.5" /> Universal OCR & Text Extractor
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-heading">
          Extract Text from Images & All Files
        </h1>
        <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
          Instantly parse and extract readable text from Images (PNG, JPG, WEBP), PDFs, Word documents, Excel sheets, PowerPoint slides, and code/text files.
        </p>
      </div>

      {/* Main Glass Workspace Card */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">

        {/* Upload State (When no result yet) */}
        {!resultData ? (
          <div className="space-y-6">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-300 relative group ${
                isDragging
                  ? "border-indigo-500 bg-indigo-500/10 scale-[1.01]"
                  : file
                  ? "border-emerald-500/50 bg-emerald-500/5"
                  : "border-slate-800 hover:border-slate-700 hover:bg-slate-900/50"
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => handleFileSelect(e.target.files[0])}
                className="hidden"
              />

              {!file ? (
                <div className="space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                    <UploadCloud className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-lg">
                      Drag & Drop your file here or <span className="text-indigo-400 underline underline-offset-4">Browse</span>
                    </p>
                    <p className="text-slate-400 text-xs mt-1">
                      Supports Images (PNG, JPG, WEBP), PDF, DOCX, XLSX, PPTX, TXT, JSON, CSV, PY, JS, HTML & more (Max 20MB)
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-4 py-2">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                    <FileCheck className="w-6 h-6" />
                  </div>
                  <div className="text-left truncate">
                    <p className="text-white font-bold text-sm truncate max-w-xs sm:max-w-md">
                      {file.name}
                    </p>
                    <p className="text-slate-400 text-xs font-mono">
                      {formatBytes(file.size)} • Selected
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Error Banner */}
            {error && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs sm:text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
                <div className="leading-relaxed">{error}</div>
              </div>
            )}

            {/* Extraction Progress Bar */}
            {isExtracting && (
              <div className="space-y-2 bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                <div className="flex justify-between text-xs text-slate-300 font-medium">
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                    {progressStatus || "Extracting text..."}
                  </span>
                  <span className="font-mono text-indigo-400 font-bold">{progress}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-indigo-500 via-violet-500 to-emerald-400 h-full transition-all duration-300 rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Submit Action Button */}
            <button
              onClick={handleExtractText}
              disabled={!file || isExtracting}
              className={`w-full py-4 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl transition-all ${
                !file || isExtracting
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50"
                  : "bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5"
              }`}
            >
              {isExtracting ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" /> Extracting Text...
                </>
              ) : (
                <>
                  <ScanText className="w-5 h-5" /> Extract Text Now
                </>
              )}
            </button>
          </div>
        ) : (
          /* Results View (Text Extracted Successfully) */
          <div className="space-y-6 animate-fade-in">
            {/* Header Result Badges */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm sm:text-base truncate max-w-xs">
                    {resultData.file_name}
                  </h3>
                  <span className="inline-block text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mt-0.5">
                    {resultData.file_type}
                  </span>
                </div>
              </div>

              {/* Stat Counters */}
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                <div className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300">
                  Words: <span className="text-emerald-400 font-bold">{resultData.word_count.toLocaleString()}</span>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300">
                  Chars: <span className="text-indigo-400 font-bold">{resultData.char_count.toLocaleString()}</span>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300">
                  Lines: <span className="text-violet-400 font-bold">{resultData.line_count.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Search & Actions Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Search Bar inside extracted text */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search in extracted text..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-16 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
                {searchQuery.trim() && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-indigo-400 border border-slate-700">
                    {matchCount} match{matchCount === 1 ? "" : "es"}
                  </span>
                )}
              </div>

              {/* View Tabs */}
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setActiveTab("all")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === "all"
                      ? "bg-indigo-600 text-white shadow-md"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  All Text
                </button>
                <button
                  onClick={() => setActiveTab("sections")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === "sections"
                      ? "bg-indigo-600 text-white shadow-md"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Sections ({resultData.sections?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab("json")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === "json"
                      ? "bg-indigo-600 text-white shadow-md"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  JSON
                </button>
              </div>
            </div>

            {/* Extracted Text Content Box */}
            <div className="relative rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-inner">
              {activeTab === "all" && (
                <textarea
                  readOnly
                  value={resultData.extracted_text}
                  rows={14}
                  className="w-full p-4 sm:p-5 bg-transparent text-slate-200 text-xs sm:text-sm font-mono leading-relaxed focus:outline-none resize-y selection:bg-indigo-500 selection:text-white"
                />
              )}

              {activeTab === "sections" && (
                <div className="max-h-[420px] overflow-y-auto p-4 sm:p-5 space-y-4">
                  {resultData.sections?.map((sec, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-indigo-400 border-b border-slate-800 pb-2">
                        <span className="flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5" /> {sec.title}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {sec.text.length} chars
                        </span>
                      </div>
                      <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed overflow-x-auto">
                        {sec.text}
                      </pre>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "json" && (
                <pre className="max-h-[420px] overflow-y-auto p-4 sm:p-5 text-xs font-mono text-emerald-400 leading-relaxed">
                  {JSON.stringify(resultData, null, 2)}
                </pre>
              )}
            </div>

            {/* Quick Output Actions: Copy, Download, Extract New */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                onClick={handleCopyText}
                className="w-full sm:w-auto flex-1 py-3 px-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-indigo-400" /> Copy Extracted Text
                  </>
                )}
              </button>

              {resultData.file && (
                <a
                  href={getDownloadUrl(resultData.file)}
                  download={`${resultData.file_name || "extracted-text"}.txt`}
                  className="w-full sm:w-auto flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/30"
                >
                  <Download className="w-4 h-4" /> Download .TXT File
                </a>
              )}

              <button
                onClick={handleReset}
                className="w-full sm:w-auto py-3 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all"
              >
                <RefreshCw className="w-4 h-4" /> Extract Another File
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
        <div className="p-4 rounded-2xl glass-card border border-slate-800 space-y-1.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <ScanText className="w-4 h-4" />
          </div>
          <h4 className="text-white font-bold text-xs">OCR & Multi-Format Engine</h4>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Extracts embedded & visual text from scanned images, PDFs, Word tables, and slide decks.
          </p>
        </div>

        <div className="p-4 rounded-2xl glass-card border border-slate-800 space-y-1.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
          <h4 className="text-white font-bold text-xs">Structured Sections & Search</h4>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Organizes output page-by-page, sheet-by-sheet with instant real-time keyword search.
          </p>
        </div>

        <div className="p-4 rounded-2xl glass-card border border-slate-800 space-y-1.5">
          <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center">
            <FileCode className="w-4 h-4" />
          </div>
          <h4 className="text-white font-bold text-xs">Instant Export & API Ready</h4>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Copy to clipboard or download formatted text and structured JSON instantly.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ExtractText;
