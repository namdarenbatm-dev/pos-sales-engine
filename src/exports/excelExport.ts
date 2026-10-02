import * as XLSX from "xlsx";
import type { DeviceCost, MonthlyExpense, SalesData, Scenario, MonthlyRecord, FinancialSnapshot } from "../types";
import { STATUS_META } from "../components/dashboard/DashboardWidgets";
import { evaluateScenarios } from "../calculations/scenarios";
import { calcRecordProfit } from "../calculations/profit";
import { calcUnitsForTargetProfit, calcRequiredSellingPrice } from "../calculations/breakeven";
import { calcGrowthSeries } from "../calculations/growth";

type ExportInput = {
  device: DeviceCost;
  expenses: MonthlyExpense[];
  sales: SalesData;
  scenarios: Scenario[];
  history: MonthlyRecord[];
  snapshot: FinancialSnapshot;
  fixedMonthlyCost: number;
  totalVariableCostPerUnit: number;
  targetProfit: number;
  isSampleData: boolean;
};

type Row = (string | number)[];

const NUM_FMT = "#,##0";      // جداکننده هزارگان — فقط نمایش را گرد می‌کند، مقدار سلول دست‌نخورده می‌ماند
const RATE_FMT = "0.##";      // درصدهای وارد‌شده توسط کاربر (مثلاً annualMoneyCostRate=26 یعنی ۲۶٪)، نه فرمت % اکسل
const DATA_START_ROW = 4;     // عنوان(۰) + تاریخ(۱) + خط خالی(۲) + سرستون(۳) => داده از ردیف ۴ شروع می‌شود

/** یک برگه با عنوان، تاریخ گزارش و راست‌چین بودن استاندارد می‌سازد. */
function makeSheet(title: string, dateStr: string, colCount: number, table: Row[], isSampleData = false): XLSX.WorkSheet {
  // توجه: تعداد ردیف‌های عنوان همیشه باید ثابت (۳ ردیف قبل از سرستون) بماند،
  // چون DATA_START_ROW در formatColumn روی همین فرض بنا شده — پس هشدار داده
  // نمونه به‌جای افزودن یک ردیف تازه، در همان ردیف تاریخ اضافه می‌شود.
  const dateRow: Row = isSampleData ? ["تاریخ گزارش", dateStr, "⚠ این داده نمونه است، نه اطلاعات واقعی"] : ["تاریخ گزارش", dateStr];
  const aoa: Row[] = [[title], dateRow, [], ...table];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: Math.max(0, colCount - 1) } }, ...(ws["!merges"] ?? [])];
  ws["!views"] = [{ rightToLeft: true }];
  return ws;
}

/** روی یک ستون از بخش داده (نه عنوان/سرستون)، فرمت عددی اعمال می‌کند — بدون تغییر مقدار واقعی سلول. */
function formatColumn(ws: XLSX.WorkSheet, colIndex: number, dataRowCount: number, fmt = NUM_FMT) {
  for (let i = 0; i < dataRowCount; i++) {
    const ref = XLSX.utils.encode_cell({ r: DATA_START_ROW + i, c: colIndex });
    const cell = ws[ref];
    if (cell && cell.t === "n") cell.z = fmt;
  }
}

/** میله متنی ساده برای نمایش نسبی داخل یک سلول اکسل — بدون نیاز به چارت واقعی. */
function textBar(value: number, max: number, width = 20): string {
  if (max <= 0) return "";
  const filled = Math.max(0, Math.min(width, Math.round((Math.abs(value) / max) * width)));
  return "█".repeat(filled);
}

