"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useCreateGoal } from "../hooks/use-create-goal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/lib/i18n";
import { stripDigits } from "@/lib/text";
import { extractErrorMessage } from "@/lib/error";

export function GoalForm() {
  const { t } = useLanguage();
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
      toast.success(t("goals.form.created"));
    } catch (err: any) {
      setError(extractErrorMessage(err, t("goals.form.error")));
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="space-y-2">
        <Label htmlFor="goal-name">{t("goals.form.name")}</Label>
        <Input
          id="goal-name"
          value={name}
          onChange={(e) => setName(stripDigits(e.target.value))}
          placeholder={t("goals.form.namePlaceholder")}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="goal-target">{t("goals.form.targetAmount")}</Label>
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
        <Label htmlFor="goal-date">{t("goals.form.targetDate")}</Label>
        <Input
          id="goal-date"
          type="date"
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
        />
      </div>

      <Button type="submit" className="w-full" disabled={createGoal.isPending}>
        {createGoal.isPending ? t("goals.form.creating") : t("goals.form.submit")}
      </Button>
    </form>
  );
}
