"use client";

import { useAuditLogs } from "../hooks/use-audit-logs";
import { Skeleton } from "@/components/ui/skeleton";

const ACTION_LABELS: Record<string, string> = {
  delete_transaction: "Deleted transaction",
  delete_category: "Deleted category",
  delete_budget: "Deleted budget",
  delete_goal: "Deleted goal",
  delete_recurring_transaction: "Deleted recurring transaction",
  csv_import: "Imported CSV",
};

export function AuditLogList() {
  const { data: logs, isLoading, error } = useAuditLogs();

  return (
    <div aria-live="polite" className="space-y-3">
      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      )}
      {error && <p className="text-red-600">Failed to load activity</p>}
      {logs && logs.length === 0 && (
        <p className="text-muted-foreground">No activity recorded yet</p>
      )}
      {logs && logs.length > 0 && (
        <ul className="space-y-2">
          {logs.map((log) => (
            <li key={log.id} className="border-b pb-2 text-sm">
              <p className="font-medium">{ACTION_LABELS[log.action] ?? log.action}</p>
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
