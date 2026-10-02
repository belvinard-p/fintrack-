"use client";

import { useState } from "react";
import { Debt } from "../types";
import { EditDebtDialog } from "./edit-debt-dialog";
import { DeleteDebtDialog } from "./delete-debt-dialog";
import { LogPaymentDialog } from "./log-payment-dialog";
import { PaymentHistoryList } from "./payment-history-list";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/lib/i18n";

interface DebtItemProps {
  debt: Debt;
}

export function DebtItem({ debt }: Readonly<DebtItemProps>) {
  const { t } = useLanguage();
  const [showHistory, setShowHistory] = useState(false);

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium">{debt.name}</p>
            <Badge variant="secondary">{t(`debts.types.${debt.type}`)}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {t("debts.list.principal", { amount: debt.principal })}
            {debt.annual_rate ? ` · ${t("debts.list.annualRate", { rate: debt.annual_rate })}` : ""}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">{t("debts.list.remainingBalance")}</p>
          <p className="text-lg font-semibold">{debt.remaining_balance}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <LogPaymentDialog debt={debt} />
        <Button variant="ghost" size="sm" onClick={() => setShowHistory((v) => !v)}>
          {showHistory ? t("debts.payment.hideHistory") : t("debts.payment.showHistory")}
        </Button>
        <EditDebtDialog debt={debt} />
        <DeleteDebtDialog debt={debt} />
      </div>
      {showHistory && <PaymentHistoryList debtId={debt.id} />}
    </div>
  );
}
