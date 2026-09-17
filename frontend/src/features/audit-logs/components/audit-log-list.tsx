"use client";

import { useAuditLogs } from "../hooks/use-audit-logs";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/lib/i18n";

export function AuditLogList() {
  const { t } = useLanguage();
  const { data: logs, isLoading, error } = useAuditLogs();

  function actionLabel(action: string): string {
    const label = t(`auditLogs.actions.${action}`);
    return label === `auditLogs.actions.${action}` ? action : label;
  }

  return (
    <div aria-live="polite" className="space-y-3">
      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      )}
      {error && <p className="text-red-600">{t("auditLogs.failed")}</p>}
      {logs && logs.length === 0 && (
        <p className="text-muted-foreground">{t("auditLogs.empty")}</p>
      )}
      {logs && logs.length > 0 && (
        <ul className="space-y-2">
          {logs.map((log) => (
            <li key={log.id} className="border-b pb-2 text-sm">
              <p className="font-medium">{actionLabel(log.action)}</p>
              {log.details && <p className="text-muted-foreground">{log.details}</p>}
              <p className="text-xs text-muted-foreground">
                {new Date(log.created_at).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
