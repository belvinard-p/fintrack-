"use client";

import { useDebts } from "../hooks/use-debts";
import { DebtItem } from "./debt-item";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/lib/i18n";

export function DebtList() {
  const { t } = useLanguage();
  const { data: debts, isLoading, error } = useDebts();

  if (isLoading) {
    return (
      <div aria-live="polite" className="space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-lg" />
        ))}
      </div>
    );
  }
  if (error) return <p aria-live="polite" className="text-red-600">{t("debts.list.failedToLoad")}</p>;
  if (!debts?.length) return <p aria-live="polite" className="text-muted-foreground">{t("debts.list.empty")}</p>;

  return (
    <div className="space-y-4">
      {debts.map((debt) => (
        <DebtItem key={debt.id} debt={debt} />
      ))}
    </div>
  );
}
