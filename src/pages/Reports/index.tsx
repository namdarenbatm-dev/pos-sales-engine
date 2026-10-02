import React, { useState } from "react";
import { useFinancialModel } from "../../hooks/FinancialModelContext";
import { Card, SectionTitle, Button } from "../../components/ui/primitives";
import { EmptyState } from "../../components/dashboard/DashboardWidgets";
import { ExportButtons, ReportHeader } from "../../components/reports/ReportControls";
import { exportToExcel } from "../../exports/excelExport";
import { formatToman, formatNumber, parseUserNumber } from "../../utils/format";
import { calcRecordProfit } from "../../calculations/profit";
import {
  SalesTrendChart, ProfitTrendChart, SalesVsBreakEvenChart, LossToProfitChart,
  ProfitByPriceChart, ProfitByVolumeChart, CostBreakdownChart, SalesGrowthChart, ProfitGrowthChart,
  ActualVsTargetChart,
} from "../../components/charts/Charts";
import type { MonthlyRecord } from "../../types";

const PERIOD_OPTIONS: { key: string; label: string; months: number | null }[] = [
  { key: "3", label: "۳ ماه اخیر", months: 3 },
  { key: "6", label: "۶ ماه اخیر", months: 6 },
  { key: "12", label: "۱۲ ماه اخیر", months: 12 },
  { key: "all", label: "همه", months: null },
];

