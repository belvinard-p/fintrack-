"use client";

import { BudgetStatus } from "../types";
import { EditBudgetDialog } from "./edit-budget-dialog";
import { DeleteBudgetDialog } from "./delete-budget-dialog";
import { Badge } from "@/components/ui/badge";
import { CategoryDot } from "@/components/category-dot";
import { useLanguage } from "@/lib/i18n";

export function BudgetItem({ status, locked }: Readonly<{ status: BudgetStatus; locked: boolean }>) {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col gap-3 border rounded-lg p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="flex items-center gap-2 font-medium">
          <CategoryDot categoryId={status.category_id} />
          {status.category_name}
        </p>
        <p className="text-sm text-muted-foreground">
          {status.actual_spending} / {status.monthly_limit}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={status.is_over_budget ? "destructive" : "secondary"}>
          {status.is_over_budget ? t("budgets.status.overBudget") : t("budgets.status.onTrack")}
        </Badge>
        <EditBudgetDialog status={status} disabled={locked} />
        <DeleteBudgetDialog status={status} disabled={locked} />
      </div>
    </div>
  );
}
