"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useMonthlyIncome } from "../hooks/use-monthly-income";
import { useSetMonthlyIncome } from "../hooks/use-set-monthly-income";
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

export function MonthlyIncomeDialog({ month }: Readonly<{ month: string }>) {
  const { t } = useLanguage();
  const { data: income } = useMonthlyIncome(month);
  const setIncome = useSetMonthlyIncome();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setAmount(income?.is_set ? String(Number(income.amount)) : "");
      setError(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await setIncome.mutateAsync({ month, amount });
      setOpen(false);
      toast.success(t("income.saved"));
    } catch (err) {
      setError(extractErrorMessage(err, t("income.error")));
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        {income?.is_set ? t("income.edit") : t("income.set")}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("income.dialogTitle", { month })}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="space-y-2">
            <Label htmlFor={`income-amount-${month}`}>{t("income.amountLabel")}</Label>
            <Input
              id={`income-amount-${month}`}
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">{t("income.hint")}</p>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" type="button" />}>
              {t("common.cancel")}
            </DialogClose>
            <Button type="submit" disabled={setIncome.isPending || !amount}>
              {setIncome.isPending ? t("common.saving") : t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
