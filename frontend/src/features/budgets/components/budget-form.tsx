"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useCreateBudget } from "../hooks/use-create-budget";
import { useCategories } from "@/features/categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CategoryDot } from "@/components/category-dot";
import { useLanguage } from "@/lib/i18n";
import { extractErrorMessage } from "@/lib/error";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function BudgetForm() {
  const { t } = useLanguage();
  const [categoryId, setCategoryId] = useState("");
  const [monthlyLimit, setMonthlyLimit] = useState("");
  const [month, setMonth] = useState("");
  const [error, setError] = useState<string | null>(null);

  const createBudget = useCreateBudget();
  const { data: categories } = useCategories();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    try {
      await createBudget.mutateAsync({
        category_id: parseInt(categoryId, 10),

        monthly_limit: monthlyLimit,
        month,
      });
      setCategoryId("");
      setMonthlyLimit("");
      setMonth("");
      toast.success(t("budgets.form.created"));
    } catch (err: any) {
      setError(extractErrorMessage(err, t("budgets.form.error")));
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="space-y-2">
        <Label htmlFor="budget-category">{t("budgets.form.category")}</Label>
        <Select
          value={categoryId}
          onValueChange={(value) => setCategoryId(value ?? "")}
          items={categories?.map((category) => ({
            value: String(category.id),
            label: category.name,
          }))}
          required
        >
          <SelectTrigger id="budget-category" className="w-full">
            <SelectValue placeholder={t("budgets.form.selectCategory")} />
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

      <div className="space-y-2">

        <Label htmlFor="month">{t("budgets.form.month")}</Label>
        <Input
          id="month"
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="monthly-limit">{t("budgets.form.monthlyLimit")}</Label>
        <Input
          id="monthly-limit"
          type="number"
          step="0.01"
          value={monthlyLimit}
          onChange={(e) => setMonthlyLimit(e.target.value)}
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={createBudget.isPending || !categoryId}>
        {createBudget.isPending ? t("budgets.form.creating") : t("budgets.form.submit")}
      </Button>
    </form>
  );
}
