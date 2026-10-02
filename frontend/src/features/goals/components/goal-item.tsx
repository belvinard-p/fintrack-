"use client";

import { useState } from "react";
import { Goal, GoalStatus } from "../types";
import { ContributeGoalDialog } from "./contribute-goal-dialog";
import { EditGoalDialog } from "./edit-goal-dialog";
import { DeleteGoalDialog } from "./delete-goal-dialog";
import { SetGoalAllocationDialog } from "./set-goal-allocation-dialog";
import { ContributionHistoryList } from "./contribution-history-list";
import { Button } from "@/components/ui/button";
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
  month: string;
  status?: GoalStatus;
}

export function GoalItem({ goal, userEmail, month, status }: Readonly<GoalItemProps>) {
  const { t } = useLanguage();
  const [showHistory, setShowHistory] = useState(false);

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
      <Progress value={progressPercent(goal)} />
      <p className="text-xs text-muted-foreground">
        {t("goals.allocation.monthSummary", {
          allocation: status?.monthly_allocation ?? "0.00",
          contributed: status?.monthly_contributed ?? "0.00",
        })}
      </p>
      <div className="flex flex-wrap gap-2">
        <ContributeGoalDialog goal={goal} />
        <SetGoalAllocationDialog goal={goal} month={month} status={status} />
        <Button variant="ghost" size="sm" onClick={() => setShowHistory((v) => !v)}>
          {showHistory ? t("goals.list.hideHistory") : t("goals.list.showHistory")}
        </Button>
        <EditGoalDialog goal={goal} />
        <DeleteGoalDialog goal={goal} />
      </div>
      {showHistory && <ContributionHistoryList goalId={goal.id} />}
    </div>
  );
}
