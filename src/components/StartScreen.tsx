import React, { useEffect, useState } from "react";

const SESSION_KEY = "pos-sales-engine-start-seen-v1";

export function StartScreen({ onEnter }: { onEnter: () => void }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const seen = sessionStorage.getItem(SESSION_KEY);
    if (seen) {
      onEnter();
      return;
    }
    sessionStorage.setItem(SESSION_KEY, "1");
    const timer = window.setTimeout(() => setVisible(false), 2200);
    return () => window.clearTimeout(timer);
  }, [onEnter]);

  useEffect(() => {
    if (!visible) onEnter();
  }, [visible, onEnter]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-white flex items-end justify-center overflow-hidden cursor-pointer"
      onClick={() => setVisible(false)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") setVisible(false);
      }}
      aria-label="Enter POS Sales Engine"
    >
      <div
        className="absolute inset-0 bg-center bg-contain bg-no-repeat"
        style={{ backgroundImage: "url('/edge-brand.jpeg')" }}
      />
      <div className="relative z-10 mb-7 text-center text-slate-700 text-xs sm:text-sm tracking-[0.08em] font-medium bg-white/80 backdrop-blur-sm rounded-full px-5 py-2 shadow-sm">
        Designed by Mehdi Namdar&nbsp;&nbsp;•&nbsp;&nbsp;Version 1.0
      </div>
      <div className="absolute bottom-2 text-[9px] text-slate-400">Tap to enter</div>
    </div>
  );
}
