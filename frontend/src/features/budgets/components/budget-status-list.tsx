"use client";

import { useState } from "react";
import { useBudgetStatus } from "../hooks/use-budget-status";
import { getCurrentMonth } from "../utils";
import { BudgetItem } from "./budget-item";
import { BudgetAllocationSummary } from "@/features/income";
import { isLockedMonthStr } from "@/lib/date";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/lib/i18n";

export function BudgetStatusList() {
  const { t } = useLanguage();
  const [month, setMonth] = useState(getCurrentMonth);
  const { data: statuses, isLoading, error } = useBudgetStatus(month);
  const locked = isLockedMonthStr(month);

  return (
    <div className="space-y-4">
      <BudgetAllocationSummary month={month} />

      <div className="space-y-2 max-w-xs">
        <Label htmlFor="status-month">{t("budgets.form.month")}</Label>
        <Input
          id="status-month"
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
        />
      </div>

      <div aria-live="polite">
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        )}
        {error && <p className="text-red-600">{t("budgets.status.failedToLoad")}</p>}
        {statuses?.length === 0 && (
          <p className="text-muted-foreground">{t("budgets.status.empty")}</p>
        )}
      </div>

      {statuses && statuses.length > 0 && (
        <div className="space-y-3">
          {statuses.map((status) => (
            <BudgetItem key={status.id} status={status} locked={locked} />
          ))}
        </div>
      )}
    </div>
  );
}
