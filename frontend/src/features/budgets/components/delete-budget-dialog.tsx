"use client";

import { toast } from "sonner";
import { useDeleteBudget } from "../hooks/use-delete-budget";
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

interface DeleteBudgetDialogProps {
  id: number;
  categoryName: string;
}

export function DeleteBudgetDialog({ id, categoryName }: Readonly<DeleteBudgetDialogProps>) {
  const { t } = useLanguage();
  const deleteBudget = useDeleteBudget();

  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="ghost" size="sm" />}>
        {t("common.delete")}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("budgets.status.deleteTitle", { category: categoryName })}</AlertDialogTitle>
          <AlertDialogDescription>{t("budgets.status.deleteDescription")}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={() =>
              deleteBudget.mutate(id, {
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
