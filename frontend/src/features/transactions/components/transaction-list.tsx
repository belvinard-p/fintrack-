"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useTransactions } from "../hooks/use-transactions";
import { useDeleteTransaction } from "../hooks/use-delete-transaction";
import { Transaction } from "../types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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

const PAGE_SIZE = 20;

function DeleteTransactionDialog({
  transaction,
  onDelete,
}: Readonly<{ transaction: Transaction; onDelete: () => void }>) {
  return (
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
            This action cannot be undone. "{transaction.description}" will be permanently
            removed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function TransactionList() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const { data, isLoading, error } = useTransactions({
    page,
    page_size: PAGE_SIZE,
    search: search || undefined,
  });
  const deleteTransaction = useDeleteTransaction();

  function handleDelete(id: number) {
    deleteTransaction.mutate(id, {
      onSuccess: () => toast.success("Transaction deleted"),
    });
  }

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search by description..."
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        className="max-w-xs"
      />

      <div aria-live="polite">
        {isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        )}
        {error && <p className="text-red-600">Failed to load transactions</p>}
        {data && data.items.length === 0 && (
          <p className="text-muted-foreground">No transactions found</p>
        )}
      </div>

      {data && data.items.length > 0 && (
        <>
          {/* Card layout on small screens — a data table doesn't reflow well below sm */}
          <div className="space-y-3 sm:hidden">
            {data.items.map((transaction) => (
              <div key={transaction.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{transaction.description}</p>
                    <p className="text-sm text-muted-foreground">{transaction.date}</p>
                  </div>
                  <p className="font-medium whitespace-nowrap">{transaction.amount}</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground capitalize">
                    {transaction.source.replace("_", " ")}
                  </p>
                  <DeleteTransactionDialog
                    transaction={transaction}
                    onDelete={() => handleDelete(transaction.id)}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Table layout from sm upward */}
          <div className="hidden sm:block">
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
                {data.items.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{transaction.date}</TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell className="text-right">{transaction.amount}</TableCell>
                    <TableCell className="capitalize">
                      {transaction.source.replace("_", " ")}
                    </TableCell>
                    <TableCell>
                      <DeleteTransactionDialog
                        transaction={transaction}
                        onDelete={() => handleDelete(transaction.id)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              Page {data.page} of {data.total_pages} ({data.total} total)
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.total_pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
