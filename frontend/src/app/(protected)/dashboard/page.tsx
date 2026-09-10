"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  useCategorySpending,
  useMonthlySpending,
  CategoryPieChart,
  MonthlySpendingChart,
} from "@/features/dashboard";

export default function DashboardPage() {
  const { data: categoryData, isLoading: categoryLoading, error: categoryError } = useCategorySpending();
  const { data: monthlyData, isLoading: monthlyLoading, error: monthlyError } = useMonthlySpending();

  return (
    <main className="p-8 space-y-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryLoading && <p>Loading...</p>}
            {categoryError && <p className="text-red-600">Failed to load data</p>}
            {categoryData && categoryData.length === 0 && (
              <p className="text-gray-500">No transactions yet</p>
            )}
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
            {monthlyLoading && <p>Loading...</p>}
            {monthlyError && <p className="text-red-600">Failed to load data</p>}
            {monthlyData && monthlyData.length === 0 && (
              <p className="text-gray-500">No transactions yet</p>
            )}
            {monthlyData && monthlyData.length > 0 && (
              <MonthlySpendingChart data={monthlyData} />
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
