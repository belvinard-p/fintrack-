"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useUpdateBudget } from "../hooks/use-update-budget";
import { BudgetStatus } from "../types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export function EditBudgetDialog({ status, disabled }: Readonly<{ status: BudgetStatus; disabled?: boolean }>) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [limit, setLimit] = useState(status.monthly_limit);
  const [error, setError] = useState<string | null>(null);
  const updateBudget = useUpdateBudget();

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setLimit(status.monthly_limit);
      setError(null);
    }
  }

  async function handleSubmit(e: React.BaseSyntheticEvent) {
    e.preventDefault();
    setError(null);
    try {
      await updateBudget.mutateAsync({ id: status.id, payload: { monthly_limit: limit } });
      setOpen(false);
      toast.success(t("budgets.status.updated"));
    } catch (err) {
      setError(extractErrorMessage(err, t("budgets.status.updateError")));
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            disabled={disabled}
            title={disabled ? t("budgets.status.monthLocked") : undefined}
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
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="space-y-2">
            <Label htmlFor={`edit-limit-${status.id}`}>{t("budgets.status.monthlyLimitLabel")}</Label>
            <Input
              id={`edit-limit-${status.id}`}
              type="number"
              step="0.01"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
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
  );
}
