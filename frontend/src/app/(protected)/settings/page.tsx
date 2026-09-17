"use client";

import { ChangePasswordForm, DeleteAccountSection } from "@/features/auth";
import { AuditLogList } from "@/features/audit-logs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/lib/i18n";

export default function SettingsPage() {
  const { t } = useLanguage();

  return (
    <main className="p-4 space-y-8 sm:p-8 max-w-2xl">
      <h1 className="text-2xl font-bold">{t("settings.title")}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{t("settings.changePassword")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("settings.recentActivity")}</CardTitle>
        </CardHeader>
        <CardContent>
          <AuditLogList />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("settings.dangerZone")}</CardTitle>
        </CardHeader>
        <CardContent>
          <DeleteAccountSection />
        </CardContent>
      </Card>
    </main>
  );
}
