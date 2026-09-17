"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useCreateTransaction } from "../hooks/use-create-transaction";
import { useCategories } from "@/features/categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CategoryDot } from "@/components/category-dot";
import { useLanguage } from "@/lib/i18n";
import { getTodayIso } from "@/lib/date";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function TransactionForm() {
  const { t } = useLanguage();
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const createTransaction = useCreateTransaction();
  const { data: categories } = useCategories();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    try {
      await createTransaction.mutateAsync({

        date,
        description,
        amount,
        category_id: categoryId ? parseInt(categoryId, 10) : null,
      });
      setDate("");
      setDescription("");
      setAmount("");
      setCategoryId("");
      toast.success(t("transactions.form.added"));
    } catch (err: any) {
      setError(err.response?.data?.detail || t("transactions.form.error"));
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="space-y-2">
        <Label htmlFor="date">{t("transactions.form.date")}</Label>
        <Input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          max={getTodayIso()}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">{t("transactions.form.description")}</Label>
        <Input
          id="description"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />

      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">{t("transactions.form.amount")}</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={t("transactions.form.amountPlaceholder")}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">{t("transactions.form.category")}</Label>
        <Select
          value={categoryId}
          onValueChange={(value) => setCategoryId(value ?? "")}
          items={categories?.map((category) => ({
            value: String(category.id),
            label: category.name,
          }))}
        >
          <SelectTrigger id="category" className="w-full">
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

      <Button type="submit" className="w-full" disabled={createTransaction.isPending}>

        {createTransaction.isPending ? t("transactions.form.adding") : t("transactions.form.submit")}
      </Button>
    </form>
  );
}
