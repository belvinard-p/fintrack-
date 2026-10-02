"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useUpdateAccount } from "../hooks/use-update-account";
import { Account, AccountType } from "../types";
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

const ACCOUNT_TYPES: AccountType[] = ["checking", "savings", "cash", "other"];

export function EditAccountDialog({ account }: Readonly<{ account: Account }>) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(account.name);
  const [type, setType] = useState<AccountType>(account.type);
  const [openingBalance, setOpeningBalance] = useState(account.opening_balance);
  const [error, setError] = useState<string | null>(null);
  const updateAccount = useUpdateAccount();

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setName(account.name);
      setType(account.type);
      setOpeningBalance(account.opening_balance);
      setError(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await updateAccount.mutateAsync({
        id: account.id,
        payload: { name, type, opening_balance: openingBalance },
      });
      setOpen(false);
      toast.success(t("accounts.list.updated"));
    } catch (err) {
      setError(extractErrorMessage(err, t("accounts.list.updateError")));
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button variant="ghost" size="sm" />}>
        {t("common.edit")}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("accounts.list.editTitle")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="space-y-2">
            <Label htmlFor={`edit-account-name-${account.id}`}>{t("accounts.form.name")}</Label>
            <Input
              id={`edit-account-name-${account.id}`}
              value={name}
              onChange={(e) => setName(stripDigits(e.target.value))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`edit-account-type-${account.id}`}>{t("accounts.form.type")}</Label>
            <select
              id={`edit-account-type-${account.id}`}
              value={type}
              onChange={(e) => setType(e.target.value as AccountType)}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-all duration-200 ease-in-out outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
            >
              {ACCOUNT_TYPES.map((value) => (
                <option key={value} value={value}>
                  {t(`accounts.types.${value}`)}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`edit-account-balance-${account.id}`}>{t("accounts.form.openingBalance")}</Label>
            <Input
              id={`edit-account-balance-${account.id}`}
              type="number"
              step="0.01"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(e.target.value)}
              required
            />
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" type="button" />}>
              {t("common.cancel")}
            </DialogClose>
            <Button type="submit" disabled={updateAccount.isPending}>
              {updateAccount.isPending ? t("common.saving") : t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
