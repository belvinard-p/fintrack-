"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useUpdateTransaction } from "../hooks/use-update-transaction";
import { useCategories } from "@/features/categories";
import { useAccounts } from "@/features/accounts";
import { useCreateRecurringTransaction } from "@/features/recurring-transactions";
import { Transaction } from "../types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CategoryDot } from "@/components/category-dot";
import { TransactionTypeToggle } from "@/components/transaction-type-toggle";
import { FrequencyToggle, type TransactionFrequency } from "@/components/frequency-toggle";
import {
  Combobox,
  ComboboxContent,
  ComboboxItem,
  ComboboxTrigger,
  ComboboxValue,
} from "@/components/ui/combobox";
import { useLanguage } from "@/lib/i18n";
import { stripDigits } from "@/lib/text";
import { extractErrorMessage } from "@/lib/error";
import {
  getTodayIso,
  getFirstDayOfCurrentMonthIso,
  getFirstDayOfNextMonthIso,
  isLockedMonth,
} from "@/lib/date";
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

export function EditTransactionDialog({ transaction }: Readonly<{ transaction: Transaction }>) {
  const { t } = useLanguage();
  const locked = isLockedMonth(transaction.date);
  const canOfferRecurring = transaction.source !== "recurring";
  const canEditAmountAndDate = !["debt_payment", "goal_contribution"].includes(transaction.source);
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(transaction.date);
  const [description, setDescription] = useState(transaction.description);
  const [type, setType] = useState<TransactionType>(getTransactionType(transaction.amount));
  const [amount, setAmount] = useState(toAbsoluteAmount(transaction.amount));
  const [categoryId, setCategoryId] = useState(
    transaction.category_id ? String(transaction.category_id) : ""
  );
  const [accountId, setAccountId] = useState(String(transaction.account_id));
  const [frequency, setFrequency] = useState<TransactionFrequency>("once");
  const [error, setError] = useState<string | null>(null);

  const updateTransaction = useUpdateTransaction();
  const createRecurring = useCreateRecurringTransaction();
  const { data: categories } = useCategories();
  const { data: accounts } = useAccounts();

  const dayOfMonth = date ? Math.min(Number(date.split("-")[2]), 28) : null;

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setDate(transaction.date);
      setDescription(transaction.description);
      setType(getTransactionType(transaction.amount));
      setAmount(toAbsoluteAmount(transaction.amount));
      setCategoryId(transaction.category_id ? String(transaction.category_id) : "");
      setAccountId(String(transaction.account_id));
      setFrequency("once");
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
          account_id: Number(accountId),
          date,
          description,
          amount: toSignedAmount(amount, type),
          category_id: categoryId ? Number.parseInt(categoryId, 10) : null,
        },
      });

      if (frequency === "recurring") {
        await createRecurring.mutateAsync({
          account_id: Number(accountId),
          description,
          amount: toSignedAmount(amount, type),
          day_of_month: dayOfMonth as number,
          start_date: getFirstDayOfNextMonthIso(),
          category_id: categoryId ? Number.parseInt(categoryId, 10) : null,
        });
        toast.success(t("transactions.list.updatedAndRecurring"));
      } else {
        toast.success(t("transactions.list.updated"));
      }
      setOpen(false);
    } catch (err) {
      setError(extractErrorMessage(err, t("transactions.list.updateError")));
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            disabled={locked}
            title={locked ? t("transactions.list.monthLocked") : undefined}
          />
        }
      >
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
              min={getFirstDayOfCurrentMonthIso()}
              max={getTodayIso()}
              disabled={!canEditAmountAndDate}
              title={!canEditAmountAndDate ? t("transactions.list.linkedTransactionAmountDateLocked") : undefined}
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
              onChange={(e) => setDescription(stripDigits(e.target.value))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`edit-amount-${transaction.id}`}>{t("transactions.form.amount")}</Label>
            {getTransactionType(transaction.amount) === "income" && (
            <TransactionTypeToggle
              value={type}
              onChange={setType}
              expenseLabel={t("common.expense")}
              incomeLabel={t("common.income")}
              idPrefix={`edit-transaction-type-${transaction.id}`}
            />
            )}
            <Input
              id={`edit-amount-${transaction.id}`}
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={!canEditAmountAndDate}
              title={!canEditAmountAndDate ? t("transactions.list.linkedTransactionAmountDateLocked") : undefined}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`edit-account-${transaction.id}`}>{t("transactions.form.account")}</Label>
            <Combobox
              value={accountId}
              onValueChange={(value) => setAccountId(value ?? "")}
              items={accounts?.map((account) => ({
                value: String(account.id),
                label: account.name,
              }))}
            >
              <ComboboxTrigger id={`edit-account-${transaction.id}`} className="w-full">
                <ComboboxValue placeholder={t("transactions.form.selectAccount")} />
              </ComboboxTrigger>
              <ComboboxContent
                searchPlaceholder={t("transactions.form.searchAccount")}
                emptyMessage={t("transactions.form.noAccountFound")}
              >
                {accounts?.map((account) => (
                  <ComboboxItem key={account.id} value={String(account.id)}>
                    {account.name}
                  </ComboboxItem>
                ))}
              </ComboboxContent>
            </Combobox>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`edit-category-${transaction.id}`}>{t("transactions.form.category")}</Label>
            <Combobox
              value={categoryId}
              onValueChange={(value) => setCategoryId(value ?? "")}
              items={categories?.map((category) => ({
                value: String(category.id),
                label: category.name,
              }))}
            >
              <ComboboxTrigger id={`edit-category-${transaction.id}`} className="w-full">
                <ComboboxValue placeholder={t("transactions.form.uncategorized")} />
              </ComboboxTrigger>
              <ComboboxContent
                searchPlaceholder={t("transactions.form.searchCategory")}
                emptyMessage={t("transactions.form.noCategoryFound")}
              >
                {categories?.map((category) => (
                  <ComboboxItem key={category.id} value={String(category.id)}>
                    <CategoryDot categoryId={category.id} />
                    {category.name}
                  </ComboboxItem>
                ))}
              </ComboboxContent>
            </Combobox>
          </div>

          {canOfferRecurring && (
            <div className="space-y-2">
              <Label>{t("transactions.form.frequency")}</Label>
              <FrequencyToggle
                value={frequency}
                onChange={setFrequency}
                onceLabel={t("transactions.form.once")}
                recurringLabel={t("transactions.form.recurring")}
                idPrefix={`edit-transaction-frequency-${transaction.id}`}
              />
              {frequency === "recurring" && dayOfMonth && (
                <p className="text-xs text-muted-foreground">
                  {t("transactions.list.makeRecurringHint", { day: dayOfMonth })}
                </p>
              )}
            </div>
          )}

          <DialogFooter>
            <DialogClose render={<Button variant="outline" type="button" />}>
              {t("common.cancel")}
            </DialogClose>
            <Button type="submit" disabled={updateTransaction.isPending || createRecurring.isPending}>
              {updateTransaction.isPending || createRecurring.isPending
                ? t("common.saving")
                : t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
