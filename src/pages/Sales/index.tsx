import React from "react";
import { useFinancialModel } from "../../hooks/FinancialModelContext";
import { Card, SectionTitle } from "../../components/ui/primitives";
import { KpiCard, StatusBanner, EmptyState } from "../../components/dashboard/DashboardWidgets";
import { MoneyInput } from "../../components/forms/MoneyInput";
import { ExportButtons } from "../../components/reports/ReportControls";
import { exportToExcel } from "../../exports/excelExport";
import { formatToman, formatUnits } from "../../utils/format";
import { validateSellingPrice, validateMonthlyUnits, validateNonNegative } from "../../calculations/validation";

export default function Sales() {
  const m = useFinancialModel();
  const { sales, snapshot } = m;

  if (sales.sellingPrice === 0 && sales.monthlyUnits === 0 && !m.isSampleData) {
    return (
      <EmptyState
        title="هنوز اطلاعات فروش ثبت نشده است."
        description="برای شروع اطلاعات فروش ماهانه را وارد کنید."
        actionLabel="ثبت اطلاعات"
        onAction={() => document.getElementById("sales-price-input")?.focus()}
      />
    );
  }

  const statusMessage =
    snapshot.status === "profit" && snapshot.gapToBreakEven !== null
      ? `فاصله فروش فعلی تا نقطه سربه‌سر: ${formatUnits(snapshot.gapToBreakEven)} بالاتر.`
      : snapshot.status === "breakeven"
      ? "دقیقاً روی نقطه سربه‌سر هستید."
      : snapshot.breakEvenUnits !== null
      ? `برای رسیدن به سربه‌سر باید ${formatUnits(Math.max(0, snapshot.breakEvenUnits - sales.monthlyUnits))} بیشتر بفروشید.`
      : "با قیمت فعلی رسیدن به سربه‌سر ممکن نیست.";

  return (
    <div className="space-y-5">
      <SectionTitle>فروش فعلی</SectionTitle>
      <div className="grid lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2">
          <div className="grid sm:grid-cols-2 gap-x-4">
            <div id="sales-price-input">
              <MoneyInput label="قیمت فروش فعلی" value={sales.sellingPrice} validate={validateSellingPrice}
                onChange={(v) => m.setSales((s) => ({ ...s, sellingPrice: Math.max(0, v) }))} />
            </div>
            <MoneyInput label="تعداد فروش ماهانه" suffix="دستگاه" value={sales.monthlyUnits} validate={validateMonthlyUnits}
              onChange={(v) => m.setSales((s) => ({ ...s, monthlyUnits: Math.max(0, v) }))} />
            <MoneyInput label="حداکثر ظرفیت فروش" suffix="دستگاه" value={sales.maxCapacity ?? 0}
              validate={(v) => validateNonNegative(v, "حداکثر ظرفیت فروش")}
              onChange={(v) => m.setSales((s) => ({ ...s, maxCapacity: Math.max(0, v) }))} />
          </div>
        </Card>
        <div className="space-y-4">
          <KpiCard tone={snapshot.contributionPerUnit >= 0 ? "good" : "bad"} title="سود باقی‌مانده از هر فروش" value={formatToman(snapshot.contributionPerUnit)} />
          <KpiCard tone={snapshot.monthlyProfit >= 0 ? "good" : "bad"} title="سود/زیان ماهانه" value={formatToman(snapshot.monthlyProfit)} />
        </div>
      </div>
      <StatusBanner status={snapshot.status} message={statusMessage} />
      <ExportButtons onExportExcel={() => exportToExcel({ device: m.device, expenses: m.expenses, sales: m.sales, scenarios: m.scenarios, history: m.history, snapshot, fixedMonthlyCost: m.fixedMonthlyCost, totalVariableCostPerUnit: m.totalVariableCostPerUnit, targetProfit: m.targetProfit, isSampleData: m.isSampleData })} />
    </div>
  );
}
