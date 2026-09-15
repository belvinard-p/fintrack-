"use client";

import { BudgetForm, BudgetStatusList } from "@/features/budgets";
import { CategoryManager } from "@/features/categories";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function BudgetsPage() {
  return (
    <main className="p-8 space-y-8">
      <h1 className="text-2xl font-bold">Budgets</h1>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Set a Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <BudgetForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Budget Status</CardTitle>
          </CardHeader>
          <CardContent>
            <BudgetStatusList />
          </CardContent>
        </Card>
      </div>

      <Card>

        <CardHeader>
          <CardTitle>Manage Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryManager />
        </CardContent>
      </Card>
    </main>
  );
}