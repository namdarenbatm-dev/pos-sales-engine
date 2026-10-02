import assert from "node:assert/strict";
import { test, run } from "./runner";
import { calcDirectCost, calcHoldingCost, calcEconomicVariableCost, calcFixedMonthlyCost, calcExtraVariableCostPerUnit, calcTotalVariableCostPerUnit } from "../src/calculations/cost";
import { calcContributionPerUnit, calcMonthlyProfit } from "../src/calculations/profit";
import { calcBreakEvenUnits, calcUnitsForTargetProfit, calcRequiredSellingPrice, calcGapToBreakEven, calcBusinessStatus, isNearBreakEven } from "../src/calculations/breakeven";
import { evaluateScenario } from "../src/calculations/scenarios";
import type { DeviceCost, MonthlyExpense } from "../src/types";

const device: DeviceCost = {
  purchasePrice: 8500000, shippingCost: 150000, customsCost: 400000, clearanceCost: 100000,
  preparationCost: 120000, otherDirectCost: 80000, holdingPeriodMonths: 1, annualMoneyCostRate: 26,
};

test("Direct Cost sums all direct components", () => {
  const dc = calcDirectCost(device);
  assert.equal(dc, 8500000 + 150000 + 400000 + 100000 + 120000 + 80000);
});

test("Holding Cost matches the spec's worked example (10,000,000 × 26% × 1/12)", () => {
  const hc = calcHoldingCost(10000000, { ...device, annualMoneyCostRate: 26, holdingPeriodMonths: 1 });
  assert.ok(Math.abs(hc - 216666.666666) < 0.01, `expected ~216666.67, got ${hc}`);
});

test("Economic Variable Cost = Direct Cost + Holding Cost", () => {
  const dc = calcDirectCost(device);
  const hc = calcHoldingCost(dc, device);
  const evc = calcEconomicVariableCost(dc, hc);
  assert.equal(evc, dc + hc);
});

test("Fixed monthly cost sums only active fixed rows in advanced mode", () => {
  const expenses: MonthlyExpense[] = [
    { id: "1", title: "اجاره", amount: 1000, type: "fixed", active: true },
    { id: "2", title: "غیرفعال", amount: 5000, type: "fixed", active: false },
    { id: "3", title: "پورسانت", amount: 200, type: "variable", active: true },
  ];
  assert.equal(calcFixedMonthlyCost(expenses, "advanced", 0), 1000);
  assert.equal(calcExtraVariableCostPerUnit(expenses, "advanced"), 200);
});

test("Simple mode uses the single simple monthly cost value", () => {
  assert.equal(calcFixedMonthlyCost([], "simple", 55000000), 55000000);
  assert.equal(calcExtraVariableCostPerUnit([], "simple"), 0);
});

test("Total variable cost per unit combines economic cost + extra variable costs", () => {
  assert.equal(calcTotalVariableCostPerUnit(1000, 200), 1200);
});

test("Contribution per unit = price - variable cost", () => {
  assert.equal(calcContributionPerUnit(11500000, 9000000), 2500000);
});

test("Negative contribution: price below cost", () => {
  const c = calcContributionPerUnit(5000000, 9000000);
  assert.ok(c < 0);
});

test("Monthly profit formula", () => {
  const mp = calcMonthlyProfit(1500, 280000, 105000000);
  assert.equal(mp, 1500 * 280000 - 105000000);
});

test("Zero sales -> monthly profit is exactly -fixedCost", () => {
  const mp = calcMonthlyProfit(0, 280000, 105000000);
  assert.equal(mp, -105000000);
});

test("Break-even rounds up to the next whole device", () => {
  const be = calcBreakEvenUnits(105000000, 280000);
  assert.equal(be, Math.ceil(105000000 / 280000));
});

test("Break-even is null when contribution <= 0 (not achievable)", () => {
  assert.equal(calcBreakEvenUnits(105000000, 0), null);
  assert.equal(calcBreakEvenUnits(105000000, -1000), null);
});

test("Zero fixed cost -> break-even is 0 units", () => {
  assert.equal(calcBreakEvenUnits(0, 280000), 0);
});

test("Units required for target profit, rounded up", () => {
  const u = calcUnitsForTargetProfit(105000000, 200000000, 280000);
  assert.equal(u, Math.ceil((105000000 + 200000000) / 280000));
});

test("Units for target profit is null when contribution <= 0", () => {
  assert.equal(calcUnitsForTargetProfit(105000000, 200000000, 0), null);
});

test("Required selling price formula", () => {
  const p = calcRequiredSellingPrice(9000000, 105000000, 200000000, 1500);
  assert.equal(p, 9000000 + (105000000 + 200000000) / 1500);
});

test("Required selling price is null when target units is zero", () => {
  assert.equal(calcRequiredSellingPrice(9000000, 105000000, 200000000, 0), null);
});

test("Gap to break-even: positive when above, negative when below", () => {
  assert.equal(calcGapToBreakEven(1500, 1265), 235);
  assert.equal(calcGapToBreakEven(1000, 1265), -265);
  assert.equal(calcGapToBreakEven(1500, null), null);
});

test("Status engine: loss / breakeven / profit", () => {
  assert.equal(calcBusinessStatus(-1), "loss");
  assert.equal(calcBusinessStatus(0), "breakeven");
  assert.equal(calcBusinessStatus(1), "profit");
});

test("High volume scenario stays internally consistent", () => {
  const contribution = calcContributionPerUnit(12000000, 9000000);
  const mp = calcMonthlyProfit(50000, contribution, 105000000);
  assert.equal(mp, 50000 * contribution - 105000000);
  assert.ok(mp > 0);
});

test("Low price scenario (below variable cost) produces a loss", () => {
  const contribution = calcContributionPerUnit(8000000, 9000000);
  const mp = calcMonthlyProfit(1500, contribution, 105000000);
  assert.ok(mp < 0);
  assert.equal(calcBusinessStatus(mp), "loss");
});

test("High price scenario increases contribution and profit", () => {
  const lowContribution = calcContributionPerUnit(11000000, 9000000);
  const highContribution = calcContributionPerUnit(13000000, 9000000);
  assert.ok(highContribution > lowContribution);
});

test("Scenario evaluation wires all formulas together correctly", () => {
  const result = evaluateScenario(
    { id: "s1", name: "تست", sellingPrice: 11500000, monthlyUnits: 1500, monthlyFixedCost: 105000000 },
    9000000
  );
  assert.equal(result.contributionPerUnit, 2500000);
  assert.equal(result.monthlyProfit, 1500 * 2500000 - 105000000);
  assert.equal(result.status, "profit");
  assert.ok(result.breakEvenUnits !== null && result.breakEvenUnits > 0);
});

test("isNearBreakEven flags sales just above break-even as a thin margin", () => {
  assert.equal(isNearBreakEven(1300, 1265), true); // ~2.8% above
  assert.equal(isNearBreakEven(2000, 1265), false); // comfortably above
  assert.equal(isNearBreakEven(1200, 1265), false); // below break-even, not "near" from above
  assert.equal(isNearBreakEven(1300, null), false);
});

run();
