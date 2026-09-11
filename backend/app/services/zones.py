"""Zone / Geofence Engine — GeoJSON zones with altitude envelopes and expiry.

Uses shapely for point-in-polygon (a proper geospatial library). Expiry is
enforced backend-side: expired zones never generate violations.
"""
import threading
import time
import itertools
from typing import Dict, Any, List, Optional

from shapely.geometry import shape, Point

ZONE_TYPES = ("GREEN", "YELLOW", "RED")

_COUNTER = itertools.count(1)


def _parse_polygon(coords) -> List[List[float]]:
    """Parse a GeoJSON Polygon coordinate array into [[lon, lat], ...]."""
    if not isinstance(coords, list) or not coords:
        raise ValueError("geometry.coordinates must be a non-empty list of rings")
    ring = coords[0]
    if not isinstance(ring, list) or len(ring) < 3:
        raise ValueError("polygon ring must contain at least 3 positions")
    parsed = []
    for pos in ring:
        if not isinstance(pos, list) or len(pos) < 2:
            raise ValueError("each position must be [lon, lat]")
        lon, lat = float(pos[0]), float(pos[1])
        if not (-180.0 <= lon <= 180.0) or not (-90.0 <= lat <= 90.0):
            raise ValueError(f"invalid coordinates lon={lon} lat={lat}")
        parsed.append([lon, lat])
    return parsed


def validate_zone_payload(payload: Dict[str, Any], require_all: bool = False) -> Dict[str, Any]:
    """Validate a zone creation/update payload; returns normalized fields."""
    out: Dict[str, Any] = {}
    name = payload.get("name")
    if name is not None:
        name = str(name).strip()
        if not name or len(name) > 120:
            raise ValueError("zone name must be 1-120 characters")
        out["name"] = name
    elif require_all:
        raise ValueError("zone name is required")

    ztype = payload.get("zone_type")
    if ztype is not None:
        ztype = str(ztype).upper()
        if ztype not in ZONE_TYPES:
            raise ValueError(f"zone_type must be one of {ZONE_TYPES}")
        out["zone_type"] = ztype
    elif require_all:
        raise ValueError("zone_type is required")

    geom = payload.get("geometry")
    if geom is not None:
        if not isinstance(geom, dict) or geom.get("type") != "Polygon":
            raise ValueError("geometry must be GeoJSON Polygon type")
        out["coordinates"] = _parse_polygon(geom.get("coordinates"))
    elif require_all:
        raise ValueError("geometry (GeoJSON Polygon) is required")

    def _alt(key: str, required: bool) -> Optional[float]:
        v = payload.get(key)
        if v is None:
            if required:
                raise ValueError(f"{key} is required")
            return None
        v = float(v)
        if not (-500.0 <= v <= 25000.0) or v != v:  # NaN guard
            raise ValueError(f"{key} must be between -500 and 25000 m")
        return v

    min_a = _alt("min_altitude_m", require_all)
    max_a = _alt("max_altitude_m", require_all)
    if min_a is not None and max_a is not None and min_a > max_a:
        raise ValueError("min_altitude_m must be <= max_altitude_m")
    if min_a is not None:
        out["min_altitude_m"] = min_a
    if max_a is not None:
        out["max_altitude_m"] = max_a

    dur = payload.get("duration_s")
    if dur is not None:
        dur = float(dur)
        if not (5.0 <= dur <= 86400.0):
            raise ValueError("duration_s must be between 5 and 86400 seconds")
        out["duration_s"] = dur
    return out


