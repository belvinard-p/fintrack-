"use client";

import { toast } from "sonner";
import { useDeleteAccount } from "../hooks/use-delete-account";
import { Account } from "../types";
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

export function DeleteAccountDialog({ account }: Readonly<{ account: Account }>) {
  const { t } = useLanguage();
  const deleteAccount = useDeleteAccount();

  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="ghost" size="sm" />}>
        {t("common.delete")}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("accounts.list.deleteTitle", { name: account.name })}</AlertDialogTitle>
          <AlertDialogDescription>{t("accounts.list.deleteDescription")}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            disabled={deleteAccount.isPending}
            onClick={() =>
              deleteAccount.mutate(account.id, {
                onSuccess: () => toast.success(t("accounts.list.deleted")),
                onError: (err) => toast.error(extractErrorMessage(err, t("accounts.list.deleteError"))),
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
