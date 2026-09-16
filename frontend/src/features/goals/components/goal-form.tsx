"use client";

import { useState } from "react";
import { useCreateGoal } from "../hooks/use-create-goal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function GoalForm() {
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [error, setError] = useState<string | null>(null);

  const createGoal = useCreateGoal();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    try {
      await createGoal.mutateAsync({
        name,
        target_amount: targetAmount,
        target_date: targetDate || null,
      });
      setName("");
      setTargetAmount("");
      setTargetDate("");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create goal");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="space-y-2">
        <Label htmlFor="goal-name">Goal name</Label>
        <Input
          id="goal-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Emergency fund"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="goal-target">Target amount</Label>
        <Input
          id="goal-target"
          type="number"
          step="0.01"
          value={targetAmount}
          onChange={(e) => setTargetAmount(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="goal-date">Target date (optional)</Label>
        <Input
          id="goal-date"
          type="date"
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
        />
      </div>

      <Button type="submit" className="w-full" disabled={createGoal.isPending}>
        {createGoal.isPending ? "Creating..." : "Create Goal"}
      </Button>
    </form>
  );
}
