"""Telemetry Simulator — persistent multi-actor Remote-ID feed (SIMULATION).

Actors persist between updates and move smoothly; the feed is never regenerated
per request. Supports AUTHORIZED / UNREGISTERED actors, zone violators, and
lost-link drops. All data is SIMULATED_REMOTE_ID telemetry.
"""
import itertools
import math
import random
import time
from typing import Dict, Any, List, Optional

from backend.app.services.registry import FEED_SOURCE

# Demo jurisdiction: coastal area near Chennai (13.03 N, 80.27 E)
CENTER_LAT = 13.070
CENTER_LON = 80.280
DEG_PER_M_LAT = 1.0 / 111_320.0

_counter = itertools.count(1)


def _meters_to_deg_lat(m: float) -> float:
    return m * DEG_PER_M_LAT


def _meters_to_deg_lon(m: float, lat: float) -> float:
    return m * DEG_PER_M_LAT / max(0.2, math.cos(math.radians(lat)))


class TelemetryActor:
    """One persistent simulated aircraft with smooth kinematics."""

    def __init__(self, actor_type: str = "drone", authorization: str = "UNREGISTERED",
                 remote_id: Optional[str] = None, lat: Optional[float] = None,
                 lon: Optional[float] = None, altitude_m: Optional[float] = None,
                 track_id: Optional[str] = None):
        rng = random.Random()
        self.track_id = track_id or f"TRK-{next(_counter):04d}"
        self.actor_type = actor_type  # drone | aircraft | bird
        self.authorization = authorization  # AUTHORIZED | UNREGISTERED
        self.remote_id = remote_id or (
            f"RID-{rng.randint(100, 999)}" if authorization == "AUTHORIZED" else "UNKNOWN")
        self.lat = lat if lat is not None else CENTER_LAT + _meters_to_deg_lat(rng.uniform(-1500, 1500))
        self.lon = lon if lon is not None else CENTER_LON + _meters_to_deg_lon(
            rng.uniform(-1500, 1500), self.lat)
        if actor_type == "aircraft":
            self.altitude_m = altitude_m if altitude_m is not None else rng.uniform(800, 1200)
            self.velocity = rng.uniform(60, 90)
        elif actor_type == "bird":
            self.altitude_m = altitude_m if altitude_m is not None else rng.uniform(30, 90)
            self.velocity = rng.uniform(6, 14)
        else:
            self.altitude_m = altitude_m if altitude_m is not None else rng.uniform(20, 180)
            self.velocity = rng.uniform(2, 18)
        self.heading = rng.uniform(0, 360)
        self.turn_rate = rng.uniform(-8, 8)          # deg/s
        self.confidence = rng.uniform(0.75, 0.98)
        self.link_up = True
        self.drop_until = 0.0                        # if link drops, until when
        self.route_target: Optional[Dict[str, float]] = None
        self.created_at = time.time()
        self.last_seen = time.time()
        self.track_history: List[Dict[str, Any]] = []

    # ── kinematics ──
    def step(self, dt: float) -> None:
        now = time.time()
        if not self.link_up:
            if now >= self.drop_until:
                self.link_up = True
            return  # no telemetry while link down
        # If routed, steer toward the route target
        if self.route_target:
            dlat = self.route_target["lat"] - self.lat
            dlon = self.route_target["lon"] - self.lon
            dist_m = math.hypot(dlat / DEG_PER_M_LAT, dlon / (DEG_PER_M_LAT * math.cos(math.radians(self.lat))))
            if dist_m < 25.0:  # arrived
                self.route_target = None
            else:
                target_heading = math.degrees(math.atan2(
                    dlon / max(1e-9, math.cos(math.radians(self.lat))), dlat)) % 360.0
                diff = (target_heading - self.heading + 540.0) % 360.0 - 180.0
                max_turn = max(30.0, self.velocity * 6.0) * dt
                self.heading += max(-max_turn, min(max_turn, diff))
                # climb/descend toward route altitude if given
                if self.route_target.get("altitude_m") is not None:
                    ta = float(self.route_target["altitude_m"])
                    step = max(2.0, abs(ta - self.altitude_m)) * min(1.0, dt * 0.8)
                    if self.altitude_m < ta:
                        self.altitude_m = min(ta, self.altitude_m + step)
                    else:
                        self.altitude_m = max(ta, self.altitude_m - step)
        else:
            self.heading = (self.heading + self.turn_rate * dt) % 360.0
            self.turn_rate += random.uniform(-1.0, 1.0)
            self.turn_rate = max(-10.0, min(10.0, self.turn_rate))
        speed = self.velocity * (0.9 + 0.2 * random.random())
        dist_m = speed * dt
        self.lat += _meters_to_deg_lat(dist_m * math.cos(math.radians(self.heading)))
        self.lon += _meters_to_deg_lon(dist_m * math.sin(math.radians(self.heading)), self.lat)
        # Soft-bounce inside the Chennai coastal surveillance sector
        if self.lat < 13.020 or self.lat > 13.135 or self.lon < 80.240 or self.lon > 80.345:
            to_center = math.degrees(math.atan2(CENTER_LON - self.lon, CENTER_LAT - self.lat)) % 360.0
            self.heading = to_center
            self.route_target = None
        self.last_seen = now

    def report(self) -> Dict[str, Any]:
        now = time.time()
        rep = {
            "track_id": self.track_id,
            "remote_id": self.remote_id,
            "timestamp": now,
            "latitude": round(self.lat, 6),
            "longitude": round(self.lon, 6),
            "altitude_m": round(self.altitude_m, 1),
            "velocity_mps": round(self.velocity, 1),
            "heading_deg": round(self.heading, 1),
            "authorization_status": self.authorization,
            "actor_type": self.actor_type,
            "source": FEED_SOURCE,
            "last_seen": self.last_seen,
            "track_confidence": round(self.confidence, 3),
            "link_up": self.link_up,
        }
        self.track_history.append(
            {"lat": rep["latitude"], "lon": rep["longitude"],
             "alt": rep["altitude_m"], "t": rep["timestamp"]})
        if len(self.track_history) > 60:
            self.track_history.pop(0)
        return rep


