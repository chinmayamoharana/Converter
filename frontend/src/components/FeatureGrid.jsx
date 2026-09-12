import React from "react";
import { Zap, ShieldCheck, Layout, Eye, Sparkles } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "High-Speed Conversion",
    description: "Powered by optimized Django REST backend processing for rapid conversion in seconds.",
    color: "from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-400",
  },
  {
    icon: Layout,
    title: "Layout Preservation",
    description: "Maintains document formatting, tables, typography, and embedded graphics with high fidelity.",
    color: "from-blue-500/20 to-cyan-500/20 border-blue-500/30 text-blue-400",
  },
  {
    icon: Eye,
    title: "Smart OCR Fallback",
    description: "Scanned and image-only PDFs automatically convert into high-resolution Word page snapshots.",
    color: "from-violet-500/20 to-purple-500/20 border-violet-500/30 text-violet-400",
  },
  {
    icon: ShieldCheck,
    title: "Private & Secure",
    description: "Files are processed in isolated memory and automatically purged after session completion.",
    color: "from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-400",
  },
];

const FeatureGrid = () => {
  return (
    <section className="my-16">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-3">
          <Sparkles className="w-3.5 h-3.5" /> Core Capabilities
        </span>
        <h3 className="text-2xl sm:text-3xl font-bold font-heading text-white tracking-tight">
          Engineered for Accuracy & Speed
        </h3>
        <p className="text-slate-400 text-sm sm:text-base mt-2">
          Experience seamless document translation with our dual-engine architecture.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {features.map((feature, idx) => {
          const IconComponent = feature.icon;
          return (
            <div
              key={idx}
              className="glass-card p-6 rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/5 group"
            >
              <div className={`w-12 h-12 rounded-xl border flex items-center justify-center bg-gradient-to-br ${feature.color} mb-5 group-hover:scale-110 transition-transform duration-300`}>
                <IconComponent className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-semibold text-white mb-2 font-heading">
                {feature.title}
              </h4>
              <p className="text-slate-400 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default FeatureGrid;