export default function Reports() {
  const m = useFinancialModel();
  const [editing, setEditing] = useState(false);
  const [period, setPeriod] = useState<string>("all");

  function updateRecord(id: string, patch: Partial<MonthlyRecord>) {
    m.setHistory((prev) => prev.map((h) => (h.id === id ? { ...h, ...patch, profit: calcRecordProfit({ ...h, ...patch }) } : h)));
  }
  function addRecord() {
    m.setHistory((prev) => [...prev, { id: "h" + Date.now(), month: "ماه جدید", sellingPrice: m.sales.sellingPrice, unitsSold: 0, fixedCost: m.fixedMonthlyCost, variableCostPerUnit: m.totalVariableCostPerUnit, profit: -m.fixedMonthlyCost }]);
  }
  function removeRecord(id: string) {
    m.setHistory((prev) => prev.filter((h) => h.id !== id));
  }

  if (m.history.length === 0) {
    return (
      <EmptyState
        title="هنوز اطلاعات ماهانه ثبت نشده است."
        description="برای مشاهده روند فروش و سود، اطلاعات ماهانه را ثبت کنید."
        actionLabel="ثبت اولین ماه"
        onAction={addRecord}
      />
    );
  }

  // هرجا تاریخچه به جدول یا نمودار داده می‌شود، سود همیشه از روی فرمول واقعی
  // بازمحاسبه می‌شود — نه از فیلد ذخیره‌شده — تا هیچ نموداری داده ناسازگار نبیند.
  const safeHistory = m.history.map((h) => ({ ...h, profit: calcRecordProfit(h) }));

  // فیلتر بازه زمانی — فقط روی نمودارهای روند اثر می‌گذارد؛ جدول تاریخچه و
  // خروجی اکسل همیشه کل داده را نشان می‌دهند تا چیزی از دید کاربر گم نشود.
  const selectedMonths = PERIOD_OPTIONS.find((p) => p.key === period)?.months ?? null;
  const trendHistory = selectedMonths ? safeHistory.slice(-selectedMonths) : safeHistory;
  // برای نمودارهای رشد، یک رکورد اضافه قبل از بازه انتخابی هم نگه می‌داریم تا
  // درصد رشد اولین ماه نمایش‌داده‌شده هم نسبت به ماه واقعی قبلش درست حساب شود
  // (نه اینکه به‌خاطر برش، آن نقطه از نمودار اصلاً حذف شود).
  const growthHistory = selectedMonths ? safeHistory.slice(-(selectedMonths + 1)) : safeHistory;

  return (
    <div className="space-y-5 print-landscape">
      <ReportHeader title="گزارش و نمودارها" />
      <SectionTitle desc="روند فروش، سود و ترکیب هزینه‌ها را در طول زمان ببینید.">گزارش و نمودارها</SectionTitle>

      <Card padded={false}>
        <div className="flex items-center justify-between p-4 no-print">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">تاریخچه ماهانه</span>
          <Button variant="secondary" onClick={() => setEditing((v) => !v)}>{editing ? "پایان ویرایش" : "ویرایش داده‌ها"}</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-500 dark:text-slate-400">
                <th className="text-right py-2 px-4">ماه</th>
                <th className="text-right py-2 px-4">فروش</th>
                <th className="text-right py-2 px-4">قیمت فروش</th>
                <th className="text-right py-2 px-4">هزینه ثابت</th>
                <th className="text-right py-2 px-4">سود</th>
                {editing && <th className="py-2 px-4"></th>}
              </tr>
            </thead>
            <tbody>
              {safeHistory.map((h) => (
                <tr key={h.id} className="border-t border-slate-100 dark:border-slate-700">
                  {editing ? (
                    <>
                      <td className="py-1 px-4"><input value={h.month} onChange={(e) => updateRecord(h.id, { month: e.target.value })} className="bg-transparent w-16 outline-none" /></td>
                      <td className="py-1 px-4"><input dir="ltr" value={formatNumber(h.unitsSold)} onChange={(e) => updateRecord(h.id, { unitsSold: Math.max(0, parseFloat(parseUserNumber(e.target.value)) || 0) })} className="bg-transparent w-16 outline-none text-right" /></td>
                      <td className="py-1 px-4"><input dir="ltr" value={formatNumber(h.sellingPrice)} onChange={(e) => updateRecord(h.id, { sellingPrice: Math.max(0, parseFloat(parseUserNumber(e.target.value)) || 0) })} className="bg-transparent w-24 outline-none text-right" /></td>
                      <td className="py-1 px-4"><input dir="ltr" value={formatNumber(h.fixedCost)} onChange={(e) => updateRecord(h.id, { fixedCost: Math.max(0, parseFloat(parseUserNumber(e.target.value)) || 0) })} className="bg-transparent w-24 outline-none text-right" /></td>
                      <td className={`py-1 px-4 font-medium ${h.profit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{formatToman(h.profit)}</td>
                      <td className="py-1 px-4 text-left"><button onClick={() => removeRecord(h.id)} className="p-2 -m-2 text-rose-500 text-xs">حذف</button></td>
                    </>
                  ) : (
                    <>
                      <td className="py-2 px-4">{h.month}</td>
                      <td className="py-2 px-4">{formatNumber(h.unitsSold)}</td>
                      <td className="py-2 px-4">{formatToman(h.sellingPrice)}</td>
                      <td className="py-2 px-4">{formatToman(h.fixedCost)}</td>
                      <td className={`py-2 px-4 font-medium ${h.profit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{formatToman(h.profit)}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {editing && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-700">
            <Button variant="primary" onClick={addRecord}>+ افزودن ماه</Button>
          </div>
        )}
      </Card>

      <div className="flex items-center gap-2 flex-wrap no-print">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 ml-1">بازه زمانی نمودارها:</span>
        {PERIOD_OPTIONS.map((p) => (
          <Button key={p.key} variant={period === p.key ? "primary" : "secondary"} onClick={() => setPeriod(p.key)}>
            {p.label}
          </Button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <SalesTrendChart history={trendHistory} />
        <ProfitTrendChart history={trendHistory} />
        <SalesVsBreakEvenChart currentSales={m.sales.monthlyUnits} breakEvenUnits={m.snapshot.breakEvenUnits} />
        <ActualVsTargetChart history={trendHistory} targetProfit={m.targetProfit} />
        <LossToProfitChart
          contributionPerUnit={m.snapshot.contributionPerUnit}
          fixedMonthlyCost={m.fixedMonthlyCost}
          breakEvenUnits={m.snapshot.breakEvenUnits}
          maxUnits={m.sales.maxCapacity || m.sales.monthlyUnits * 2 || 100}
        />
        <ProfitByPriceChart
          basePrice={m.sales.sellingPrice}
          monthlyUnits={m.sales.monthlyUnits}
          fixedMonthlyCost={m.fixedMonthlyCost}
          totalVariableCostPerUnit={m.totalVariableCostPerUnit}
        />
        <ProfitByVolumeChart contributionPerUnit={m.snapshot.contributionPerUnit} fixedMonthlyCost={m.fixedMonthlyCost} />
        <div className="lg:col-span-2">
          <CostBreakdownChart expenses={m.expenses} />
        </div>
        <SalesGrowthChart history={growthHistory} />
        <ProfitGrowthChart history={growthHistory} />
      </div>

      <ExportButtons onExportExcel={() => exportToExcel({ device: m.device, expenses: m.expenses, sales: m.sales, scenarios: m.scenarios, history: safeHistory, snapshot: m.snapshot, fixedMonthlyCost: m.fixedMonthlyCost, totalVariableCostPerUnit: m.totalVariableCostPerUnit, targetProfit: m.targetProfit, isSampleData: m.isSampleData })} />
    </div>
  );
}
