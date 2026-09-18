"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDeleteAccount } from "../hooks/use-delete-account";
import { clearToken } from "@/lib/session";
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

export function DeleteAccountSection() {
  const { t } = useLanguage();
  const router = useRouter();
  const deleteAccount = useDeleteAccount();
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setError(null);
    try {
      await deleteAccount.mutateAsync();
      clearToken();
      router.push("/login");
    } catch (err: any) {
      setError(extractErrorMessage(err, t("auth.deleteAccount.error")));
    }
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <AlertDialog>
        <AlertDialogTrigger render={<Button variant="destructive" />}>
          {t("auth.deleteAccount.trigger")}
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("auth.deleteAccount.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("auth.deleteAccount.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>{t("auth.deleteAccount.confirm")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
