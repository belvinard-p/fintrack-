"use client";

import { useState } from "react";
import { useBudgetStatus } from "../hooks/use-budget-status";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export function BudgetStatusList() {
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const { data: statuses, isLoading, error } = useBudgetStatus(month);

  return (
    <div className="space-y-4">
      <div className="space-y-2 max-w-xs">
        <Label htmlFor="status-month">Month</Label>
        <Input
          id="status-month"
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
        />
      </div>

      {isLoading && <p>Loading...</p>}
      {error && <p className="text-red-600">Failed to load budget status</p>}
      {statuses && statuses.length === 0 && (
        <p className="text-gray-500">No budgets set for this month</p>

      )}

      {statuses && statuses.length > 0 && (
        <div className="space-y-3">
          {statuses.map((status) => (
            <div
              key={status.category_id}
              className="flex items-center justify-between border rounded-lg p-4"
            >
              <div>
                <p className="font-medium">{status.category_name}</p>
                <p className="text-sm text-gray-500">
                  {status.actual_spending} / {status.monthly_limit}
                </p>
              </div>
              <Badge variant={status.is_over_budget ? "destructive" : "secondary"}>
                {status.is_over_budget ? "Over budget" : "On track"}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}