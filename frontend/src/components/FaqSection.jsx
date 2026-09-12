import React, { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

const faqs = [
  {
    question: "What file formats are supported?",
    answer: "You can convert standard PDF documents (.pdf) into editable Word documents (.docx), or Microsoft Word files (.docx) into PDF documents.",
  },
  {
    question: "How does image-based PDF conversion work?",
    answer: "If your PDF consists of scanned images without raw text, our backend automatically detects this and renders high-quality page snapshots embedded cleanly inside the resulting Word file.",
  },
  {
    question: "Are my uploaded files kept private and secure?",
    answer: "Yes. All conversion processing happens locally via Django REST services. Files are stored with unique UUID tokens and clean up automatically after processing.",
  },
  {
    question: "Is there any file size limit?",
    answer: "Our engine supports documents up to standard office sizes (up to 50MB per document). Large files process smoothly with progress tracking.",
  },
];

const FaqSection = () => {
  const [openIndex, setOpenIndex] = useState(0);

  const toggleFaq = (idx) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section className="my-16 max-w-3xl mx-auto">
      <div className="text-center mb-10">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/20 mb-3">
          <HelpCircle className="w-3.5 h-3.5" /> FAQ
        </span>
        <h3 className="text-2xl sm:text-3xl font-bold font-heading text-white tracking-tight">
          Frequently Asked Questions
        </h3>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className="glass-card rounded-xl border border-slate-800/80 overflow-hidden transition-all duration-200"
            >
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full px-6 py-4 text-left flex items-center justify-between text-white font-medium hover:bg-slate-800/40 transition-colors"
              >
                <span className="text-base font-heading pr-4">{faq.question}</span>
                <ChevronDown
                  className={`w-5 h-5 text-indigo-400 shrink-0 transition-transform duration-300 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {isOpen && (
                <div className="px-6 pb-5 pt-1 text-slate-300 text-sm leading-relaxed border-t border-slate-800/50">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default FaqSection;
