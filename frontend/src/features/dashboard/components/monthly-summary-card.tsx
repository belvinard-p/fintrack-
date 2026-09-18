"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMonthlySummary } from "../hooks/use-monthly-summary";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryDot } from "@/components/category-dot";
import { MonthlyIncomeDialog } from "@/features/income";
import { useLanguage } from "@/lib/i18n";
import { amountColorClass, formatSignedAmount } from "@/lib/amount";

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function shiftMonth(month: string, delta: number): string {
  const [year, m] = month.split("-").map(Number);
  const date = new Date(year, m - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

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

export function MonthlySummaryCard() {
  const { t } = useLanguage();
  const [month, setMonth] = useState(getCurrentMonth);
  const currentMonth = getCurrentMonth();

  const { data: summary, isLoading, error } = useMonthlySummary(month);

  const [showAllCategories, setShowAllCategories] = useState(false);

  const totalExpenses = Number(summary?.total_expenses ?? 0);
  const categories = summary?.expenses_by_category ?? [];
  const hasOthers = categories.length > TOP_CATEGORIES;
  const visibleCategories = hasOthers && !showAllCategories ? categories.slice(0, TOP_CATEGORIES) : categories;
  const groupedCategories = hasOthers && !showAllCategories ? categories.slice(TOP_CATEGORIES) : [];
  const othersTotal = groupedCategories.reduce((sum, c) => sum + Number(c.total), 0);
  const shareOf = (value: number) => (totalExpenses > 0 ? (value / totalExpenses) * 100 : 0);

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>{t("dashboard.summary.title")}</CardTitle>
          <MonthlyIncomeDialog month={month} />
        </div>
        <div className="flex items-end gap-2">
          <Button
            variant="outline"
            size="icon"
            aria-label={t("dashboard.summary.previousMonth")}
            onClick={() => setMonth(shiftMonth(month, -1))}
          >
            <ChevronLeft />
          </Button>
          <div className="space-y-1">
            <Label htmlFor="summary-month" className="sr-only">
              {t("dashboard.summary.month")}
            </Label>
            <Input
              id="summary-month"
              type="month"
              value={month}
              onChange={(e) => e.target.value && setMonth(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            aria-label={t("dashboard.summary.nextMonth")}
            disabled={month >= currentMonth}
            onClick={() => setMonth(shiftMonth(month, 1))}
          >
            <ChevronRight />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div aria-live="polite">
          {isLoading && <Skeleton className="h-24 w-full" />}
          {error && <p className="text-red-600">{t("dashboard.summary.failedToLoad")}</p>}
        </div>

        {summary && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1 rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">{t("dashboard.summary.income")}</p>
                {summary.income_set ? (
                  <>
                    <p className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400">
                      {Number(summary.total_income).toFixed(2)}
                    </p>
                    <Delta
                      current={summary.total_income}
                      previous={summary.previous.total_income}
                      goodWhenUp
                    />
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">{t("income.notSet")}</p>
                )}
              </div>

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
            </div>

            {summary.expenses_by_category.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium">{t("dashboard.summary.expensesByCategory")}</h3>
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
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
