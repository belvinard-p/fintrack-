"use client";

import Link from "next/link";
import { useBudgetStatus } from "../hooks/use-budget-status";
import { getCurrentMonth } from "../utils";

export function OverBudgetBanner() {
  const { data: statuses } = useBudgetStatus(getCurrentMonth());
  const overBudget = statuses?.filter((status) => status.is_over_budget) ?? [];

  if (overBudget.length === 0) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
    >
      You are over budget in {overBudget.length}{" "}
      {overBudget.length === 1 ? "category" : "categories"} this month:{" "}
      {overBudget.map((status) => status.category_name).join(", ")}.{" "}
      <Link href="/budgets" className="underline font-medium">
        Review budgets
      </Link>
    </div>
  );
}
