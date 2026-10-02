import React from "react";
import { useLocation } from "react-router-dom";
import { Menu, Moon, Sun } from "lucide-react";

const TITLES: Record<string, string> = {
  "/": "انجین تصمیم فروش",
  "/recommended-price": "قیمت مناسب من",
  "/costs": "هزینه‌های ماهانه",
  "/device": "اطلاعات دستگاه",
  "/sales": "فروش فعلی",
  "/sales-volume": "چند تا بفروشم؟",
  "/target-profit": "چقدر سود می‌خواهم؟",
  "/scenarios": "مقایسه سناریوها",
  "/reports": "گزارش و نمودارها",
  "/print-report": "چاپ گزارش مدیریتی",
};

export function Header({ onMenuClick, darkMode, onToggleDark }: { onMenuClick: () => void; darkMode: boolean; onToggleDark: () => void }) {
  const location = useLocation();
  const title = TITLES[location.pathname] ?? "ماشین حساب کارتخوان";
  return (
    <header className="app-header no-print sticky top-0 z-10 flex items-center justify-between px-4 sm:px-6 py-3 border-b backdrop-blur bg-[#F5F6F4]/90 dark:bg-slate-900/90 border-slate-200 dark:border-slate-800">
      <button className="lg:hidden p-2 -m-2" onClick={onMenuClick} aria-label="باز کردن منو">
        <Menu size={20} className="text-slate-700 dark:text-slate-200" />
      </button>
      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{title}</span>
      <button onClick={onToggleDark} aria-label="تغییر حالت روشن/تاریک" className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800">
        {darkMode ? <Sun size={16} className="text-slate-200" /> : <Moon size={16} className="text-slate-600" />}
      </button>
    </header>
  );
}
