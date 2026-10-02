"use client";

import { useDebtPayments } from "../hooks/use-debt-payments";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/lib/i18n";

export function PaymentHistoryList({ debtId }: Readonly<{ debtId: number }>) {
  const { t } = useLanguage();
  const { data: payments, isLoading } = useDebtPayments(debtId);

  if (isLoading) {
    return <Skeleton className="h-16 w-full rounded-lg" />;
  }
  if (!payments?.length) {
    return <p className="text-sm text-muted-foreground">{t("debts.payment.historyEmpty")}</p>;
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">{t("debts.payment.historyTitle")}</p>
      <ul className="space-y-1 text-sm">
        {payments.map((payment) => (
          <li key={payment.id} className="flex items-center justify-between gap-2 border-b pb-1 last:border-0">
            <span className="text-muted-foreground">{payment.date}</span>
            <span>{payment.amount}</span>
            <span className="text-xs text-muted-foreground">
              {t("debts.payment.splitLabel", {
                principal: payment.principal_portion,
                interest: payment.interest_portion,
              })}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
