/**
 * Contribution Per Unit = Selling Price - Economic Variable Cost (total, incl. extra per-unit costs)
 * A negative value means every unit sold creates a loss.
 */
export function calcContributionPerUnit(sellingPrice: number, totalVariableCostPerUnit: number): number {
  return sellingPrice - totalVariableCostPerUnit;
}

/**
 * Monthly Profit = Units Sold × Contribution Per Unit - Fixed Monthly Cost
 */
export function calcMonthlyProfit(
  unitsSold: number,
  contributionPerUnit: number,
  fixedMonthlyCost: number
): number {
  return unitsSold * contributionPerUnit - fixedMonthlyCost;
}

/**
 * Recomputes profit for a historical monthly record directly from its own stored
 * inputs (price, units sold, per-unit variable cost, fixed cost) using the exact
 * same two formulas above. Charts and reports must always call this instead of
 * trusting a separately-stored `profit` field, so a chart can never display a
 * number that doesn't reconcile with the record's own numbers.
 */
export function calcRecordProfit(record: {
  sellingPrice: number;
  unitsSold: number;
  variableCostPerUnit: number;
  fixedCost: number;
}): number {
  const contribution = calcContributionPerUnit(record.sellingPrice, record.variableCostPerUnit);
  return calcMonthlyProfit(record.unitsSold, contribution, record.fixedCost);
}
