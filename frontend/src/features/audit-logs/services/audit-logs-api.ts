import { api } from "@/services/http-client";
import { AuditLogEntry } from "../types";

export async function fetchAuditLogs(): Promise<AuditLogEntry[]> {
  const response = await api.get<AuditLogEntry[]>("/audit-logs/");
  return response.data;
}
