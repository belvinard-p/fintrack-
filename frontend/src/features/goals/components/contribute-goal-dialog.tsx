"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useContributeToGoal } from "../hooks/use-contribute-to-goal";
import { Goal } from "../types";
import { useAccounts } from "@/features/accounts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Combobox,
  ComboboxContent,
  ComboboxItem,
  ComboboxTrigger,
  ComboboxValue,
} from "@/components/ui/combobox";
import { useLanguage } from "@/lib/i18n";
import { extractErrorMessage } from "@/lib/error";
import { getTodayIso } from "@/lib/date";
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
  const [date, setDate] = useState(getTodayIso());
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const contribute = useContributeToGoal();
  const { data: accounts } = useAccounts();
  const selectedAccountId = accountId || (accounts?.[0] ? String(accounts[0].id) : "");

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setDate(getTodayIso());
      setAmount("");
      setAccountId("");
      setError(null);
    }
  }

  async function handleSubmit(e: React.BaseSyntheticEvent) {
    e.preventDefault();
    setError(null);
    try {
      await contribute.mutateAsync({
        id: goal.id,
        payload: { date, amount, account_id: Number(selectedAccountId) },
      });
      setOpen(false);
      toast.success(t("goals.list.fundsAdded"));
    } catch (err) {
      setError(extractErrorMessage(err, t("goals.list.contributeError")));
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
            <Label htmlFor={`contribute-date-${goal.id}`}>{t("goals.list.date")}</Label>
            <Input
              id={`contribute-date-${goal.id}`}
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={getTodayIso()}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`contribute-${goal.id}`}>{t("goals.list.amount")}</Label>
            <Input
              id={`contribute-${goal.id}`}
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`contribute-account-${goal.id}`}>{t("goals.list.account")}</Label>
            <Combobox
              value={selectedAccountId}
              onValueChange={(value) => setAccountId(value ?? "")}
              items={accounts?.map((account) => ({
                value: String(account.id),
                label: account.name,
              }))}
            >
              <ComboboxTrigger id={`contribute-account-${goal.id}`} className="w-full">
                <ComboboxValue placeholder={t("goals.list.selectAccount")} />
              </ComboboxTrigger>
              <ComboboxContent
                searchPlaceholder={t("goals.list.searchAccount")}
                emptyMessage={t("goals.list.noAccountFound")}
              >
                {accounts?.map((account) => (
                  <ComboboxItem key={account.id} value={String(account.id)}>
                    {account.name}
                  </ComboboxItem>
                ))}
              </ComboboxContent>
            </Combobox>
          </div>

          <DialogFooter>
            <DialogClose render={<Button variant="outline" type="button" />}>
              {t("common.cancel")}
            </DialogClose>
            <Button type="submit" disabled={contribute.isPending || !amount || !selectedAccountId}>
              {contribute.isPending ? t("goals.list.saving") : t("goals.list.add")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
