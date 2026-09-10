"use client";

import { useState } from "react";
import { useCreateTransaction } from "../hooks/use-create-transaction";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function TransactionForm() {
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);

  const createTransaction = useCreateTransaction();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    try {
      await createTransaction.mutateAsync({ date, description, amount });
      setDate("");
      setDescription("");
      setAmount("");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create transaction");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="space-y-2">
        <Label htmlFor="date">Date</Label>
        <Input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">Amount</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="-50.00 for expense, 100.00 for income"
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={createTransaction.isPending}>
        {createTransaction.isPending ? "Adding..." : "Add Transaction"}
      </Button>
    </form>
  );
}
