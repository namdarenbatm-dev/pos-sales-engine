import type { DeviceCost, MonthlyExpense, Scenario, MonthlyRecord } from "../types";

export const sampleDevice: DeviceCost = {
  purchasePrice: 8500000,
  shippingCost: 150000,
  customsCost: 400000,
  clearanceCost: 100000,
  preparationCost: 120000,
  otherDirectCost: 80000,
  holdingPeriodMonths: 1.5,
  annualMoneyCostRate: 28,
};

export const sampleExpenses: MonthlyExpense[] = [
  { id: "c1", title: "اجاره", amount: 35000000, type: "fixed", active: true, isSample: true },
  { id: "c2", title: "حقوق", amount: 55000000, type: "fixed", active: true, isSample: true },
  { id: "c3", title: "آب و برق و گاز", amount: 3000000, type: "fixed", active: true, isSample: true },
  { id: "c4", title: "اینترنت و تلفن", amount: 2000000, type: "fixed", active: true, isSample: true },
  { id: "c5", title: "تبلیغات", amount: 8000000, type: "fixed", active: true, isSample: true },
  { id: "c6", title: "هزینه اداری", amount: 2000000, type: "fixed", active: true, isSample: true },
  { id: "c7", title: "پورسانت فروش", amount: 250000, type: "variable", active: true, description: "به ازای هر دستگاه", isSample: true },
];

export const sampleScenarios: Scenario[] = [
  { id: "s1", name: "سناریوی فعلی", sellingPrice: 11500000, monthlyUnits: 1500, monthlyFixedCost: 105000000, isSample: true },
  { id: "s2", name: "افزایش قیمت", sellingPrice: 12000000, monthlyUnits: 1300, monthlyFixedCost: 105000000, isSample: true },
  { id: "s3", name: "افزایش فروش", sellingPrice: 11500000, monthlyUnits: 2000, monthlyFixedCost: 120000000, isSample: true },
  { id: "s4", name: "کاهش هزینه", sellingPrice: 11500000, monthlyUnits: 1500, monthlyFixedCost: 80000000, isSample: true },
];

export const sampleHistory: MonthlyRecord[] = [
  { id: "h1", month: "فروردین", sellingPrice: 11200000, unitsSold: 980, fixedCost: 92000000, variableCostPerUnit: 9000000, profit: 2064000000, isSample: true },
  { id: "h2", month: "اردیبهشت", sellingPrice: 11200000, unitsSold: 1120, fixedCost: 95000000, variableCostPerUnit: 9000000, profit: 2369000000, isSample: true },
  { id: "h3", month: "خرداد", sellingPrice: 11300000, unitsSold: 1240, fixedCost: 98000000, variableCostPerUnit: 9000000, profit: 2754000000, isSample: true },
  { id: "h4", month: "تیر", sellingPrice: 11500000, unitsSold: 1310, fixedCost: 100000000, variableCostPerUnit: 9000000, profit: 3175000000, isSample: true },
  { id: "h5", month: "مرداد", sellingPrice: 11500000, unitsSold: 1400, fixedCost: 103000000, variableCostPerUnit: 9000000, profit: 3397000000, isSample: true },
  { id: "h6", month: "شهریور", sellingPrice: 11500000, unitsSold: 1500, fixedCost: 105000000, variableCostPerUnit: 9000000, profit: 3645000000, isSample: true },
];

export const emptyDevice: DeviceCost = {
  purchasePrice: 0, shippingCost: 0, customsCost: 0, clearanceCost: 0,
  preparationCost: 0, otherDirectCost: 0, holdingPeriodMonths: 0, annualMoneyCostRate: 0,
};
