"""Authorization Registry — separate from target type, separate from geofence.

Unknown remote IDs are always UNREGISTERED. Authorization never comes from RF,
vision, or position: only from this registry.
"""
import threading
import time
from typing import Dict, Any, Optional, Set

# ── Status / vocabulary constants (single source of truth) ──
AUTH_STATUS = ("AUTHORIZED", "UNREGISTERED")
TRACK_STATUS = ("AUTHORIZED", "UNREGISTERED", "OUT_OF_ENVELOPE", "LOST_LINK")
FEED_SOURCE = "SIMULATED_REMOTE_ID"
DARK_VESSEL_NOTE = "DARK VESSEL: NOT APPLICABLE — TRACK A"

# Deterministic priority rules (documented in README):
PRIORITY_RULES = {
    "AUTHORIZED": "LOW",            # informational
    "UNREGISTERED": "HIGH",         # unknown operator, no flight authorization
    "OUT_OF_ENVELOPE_RED": "CRITICAL",   # violating a RED zone
    "OUT_OF_ENVELOPE_YELLOW": "HIGH",    # violating a YELLOW zone
    "OUT_OF_ENVELOPE_GREEN": "MEDIUM",   # violating a GREEN zone envelope
    "LOST_LINK": "MEDIUM",          # telemetry lost (recent) — elevates with age
}

# Deterministic suggested-action bands (civil enforcement only — never interdiction)
ACTION_RULES = {
    "AUTHORIZED": "MONITOR",
    "UNREGISTERED": "VERIFY AUTHORIZATION",
    "OUT_OF_ENVELOPE_RED": "ESCALATE TO SUPERVISOR",
    "OUT_OF_ENVELOPE_YELLOW": "CONTACT OPERATOR",
    "OUT_OF_ENVELOPE_GREEN": "DISPATCH OBSERVER",
    "LOST_LINK": "VERIFY AUTHORIZATION",
}

REASON_CODES = (
    "AUTHORIZED ACTIVITY",
    "FALSE POSITIVE",
    "VERIFIED VIOLATION",
    "LOST TELEMETRY",
    "OPERATOR REVIEW",
    "OTHER",
)

DISPOSITION_ACTIONS = ("CONFIRM", "DISMISS", "ESCALATE")
DISPOSITION_STATUSES = ("OPEN", "CONFIRMED", "DISMISSED", "ESCALATED")

ROLES = ("OPERATOR", "SUPERVISOR")
# Lightweight RBAC: OPERATOR cannot escalate/export; SUPERVISOR can do everything.
ROLE_PERMISSIONS = {
    "OPERATOR": {"view", "confirm", "dismiss", "create_zone", "spawn"},
    "SUPERVISOR": {"view", "confirm", "dismiss", "escalate", "export_audit",
                   "manage_retention", "create_zone", "spawn"},
}

LOST_LINK_TIMEOUT_S = 12.0  # configurable; tracks silent longer than this are LOST_LINK


def validate_operator(operator_id: str, role: str, permission: str) -> None:
    """Attribute + authorize an operator action. Raises PermissionError on violation."""
    if not operator_id or not str(operator_id).strip():
        raise ValueError("operator_id is required for every action")
    role_u = str(role).upper()
    if role_u not in ROLE_PERMISSIONS:
        raise ValueError(f"unknown role '{role}'")
    if permission not in ROLE_PERMISSIONS[role_u]:
        raise PermissionError(
            f"role {role_u} is not permitted to perform '{permission}'"
        )


class AuthorizationRegistry:
    """Remote-ID → authorization status. Unknown IDs are UNREGISTERED."""

    def __init__(self):
        self._lock = threading.Lock()
        self._entries: Dict[str, Dict[str, Any]] = {}

    def lookup(self, remote_id: str) -> str:
        with self._lock:
            entry = self._entries.get(str(remote_id))
        return entry["status"] if entry else "UNREGISTERED"

    def is_known(self, remote_id: str) -> bool:
        with self._lock:
            return str(remote_id) in self._entries

    def register(self, remote_id: str, status: str = "AUTHORIZED",
                 operator_id: str = "SYSTEM", role: str = "SUPERVISOR",
                 notes: str = "") -> Dict[str, Any]:
        if status not in AUTH_STATUS:
            raise ValueError(f"authorization status must be one of {AUTH_STATUS}")
        if not remote_id or not str(remote_id).strip():
            raise ValueError("remote_id is required")
        with self._lock:
            entry = {
                "remote_id": str(remote_id),
                "status": status,
                "registered_by": operator_id,
                "registered_at": time.time(),
                "notes": notes,
            }
            self._entries[str(remote_id)] = entry
        return dict(entry)

    def list_all(self) -> Dict[str, Any]:
        with self._lock:
            entries = [dict(e) for e in self._entries.values()]
        return {
            "entries": entries,
            "authorized": sorted(e["remote_id"] for e in entries if e["status"] == "AUTHORIZED"),
            "unregistered": sorted(e["remote_id"] for e in entries if e["status"] == "UNREGISTERED"),
            "policy": "Unknown remote IDs are UNREGISTERED. "
                      "Authorization is independent of geofence state and RF/vision classification.",
        }

    def remove(self, remote_id: str) -> bool:
        with self._lock:
            return self._entries.pop(str(remote_id), None) is not None
