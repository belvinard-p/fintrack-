"use client";

import { GoalForm, GoalList } from "@/features/goals";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function GoalsPage() {
  return (
    <main className="p-4 space-y-8 sm:p-8">
      <h1 className="text-2xl font-bold">Goals</h1>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>New Goal</CardTitle>
          </CardHeader>
          <CardContent>
            <GoalForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Goals</CardTitle>
          </CardHeader>
          <CardContent>
            <GoalList />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
