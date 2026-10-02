import type { DeviceCost, MonthlyExpense } from "../types";

/**
 * Direct Cost = Purchase Price + Shipping + Customs + Clearance + Preparation + Other direct costs
 * No rounding here — rounding only happens at display time.
 */
export function calcDirectCost(device: DeviceCost): number {
  return (
    device.purchasePrice +
    device.shippingCost +
    device.customsCost +
    device.clearanceCost +
    device.preparationCost +
    device.otherDirectCost
  );
}

/**
 * Holding Cost = Capital Tied Up (Direct Cost) × Annual Money Cost Rate × Holding Period(months) / 12
 * annualMoneyCostRate is a percentage (e.g. 26 means 26%).
 */
export function calcHoldingCost(directCost: number, device: DeviceCost): number {
  return directCost * (device.annualMoneyCostRate / 100) * (device.holdingPeriodMonths / 12);
}

/**
 * Economic Variable Cost = Direct Cost + Holding Cost
 */
export function calcEconomicVariableCost(directCost: number, holdingCost: number): number {
  return directCost + holdingCost;
}

/**
 * Total fixed monthly cost from the active "fixed" expense rows,
 * or the single simple-mode number when costMode is "simple".
 */
export function calcFixedMonthlyCost(
  expenses: MonthlyExpense[],
  costMode: "simple" | "advanced",
  simpleMonthlyCost: number
): number {
  if (costMode === "simple") return simpleMonthlyCost;
  return expenses
    .filter((e) => e.active && e.type === "fixed")
    .reduce((sum, e) => sum + e.amount, 0);
}

/**
 * Extra per-unit variable cost coming from the advanced expense table
 * (rows marked "variable" store a per-unit amount, e.g. shipping, packaging, commission).
 */
export function calcExtraVariableCostPerUnit(
  expenses: MonthlyExpense[],
  costMode: "simple" | "advanced"
): number {
  if (costMode === "simple") return 0;
  return expenses
    .filter((e) => e.active && e.type === "variable")
    .reduce((sum, e) => sum + e.amount, 0);
}

/**
 * The full economic variable cost per unit used in profit calculations:
 * device economic cost + any extra per-unit costs from the expense table.
 */
export function calcTotalVariableCostPerUnit(
  economicVariableCost: number,
  extraVariableCostPerUnit: number
): number {
  return economicVariableCost + extraVariableCostPerUnit;
}
