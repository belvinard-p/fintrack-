from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog


def log_action(db: Session, user_id: int, action: str, details: str | None = None) -> None:
    """Record a destructive/notable action. Does not commit — the caller's
    existing transaction commit will persist it alongside the action itself.
    """
    db.add(AuditLog(user_id=user_id, action=action, details=details))
