"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n";
import { getCurrentYear, shiftYear } from "../utils";

export function DashboardYearPicker({
  year,
  onChange,
}: Readonly<{ year: string; onChange: (year: string) => void }>) {
  const { t } = useLanguage();
  const currentYear = getCurrentYear();

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        aria-label={t("dashboard.summary.previousYear")}
        onClick={() => onChange(shiftYear(year, -1))}
      >
        <ChevronLeft />
      </Button>
      <span className="min-w-14 text-center text-sm font-medium">{year}</span>
      <Button
        variant="outline"
        size="icon"
        aria-label={t("dashboard.summary.nextYear")}
        disabled={year >= currentYear}
        onClick={() => onChange(shiftYear(year, 1))}
      >
        <ChevronRight />
      </Button>
    </div>
  );
}
