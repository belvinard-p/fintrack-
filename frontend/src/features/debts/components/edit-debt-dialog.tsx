"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useUpdateDebt } from "../hooks/use-update-debt";
import { Debt, DebtType } from "../types";
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

const DEBT_TYPES: DebtType[] = ["loan", "credit_card", "other"];

export function EditDebtDialog({ debt }: Readonly<{ debt: Debt }>) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(debt.name);
  const [type, setType] = useState<DebtType>(debt.type);
  const [principal, setPrincipal] = useState(debt.principal);
  const [annualRate, setAnnualRate] = useState(debt.annual_rate ?? "");
  const [error, setError] = useState<string | null>(null);
  const updateDebt = useUpdateDebt();

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setName(debt.name);
      setType(debt.type);
      setPrincipal(debt.principal);
      setAnnualRate(debt.annual_rate ?? "");
      setError(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await updateDebt.mutateAsync({
        id: debt.id,
        payload: { name, type, principal, annual_rate: annualRate || null },
      });
      setOpen(false);
      toast.success(t("debts.list.updated"));
    } catch (err) {
      setError(extractErrorMessage(err, t("debts.list.updateError")));
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button variant="ghost" size="sm" />}>
        {t("common.edit")}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("debts.list.editTitle")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="space-y-2">
            <Label htmlFor={`edit-debt-name-${debt.id}`}>{t("debts.form.name")}</Label>
            <Input
              id={`edit-debt-name-${debt.id}`}
              value={name}
              onChange={(e) => setName(stripDigits(e.target.value))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`edit-debt-type-${debt.id}`}>{t("debts.form.type")}</Label>
            <select
              id={`edit-debt-type-${debt.id}`}
              value={type}
              onChange={(e) => setType(e.target.value as DebtType)}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-all duration-200 ease-in-out outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
            >
              {DEBT_TYPES.map((value) => (
                <option key={value} value={value}>
                  {t(`debts.types.${value}`)}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`edit-debt-principal-${debt.id}`}>{t("debts.form.principal")}</Label>
            <Input
              id={`edit-debt-principal-${debt.id}`}
              type="number"
              min="0.01"
              step="0.01"
              value={principal}
              onChange={(e) => setPrincipal(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`edit-debt-rate-${debt.id}`}>{t("debts.form.annualRate")}</Label>
            <Input
              id={`edit-debt-rate-${debt.id}`}
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={annualRate}
              onChange={(e) => setAnnualRate(e.target.value)}
              placeholder={t("debts.form.annualRatePlaceholder")}
            />
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" type="button" />}>
              {t("common.cancel")}
            </DialogClose>
            <Button type="submit" disabled={updateDebt.isPending}>
              {updateDebt.isPending ? t("common.saving") : t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
