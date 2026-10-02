/**
 * Lightweight validation layer with Persian error messages.
 * (No external schema library is bundled by default — see README for how
 * to swap this for Zod if you add it to your own environment; the function
 * signatures below are schema-library agnostic on purpose.)
 */

export type ValidationResult = { valid: true } | { valid: false; message: string };

const ok: ValidationResult = { valid: true };
const fail = (message: string): ValidationResult => ({ valid: false, message });

export function validateNonNegative(value: number, fieldLabel: string): ValidationResult {
  if (Number.isNaN(value)) return fail(`${fieldLabel} باید یک عدد معتبر باشد.`);
  if (value < 0) return fail(`${fieldLabel} نمی‌تواند منفی باشد.`);
  return ok;
}

export function validatePercentRange(value: number, fieldLabel: string, max = 1000): ValidationResult {
  if (Number.isNaN(value)) return fail(`${fieldLabel} باید یک عدد معتبر باشد.`);
  if (value < 0) return fail(`${fieldLabel} نمی‌تواند منفی باشد.`);
  if (value > max) return fail(`${fieldLabel} مقدار غیرمنطقی دارد.`);
  return ok;
}

export function validateSellingPrice(value: number): ValidationResult {
  return validateNonNegative(value, "قیمت فروش");
}

export function validateMonthlyUnits(value: number): ValidationResult {
  return validateNonNegative(value, "تعداد فروش");
}

export function validateTargetProfit(value: number): ValidationResult {
  if (Number.isNaN(value)) return fail("سود هدف باید یک عدد معتبر باشد.");
  if (value < 0) return fail("سود هدف نمی‌تواند منفی باشد.");
  return ok;
}

export function validateExpenseTitle(value: string): ValidationResult {
  if (!value || value.trim().length === 0) return fail("عنوان هزینه نمی‌تواند خالی باشد.");
  return ok;
}
