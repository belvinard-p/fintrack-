"use client";

import { useMonthlyIncome } from "../hooks/use-monthly-income";
import { MonthlyIncomeDialog } from "./monthly-income-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/lib/i18n";

export function BudgetAllocationSummary({ month }: Readonly<{ month: string }>) {
  const { t } = useLanguage();
  const { data: income, isLoading } = useMonthlyIncome(month);

  if (isLoading || !income) return <Skeleton className="h-24 w-full rounded-lg" />;

  const remainingClass = income.is_over_allocated
    ? "text-red-600 dark:text-red-400"
    : "text-emerald-600 dark:text-emerald-400";

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-medium">{t("income.title")}</h3>
        <MonthlyIncomeDialog month={month} />
      </div>

      {income.is_set ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">{t("income.monthIncome")}</p>
            <p className="text-lg font-semibold">{Number(income.amount).toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("income.budgeted")}</p>
            <p className="text-lg font-semibold">{Number(income.total_budgeted).toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("income.remaining")}</p>
            <p className={`text-lg font-semibold ${remainingClass}`}>
              {Number(income.remaining).toFixed(2)}
            </p>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{t("income.notSet")}</p>
      )}

      {income.is_set && income.is_over_allocated && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {t("income.overAllocated", {
            amount: Math.abs(Number(income.remaining)).toFixed(2),
          })}
        </p>
      )}
    </div>
  );
}
