"use client";

import { GoalForm, GoalList } from "@/features/goals";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/lib/i18n";

export default function GoalsPage() {
  const { t } = useLanguage();

  return (
    <main className="p-4 space-y-8 sm:p-8">
      <h1 className="text-2xl font-bold">{t("goals.title")}</h1>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("goals.newGoal")}</CardTitle>
          </CardHeader>
          <CardContent>
            <GoalForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("goals.yourGoals")}</CardTitle>
          </CardHeader>
          <CardContent>
            <GoalList />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
