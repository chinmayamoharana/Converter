import React, { useState, useEffect } from "react";
import { History, Download, Trash2, FileText, FileCode, CheckCircle2 } from "lucide-react";

const RecentConversions = () => {
  const [history, setHistory] = useState([]);

  const loadHistory = () => {
    try {
      const saved = localStorage.getItem("omni_conversions_history");
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch {
      setHistory([]);
    }
  };

  useEffect(() => {
    loadHistory();
    const handleStorageChange = () => loadHistory();
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("conversionAdded", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("conversionAdded", handleStorageChange);
    };
  }, []);

  const clearHistory = () => {
    localStorage.removeItem("omni_conversions_history");
    setHistory([]);
  };

  if (history.length === 0) return null;

  return (
    <section className="my-12 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-indigo-400" />
          <h3 className="text-lg font-bold font-heading text-white">Recent Conversions</h3>
          <span className="bg-indigo-500/20 text-indigo-300 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-indigo-500/30">
            {history.length}
          </span>
        </div>
        <button
          onClick={clearHistory}
          className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1 transition-colors px-2 py-1 rounded-md hover:bg-slate-800/60"
        >
          <Trash2 className="w-3.5 h-3.5" /> Clear History
        </button>
      </div>

      <div className="glass-card rounded-2xl p-4 border border-slate-800 space-y-3">
        {history.map((item, idx) => (
          <div
            key={idx}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-colors gap-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                  item.type === "pdf-to-word"
                    ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                    : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                }`}
              >
                {item.type === "pdf-to-word" ? (
                  <FileText className="w-5 h-5" />
                ) : (
                  <FileCode className="w-5 h-5" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-200 truncate max-w-[180px] xs:max-w-[240px] sm:max-w-xs md:max-w-sm">
                  {item.originalName || "Document"}
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                  <span className="capitalize">{item.type.replace(/-/g, " ")}</span>
                  <span>•</span>
                  <span>{item.date}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
              <span className="inline-flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 mr-2">
                <CheckCircle2 className="w-3 h-3" /> Ready
              </span>
              <a
                href={item.downloadUrl}
                download
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Download
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default RecentConversions;
