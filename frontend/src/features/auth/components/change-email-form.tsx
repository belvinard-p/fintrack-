"use client";

import { useState } from "react";
import { useChangeEmail } from "../hooks/use-change-email";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/lib/i18n";
import { extractErrorMessage } from "@/lib/error";

export function ChangeEmailForm() {
  const { t } = useLanguage();
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const changeEmail = useChangeEmail();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    try {
      await changeEmail.mutateAsync({
        current_password: currentPassword,
        new_email: newEmail,
      });
      setCurrentPassword("");
      setNewEmail("");
      setSuccess(true);
    } catch (err: any) {
      setError(extractErrorMessage(err, t("auth.changeEmail.error")));
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-600 text-sm">{error}</p>}
      {success && <p className="text-green-600 text-sm">{t("auth.changeEmail.success")}</p>}

      <div className="space-y-2">
        <Label htmlFor="new-email">{t("auth.changeEmail.newEmail")}</Label>
        <Input
          id="new-email"
          type="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="current-password-email">{t("auth.changeEmail.currentPassword")}</Label>
        <PasswordInput
          id="current-password-email"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />
      </div>

      <Button type="submit" disabled={changeEmail.isPending}>
        {changeEmail.isPending ? t("auth.changeEmail.saving") : t("auth.changeEmail.submit")}
      </Button>
    </form>
  );
}
