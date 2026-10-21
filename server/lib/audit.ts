import type { Db } from "../db.ts";

export interface AuditEntry {
  actorId: number | null;
  action: string;
  entityType: string;
  entityId?: string | number | null;
  storeId?: number | null;
  details?: Record<string, unknown>;
  ip?: string | null;
}

export function audit(db: Db, e: AuditEntry) {
  db.run(
    `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, store_id, details, ip)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      e.actorId,
      e.action,
      e.entityType,
      e.entityId == null ? null : String(e.entityId),
      e.storeId ?? null,
      JSON.stringify(e.details ?? {}),
      e.ip ?? null,
    ],
  );
}
