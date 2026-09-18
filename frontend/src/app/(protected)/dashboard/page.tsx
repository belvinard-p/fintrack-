"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCategorySpending,
  useMonthlySpending,
  CategoryPieChart,
  MonthlySpendingChart,
  MonthlySummaryCard,
} from "@/features/dashboard";
import { OverBudgetBanner } from "@/features/budgets";
import { useLanguage } from "@/lib/i18n";

export default function DashboardPage() {
  const { t } = useLanguage();
  const { data: categoryData, isLoading: categoryLoading, error: categoryError } = useCategorySpending();
  const { data: monthlyData, isLoading: monthlyLoading, error: monthlyError } = useMonthlySpending();

  return (
    <main className="p-4 space-y-8 sm:p-8">
      <h1 className="text-2xl font-bold">{t("dashboard.title")}</h1>

      <OverBudgetBanner />

      <MonthlySummaryCard />

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.spendingByCategory")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div aria-live="polite">
              {categoryLoading && <Skeleton className="h-[300px] w-full" />}
              {categoryError && <p className="text-red-600">{t("dashboard.failedToLoad")}</p>}
              {categoryData?.length === 0 && (
                <p className="text-muted-foreground">{t("dashboard.noTransactions")}</p>
              )}
            </div>
            {categoryData && categoryData.length > 0 && (
              <CategoryPieChart data={categoryData} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.spendingOverTime")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div aria-live="polite">
              {monthlyLoading && <Skeleton className="h-[300px] w-full" />}
              {monthlyError && <p className="text-red-600">{t("dashboard.failedToLoad")}</p>}
              {monthlyData?.length === 0 && (
                <p className="text-muted-foreground">{t("dashboard.noTransactions")}</p>
              )}
            </div>
            {monthlyData && monthlyData.length > 0 && (
              <MonthlySpendingChart data={monthlyData} />
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
