"use client";

import { useLanguage } from "@/lib/i18n";

function percentChange(current: string, previous: string): number | null {
  const prev = Number(previous);
  if (prev === 0) return null;
  return ((Number(current) - prev) / prev) * 100;
}

export function PeriodDelta({
  current,
  previous,
  goodWhenUp,
  period,
}: Readonly<{ current: string; previous: string; goodWhenUp: boolean; period: "month" | "year" }>) {
  const { t } = useLanguage();
  const change = percentChange(current, previous);
  const noPreviousKey = period === "year" ? "dashboard.summary.noPreviousYear" : "dashboard.summary.noPrevious";
  const vsPreviousKey = period === "year" ? "dashboard.summary.vsPreviousYear" : "dashboard.summary.vsPrevious";

  if (change === null) {
    return <p className="text-xs text-muted-foreground">{t(noPreviousKey)}</p>;
  }
  const isUp = change >= 0;
  const isGood = isUp === goodWhenUp;
  const color = isGood ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400";
  return (
    <p className="text-xs text-muted-foreground">
      <span className={`font-medium ${color}`}>
        {isUp ? "▲" : "▼"} {Math.abs(change).toFixed(1)}%
      </span>{" "}
      {t(vsPreviousKey, { value: Number(previous).toFixed(2) })}
    </p>
  );
}
