import React from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { FinancialModelProvider, useFinancialModel } from "./hooks/FinancialModelContext";
import Dashboard from "./pages/Dashboard";
import RecommendedPrice from "./pages/RecommendedPrice";
import Costs from "./pages/Costs";
import Device from "./pages/Device";
import Sales from "./pages/Sales";
import SalesVolume from "./pages/SalesVolume";
import TargetProfit from "./pages/TargetProfit";
import Scenarios from "./pages/Scenarios";
import Reports from "./pages/Reports";
import PrintReport from "./pages/PrintReport";
import { StartScreen } from "./components/StartScreen";

function Shell() {
  // Reads the single shared instance created by FinancialModelProvider below —
  // does NOT create a new one, so dark mode stays in sync with every page.
  const { darkMode, setDarkMode } = useFinancialModel();
  return (
    <Routes>
      <Route element={<AppLayout darkMode={darkMode} onToggleDark={() => setDarkMode((v) => !v)} />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/recommended-price" element={<RecommendedPrice />} />
        <Route path="/costs" element={<Costs />} />
        <Route path="/device" element={<Device />} />
        <Route path="/sales" element={<Sales />} />
        <Route path="/sales-volume" element={<SalesVolume />} />
        <Route path="/target-profit" element={<TargetProfit />} />
        <Route path="/scenarios" element={<Scenarios />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/print-report" element={<PrintReport />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  const [showStart, setShowStart] = React.useState(true);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    const seen = sessionStorage.getItem("pos-sales-engine-start-seen-v1");
    if (seen) setShowStart(false);
    setReady(true);
  }, []);

  if (!ready) return null;

  return (
    <FinancialModelProvider>
      <HashRouter>
        {showStart && <StartScreen onEnter={() => setShowStart(false)} />}
        <Shell />
      </HashRouter>
    </FinancialModelProvider>
  );
}
