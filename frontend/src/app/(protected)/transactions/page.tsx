"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TransactionForm, TransactionList } from "@/features/transactions";

export default function TransactionsPage() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-6">Transactions</h1>

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Add Transaction</CardTitle>
        </CardHeader>
        <CardContent>
          <TransactionForm />
        </CardContent>
      </Card>

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
