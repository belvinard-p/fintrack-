"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useCreateDebtPayment } from "../hooks/use-create-debt-payment";
import { Debt } from "../types";
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

export function LogPaymentDialog({ debt }: Readonly<{ debt: Debt }>) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(getTodayIso());
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const createPayment = useCreateDebtPayment(debt.id);
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const payment = await createPayment.mutateAsync({
        date,
        amount,
        account_id: Number(selectedAccountId),
      });
      setOpen(false);
      toast.success(
        t("debts.payment.logged", {
          principal: payment.principal_portion,
          interest: payment.interest_portion,
        })
      );
    } catch (err) {
      setError(extractErrorMessage(err, t("debts.payment.error")));
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        {t("debts.payment.logPayment")}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("debts.payment.logPaymentTitle", { name: debt.name })}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="space-y-2">
            <Label htmlFor={`payment-date-${debt.id}`}>{t("debts.payment.date")}</Label>
            <Input
              id={`payment-date-${debt.id}`}
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={getTodayIso()}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`payment-amount-${debt.id}`}>{t("debts.payment.amount")}</Label>
            <Input
              id={`payment-amount-${debt.id}`}
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`payment-account-${debt.id}`}>{t("debts.payment.account")}</Label>
            <Combobox
              value={selectedAccountId}
              onValueChange={(value) => setAccountId(value ?? "")}
              items={accounts?.map((account) => ({
                value: String(account.id),
                label: account.name,
              }))}
            >
              <ComboboxTrigger id={`payment-account-${debt.id}`} className="w-full">
                <ComboboxValue placeholder={t("debts.payment.selectAccount")} />
              </ComboboxTrigger>
              <ComboboxContent
                searchPlaceholder={t("debts.payment.searchAccount")}
                emptyMessage={t("debts.payment.noAccountFound")}
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
            <Button type="submit" disabled={createPayment.isPending || !amount || !selectedAccountId}>
              {createPayment.isPending ? t("debts.payment.logging") : t("debts.payment.submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
