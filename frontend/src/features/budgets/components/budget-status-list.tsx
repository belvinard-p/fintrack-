"use client";

import { useState } from "react";
import { useBudgetStatus } from "../hooks/use-budget-status";
import { useUpdateBudget } from "../hooks/use-update-budget";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

export function BudgetStatusList() {
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const { data: statuses, isLoading, error } = useBudgetStatus(month);
  const updateBudget = useUpdateBudget();

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editLimit, setEditLimit] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  function startEdit(id: number, currentLimit: string) {
    setEditingId(id);
    setEditLimit(currentLimit);
    setEditError(null);
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (editingId === null) return;
    setEditError(null);
    try {
      await updateBudget.mutateAsync({
        id: editingId,
        payload: { monthly_limit: editLimit },
      });
      setEditingId(null);
    } catch (err: any) {
      setEditError(err.response?.data?.detail || "Failed to update budget");
    }
  }

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
              key={status.id}
              className="flex items-center justify-between border rounded-lg p-4"
            >
              <div>
                <p className="font-medium">{status.category_name}</p>
                <p className="text-sm text-gray-500">
                  {status.actual_spending} / {status.monthly_limit}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={status.is_over_budget ? "destructive" : "secondary"}>
                  {status.is_over_budget ? "Over budget" : "On track"}
                </Badge>
                <Dialog
                  open={editingId === status.id}
                  onOpenChange={(open) => !open && setEditingId(null)}
                >
                  <DialogTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEdit(status.id, status.monthly_limit)}
                      />
                    }
                  >
                    Edit
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Update budget for {status.category_name}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleUpdate} className="space-y-4">
                      {editError && <p className="text-red-600 text-sm">{editError}</p>}
                      <div className="space-y-2">
                        <Label htmlFor="edit-monthly-limit">Monthly limit</Label>
                        <Input
                          id="edit-monthly-limit"
                          type="number"
                          step="0.01"
                          value={editLimit}
                          onChange={(e) => setEditLimit(e.target.value)}
                          required
                        />
                      </div>
                      <DialogFooter>
                        <Button type="submit" disabled={updateBudget.isPending}>
                          {updateBudget.isPending ? "Saving..." : "Save"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}