class TelemetrySimulator:
    """Maintains 8-15 persistent actors and produces telemetry reports."""

    def __init__(self):
        self._lock_res = __import__("threading").Lock()
        self.actors: Dict[str, TelemetryActor] = {}
        self._last_step = time.time()
        self.randomize_airspace()

    # ── population management ──
    def randomize_airspace(self) -> List[str]:
        """Reset to a mixed airspace distributed across specified operational sectors and ambient zones."""
        rng = random.Random()
        self.actors.clear()
        ids = []

        # 1. Specified Area A: INS Adyar Naval Defense Sector (13.068 N, 80.298 E)
        naval_specs = [
            ("drone", "AUTHORIZED", 13.070, 80.299, 75.0),
            ("drone", "AUTHORIZED", 13.064, 80.295, 60.0),
            ("drone", "UNREGISTERED", 13.074, 80.302, 85.0),
        ]
        for atype, auth, slat, slon, salt in naval_specs:
            a = TelemetryActor(actor_type=atype, authorization=auth, lat=slat, lon=slon, altitude_m=salt)
            self.actors[a.track_id] = a
            ids.append(a.track_id)

        # 2. Specified Area B: Chennai Port Commercial Logistics Sector (13.098 N, 80.308 E)
        port_specs = [
            ("drone", "AUTHORIZED", 13.096, 80.306, 50.0),
            ("drone", "AUTHORIZED", 13.102, 80.312, 70.0),
            ("drone", "UNREGISTERED", 13.092, 80.315, 95.0),
        ]
        for atype, auth, slat, slon, salt in port_specs:
            a = TelemetryActor(actor_type=atype, authorization=auth, lat=slat, lon=slon, altitude_m=salt)
            self.actors[a.track_id] = a
            ids.append(a.track_id)

        # 3. Specified Area C: Marina Beach Coastal Public Corridor (13.045 N, 80.282 E)
        marina_specs = [
            ("drone", "AUTHORIZED", 13.048, 80.283, 40.0),
            ("drone", "UNREGISTERED", 13.041, 80.281, 55.0),
        ]
        for atype, auth, slat, slon, salt in marina_specs:
            a = TelemetryActor(actor_type=atype, authorization=auth, lat=slat, lon=slon, altitude_m=salt)
            self.actors[a.track_id] = a
            ids.append(a.track_id)

        # 4. Random Ambient Airspace across wider Chennai coastal and inland sectors (6-8 actors)
        n_ambient = rng.randint(6, 8)
        for _ in range(n_ambient):
            roll = rng.random()
            if roll < 0.55:
                auth = "AUTHORIZED"
                rtype = rng.choice(["drone", "drone", "aircraft", "bird"])
            else:
                auth = "UNREGISTERED"
                rtype = rng.choice(["drone", "drone", "bird"])

            rand_lat = rng.uniform(13.025, 13.125)
            rand_lon = rng.uniform(80.250, 80.335)
            rand_alt = rng.uniform(30.0, 160.0) if rtype == "drone" else (rng.uniform(800, 1200) if rtype == "aircraft" else rng.uniform(25, 60))
            a = TelemetryActor(actor_type=rtype, authorization=auth, lat=rand_lat, lon=rand_lon, altitude_m=rand_alt)
            self.actors[a.track_id] = a
            ids.append(a.track_id)

        self._last_step = time.time()
        return ids

    def spawn(self, actor_type: str = "drone", authorization: str = "UNREGISTERED",
              route_into_center: bool = False) -> TelemetryActor:
        if len(self.actors) >= 20:
            # Recycle the oldest unregistered non-routed actor if at capacity
            victims = [a for a in self.actors.values()
                       if a.authorization == "UNREGISTERED" and not a.route_target]
            if victims:
                self.actors.pop(sorted(victims, key=lambda x: x.created_at)[0].track_id)
            else:
                oldest = sorted(self.actors.values(), key=lambda x: x.created_at)[0]
                self.actors.pop(oldest.track_id)
        a = TelemetryActor(actor_type=actor_type, authorization=authorization)
        if route_into_center:
            a.route_target = {"lat": CENTER_LAT, "lon": CENTER_LON,
                              "altitude_m": min(120.0, a.altitude_m)}
        self.actors[a.track_id] = a
        return a

    def route_into_red_zone(self, track_id: Optional[str] = None) -> Optional[TelemetryActor]:
        """Route an unregistered drone into the coastal RED zone (demo path)."""
        candidates = [a for a in self.actors.values()
                      if a.authorization == "UNREGISTERED" and a.actor_type == "drone"]
        if track_id:
            a = self.actors.get(track_id)
            if a:
                candidates = [a]
        if not candidates:
            return None
        a = candidates[0]
        # Red FRZ-Alpha center (see zones.DEFAULT_ZONES)
        a.route_target = {"lat": 13.080, "lon": 80.280, "altitude_m": 90.0}
        return a

    def drop_link(self, track_id: Optional[str] = None) -> Optional[TelemetryActor]:
        a = self.actors.get(track_id) if track_id else random.choice(list(self.actors.values()))
        if not a:
            return None
        a.link_up = False
        a.drop_until = time.time() + random.uniform(45, 120)
        return a

    def restore_links(self) -> int:
        n = 0
        for a in self.actors.values():
            if not a.link_up:
                a.link_up = True
                a.drop_until = 0.0
                n += 1
        return n

    def clear(self) -> None:
        self.actors.clear()

    def remove(self, track_id: str) -> bool:
        return self.actors.pop(track_id, None) is not None

    # ── stepping + reports ──
    def step(self) -> List[Dict[str, Any]]:
        """Advance simulation and return one telemetry report per linked actor."""
        with self._lock_res:
            now = time.time()
            dt = min(2.0, max(0.05, now - self._last_step))
            self._last_step = now
            for a in self.actors.values():
                a.step(dt)
            return [a.report() for a in self.actors.values() if a.link_up]

    @property
    def actor_count(self) -> int:
        return len(self.actors)
