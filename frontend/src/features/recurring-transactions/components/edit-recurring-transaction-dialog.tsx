"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useUpdateRecurringTransaction } from "../hooks/use-update-recurring-transaction";
import { useCategories } from "@/features/categories";
import { RecurringTransaction } from "../types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CategoryDot } from "@/components/category-dot";
import { TransactionTypeToggle } from "@/components/transaction-type-toggle";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/lib/i18n";
import { extractErrorMessage } from "@/lib/error";
import {
  getTransactionType,
  toAbsoluteAmount,
  toSignedAmount,
  type TransactionType,
} from "@/lib/amount";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

export function EditRecurringTransactionDialog({ item }: Readonly<{ item: RecurringTransaction }>) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState(item.description);
  const [type, setType] = useState<TransactionType>(getTransactionType(item.amount));
  const [amount, setAmount] = useState(toAbsoluteAmount(item.amount));
  const [dayOfMonth, setDayOfMonth] = useState(String(item.day_of_month));
  const [categoryId, setCategoryId] = useState(item.category_id ? String(item.category_id) : "");
  const [error, setError] = useState<string | null>(null);

  const updateRecurring = useUpdateRecurringTransaction();
  const { data: categories } = useCategories();

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setDescription(item.description);
      setType(getTransactionType(item.amount));
      setAmount(toAbsoluteAmount(item.amount));
      setDayOfMonth(String(item.day_of_month));
      setCategoryId(item.category_id ? String(item.category_id) : "");
      setError(null);
    }
  }

  async function handleSubmit(e: React.BaseSyntheticEvent) {
    e.preventDefault();
    setError(null);

    try {
      await updateRecurring.mutateAsync({
        id: item.id,
        payload: {
          description,
          amount: toSignedAmount(amount, type),
          day_of_month: Number.parseInt(dayOfMonth, 10),
          category_id: categoryId ? Number.parseInt(categoryId, 10) : null,
        },
      });
      setOpen(false);
      toast.success(t("recurring.list.updated"));
    } catch (err: any) {
      setError(extractErrorMessage(err, t("recurring.list.updateError")));
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button variant="ghost" size="sm" />}>
        {t("common.edit")}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("recurring.list.editTitle")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="space-y-2">
            <Label htmlFor={`edit-recurring-description-${item.id}`}>
              {t("recurring.form.description")}
            </Label>
            <Input
              id={`edit-recurring-description-${item.id}`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>{t("recurring.form.amount")}</Label>
            <TransactionTypeToggle
              value={type}
              onChange={setType}
              expenseLabel={t("common.expense")}
              incomeLabel={t("common.income")}
              idPrefix={`edit-recurring-type-${item.id}`}
            />
            <Input
              id={`edit-recurring-amount-${item.id}`}
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`edit-recurring-day-${item.id}`}>{t("recurring.form.dayOfMonth")}</Label>
            <Input
              id={`edit-recurring-day-${item.id}`}
              type="number"
              min={1}
              max={28}
              value={dayOfMonth}
              onChange={(e) => setDayOfMonth(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`edit-recurring-category-${item.id}`}>{t("recurring.form.category")}</Label>
            <Select
              value={categoryId}
              onValueChange={(value) => setCategoryId(value ?? "")}
              items={categories?.map((category) => ({
                value: String(category.id),
                label: category.name,
              }))}
            >
              <SelectTrigger id={`edit-recurring-category-${item.id}`} className="w-full">
                <SelectValue placeholder={t("recurring.form.uncategorized")} />
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
            <Button type="submit" disabled={updateRecurring.isPending}>
              {updateRecurring.isPending ? t("common.saving") : t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
