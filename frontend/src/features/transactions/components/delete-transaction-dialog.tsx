"use client";

import { toast } from "sonner";
import { useDeleteTransaction } from "../hooks/use-delete-transaction";
import { Transaction } from "../types";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n";
import { isLockedMonth } from "@/lib/date";
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

export function DeleteTransactionDialog({ transaction }: Readonly<{ transaction: Transaction }>) {
  const { t } = useLanguage();
  const deleteTransaction = useDeleteTransaction();
  const locked = isLockedMonth(transaction.date);

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            disabled={locked}
            title={locked ? t("transactions.list.monthLocked") : undefined}
          >
            {t("common.delete")}
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("transactions.list.deleteTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("transactions.list.deleteDescription", { description: transaction.description })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            disabled={deleteTransaction.isPending}
            onClick={() =>
              deleteTransaction.mutate(transaction.id, {
                onSuccess: () => toast.success(t("transactions.list.deleted")),
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
