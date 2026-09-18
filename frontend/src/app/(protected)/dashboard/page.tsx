"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useMonthlySpending,
  DashboardMonthPicker,
  MonthlySpendingChart,
  MonthlySummaryCard,
} from "@/features/dashboard";
import { getCurrentMonth } from "@/features/dashboard/utils";
import { OverBudgetBanner } from "@/features/budgets";
import { useLanguage } from "@/lib/i18n";

export default function DashboardPage() {
  const { t } = useLanguage();
  const [month, setMonth] = useState(getCurrentMonth);
  const { data: monthlyData, isLoading: monthlyLoading, error: monthlyError } = useMonthlySpending();

  return (
    <main className="p-4 space-y-8 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{t("dashboard.title")}</h1>
        <DashboardMonthPicker month={month} onChange={setMonth} />
      </div>

      <OverBudgetBanner />

      <MonthlySummaryCard month={month} />

      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.spendingOverTime")}</CardTitle>
          <p className="text-xs text-muted-foreground">{t("dashboard.allMonths")}</p>
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
    </main>
  );
}
