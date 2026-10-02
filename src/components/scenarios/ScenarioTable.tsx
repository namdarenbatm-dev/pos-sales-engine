import React from "react";
import { Plus, Trash2 } from "lucide-react";
import type { Scenario } from "../../types";
import { evaluateScenario } from "../../calculations/scenarios";
import { formatToman, formatNumber, parseUserNumber } from "../../utils/format";
import { Button, Card } from "../ui/primitives";
import { StatusBadge } from "../dashboard/DashboardWidgets";

type Props = {
  scenarios: Scenario[];
  setScenarios: (updater: (prev: Scenario[]) => Scenario[]) => void;
  totalVariableCostPerUnit: number;
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
};

export function ScenarioTable({ scenarios, setScenarios, totalVariableCostPerUnit, selectedIds, onToggleSelect }: Props) {
  function updateScenario(id: string, patch: Partial<Scenario>) {
    setScenarios((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }
  function removeScenario(id: string) {
    setScenarios((prev) => prev.filter((s) => s.id !== id));
  }
  function addScenario() {
    setScenarios((prev) => [
      ...prev,
      { id: "s" + Date.now(), name: "سناریوی جدید", sellingPrice: 11500000, monthlyUnits: 1500, monthlyFixedCost: 105000000 },
    ]);
  }

  return (
    <Card padded={false}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-500 dark:text-slate-400">
              <th className="py-3 px-4 text-right font-medium">مقایسه</th>
              <th className="py-3 px-4 text-right font-medium">سناریو</th>
              <th className="py-3 px-4 text-right font-medium">قیمت</th>
              <th className="py-3 px-4 text-right font-medium">تعداد فروش</th>
              <th className="py-3 px-4 text-right font-medium">هزینه ماهانه</th>
              <th className="py-3 px-4 text-right font-medium">سود ماهانه</th>
              <th className="py-3 px-4 text-right font-medium">سربه‌سر</th>
              <th className="py-3 px-4 text-right font-medium">وضعیت</th>
              <th className="py-3 px-4"></th>
            </tr>
          </thead>
          <tbody>
            {scenarios.map((s) => {
              const result = evaluateScenario(s, totalVariableCostPerUnit);
              const checked = selectedIds.includes(s.id);
              return (
                <tr key={s.id} className="border-t border-slate-100 dark:border-slate-700">
                  <td className="py-2 px-4"><input type="checkbox" checked={checked} onChange={() => onToggleSelect(s.id)} /></td>
                  <td className="py-2 px-4">
                    <input value={s.name} onChange={(e) => updateScenario(s.id, { name: e.target.value })}
                      className="bg-transparent w-28 outline-none text-slate-700 dark:text-slate-200" />
                  </td>
                  <td className="py-2 px-4">
                    <input dir="ltr" value={formatNumber(s.sellingPrice)}
                      onChange={(e) => updateScenario(s.id, { sellingPrice: Math.max(0, parseFloat(parseUserNumber(e.target.value)) || 0) })}
                      className="bg-transparent w-24 outline-none text-right text-slate-700 dark:text-slate-200" />
                  </td>
                  <td className="py-2 px-4">
                    <input dir="ltr" value={formatNumber(s.monthlyUnits)}
                      onChange={(e) => updateScenario(s.id, { monthlyUnits: Math.max(0, parseFloat(parseUserNumber(e.target.value)) || 0) })}
                      className="bg-transparent w-20 outline-none text-right text-slate-700 dark:text-slate-200" />
                  </td>
                  <td className="py-2 px-4">
                    <input dir="ltr" value={formatNumber(s.monthlyFixedCost)}
                      onChange={(e) => updateScenario(s.id, { monthlyFixedCost: Math.max(0, parseFloat(parseUserNumber(e.target.value)) || 0) })}
                      className="bg-transparent w-24 outline-none text-right text-slate-700 dark:text-slate-200" />
                  </td>
                  <td className={`py-2 px-4 font-medium ${result.monthlyProfit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{formatToman(result.monthlyProfit)}</td>
                  <td className="py-2 px-4">{result.breakEvenUnits !== null ? formatNumber(result.breakEvenUnits) : "دست‌نیافتنی"}</td>
                  <td className="py-2 px-4"><StatusBadge status={result.status} /></td>
                  <td className="py-2 px-4 text-left">
                    <button onClick={() => removeScenario(s.id)} className="p-2 -m-2 text-rose-500 hover:text-rose-700" aria-label="حذف سناریو"><Trash2 size={15} /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
        <Button variant="primary" onClick={addScenario}><Plus size={14} />افزودن سناریو</Button>
        <span className="text-xs text-slate-400 dark:text-slate-500">برای مقایسه، حداقل ۲ و حداکثر ۵ سناریو انتخاب کنید.</span>
      </div>
    </Card>
  );
}
