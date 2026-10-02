/* سناریوهای اجباری ممیزی اقتصادی (سند "ممیزی موتور محاسبات"، بندهای ۱۰ و ۱۱):
 * A..L به‌علاوه وضعیت سه‌گانه و تفکیک هزینه ثابت/متغیر.
 * این فایل چیزی را در calculations/ تغییر نمی‌دهد؛ فقط رفتار فرمول‌های
 * موجود را در برابر مشخصات رسمی صحه‌گذاری می‌کند. */
import assert from "node:assert/strict";
import { test, run } from "./runner";
import {
  calcDirectCost, calcHoldingCost, calcEconomicVariableCost, calcTotalVariableCostPerUnit,
} from "../src/calculations/cost";
import { calcContributionPerUnit, calcMonthlyProfit, calcRecordProfit } from "../src/calculations/profit";
import {
  calcBreakEvenUnits, calcUnitsForTargetProfit, calcRequiredSellingPrice, calcBusinessStatus,
} from "../src/calculations/breakeven";
import type { DeviceCost } from "../src/types";
import { sampleHistory } from "../src/data/sampleData";
import { calcGrowthSeries } from "../src/calculations/growth";

const device: DeviceCost = {
  purchasePrice: 8500000, shippingCost: 150000, customsCost: 400000, clearanceCost: 100000,
  preparationCost: 120000, otherDirectCost: 80000, holdingPeriodMonths: 1, annualMoneyCostRate: 26,
};
const directCost = calcDirectCost(device);
const holdingCost = calcHoldingCost(directCost, device);
const evc = calcEconomicVariableCost(directCost, holdingCost);
const totalVar = calcTotalVariableCostPerUnit(evc, 0);

test("مثال رسمی سند: هزینه خواب سرمایه 10,000,000 × 26% × 1/12 ≈ 216,667", () => {
  const hc = calcHoldingCost(10000000, { ...device, annualMoneyCostRate: 26, holdingPeriodMonths: 1 });
  assert.ok(Math.abs(hc - 216666.6667) < 0.01, `got ${hc}`);
});

test("سناریو A: فروش بیشتر → سود بیشتر", () => {
  const price = 11500000, fixed = 105000000;
  const contrib = calcContributionPerUnit(price, totalVar);
  const p1 = calcMonthlyProfit(1000, contrib, fixed);
  const p2 = calcMonthlyProfit(1500, contrib, fixed);
  assert.ok(p2 > p1);
});

test("سناریو B: قیمت فروش بیشتر → سود بیشتر", () => {
  const units = 1000, fixed = 105000000;
  const c1 = calcContributionPerUnit(11000000, totalVar);
  const c2 = calcContributionPerUnit(12000000, totalVar);
  assert.ok(calcMonthlyProfit(units, c2, fixed) > calcMonthlyProfit(units, c1, fixed));
});

test("سناریو C: هزینه ثابت بیشتر → سود کمتر", () => {
  const contrib = calcContributionPerUnit(11500000, totalVar);
  assert.ok(calcMonthlyProfit(1000, contrib, 150000000) < calcMonthlyProfit(1000, contrib, 100000000));
});

test("سناریو D: هزینه متغیر بیشتر → سود کمتر", () => {
  const units = 1000, fixed = 105000000, price = 11500000;
  const c1 = calcContributionPerUnit(price, totalVar);
  const c2 = calcContributionPerUnit(price, totalVar + 1000000);
  assert.ok(calcMonthlyProfit(units, c2, fixed) < calcMonthlyProfit(units, c1, fixed));
});

test("سناریو E: قیمت فروش کمتر از هزینه متغیر → زیان", () => {
  const price = totalVar - 1000000;
  const contrib = calcContributionPerUnit(price, totalVar);
  assert.ok(contrib < 0);
  assert.equal(calcBusinessStatus(calcMonthlyProfit(1000, contrib, 50000000)), "loss");
});

test("سناریو F: قیمت فروش = هزینه متغیر → مبلغ باقی‌مانده صفر و سربه‌سر غیرممکن", () => {
  const contrib = calcContributionPerUnit(totalVar, totalVar);
  assert.equal(contrib, 0);
  assert.equal(calcBreakEvenUnits(50000000, contrib), null);
});

test("سناریو G: هزینه ثابت صفر", () => {
  const contrib = calcContributionPerUnit(11500000, totalVar);
  assert.equal(calcBreakEvenUnits(0, contrib), 0);
  assert.equal(calcMonthlyProfit(500, contrib, 0), 500 * contrib);
});

test("سناریو H: تعداد فروش صفر → سود = منفیِ هزینه ثابت", () => {
  const contrib = calcContributionPerUnit(11500000, totalVar);
  assert.equal(calcMonthlyProfit(0, contrib, 105000000), -105000000);
});

test("سناریو I: سود هدف صفر", () => {
  const contrib = calcContributionPerUnit(11500000, totalVar);
  const units = calcUnitsForTargetProfit(105000000, 0, contrib);
  assert.equal(units, Math.ceil(105000000 / contrib));
});

test("سناریو J: سود هدف منفی → تعداد لازم کمتر از سربه‌سر", () => {
  const contrib = calcContributionPerUnit(11500000, totalVar);
  const units = calcUnitsForTargetProfit(105000000, -20000000, contrib);
  assert.equal(units, Math.ceil((105000000 - 20000000) / contrib));
  assert.ok(units! < (calcBreakEvenUnits(105000000, contrib) ?? Infinity));
});

