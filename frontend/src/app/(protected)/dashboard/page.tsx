"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCategorySpending,
  useMonthlySpending,
  CategoryPieChart,
  MonthlySpendingChart,
} from "@/features/dashboard";
import { OverBudgetBanner } from "@/features/budgets";

export default function DashboardPage() {
  const { data: categoryData, isLoading: categoryLoading, error: categoryError } = useCategorySpending();
  const { data: monthlyData, isLoading: monthlyLoading, error: monthlyError } = useMonthlySpending();

  return (
    <main className="p-4 space-y-8 sm:p-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <OverBudgetBanner />

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div aria-live="polite">
              {categoryLoading && <Skeleton className="h-[300px] w-full" />}
              {categoryError && <p className="text-red-600">Failed to load data</p>}
              {categoryData?.length === 0 && (
                <p className="text-muted-foreground">No transactions yet</p>
              )}
            </div>
            {categoryData && categoryData.length > 0 && (
              <CategoryPieChart data={categoryData} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Spending Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div aria-live="polite">
              {monthlyLoading && <Skeleton className="h-[300px] w-full" />}
              {monthlyError && <p className="text-red-600">Failed to load data</p>}
              {monthlyData?.length === 0 && (
                <p className="text-muted-foreground">No transactions yet</p>
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
