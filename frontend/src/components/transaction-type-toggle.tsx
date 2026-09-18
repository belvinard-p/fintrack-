"use client";

import { cn } from "cn";
import type { TransactionType } from "@/lib/amount";

export function TransactionTypeToggle({
  value,
  onChange,
  expenseLabel,
  incomeLabel,
  idPrefix,
}: Readonly<{
  value: TransactionType;
  onChange: (value: TransactionType) => void;
  expenseLabel: string;
  incomeLabel: string;
  idPrefix?: string;
}>) {
  return (
    <div
      role="radiogroup"
      aria-label={`${expenseLabel} / ${incomeLabel}`}
      className="inline-flex w-full rounded-lg border border-border bg-muted/40 p-0.5"
    >
      <button
        type="button"
        role="radio"
        aria-checked={value === "expense"}
        id={idPrefix ? `${idPrefix}-expense` : undefined}
        onClick={() => onChange("expense")}
        className={cn(
          "flex-1 rounded-[7px] px-3 py-1.5 text-sm font-medium transition-colors",
          value === "expense"
            ? "bg-red-600 text-white shadow-sm dark:bg-red-500"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        {expenseLabel}
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={value === "income"}
        id={idPrefix ? `${idPrefix}-income` : undefined}
        onClick={() => onChange("income")}
        className={cn(
          "flex-1 rounded-[7px] px-3 py-1.5 text-sm font-medium transition-colors",
          value === "income"
            ? "bg-emerald-600 text-white shadow-sm dark:bg-emerald-500"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        {incomeLabel}
      </button>
    </div>
  );
}
