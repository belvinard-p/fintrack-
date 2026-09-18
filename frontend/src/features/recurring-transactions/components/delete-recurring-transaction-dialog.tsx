"use client";

import { toast } from "sonner";
import { useDeleteRecurringTransaction } from "../hooks/use-delete-recurring-transaction";
import { RecurringTransaction } from "../types";
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

export function DeleteRecurringTransactionDialog({ item }: Readonly<{ item: RecurringTransaction }>) {
  const { t } = useLanguage();
  const deleteRecurring = useDeleteRecurringTransaction();

  return (
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
  );
}
