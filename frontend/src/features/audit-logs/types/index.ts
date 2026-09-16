export interface AuditLogEntry {
  id: number;
  action: string;
  details: string | null;
  created_at: string;
}
