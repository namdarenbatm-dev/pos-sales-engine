import React from "react";
import { NavLink } from "react-router-dom";
import { BrainCircuit, BarChart3, GitCompare, LineChart, Moon, X } from "lucide-react";
import { useFinancialModel } from "../../hooks/FinancialModelContext";

const NAV = [
  { to: "/", label: "انجین تصمیم فروش", icon: BrainCircuit, end: true },
  { to: "/scenarios", label: "سناریوها", icon: GitCompare },
  { to: "/reports", label: "گزارش‌ها", icon: LineChart },
  { to: "/sales", label: "تحلیل فروش", icon: BarChart3 },
];

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const m = useFinancialModel();
  return (
    <>
      <aside className={`no-print fixed lg:static inset-y-0 right-0 z-30 w-60 border-l transform transition-transform lg:translate-x-0 flex flex-col ${open ? "translate-x-0" : "translate-x-full lg:translate-x-0"} bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800`}>
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-sm font-extrabold text-slate-900 dark:text-white">POS SALES ENGINE</div>
            <div className="text-[11px] text-slate-400 mt-1">Decision-first pricing</div>
          </div>
          <button className="lg:hidden p-2 -m-2" onClick={onClose}><X size={18} /></button>
        </div>
        <nav className="p-3 space-y-1 flex-1">
          {NAV.map((n) => <NavLink key={n.to} to={n.to} end={n.end} onClick={onClose} className={({ isActive }) => `flex items-center gap-2.5 rounded-xl px-3 py-3 text-sm font-bold transition-colors ${isActive ? "bg-teal-700 text-white" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"}`}><n.icon size={17} />{n.label}</NavLink>)}
        </nav>
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <div className="text-[11px] text-slate-400 leading-5">موتور تصمیم V1<br/>خرید فعلی + دلار آتی + سود هدف + خرید بعدی</div>
          {m.isSampleData && <div className="mt-3 text-[10px] text-amber-600">اطلاعات صفحات قدیمی نمونه است.</div>}
        </div>
      </aside>
      {open && <div className="fixed inset-0 bg-black/30 z-20 lg:hidden" onClick={onClose} />}
    </>
  );
}
