"use client";

import { useState } from "react";
import { useChangePassword } from "../hooks/use-change-password";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/lib/i18n";
import { extractErrorMessage } from "@/lib/error";

export function ChangePasswordForm() {
  const { t } = useLanguage();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const changePassword = useChangePassword();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    try {
      await changePassword.mutateAsync({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setSuccess(true);
    } catch (err: any) {
      setError(extractErrorMessage(err, t("auth.changePassword.error")));
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-600 text-sm">{error}</p>}
      {success && <p className="text-green-600 text-sm">{t("auth.changePassword.success")}</p>}

      <div className="space-y-2">
        <Label htmlFor="current-password">{t("auth.changePassword.currentPassword")}</Label>
        <PasswordInput
          id="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="new-password">{t("auth.changePassword.newPassword")}</Label>
        <PasswordInput
          id="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          minLength={8}
          required
        />
      </div>

      <Button type="submit" disabled={changePassword.isPending}>
        {changePassword.isPending ? t("auth.changePassword.saving") : t("auth.changePassword.submit")}
      </Button>
    </form>
  );
}
