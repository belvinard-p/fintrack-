"use client";

import Link from "next/link";
import { useBudgetStatus } from "../hooks/use-budget-status";
import { getCurrentMonth } from "../utils";
import { useLanguage } from "@/lib/i18n";

export function OverBudgetBanner() {
  const { t } = useLanguage();
  const { data: statuses } = useBudgetStatus(getCurrentMonth());
  const overBudget = statuses?.filter((status) => status.is_over_budget) ?? [];

  if (overBudget.length === 0) return null;

  const categoryWord = t(
    overBudget.length === 1
      ? "budgets.overBudgetBanner.categorySingular"
      : "budgets.overBudgetBanner.categoryPlural"
  );

  return (
    <div
      role="alert"
      aria-live="polite"
      className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
    >
      {t("budgets.overBudgetBanner.message", {
        count: overBudget.length,
        categoryWord,
        categories: overBudget.map((status) => status.category_name).join(", "),
      })}{" "}
      <Link href="/budgets" className="underline font-medium">
        {t("budgets.overBudgetBanner.review")}
      </Link>
    </div>
  );
}