class ZoneEngine:
    """In-memory GeoJSON zone store with altitude envelopes and expiry."""

    def __init__(self):
        self._lock = threading.Lock()
        self._zones: Dict[str, Dict[str, Any]] = {}

    # ── CRUD ──
    def create_zone(self, name: str, zone_type: str, coordinates: List[List[float]],
                    min_altitude_m: float, max_altitude_m: float,
                    duration_s: Optional[float] = None,
                    created_by: str = "SYSTEM") -> Dict[str, Any]:
        now = time.time()
        zone_id = f"ZONE-{next(_COUNTER):04d}"
        zone = {
            "zone_id": zone_id,
            "name": name,
            "zone_type": zone_type,
            "geometry": {"type": "Polygon", "coordinates": [coordinates]},
            "min_altitude_m": float(min_altitude_m),
            "max_altitude_m": float(max_altitude_m),
            "active_from": now,
            "expires_at": (now + float(duration_s)) if duration_s else None,
            "temporary": duration_s is not None,
            "created_by": created_by,
            "created_at": now,
        }
        with self._lock:
            self._zones[zone_id] = zone
        out = dict(zone)
        out["expired"] = False
        out["active"] = True
        if duration_s:
            out["seconds_remaining"] = round(float(duration_s), 1)
        return out

    def delete_zone(self, zone_id: str) -> bool:
        with self._lock:
            return self._zones.pop(str(zone_id), None) is not None

    def get_zone(self, zone_id: str) -> Optional[Dict[str, Any]]:
        with self._lock:
            z = self._zones.get(str(zone_id))
            return dict(z) if z else None

    # ── Queries ──
    def list_zones(self, include_expired: bool = True) -> List[Dict[str, Any]]:
        now = time.time()
        with self._lock:
            zones = [dict(z) for z in self._zones.values()]
        out = []
        for z in zones:
            z["expired"] = bool(z["expires_at"] and now >= z["expires_at"])
            if z["expired"] and not include_expired:
                continue
            z["active"] = (not z["expired"]) and now >= z["active_from"]
            if z["expires_at"]:
                z["seconds_remaining"] = max(0.0, round(z["expires_at"] - now, 1))
            out.append(z)
        # newest first
        out.sort(key=lambda z: z["created_at"], reverse=True)
        return out

    def active_zones(self) -> List[Dict[str, Any]]:
        return [z for z in self.list_zones(include_expired=False) if z["active"]]

    # ── Geofence evaluation ──
    def evaluate(self, lat: float, lon: float, altitude_m: float) -> Dict[str, Any]:
        """Point-in-polygon + altitude envelope against ACTIVE zones only.

        Returns {"in_zone": bool, "zone": dict|None, "reason": str}.
        Expired zones can NEVER produce a violation (they are filtered out first).
        """
        lat = float(lat)
        lon = float(lon)
        alt = float(altitude_m)
        pt = Point(lon, lat)  # shapely is x=lon, y=lat
        for zone in self.active_zones():
            poly = shape(zone["geometry"])
            if poly.covers(pt):
                altitude_applicable = True
                reasons = []
                if zone["min_altitude_m"] is not None and alt < zone["min_altitude_m"]:
                    altitude_applicable = False
                    reasons.append(
                        f"below min altitude {zone['min_altitude_m']:.0f} m (actual {alt:.0f} m)")
                if zone["max_altitude_m"] is not None and alt > zone["max_altitude_m"]:
                    altitude_applicable = False
                    reasons.append(
                        f"above max altitude {zone['max_altitude_m']:.0f} m (actual {alt:.0f} m)")
                if not altitude_applicable:
                    # Inside polygon but outside altitude envelope: compliant
                    return {
                        "in_zone": True,
                        "violating": False,
                        "zone": zone,
                        "reason": "; ".join(reasons),
                    }
                return {
                    "in_zone": True,
                    "violating": True,
                    "zone": zone,
                    "reason": (f"{zone['zone_type']} zone '{zone['name']}': position inside zone "
                               f"and altitude {alt:.0f} m within envelope "
                               f"[{zone['min_altitude_m']:.0f}, {zone['max_altitude_m']:.0f}] m"),
                }
        return {"in_zone": False, "violating": False, "zone": None, "reason": ""}


zone_engine = ZoneEngine()

# ── Default jurisdiction zones (demo, persistent for backend lifetime) ──
DEFAULT_ZONES = [
    {
        "name": "Coastal Restricted FRZ-Alpha",
        "zone_type": "RED",
        # Small polygon on the Chennai coast (demo jurisdiction)
        "coordinates": [[80.240, 13.050], [80.320, 13.050], [80.320, 13.110], [80.240, 13.110], [80.240, 13.050]],
        "min_altitude_m": 0.0,
        "max_altitude_m": 400.0,
    },
    {
        "name": "Harbor Approach Caution",
        "zone_type": "YELLOW",
        "coordinates": [[80.270, 13.080], [80.360, 13.080], [80.360, 13.160], [80.270, 13.160], [80.270, 13.080]],
        "min_altitude_m": 0.0,
        "max_altitude_m": 250.0,
    },
    {
        "name": "Open Training Area",
        "zone_type": "GREEN",
        "coordinates": [[80.150, 12.980], [80.260, 12.980], [80.260, 13.060], [80.150, 13.060], [80.150, 12.980]],
        "min_altitude_m": 0.0,
        "max_altitude_m": 300.0,
    },
]


def seed_default_zones(engine: ZoneEngine = zone_engine) -> None:
    for spec in DEFAULT_ZONES:
        engine.create_zone(
            name=spec["name"],
            zone_type=spec["zone_type"],
            coordinates=spec["coordinates"],
            min_altitude_m=spec["min_altitude_m"],
            max_altitude_m=spec["max_altitude_m"],
            duration_s=None,
            created_by="SYSTEM",
        )
