import React, { createContext, useContext, useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";
import type { DeviceCost, MonthlyExpense, SalesData, Scenario, MonthlyRecord, FinancialSnapshot } from "../types";
import { sampleDevice, sampleExpenses, sampleScenarios, sampleHistory, emptyDevice } from "../data/sampleData";
import {
  calcDirectCost, calcHoldingCost, calcEconomicVariableCost,
  calcFixedMonthlyCost, calcExtraVariableCostPerUnit, calcTotalVariableCostPerUnit,
} from "../calculations/cost";
import { calcContributionPerUnit, calcMonthlyProfit } from "../calculations/profit";
import { calcBreakEvenUnits, calcGapToBreakEven, calcBusinessStatus } from "../calculations/breakeven";

const DEFAULT_SALES: SalesData = { sellingPrice: 11500000, monthlyUnits: 1500, maxCapacity: 3000 };

/**
 * The ONE place financial state is created. Everything else (every page,
 * every component) reads this through the FinancialModelProvider below —
 * never by calling a state-creating hook a second time. That was a real
 * bug in the previous revision: useFinancialModel() used to be called
 * independently in App.tsx (for dark mode) and again in all eight pages,
 * meaning there were 9 separate, unsynced in-memory copies of "the"
 * financial state that merely happened to read/write the same
 * localStorage keys. See audit report for details.
 */
function useFinancialModelState() {
  const [device, setDevice] = useLocalStorage<DeviceCost>("pos.device", sampleDevice);
  const [expenses, setExpenses] = useLocalStorage<MonthlyExpense[]>("pos.expenses", sampleExpenses);
  const [costMode, setCostMode] = useLocalStorage<"simple" | "advanced">("pos.costMode", "advanced");
  const [simpleMonthlyCost, setSimpleMonthlyCost] = useLocalStorage<number>("pos.simpleMonthlyCost", 105000000);
  const [sales, setSales] = useLocalStorage<SalesData>("pos.sales", DEFAULT_SALES);
  const [targetProfit, setTargetProfit] = useLocalStorage<number>("pos.targetProfit", 300000000);
  const [scenarios, setScenarios] = useLocalStorage<Scenario[]>("pos.scenarios", sampleScenarios);
  const [history, setHistory] = useLocalStorage<MonthlyRecord[]>("pos.history", sampleHistory);
  const [isSampleData, setIsSampleData] = useLocalStorage<boolean>("pos.isSampleData", true);
  const [darkMode, setDarkMode] = useLocalStorage<boolean>("pos.darkMode", false);

  const directCost = useMemo(() => calcDirectCost(device), [device]);
  const holdingCost = useMemo(() => calcHoldingCost(directCost, device), [directCost, device]);
  const economicVariableCost = useMemo(() => calcEconomicVariableCost(directCost, holdingCost), [directCost, holdingCost]);

  const fixedMonthlyCost = useMemo(
    () => calcFixedMonthlyCost(expenses, costMode, simpleMonthlyCost),
    [expenses, costMode, simpleMonthlyCost]
  );
  const extraVariableCostPerUnit = useMemo(
    () => calcExtraVariableCostPerUnit(expenses, costMode),
    [expenses, costMode]
  );
  const totalVariableCostPerUnit = useMemo(
    () => calcTotalVariableCostPerUnit(economicVariableCost, extraVariableCostPerUnit),
    [economicVariableCost, extraVariableCostPerUnit]
  );

  const contributionPerUnit = useMemo(
    () => calcContributionPerUnit(sales.sellingPrice, totalVariableCostPerUnit),
    [sales.sellingPrice, totalVariableCostPerUnit]
  );
  const monthlyProfit = useMemo(
    () => calcMonthlyProfit(sales.monthlyUnits, contributionPerUnit, fixedMonthlyCost),
    [sales.monthlyUnits, contributionPerUnit, fixedMonthlyCost]
  );
  const breakEvenUnits = useMemo(
    () => calcBreakEvenUnits(fixedMonthlyCost, contributionPerUnit),
    [fixedMonthlyCost, contributionPerUnit]
  );
  const gapToBreakEven = useMemo(
    () => calcGapToBreakEven(sales.monthlyUnits, breakEvenUnits),
    [sales.monthlyUnits, breakEvenUnits]
  );
  const status = useMemo(() => calcBusinessStatus(monthlyProfit), [monthlyProfit]);

  const snapshot: FinancialSnapshot = {
    directCost, holdingCost, economicVariableCost, contributionPerUnit,
    monthlyProfit, breakEvenUnits, status, gapToBreakEven,
  };

  function resetToSampleData() {
    setDevice(sampleDevice); setExpenses(sampleExpenses); setSales(DEFAULT_SALES);
    setScenarios(sampleScenarios); setHistory(sampleHistory); setIsSampleData(true);
  }
  function clearSampleData() {
    setDevice(emptyDevice); setExpenses([]); setSales({ sellingPrice: 0, monthlyUnits: 0, maxCapacity: 0 });
    setScenarios([]); setHistory([]); setIsSampleData(false);
  }

  return {
    device, setDevice, expenses, setExpenses, costMode, setCostMode,
    simpleMonthlyCost, setSimpleMonthlyCost, sales, setSales,
    targetProfit, setTargetProfit, scenarios, setScenarios, history, setHistory,
    isSampleData, darkMode, setDarkMode,
    extraVariableCostPerUnit, totalVariableCostPerUnit, fixedMonthlyCost, snapshot,
    resetToSampleData, clearSampleData,
  };
}

type FinancialModel = ReturnType<typeof useFinancialModelState>;
const FinancialModelContext = createContext<FinancialModel | null>(null);

export function FinancialModelProvider({ children }: { children: React.ReactNode }) {
  const model = useFinancialModelState();
  return <FinancialModelContext.Provider value={model}>{children}</FinancialModelContext.Provider>;
}

export function useFinancialModel(): FinancialModel {
  const ctx = useContext(FinancialModelContext);
  if (!ctx) {
    throw new Error("useFinancialModel must be used inside <FinancialModelProvider>. Wrap the app (see App.tsx).");
  }
  return ctx;
}

export type { FinancialModel };

