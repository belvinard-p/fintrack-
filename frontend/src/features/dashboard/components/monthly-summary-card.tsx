"use client";

import { useState } from "react";
import { useMonthlySummary } from "../hooks/use-monthly-summary";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryDot } from "@/components/category-dot";
import { CategoryPieChart } from "./category-pie-chart";
import { MonthlyIncomeDialog, useMonthlyIncome } from "@/features/income";
import { useLanguage } from "@/lib/i18n";
import { amountColorClass, formatSignedAmount } from "@/lib/amount";

const TOP_CATEGORIES = 5;

function CategoryRow({
  label,
  dot,
  total,
  share,
}: Readonly<{ label: string; dot: React.ReactNode; total: number; share: number }>) {
  return (
    <li className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-2">
          {dot}
          {label}
        </span>
        <span className="text-muted-foreground">
          {total.toFixed(2)} · {share.toFixed(0)}%
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-foreground/70" style={{ width: `${share}%` }} />
      </div>
    </li>
  );
}

function percentChange(current: string, previous: string): number | null {
  const prev = Number(previous);
  if (prev === 0) return null;
  return ((Number(current) - prev) / prev) * 100;
}

function Delta({
  current,
  previous,
  goodWhenUp,
}: Readonly<{ current: string; previous: string; goodWhenUp: boolean }>) {
  const { t } = useLanguage();
  const change = percentChange(current, previous);
  if (change === null) {
    return <p className="text-xs text-muted-foreground">{t("dashboard.summary.noPrevious")}</p>;
  }
  const isUp = change >= 0;
  const isGood = isUp === goodWhenUp;
  const color = isGood ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400";
  return (
    <p className="text-xs text-muted-foreground">
      <span className={`font-medium ${color}`}>
        {isUp ? "▲" : "▼"} {Math.abs(change).toFixed(1)}%
      </span>{" "}
      {t("dashboard.summary.vsPrevious", { value: Number(previous).toFixed(2) })}
    </p>
  );
}

export function MonthlySummaryCard({ month }: Readonly<{ month: string }>) {
  const { t } = useLanguage();
  const { data: summary, isLoading, error } = useMonthlySummary(month);
  const { data: income } = useMonthlyIncome(month);
  const [showAllCategories, setShowAllCategories] = useState(false);

  const totalExpenses = Number(summary?.total_expenses ?? 0);
  const categories = summary?.expenses_by_category ?? [];
  const hasOthers = categories.length > TOP_CATEGORIES;
  const visibleCategories = hasOthers && !showAllCategories ? categories.slice(0, TOP_CATEGORIES) : categories;
  const groupedCategories = hasOthers && !showAllCategories ? categories.slice(TOP_CATEGORIES) : [];
  const othersTotal = groupedCategories.reduce((sum, c) => sum + Number(c.total), 0);
  const shareOf = (value: number) => (totalExpenses > 0 ? (value / totalExpenses) * 100 : 0);

  const remaining = income?.is_set ? Number(income.remaining) : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>{t("dashboard.summary.title")}</CardTitle>
          {summary?.income_set && <MonthlyIncomeDialog month={month} />}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div aria-live="polite">
          {isLoading && <Skeleton className="h-24 w-full" />}
          {error && <p className="text-red-600">{t("dashboard.summary.failedToLoad")}</p>}
        </div>

        {summary && !summary.income_set && (
          <div className="flex flex-col items-start gap-3 rounded-lg border border-dashed p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">{t("dashboard.summary.onboardingTitle")}</p>
              <p className="text-sm text-muted-foreground">
                {t("dashboard.summary.onboardingBody", { month })}
              </p>
            </div>
            <MonthlyIncomeDialog month={month} />
          </div>
        )}

        {summary && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {summary.income_set && (
                <div className="space-y-1 rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">{t("dashboard.summary.income")}</p>
                  <p className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400">
                    {Number(summary.total_income).toFixed(2)}
                  </p>
                  <Delta
                    current={summary.total_income}
                    previous={summary.previous.total_income}
                    goodWhenUp
                  />
                </div>
              )}

              <div className="space-y-1 rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">{t("dashboard.summary.expenses")}</p>
                <p className="text-2xl font-semibold text-red-600 dark:text-red-400">
                  {Number(summary.total_expenses).toFixed(2)}
                </p>
                <Delta
                  current={summary.total_expenses}
                  previous={summary.previous.total_expenses}
                  goodWhenUp={false}
                />
              </div>

              {summary.income_set && (
                <>
                  <div className="space-y-1 rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">{t("dashboard.summary.net")}</p>
                    <p className={`text-2xl font-semibold ${amountColorClass(summary.net)}`}>
                      {formatSignedAmount(Number(summary.net).toFixed(2))}
                    </p>
                    <Delta current={summary.net} previous={summary.previous.net} goodWhenUp />
                  </div>

                  <div className="space-y-1 rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">{t("dashboard.summary.savingsRate")}</p>
                    {summary.savings_rate === null ? (
                      <p className="text-sm text-muted-foreground">{t("dashboard.summary.savingsRateNA")}</p>
                    ) : (
                      <p className={`text-2xl font-semibold ${amountColorClass(summary.savings_rate)}`}>
                        {summary.savings_rate}%
                      </p>
                    )}
                  </div>

                  {remaining !== null && (
                    <div className="space-y-1 rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground">{t("income.remaining")}</p>
                      <p className={`text-2xl font-semibold ${amountColorClass(remaining)}`}>
                        {remaining.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("dashboard.summary.budgetedOf", {
                          budgeted: Number(income?.total_budgeted ?? 0).toFixed(2),
                          income: Number(income?.amount ?? 0).toFixed(2),
                        })}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {categories.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium">{t("dashboard.summary.expensesByCategory")}</h3>
                <div className="grid items-center gap-6 md:grid-cols-2">
                  <CategoryPieChart data={categories} />
                  <div className="space-y-3">
                    <ul className="space-y-2">
                      {visibleCategories.map((category) => (
                        <CategoryRow
                          key={category.category_id ?? "none"}
                          label={category.category_name}
                          dot={<CategoryDot categoryId={category.category_id} />}
                          total={Number(category.total)}
                          share={shareOf(Number(category.total))}
                        />
                      ))}
                      {groupedCategories.length > 0 && (
                        <CategoryRow
                          label={t("dashboard.summary.others", { count: groupedCategories.length })}
                          dot={<span aria-hidden="true" className="inline-block size-2.5 shrink-0 rounded-full bg-muted-foreground/40" />}
                          total={othersTotal}
                          share={shareOf(othersTotal)}
                        />
                      )}
                    </ul>
                    {hasOthers && (
                      <Button variant="ghost" size="sm" onClick={() => setShowAllCategories((v) => !v)}>
                        {showAllCategories
                          ? t("dashboard.summary.showLess")
                          : t("dashboard.summary.showAll", { count: categories.length })}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
