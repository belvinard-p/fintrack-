"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useContributeToGoal } from "../hooks/use-contribute-to-goal";
import { Goal } from "../types";
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

export function ContributeGoalDialog({ goal }: Readonly<{ goal: Goal }>) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const contribute = useContributeToGoal();

  async function handleSubmit(e: React.BaseSyntheticEvent) {
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
