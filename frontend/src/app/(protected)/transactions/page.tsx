"use client";

import {
  TransactionForm,
  TransactionList,
  CsvImportForm,
  ExportCsvButton,
  ExportPdfButton,
} from "@/features/transactions";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/lib/i18n";

export default function TransactionsPage() {
  const { t } = useLanguage();

  return (
    <main className="p-4 space-y-8 sm:p-8">
      <h1 className="text-2xl font-bold">{t("transactions.title")}</h1>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("transactions.addTransaction")}</CardTitle>
          </CardHeader>
          <CardContent>
            <TransactionForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("transactions.importFromCsv")}</CardTitle>
          </CardHeader>
          <CardContent>
            <CsvImportForm />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>{t("transactions.allTransactions")}</CardTitle>
          <div className="flex gap-2">
            <ExportCsvButton />
            <ExportPdfButton />
          </div>
        </CardHeader>
        <CardContent>
          <TransactionList />
        </CardContent>
      </Card>
    </main>
  );
}
