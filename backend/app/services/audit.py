"""Append-Only Audit Log — tamper-evident operator action record.

Records are only ever appended. Every record carries a hash chain link so
backdoor edits are detectable. The API exposes no update/delete operations.
"""
import csv
import hashlib
import io
import json
import threading
import time
from typing import Dict, Any, List, Optional

RETENTION_CHOICES_DAYS = (7, 30, 90)

AUDIT_FIELDS = [
    "event_id", "timestamp", "operator_id", "operator_role", "action",
    "alert_id", "track_id", "reason_code", "previous_status", "new_status",
    "prev_hash", "record_hash",
]


def _hash_record(rec: Dict[str, Any], prev_hash: str) -> str:
    payload = json.dumps(
        {k: rec.get(k) for k in AUDIT_FIELDS if k not in ("prev_hash", "record_hash")},
        sort_keys=True, default=str,
    )
    return hashlib.sha256((prev_hash + payload).encode()).hexdigest()


class AuditLog:
    """Append-only audit store with hash chain and retention purge."""

    def __init__(self, retention_days: int = 7):
        self._lock = threading.Lock()
        self._records: List[Dict[str, Any]] = []
        self._counter = 0
        self._prev_hash = "GENESIS"
        if retention_days not in RETENTION_CHOICES_DAYS:
            raise ValueError(f"retention_days must be one of {RETENTION_CHOICES_DAYS}")
        self._retention_days = retention_days

    def append(self, operator_id: str, operator_role: str, action: str,
               alert_id: str = "", track_id: str = "", reason_code: str = "",
               previous_status: str = "", new_status: str = "",
               details: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        if not operator_id or not str(operator_id).strip():
            raise ValueError("operator_id is required")
        if not action:
            raise ValueError("action is required")
        with self._lock:
            self._counter += 1
            rec = {
                "event_id": f"AUD-{self._counter:06d}",
                "timestamp": time.time(),
                "operator_id": str(operator_id),
                "operator_role": str(operator_role).upper(),
                "action": str(action).upper(),
                "alert_id": alert_id or "",
                "track_id": track_id or "",
                "reason_code": str(reason_code).upper() if reason_code else "",
                "previous_status": previous_status or "",
                "new_status": new_status or "",
                "prev_hash": self._prev_hash,
            }
            rec["record_hash"] = _hash_record(rec, self._prev_hash)
            self._prev_hash = rec["record_hash"]
            if details:
                rec["details"] = details
            self._records.append(rec)
            return dict(rec)

    # No update/delete methods exist by design. UI cannot edit records.

    def list_records(self, limit: int = 200) -> List[Dict[str, Any]]:
        with self._lock:
            recs = list(self._records)
        recs.reverse()  # newest first
        return recs[:limit]

    def verify_chain(self) -> Dict[str, Any]:
        with self._lock:
            recs = list(self._records)
        prev = "GENESIS"
        for rec in recs:
            expected = _hash_record(rec, prev)
            if rec["record_hash"] != expected or rec["prev_hash"] != prev:
                return {"valid": False, "broken_at": rec["event_id"]}
            prev = rec["record_hash"]
        return {"valid": True, "records": len(recs)}

    # ── Retention ──
    @property
    def retention_days(self) -> int:
        return self._retention_days

    def set_retention(self, days: int, operator_id: str, role: str) -> Dict[str, Any]:
        from backend.app.services.registry import validate_operator
        validate_operator(operator_id, role, "manage_retention")
        if days not in RETENTION_CHOICES_DAYS:
            raise ValueError(f"retention_days must be one of {RETENTION_CHOICES_DAYS}")
        self._retention_days = days
        self.append(operator_id, role, "RETENTION_CHANGE", reason_code="OPERATOR REVIEW",
                    new_status=f"{days} DAYS")
        return {"retention_days": days}

    def purge_expired(self) -> int:
        """Remove records older than the configured retention. Returns purged count."""
        cutoff = time.time() - self._retention_days * 86400.0
        with self._lock:
            keep = [r for r in self._records if r["timestamp"] >= cutoff]
            purged = len(self._records) - len(keep)
            self._records = keep
        return purged

    # ── Export ──
    def export(self, fmt: str = "csv") -> Dict[str, Any]:
        fmt = str(fmt).lower()
        with self._lock:
            recs = list(self._records)
        if fmt == "json":
            body = json.dumps({"records": recs,
                               "chain": self.verify_chain(),
                               "exported_at": time.time()}, default=str, indent=2)
            return {"filename": "audit_export.json", "media_type": "application/json", "content": body}
        if fmt != "csv":
            raise ValueError("format must be 'csv' or 'json'")
        buf = io.StringIO()
        writer = csv.DictWriter(buf, fieldnames=AUDIT_FIELDS, extrasaction="ignore")
        writer.writeheader()
        for rec in recs:
            writer.writerow({k: rec.get(k, "") for k in AUDIT_FIELDS})
        return {"filename": "audit_export.csv", "media_type": "text/csv", "content": buf.getvalue()}


audit_log = AuditLog(retention_days=7)
