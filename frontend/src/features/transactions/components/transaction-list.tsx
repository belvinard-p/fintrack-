"use client";

import { useTransactions } from "../hooks/use-transactions";
import { useDeleteTransaction } from "../hooks/use-delete-transaction";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function TransactionList() {
  const { data: transactions, isLoading, error } = useTransactions();
  const deleteTransaction = useDeleteTransaction();

  if (isLoading) return <p>Loading transactions...</p>;
  if (error) return <p className="text-red-600">Failed to load transactions</p>;
  if (!transactions || transactions.length === 0) {
    return <p className="text-gray-500">No transactions yet</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Description</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead>Source</TableHead>
          <TableHead className="w-[80px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((transaction) => (
          <TableRow key={transaction.id}>
            <TableCell>{transaction.date}</TableCell>
            <TableCell>{transaction.description}</TableCell>
            <TableCell className="text-right">{transaction.amount}</TableCell>
            <TableCell className="capitalize">{transaction.source.replace("_", " ")}</TableCell>
            <TableCell>
              <AlertDialog>
                <AlertDialogTrigger
                  render={
                    <Button variant="ghost" size="sm">
                      Delete
                    </Button>
                  }
                />
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this transaction?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. "{transaction.description}" will be
                      permanently removed.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteTransaction.mutate(transaction.id)}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}