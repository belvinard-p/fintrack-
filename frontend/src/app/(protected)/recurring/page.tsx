"use client";

import { RecurringTransactionForm, RecurringTransactionList } from "@/features/recurring-transactions";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function RecurringTransactionsPage() {
  return (
    <main className="p-4 space-y-8 sm:p-8">
      <h1 className="text-2xl font-bold">Recurring Transactions</h1>
      <p className="text-sm text-gray-500">
        Rent, subscriptions, salary — set them up once and they'll be added automatically
        each month.
      </p>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>New Recurring Transaction</CardTitle>
          </CardHeader>
          <CardContent>
            <RecurringTransactionForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Recurring Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <RecurringTransactionList />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
