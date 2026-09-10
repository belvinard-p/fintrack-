"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { useCategorySpending, useMonthlySpending } from "@/lib/queries";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const COLORS = ["#0f172a", "#334155", "#64748b", "#94a3b8", "#cbd5e1", "#f97316", "#fb923c", "#fdba74"];

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
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey={(entry) => parseFloat(entry.total)}
                    nameKey="category_name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry) => entry.name}
                  >
                    {categoryData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
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
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData.map((d) => ({ ...d, total: parseFloat(d.total) }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="total" fill="#0f172a" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}