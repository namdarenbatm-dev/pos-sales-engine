import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { ErrorBoundary } from "./ErrorBoundary";
import { useFinancialModel } from "../../hooks/FinancialModelContext";

function SampleDataBanner() {
  const m = useFinancialModel();
  if (!m.isSampleData) return null;
  return (
    <div className="no-print bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800 px-4 sm:px-6 py-2 text-xs sm:text-sm text-amber-800 dark:text-amber-300 flex items-center justify-between gap-3 flex-wrap">
      <span>🔖 عددهایی که می‌بینید <b>داده نمونه</b> هستند، نه اطلاعات واقعی کسب‌وکار شما.</span>
      <button
        onClick={() => {
          if (window.confirm("داده‌های نمونه پاک می‌شوند و همه فیلدها صفر می‌شوند. ادامه می‌دهید؟")) m.clearSampleData();
        }}
        className="underline font-medium shrink-0"
      >
        پاک‌کردن و شروع با اطلاعات خودم
      </button>
    </div>
  );
}

export function AppLayout({ darkMode, onToggleDark }: { darkMode: boolean; onToggleDark: () => void }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className={darkMode ? "dark" : ""}>
      <div dir="rtl" className="min-h-screen bg-[#F5F6F4] dark:bg-slate-900" style={{ fontFamily: "'Vazirmatn', sans-serif" }}>
        <div className="flex">
          <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <main className="flex-1 min-w-0">
            <Header onMenuClick={() => setSidebarOpen(true)} darkMode={darkMode} onToggleDark={onToggleDark} />
            <SampleDataBanner />
            <div className="p-4 sm:p-6 max-w-6xl mx-auto print-report">
              <ErrorBoundary>
                <Outlet />
              </ErrorBoundary>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
