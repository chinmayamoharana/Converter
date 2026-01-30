import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./index.css"
import Navbar from "./components/Navbar";
import PdfToWord from "./components/PdfToWord";
import WordToPdf from "./components/WordToPdf";
import Footer from "./components/Footer";

function App() {
  return (
    <Router>
      <Navbar />

      <div style={{ padding: 20 }}>
        <Routes>
          <Route path="/" element={<PdfToWord />} />
          <Route path="/word-to-pdf" element={<WordToPdf />} />
        </Routes>
      </div>
      <Footer/>
    </Router>
  );
}

export default App;
