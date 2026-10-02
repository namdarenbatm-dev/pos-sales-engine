/**
 * Core data model for the POS profit/pricing calculator.
 * These types are the single source of truth for all financial data.
 * UI components must never redefine or duplicate these shapes.
 */

export type DeviceCost = {
  purchasePrice: number;
  shippingCost: number;
  customsCost: number;
  clearanceCost: number;
  preparationCost: number;
  otherDirectCost: number;
  holdingPeriodMonths: number;
  annualMoneyCostRate: number; // percent, e.g. 26 for 26%
};

export type ExpenseType = "fixed" | "variable";

export type MonthlyExpense = {
  id: string;
  title: string;
  amount: number; // for "fixed": total per month. for "variable": per unit sold.
  type: ExpenseType;
  description?: string;
  active: boolean;
  isSample?: boolean;
};

export type SalesData = {
  sellingPrice: number;
  monthlyUnits: number;
  maxCapacity?: number;
};

export type Scenario = {
  id: string;
  name: string;
  sellingPrice: number;
  monthlyUnits: number;
  monthlyFixedCost: number;
  isSample?: boolean;
};

export type MonthlyRecord = {
  id: string;
  month: string;
  sellingPrice: number;
  unitsSold: number;
  fixedCost: number;
  variableCostPerUnit: number;
  profit: number; // derived, stored for historical snapshots
  isSample?: boolean;
};

export type BusinessStatus = "loss" | "breakeven" | "profit";

export type FinancialSnapshot = {
  directCost: number;
  holdingCost: number;
  economicVariableCost: number;
  contributionPerUnit: number;
  monthlyProfit: number;
  breakEvenUnits: number | null; // null = not achievable (contribution <= 0)
  status: BusinessStatus;
  gapToBreakEven: number | null;
};
