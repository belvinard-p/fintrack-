"use client";

import { useGoals } from "../hooks/use-goals";
import { useCurrentUser } from "@/features/auth";
import { GoalItem } from "./goal-item";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/lib/i18n";

export function GoalList() {
  const { t } = useLanguage();
  const { data: goals, isLoading, error } = useGoals();
  const { data: currentUser } = useCurrentUser();

  if (isLoading) {
    return (
      <div aria-live="polite" className="space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-lg" />
        ))}
      </div>
    );
  }
  if (error) return <p aria-live="polite" className="text-red-600">{t("goals.list.failedToLoad")}</p>;
  if (!goals?.length) return <p aria-live="polite" className="text-muted-foreground">{t("goals.list.empty")}</p>;

  return (
    <div className="space-y-4">
      {goals.map((goal) => (
        <GoalItem key={goal.id} goal={goal} userEmail={currentUser?.email} />
      ))}
    </div>
  );
}
