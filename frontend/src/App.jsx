import React, { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";
import Navbar from "./components/Navbar";
import ToolSelectorGrid from "./components/ToolSelectorGrid";
import FeatureGrid from "./components/FeatureGrid";
import FaqSection from "./components/FaqSection";
import Footer from "./components/Footer";

// Lazy-loaded routes for ultra-fast initial bundle loading
const PdfToWord = lazy(() => import("./components/PdfToWord"));
const WordToPdf = lazy(() => import("./components/WordToPdf"));
const PdfToPpt = lazy(() => import("./components/PdfToPpt"));
const PptToPdf = lazy(() => import("./components/PptToPdf"));
const ExcelToPdf = lazy(() => import("./components/ExcelToPdf"));
const PdfToExcel = lazy(() => import("./components/PdfToExcel"));
const ImageToPdf = lazy(() => import("./components/ImageToPdf"));
const PdfToImage = lazy(() => import("./components/PdfToImage"));
const MergePdf = lazy(() => import("./components/MergePdf"));
const SplitPdf = lazy(() => import("./components/SplitPdf"));
const RotatePdf = lazy(() => import("./components/RotatePdf"));
const CompressPdf = lazy(() => import("./components/CompressPdf"));
const CompressImage = lazy(() => import("./components/CompressImage"));
const CompressWord = lazy(() => import("./components/CompressWord"));
const CompressPpt = lazy(() => import("./components/CompressPpt"));

const PageLoader = () => (
  <div className="max-w-4xl mx-auto py-16 flex flex-col items-center justify-center space-y-4">
    <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
    <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase animate-pulse">
      Loading Studio Tool...
    </span>
  </div>
);

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative overflow-x-hidden selection:bg-indigo-500 selection:text-white">
        
        {/* Background glow Orbs */}
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-indigo-600/15 via-violet-600/10 to-transparent blur-[120px] pointer-events-none -z-10" />
        <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-rose-500/5 blur-[140px] pointer-events-none -z-10" />
        <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 blur-[140px] pointer-events-none -z-10" />

        {/* Navigation Bar */}
        <Navbar />

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-6">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<PdfToWord />} />
              <Route path="/pdf-to-word" element={<PdfToWord />} />
              <Route path="/word-to-pdf" element={<WordToPdf />} />
              <Route path="/pdf-to-ppt" element={<PdfToPpt />} />
              <Route path="/ppt-to-pdf" element={<PptToPdf />} />
              <Route path="/excel-to-pdf" element={<ExcelToPdf />} />
              <Route path="/pdf-to-excel" element={<PdfToExcel />} />
              <Route path="/image-to-pdf" element={<ImageToPdf />} />
              <Route path="/pdf-to-image" element={<PdfToImage />} />
              <Route path="/merge-pdf" element={<MergePdf />} />
              <Route path="/split-pdf" element={<SplitPdf />} />
              <Route path="/rotate-pdf" element={<RotatePdf />} />
              <Route path="/compress-pdf" element={<CompressPdf />} />
              <Route path="/compress-image" element={<CompressImage />} />
              <Route path="/compress-word" element={<CompressWord />} />
              <Route path="/compress-ppt" element={<CompressPpt />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>


          {/* Suite Tool Selector Grid */}
          <ToolSelectorGrid />

          {/* Feature Highlights Grid */}
          <FeatureGrid />

          {/* FAQ Accordion */}
          <FaqSection />
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </Router>
  );
}

export default App;
