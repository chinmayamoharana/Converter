import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FileText,
  FileSpreadsheet,
  Presentation,
  Image as ImageIcon,
  Combine,
  Minimize2,
  Sparkles,
  ArrowRight,
  Scissors,
  RotateCw,
} from "lucide-react";

export const toolsList = [
  {
    id: "pdf-to-word",
    path: "/pdf-to-word",
    title: "PDF to Word",
    desc: "Convert PDF to editable DOCX documents",
    icon: FileText,
    badge: "DOCX",
    color: "from-rose-500/20 to-pink-500/20 text-rose-400 border-rose-500/30",
  },
  {
    id: "word-to-pdf",
    path: "/word-to-pdf",
    title: "Word to PDF",
    desc: "Convert DOCX documents to PDF format",
    icon: FileText,
    badge: "PDF",
    color: "from-violet-500/20 to-purple-500/20 text-violet-400 border-violet-500/30",
  },
  {
    id: "pdf-to-ppt",
    path: "/pdf-to-ppt",
    title: "PDF to PPT",
    desc: "Export PDF pages into PowerPoint slides",
    icon: Presentation,
    badge: "PPTX",
    color: "from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30",
  },
  {
    id: "ppt-to-pdf",
    path: "/ppt-to-pdf",
    title: "PPT to PDF",
    desc: "Convert PowerPoint decks into PDF format",
    icon: Presentation,
    badge: "PDF",
    color: "from-orange-500/20 to-yellow-500/20 text-orange-400 border-orange-500/30",
  },
  {
    id: "excel-to-pdf",
    path: "/excel-to-pdf",
    title: "Excel to PDF",
    desc: "Convert Excel sheets (.xlsx) to PDF document",
    icon: FileSpreadsheet,
    badge: "PDF",
    color: "from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30",
  },
  {
    id: "pdf-to-excel",
    path: "/pdf-to-excel",
    title: "PDF to Excel",
    desc: "Extract PDF tables into Excel (.xlsx)",
    icon: FileSpreadsheet,
    badge: "XLSX",
    color: "from-teal-500/20 to-emerald-500/20 text-teal-400 border-teal-500/30",
  },
  {
    id: "image-to-pdf",
    path: "/image-to-pdf",
    title: "Image to PDF",
    desc: "Convert JPG, PNG, WEBP images to PDF",
    icon: ImageIcon,
    badge: "PDF",
    color: "from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30",
  },
  {
    id: "pdf-to-image",
    path: "/pdf-to-image",
    title: "PDF to Image",
    desc: "Export PDF pages as PNG images or ZIP",
    icon: ImageIcon,
    badge: "PNG",
    color: "from-cyan-500/20 to-sky-500/20 text-cyan-400 border-cyan-500/30",
  },
  {
    id: "merge-pdf",
    path: "/merge-pdf",
    title: "Merge PDF",
    desc: "Combine multiple PDF files into one",
    icon: Combine,
    badge: "MERGE",
    color: "from-indigo-500/20 to-violet-500/20 text-indigo-400 border-indigo-500/30",
  },
  {
    id: "split-pdf",
    path: "/split-pdf",
    title: "Split PDF",
    desc: "Split multi-page PDF into single pages ZIP",
    icon: Scissors,
    badge: "SPLIT",
    color: "from-purple-500/20 to-indigo-500/20 text-purple-400 border-purple-500/30",
  },
  {
    id: "rotate-pdf",
    path: "/rotate-pdf",
    title: "Rotate PDF",
    desc: "Rotate PDF page orientation by 90°, 180°, 270°",
    icon: RotateCw,
    badge: "ROTATE",
    color: "from-sky-500/20 to-blue-500/20 text-sky-400 border-sky-500/30",
  },
  {
    id: "compress-pdf",
    path: "/compress-pdf",
    title: "Compress PDF",
    desc: "Reduce PDF file size for easy sharing",
    icon: Minimize2,
    badge: "PDF",
    color: "from-blue-500/20 to-teal-500/20 text-blue-400 border-blue-500/30",
  },
  {
    id: "compress-image",
    path: "/compress-image",
    title: "Compress Image",
    desc: "Compress JPG, PNG, WEBP image files",
    icon: Minimize2,
    badge: "IMAGE",
    color: "from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30",
  },
  {
    id: "compress-word",
    path: "/compress-word",
    title: "Compress Word",
    desc: "Reduce Word document (.docx) file size",
    icon: Minimize2,
    badge: "DOCX",
    color: "from-rose-500/20 to-pink-500/20 text-rose-400 border-rose-500/30",
  },
  {
    id: "compress-ppt",
    path: "/compress-ppt",
    title: "Compress PPT",
    desc: "Reduce PowerPoint deck (.pptx) file size",
    icon: Minimize2,
    badge: "PPTX",
    color: "from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30",
  },
];


const ToolSelectorGrid = () => {
  const location = useLocation();

  return (
    <section className="my-12">
      <div className="text-center max-w-xl mx-auto mb-8">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-2">
          <Sparkles className="w-3.5 h-3.5" /> Complete Suite
        </span>
        <h2 className="text-2xl sm:text-3xl font-bold font-heading text-white tracking-tight">
          All Conversion & Compression Tools
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {toolsList.map((tool) => {
          const Icon = tool.icon;
          const isActive =
            location.pathname === tool.path ||
            (location.pathname === "/" && tool.id === "pdf-to-word");

          return (
            <Link
              key={tool.id}
              to={tool.path}
              className={`p-5 rounded-2xl border transition-all duration-300 relative group overflow-hidden ${
                isActive
                  ? "bg-slate-900 border-indigo-500/80 shadow-xl shadow-indigo-500/10 ring-1 ring-indigo-500/50"
                  : "glass-card hover:bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:-translate-y-1"
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`w-11 h-11 rounded-xl border flex items-center justify-center bg-gradient-to-br ${tool.color} group-hover:scale-110 transition-transform duration-300`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                  {tool.badge}
                </span>
              </div>

              <h3 className="text-base font-bold font-heading text-white group-hover:text-indigo-300 transition-colors">
                {tool.title}
              </h3>
              <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                {tool.desc}
              </p>

              <div className="mt-4 flex items-center text-xs font-semibold text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                Open Tool <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default ToolSelectorGrid;
