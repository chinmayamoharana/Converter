import React from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="px-8 py-4 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 flex gap-8 items-center shadow-lg border-b border-gray-700">
      <Link
        to="/"
        className="text-gray-200 font-semibold tracking-wide relative after:content-[''] after:absolute after:left-0 after:-bottom-1 after:w-0 after:h-[2px] after:bg-blue-500 after:transition-all after:duration-300 hover:after:w-full hover:text-blue-400"
      >
        PDF → Word
      </Link>

      <Link
        to="/word-to-pdf"
        className="text-gray-200 font-semibold tracking-wide relative after:content-[''] after:absolute after:left-0 after:-bottom-1 after:w-0 after:h-[2px] after:bg-blue-500 after:transition-all after:duration-300 hover:after:w-full hover:text-blue-400"
      >
        Word → PDF
      </Link>
    </nav>
  );
};

export default Navbar;
