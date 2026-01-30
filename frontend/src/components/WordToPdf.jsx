import React, { useState } from "react";
import api from "../api/axios";

const WordToPdf = () => {
  const [file, setFile] = useState(null);
  const [download, setDownload] = useState("");

  const handleConvert = async () => {
    if (!file) return alert("Please select a Word file");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post("word-to-pdf/", formData);
      setDownload("http://127.0.0.1:8000" + res.data.file);
    } catch (err) {
      alert("Conversion failed");
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl shadow-xl p-8">
        
        <h2 className="text-2xl font-bold text-white mb-6 text-center">
          Word → PDF Converter
        </h2>

        <label className="block mb-4">
          <span className="text-gray-400 text-sm mb-1 block">
            Select Word file
          </span>
          <input
            type="file"
            accept=".docx"
            onChange={(e) => setFile(e.target.files[0])}
            className="block w-full text-sm text-gray-300
              file:mr-4 file:py-2 file:px-4
              file:rounded-lg file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-600 file:text-white
              hover:file:bg-blue-500
              cursor-pointer"
          />
        </label>

        <button
          onClick={handleConvert}
          className="w-full py-2.5 mt-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition duration-200"
        >
          Convert to PDF
        </button>

        {download && (
          <a
            href={download}
            download
            className="block text-center mt-6 py-2 border border-green-500 text-green-400 rounded-lg hover:bg-green-500 hover:text-white transition"
          >
            Download PDF File
          </a>
        )}
      </div>
    </div>
  );
};

export default WordToPdf;
