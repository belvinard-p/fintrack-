"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/lib/i18n";
import { getCurrentMonth, shiftMonth } from "@/lib/date";

export function TransactionMonthPicker({
  month,
  onChange,
}: Readonly<{ month: string; onChange: (month: string) => void }>) {
  const { t } = useLanguage();
  const currentMonth = getCurrentMonth();

  return (
    <div className="space-y-2">
      <Label htmlFor="transaction-month" className="sr-only">
        {t("transactions.list.month")}
      </Label>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          aria-label={t("transactions.list.previousMonth")}
          onClick={() => onChange(shiftMonth(month, -1))}
        >
          <ChevronLeft />
        </Button>
        <Input
          id="transaction-month"
          type="month"
          value={month}
          max={currentMonth}
          onChange={(e) => e.target.value && onChange(e.target.value)}
        />
        <Button
          variant="outline"
          size="icon"
          aria-label={t("transactions.list.nextMonth")}
          disabled={month >= currentMonth}
          onClick={() => onChange(shiftMonth(month, 1))}
        >
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}
