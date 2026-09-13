import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import Logo from "./Logo";
import {
  Sparkles,
  ShieldCheck,
  Zap,
  ChevronDown,
  LayoutGrid,
  Menu,
  X,
  ArrowRight,
} from "lucide-react";
import { toolsList } from "./ToolSelectorGrid";

const Navbar = () => {
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close menus on route change
  useEffect(() => {
    setDropdownOpen(false);
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const currentTool =
    toolsList.find(
      (t) =>
        t.path === location.pathname ||
        (location.pathname === "/" && t.id === "pdf-to-word")
    ) || toolsList[0];

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          
          {/* Logo Brand */}
          <Link to="/" className="shrink-0">
            <Logo size="md" />
          </Link>

          {/* Header Center / Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Tool Selector Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 text-xs sm:text-sm font-bold text-white shadow-inner transition-all min-h-[38px]"
              >
                <LayoutGrid className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400 shrink-0" />
                <span className="hidden md:inline text-slate-400">Tool:</span>
                <span className="text-indigo-300 max-w-[100px] xs:max-w-[140px] sm:max-w-none truncate">
                  {currentTool.title}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${
                    dropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {dropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-72 sm:w-80 max-h-[80vh] overflow-y-auto rounded-2xl glass-panel border border-slate-700 shadow-2xl p-2 z-50 space-y-1">
                    <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 mb-1 sticky top-0 bg-slate-950/90 backdrop-blur-md">
                      Select Converter Tool ({toolsList.length})
                    </div>
                    {toolsList.map((tool) => {
                      const Icon = tool.icon;
                      const isSelected = currentTool.id === tool.id;
                      return (
                        <Link
                          key={tool.id}
                          to={tool.path}
                          onClick={() => setDropdownOpen(false)}
                          className={`flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold transition-all ${
                            isSelected
                              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                              : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <Icon className="w-4 h-4 shrink-0" />
                            <span className="truncate">{tool.title}</span>
                          </div>
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded-md shrink-0 ${
                              isSelected
                                ? "bg-white/20 text-white"
                                : "bg-slate-900 text-slate-400 border border-slate-800"
                            }`}
                          >
                            {tool.badge}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Desktop Status Badges */}
            <div className="hidden lg:flex items-center gap-2.5">
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
                <Zap className="w-3.5 h-3.5 animate-pulse" />
                <span className="font-medium">{toolsList.length} Tools Active</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900/80 px-3 py-1.5 rounded-full border border-slate-800">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>Auto-Purged</span>
              </div>
            </div>

            {/* Mobile Menu Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Slide-Out Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-800/80 bg-slate-950/95 backdrop-blur-2xl px-4 py-4 space-y-4 max-h-[85vh] overflow-y-auto">
          <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-900">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Studio Tools</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <Zap className="w-3 h-3" /> REST API Online
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {toolsList.map((tool) => {
              const Icon = tool.icon;
              const isSelected = currentTool.id === tool.id;
              return (
                <Link
                  key={tool.id}
                  to={tool.path}
                  className={`flex items-center justify-between p-3 rounded-xl text-xs font-semibold border transition-all ${
                    isSelected
                      ? "bg-indigo-600 border-indigo-500 text-white shadow-lg"
                      : "bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className="w-4 h-4 shrink-0 text-indigo-400" />
                    <span className="truncate">{tool.title}</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 opacity-60 shrink-0" />
                </Link>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-900 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" /> End-to-End Encrypted
            </span>
            <span className="font-mono text-[10px] text-slate-500">v2.0</span>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
