import type { BusinessStatus } from "../types";

/**
 * Break Even Units = Fixed Monthly Cost / Contribution Per Unit
 * Returns null when contribution <= 0 — break-even is not achievable at this price.
 * Result is always rounded UP to the next whole device when it exists.
 */
export function calcBreakEvenUnits(fixedMonthlyCost: number, contributionPerUnit: number): number | null {
  if (contributionPerUnit <= 0) return null;
  if (fixedMonthlyCost <= 0) return 0;
  return Math.ceil(fixedMonthlyCost / contributionPerUnit);
}

/**
 * Required Units = (Fixed Monthly Cost + Target Profit) / Contribution Per Unit
 * Rounded UP. Returns null when contribution <= 0 (target is unreachable at this price).
 */
export function calcUnitsForTargetProfit(
  fixedMonthlyCost: number,
  targetProfit: number,
  contributionPerUnit: number
): number | null {
  if (contributionPerUnit <= 0) return null;
  return Math.ceil((fixedMonthlyCost + targetProfit) / contributionPerUnit);
}

/**
 * Required Selling Price = Economic Variable Cost + (Fixed Monthly Cost + Target Profit) / Target Units
 * Returns null when targetUnits <= 0 (division by zero).
 */
export function calcRequiredSellingPrice(
  totalVariableCostPerUnit: number,
  fixedMonthlyCost: number,
  targetProfit: number,
  targetUnits: number
): number | null {
  if (!targetUnits || targetUnits <= 0) return null;
  return totalVariableCostPerUnit + (fixedMonthlyCost + targetProfit) / targetUnits;
}

/**
 * Gap between current sales volume and the break-even point.
 * Positive = above break-even, negative = below. Null when break-even is not achievable.
 */
export function calcGapToBreakEven(unitsSold: number, breakEvenUnits: number | null): number | null {
  if (breakEvenUnits === null) return null;
  return unitsSold - breakEvenUnits;
}

/**
 * Status engine:
 *   monthlyProfit < 0  -> loss
 *   monthlyProfit = 0  -> breakeven
 *   monthlyProfit > 0  -> profit
 */
export function calcBusinessStatus(monthlyProfit: number): BusinessStatus {
  if (monthlyProfit < 0) return "loss";
  if (monthlyProfit === 0) return "breakeven";
  return "profit";
}

/**
 * How far above break-even counts as a "safe" margin before we warn the
 * user their profit cushion is thin. Centralized here (instead of inline
 * in a page component) so every screen that shows this warning agrees on
 * the same threshold.
 */
export const SAFE_MARGIN_ABOVE_BREAK_EVEN_RATIO = 0.08; // 8% above break-even

export function isNearBreakEven(unitsSold: number, breakEvenUnits: number | null): boolean {
  if (breakEvenUnits === null) return false;
  return unitsSold > breakEvenUnits && unitsSold <= breakEvenUnits * (1 + SAFE_MARGIN_ABOVE_BREAK_EVEN_RATIO);
}
