import type { Scenario, BusinessStatus } from "../types";
import { calcContributionPerUnit, calcMonthlyProfit } from "./profit";
import { calcBreakEvenUnits, calcBusinessStatus, calcGapToBreakEven } from "./breakeven";

export type ScenarioResult = {
  scenario: Scenario;
  contributionPerUnit: number;
  monthlyProfit: number;
  breakEvenUnits: number | null;
  gapToBreakEven: number | null;
  status: BusinessStatus;
};

/**
 * Evaluates a scenario against the current per-unit variable cost
 * (the device + extra variable costs don't change between scenarios —
 * only price, volume and fixed cost do, matching the product spec).
 */
export function evaluateScenario(scenario: Scenario, totalVariableCostPerUnit: number): ScenarioResult {
  const contributionPerUnit = calcContributionPerUnit(scenario.sellingPrice, totalVariableCostPerUnit);
  const monthlyProfit = calcMonthlyProfit(scenario.monthlyUnits, contributionPerUnit, scenario.monthlyFixedCost);
  const breakEvenUnits = calcBreakEvenUnits(scenario.monthlyFixedCost, contributionPerUnit);
  const gapToBreakEven = calcGapToBreakEven(scenario.monthlyUnits, breakEvenUnits);
  const status = calcBusinessStatus(monthlyProfit);
  return { scenario, contributionPerUnit, monthlyProfit, breakEvenUnits, gapToBreakEven, status };
}

export function evaluateScenarios(scenarios: Scenario[], totalVariableCostPerUnit: number): ScenarioResult[] {
  return scenarios.map((s) => evaluateScenario(s, totalVariableCostPerUnit));
}

