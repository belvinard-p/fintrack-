"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useUpdateTransaction } from "../hooks/use-update-transaction";
import { useCategories } from "@/features/categories";
import { Transaction } from "../types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CategoryDot } from "@/components/category-dot";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/lib/i18n";
import { extractErrorMessage } from "@/lib/error";
import { getTodayIso } from "@/lib/date";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

export function EditTransactionDialog({ transaction }: Readonly<{ transaction: Transaction }>) {
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

  async function handleSubmit(e: React.BaseSyntheticEvent) {
    e.preventDefault();
    setError(null);

    try {
      await updateTransaction.mutateAsync({
        id: transaction.id,
        payload: {
          date,
          description,
          amount,
          category_id: categoryId ? Number.parseInt(categoryId, 10) : null,
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
            <DialogClose render={<Button variant="outline" type="button" />}>
              {t("common.cancel")}
            </DialogClose>
            <Button type="submit" disabled={updateTransaction.isPending}>
              {updateTransaction.isPending ? t("common.saving") : t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
