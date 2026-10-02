"use client";

import { cn } from "cn";
import { useLanguage } from "@/lib/i18n";

export type PeriodType = "month" | "year";

export function PeriodTypeToggle({
  value,
  onChange,
}: Readonly<{ value: PeriodType; onChange: (value: PeriodType) => void }>) {
  const { t } = useLanguage();
  const monthLabel = t("dashboard.summary.periodMonth");
  const yearLabel = t("dashboard.summary.periodYear");

  return (
    <div
      role="radiogroup"
      aria-label={`${monthLabel} / ${yearLabel}`}
      className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5"
    >
      <button
        type="button"
        role="radio"
        aria-checked={value === "month"}
        onClick={() => onChange("month")}
        className={cn(
          "rounded-[7px] px-3 py-1.5 text-sm font-medium transition-colors",
          value === "month"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        {monthLabel}
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={value === "year"}
        onClick={() => onChange("year")}
        className={cn(
          "rounded-[7px] px-3 py-1.5 text-sm font-medium transition-colors",
          value === "year"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        {yearLabel}
      </button>
    </div>
  );
}
