import React from "react";
import { useFinancialModel } from "../../hooks/FinancialModelContext";
import { Card, SectionTitle } from "../ui/primitives";
import { MoneyInput } from "../forms/MoneyInput";
import { formatToman } from "../../utils/format";
import { STATUS_META, AlertCard } from "./DashboardWidgets";
import { Link } from "react-router-dom";
import { isNearBreakEven } from "../../calculations/breakeven";

/**
 * «اگر این عدد را تغییر بدهم چه می‌شود؟»
 * مستقیماً به state مشترک وصل است (همان چیزی که همه صفحات می‌بینند)،
 * پس هر تغییری همین‌جا فوری روی سود/وضعیت اثر می‌گذارد — بدون فرمول جدید.
 */
export function WhatIfPlayground() {
  const m = useFinancialModel();
  const { sales, snapshot } = m;
  const meta = STATUS_META[snapshot.status];
  const toneCls = meta.textClass;

  return (
    <Card>
      <SectionTitle desc="این عددها را تغییر بده و ببین سود ماهانه‌ات فوری چطور عوض می‌شود.">
        اگر این عدد را تغییر بدهم چه می‌شود؟
      </SectionTitle>

      <div className="grid sm:grid-cols-3 gap-x-4">
        <MoneyInput
          label="قیمت فروش"
          value={sales.sellingPrice}
          onChange={(v) => m.setSales((s) => ({ ...s, sellingPrice: Math.max(0, v) }))}
        />
        <MoneyInput
          label="تعداد فروش ماهانه"
          suffix="دستگاه"
          value={sales.monthlyUnits}
          onChange={(v) => m.setSales((s) => ({ ...s, monthlyUnits: Math.max(0, v) }))}
        />
        {m.costMode === "simple" ? (
          <MoneyInput
            label="هزینه ماهانه"
            value={m.simpleMonthlyCost}
            onChange={m.setSimpleMonthlyCost}
          />
        ) : (
          <label className="block mb-4">
            <span className="block text-sm mb-1.5 font-medium text-slate-600 dark:text-slate-300">هزینه ماهانه</span>
            <div className="w-full rounded-lg border px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>{formatToman(m.fixedMonthlyCost)}</span>
              <Link to="/costs" className="text-teal-700 text-xs font-medium no-print">ویرایش جزئیات</Link>
            </div>
          </label>
        )}
      </div>

      <div className="mt-2 rounded-2xl border p-4 flex items-center justify-between flex-wrap gap-2 bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <span className="text-2xl leading-none">{meta.emoji}</span>
          <span className={`text-sm font-semibold ${toneCls}`}>
            {snapshot.status === "profit" ? "سود می‌کنی" : snapshot.status === "loss" ? "زیان می‌کنی" : "تقریباً سربه‌سر هستی"}
          </span>
        </div>
        <div className={`text-xl font-extrabold ${toneCls}`}>{formatToman(snapshot.monthlyProfit)}</div>
      </div>

      {sales.sellingPrice > 0 && snapshot.contributionPerUnit <= 0 && (
        <div className="mt-3">
          <AlertCard
            tone="loss"
            message={`قیمتی که گذاشته‌ای از هزینه واقعی هر دستگاه (${formatToman(m.totalVariableCostPerUnit)}) کمتر یا برابر است — یعنی هر فروش، به‌جای سود، ضرر می‌سازد.`}
          />
        </div>
      )}
      {snapshot.contributionPerUnit > 0 && isNearBreakEven(sales.monthlyUnits, snapshot.breakEvenUnits) && (
        <div className="mt-3">
          <AlertCard tone="warn" message="فروش فعلی‌ات تازه از نقطه سربه‌سر رد شده — با کمی افت فروش، دوباره زیان‌ده می‌شوی." />
        </div>
      )}
    </Card>
  );
}
