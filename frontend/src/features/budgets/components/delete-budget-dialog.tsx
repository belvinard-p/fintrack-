"use client";

import { toast } from "sonner";
import { useDeleteBudget } from "../hooks/use-delete-budget";
import { BudgetStatus } from "../types";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n";
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

export function DeleteBudgetDialog({ status, disabled }: Readonly<{ status: BudgetStatus; disabled?: boolean }>) {
  const { t } = useLanguage();
  const deleteBudget = useDeleteBudget();

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            disabled={disabled}
            title={disabled ? t("budgets.status.monthLocked") : undefined}
          />
        }
      >
        {t("common.delete")}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t("budgets.status.deleteTitle", { category: status.category_name })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("budgets.status.deleteDescription")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            disabled={deleteBudget.isPending}
            onClick={() =>
              deleteBudget.mutate(status.id, {
                onSuccess: () => toast.success(t("budgets.status.deleted")),
              })
            }
          >
            {t("common.delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
