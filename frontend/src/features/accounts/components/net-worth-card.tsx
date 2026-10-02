"use client";

import { useAccounts } from "../hooks/use-accounts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/lib/i18n";

export function NetWorthCard() {
  const { t } = useLanguage();
  const { data: accounts, isLoading } = useAccounts();

  const netWorth = accounts?.reduce((sum, account) => sum + Number.parseFloat(account.balance), 0) ?? 0;

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
