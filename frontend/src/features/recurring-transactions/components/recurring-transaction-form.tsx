"use client";

import { useState } from "react";
import { useCreateRecurringTransaction } from "../hooks/use-create-recurring-transaction";
import { useCategories } from "@/features/categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function RecurringTransactionForm() {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [dayOfMonth, setDayOfMonth] = useState("1");
  const [startDate, setStartDate] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const createRecurring = useCreateRecurringTransaction();
  const { data: categories } = useCategories();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    try {
      await createRecurring.mutateAsync({
        description,
        amount,
        day_of_month: parseInt(dayOfMonth, 10),
        start_date: startDate,
        category_id: categoryId ? parseInt(categoryId, 10) : null,
      });
      setDescription("");
      setAmount("");
      setDayOfMonth("1");
      setStartDate("");
      setCategoryId("");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create recurring transaction");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="space-y-2">
        <Label htmlFor="recurring-description">Description</Label>
        <Input
          id="recurring-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Rent, Netflix, Salary..."
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="recurring-amount">Amount</Label>
        <Input
          id="recurring-amount"
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="-1200.00 for expense, 2500.00 for income"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="recurring-day">Day of month</Label>
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
        <Label htmlFor="recurring-start">Start date</Label>
        <Input
          id="recurring-start"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="recurring-category">Category (optional)</Label>
        <Select
          value={categoryId}
          onValueChange={(value) => setCategoryId(value ?? "")}
          items={categories?.map((category) => ({
            value: String(category.id),
            label: category.name,
          }))}
        >
          <SelectTrigger id="recurring-category" className="w-full">
            <SelectValue placeholder="Uncategorized" />
          </SelectTrigger>
          <SelectContent>
            {categories?.map((category) => (
              <SelectItem key={category.id} value={String(category.id)}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" className="w-full" disabled={createRecurring.isPending}>
        {createRecurring.isPending ? "Creating..." : "Create Recurring Transaction"}
      </Button>
    </form>
  );
}
