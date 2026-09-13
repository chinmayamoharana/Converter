import React from "react";
import { Link } from "react-router-dom";
import Logo from "./Logo";
import { ShieldCheck, Heart, Lock } from "lucide-react";

const Footer = () => {
  return (
    <footer className="mt-20 border-t border-slate-800/80 bg-slate-950/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          
          {/* Brand Column */}
          <div className="sm:col-span-2 space-y-4">
            <Link to="/" className="w-fit block">
              <Logo size="md" />
            </Link>
            <p className="text-slate-400 text-sm max-w-md leading-relaxed">
              Ultra-fast, secure online document converter and compressor suite. Transform PDFs, Word documents, PowerPoint presentations, Excel spreadsheets, and images in seconds.
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <ShieldCheck className="w-4 h-4" /> Zero File Retention (Auto-Purged)
              </span>
              <span className="flex items-center gap-1.5 text-slate-400">
                <Lock className="w-3.5 h-3.5 text-indigo-400" /> Encrypted Transmission
              </span>
            </div>
          </div>

          {/* Quick Tools */}
          <div>
            <h4 className="text-sm font-bold font-heading text-slate-200 uppercase tracking-wider mb-4">
              Popular Tools
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400 font-semibold">
              <li>
                <Link to="/pdf-to-word" className="hover:text-indigo-400 transition-colors">
                  PDF to Word Converter
                </Link>
              </li>
              <li>
                <Link to="/excel-to-pdf" className="hover:text-indigo-400 transition-colors">
                  Excel to PDF Sheet
                </Link>
              </li>
              <li>
                <Link to="/merge-pdf" className="hover:text-indigo-400 transition-colors">
                  Merge PDF Documents
                </Link>
              </li>
              <li>
                <Link to="/compress-pdf" className="hover:text-indigo-400 transition-colors">
                  Compress PDF File
                </Link>
              </li>
              <li>
                <Link to="/rotate-pdf" className="hover:text-indigo-400 transition-colors">
                  Rotate PDF Pages
                </Link>
              </li>
            </ul>
          </div>

          {/* Supported Formats */}
          <div>
            <h4 className="text-sm font-bold font-heading text-slate-200 uppercase tracking-wider mb-4">
              Supported Formats
            </h4>
            <div className="flex flex-wrap gap-2">
              {["PDF", "DOCX", "PPTX", "XLSX", "PNG", "JPG", "WEBP", "ZIP"].map((fmt) => (
                <span
                  key={fmt}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono font-bold text-slate-300 shadow-inner"
                >
                  .{fmt}
                </span>
              ))}
            </div>
          </div>

        </div>

        {/* Bottom copyright bar */}
        <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} OmniConvert Document Studio. All rights reserved.</p>
          <p className="flex items-center gap-1.5">
            Designed for privacy & performance <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500/20" />
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
