import React from "react";

const Footer = () => {
  return (
    <footer className="bg-gray-900 border-t border-gray-800 mt-12">
      <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-3">
        
        <p className="text-gray-400 text-sm">
          © {new Date().getFullYear()} PDF Converter. All rights reserved.
        </p>

        <p className="text-gray-500 text-sm">
          Built with <span className="text-blue-400">React</span> &{" "}
          <span className="text-green-400">Django REST</span>
        </p>

      </div>
    </footer>
  );
};

export default Footer;
