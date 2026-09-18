"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/lib/i18n";
import { getCurrentMonth, shiftMonth } from "../utils";

export function DashboardMonthPicker({
  month,
  onChange,
}: Readonly<{ month: string; onChange: (month: string) => void }>) {
  const { t } = useLanguage();
  const currentMonth = getCurrentMonth();

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        aria-label={t("dashboard.summary.previousMonth")}
        onClick={() => onChange(shiftMonth(month, -1))}
      >
        <ChevronLeft />
      </Button>
      <Label htmlFor="dashboard-month" className="sr-only">
        {t("dashboard.summary.month")}
      </Label>
      <Input
        id="dashboard-month"
        type="month"
        value={month}
        max={currentMonth}
        onChange={(e) => e.target.value && onChange(e.target.value)}
      />
      <Button
        variant="outline"
        size="icon"
        aria-label={t("dashboard.summary.nextMonth")}
        disabled={month >= currentMonth}
        onClick={() => onChange(shiftMonth(month, 1))}
      >
        <ChevronRight />
      </Button>
    </div>
  );
}
