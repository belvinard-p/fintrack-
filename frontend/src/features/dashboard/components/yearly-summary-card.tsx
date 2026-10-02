"use client";

import { useYearlySummary } from "../hooks/use-yearly-summary";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryBreakdownList } from "./category-breakdown-list";
import { PeriodDelta } from "./period-delta";
import { YearlyBreakdownChart } from "./yearly-breakdown-chart";
import { useLanguage } from "@/lib/i18n";
import { amountColorClass, formatSignedAmount } from "@/lib/amount";

export function YearlySummaryCard({ year }: Readonly<{ year: string }>) {
  const { t } = useLanguage();
  const { data: summary, isLoading, error } = useYearlySummary(year);

  const totalExpenses = Number(summary?.total_expenses ?? 0);
  const categories = summary?.expenses_by_category ?? [];
  const hasIncome = Number(summary?.total_income ?? 0) > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("dashboard.summary.yearlyTitle")}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <div aria-live="polite">
          {isLoading && <Skeleton className="h-24 w-full" />}
          {error && <p className="text-red-600">{t("dashboard.summary.failedToLoad")}</p>}
        </div>

        {summary && summary.income_set_months === 0 && (
          <p className="text-sm text-muted-foreground">{t("dashboard.summary.yearlyNoIncome")}</p>
        )}
        {summary && summary.income_set_months > 0 && summary.income_set_months < 12 && (
          <p className="text-sm text-muted-foreground">
            {t("dashboard.summary.yearlyPartialIncome", { count: summary.income_set_months })}
          </p>
        )}

        {summary && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {hasIncome && (
                <div className="space-y-1 rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">{t("dashboard.summary.income")}</p>
                  <p className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400">
                    {Number(summary.total_income).toFixed(2)}
                  </p>
                  <PeriodDelta
                    current={summary.total_income}
                    previous={summary.previous.total_income}
                    goodWhenUp
                    period="year"
                  />
                </div>
              )}

              <div className="space-y-1 rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">{t("dashboard.summary.expenses")}</p>
                <p className="text-2xl font-semibold text-red-600 dark:text-red-400">
                  {Number(summary.total_expenses).toFixed(2)}
                </p>
                <PeriodDelta
                  current={summary.total_expenses}
                  previous={summary.previous.total_expenses}
                  goodWhenUp={false}
                  period="year"
                />
              </div>

              {hasIncome && (
                <>
                  <div className="space-y-1 rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">{t("dashboard.summary.net")}</p>
                    <p className={`text-2xl font-semibold ${amountColorClass(summary.net)}`}>
                      {formatSignedAmount(Number(summary.net).toFixed(2))}
                    </p>
                    <PeriodDelta current={summary.net} previous={summary.previous.net} goodWhenUp period="year" />
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
                </>
              )}
            </div>

            {summary.monthly_breakdown.some((m) => Number(m.income) > 0 || Number(m.expenses) > 0) && (
              <YearlyBreakdownChart data={summary.monthly_breakdown} />
            )}

            <CategoryBreakdownList categories={categories} totalExpenses={totalExpenses} />
          </>
        )}
      </CardContent>
    </Card>
  );
}
