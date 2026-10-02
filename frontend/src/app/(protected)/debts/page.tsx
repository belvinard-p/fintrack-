"use client";

import { DebtForm, DebtList } from "@/features/debts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/lib/i18n";

export default function DebtsPage() {
  const { t } = useLanguage();

  return (
    <main className="p-4 space-y-8 sm:p-8">
      <h1 className="text-2xl font-bold">{t("debts.title")}</h1>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("debts.newDebt")}</CardTitle>
          </CardHeader>
          <CardContent>
            <DebtForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("debts.yourDebts")}</CardTitle>
          </CardHeader>
          <CardContent>
            <DebtList />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
