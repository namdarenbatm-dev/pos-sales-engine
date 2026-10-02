export type RepeatPurchase = "low" | "medium" | "high";

export type DecisionInputs = {
  currentPurchasePrice: number;
  currentSellingPrice: number;
  currentDollar: number;
  futureDollar: number;
  targetProfitPercent: number;
  repeatPurchase: RepeatPurchase;
};

export type DecisionResult = {
  replacementCost: number;
  currentProfit: number;
  currentMargin: number;
  economicProfit: number;
  economicMargin: number;
  targetPrice: number;
  floorPrice: number;
  maxDiscount: number;
  decision: "sell" | "negotiate" | "hold";
  decisionLabel: string;
  action: string;
  reasons: string[];
};

/**
 * V1 pricing policy. Keep these rules explicit and easy to tune later.
 * The engine uses today's purchase price as the base and rolls it forward
 * by the future/current FX ratio. Historical purchase cost is intentionally
 * not part of this decision.
 */
const REPEAT_FLOOR_FACTOR: Record<RepeatPurchase, number> = {
  low: 1,
  medium: 0.75,
  high: 0.5,
};

export function calculateDecision(input: DecisionInputs): DecisionResult {
  const purchase = Math.max(0, input.currentPurchasePrice);
  const selling = Math.max(0, input.currentSellingPrice);
  const currentDollar = Math.max(0, input.currentDollar);
  const futureDollar = Math.max(0, input.futureDollar);
  const target = Math.max(0, input.targetProfitPercent) / 100;

  const fxFactor = currentDollar > 0 ? futureDollar / currentDollar : 1;
  const replacementCost = purchase * fxFactor;
  const currentProfit = selling - purchase;
  const currentMargin = selling > 0 ? currentProfit / selling : 0;
  const economicProfit = selling - replacementCost;
  const economicMargin = selling > 0 ? economicProfit / selling : 0;

  const targetPrice = replacementCost * (1 + target);
  const floorMargin = target * REPEAT_FLOOR_FACTOR[input.repeatPurchase];
  const floorPrice = replacementCost * (1 + floorMargin);
  const maxDiscount = Math.max(0, targetPrice - floorPrice);

  let decision: DecisionResult["decision"];
  if (selling < floorPrice) decision = "hold";
  else if (selling < targetPrice) decision = "negotiate";
  else decision = "sell";

  const decisionLabel =
    decision === "sell" ? "بفروش" : decision === "negotiate" ? "مذاکره کن" : "فعلاً نفروش";

  const action =
    decision === "sell"
      ? `از ${formatMillions(targetPrice)} شروع کن؛ تا ${formatMillions(floorPrice)} قابل مذاکره است.`
      : decision === "negotiate"
      ? `قیمت را تا ${formatMillions(targetPrice)} هدف بگیر؛ پایین‌تر از ${formatMillions(floorPrice)} نرو.`
      : `قیمت فروش را اصلاح کن؛ زیر ${formatMillions(floorPrice)} فروش نده.`;

  const reasons: string[] = [];
  if (futureDollar > currentDollar) reasons.push("دلار آتی بالاتر از دلار فعلی است و هزینه جایگزینی افزایش می‌یابد.");
  else if (futureDollar < currentDollar) reasons.push("دلار آتی پایین‌تر از دلار فعلی در نظر گرفته شده است.");
  else reasons.push("دلار آتی با دلار فعلی برابر در نظر گرفته شده است.");

  reasons.push(
    input.repeatPurchase === "high"
      ? "احتمال خرید بعدی زیاد است؛ دامنه مذاکره بازتر شده است."
      : input.repeatPurchase === "medium"
      ? "احتمال خرید بعدی متوسط است؛ تخفیف کنترل‌شده مجاز است."
      : "احتمال خرید بعدی کم است؛ حداقل سود هدف حفظ می‌شود."
  );

  if (economicProfit < 0) reasons.push("قیمت فعلی حتی هزینه جایگزینی را پوشش نمی‌دهد.");
  else reasons.push(`سود اقتصادی فعلی حدود ${formatMillions(economicProfit)} است.`);

  return {
    replacementCost,
    currentProfit,
    currentMargin,
    economicProfit,
    economicMargin,
    targetPrice,
    floorPrice,
    maxDiscount,
    decision,
    decisionLabel,
    action,
    reasons,
  };
}

function formatMillions(value: number): string {
  const millions = value / 1_000_000;
  return `${new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 2 }).format(millions)} میلیون`;
}
