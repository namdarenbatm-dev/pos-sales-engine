import React from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from "recharts";
import type { MonthlyExpense, MonthlyRecord } from "../../types";
import { formatToman, formatNumber, formatPercent, formatCompact, formatUnits } from "../../utils/format";
import { Card } from "../ui/primitives";
import { calcGrowthSeries } from "../../calculations/growth";

const COLORS = ["#0f766e", "#0891b2", "#65a30d", "#ca8a04", "#dc2626", "#7c3aed", "#db2777", "#475569"];
const tooltipStyle = { direction: "rtl" as const, fontFamily: "Vazirmatn, sans-serif", fontSize: 12 };

/** طبق «قانون طلایی»: هیچ نموداری بدون داده کافی رسم نمی‌شود — این متن دقیقاً همان جمله‌ی الزامی است. */
const NO_DATA_MESSAGE = "داده کافی برای نمایش این نمودار وجود ندارد.";

export function ChartCard({
  title, description, minPeriods = 0, periodsAvailable = Infinity, noDataHint, insight, children,
}: {
  title: string; description?: string; minPeriods?: number; periodsAvailable?: number;
  noDataHint?: string; insight?: string | null; children: React.ReactNode;
}) {
  const insufficientData = periodsAvailable < minPeriods;
  return (
    <Card>
      <div className="mb-3">
        <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</div>
        {description && <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</div>}
      </div>
      {insufficientData ? (
        <div className="h-[200px] flex flex-col items-center justify-center text-center gap-1.5 px-6">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{NO_DATA_MESSAGE}</p>
          {noDataHint && <p className="text-xs text-slate-400 dark:text-slate-500">{noDataHint}</p>}
        </div>
      ) : (
        <>
          {children}
          {insight && (
            <p className="text-xs mt-3 rounded-lg bg-slate-50 dark:bg-slate-900/40 px-3 py-2 text-slate-600 dark:text-slate-300 leading-6">
              💡 {insight}
            </p>
          )}
        </>
      )}
    </Card>
  );
}

function pctChangeText(prev: number, cur: number, goodWord = "بیشتر", badWord = "کمتر"): string {
  if (prev === 0) return cur > 0 ? "نسبت به دوره قبل که صفر بود، رشد داشته‌اید." : "نسبت به دوره قبل تغییری نداشته است.";
  const pct = ((cur - prev) / Math.abs(prev)) * 100;
  if (Math.abs(pct) < 0.5) return "نسبت به دوره قبل تقریباً بدون تغییر بوده است.";
  return `نسبت به ماه قبل ${formatPercent(Math.abs(pct))} ${pct > 0 ? goodWord : badWord} شده است.`;
}

