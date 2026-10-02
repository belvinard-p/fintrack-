"use client";

import { cn } from "cn";

export type TransactionFrequency = "once" | "recurring";

export function FrequencyToggle({
  value,
  onChange,
  onceLabel,
  recurringLabel,
  idPrefix,
}: Readonly<{
  value: TransactionFrequency;
  onChange: (value: TransactionFrequency) => void;
  onceLabel: string;
  recurringLabel: string;
  idPrefix?: string;
}>) {
  return (
    <div
      role="radiogroup"
      aria-label={`${onceLabel} / ${recurringLabel}`}
      className="inline-flex w-full rounded-lg border border-border bg-muted/40 p-0.5"
    >
      <button
        type="button"
        role="radio"
        aria-checked={value === "once"}
        id={idPrefix ? `${idPrefix}-once` : undefined}
        onClick={() => onChange("once")}
        className={cn(
          "flex-1 rounded-[7px] px-3 py-1.5 text-sm font-medium transition-colors",
          value === "once"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        {onceLabel}
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={value === "recurring"}
        id={idPrefix ? `${idPrefix}-recurring` : undefined}
        onClick={() => onChange("recurring")}
        className={cn(
          "flex-1 rounded-[7px] px-3 py-1.5 text-sm font-medium transition-colors",
          value === "recurring"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        {recurringLabel}
      </button>
    </div>
  );
}
