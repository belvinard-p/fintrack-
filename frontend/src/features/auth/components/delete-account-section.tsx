"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDeleteAccount } from "../hooks/use-delete-account";
import { clearToken } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/lib/i18n";
import { extractErrorMessage } from "@/lib/error";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function DeleteAccountSection() {
  const { t } = useLanguage();
  const router = useRouter();
  const deleteAccount = useDeleteAccount();
  const [open, setOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setCurrentPassword("");
      setError(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await deleteAccount.mutateAsync({ current_password: currentPassword });
      clearToken();
      router.push("/login");
    } catch (err) {
      setError(extractErrorMessage(err, t("auth.deleteAccount.error")));
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button variant="destructive" />}>
        {t("auth.deleteAccount.trigger")}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("auth.deleteAccount.title")}</DialogTitle>
          <DialogDescription>{t("auth.deleteAccount.description")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-red-600 text-sm dark:text-red-400">{error}</p>}

          <div className="space-y-2">
            <Label htmlFor="delete-account-password">
              {t("auth.deleteAccount.currentPassword")}
            </Label>
            <PasswordInput
              id="delete-account-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>

          <DialogFooter>
            <DialogClose render={<Button variant="outline" type="button" />}>
              {t("common.cancel")}
            </DialogClose>
            <Button type="submit" variant="destructive" disabled={deleteAccount.isPending}>
              {deleteAccount.isPending ? t("common.saving") : t("auth.deleteAccount.confirm")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
