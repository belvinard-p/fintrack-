"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useBudgetStatus } from "../hooks/use-budget-status";
import { useUpdateBudget } from "../hooks/use-update-budget";
import { useDeleteBudget } from "../hooks/use-delete-budget";
import { getCurrentMonth } from "../utils";
import { BudgetAllocationSummary } from "@/features/income";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CategoryDot } from "@/components/category-dot";
import { useLanguage } from "@/lib/i18n";
import { extractErrorMessage } from "@/lib/error";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function BudgetStatusList() {
  const { t } = useLanguage();
  const [month, setMonth] = useState(getCurrentMonth);

  const { data: statuses, isLoading, error } = useBudgetStatus(month);
  const updateBudget = useUpdateBudget();
  const deleteBudget = useDeleteBudget();

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
      toast.success(t("budgets.status.updated"));
    } catch (err: any) {
      setEditError(extractErrorMessage(err, t("budgets.status.updateError")));
    }
  }

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
            <div
              key={status.id}
              className="flex flex-col gap-3 border rounded-lg p-4 sm:flex-row sm:items-center sm:justify-between"
            >
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
                    {t("common.edit")}
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {t("budgets.status.editTitle", { category: status.category_name })}
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleUpdate} className="space-y-4">
                      {editError && <p className="text-red-600 text-sm">{editError}</p>}
                      <div className="space-y-2">
                        <Label htmlFor="edit-monthly-limit">{t("budgets.status.monthlyLimitLabel")}</Label>
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
                        <DialogClose render={<Button variant="outline" type="button" />}>
                          {t("common.cancel")}
                        </DialogClose>
                        <Button type="submit" disabled={updateBudget.isPending}>
                          {updateBudget.isPending ? t("common.saving") : t("common.save")}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>

                <AlertDialog>
                  <AlertDialogTrigger
                    render={<Button variant="ghost" size="sm" />}
                  >
                    {t("common.delete")}
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {t("budgets.status.deleteTitle", { category: status.category_name })}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {t("budgets.status.deleteDescription")}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() =>
                          deleteBudget.mutate(status.id, {
                            onSuccess: () => toast.success(t("budgets.status.deleted")),
                          })
                        }
                      >
                        {t("common.delete")}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
