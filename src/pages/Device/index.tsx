import React from "react";
import { useFinancialModel } from "../../hooks/FinancialModelContext";
import { Card, SectionTitle } from "../../components/ui/primitives";
import { KpiCard } from "../../components/dashboard/DashboardWidgets";
import { MoneyInput } from "../../components/forms/MoneyInput";
import { formatToman } from "../../utils/format";
import { validateNonNegative, validatePercentRange } from "../../calculations/validation";
import type { DeviceCost } from "../../types";

const FIELDS: Array<[keyof Pick<DeviceCost, "purchasePrice" | "shippingCost" | "customsCost" | "clearanceCost" | "preparationCost" | "otherDirectCost">, string]> = [
  ["purchasePrice", "قیمت خرید هر دستگاه"],
  ["shippingCost", "هزینه حمل"],
  ["customsCost", "هزینه گمرک"],
  ["clearanceCost", "هزینه ترخیص"],
  ["preparationCost", "هزینه آماده‌سازی"],
  ["otherDirectCost", "سایر هزینه‌های مستقیم"],
];

export default function Device() {
  const m = useFinancialModel();
  const d = m.device;

  return (
    <div className="space-y-5">
      <SectionTitle desc="هزینه‌های مستقیم خرید و آماده‌سازی هر دستگاه کارتخوان را وارد کنید.">اطلاعات دستگاه</SectionTitle>
      <div className="grid lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2">
          <div className="grid sm:grid-cols-2 gap-x-4">
            {FIELDS.map(([key, label]) => (
              <MoneyInput
                key={key}
                label={label}
                value={d[key]}
                validate={(v) => validateNonNegative(v, label)}
                onChange={(v) => m.setDevice((prev) => ({ ...prev, [key]: Math.max(0, v) }))}
              />
            ))}
          </div>
          <div className="grid sm:grid-cols-2 gap-x-4 pt-2 border-t border-dashed border-slate-200 dark:border-slate-700">
            <MoneyInput label="مدت خواب پول" suffix="ماه" value={d.holdingPeriodMonths}
              validate={(v) => validateNonNegative(v, "مدت خواب پول")}
              onChange={(v) => m.setDevice((prev) => ({ ...prev, holdingPeriodMonths: Math.max(0, v) }))} />
            <MoneyInput label="نرخ سالانه هزینه پول" suffix="درصد" value={d.annualMoneyCostRate}
              validate={(v) => validatePercentRange(v, "نرخ سالانه هزینه پول")}
              onChange={(v) => m.setDevice((prev) => ({ ...prev, annualMoneyCostRate: Math.max(0, v) }))} />
          </div>
        </Card>
        <div className="space-y-4">
          <KpiCard title="هزینه مستقیم هر دستگاه" value={formatToman(m.snapshot.directCost)} />
          <KpiCard title="هزینه خواب پول" value={formatToman(m.snapshot.holdingCost)} />
          <KpiCard tone="warn" title="هزینه واقعی (اقتصادی) هر دستگاه" value={formatToman(m.snapshot.economicVariableCost)} />
        </div>
      </div>
    </div>
  );
}
