"use client";

import { TransactionForm, TransactionList, CsvImportForm } from "@/features/transactions";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function TransactionsPage() {
  return (
    <main className="p-8 space-y-8">
      <h1 className="text-2xl font-bold">Transactions</h1>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Add Transaction</CardTitle>
          </CardHeader>
          <CardContent>
            <TransactionForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Import from CSV</CardTitle>
          </CardHeader>
          <CardContent>
            <CsvImportForm />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <TransactionList />
        </CardContent>
      </Card>
    </main>
  );
}