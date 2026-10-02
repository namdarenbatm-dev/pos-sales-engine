import React from "react";
import { useFinancialModel } from "../../hooks/FinancialModelContext";
import { Card, SectionTitle } from "../../components/ui/primitives";
import { StatusBanner } from "../../components/dashboard/DashboardWidgets";
import { MoneyInput } from "../../components/forms/MoneyInput";
import { formatToman, formatUnits } from "../../utils/format";
import { calcUnitsForTargetProfit, calcRequiredSellingPrice } from "../../calculations/breakeven";
import { validateTargetProfit } from "../../calculations/validation";
import { ExportButtons } from "../../components/reports/ReportControls";
import { exportToExcel } from "../../exports/excelExport";

export default function TargetProfit() {
  const m = useFinancialModel();
  const { snapshot, sales } = m;

  const qtyForTarget = calcUnitsForTargetProfit(m.fixedMonthlyCost, m.targetProfit, snapshot.contributionPerUnit);
  const priceForTarget = calcRequiredSellingPrice(m.totalVariableCostPerUnit, m.fixedMonthlyCost, m.targetProfit, sales.monthlyUnits);

  const impossible = qtyForTarget === null || (!!sales.maxCapacity && sales.maxCapacity > 0 && qtyForTarget > sales.maxCapacity);

  return (
    <div className="space-y-5">
      <SectionTitle desc="سود ماهانه‌ای که می‌خواهید به آن برسید را وارد کنید.">چقدر سود می‌خواهم؟</SectionTitle>
      <Card><MoneyInput label="سود هدف ماهانه" value={m.targetProfit} validate={validateTargetProfit} onChange={m.setTargetProfit} /></Card>

      {impossible && sales.maxCapacity ? (
        <StatusBanner
          status="loss"
          message={`⚠️ با فروش حداکثر ${formatUnits(sales.maxCapacity)}، رسیدن به سود ${formatToman(m.targetProfit)} با قیمت فعلی ممکن نیست. برای رسیدن به هدف، قیمت را افزایش دهید، تعداد فروش را بالا ببرید یا هزینه ماهانه را کاهش دهید.`}
        />
      ) : qtyForTarget === null ? (
        <StatusBanner status="loss" message="با قیمت فعلی، رسیدن به سود مثبت ممکن نیست چون قیمت فروش از هزینه واقعی هر دستگاه پایین‌تر یا برابر است." />
      ) : null}

      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <div className="text-xs font-medium mb-2 text-slate-500 dark:text-slate-400">اگر قیمت ثابت بماند</div>
          <div className="text-sm mb-2 text-slate-600 dark:text-slate-300">چند دستگاه باید بفروشم؟</div>
          <div className="text-lg font-bold text-teal-700">{qtyForTarget !== null ? formatUnits(qtyForTarget) : "دست‌نیافتنی"}</div>
        </Card>
        <Card>
          <div className="text-xs font-medium mb-2 text-slate-500 dark:text-slate-400">اگر تعداد فروش ثابت بماند</div>
          <div className="text-sm mb-2 text-slate-600 dark:text-slate-300">قیمت فروش باید چقدر باشد؟</div>
          <div className="text-lg font-bold text-teal-700">{priceForTarget !== null ? formatToman(priceForTarget) : "—"}</div>
        </Card>
        <Card>
          <div className="text-xs font-medium mb-2 text-slate-500 dark:text-slate-400">اگر قیمت و تعداد ثابت بمانند</div>
          <div className="text-sm mb-2 text-slate-600 dark:text-slate-300">سود واقعی چقدر خواهد بود؟</div>
          <div className={`text-lg font-bold ${snapshot.monthlyProfit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{formatToman(snapshot.monthlyProfit)}</div>
          <div className="text-xs mt-1 text-slate-400 dark:text-slate-500">فاصله تا هدف: {formatToman(m.targetProfit - snapshot.monthlyProfit)}</div>
        </Card>
      </div>

      <ExportButtons onExportExcel={() => exportToExcel({ device: m.device, expenses: m.expenses, sales: m.sales, scenarios: m.scenarios, history: m.history, snapshot, fixedMonthlyCost: m.fixedMonthlyCost, totalVariableCostPerUnit: m.totalVariableCostPerUnit, targetProfit: m.targetProfit, isSampleData: m.isSampleData })} />
    </div>
  );
}
