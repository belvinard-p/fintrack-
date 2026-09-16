import { useQuery } from "@tanstack/react-query";
import { fetchAuditLogs } from "../services/audit-logs-api";

export function useAuditLogs() {
  return useQuery({
    queryKey: ["audit-logs"],
    queryFn: fetchAuditLogs,
  });
}
