# ماشین حساب سود و قیمت فروش کارتخوان

داشبورد مدیریتی فارسی/راست‌چین برای محاسبه هزینه واقعی هر دستگاه کارتخوان،
سود، نقطه سربه‌سر و سناریوهای قیمت‌گذاری.

## ⚠️ نکته مهم درباره این تحویل

این پروژه در یک محیط sandbox **بدون دسترسی به اینترنت** ساخته شده است، بنابراین:

- تمام کد منبع (TypeScript واقعی، بدون `any`) نوشته و از نظر **نحو (syntax)**
  با کامپایلر TypeScript بررسی شده — هر ۳۴ فایل `src/` و `tests/` بدون خطای
  نحوی هستند.
- **موتور محاسبات مالی** (`src/calculations/*.ts`, `src/utils/format.ts`,
  `src/types/*.ts`) کاملاً مستقل از هر پکیج خارجی است، بنابراین واقعاً اجرا و
  تست شده: **۴۹ تست، ۴۹ موفق، ۰ ناموفق** (جزئیات در «تست‌ها» پایین همین فایل).
- چون `vite`، `tailwindcss`، `recharts`، `xlsx`، `lucide-react` و
  `react-router-dom` در sandbox نصب نبودند و امکان `npm install` (دسترسی به
  npm registry) وجود نداشت، **`npm run build` واقعی در همین محیط اجرا نشده
  است.** این پکیج‌ها در `package.json` تعریف شده‌اند و با اجرای دستورات زیر
  در محیط خودتان (با دسترسی اینترنت) نصب و build می‌شوند.

یعنی: **صحت فرمول‌های مالی را می‌توانید همین الان با `npm run test` ببینید
بدون نصب چیزی بیشتر از `typescript` و `tsx`.** برای دیدن خود اپلیکیشن باید
یک بار `npm install` در محیط خودتان اجرا شود.

## اجرا

```bash
npm install
npm run dev      # اجرای محیط توسعه (Vite)
npm run build    # بیلد Production (tsc --noEmit سپس vite build)
npm run preview  # پیش‌نمایش بیلد نهایی
npm run test     # اجرای تست‌های موتور مالی (بدون نیاز به npm install کامل)
```

## معماری

```
src/
├── calculations/   ← فرمول‌های مالی (منبع حقیقت، جدا از UI، تست‌شده)
├── types/           ← مدل داده مرکزی
├── utils/format.ts  ← formatToman / formatNumber / formatPercent / formatUnits
├── data/             ← داده نمونه (isSample: true)
├── hooks/            ← useLocalStorage (لایه ذخیره‌سازی) + useFinancialModel (state مرکزی)
├── components/
│   ├── ui/           ← Card, Button, Badge, SectionTitle
│   ├── forms/        ← MoneyInput
│   ├── dashboard/    ← KpiCard, StatusBanner, AlertCard, EmptyState
│   ├── charts/        ← ۱۰ نمودار Recharts
│   ├── scenarios/      ← ScenarioTable
│   ├── reports/         ← ExportButtons, ReportHeader
│   └── layout/           ← Sidebar, Header, AppLayout, ErrorBoundary
├── pages/            ← Dashboard, Costs, Device, Sales, SalesVolume, TargetProfit, Scenarios, Reports
└── exports/excelExport.ts  ← خروجی اکسل چندبرگه (SheetJS)
```

UI هرگز فرمول مالی ندارد — همه از `calculations/` و `hooks/useFinancialModel.ts`
می‌آید (یک مدل داده مرکزی، طبق الزام «اطلاعات مالی نباید در چند نقطه ذخیره شود»).

## فناوری

React 18 · TypeScript (strict, بدون `any`) · Vite · Tailwind CSS (استراتژی
`class` برای دارک‌مود) · Recharts · react-router-dom · lucide-react · xlsx
(SheetJS) برای خروجی اکسل · CSS چاپ اختصاصی برای A4.

