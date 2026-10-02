import type { MonthlyRecord } from "../types";

/**
 * درصد رشد یک فیلد عددی (فروش یا سود) نسبت به دوره‌ی قبل، برای هر رکورد
 * تاریخچه به‌جز اولین رکورد (که دوره‌ی قبلی برایش وجود ندارد).
 * این تابع تنها منبع محاسبه‌ی رشد در کل برنامه است — هم نمودارهای «رشد
 * فروش/سود» در Charts.tsx و هم برگه‌ی «داده‌های نمودار» در excelExport.ts
 * از همین‌جا استفاده می‌کنند تا هرگز از هم واگرا نشوند.
 */
export function calcGrowthSeries(
  history: MonthlyRecord[],
  key: "unitsSold" | "profit"
): { month: string; growth: number }[] {
  return history.slice(1).map((h, i) => {
    const prev = history[i][key];
    const cur = h[key];
    const growth = prev !== 0 ? ((cur - prev) / Math.abs(prev)) * 100 : 0;
    return { month: h.month, growth };
  });
}
