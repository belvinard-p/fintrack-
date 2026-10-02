"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useCreateTransaction } from "../hooks/use-create-transaction";
import { useCategories } from "@/features/categories";
import { useAccounts } from "@/features/accounts";
import {
  useCreateRecurringTransaction,
  useGenerateDueTransactions,
} from "@/features/recurring-transactions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CategoryDot } from "@/components/category-dot";
import { FrequencyToggle, type TransactionFrequency } from "@/components/frequency-toggle";
import { useLanguage } from "@/lib/i18n";
import { stripDigits } from "@/lib/text";
import { extractErrorMessage } from "@/lib/error";
import { getTodayIso, getFirstDayOfCurrentMonthIso } from "@/lib/date";
import { toSignedAmount } from "@/lib/amount";
import {
  Combobox,
  ComboboxContent,
  ComboboxItem,
  ComboboxTrigger,
  ComboboxValue,
} from "@/components/ui/combobox";

export function TransactionForm() {
  const { t } = useLanguage();
  const [frequency, setFrequency] = useState<TransactionFrequency>("once");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [accountId, setAccountId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const createTransaction = useCreateTransaction();
  const createRecurring = useCreateRecurringTransaction();
  const generateDue = useGenerateDueTransactions();
  const { data: categories } = useCategories();
  const { data: accounts } = useAccounts();
  const selectedAccountId = accountId || (accounts?.[0] ? String(accounts[0].id) : "");

  const isPending = createTransaction.isPending || createRecurring.isPending;
  const dayOfMonth = date ? Math.min(Number(date.split("-")[2]), 28) : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    try {
      if (frequency === "recurring") {
        await createRecurring.mutateAsync({
          account_id: Number(selectedAccountId),
          description,
          amount: toSignedAmount(amount, "expense"),
          day_of_month: dayOfMonth as number,
          start_date: date,
          category_id: categoryId ? parseInt(categoryId, 10) : null,
        });
        await generateDue.mutateAsync();
        toast.success(t("recurring.form.created"));
      } else {
        await createTransaction.mutateAsync({
          account_id: Number(selectedAccountId),
          date,
          description,
          amount: toSignedAmount(amount, "expense"),
          category_id: categoryId ? parseInt(categoryId, 10) : null,
        });
        toast.success(t("transactions.form.added"));
      }
      setFrequency("once");
      setDate("");
      setDescription("");
      setAmount("");
      setCategoryId("");
    } catch (err) {
      setError(extractErrorMessage(err, t("transactions.form.error")));
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="space-y-2">
        <Label>{t("transactions.form.frequency")}</Label>
        <FrequencyToggle
          value={frequency}
          onChange={setFrequency}
          onceLabel={t("transactions.form.once")}
          recurringLabel={t("transactions.form.recurring")}
          idPrefix="transaction-frequency"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="date">
          {frequency === "recurring" ? t("transactions.form.startDate") : t("transactions.form.date")}
        </Label>
        <Input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          min={frequency === "once" ? getFirstDayOfCurrentMonthIso() : undefined}
          max={frequency === "once" ? getTodayIso() : undefined}
          required
        />
        {frequency === "recurring" && dayOfMonth && (
          <p className="text-xs text-muted-foreground">
            {t("transactions.form.recurringHint", { day: dayOfMonth })}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">{t("transactions.form.description")}</Label>
        <Input
          id="description"
          type="text"
          value={description}
          onChange={(e) => setDescription(stripDigits(e.target.value))}
          required
        />

      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">{t("transactions.form.amount")}</Label>
        <Input
          id="amount"
          type="number"
          min="0.01"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={t("transactions.form.amountPlaceholder")}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="account">{t("transactions.form.account")}</Label>
        <Combobox
          value={selectedAccountId}
          onValueChange={(value) => setAccountId(value ?? "")}
          items={accounts?.map((account) => ({
            value: String(account.id),
            label: account.name,
          }))}
        >
          <ComboboxTrigger id="account" className="w-full">
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
        <Label htmlFor="category">{t("transactions.form.category")}</Label>
        <Combobox
          value={categoryId}
          onValueChange={(value) => setCategoryId(value ?? "")}
          items={categories?.map((category) => ({
            value: String(category.id),
            label: category.name,
          }))}
        >
          <ComboboxTrigger id="category" className="w-full">
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

      <Button type="submit" className="w-full" disabled={isPending || !date || !description || !amount || !selectedAccountId}>
        {isPending
          ? t("transactions.form.adding")
          : frequency === "recurring"
            ? t("recurring.form.submit")
            : t("transactions.form.submit")}
      </Button>
    </form>
  );
}