**درباره shadcn/ui:** نصب واقعی shadcn به CLI و دسترسی اینترنت نیاز دارد.
به‌جایش، معادل سبک همان کامپوننت‌ها در `components/ui/primitives.tsx` نوشته
شده (همان ظاهر/رفتار، بدون وابستگی CLI). اگر بعداً به اینترنت دسترسی داشتید،
`npx shadcn@latest init` و جایگزینی این فایل کار می‌کند.

**درباره Zod:** چون نصب نبود، `calculations/validation.ts` را با توابع اعتبارسنجی
دستی (پیام‌های فارسی) نوشتیم — رابط تابعی مشابه، بدون وابستگی. جایگزینی با Zod
در آینده ساده است چون همه‌جا فقط از این توابع import می‌شود.

## محاسبات پیاده‌سازی‌شده

| فرمول | فایل |
|---|---|
| Direct Cost | `calculations/cost.ts` |
| Holding Cost | `calculations/cost.ts` |
| Economic Variable Cost | `calculations/cost.ts` |
| Contribution Per Unit | `calculations/profit.ts` |
| Monthly Profit | `calculations/profit.ts` |
| Break Even Units (رند به بالا، null اگر contribution ≤ 0) | `calculations/breakeven.ts` |
| Units For Target Profit (رند به بالا) | `calculations/breakeven.ts` |
| Required Selling Price | `calculations/breakeven.ts` |
| Status Engine (loss/breakeven/profit) | `calculations/breakeven.ts` |
| Scenario evaluation | `calculations/scenarios.ts` |

گرد کردن فقط در نمایش انجام می‌شود (`utils/format.ts`)؛ محاسبات داخلی دقیق می‌مانند.

## تست‌ها (واقعاً اجرا شده در این sandbox)

بدون نیاز به vitest/jest — یک ران‌ر سبک (`tests/runner.ts`) با
`node:assert/strict`:

```
tests/calculations.test.ts   → 24 passed, 0 failed
tests/format.test.ts         → 9  passed, 0 failed
tests/scenario-audit.test.ts → 16 passed, 0 failed
جمع: 49 passed, 0 failed
```

پوشش: Direct/Holding/Economic Cost، Contribution مثبت/منفی، Monthly Profit
(شامل فروش صفر)، Break-Even (شامل contribution≤0 و هزینه ثابت صفر)، Units/Price
for Target Profit (شامل حالت دست‌نیافتنی)، Gap to Break-Even، Status Engine
هر سه حالت، حجم بالا/قیمت پایین/قیمت بالا، و ارزیابی سناریو سرتاسری.

`tests/scenario-audit.test.ts` سناریوهای اجباری سند «ممیزی موتور محاسبات»
(A تا L + وضعیت سه‌گانه + تفکیک هزینه ثابت/متغیر) را مستقیماً در برابر
مشخصات رسمی صحه‌گذاری می‌کند — از جمله مثال عددی رسمی هزینه خواب سرمایه
(۱۰,۰۰۰,۰۰۰ × ۲۶٪ × ۱/۱۲ ≈ ۲۱۶,۶۶۷ تومان).

## موارد باقی‌مانده برای شما

1. `npm install` با دسترسی اینترنت (این پکیج‌ها را نصب می‌کند: vite,
   tailwindcss, recharts, xlsx, lucide-react, react-router-dom, و type ها).
2. `npm run build` را اجرا و اگر به خطای نوع (type) برخوردید (که در فایل‌های
   منطق مالی بعید است چون بدون وابستگی خارجی strict-clean هستند) به من
   بگویید تا رفع کنم.
3. `npx shadcn@latest init` اختیاری، اگر می‌خواهید primitives واقعی shadcn را
   جایگزین `components/ui/primitives.tsx` کنید.
4. Persistence فعلی `localStorage` است (طبق الزام سند)؛ برای انتقال به
   Backend فقط کافی‌ست داخل `hooks/useLocalStorage.ts` را عوض کنید — همه‌ی
   صفحات از همین یک نقطه می‌خوانند/می‌نویسند.
