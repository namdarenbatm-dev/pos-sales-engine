import React, { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useFinancialModel } from "../../hooks/FinancialModelContext";
import { Card, SectionTitle, Button } from "../../components/ui/primitives";
import { KpiCard } from "../../components/dashboard/DashboardWidgets";
import { MoneyInput } from "../../components/forms/MoneyInput";
import { ExportButtons } from "../../components/reports/ReportControls";
import { exportToExcel } from "../../exports/excelExport";
import { formatNumber, formatToman, parseUserNumber } from "../../utils/format";
import { validateExpenseTitle } from "../../calculations/validation";
import type { MonthlyExpense } from "../../types";

export default function Costs() {
  const m = useFinancialModel();
  const [newItem, setNewItem] = useState<{ title: string; amount: number; type: MonthlyExpense["type"] }>({ title: "", amount: 0, type: "fixed" });
  const [titleError, setTitleError] = useState<string | null>(null);

  function addItem() {
    const check = validateExpenseTitle(newItem.title);
    if (!check.valid) { setTitleError(check.message); return; }
    m.setExpenses((prev) => [...prev, { ...newItem, id: "c" + Date.now(), active: true }]);
    setNewItem({ title: "", amount: 0, type: "fixed" });
    setTitleError(null);
  }

  return (
    <div className="space-y-5">
      <SectionTitle desc="هزینه ثابت مستقل از فروش است؛ هزینه وابسته به فروش به ازای هر دستگاه وارد می‌شود.">هزینه‌های ماهانه</SectionTitle>

      <div className="flex gap-2 no-print">
        <Button variant={m.costMode === "simple" ? "primary" : "secondary"} onClick={() => m.setCostMode("simple")}>حالت ساده</Button>
        <Button variant={m.costMode === "advanced" ? "primary" : "secondary"} onClick={() => m.setCostMode("advanced")}>جزئیات هزینه‌ها</Button>
      </div>

      {m.costMode === "simple" ? (
        <Card><MoneyInput label="جمع کل هزینه ماهانه" value={m.simpleMonthlyCost} onChange={m.setSimpleMonthlyCost} /></Card>
      ) : (
        <Card padded={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-500 dark:text-slate-400">
                  <th className="text-right py-3 px-4 font-medium">عنوان</th>
                  <th className="text-right py-3 px-4 font-medium">مبلغ</th>
                  <th className="text-right py-3 px-4 font-medium">نوع</th>
                  <th className="text-right py-3 px-4 font-medium">فعال</th>
                  <th className="py-3 px-4"></th>
                </tr>
              </thead>
              <tbody>
                {m.expenses.map((c) => (
                  <tr key={c.id} className="border-t border-slate-100 dark:border-slate-700">
                    <td className="py-2 px-4">
                      <input value={c.title} onChange={(e) => m.setExpenses((cs) => cs.map((x) => (x.id === c.id ? { ...x, title: e.target.value } : x)))}
                        className="bg-transparent w-28 outline-none text-slate-700 dark:text-slate-200" />
                    </td>
                    <td className="py-2 px-4">
                      <input dir="ltr" value={formatNumber(c.amount)}
                        onChange={(e) => { const v = parseFloat(parseUserNumber(e.target.value)) || 0; m.setExpenses((cs) => cs.map((x) => (x.id === c.id ? { ...x, amount: Math.max(0, v) } : x))); }}
                        className="bg-transparent w-28 outline-none text-right text-slate-700 dark:text-slate-200" />
                    </td>
                    <td className="py-2 px-4">
                      <select value={c.type} onChange={(e) => m.setExpenses((cs) => cs.map((x) => (x.id === c.id ? { ...x, type: e.target.value as MonthlyExpense["type"] } : x)))}
                        className="rounded-md text-xs px-2 py-1 border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                        <option value="fixed">ثابت</option>
                        <option value="variable">وابسته به فروش</option>
                      </select>
                    </td>
                    <td className="py-2 px-4">
                      <input type="checkbox" checked={c.active} onChange={(e) => m.setExpenses((cs) => cs.map((x) => (x.id === c.id ? { ...x, active: e.target.checked } : x)))} />
                    </td>
                    <td className="py-2 px-4 text-left">
                      <button onClick={() => m.setExpenses((cs) => cs.filter((x) => x.id !== c.id))} className="p-2 -m-2 text-rose-500 hover:text-rose-700" aria-label="حذف هزینه"><Trash2 size={15} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-start gap-2 p-4 border-t border-slate-100 dark:border-slate-700 no-print">
            <div>
              <input placeholder="عنوان هزینه جدید" value={newItem.title} onChange={(e) => { setNewItem({ ...newItem, title: e.target.value }); setTitleError(null); }}
                className="rounded-lg border px-3 py-2 text-sm min-w-[140px] bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700" />
              {titleError && <div className="text-xs text-rose-500 mt-1">{titleError}</div>}
            </div>
            <input placeholder="مبلغ" dir="ltr" value={newItem.amount || ""} onChange={(e) => setNewItem({ ...newItem, amount: Math.max(0, parseFloat(parseUserNumber(e.target.value)) || 0) })}
              className="rounded-lg border px-3 py-2 text-sm w-28 text-right bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700" />
            <select value={newItem.type} onChange={(e) => setNewItem({ ...newItem, type: e.target.value as MonthlyExpense["type"] })}
              className="rounded-lg border px-3 py-2 text-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <option value="fixed">ثابت</option>
              <option value="variable">وابسته به فروش</option>
            </select>
            <Button variant="primary" onClick={addItem}><Plus size={14} />افزودن</Button>
          </div>
        </Card>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <KpiCard title="هزینه ثابت ماهانه" value={formatToman(m.fixedMonthlyCost)} />
        <KpiCard title="هزینه وابسته به فروش (هر دستگاه)" value={formatToman(m.extraVariableCostPerUnit)} />
      </div>

      <ExportButtons onExportExcel={() => exportToExcel({ device: m.device, expenses: m.expenses, sales: m.sales, scenarios: m.scenarios, history: m.history, snapshot: m.snapshot, fixedMonthlyCost: m.fixedMonthlyCost, totalVariableCostPerUnit: m.totalVariableCostPerUnit, targetProfit: m.targetProfit, isSampleData: m.isSampleData })} />
    </div>
  );
}
