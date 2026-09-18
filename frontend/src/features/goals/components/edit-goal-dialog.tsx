"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useUpdateGoal } from "../hooks/use-update-goal";
import { Goal } from "../types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/lib/i18n";
import { stripDigits } from "@/lib/text";
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

export function EditGoalDialog({ goal }: Readonly<{ goal: Goal }>) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(goal.name);
  const [targetAmount, setTargetAmount] = useState(goal.target_amount);
  const [targetDate, setTargetDate] = useState(goal.target_date ?? "");
  const [error, setError] = useState<string | null>(null);
  const updateGoal = useUpdateGoal();

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setName(goal.name);
      setTargetAmount(goal.target_amount);
      setTargetDate(goal.target_date ?? "");
      setError(null);
    }
  }

  async function handleSubmit(e: React.BaseSyntheticEvent) {
    e.preventDefault();
    setError(null);
    try {
      await updateGoal.mutateAsync({
        id: goal.id,
        payload: { name, target_amount: targetAmount, target_date: targetDate || null },
      });
      setOpen(false);
      toast.success(t("goals.list.updated"));
    } catch (err) {
      setError(extractErrorMessage(err, t("goals.list.updateError")));
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button variant="ghost" size="sm" />}>
        {t("common.edit")}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("goals.list.editTitle")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="space-y-2">
            <Label htmlFor={`edit-goal-name-${goal.id}`}>{t("goals.form.name")}</Label>
            <Input
              id={`edit-goal-name-${goal.id}`}
              value={name}
              onChange={(e) => setName(stripDigits(e.target.value))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`edit-goal-target-${goal.id}`}>{t("goals.form.targetAmount")}</Label>
            <Input
              id={`edit-goal-target-${goal.id}`}
              type="number"
              step="0.01"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`edit-goal-date-${goal.id}`}>{t("goals.form.targetDate")}</Label>
            <Input
              id={`edit-goal-date-${goal.id}`}
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" type="button" />}>
              {t("common.cancel")}
            </DialogClose>
            <Button type="submit" disabled={updateGoal.isPending}>
              {updateGoal.isPending ? t("common.saving") : t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
