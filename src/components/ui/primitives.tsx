import React from "react";

export function Card({ children, className = "", padded = true }: { children: React.ReactNode; className?: string; padded?: boolean }) {
  return (
    <div className={`rounded-2xl border bg-white dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 shadow-sm ${padded ? "p-5" : ""} ${className}`}>
      {children}
    </div>
  );
}

export function Button({
  children, onClick, variant = "secondary", className = "", type = "button", disabled,
}: {
  children: React.ReactNode; onClick?: () => void; variant?: "primary" | "secondary" | "danger";
  className?: string; type?: "button" | "submit"; disabled?: boolean;
}) {
  const styles = {
    primary: "bg-teal-700 border-teal-700 text-white hover:bg-teal-800",
    secondary: "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700",
    danger: "bg-rose-600 border-rose-600 text-white hover:bg-rose-700",
  };
  return (
    <button type={type} disabled={disabled} onClick={onClick}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2.5 min-h-[40px] text-xs font-medium border transition-colors disabled:opacity-50 ${styles[variant]} ${className}`}>
      {children}
    </button>
  );
}

export function SectionTitle({ children, desc }: { children: React.ReactNode; desc?: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{children}</h2>
      {desc && <p className="text-sm mt-1 text-slate-500 dark:text-slate-400">{desc}</p>}
    </div>
  );
}

export function Label({ children }: { children: React.ReactNode }) {
  return <span className="block text-sm mb-1.5 font-medium text-slate-600 dark:text-slate-300">{children}</span>;
}
