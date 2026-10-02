"use client";

import { toast } from "sonner";
import { useDeleteDebt } from "../hooks/use-delete-debt";
import { Debt } from "../types";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n";
import { extractErrorMessage } from "@/lib/error";
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

export function DeleteDebtDialog({ debt }: Readonly<{ debt: Debt }>) {
  const { t } = useLanguage();
  const deleteDebt = useDeleteDebt();

  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="ghost" size="sm" />}>
        {t("common.delete")}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("debts.list.deleteTitle", { name: debt.name })}</AlertDialogTitle>
          <AlertDialogDescription>{t("debts.list.deleteDescription")}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            disabled={deleteDebt.isPending}
            onClick={() =>
              deleteDebt.mutate(debt.id, {
                onSuccess: () => toast.success(t("debts.list.deleted")),
                onError: (err) => toast.error(extractErrorMessage(err, t("debts.list.deleteError"))),
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
