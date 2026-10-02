"use client";

import { useAccounts } from "../hooks/use-accounts";
import { useDebts } from "@/features/debts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/lib/i18n";

export function NetWorthCard() {
  const { t } = useLanguage();
  const { data: accounts, isLoading: accountsLoading } = useAccounts();
  const { data: debts, isLoading: debtsLoading } = useDebts();
  const isLoading = accountsLoading || debtsLoading;

  const totalAssets = accounts?.reduce((sum, account) => sum + Number.parseFloat(account.balance), 0) ?? 0;
  const totalDebts = debts?.reduce((sum, debt) => sum + Number.parseFloat(debt.remaining_balance), 0) ?? 0;
  const netWorth = totalAssets - totalDebts;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("accounts.netWorth.title")}</CardTitle>
        <p className="text-xs text-muted-foreground">{t("accounts.netWorth.hint")}</p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-9 w-32" />
        ) : (
          <p className="text-3xl font-bold">{netWorth.toFixed(2)}</p>
        )}
      </CardContent>
    </Card>
  );
}
