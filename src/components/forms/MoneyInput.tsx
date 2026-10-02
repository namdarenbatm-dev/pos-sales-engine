import React, { useEffect, useState } from "react";
import { formatNumber, parseUserNumber, toFarsiDigits } from "../../utils/format";
import { Label } from "../ui/primitives";
import type { ValidationResult } from "../../calculations/validation";

type Props = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  suffix?: string;
  hint?: string;
  validate?: (value: number) => ValidationResult;
};

/** Shared input for money and unit-count fields: Persian digits, thousands separators, inline validation. */
export function MoneyInput({ label, value, onChange, suffix = "تومان", hint, validate }: Props) {
  const [raw, setRaw] = useState(value === 0 ? "" : formatNumber(value));
  useEffect(() => setRaw(value === 0 ? "" : formatNumber(value)), [value]);

  const validation = validate ? validate(value) : { valid: true as const };
  const invalid = !validation.valid;

  return (
    <label className="block mb-4">
      <Label>{label}</Label>
      <div className="relative">
        <input
          type="text"
          inputMode="decimal"
          dir="ltr"
          style={{ textAlign: "right", direction: "rtl" }}
          className={`w-full text-right rounded-lg border py-2.5 text-sm transition-colors
            bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100
            focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600
            ${suffix ? "pr-3 pl-14" : "px-3"} ${invalid ? "border-rose-400" : ""}`}
          value={raw}
          onChange={(e) => {
            const parsed = parseUserNumber(e.target.value);
            setRaw(toFarsiDigits(parsed));
            const num = parseFloat(parsed);
            onChange(Number.isNaN(num) ? 0 : num);
          }}
          placeholder="۰"
        />
        {suffix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 dark:text-slate-500">{suffix}</span>}
      </div>
      {invalid && !validation.valid && <span className="text-xs text-rose-500 mt-1 block">{validation.message}</span>}
      {!invalid && hint && <span className="text-xs mt-1 block text-slate-400 dark:text-slate-500">{hint}</span>}
    </label>
  );
}
