"use client";

import { useRecurringTransactions } from "../hooks/use-recurring-transactions";
import { RecurringTransactionItem } from "./recurring-transaction-item";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/lib/i18n";

export function RecurringTransactionList() {
  const { t } = useLanguage();
  const { data: recurring, isLoading, error } = useRecurringTransactions();

  return (
    <div aria-live="polite" className="space-y-3">
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      )}
      {error && <p className="text-red-600">{t("recurring.list.failedToLoad")}</p>}
      {recurring?.length === 0 && (
        <p className="text-muted-foreground">{t("recurring.list.empty")}</p>
      )}
      {recurring && recurring.length > 0 && (
        <div className="space-y-3">
          {recurring.map((item) => (
            <RecurringTransactionItem key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
