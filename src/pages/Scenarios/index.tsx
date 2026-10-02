import React, { useState } from "react";
import { useFinancialModel } from "../../hooks/FinancialModelContext";
import { SectionTitle } from "../../components/ui/primitives";
import { ScenarioTable } from "../../components/scenarios/ScenarioTable";
import { ScenarioComparisonChart } from "../../components/charts/Charts";
import { evaluateScenarios } from "../../calculations/scenarios";
import { ExportButtons } from "../../components/reports/ReportControls";
import { exportToExcel } from "../../exports/excelExport";

export default function Scenarios() {
  const m = useFinancialModel();
  const [selectedIds, setSelectedIds] = useState<string[]>(m.scenarios.slice(0, 4).map((s) => s.id));

  function toggleSelect(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 5 ? [...prev, id] : prev));
  }

  const selectedScenarios = m.scenarios.filter((s) => selectedIds.includes(s.id));
  const evaluated = evaluateScenarios(selectedScenarios, m.totalVariableCostPerUnit);
  const chartData = evaluated.map((r) => ({ name: r.scenario.name, profit: r.monthlyProfit }));

  return (
    <div className="space-y-5 print-landscape">
      <SectionTitle desc="چند سناریوی قیمت، تعداد فروش و هزینه بسازید و کنار هم مقایسه کنید.">مقایسه سناریوها</SectionTitle>

      <ScenarioTable
        scenarios={m.scenarios}
        setScenarios={m.setScenarios}
        totalVariableCostPerUnit={m.totalVariableCostPerUnit}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelect}
      />

      <ScenarioComparisonChart data={chartData} />

      <ExportButtons onExportExcel={() => exportToExcel({ device: m.device, expenses: m.expenses, sales: m.sales, scenarios: m.scenarios, history: m.history, snapshot: m.snapshot, fixedMonthlyCost: m.fixedMonthlyCost, totalVariableCostPerUnit: m.totalVariableCostPerUnit, targetProfit: m.targetProfit, isSampleData: m.isSampleData })} />
    </div>
  );
}
