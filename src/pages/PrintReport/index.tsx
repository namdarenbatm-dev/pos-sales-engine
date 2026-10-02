import React from "react";
import { Link } from "react-router-dom";
import { Printer, ArrowRight } from "lucide-react";
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from "recharts";
import { useFinancialModel } from "../../hooks/FinancialModelContext";
import { STATUS_META } from "../../components/dashboard/DashboardWidgets";
import { calcRecordProfit } from "../../calculations/profit";
import { calcUnitsForTargetProfit } from "../../calculations/breakeven";
import { formatToman, formatUnits, formatNumber } from "../../utils/format";
import { Button } from "../../components/ui/primitives";

/* اندازه ثابت (نه ResponsiveContainer) عمداً انتخاب شده: در حالت چاپ/PDF
   مرورگر همیشه اندازه‌ی محفظه را به‌درستی به نمودار پاسخگو نمی‌دهد و ممکن
   است نمودار خالی چاپ شود. اندازه ثابت این ریسک را کاملاً حذف می‌کند. */
const PRINT_CHART_WIDTH = 480;
const PRINT_CHART_HEIGHT = 200;
const PIE_COLORS = ["#0f766e", "#0891b2", "#65a30d", "#ca8a04", "#dc2626", "#7c3aed", "#db2777", "#475569"];

