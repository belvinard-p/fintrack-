"use client";

import { toast } from "sonner";
import { useRecurringTransactions } from "../hooks/use-recurring-transactions";
import { useUpdateRecurringTransaction } from "../hooks/use-update-recurring-transaction";
import { useDeleteRecurringTransaction } from "../hooks/use-delete-recurring-transaction";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
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

export function RecurringTransactionList() {
  const { data: recurring, isLoading, error } = useRecurringTransactions();
  const updateRecurring = useUpdateRecurringTransaction();
  const deleteRecurring = useDeleteRecurringTransaction();

  return (
    <div aria-live="polite" className="space-y-3">
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      )}
      {error && <p className="text-red-600">Failed to load recurring transactions</p>}
      {recurring && recurring.length === 0 && (
        <p className="text-muted-foreground">No recurring transactions yet</p>
      )}

      {recurring && recurring.length > 0 && (
        <div className="space-y-3">
          {recurring.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-3 border rounded-lg p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium">{item.description}</p>
                <p className="text-sm text-muted-foreground">
                  {item.amount} · day {item.day_of_month} of each month
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {!item.is_active && <Badge variant="secondary">Paused</Badge>}
                <div className="flex items-center gap-2">
                  <Label htmlFor={`active-${item.id}`} className="text-sm">
                    Active
                  </Label>
                  <Switch
                    id={`active-${item.id}`}
                    checked={item.is_active}
                    onCheckedChange={(checked) =>
                      updateRecurring.mutate(
                        { id: item.id, payload: { is_active: checked } },
                        {
                          onSuccess: () =>
                            toast.success(checked ? "Recurring transaction resumed" : "Recurring transaction paused"),
                        }
                      )
                    }
                  />
                </div>
                <AlertDialog>
                  <AlertDialogTrigger render={<Button variant="ghost" size="sm" />}>
                    Delete
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete "{item.description}"?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This stops future automatic transactions. Past transactions already
                        created are not affected.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() =>
                          deleteRecurring.mutate(item.id, {
                            onSuccess: () => toast.success("Recurring transaction deleted"),
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
      )}
    </div>
  );
}
