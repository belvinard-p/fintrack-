"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useTransactions } from "../hooks/use-transactions";
import { useDeleteTransaction } from "../hooks/use-delete-transaction";
import { useUpdateTransaction } from "../hooks/use-update-transaction";
import { useCategories } from "@/features/categories";
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
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { CategoryDot } from "@/components/category-dot";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/lib/i18n";
import { amountColorClass, formatSignedAmount } from "@/lib/amount";
import { extractErrorMessage } from "@/lib/error";
import { getTodayIso } from "@/lib/date";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
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
  const { t } = useLanguage();

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button variant="ghost" size="sm">
            {t("common.delete")}
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("transactions.list.deleteTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("transactions.list.deleteDescription", { description: transaction.description })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={onDelete}>{t("common.delete")}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function EditTransactionDialog({ transaction }: Readonly<{ transaction: Transaction }>) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(transaction.date);
  const [description, setDescription] = useState(transaction.description);
  const [amount, setAmount] = useState(transaction.amount);
  const [categoryId, setCategoryId] = useState(
    transaction.category_id ? String(transaction.category_id) : ""
  );
  const [error, setError] = useState<string | null>(null);

  const updateTransaction = useUpdateTransaction();
  const { data: categories } = useCategories();

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setDate(transaction.date);
      setDescription(transaction.description);
      setAmount(transaction.amount);
      setCategoryId(transaction.category_id ? String(transaction.category_id) : "");
      setError(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    try {
      await updateTransaction.mutateAsync({
        id: transaction.id,
        payload: {
          date,
          description,
          amount,
          category_id: categoryId ? parseInt(categoryId, 10) : null,
        },
      });
      setOpen(false);
      toast.success(t("transactions.list.updated"));
    } catch (err: any) {
      setError(extractErrorMessage(err, t("transactions.list.updateError")));
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button variant="ghost" size="sm" />}>
        {t("common.edit")}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("transactions.list.editTitle")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="space-y-2">
            <Label htmlFor={`edit-date-${transaction.id}`}>{t("transactions.form.date")}</Label>
            <Input
              id={`edit-date-${transaction.id}`}
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={getTodayIso()}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`edit-description-${transaction.id}`}>
              {t("transactions.form.description")}
            </Label>
            <Input
              id={`edit-description-${transaction.id}`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`edit-amount-${transaction.id}`}>{t("transactions.form.amount")}</Label>
            <Input
              id={`edit-amount-${transaction.id}`}
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`edit-category-${transaction.id}`}>{t("transactions.form.category")}</Label>
            <Select
              value={categoryId}
              onValueChange={(value) => setCategoryId(value ?? "")}
              items={categories?.map((category) => ({
                value: String(category.id),
                label: category.name,
              }))}
            >
              <SelectTrigger id={`edit-category-${transaction.id}`} className="w-full">
                <SelectValue placeholder={t("transactions.form.uncategorized")} />
              </SelectTrigger>
              <SelectContent>
                {categories?.map((category) => (
                  <SelectItem key={category.id} value={String(category.id)}>
                    <span className="flex items-center gap-2">
                      <CategoryDot categoryId={category.id} />
                      {category.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={updateTransaction.isPending}>
              {updateTransaction.isPending ? t("common.saving") : t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function TransactionList() {
  const { t } = useLanguage();
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
      onSuccess: () => toast.success(t("transactions.list.deleted")),
    });
  }

  function sourceLabel(source: string): string {
    if (source === "manual") return t("transactions.list.sourceManual");
    if (source === "csv_import") return t("transactions.list.sourceCsvImport");
    if (source === "recurring") return t("transactions.list.sourceRecurring");
    return source.replace("_", " ");
  }

  return (
    <div className="space-y-4">
      <Input
        placeholder={t("transactions.list.searchPlaceholder")}
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
        {error && <p className="text-red-600">{t("transactions.list.failedToLoad")}</p>}
        {data && data.items.length === 0 && (
          <p className="text-muted-foreground">{t("transactions.list.empty")}</p>
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
                  <p className={`font-medium whitespace-nowrap ${amountColorClass(transaction.amount)}`}>
                    {formatSignedAmount(transaction.amount)}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground capitalize">
                    {sourceLabel(transaction.source)}
                  </p>
                  <div className="flex gap-2">
                    <EditTransactionDialog transaction={transaction} />
                    <DeleteTransactionDialog
                      transaction={transaction}
                      onDelete={() => handleDelete(transaction.id)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Table layout from sm upward */}
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
                {data.items.map((transaction) => (
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
                          onDelete={() => handleDelete(transaction.id)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              {t("transactions.list.page", {
                page: data.page,
                totalPages: data.total_pages,
                total: data.total,
              })}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                {t("transactions.list.previous")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.total_pages}
                onClick={() => setPage((p) => p + 1)}
              >
                {t("transactions.list.next")}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
