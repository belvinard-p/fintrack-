"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useGoals } from "../hooks/use-goals";
import { useContributeToGoal } from "../hooks/use-contribute-to-goal";
import { useDeleteGoal } from "../hooks/use-delete-goal";
import { Goal } from "../types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

function progressPercent(goal: Goal): number {
  const current = parseFloat(goal.current_amount);
  const target = parseFloat(goal.target_amount);
  if (target <= 0) return 0;
  return Math.min(100, Math.round((current / target) * 100));
}

function ContributeDialog({ goal }: Readonly<{ goal: Goal }>) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const contribute = useContributeToGoal();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await contribute.mutateAsync({ id: goal.id, payload: { amount } });
      setAmount("");
      setOpen(false);
      toast.success("Funds added");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to add contribution");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        Add funds
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add funds to {goal.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="space-y-2">
            <Label htmlFor={`contribute-${goal.id}`}>Amount</Label>
            <Input
              id={`contribute-${goal.id}`}
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={contribute.isPending}>
              {contribute.isPending ? "Saving..." : "Add"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function GoalList() {
  const { data: goals, isLoading, error } = useGoals();
  const deleteGoal = useDeleteGoal();

  if (isLoading) {
    return (
      <div aria-live="polite" className="space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-lg" />
        ))}
      </div>
    );
  }
  if (error) return <p aria-live="polite" className="text-red-600">Failed to load goals</p>;
  if (!goals || goals.length === 0) {
    return <p aria-live="polite" className="text-muted-foreground">No goals yet</p>;
  }

  return (
    <div className="space-y-4">
      {goals.map((goal) => (
        <div key={goal.id} className="border rounded-lg p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-medium">{goal.name}</p>
              <p className="text-sm text-muted-foreground">
                {goal.current_amount} / {goal.target_amount}
                {goal.target_date ? ` · by ${goal.target_date}` : ""}
              </p>
            </div>
            {goal.is_completed && <Badge>Goal reached</Badge>}
          </div>

          <Progress value={progressPercent(goal)} />

          <div className="flex flex-wrap gap-2">
            <ContributeDialog goal={goal} />
            <AlertDialog>
              <AlertDialogTrigger render={<Button variant="ghost" size="sm" />}>
                Delete
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete "{goal.name}"?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() =>
                      deleteGoal.mutate(goal.id, {
                        onSuccess: () => toast.success("Goal deleted"),
                      })
                    }
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      ))}
    </div>
  );
}