export default function PrintReport() {
  const m = useFinancialModel();
  const { snapshot, sales, targetProfit, fixedMonthlyCost } = m;
  const history = m.history.map((h) => ({ ...h, profit: calcRecordProfit(h) }));
  const meta = STATUS_META[snapshot.status];
  const dateStr = new Date().toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" });

  const unitsForTarget = calcUnitsForTargetProfit(fixedMonthlyCost, targetProfit, snapshot.contributionPerUnit);
  const activeExpenses = m.expenses.filter((e) => e.active);

  const headline =
    snapshot.status === "profit"
      ? `کسب‌وکار شما سودده است — سود ماهانه حدود ${formatToman(snapshot.monthlyProfit)}.`
      : snapshot.status === "breakeven"
      ? "کسب‌وکار شما تقریباً سربه‌سر است — سود یا زیان قابل‌توجهی وجود ندارد."
      : `کسب‌وکار شما در حال حاضر زیان می‌دهد — حدود ${formatToman(Math.abs(snapshot.monthlyProfit))} در ماه.`;

  const gapSentence =
    snapshot.breakEvenUnits === null
      ? "با قیمت و هزینه فعلی، رسیدن به سربه‌سر ممکن نیست؛ قیمت یا هزینه باید بازبینی شود."
      : (snapshot.gapToBreakEven ?? 0) >= 0
      ? `فروش فعلی ${formatUnits(snapshot.gapToBreakEven ?? 0)} بالاتر از نقطه سربه‌سر است.`
      : `فروش فعلی هنوز ${formatUnits(Math.abs(snapshot.gapToBreakEven ?? 0))} با نقطه سربه‌سر فاصله دارد.`;

  const targetSentence =
    targetProfit <= 0
      ? null
      : unitsForTarget !== null
      ? `برای رسیدن به سود هدف ${formatToman(targetProfit)}، باید ${formatUnits(unitsForTarget)} بفروشید.`
      : "با قیمت فعلی، رسیدن به سود هدف تعیین‌شده ممکن نیست.";

  const hasEnoughHistory = history.length >= 2;
  const volumeChartData = [100, 250, 500, 1000, 1500, 2000, 2500, 3000].map((q) => ({
    q, profit: q * snapshot.contributionPerUnit - fixedMonthlyCost,
  }));
  const totalExpense = activeExpenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div>
      {/* نوار ابزار — فقط روی صفحه دیده می‌شود، هرگز چاپ نمی‌شود */}
      <div className="no-print flex items-center justify-between mb-5 flex-wrap gap-3">
        <Link to="/" className="flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-teal-700">
          <ArrowRight size={16} /> بازگشت
        </Link>
        <div className="flex items-center gap-3">
          <p className="text-xs text-slate-400 dark:text-slate-500 hidden sm:block">
            برای شماره صفحه، در پنجره چاپ گزینه «سربرگ/پاورقی» را فعال کنید.
          </p>
          <Button variant="primary" onClick={() => window.print()}>
            <span className="flex items-center gap-2"><Printer size={16} /> چاپ گزارش</span>
          </Button>
        </div>
      </div>

      {/* ───────── محتوای گزارش — دقیقاً همینی که چاپ می‌شود ───────── */}
      <div className="print-card bg-white dark:bg-slate-800/70 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 sm:p-8 print:border-0 print:p-0 print:rounded-none print:bg-white">

        <div className="print-avoid-break mb-6 pb-4 border-b-2 border-slate-800 dark:border-slate-200">
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-50">گزارش مدیریتی — ماشین‌حساب سود و قیمت فروش کارتخوان</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">تاریخ گزارش: {dateStr}</p>
          {m.isSampleData && (
            <p className="text-sm font-bold text-amber-700 dark:text-amber-400 mt-2">
              ⚠ این گزارش بر اساس داده نمونه است، نه اطلاعات واقعی کسب‌وکار.
            </p>
          )}
        </div>

        {/* خلاصه وضعیت */}
        <section className="print-avoid-break mb-6">
          <div className="flex items-center gap-3 rounded-xl border p-4 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40">
            <span className="text-3xl leading-none">{meta.emoji}</span>
            <p className="text-base font-bold text-slate-800 dark:text-slate-100">{headline}</p>
          </div>
        </section>

        {/* شاخص‌های اصلی */}
        <section className="print-avoid-break mb-6">
          <h2 className="print-h2 text-sm font-bold text-slate-700 dark:text-slate-200 mb-3">شاخص‌های اصلی</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              ["قیمت فروش فعلی", formatToman(sales.sellingPrice)],
              ["تعداد فروش ماهانه", `${formatUnits(sales.monthlyUnits)}`],
              ["سود/زیان ماهانه", formatToman(snapshot.monthlyProfit)],
              ["سود باقی‌مانده از هر فروش", formatToman(snapshot.contributionPerUnit)],
              ["نقطه سربه‌سر", snapshot.breakEvenUnits !== null ? formatUnits(snapshot.breakEvenUnits) : "دست‌نیافتنی"],
              ["وضعیت", meta.label],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                <div className="text-[11px] text-slate-400 dark:text-slate-500">{label}</div>
                <div className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5">{value}</div>
              </div>
            ))}
          </div>
        </section>

        {/* جدول اطلاعات — هزینه‌های ماهانه فعال */}
        {activeExpenses.length > 0 && (
          <section className="print-avoid-break mb-6">
            <h2 className="print-h2 text-sm font-bold text-slate-700 dark:text-slate-200 mb-3">جدول هزینه‌های ماهانه</h2>
            <div className="overflow-x-auto">
            <table className="w-full text-sm border border-slate-200 dark:border-slate-700">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400">
                  <th className="text-right py-2 px-3 font-medium">عنوان هزینه</th>
                  <th className="text-right py-2 px-3 font-medium">مبلغ</th>
                  <th className="text-right py-2 px-3 font-medium">نوع</th>
                </tr>
              </thead>
              <tbody>
                {activeExpenses.map((e) => (
                  <tr key={e.id} className="border-t border-slate-100 dark:border-slate-700">
                    <td className="py-1.5 px-3">{e.title}</td>
                    <td className="py-1.5 px-3">{formatToman(e.amount)}</td>
                    <td className="py-1.5 px-3">{e.type === "fixed" ? "ثابت" : "وابسته به فروش"}</td>
                  </tr>
                ))}
                <tr className="border-t border-slate-200 dark:border-slate-700 font-bold">
                  <td className="py-1.5 px-3">جمع</td>
                  <td className="py-1.5 px-3">{formatToman(totalExpense)}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
            </div>
          </section>
        )}

        {/* نمودارهای مهم */}
        <section className="mb-6">
          <h2 className="print-h2 text-sm font-bold text-slate-700 dark:text-slate-200 mb-3">نمودارهای مهم</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="print-avoid-break overflow-x-auto">
              <div className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                {hasEnoughHistory ? "روند سود ماهانه" : "سود بر اساس تعداد فروش"}
              </div>
              {hasEnoughHistory ? (
                <LineChart width={PRINT_CHART_WIDTH} height={PRINT_CHART_HEIGHT} data={history} margin={{ left: 4, right: 8, top: 8, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} width={36} tickFormatter={(v) => formatNumber(v)} />
                  <Tooltip formatter={(v: number) => formatToman(v)} />
                  <ReferenceLine y={0} stroke="#94a3b8" />
                  <Line type="monotone" dataKey="profit" stroke="#0f766e" strokeWidth={2} dot={{ r: 2 }} isAnimationActive={false} />
                </LineChart>
              ) : (
                <LineChart width={PRINT_CHART_WIDTH} height={PRINT_CHART_HEIGHT} data={volumeChartData} margin={{ left: 4, right: 8, top: 8, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="q" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} width={36} tickFormatter={(v) => formatNumber(v)} />
                  <Tooltip formatter={(v: number) => formatToman(v)} />
                  <ReferenceLine y={0} stroke="#94a3b8" />
                  <Line type="monotone" dataKey="profit" stroke="#7c3aed" strokeWidth={2} dot={{ r: 2 }} isAnimationActive={false} />
                </LineChart>
              )}
            </div>
            <div className="print-avoid-break overflow-x-auto">
              <div className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">ترکیب هزینه‌های ماهانه</div>
              {activeExpenses.length > 0 ? (
                <PieChart width={PRINT_CHART_WIDTH} height={PRINT_CHART_HEIGHT}>
                  <Pie data={activeExpenses.map((e) => ({ name: e.title, value: e.amount }))} dataKey="value" nameKey="name"
                    outerRadius={75} label={(e: { name?: string }) => e.name} isAnimationActive={false}>
                    {activeExpenses.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatToman(v)} />
                </PieChart>
              ) : (
                <p className="text-xs text-slate-400 py-8 text-center">داده کافی برای نمایش این نمودار وجود ندارد.</p>
              )}
            </div>
          </div>
        </section>

        {/* نتیجه‌گیری مدیریتی */}
        <section className="print-avoid-break">
          <h2 className="print-h2 text-sm font-bold text-slate-700 dark:text-slate-200 mb-3">نتیجه‌گیری مدیریتی</h2>
          <ul className="text-sm text-slate-700 dark:text-slate-200 space-y-2 leading-7 list-disc pr-5">
            <li>{headline}</li>
            <li>{gapSentence}</li>
            {targetSentence && <li>{targetSentence}</li>}
          </ul>
        </section>
      </div>
    </div>
  );
}
