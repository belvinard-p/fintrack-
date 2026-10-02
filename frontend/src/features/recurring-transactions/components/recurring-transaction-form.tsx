"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useCreateRecurringTransaction } from "../hooks/use-create-recurring-transaction";
import { useCategories } from "@/features/categories";
import { useAccounts } from "@/features/accounts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CategoryDot } from "@/components/category-dot";
import { useLanguage } from "@/lib/i18n";
import { stripDigits } from "@/lib/text";
import { extractErrorMessage } from "@/lib/error";
import { toSignedAmount } from "@/lib/amount";
import {
  Combobox,
  ComboboxContent,
  ComboboxItem,
  ComboboxTrigger,
  ComboboxValue,
} from "@/components/ui/combobox";

export function RecurringTransactionForm() {
  const { t } = useLanguage();
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [dayOfMonth, setDayOfMonth] = useState("1");
  const [startDate, setStartDate] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const createRecurring = useCreateRecurringTransaction();
  const { data: categories } = useCategories();
  const { data: accounts } = useAccounts();
  const selectedAccountId = accountId || (accounts?.[0] ? String(accounts[0].id) : "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    try {
      await createRecurring.mutateAsync({
        account_id: Number(selectedAccountId),
        description,
        amount: toSignedAmount(amount, "expense"),
        day_of_month: parseInt(dayOfMonth, 10),
        start_date: startDate,
        category_id: categoryId ? parseInt(categoryId, 10) : null,
      });
      setDescription("");
      setAmount("");
      setDayOfMonth("1");
      setStartDate("");
      setCategoryId("");
      toast.success(t("recurring.form.created"));
    } catch (err) {
      setError(extractErrorMessage(err, t("recurring.form.error")));
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="space-y-2">
        <Label htmlFor="recurring-description">{t("recurring.form.description")}</Label>
        <Input
          id="recurring-description"
          value={description}
          onChange={(e) => setDescription(stripDigits(e.target.value))}
          placeholder={t("recurring.form.descriptionPlaceholder")}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="recurring-amount">{t("recurring.form.amount")}</Label>
        <Input
          id="recurring-amount"
          type="number"
          min="0.01"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={t("recurring.form.amountPlaceholder")}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="recurring-day">{t("recurring.form.dayOfMonth")}</Label>
        <Input
          id="recurring-day"
          type="number"
          min={1}
          max={28}
          value={dayOfMonth}
          onChange={(e) => setDayOfMonth(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="recurring-start">{t("recurring.form.startDate")}</Label>
        <Input
          id="recurring-start"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="recurring-account">{t("recurring.form.account")}</Label>
        <Combobox
          value={selectedAccountId}
          onValueChange={(value) => setAccountId(value ?? "")}
          items={accounts?.map((account) => ({
            value: String(account.id),
            label: account.name,
          }))}
        >
          <ComboboxTrigger id="recurring-account" className="w-full">
            <ComboboxValue placeholder={t("recurring.form.selectAccount")} />
          </ComboboxTrigger>
          <ComboboxContent
            searchPlaceholder={t("recurring.form.searchAccount")}
            emptyMessage={t("recurring.form.noAccountFound")}
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
        <Label htmlFor="recurring-category">{t("recurring.form.category")}</Label>
        <Combobox
          value={categoryId}
          onValueChange={(value) => setCategoryId(value ?? "")}
          items={categories?.map((category) => ({
            value: String(category.id),
            label: category.name,
          }))}
        >
          <ComboboxTrigger id="recurring-category" className="w-full">
            <ComboboxValue placeholder={t("recurring.form.uncategorized")} />
          </ComboboxTrigger>
          <ComboboxContent
            searchPlaceholder={t("recurring.form.searchCategory")}
            emptyMessage={t("recurring.form.noCategoryFound")}
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

      <Button type="submit" className="w-full" disabled={createRecurring.isPending || !description || !amount || !startDate || !selectedAccountId}>
        {createRecurring.isPending ? t("recurring.form.creating") : t("recurring.form.submit")}
      </Button>
    </form>
  );
}
