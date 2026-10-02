"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CategoryDot } from "@/components/category-dot";
import { useLanguage } from "@/lib/i18n";
import type { CategorySpending } from "../types";

const TOP_CATEGORIES = 5;

function CategoryRow({
  label,
  dot,
  total,
  share,
}: Readonly<{ label: string; dot: React.ReactNode; total: number; share: number }>) {
  return (
    <li className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-2">
          {dot}
          {label}
        </span>
        <span className="text-muted-foreground">
          {total.toFixed(2)} · {share.toFixed(0)}%
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-foreground/70" style={{ width: `${share}%` }} />
      </div>
    </li>
  );
}

export function CategoryBreakdownList({
  categories,
  totalExpenses,
}: Readonly<{ categories: CategorySpending[]; totalExpenses: number }>) {
  const { t } = useLanguage();
  const [showAll, setShowAll] = useState(false);

  if (categories.length === 0) return null;

  const hasOthers = categories.length > TOP_CATEGORIES;
  const visibleCategories = hasOthers && !showAll ? categories.slice(0, TOP_CATEGORIES) : categories;
  const groupedCategories = hasOthers && !showAll ? categories.slice(TOP_CATEGORIES) : [];
  const othersTotal = groupedCategories.reduce((sum, c) => sum + Number(c.total), 0);
  const shareOf = (value: number) => (totalExpenses > 0 ? (value / totalExpenses) * 100 : 0);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">{t("dashboard.summary.expensesByCategory")}</h3>
      <ul className="space-y-2">
        {visibleCategories.map((category) => (
          <CategoryRow
            key={category.category_id ?? "none"}
            label={category.category_name}
            dot={<CategoryDot categoryId={category.category_id} />}
            total={Number(category.total)}
            share={shareOf(Number(category.total))}
          />
        ))}
        {groupedCategories.length > 0 && (
          <CategoryRow
            label={t("dashboard.summary.others", { count: groupedCategories.length })}
            dot={<span aria-hidden="true" className="inline-block size-2.5 shrink-0 rounded-full bg-muted-foreground/40" />}
            total={othersTotal}
            share={shareOf(othersTotal)}
          />
        )}
      </ul>
      {hasOthers && (
        <Button variant="ghost" size="sm" onClick={() => setShowAll((v) => !v)}>
          {showAll
            ? t("dashboard.summary.showLess")
            : t("dashboard.summary.showAll", { count: categories.length })}
        </Button>
      )}
    </div>
  );
}