/* نمودار ۱ — روند فروش */
export function SalesTrendChart({ history }: { history: MonthlyRecord[] }) {
  const last = history[history.length - 1];
  const prev = history[history.length - 2];
  const insight = last && prev ? `فروش شما ${pctChangeText(prev.unitsSold, last.unitsSold)}` : null;
  return (
    <ChartCard
      title="روند فروش" description="تعداد فروش ماهانه در طول زمان"
      minPeriods={2} periodsAvailable={history.length}
      noDataHint="حداقل اطلاعات دو ماه را ثبت کنید تا روند فروش نمایش داده شود."
      insight={insight}
    >
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={history} margin={{ left: 4, right: 8, top: 8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={formatCompact} width={40}
            label={{ value: "دستگاه", angle: -90, position: "insideLeft", fontSize: 11, fill: "#94a3b8" }} />
          <Tooltip formatter={(v: number) => formatNumber(v) + " دستگاه"} contentStyle={tooltipStyle} />
          <Line type="monotone" dataKey="unitsSold" name="فروش" stroke="#0891b2" strokeWidth={2.5} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/* نمودار ۲ — روند سود و زیان */
export function ProfitTrendChart({ history }: { history: MonthlyRecord[] }) {
  const last = history[history.length - 1];
  const prev = history[history.length - 2];
  const insight = last && prev ? `سود شما ${pctChangeText(prev.profit, last.profit)}` : null;
  return (
    <ChartCard
      title="روند سود و زیان" description="سود یا زیان ماهانه در طول زمان"
      minPeriods={2} periodsAvailable={history.length}
      noDataHint="حداقل اطلاعات دو ماه را ثبت کنید تا روند سود نمایش داده شود."
      insight={insight}
    >
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={history} margin={{ left: 4, right: 8, top: 8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={formatCompact} width={40}
            label={{ value: "تومان", angle: -90, position: "insideLeft", fontSize: 11, fill: "#94a3b8" }} />
          <Tooltip formatter={(v: number) => formatToman(v)} contentStyle={tooltipStyle} />
          <ReferenceLine y={0} stroke="#94a3b8" />
          <Line type="monotone" dataKey="profit" name="سود" stroke="#0f766e" strokeWidth={2.5} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/* نمودار ۳ — فروش در برابر نقطه سربه‌سر */
export function SalesVsBreakEvenChart({ currentSales, breakEvenUnits }: { currentSales: number; breakEvenUnits: number | null }) {
  const data = [{ name: "وضعیت فعلی", "فروش شما": currentSales, "نقطه سربه‌سر": breakEvenUnits ?? 0 }];
  const gap = breakEvenUnits !== null ? currentSales - breakEvenUnits : null;
  const insight =
    breakEvenUnits === null
      ? "با قیمت و هزینه فعلی، رسیدن به سربه‌سر ممکن نیست."
      : gap === null
      ? null
      : gap >= 0
      ? `شما ${formatUnits(gap)} بیشتر از نقطه سربه‌سر می‌فروشید.`
      : `با فروش فعلی هنوز ${formatUnits(Math.abs(gap))} با نقطه سربه‌سر فاصله دارید.`;
  return (
    <ChartCard title="فروش در برابر نقطه سربه‌سر" description="مقایسه فروش واقعی با تعداد لازم برای سربه‌سر شدن" insight={insight}>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ left: 4, right: 8, top: 8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={formatCompact} width={36} />
          <Tooltip formatter={(v: number) => formatNumber(v) + " دستگاه"} contentStyle={tooltipStyle} />
          <Legend />
          <Bar dataKey="فروش شما" fill="#0891b2" radius={[6, 6, 0, 0]} />
          <Bar dataKey="نقطه سربه‌سر" fill="#ca8a04" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/* نمودار ۱۰ — فروش واقعی در برابر هدف (فقط اگر هدف تعیین شده باشد) */
export function ActualVsTargetChart({ history, targetProfit }: { history: MonthlyRecord[]; targetProfit: number }) {
  const hasTarget = targetProfit > 0;
  const last = history[history.length - 1];
  const gap = last ? targetProfit - last.profit : null;
  const insight =
    gap === null ? null : gap <= 0
      ? `عالی — سود ماه اخیر از هدف ${formatToman(Math.abs(gap))} بیشتر بوده است.`
      : `سود ماه اخیر هنوز ${formatToman(gap)} تا رسیدن به هدف فاصله دارد.`;
  return (
    <ChartCard
      title="سود واقعی در برابر هدف" description="روند سود ماهانه در مقایسه با خط هدف سودی که تعیین کرده‌اید"
      minPeriods={hasTarget ? 1 : 999} periodsAvailable={hasTarget ? history.length : 0}
      noDataHint="ابتدا در صفحه «چقدر سود می‌خواهم؟» یک سود هدف تعیین کنید."
      insight={insight}
    >
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={history} margin={{ left: 4, right: 8, top: 8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={formatCompact} width={40} />
          <Tooltip formatter={(v: number) => formatToman(v)} contentStyle={tooltipStyle} />
          <ReferenceLine y={0} stroke="#94a3b8" />
          <ReferenceLine y={targetProfit} stroke="#7c3aed" strokeDasharray="4 4" label={{ value: "هدف", fontSize: 11, fill: "#7c3aed" }} />
          <Line type="monotone" dataKey="profit" name="سود واقعی" stroke="#0f766e" strokeWidth={2.5} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/* نمودار جانبی — زیان تا سود (مکمل نمودار ۴، برای نمایش کامل‌تر مسیر) */
export function LossToProfitChart({ contributionPerUnit, fixedMonthlyCost, breakEvenUnits, maxUnits }: {
  contributionPerUnit: number; fixedMonthlyCost: number; breakEvenUnits: number | null; maxUnits: number;
}) {
  const steps = 12;
  const top = Math.max(maxUnits, (breakEvenUnits ?? 0) * 2, 100);
  const data = Array.from({ length: steps + 1 }, (_, i) => {
    const q = Math.round((top / steps) * i);
    return { q, profit: q * contributionPerUnit - fixedMonthlyCost };
  });
  const insight =
    breakEvenUnits === null
      ? "با شرایط فعلی، این خط هیچ‌وقت به سود نمی‌رسد — قیمت یا هزینه باید تغییر کند."
      : `با فروختن ${formatUnits(breakEvenUnits)} از زیان به سود می‌رسید.`;
  return (
    <ChartCard title="مسیر زیان تا سود" description="با افزایش تعداد فروش، زیان چطور به سود تبدیل می‌شود" insight={insight}>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ left: 4, right: 8, top: 8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="q" tick={{ fontSize: 10 }} tickFormatter={formatCompact}
            label={{ value: "تعداد فروش", position: "insideBottom", offset: -4, fontSize: 11, fill: "#94a3b8" }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={formatCompact} width={40} />
          <Tooltip formatter={(v: number) => formatToman(v)} labelFormatter={(l) => formatNumber(l) + " دستگاه"} contentStyle={tooltipStyle} />
          <ReferenceLine y={0} stroke="#94a3b8" />
          {breakEvenUnits !== null && <ReferenceLine x={breakEvenUnits} stroke="#ca8a04" strokeDasharray="4 4" label={{ value: "سربه‌سر", fontSize: 11, fill: "#ca8a04" }} />}
          <Line type="monotone" dataKey="profit" stroke="#0f766e" strokeWidth={2.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/* نمودار ۵ — سود بر اساس قیمت فروش */
export function ProfitByPriceChart({ basePrice, monthlyUnits, fixedMonthlyCost, totalVariableCostPerUnit }: {
  basePrice: number; monthlyUnits: number; fixedMonthlyCost: number; totalVariableCostPerUnit: number;
}) {
  const deltas = [-1500000, -1000000, -500000, 0, 500000, 1000000, 1500000];
  const data = deltas.map((d) => {
    const price = basePrice + d;
    const profit = monthlyUnits * (price - totalVariableCostPerUnit) - fixedMonthlyCost;
    return { price, profit };
  });
  const perStep = monthlyUnits * 100000; // اثر هر ۱۰۰ هزار تومان تغییر قیمت روی سود، با تعداد فروش فعلی
  const insight = monthlyUnits > 0
    ? `هر ۱۰۰ هزار تومان افزایش قیمت، با فروش فعلی حدود ${formatToman(perStep)} به سود ماهانه اضافه می‌کند.`
    : "برای دیدن اثر قیمت روی سود، تعداد فروش ماهانه را وارد کنید.";
  return (
    <ChartCard title="سود بر اساس قیمت فروش" description="تأثیر تغییر قیمت فروش بر سود ماهانه (با تعداد فروش فعلی)" insight={insight}>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ left: 4, right: 8, top: 8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="price" tick={{ fontSize: 10 }} tickFormatter={formatCompact}
            label={{ value: "قیمت فروش", position: "insideBottom", offset: -4, fontSize: 11, fill: "#94a3b8" }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={formatCompact} width={40} />
          <Tooltip formatter={(v: number) => formatToman(v)} labelFormatter={(l) => formatToman(l)} contentStyle={tooltipStyle} />
          <ReferenceLine y={0} stroke="#94a3b8" />
          <Line type="monotone" dataKey="profit" stroke="#ca8a04" strokeWidth={2.5} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/* نمودار ۴ — سود بر اساس تعداد فروش */
export function ProfitByVolumeChart({ contributionPerUnit, fixedMonthlyCost }: { contributionPerUnit: number; fixedMonthlyCost: number }) {
  const volumes = [100, 250, 500, 1000, 1500, 2000, 2500, 3000];
  const data = volumes.map((q) => ({ q, profit: q * contributionPerUnit - fixedMonthlyCost }));
  const insight =
    contributionPerUnit > 0
      ? `هر دستگاه اضافه‌ای که بفروشید، ${formatToman(contributionPerUnit)} به سود ماهانه اضافه می‌کند.`
      : "با قیمت فعلی، فروش بیشتر فقط زیان را بزرگ‌تر می‌کند — قیمت باید بالاتر از هزینه هر دستگاه باشد.";
  return (
    <ChartCard title="سود بر اساس تعداد فروش" description="تأثیر تعداد فروش بر سود ماهانه (با قیمت فعلی)" insight={insight}>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ left: 4, right: 8, top: 8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="q" tick={{ fontSize: 11 }} tickFormatter={formatCompact}
            label={{ value: "تعداد فروش", position: "insideBottom", offset: -4, fontSize: 11, fill: "#94a3b8" }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={formatCompact} width={40} />
          <Tooltip formatter={(v: number) => formatToman(v)} labelFormatter={(l) => formatNumber(l) + " دستگاه"} contentStyle={tooltipStyle} />
          <ReferenceLine y={0} stroke="#94a3b8" />
          <Line type="monotone" dataKey="profit" stroke="#7c3aed" strokeWidth={2.5} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/* نمودار ۶ — ترکیب هزینه‌ها */
export function CostBreakdownChart({ expenses }: { expenses: MonthlyExpense[] }) {
  const active = expenses.filter((e) => e.active);
  const data = active.map((e) => ({ name: e.title, value: e.amount }));
  const total = data.reduce((s, d) => s + d.value, 0);
  const top = data.slice().sort((a, b) => b.value - a.value)[0];
  const insight = top && total > 0
    ? `بیشترین سهم هزینه‌های شما مربوط به «${top.name}» است (${formatPercent((top.value / total) * 100)} از کل).`
    : null;
  return (
    <ChartCard
      title="ترکیب هزینه‌های ماهانه" description="سهم هر هزینه از کل هزینه‌های دوره"
      minPeriods={1} periodsAvailable={data.length}
      noDataHint="حداقل یک هزینه فعال ثبت کنید."
      insight={insight}
    >
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" outerRadius={85} label={(e: { name?: string }) => e.name}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip formatter={(v: number) => formatToman(v)} contentStyle={tooltipStyle} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/* نمودار ۷ — رشد فروش */
export function SalesGrowthChart({ history }: { history: MonthlyRecord[] }) {
  const data = calcGrowthSeries(history, "unitsSold");
  const lastGrowth = data[data.length - 1]?.growth ?? null;
  const insight = lastGrowth === null ? null
    : `رشد فروش ماه اخیر نسبت به ماه قبل ${formatPercent(Math.abs(lastGrowth))} ${lastGrowth >= 0 ? "مثبت" : "منفی"} بوده است.`;
  return (
    <ChartCard
      title="رشد فروش" description="درصد رشد ماهانه فروش نسبت به دوره قبل"
      minPeriods={2} periodsAvailable={history.length}
      noDataHint="حداقل اطلاعات دو ماه را ثبت کنید."
      insight={insight}
    >
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ left: 4, right: 8, top: 8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatPercent(v)} width={44} />
          <Tooltip formatter={(v: number) => formatPercent(v)} contentStyle={tooltipStyle} />
          <ReferenceLine y={0} stroke="#94a3b8" />
          <Line type="monotone" dataKey="growth" stroke="#0891b2" strokeWidth={2.5} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/* نمودار ۸ — رشد سود */
export function ProfitGrowthChart({ history }: { history: MonthlyRecord[] }) {
  const data = calcGrowthSeries(history, "profit");
  const lastGrowth = data[data.length - 1]?.growth ?? null;
  const insight = lastGrowth === null ? null
    : `رشد سود ماه اخیر نسبت به ماه قبل ${formatPercent(Math.abs(lastGrowth))} ${lastGrowth >= 0 ? "مثبت" : "منفی"} بوده است.`;
  return (
    <ChartCard
      title="رشد سود" description="درصد رشد یا کاهش سود ماهانه نسبت به دوره قبل"
      minPeriods={2} periodsAvailable={history.length}
      noDataHint="حداقل اطلاعات دو ماه را ثبت کنید."
      insight={insight}
    >
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ left: 4, right: 8, top: 8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatPercent(v)} width={44} />
          <Tooltip formatter={(v: number) => formatPercent(v)} contentStyle={tooltipStyle} />
          <ReferenceLine y={0} stroke="#94a3b8" />
          <Line type="monotone" dataKey="growth" stroke="#0f766e" strokeWidth={2.5} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/* نمودار ۹ — مقایسه سناریوها */
export function ScenarioComparisonChart({ data }: { data: { name: string; profit: number }[] }) {
  const best = data.slice().sort((a, b) => b.profit - a.profit)[0];
  const insight = best ? `بهترین سناریو از نظر سود، «${best.name}» با سود ${formatToman(best.profit)} است.` : null;
  return (
    <ChartCard
      title="مقایسه سناریوها" description="سود ماهانه هر سناریو در کنار هم"
      minPeriods={2} periodsAvailable={data.length}
      noDataHint="حداقل ۲ سناریو را انتخاب کنید."
      insight={insight}
    >
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ left: 4, right: 8, top: 8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={formatCompact} width={40} />
          <Tooltip formatter={(v: number) => formatToman(v)} contentStyle={tooltipStyle} />
          <Bar dataKey="profit" name="سود ماهانه" radius={[6, 6, 0, 0]}>
            {data.map((d, i) => <Cell key={i} fill={d.profit >= 0 ? "#0f766e" : "#e11d48"} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm inline-block bg-[#0f766e]" /> سودده</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm inline-block bg-[#e11d48]" /> زیان‌ده</span>
      </div>
    </ChartCard>
  );
}
