"use client";

import { AccountForm, AccountList } from "@/features/accounts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/lib/i18n";

export default function AccountsPage() {
  const { t } = useLanguage();

  return (
    <main className="p-4 space-y-8 sm:p-8">
      <h1 className="text-2xl font-bold">{t("accounts.title")}</h1>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("accounts.newAccount")}</CardTitle>
          </CardHeader>
          <CardContent>
            <AccountForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("accounts.yourAccounts")}</CardTitle>
          </CardHeader>
          <CardContent>
            <AccountList />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
