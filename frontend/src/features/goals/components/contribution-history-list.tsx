"use client";

import { useGoalContributions } from "../hooks/use-goal-contributions";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/lib/i18n";

export function ContributionHistoryList({ goalId }: Readonly<{ goalId: number }>) {
  const { t } = useLanguage();
  const { data: contributions, isLoading } = useGoalContributions(goalId);

  if (isLoading) {
    return <Skeleton className="h-16 w-full rounded-lg" />;
  }
  if (!contributions?.length) {
    return <p className="text-sm text-muted-foreground">{t("goals.list.historyEmpty")}</p>;
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">{t("goals.list.historyTitle")}</p>
      <ul className="space-y-1 text-sm">
        {contributions.map((contribution) => (
          <li key={contribution.id} className="flex items-center justify-between gap-2 border-b pb-1 last:border-0">
            <span className="text-muted-foreground">{contribution.date}</span>
            <span>{contribution.amount}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
