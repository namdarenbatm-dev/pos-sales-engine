import React, { useState } from "react";
import { useFinancialModel } from "../../hooks/FinancialModelContext";
import { Card, SectionTitle } from "../../components/ui/primitives";
import { KpiCard } from "../../components/dashboard/DashboardWidgets";
import { MoneyInput } from "../../components/forms/MoneyInput";
import { formatToman, formatUnits } from "../../utils/format";
import { calcContributionPerUnit, calcMonthlyProfit } from "../../calculations/profit";
import { calcBreakEvenUnits, calcUnitsForTargetProfit } from "../../calculations/breakeven";
import { ExportButtons } from "../../components/reports/ReportControls";
import { exportToExcel } from "../../exports/excelExport";

export default function SalesVolume() {
  const m = useFinancialModel();
  const [localPrice, setLocalPrice] = useState(m.sales.sellingPrice);
  const [customTarget, setCustomTarget] = useState(m.targetProfit);

  const contribution = calcContributionPerUnit(localPrice, m.totalVariableCostPerUnit);
  const breakEven = calcBreakEvenUnits(m.fixedMonthlyCost, contribution);
  const unitsForCustomTarget = calcUnitsForTargetProfit(m.fixedMonthlyCost, customTarget, contribution);

  const rows = Array.from(new Set([100, 250, 500, 1000, breakEven ?? 0, 1500, 2000, 3000].filter((v) => v > 0)))
    .sort((a, b) => a - b)
    .map((q) => ({ q, profit: calcMonthlyProfit(q, contribution, m.fixedMonthlyCost), isBreakEven: q === breakEven }));

  return (
    <div className="space-y-5">
      <SectionTitle desc="با قیمت فروش دلخواه ببینید برای سربه‌سر شدن یا رسیدن به سود هدف چند دستگاه باید بفروشید.">چند دستگاه بفروشم؟</SectionTitle>

      <Card><MoneyInput label="قیمت فروش برای بررسی" value={localPrice} onChange={setLocalPrice} /></Card>

      <Card className="text-center py-8">
        <div className="text-sm text-slate-500 dark:text-slate-400 mb-2">برای سربه‌سر شدن با این قیمت باید بفروشی</div>
        <div className="text-4xl font-extrabold text-teal-700">
          {breakEven !== null ? `${formatUnits(breakEven)} دستگاه` : "—"}
        </div>
        {breakEven === null && (
          <p className="text-sm mt-3 text-rose-600">با این قیمت، رسیدن به سربه‌سر ممکن نیست.</p>
        )}
      </Card>

      <Card>
        <MoneyInput label="سود هدف دلخواه" value={customTarget} onChange={setCustomTarget} />
        <KpiCard tone="good" title="دستگاه لازم برای این سود" value={unitsForCustomTarget !== null ? formatUnits(unitsForCustomTarget) : "دست‌نیافتنی با این قیمت"} />
      </Card>

      <Card padded={false}>
        <div className="px-4 pt-4 text-xs font-medium text-slate-500 dark:text-slate-400">اگر تعداد فروش فرق کند، سود ماهانه چطور می‌شود؟</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-500 dark:text-slate-400">
                <th className="text-right py-3 px-4 font-medium">تعداد فروش</th>
                <th className="text-right py-3 px-4 font-medium">سود / زیان</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className={`border-t border-slate-100 dark:border-slate-700 ${r.isBreakEven ? "bg-amber-50 dark:bg-amber-950/30" : ""}`}>
                  <td className="py-2 px-4 whitespace-nowrap">{formatUnits(r.q)} {r.isBreakEven && <span className="text-amber-600 text-xs">(سربه‌سر)</span>}</td>
                  <td className={`py-2 px-4 font-medium whitespace-nowrap ${r.profit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{formatToman(r.profit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <ExportButtons onExportExcel={() => exportToExcel({ device: m.device, expenses: m.expenses, sales: m.sales, scenarios: m.scenarios, history: m.history, snapshot: m.snapshot, fixedMonthlyCost: m.fixedMonthlyCost, totalVariableCostPerUnit: m.totalVariableCostPerUnit, targetProfit: m.targetProfit, isSampleData: m.isSampleData })} />
    </div>
  );
}
