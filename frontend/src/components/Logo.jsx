import React from "react";

export const LogoIcon = ({ className = "w-8 h-8" }) => (
  <img 
    src="/logo.svg" 
    alt="OmniConvert Logo" 
    className={`object-contain drop-shadow-[0_4px_12px_rgba(99,102,241,0.4)] hover:scale-105 transition-transform duration-300 ${className}`}
  />
);

const Logo = ({ size = "md", showSubtitle = true, className = "" }) => {
  const sizeMap = {
    sm: { icon: "w-7 h-7", text: "text-lg", sub: "text-[9px]" },
    md: { icon: "w-9 h-9 sm:w-10 sm:h-10", text: "text-lg sm:text-xl", sub: "text-[10px]" },
    lg: { icon: "w-12 h-12", text: "text-2xl sm:text-3xl", sub: "text-xs" },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  return (
    <div className={`flex items-center gap-2.5 sm:gap-3 group shrink-0 ${className}`}>
      <div className="relative">
        <LogoIcon className={currentSize.icon} />
      </div>
      <div>
        <span className={`${currentSize.text} font-extrabold font-heading text-white tracking-tight flex items-center gap-1`}>
          Omni<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-pink-400">Convert</span>
        </span>
        {showSubtitle && (
          <span className={`hidden sm:block ${currentSize.sub} font-medium text-slate-400 tracking-wider uppercase -mt-0.5`}>
            Document Studio
          </span>
        )}
      </div>
    </div>
  );
};

export default Logo;
