import React, { useState } from "react";
import { useFinancialModel } from "../../hooks/FinancialModelContext";
import { Card, SectionTitle, Button } from "../../components/ui/primitives";
import { MoneyInput } from "../../components/forms/MoneyInput";
import { formatToman, formatUnits } from "../../utils/format";
import { calcRequiredSellingPrice } from "../../calculations/breakeven";
import { ExportButtons } from "../../components/reports/ReportControls";
import { exportToExcel } from "../../exports/excelExport";

/**
 * پاسخ مستقیم به «قیمت مناسب من چقدر است؟» — بدون فرمول، فقط نتیجه.
 * از calcRequiredSellingPrice استفاده می‌کند (بدون هیچ تغییری در فرمول تأیید‌شده).
 */
export default function RecommendedPrice() {
  const m = useFinancialModel();
  const [mode, setMode] = useState<"breakeven" | "target">("breakeven");

  const targetProfitForCalc = mode === "breakeven" ? 0 : m.targetProfit;
  const price = calcRequiredSellingPrice(m.totalVariableCostPerUnit, m.fixedMonthlyCost, targetProfitForCalc, m.sales.monthlyUnits);

  const diff = price !== null ? m.sales.sellingPrice - price : null;

  return (
    <div className="space-y-5">
      <SectionTitle desc="با تعداد فروشی که انتظار داری، قیمت مناسب فروش را به تو نشان می‌دهیم.">قیمت مناسب من چقدر است؟</SectionTitle>

      <div className="flex gap-2 no-print">
        <Button variant={mode === "breakeven" ? "primary" : "secondary"} onClick={() => setMode("breakeven")}>فقط می‌خوام سربه‌سر باشم</Button>
        <Button variant={mode === "target" ? "primary" : "secondary"} onClick={() => setMode("target")}>سود دلخواه می‌خوام</Button>
      </div>

      {mode === "target" && (
        <Card><MoneyInput label="سود ماهانه‌ای که می‌خواهی" value={m.targetProfit} onChange={m.setTargetProfit} /></Card>
      )}

      <Card>
        <MoneyInput
          label="تعداد فروش ماهانه‌ای که انتظار داری"
          suffix="دستگاه"
          value={m.sales.monthlyUnits}
          onChange={(v) => m.setSales((s) => ({ ...s, monthlyUnits: Math.max(0, v) }))}
        />
      </Card>

      <Card className="text-center py-8">
        <div className="text-sm text-slate-500 dark:text-slate-400 mb-2">قیمت پیشنهادی فروش هر دستگاه</div>
        <div className="text-4xl font-extrabold text-teal-700">
          {price !== null ? formatToman(price) : "—"}
        </div>
        <p className="text-sm mt-3 text-slate-600 dark:text-slate-300">
          {price === null
            ? "با تعداد فروش صفر نمی‌توان قیمت پیشنهادی را حساب کرد — عدد فروش ماهانه را وارد کن."
            : mode === "breakeven"
            ? `اگر ${formatUnits(m.sales.monthlyUnits)} دستگاه را به این قیمت بفروشی، نه سود می‌کنی نه ضرر — دقیقاً هزینه‌هایت پوشش داده می‌شود.`
            : `اگر ${formatUnits(m.sales.monthlyUnits)} دستگاه را به این قیمت بفروشی، دقیقاً به سود ماهانه‌ی ${formatToman(m.targetProfit)} می‌رسی.`}
        </p>
      </Card>

      {price !== null && m.sales.sellingPrice > 0 && diff !== null && Math.abs(diff) > 1 && (
        <Card>
          <div className="text-sm text-slate-600 dark:text-slate-300">
            قیمتی که الان گذاشته‌ای <b>{formatToman(m.sales.sellingPrice)}</b> است؛ یعنی{" "}
            {diff > 0 ? (
              <span className="text-emerald-600 font-semibold">{formatToman(diff)} بالاتر</span>
            ) : (
              <span className="text-rose-600 font-semibold">{formatToman(Math.abs(diff))} پایین‌تر</span>
            )}{" "}
            از قیمت پیشنهادی است.
          </div>
        </Card>
      )}

      <ExportButtons onExportExcel={() => exportToExcel({ device: m.device, expenses: m.expenses, sales: m.sales, scenarios: m.scenarios, history: m.history, snapshot: m.snapshot, fixedMonthlyCost: m.fixedMonthlyCost, totalVariableCostPerUnit: m.totalVariableCostPerUnit, targetProfit: m.targetProfit, isSampleData: m.isSampleData })} />
    </div>
  );
}
