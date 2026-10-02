"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useSetGoalAllocation } from "../hooks/use-set-goal-allocation";
import { Goal, GoalStatus } from "../types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useLanguage } from "@/lib/i18n";
import { extractErrorMessage } from "@/lib/error";
import { isLockedMonthStr } from "@/lib/date";

interface SetGoalAllocationDialogProps {
  goal: Goal;
  month: string;
  status?: GoalStatus;
}

export function SetGoalAllocationDialog({ goal, month, status }: Readonly<SetGoalAllocationDialogProps>) {
  const { t } = useLanguage();
  const setAllocation = useSetGoalAllocation();
  const locked = isLockedMonthStr(month);
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setAmount(status ? String(Number(status.monthly_allocation)) : "");
      setError(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await setAllocation.mutateAsync({ goalId: goal.id, month, amount });
      setOpen(false);
      toast.success(t("goals.allocation.saved"));
    } catch (err) {
      setError(extractErrorMessage(err, t("goals.allocation.error")));
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            disabled={locked}
            title={locked ? t("goals.allocation.monthLocked") : undefined}
          />
        }
      >
        {t("goals.allocation.planMonth")}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("goals.allocation.dialogTitle", { name: goal.name, month })}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="space-y-2">
            <Label htmlFor={`goal-allocation-${goal.id}`}>{t("goals.allocation.amountLabel")}</Label>
            <Input
              id={`goal-allocation-${goal.id}`}
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" type="button" />}>
              {t("common.cancel")}
            </DialogClose>
            <Button type="submit" disabled={setAllocation.isPending || !amount}>
              {setAllocation.isPending ? t("common.saving") : t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
