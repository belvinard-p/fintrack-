"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useGoals } from "../hooks/use-goals";
import { useContributeToGoal } from "../hooks/use-contribute-to-goal";
import { useUpdateGoal } from "../hooks/use-update-goal";
import { useDeleteGoal } from "../hooks/use-delete-goal";
import { useCurrentUser } from "@/features/auth";
import { Goal } from "../types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
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

function progressPercent(goal: Goal): number {
  const current = parseFloat(goal.current_amount);
  const target = parseFloat(goal.target_amount);
  if (target <= 0) return 0;
  return Math.min(100, Math.round((current / target) * 100));
}

function ContributeDialog({ goal }: Readonly<{ goal: Goal }>) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const contribute = useContributeToGoal();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await contribute.mutateAsync({ id: goal.id, payload: { amount } });
      setAmount("");
      setOpen(false);
      toast.success(t("goals.list.fundsAdded"));
    } catch (err: any) {
      setError(extractErrorMessage(err, t("goals.list.contributeError")));
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        {t("goals.list.addFunds")}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("goals.list.addFundsTitle", { name: goal.name })}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="space-y-2">
            <Label htmlFor={`contribute-${goal.id}`}>{t("goals.list.amount")}</Label>
            <Input
              id={`contribute-${goal.id}`}
              type="number"
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
            <Button type="submit" disabled={contribute.isPending}>
              {contribute.isPending ? t("goals.list.saving") : t("goals.list.add")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditGoalDialog({ goal }: Readonly<{ goal: Goal }>) {
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    try {
      await updateGoal.mutateAsync({
        id: goal.id,
        payload: {
          name,
          target_amount: targetAmount,
          target_date: targetDate || null,
        },
      });
      setOpen(false);
      toast.success(t("goals.list.updated"));
    } catch (err: any) {
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
              onChange={(e) => setName(e.target.value)}
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

export function GoalList() {
  const { t } = useLanguage();
  const { data: goals, isLoading, error } = useGoals();
  const deleteGoal = useDeleteGoal();
  const { data: currentUser } = useCurrentUser();

  if (isLoading) {
    return (
      <div aria-live="polite" className="space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-lg" />
        ))}
      </div>
    );
  }
  if (error) return <p aria-live="polite" className="text-red-600">{t("goals.list.failedToLoad")}</p>;
  if (!goals || goals.length === 0) {
    return <p aria-live="polite" className="text-muted-foreground">{t("goals.list.empty")}</p>;
  }

  return (
    <div className="space-y-4">
      {goals.map((goal) => (
        <div key={goal.id} className="border rounded-lg p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-medium">{goal.name}</p>
              <p className="text-sm text-muted-foreground">
                {goal.current_amount} / {goal.target_amount}
                {currentUser ? ` · ${currentUser.email}` : ""}
              </p>
            </div>
            {goal.is_completed && <Badge>{t("goals.list.goalReached")}</Badge>}
          </div>

          <Progress value={progressPercent(goal)} />

          <div className="flex flex-wrap gap-2">
            <ContributeDialog goal={goal} />
            <EditGoalDialog goal={goal} />
            <AlertDialog>
              <AlertDialogTrigger render={<Button variant="ghost" size="sm" />}>
                {t("common.delete")}
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("goals.list.deleteTitle", { name: goal.name })}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t("goals.list.deleteDescription")}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() =>
                      deleteGoal.mutate(goal.id, {
                        onSuccess: () => toast.success(t("goals.list.deleted")),
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
  );
}
