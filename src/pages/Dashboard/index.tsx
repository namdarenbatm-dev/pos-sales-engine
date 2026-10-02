import React, { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, CheckCircle2, Gauge, RotateCcw, Sparkles, TrendingUp, XCircle } from "lucide-react";
import { calculateDecision, type RepeatPurchase } from "../../calculations/decisionEngine";
import { formatNumber, formatToman } from "../../utils/format";

const DEFAULTS = {
  currentPurchasePrice: 3_500_000,
  currentSellingPrice: 5_000_000,
  currentDollar: 250,
  futureDollar: 280,
  targetProfitPercent: 20,
  repeatPurchase: "high" as RepeatPurchase,
};

function Field({ label, value, onChange, suffix }: { label: string; value: number; onChange: (v: number) => void; suffix: string }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">{label}</span>
      <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 focus-within:border-teal-600 focus-within:ring-2 focus-within:ring-teal-100 dark:focus-within:ring-teal-950">
        <input
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(Number(e.target.value.replace(/[^0-9.]/g, "")) || 0)}
          className="w-full min-w-0 bg-transparent px-3 py-3 text-sm font-bold text-slate-800 dark:text-slate-100 outline-none"
        />
        <span className="px-3 text-[11px] text-slate-400 whitespace-nowrap">{suffix}</span>
      </div>
    </label>
  );
}

export default function Dashboard() {
  const [values, setValues] = useState(DEFAULTS);
  const result = useMemo(() => calculateDecision(values), [values]);

  const set = <K extends keyof typeof values>(key: K, value: (typeof values)[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const decisionStyles = {
    sell: "border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-800",
    negotiate: "border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800",
    hold: "border-rose-200 bg-rose-50 dark:bg-rose-950/30 dark:border-rose-800",
  }[result.decision];

  const DecisionIcon = result.decision === "sell" ? CheckCircle2 : result.decision === "negotiate" ? Gauge : XCircle;

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-teal-700 dark:text-teal-400 text-xs font-bold mb-1">
            <Sparkles size={15} /> POS SALES ENGINE
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">تصمیم فروش</h1>
          <p className="text-sm mt-1 text-slate-500 dark:text-slate-400">به‌جای محاسبه، تصمیم بگیر.</p>
        </div>
        <button onClick={() => setValues(DEFAULTS)} className="p-2 rounded-xl text-slate-400 hover:text-teal-700 hover:bg-white dark:hover:bg-slate-800" title="بازنشانی">
          <RotateCcw size={17} />
        </button>
      </div>

      <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/70 shadow-sm p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-bold text-slate-800 dark:text-slate-100">اطلاعات معامله</h2>
            <p className="text-xs text-slate-400 mt-1">فقط اعداد مؤثر بر تصمیم را وارد کن.</p>
          </div>
          <TrendingUp size={18} className="text-teal-600" />
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Field label="قیمت خرید فعلی" value={values.currentPurchasePrice / 1_000_000} onChange={(v) => set("currentPurchasePrice", v * 1_000_000)} suffix="میلیون تومان" />
          <Field label="قیمت فروش فعلی" value={values.currentSellingPrice / 1_000_000} onChange={(v) => set("currentSellingPrice", v * 1_000_000)} suffix="میلیون تومان" />
          <Field label="دلار فعلی" value={values.currentDollar} onChange={(v) => set("currentDollar", v)} suffix="واحد" />
          <Field label="دلار آتی" value={values.futureDollar} onChange={(v) => set("futureDollar", v)} suffix="سناریو" />
        </div>

        <div className="mt-5 grid sm:grid-cols-2 gap-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">سود هدف</span>
              <strong className="text-sm text-teal-700 dark:text-teal-400">{formatNumber(values.targetProfitPercent)}٪</strong>
            </div>
            <input type="range" min="5" max="50" step="1" value={values.targetProfitPercent} onChange={(e) => set("targetProfitPercent", Number(e.target.value))} className="w-full accent-teal-700" />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1"><span>۵٪</span><span>۵۰٪</span></div>
          </div>
          <div>
            <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">احتمال خرید بعدی مشتری</span>
            <div className="grid grid-cols-3 gap-2">
              {(["low", "medium", "high"] as RepeatPurchase[]).map((level) => {
                const labels = { low: "کم", medium: "متوسط", high: "زیاد" };
                return <button key={level} onClick={() => set("repeatPurchase", level)} className={`rounded-xl border py-2.5 text-xs font-bold transition ${values.repeatPurchase === level ? "bg-teal-700 text-white border-teal-700" : "bg-white dark:bg-slate-900/60 text-slate-500 border-slate-200 dark:border-slate-700"}`}>{labels[level]}</button>;
              })}
            </div>
          </div>
        </div>
      </section>

      <section className={`rounded-2xl border p-5 sm:p-6 ${decisionStyles}`}>
        <div className="flex items-start gap-3">
          <DecisionIcon size={25} className="mt-0.5 shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold opacity-70">DECISION ENGINE</div>
            <h2 className="text-2xl sm:text-3xl font-extrabold mt-1">{result.decisionLabel}</h2>
            <p className="mt-3 text-sm font-semibold leading-7">{result.action}</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-3 mt-5">
          <div className="rounded-xl bg-white/70 dark:bg-slate-900/40 p-4">
            <div className="text-[11px] text-slate-500 dark:text-slate-400">قیمت پیشنهادی</div>
            <div className="text-xl font-extrabold mt-1">{formatToman(result.targetPrice)}</div>
          </div>
          <div className="rounded-xl bg-white/70 dark:bg-slate-900/40 p-4">
            <div className="text-[11px] text-slate-500 dark:text-slate-400">کف فروش</div>
            <div className="text-xl font-extrabold mt-1">{formatToman(result.floorPrice)}</div>
          </div>
          <div className="rounded-xl bg-white/70 dark:bg-slate-900/40 p-4">
            <div className="text-[11px] text-slate-500 dark:text-slate-400">تخفیف مجاز</div>
            <div className="text-xl font-extrabold mt-1">{formatToman(result.maxDiscount)}</div>
          </div>
        </div>
      </section>

      <section className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/70 p-5">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4">منطق تصمیم</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">هزینه جایگزینی</span><strong>{formatToman(result.replacementCost)}</strong></div>
            <div className="flex justify-between"><span className="text-slate-500">سود فعلی</span><strong>{formatToman(result.currentProfit)}</strong></div>
            <div className="flex justify-between"><span className="text-slate-500">سود اقتصادی</span><strong>{formatToman(result.economicProfit)}</strong></div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/70 p-5">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4">چرا این تصمیم؟</h3>
          <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-300 leading-6">
            {result.reasons.map((reason, i) => <li key={i} className="flex gap-2"><span className="text-teal-600">•</span><span>{reason}</span></li>)}
          </ul>
        </div>
      </section>

      <div className="rounded-xl bg-slate-900 text-white p-4 flex items-center justify-between gap-4">
        <div><div className="text-[11px] text-slate-400">اقدام فروشنده</div><div className="text-sm font-bold mt-1">{result.action}</div></div>
        {result.futureDollar >= result.currentDollar ? <ArrowUp size={18} className="text-amber-300 shrink-0" /> : <ArrowDown size={18} className="text-emerald-300 shrink-0" />}
      </div>
    </div>
  );
}
