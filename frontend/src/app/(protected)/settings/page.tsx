"use client";

import { ChangePasswordForm, ChangeEmailForm, DeleteAccountSection, useCurrentUser } from "@/features/auth";
import { AuditLogList } from "@/features/audit-logs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/lib/i18n";

export default function SettingsPage() {
  const { t } = useLanguage();
  const { data: user } = useCurrentUser();
  // A demo account has no password and is deleted by itself: these actions do not apply (the server refuses them too).
  const isDemo = user?.is_demo === true;

  return (
    <main className="p-4 space-y-8 sm:p-8 max-w-2xl">
      <h1 className="text-2xl font-bold">{t("settings.title")}</h1>

      {isDemo ? (
        <p className="rounded-md border bg-muted/40 p-4 text-sm text-muted-foreground">{t("demo.settingsNote")}</p>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.changeEmail")}</CardTitle>
            </CardHeader>
            <CardContent>
              <ChangeEmailForm />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("settings.changePassword")}</CardTitle>
            </CardHeader>
            <CardContent>
              <ChangePasswordForm />
            </CardContent>
          </Card>
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t("settings.recentActivity")}</CardTitle>
        </CardHeader>
        <CardContent>
          <AuditLogList />
        </CardContent>
      </Card>

      {!isDemo && (
        <Card>
          <CardHeader>
            <CardTitle>{t("settings.dangerZone")}</CardTitle>
          </CardHeader>
          <CardContent>
            <DeleteAccountSection />
          </CardContent>
        </Card>
      )}
    </main>
  );
}
