"use client";

import { BudgetForm, BudgetStatusList } from "@/features/budgets";
import { CategoryManager } from "@/features/categories";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/lib/i18n";

export default function BudgetsPage() {
  const { t } = useLanguage();

  return (
    <main className="p-4 space-y-8 sm:p-8">
      <h1 className="text-2xl font-bold">{t("budgets.title")}</h1>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("budgets.setABudget")}</CardTitle>
          </CardHeader>
          <CardContent>
            <BudgetForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("budgets.budgetStatus")}</CardTitle>
          </CardHeader>
          <CardContent>
            <BudgetStatusList />
          </CardContent>
        </Card>
      </div>

      <Card>

        <CardHeader>
          <CardTitle>{t("budgets.manageCategories")}</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryManager />
        </CardContent>
      </Card>
    </main>
  );
}