test("سناریو K: اعداد بسیار بزرگ بدون overflow/NaN", () => {
  const bigDevice: DeviceCost = { ...device, purchasePrice: 8_500_000_000, holdingPeriodMonths: 6, annualMoneyCostRate: 45 };
  const dc = calcDirectCost(bigDevice);
  const hc = calcHoldingCost(dc, bigDevice);
  assert.ok(Number.isFinite(dc) && Number.isFinite(hc));
  const contrib = calcContributionPerUnit(15_000_000_000, calcEconomicVariableCost(dc, hc));
  assert.ok(Number.isFinite(calcMonthlyProfit(1_000_000, contrib, 50_000_000_000)));
});

test("سناریو L: نرخ‌های اعشاری بدون گرد شدن زودهنگام", () => {
  const fracDevice: DeviceCost = { ...device, holdingPeriodMonths: 1.5, annualMoneyCostRate: 27.75 };
  const dc = calcDirectCost(fracDevice);
  const hc = calcHoldingCost(dc, fracDevice);
  const expected = dc * (27.75 / 100) * (1.5 / 12);
  assert.ok(Math.abs(hc - expected) < 0.0001);
  assert.ok(hc % 1 !== 0, "نتیجه نباید عدد صحیح گردشده باشد");
});

test("وضعیت سه‌گانه بر اساس محاسبه واقعی (نه رنگ ثابت UI)", () => {
  assert.equal(calcBusinessStatus(-1), "loss");
  assert.equal(calcBusinessStatus(0), "breakeven");
  assert.equal(calcBusinessStatus(1), "profit");
});

test("بند ۹: کمیسیون هزینه متغیر واحد است، هزینه ثابت با حجم تغییر نمی‌کند", () => {
  const fixed = 105000000;
  const totalVarWithCommission = calcTotalVariableCostPerUnit(evc, 250000);
  const contrib = calcContributionPerUnit(11500000, totalVarWithCommission);
  const impliedFixedAt1000 = 1000 * contrib - calcMonthlyProfit(1000, contrib, fixed);
  const impliedFixedAt2000 = 2000 * contrib - calcMonthlyProfit(2000, contrib, fixed);
  assert.equal(impliedFixedAt1000, impliedFixedAt2000);
  assert.equal(impliedFixedAt1000, fixed);
});

test("بند ۸: قیمت لازم برای سود هدف دقیقاً همان سود هدف را می‌دهد", () => {
  const targetProfit = 300000000, targetUnits = 1500, fixed = 105000000;
  const price = calcRequiredSellingPrice(totalVar, fixed, targetProfit, targetUnits);
  assert.equal(price, totalVar + (fixed + targetProfit) / targetUnits);
  const contrib = calcContributionPerUnit(price!, totalVar);
  assert.ok(Math.abs(calcMonthlyProfit(targetUnits, contrib, fixed) - targetProfit) < 0.0001);
});

test("ممیزی نمودارها: calcRecordProfit یک رکورد تاریخچه را دقیقاً مثل calcContributionPerUnit+calcMonthlyProfit حساب می‌کند", () => {
  const record = { sellingPrice: 11500000, unitsSold: 1500, variableCostPerUnit: 9000000, fixedCost: 105000000 };
  const expected = calcMonthlyProfit(record.unitsSold, calcContributionPerUnit(record.sellingPrice, record.variableCostPerUnit), record.fixedCost);
  assert.equal(calcRecordProfit(record), expected);
});

test("ممیزی نمودارها: داده نمونه تاریخچه (sampleHistory) با فیلدهای خودش سازگار است — رگرسیون باگ ناسازگاری سود ذخیره‌شده", () => {
  for (const h of sampleHistory) {
    assert.equal(h.profit, calcRecordProfit(h), `رکورد ${h.month}: سود ذخیره‌شده با فرمول واقعی نمی‌خواند`);
  }
});

test("فیلتر بازه زمانی: برش با یک رکورد اضافه (lookback) رشدِ اولین ماهِ نمایش‌داده‌شده را درست نسبت به ماه واقعیِ قبلش حساب می‌کند", () => {
  // شبیه‌سازی همان منطقی که Reports.tsx برای «۳ ماه اخیر» به کار می‌برد:
  // trendHistory = آخرین ۳ رکورد | growthHistory = آخرین ۴ رکورد (یکی اضافه برای lookback)
  // از همان calcGrowthSeries واقعی استفاده می‌کنیم (نه پیاده‌سازی جدا) تا این
  // تست دقیقاً همان چیزی را بسنجد که Reports.tsx در عمل صدا می‌زند.
  const growthWindow = sampleHistory.slice(-4); // h3, h4, h5, h6
  const naiveWindow = sampleHistory.slice(-3); // h4, h5, h6 — بدون lookback (روش نادرست)

  const withLookback = calcGrowthSeries(growthWindow, "unitsSold"); // باید ۳ نقطه بدهد: h4,h5,h6 هرکدام نسبت به ماه واقعی قبلش
  const withoutLookback = calcGrowthSeries(naiveWindow, "unitsSold"); // فقط ۲ نقطه می‌دهد (h4 گم می‌شود)

  assert.equal(withLookback.length, 3, "با lookback باید رشد هر ۳ ماهِ نمایش‌داده‌شده موجود باشد");
  assert.equal(withoutLookback.length, 2, "بدون lookback، رشدِ اولین ماهِ بازه گم می‌شود — دقیقاً همان باگی که lookback جلویش را می‌گیرد");

  // رشد h4 نسبت به h3 واقعی (۱۲۴۰ → ۱۳۱۰)
  const expectedH4Growth = ((1310 - 1240) / 1240) * 100;
  assert.ok(Math.abs(withLookback[0].growth - expectedH4Growth) < 0.0001);
});

run();
