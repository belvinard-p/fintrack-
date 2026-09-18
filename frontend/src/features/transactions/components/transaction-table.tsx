"use client";

import { Transaction } from "../types";
import { EditTransactionDialog } from "./edit-transaction-dialog";
import { DeleteTransactionDialog } from "./delete-transaction-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLanguage } from "@/lib/i18n";
import { amountColorClass, formatSignedAmount } from "@/lib/amount";

interface TransactionTableProps {
  transactions: Transaction[];
  onDelete: (id: number) => void;
  sourceLabel: (source: string) => string;
}

export function TransactionTable({
  transactions,
  onDelete,
  sourceLabel,
}: Readonly<TransactionTableProps>) {
  const { t } = useLanguage();

  return (
    <div className="hidden sm:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("transactions.list.date")}</TableHead>
            <TableHead>{t("transactions.list.description")}</TableHead>
            <TableHead className="text-right">{t("transactions.list.amount")}</TableHead>
            <TableHead>{t("transactions.list.source")}</TableHead>
            <TableHead className="w-[140px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell>{transaction.date}</TableCell>
              <TableCell>{transaction.description}</TableCell>
              <TableCell className={`text-right font-medium ${amountColorClass(transaction.amount)}`}>
                {formatSignedAmount(transaction.amount)}
              </TableCell>
              <TableCell className="capitalize">
                {sourceLabel(transaction.source)}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <EditTransactionDialog transaction={transaction} />
                  <DeleteTransactionDialog
                    transaction={transaction}
                    onDelete={() => onDelete(transaction.id)}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
