"use client";

import { Account } from "../types";
import { EditAccountDialog } from "./edit-account-dialog";
import { DeleteAccountDialog } from "./delete-account-dialog";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/lib/i18n";

interface AccountItemProps {
  account: Account;
}

export function AccountItem({ account }: Readonly<AccountItemProps>) {
  const { t } = useLanguage();

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium">{account.name}</p>
            <Badge variant="secondary">{t(`accounts.types.${account.type}`)}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {t("accounts.list.openingBalance", { amount: account.opening_balance })}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">{t("accounts.list.balance")}</p>
          <p className="text-lg font-semibold">{account.balance}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <EditAccountDialog account={account} />
        <DeleteAccountDialog account={account} />
      </div>
    </div>
  );
}
