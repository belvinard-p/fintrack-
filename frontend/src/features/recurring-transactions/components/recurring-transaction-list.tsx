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
import { CategoryDot } from "@/components/category-dot";
import { useLanguage } from "@/lib/i18n";
import { amountColorClass, formatSignedAmount } from "@/lib/amount";
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
  const { t } = useLanguage();
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
      {error && <p className="text-red-600">{t("recurring.list.failedToLoad")}</p>}
      {recurring && recurring.length === 0 && (
        <p className="text-muted-foreground">{t("recurring.list.empty")}</p>
      )}

      {recurring && recurring.length > 0 && (
        <div className="space-y-3">
          {recurring.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-3 border rounded-lg p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="flex items-center gap-2 font-medium">
                  <CategoryDot categoryId={item.category_id} />
                  {item.description}
                </p>
                <p className="text-sm text-muted-foreground">
                  <span className={amountColorClass(item.amount)}>{formatSignedAmount(item.amount)}</span>
                  {" · "}
                  {t("recurring.list.dayOfMonth", { day: item.day_of_month })}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {!item.is_active && <Badge variant="secondary">{t("recurring.list.paused")}</Badge>}
                <div className="flex items-center gap-2">
                  <Label htmlFor={`active-${item.id}`} className="text-sm">
                    {t("recurring.list.active")}
                  </Label>
                  <Switch
                    id={`active-${item.id}`}
                    checked={item.is_active}
                    onCheckedChange={(checked) =>
                      updateRecurring.mutate(
                        { id: item.id, payload: { is_active: checked } },
                        {
                          onSuccess: () =>
                            toast.success(
                              checked
                                ? t("recurring.list.resumed")
                                : t("recurring.list.pausedToast")
                            ),
                        }
                      )
                    }
                  />
                </div>
                <AlertDialog>
                  <AlertDialogTrigger render={<Button variant="ghost" size="sm" />}>
                    {t("common.delete")}
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {t("recurring.list.deleteTitle", { description: item.description })}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {t("recurring.list.deleteDescription")}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() =>
                          deleteRecurring.mutate(item.id, {
                            onSuccess: () => toast.success(t("recurring.list.deleted")),
                          })
                        }
                      >
                        {t("common.delete")}
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
