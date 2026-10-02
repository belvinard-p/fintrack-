"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useCreateAccount } from "../hooks/use-create-account";
import { AccountType } from "../types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/lib/i18n";
import { stripDigits } from "@/lib/text";
import { extractErrorMessage } from "@/lib/error";

const ACCOUNT_TYPES: AccountType[] = ["checking", "savings", "cash", "other"];

export function AccountForm() {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("other");
  const [openingBalance, setOpeningBalance] = useState("");
  const [error, setError] = useState<string | null>(null);

  const createAccount = useCreateAccount();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    try {
      await createAccount.mutateAsync({
        name,
        type,
        opening_balance: openingBalance || "0",
      });
      setName("");
      setType("other");
      setOpeningBalance("");
      toast.success(t("accounts.form.created"));
    } catch (err) {
      setError(extractErrorMessage(err, t("accounts.form.error")));
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="space-y-2">
        <Label htmlFor="account-name">{t("accounts.form.name")}</Label>
        <Input
          id="account-name"
          value={name}
          onChange={(e) => setName(stripDigits(e.target.value))}
          placeholder={t("accounts.form.namePlaceholder")}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="account-type">{t("accounts.form.type")}</Label>
        <select
          id="account-type"
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
        <Label htmlFor="account-opening-balance">{t("accounts.form.openingBalance")}</Label>
        <Input
          id="account-opening-balance"
          type="number"
          step="0.01"
          value={openingBalance}
          onChange={(e) => setOpeningBalance(e.target.value)}
          placeholder="0.00"
        />
      </div>

      <Button type="submit" className="w-full" disabled={createAccount.isPending}>
        {createAccount.isPending ? t("accounts.form.creating") : t("accounts.form.submit")}
      </Button>
    </form>
  );
}
