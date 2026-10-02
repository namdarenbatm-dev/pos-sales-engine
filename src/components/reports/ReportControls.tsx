import React, { useState } from "react";
import { FileSpreadsheet, Printer } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/primitives";
import { formatDateFa } from "../../utils/format";

export function ExportButtons({ onExportExcel }: { onExportExcel: () => void }) {
  const [exporting, setExporting] = useState(false);
  const navigate = useNavigate();

  async function handleExport() {
    setExporting(true);
    try {
      // Yield to the event loop so the loading state actually paints
      // before the (synchronous, potentially heavy) workbook is built.
      await new Promise((r) => setTimeout(r, 30));
      onExportExcel();
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="no-print flex flex-wrap gap-2">
      <Button variant="primary" onClick={handleExport} disabled={exporting}>
        <FileSpreadsheet size={14} />{exporting ? "در حال تولید فایل..." : "خروجی اکسل"}
      </Button>
      <Button variant="secondary" onClick={() => navigate("/print-report")}>
        <Printer size={14} />چاپ گزارش مدیریتی
      </Button>
    </div>
  );
}

/** Only rendered inside the printable report area — carries the report's title/date for A4 output. */
export function ReportHeader({ title }: { title: string }) {
  return (
    <div className="hidden print:block mb-4 border-b pb-3">
      <h1 className="text-lg font-bold">ماشین حساب سود و قیمت فروش کارتخوان</h1>
      <p className="text-sm text-slate-500">{title} — {formatDateFa()}</p>
    </div>
  );
}
