"use client";

import { Goal } from "../types";
import { ContributeGoalDialog } from "./contribute-goal-dialog";
import { EditGoalDialog } from "./edit-goal-dialog";
import { DeleteGoalDialog } from "./delete-goal-dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/lib/i18n";

function progressPercent(goal: Goal): number {
  const current = Number.parseFloat(goal.current_amount);
  const target = Number.parseFloat(goal.target_amount);
  if (target <= 0) return 0;
  return Math.min(100, Math.round((current / target) * 100));
}

interface GoalItemProps {
  goal: Goal;
  userEmail?: string;
}

export function GoalItem({ goal, userEmail }: Readonly<GoalItemProps>) {
  const { t } = useLanguage();

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-medium">{goal.name}</p>
          <p className="text-sm text-muted-foreground">
            {goal.current_amount} / {goal.target_amount}
            {userEmail ? ` · ${userEmail}` : ""}
          </p>
        </div>
        {goal.is_completed && <Badge>{t("goals.list.goalReached")}</Badge>}
      </div>
      <Progress
        value={progressPercent(goal)}
        aria-label={`${goal.name} progress`}
        aria-valuenow={progressPercent(goal)}
        aria-valuemin={0}
        aria-valuemax={100}
      />
      <div className="flex flex-wrap gap-2" aria-label="Goal actions">
        <ContributeGoalDialog goal={goal} />
        <EditGoalDialog goal={goal} />
        <DeleteGoalDialog goal={goal} />
      </div>
    </div>
  );
}