export function exportToExcel(data: ExportInput) {
  const { device, expenses, sales, scenarios, snapshot, fixedMonthlyCost, totalVariableCostPerUnit, targetProfit, isSampleData } = data;
  // سود هر رکورد تاریخچه همیشه از روی فرمول واقعی بازمحاسبه می‌شود، نه از
  // فیلد ذخیره‌شده — تا خروجی اکسل هرگز عددی ناسازگار با بقیه ستون‌ها نداشته باشد.
  const history = data.history.map((h) => ({ ...h, profit: calcRecordProfit(h) }));
  const dateStr = new Date().toLocaleDateString("fa-IR");
  const wb = XLSX.utils.book_new();

  const unitsForTarget = calcUnitsForTargetProfit(fixedMonthlyCost, targetProfit, snapshot.contributionPerUnit);
  const priceForTarget = calcRequiredSellingPrice(totalVariableCostPerUnit, fixedMonthlyCost, targetProfit, sales.monthlyUnits);

  /* ───────── برگه ۱ — خلاصه مدیریتی ───────── */
  const summaryTable: Row[] = [
    ["شاخص", "مقدار"],
    ["وضعیت", STATUS_META[snapshot.status].label],
    ["قیمت فروش فعلی (تومان)", sales.sellingPrice],
    ["تعداد فروش ماهانه (دستگاه)", sales.monthlyUnits],
    ["هزینه مستقیم هر دستگاه (تومان)", snapshot.directCost],
    ["هزینه خواب پول هر دستگاه (تومان)", snapshot.holdingCost],
    ["هزینه اقتصادی هر دستگاه (تومان)", snapshot.economicVariableCost],
    ["هزینه متغیر کل هر دستگاه (تومان)", totalVariableCostPerUnit],
    ["هزینه ثابت ماهانه (تومان)", fixedMonthlyCost],
    ["سود باقی‌مانده از هر فروش (تومان)", snapshot.contributionPerUnit],
    ["سود/زیان ماهانه (تومان)", snapshot.monthlyProfit],
    ["نقطه سربه‌سر (دستگاه)", snapshot.breakEvenUnits ?? "دست‌نیافتنی"],
    ["فاصله فروش فعلی از سربه‌سر (دستگاه)", snapshot.gapToBreakEven ?? "—"],
    ["سود هدف ماهانه (تومان)", targetProfit],
    ["تعداد لازم برای سود هدف (دستگاه)", unitsForTarget ?? "دست‌نیافتنی با شرایط فعلی"],
    ["قیمت لازم برای سود هدف با فروش فعلی (تومان)", priceForTarget ?? "—"],
  ];
  const summarySheet = makeSheet("گزارش سود و قیمت فروش — ماشین‌حساب کارتخوان", dateStr, 2, summaryTable, isSampleData);
  summarySheet["!cols"] = [{ wch: 38 }, { wch: 24 }];
  formatColumn(summarySheet, 1, summaryTable.length - 1);
  XLSX.utils.book_append_sheet(wb, summarySheet, "خلاصه مدیریتی");

  /* ───────── برگه ۲ — هزینه‌ها ───────── */
  const costsTable: Row[] = [
    ["عنوان هزینه", "مبلغ", "نوع", "فعال", "توضیح"],
    ...expenses.map((e): Row => [e.title, e.amount, e.type === "fixed" ? "ثابت" : "وابسته به فروش", e.active ? "بله" : "خیر", e.description ?? ""]),
  ];
  const costsSheet = makeSheet("هزینه‌های ماهانه", dateStr, 5, costsTable, isSampleData);
  costsSheet["!cols"] = [{ wch: 22 }, { wch: 16 }, { wch: 16 }, { wch: 10 }, { wch: 24 }];
  formatColumn(costsSheet, 1, costsTable.length - 1);
  XLSX.utils.book_append_sheet(wb, costsSheet, "هزینه‌ها");

  /* ───────── برگه ۳ — اطلاعات دستگاه ───────── */
  const deviceTable: Row[] = [
    ["مورد", "مقدار"],
    ["قیمت خرید (تومان)", device.purchasePrice],
    ["حمل (تومان)", device.shippingCost],
    ["گمرک (تومان)", device.customsCost],
    ["ترخیص (تومان)", device.clearanceCost],
    ["آماده‌سازی (تومان)", device.preparationCost],
    ["سایر هزینه مستقیم (تومان)", device.otherDirectCost],
    ["مدت خواب پول (ماه)", device.holdingPeriodMonths],
    ["نرخ سالانه هزینه پول (٪)", device.annualMoneyCostRate],
    ["هزینه مستقیم هر دستگاه (تومان)", snapshot.directCost],
    ["هزینه خواب پول (تومان)", snapshot.holdingCost],
    ["هزینه اقتصادی هر دستگاه (تومان)", snapshot.economicVariableCost],
  ];
  const deviceSheet = makeSheet("اطلاعات دستگاه", dateStr, 2, deviceTable, isSampleData);
  deviceSheet["!cols"] = [{ wch: 30 }, { wch: 20 }];
  formatColumn(deviceSheet, 1, deviceTable.length - 1);
  // نرخ سالانه یک عدد درصدی خام است (مثلاً ۲۶)، نه کسری که با فرمت % ضرب در ۱۰۰ شود
  const rateRowIndex = deviceTable.findIndex((r) => r[0] === "نرخ سالانه هزینه پول (٪)") - 1;
  if (rateRowIndex >= 0) {
    const ref = XLSX.utils.encode_cell({ r: DATA_START_ROW + rateRowIndex, c: 1 });
    if (deviceSheet[ref]) deviceSheet[ref].z = RATE_FMT;
  }
  XLSX.utils.book_append_sheet(wb, deviceSheet, "اطلاعات دستگاه");

  /* ───────── برگه ۴ — فروش ───────── */
  const salesTable: Row[] = [
    ["مورد", "مقدار"],
    ["قیمت فروش فعلی (تومان)", sales.sellingPrice],
    ["تعداد فروش ماهانه (دستگاه)", sales.monthlyUnits],
    ["حداکثر ظرفیت فروش (دستگاه)", sales.maxCapacity ?? "—"],
    ["سود باقی‌مانده از هر فروش (تومان)", snapshot.contributionPerUnit],
    ["سود ماهانه (تومان)", snapshot.monthlyProfit],
    ["نقطه سربه‌سر (دستگاه)", snapshot.breakEvenUnits ?? "دست‌نیافتنی"],
  ];
  const salesSheet = makeSheet("فروش فعلی", dateStr, 2, salesTable, isSampleData);
  salesSheet["!cols"] = [{ wch: 30 }, { wch: 20 }];
  formatColumn(salesSheet, 1, salesTable.length - 1);
  XLSX.utils.book_append_sheet(wb, salesSheet, "فروش");

  /* ───────── برگه ۵ — محاسبات (مسیر کامل محاسبه) ───────── */
  const calcTable: Row[] = [
    ["مرحله محاسبه", "مقدار (تومان مگر خلاف آن ذکر شود)"],
    ["هزینه مستقیم هر دستگاه", snapshot.directCost],
    ["هزینه خواب پول هر دستگاه", snapshot.holdingCost],
    ["هزینه اقتصادی (متغیر واقعی) هر دستگاه = مستقیم + خواب پول", snapshot.economicVariableCost],
    ["سایر هزینه متغیر هر واحد (مثل کمیسیون فروش)", totalVariableCostPerUnit - snapshot.economicVariableCost],
    ["هزینه متغیر کل هر دستگاه", totalVariableCostPerUnit],
    ["هزینه ثابت ماهانه", fixedMonthlyCost],
    ["قیمت فروش فعلی", sales.sellingPrice],
    ["سود باقی‌مانده از هر فروش = قیمت − هزینه متغیر کل", snapshot.contributionPerUnit],
    ["تعداد فروش ماهانه فعلی (دستگاه)", sales.monthlyUnits],
    ["سود/زیان ماهانه فعلی = تعداد × سود هر فروش − هزینه ثابت", snapshot.monthlyProfit],
    ["نقطه سربه‌سر (دستگاه) = هزینه ثابت ÷ سود هر فروش", snapshot.breakEvenUnits ?? "دست‌نیافتنی"],
    ["سود هدف تعیین‌شده", targetProfit],
    ["تعداد لازم برای سود هدف (دستگاه)", unitsForTarget ?? "دست‌نیافتنی با شرایط فعلی"],
    ["قیمت لازم برای سود هدف با تعداد فروش فعلی", priceForTarget ?? "—"],
  ];
  const calcSheet = makeSheet("محاسبات — مسیر کامل از هزینه تا سود", dateStr, 2, calcTable, isSampleData);
  calcSheet["!cols"] = [{ wch: 48 }, { wch: 20 }];
  formatColumn(calcSheet, 1, calcTable.length - 1);
  XLSX.utils.book_append_sheet(wb, calcSheet, "محاسبات");

  /* ───────── برگه ۶ — سناریوها ───────── */
  const evaluated = evaluateScenarios(scenarios, totalVariableCostPerUnit);
  const scenarioTable: Row[] = [
    ["سناریو", "قیمت", "تعداد فروش", "هزینه ماهانه", "سود ماهانه", "سربه‌سر", "وضعیت"],
    ...evaluated.map((r): Row => [
      r.scenario.name, r.scenario.sellingPrice, r.scenario.monthlyUnits, r.scenario.monthlyFixedCost,
      r.monthlyProfit, r.breakEvenUnits ?? "دست‌نیافتنی", STATUS_META[r.status].label,
    ]),
  ];
  const scenarioSheet = makeSheet("مقایسه سناریوها", dateStr, 7, scenarioTable, isSampleData);
  scenarioSheet["!cols"] = [{ wch: 20 }, { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 16 }, { wch: 14 }, { wch: 12 }];
  [1, 2, 3, 4, 5].forEach((c) => formatColumn(scenarioSheet, c, scenarioTable.length - 1));
  XLSX.utils.book_append_sheet(wb, scenarioSheet, "سناریوها");

  /* ───────── برگه ۷ — تاریخچه ───────── */
  const historyTable: Row[] = [
    ["ماه", "فروش (دستگاه)", "قیمت فروش", "هزینه ثابت", "هزینه متغیر هر واحد", "سود"],
    ...history.map((h): Row => [h.month, h.unitsSold, h.sellingPrice, h.fixedCost, h.variableCostPerUnit, h.profit]),
  ];
  const historySheet = makeSheet("تاریخچه ماهانه", dateStr, 6, historyTable, isSampleData);
  historySheet["!cols"] = [{ wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 18 }, { wch: 14 }];
  [1, 2, 3, 4, 5].forEach((c) => formatColumn(historySheet, c, historyTable.length - 1));
  XLSX.utils.book_append_sheet(wb, historySheet, "تاریخچه");

  /* ───────── برگه ۸ — داده‌های نمودار (۱۰ بلوک، دقیقاً هم‌داده با ۱۰ نمودار داخل برنامه) ───────── */
  const activeExpenses = expenses.filter((e) => e.active);
  const priceDeltas = [-1500000, -1000000, -500000, 0, 500000, 1000000, 1500000];
  const volumeSteps = [100, 250, 500, 1000, 1500, 2000, 2500, 3000];
  const salesGrowth = calcGrowthSeries(history, "unitsSold");
  const profitGrowth = calcGrowthSeries(history, "profit");

  let cursor = 3; // بعد از عنوان(۰)+تاریخ(۱)+خالی(۲)
  const chartAoa: Row[] = [
    ["داده‌های نمودار — منبع تمام نمودارهای برنامه"],
    isSampleData ? ["تاریخ گزارش", dateStr, "⚠ این داده نمونه است، نه اطلاعات واقعی"] : ["تاریخ گزارش", dateStr],
    [],
  ];
  const chartMerges: XLSX.Range[] = [];
  const chartNumberCols: { col: number; rowStart: number; rowCount: number }[] = [];

  function addBlock(title: string, header: Row, rows: Row[], numericCols: number[]) {
    chartAoa.push([title]);
    chartMerges.push({ s: { r: cursor, c: 0 }, e: { r: cursor, c: Math.max(0, header.length - 1) } });
    cursor += 1;
    chartAoa.push(header);
    cursor += 1;
    rows.forEach((r) => chartAoa.push(r));
    numericCols.forEach((c) => chartNumberCols.push({ col: c, rowStart: cursor, rowCount: rows.length }));
    cursor += rows.length;
    chartAoa.push([]);
    cursor += 1;
  }

  addBlock("۱. روند فروش", ["ماه", "فروش (دستگاه)"], history.map((h): Row => [h.month, h.unitsSold]), [1]);
  addBlock("۲. روند سود و زیان", ["ماه", "سود (تومان)"], history.map((h): Row => [h.month, h.profit]), [1]);
  addBlock("۳. فروش در برابر نقطه سربه‌سر", ["مورد", "مقدار (دستگاه)"], [
    ["فروش فعلی", sales.monthlyUnits], ["نقطه سربه‌سر", snapshot.breakEvenUnits ?? "دست‌نیافتنی"],
  ], [1]);
  addBlock(
    "۴. سود واقعی در برابر هدف" + (targetProfit > 0 ? "" : " (سود هدفی تعیین نشده)"),
    ["ماه", "سود واقعی", "خط هدف"],
    targetProfit > 0 ? history.map((h): Row => [h.month, h.profit, targetProfit]) : [],
    [1, 2]
  );
  addBlock(
    "۵. سود بر اساس تعداد فروش (با قیمت فعلی)", ["تعداد فروش", "سود"],
    volumeSteps.map((q): Row => [q, q * snapshot.contributionPerUnit - fixedMonthlyCost]), [1]
  );
  addBlock(
    "۶. سود بر اساس قیمت فروش (با تعداد فروش فعلی)", ["قیمت فروش", "سود"],
    priceDeltas.map((d): Row => {
      const price = sales.sellingPrice + d;
      return [price, sales.monthlyUnits * (price - totalVariableCostPerUnit) - fixedMonthlyCost];
    }), [0, 1]
  );
  addBlock("۷. ترکیب هزینه‌های ماهانه", ["عنوان هزینه", "مبلغ"], activeExpenses.map((e): Row => [e.title, e.amount]), [1]);
  addBlock("۸. رشد فروش نسبت به ماه قبل", ["ماه", "رشد (٪)"], salesGrowth.map((g): Row => [g.month, Math.round(g.growth * 100) / 100]), [1]);
  addBlock("۹. رشد سود نسبت به ماه قبل", ["ماه", "رشد (٪)"], profitGrowth.map((g): Row => [g.month, Math.round(g.growth * 100) / 100]), [1]);
  addBlock("۱۰. مقایسه سناریوها", ["سناریو", "سود ماهانه"], evaluated.map((r): Row => [r.scenario.name, r.monthlyProfit]), [1]);

  const chartDataSheet = XLSX.utils.aoa_to_sheet(chartAoa);
  chartDataSheet["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }, ...chartMerges];
  chartDataSheet["!views"] = [{ rightToLeft: true }];
  chartDataSheet["!cols"] = [{ wch: 26 }, { wch: 18 }, { wch: 16 }];
  chartNumberCols.forEach(({ col, rowStart, rowCount }) => {
    for (let i = 0; i < rowCount; i++) {
      const ref = XLSX.utils.encode_cell({ r: rowStart + i, c: col });
      const cell = chartDataSheet[ref];
      if (cell && cell.t === "n") cell.z = NUM_FMT;
    }
  });
  XLSX.utils.book_append_sheet(wb, chartDataSheet, "داده‌های نمودار");

  /* ───────── برگه ۹ — گزارش نموداری (تحلیل + میله متنی، چون نسخه رایگان کتابخانه چارت واقعی اکسل نمی‌سازد) ───────── */
  const reportRows: Row[] = [];
  function insight(title: string, text: string) {
    reportRows.push([title]);
    reportRows.push(["", text]);
    reportRows.push([]);
  }
  const lastSale = history[history.length - 1], prevSale = history[history.length - 2];
  insight("۱. روند فروش", lastSale && prevSale
    ? `فروش ماه اخیر (${lastSale.month}) نسبت به ماه قبل ${lastSale.unitsSold >= prevSale.unitsSold ? "افزایش" : "کاهش"} داشته است: از ${prevSale.unitsSold.toLocaleString("fa-IR")} به ${lastSale.unitsSold.toLocaleString("fa-IR")} دستگاه.`
    : "داده کافی برای تحلیل روند وجود ندارد.");

  const lastProfit = history[history.length - 1], prevProfit = history[history.length - 2];
  insight("۲. روند سود و زیان", lastProfit && prevProfit
    ? `سود ماه اخیر (${lastProfit.month}) ${lastProfit.profit.toLocaleString("fa-IR")} تومان بوده، نسبت به ${prevProfit.profit.toLocaleString("fa-IR")} تومان ماه قبل.`
    : "داده کافی برای تحلیل روند وجود ندارد.");

  insight("۳. فروش در برابر نقطه سربه‌سر", snapshot.breakEvenUnits === null
    ? "با شرایط فعلی، رسیدن به سربه‌سر ممکن نیست."
    : snapshot.gapToBreakEven !== null && snapshot.gapToBreakEven >= 0
    ? `فروش فعلی ${snapshot.gapToBreakEven.toLocaleString("fa-IR")} دستگاه بالاتر از نقطه سربه‌سر است.`
    : `با فروش فعلی هنوز ${Math.abs(snapshot.gapToBreakEven ?? 0).toLocaleString("fa-IR")} دستگاه با نقطه سربه‌سر فاصله است.`);

  insight("۴. سود واقعی در برابر هدف", targetProfit <= 0
    ? "سود هدفی تعیین نشده است."
    : lastProfit
    ? (targetProfit - lastProfit.profit <= 0
        ? `سود ماه اخیر از هدف ${(lastProfit.profit - targetProfit).toLocaleString("fa-IR")} تومان بیشتر بوده است.`
        : `سود ماه اخیر ${(targetProfit - lastProfit.profit).toLocaleString("fa-IR")} تومان تا هدف فاصله دارد.`)
    : "داده تاریخچه‌ای برای مقایسه وجود ندارد.");

  insight("۵. سود بر اساس تعداد فروش", snapshot.contributionPerUnit > 0
    ? `هر دستگاه اضافه‌ای که فروخته شود، ${snapshot.contributionPerUnit.toLocaleString("fa-IR")} تومان به سود ماهانه اضافه می‌کند.`
    : "با قیمت فعلی، فروش بیشتر فقط زیان را بزرگ‌تر می‌کند.");

  insight("۶. سود بر اساس قیمت فروش", sales.monthlyUnits > 0
    ? `هر ۱۰۰ هزار تومان افزایش قیمت، با فروش فعلی حدود ${(sales.monthlyUnits * 100000).toLocaleString("fa-IR")} تومان به سود ماهانه اضافه می‌کند.`
    : "برای این تحلیل، تعداد فروش ماهانه باید بیشتر از صفر باشد.");

  const totalExpense = activeExpenses.reduce((s, e) => s + e.amount, 0);
  const topExpense = activeExpenses.slice().sort((a, b) => b.amount - a.amount)[0];
  reportRows.push(["۷. ترکیب هزینه‌های ماهانه"]);
  if (topExpense && totalExpense > 0) {
    reportRows.push(["", `بیشترین سهم هزینه‌ها مربوط به «${topExpense.title}» است (${((topExpense.amount / totalExpense) * 100).toFixed(1)}٪ از کل).`]);
    reportRows.push([]);
    reportRows.push(["عنوان هزینه", "سهم", "نمودار میله‌ای"]);
    activeExpenses.slice().sort((a, b) => b.amount - a.amount).forEach((e) => {
      reportRows.push([e.title, `${((e.amount / totalExpense) * 100).toFixed(1)}٪`, textBar(e.amount, activeExpenses[0] ? Math.max(...activeExpenses.map((x) => x.amount)) : 1)]);
    });
  } else {
    reportRows.push(["", "هزینه فعالی برای تحلیل ثبت نشده است."]);
  }
  reportRows.push([]);

  const lastSalesGrowth = salesGrowth[salesGrowth.length - 1];
  insight("۸. رشد فروش", lastSalesGrowth
    ? `رشد فروش ماه اخیر نسبت به ماه قبل ${Math.abs(lastSalesGrowth.growth).toFixed(1)}٪ ${lastSalesGrowth.growth >= 0 ? "مثبت" : "منفی"} بوده است.`
    : "داده کافی برای محاسبه رشد وجود ندارد.");

  const lastProfitGrowth = profitGrowth[profitGrowth.length - 1];
  insight("۹. رشد سود", lastProfitGrowth
    ? `رشد سود ماه اخیر نسبت به ماه قبل ${Math.abs(lastProfitGrowth.growth).toFixed(1)}٪ ${lastProfitGrowth.growth >= 0 ? "مثبت" : "منفی"} بوده است.`
    : "داده کافی برای محاسبه رشد وجود ندارد.");

  reportRows.push(["۱۰. مقایسه سناریوها"]);
  if (evaluated.length >= 2) {
    const best = evaluated.slice().sort((a, b) => b.monthlyProfit - a.monthlyProfit)[0];
    reportRows.push(["", `بهترین سناریو از نظر سود، «${best.scenario.name}» با سود ${best.monthlyProfit.toLocaleString("fa-IR")} تومان است.`]);
    reportRows.push([]);
    const maxAbs = Math.max(...evaluated.map((r) => Math.abs(r.monthlyProfit)), 1);
    reportRows.push(["سناریو", "سود ماهانه", "نمودار میله‌ای"]);
    evaluated.forEach((r) => reportRows.push([r.scenario.name, r.monthlyProfit, (r.monthlyProfit >= 0 ? "" : "-") + textBar(r.monthlyProfit, maxAbs)]));
  } else {
    reportRows.push(["", "برای مقایسه، حداقل ۲ سناریو لازم است."]);
  }
  reportRows.push([]);
  reportRows.push(["راهنما", "برای رسم نمودار تصویری در اکسل: به برگه «داده‌های نمودار» بروید، بلوک موردنظر را انتخاب کنید و از منوی Insert → Chart استفاده کنید."]);

  const reportSheet = makeSheet("گزارش نموداری — تحلیل ۱۰ نمودار اصلی برنامه", dateStr, 3, reportRows, isSampleData);
  reportSheet["!cols"] = [{ wch: 26 }, { wch: 46 }, { wch: 24 }];
  XLSX.utils.book_append_sheet(wb, reportSheet, "گزارش نموداری");

  const fileDateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `گزارش-سود-و-قیمت-کارتخوان-${fileDateStr}.xlsx`);
}
