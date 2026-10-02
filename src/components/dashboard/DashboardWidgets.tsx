import React from "react";
import type { LucideIcon } from "lucide-react";
import type { BusinessStatus } from "../../types";
import { Card, Button } from "../ui/primitives";

export const STATUS_META: Record<BusinessStatus, { label: string; emoji: string; textClass: string }> = {
  loss: { label: "زیان", emoji: "🔴", textClass: "text-rose-600" },
  breakeven: { label: "سربه‌سر", emoji: "🟡", textClass: "text-amber-600" },
  profit: { label: "سودده", emoji: "🟢", textClass: "text-emerald-600" },
};

export function StatusBadge({ status }: { status: BusinessStatus }) {
  return <span className={`text-sm font-semibold ${STATUS_META[status].textClass}`}>{STATUS_META[status].emoji} {STATUS_META[status].label}</span>;
}

export function KpiCard({
  title, value, sub, tone = "neutral", icon: Icon, change,
}: {
  title: string; value: string; sub?: string; tone?: "neutral" | "good" | "bad" | "warn";
  icon?: LucideIcon; change?: string;
}) {
  const toneCls = {
    neutral: "text-slate-800 dark:text-slate-100",
    good: "text-emerald-600",
    bad: "text-rose-600",
    warn: "text-amber-600",
  }[tone];
  return (
    <Card>
      <div className="flex items-start justify-between mb-1">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{title}</span>
        {Icon && <Icon size={16} className="text-slate-400 dark:text-slate-500" />}
      </div>
      <span className={`text-xl font-bold block ${toneCls}`}>{value}</span>
      {sub && <span className="text-xs text-slate-400 dark:text-slate-500 block mt-0.5">{sub}</span>}
      {change && <span className="text-xs text-slate-400 dark:text-slate-500 block mt-0.5">{change}</span>}
    </Card>
  );
}

export function StatusBanner({ status, message }: { status: BusinessStatus; message: string }) {
  const bg = {
    loss: "bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:border-rose-800",
    breakeven: "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800",
    profit: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800",
  }[status];
  const txt = { loss: "text-rose-700 dark:text-rose-300", breakeven: "text-amber-700 dark:text-amber-300", profit: "text-emerald-700 dark:text-emerald-300" }[status];
  return (
    <div className={`rounded-2xl border p-4 flex items-center gap-3 ${bg}`}>
      <span className="text-2xl leading-none">{STATUS_META[status].emoji}</span>
      <p className={`text-sm font-semibold ${txt}`}>{message}</p>
    </div>
  );
}

export function AlertCard({ tone, message }: { tone: "loss" | "warn" | "good"; message: string }) {
  const map = {
    loss: { bg: "bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:border-rose-800", txt: "text-rose-700 dark:text-rose-300", emoji: "🔴" },
    warn: { bg: "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800", txt: "text-amber-700 dark:text-amber-300", emoji: "🟡" },
    good: { bg: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800", txt: "text-emerald-700 dark:text-emerald-300", emoji: "🟢" },
  }[tone];
  return (
    <div className={`rounded-xl border p-3 flex items-center gap-2 text-sm font-medium ${map.bg} ${map.txt}`}>
      <span>{map.emoji}</span><span>{message}</span>
    </div>
  );
}

export function EmptyState({ title, description, actionLabel, onAction }: { title: string; description: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <Card className="text-center py-10">
      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">{title}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{description}</p>
      {actionLabel && onAction && <Button variant="primary" onClick={onAction}>{actionLabel}</Button>}
    </Card>
  );
}
