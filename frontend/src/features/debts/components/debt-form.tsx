"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useCreateDebt } from "../hooks/use-create-debt";
import { DebtType } from "../types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/lib/i18n";
import { stripDigits } from "@/lib/text";
import { extractErrorMessage } from "@/lib/error";

const DEBT_TYPES: DebtType[] = ["loan", "credit_card", "other"];

export function DebtForm() {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [type, setType] = useState<DebtType>("other");
  const [principal, setPrincipal] = useState("");
  const [annualRate, setAnnualRate] = useState("");
  const [error, setError] = useState<string | null>(null);

  const createDebt = useCreateDebt();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    try {
      await createDebt.mutateAsync({
        name,
        type,
        principal,
        annual_rate: annualRate || null,
      });
      setName("");
      setType("other");
      setPrincipal("");
      setAnnualRate("");
      toast.success(t("debts.form.created"));
    } catch (err) {
      setError(extractErrorMessage(err, t("debts.form.error")));
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="space-y-2">
        <Label htmlFor="debt-name">{t("debts.form.name")}</Label>
        <Input
          id="debt-name"
          value={name}
          onChange={(e) => setName(stripDigits(e.target.value))}
          placeholder={t("debts.form.namePlaceholder")}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="debt-type">{t("debts.form.type")}</Label>
        <select
          id="debt-type"
          value={type}
          onChange={(e) => setType(e.target.value as DebtType)}
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-all duration-200 ease-in-out outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
        >
          {DEBT_TYPES.map((value) => (
            <option key={value} value={value}>
              {t(`debts.types.${value}`)}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="debt-principal">{t("debts.form.principal")}</Label>
        <Input
          id="debt-principal"
          type="number"
          min="0.01"
          step="0.01"
          value={principal}
          onChange={(e) => setPrincipal(e.target.value)}
          placeholder="0.00"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="debt-rate">{t("debts.form.annualRate")}</Label>
        <Input
          id="debt-rate"
          type="number"
          min="0"
          max="100"
          step="0.01"
          value={annualRate}
          onChange={(e) => setAnnualRate(e.target.value)}
          placeholder={t("debts.form.annualRatePlaceholder")}
        />
      </div>

      <Button type="submit" className="w-full" disabled={createDebt.isPending}>
        {createDebt.isPending ? t("debts.form.creating") : t("debts.form.submit")}
      </Button>
    </form>
  );
}
