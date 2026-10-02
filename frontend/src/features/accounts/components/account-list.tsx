"use client";

import { useAccounts } from "../hooks/use-accounts";
import { AccountItem } from "./account-item";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/lib/i18n";

export function AccountList() {
  const { t } = useLanguage();
  const { data: accounts, isLoading, error } = useAccounts();

  if (isLoading) {
    return (
      <div aria-live="polite" className="space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-lg" />
        ))}
      </div>
    );
  }
  if (error) return <p aria-live="polite" className="text-red-600">{t("accounts.list.failedToLoad")}</p>;
  if (!accounts?.length) return <p aria-live="polite" className="text-muted-foreground">{t("accounts.list.empty")}</p>;

  return (
    <div className="space-y-4">
      {accounts.map((account) => (
        <AccountItem key={account.id} account={account} />
      ))}
    </div>
  );
}
