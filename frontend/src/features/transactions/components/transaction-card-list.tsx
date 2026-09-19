"use client";

import { Transaction } from "../types";
import { EditTransactionDialog } from "./edit-transaction-dialog";
import { DeleteTransactionDialog } from "./delete-transaction-dialog";
import { amountColorClass, formatSignedAmount } from "@/lib/amount";
import { formatCreatedTime } from "@/lib/date";
import { useLanguage } from "@/lib/i18n";

interface TransactionCardListProps {
  transactions: Transaction[];
  onDelete: (id: number) => void;
  sourceLabel: (source: string) => string;
}

export function TransactionCardList({
  transactions,
  onDelete,
  sourceLabel,
}: Readonly<TransactionCardListProps>) {
  const { language } = useLanguage();

  return (
    <div className="space-y-3 sm:hidden">
      {transactions.map((transaction) => (
        <div
          key={transaction.id}
          className="border rounded-lg p-4 space-y-2"
          role="article"
          aria-label={transaction.description}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium">{transaction.description}</p>
              <p className="text-sm text-muted-foreground">
                {transaction.date}
                {formatCreatedTime(transaction.created_at, language) &&
                  ` · ${formatCreatedTime(transaction.created_at, language)}`}
              </p>
            </div>
            <p className={`font-medium whitespace-nowrap ${amountColorClass(transaction.amount)}`}>
              {formatSignedAmount(transaction.amount)}
            </p>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground capitalize">
              {sourceLabel(transaction.source)}
            </p>
            <div className="flex gap-2" aria-label="Transaction actions">
              <EditTransactionDialog transaction={transaction} />
              <DeleteTransactionDialog
                transaction={transaction}
                onDelete={() => onDelete(transaction.id)}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
