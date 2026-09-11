import os
import sqlite3
import json
import hashlib
from datetime import datetime, timezone, timedelta

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
DB_PATH = os.path.join(DATA_DIR, "aeroguard.db")

GENESIS_HASH = "0" * 64

def hash_password(password: str) -> str:
    salt = "aeroguard_secure_salt_2026"
    return hashlib.sha256(f"{salt}{password}".encode('utf-8')).hexdigest()

def verify_password(password: str, password_hash: str) -> bool:
    return hash_password(password) == password_hash

def calculate_audit_hash(timestamp: str, operator_id: str, action: str, resource_id: str,
                         result: str, reason_code: str, details: str, previous_hash: str) -> str:
    payload = f"{timestamp}|{operator_id}|{action}|{resource_id}|{result}|{reason_code or ''}|{details or ''}|{previous_hash}"
    return hashlib.sha256(payload.encode('utf-8')).hexdigest()

def get_db():
    os.makedirs(DATA_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH, timeout=30.0, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA synchronous=NORMAL")
    conn.execute("PRAGMA busy_timeout=30000")
    cursor = conn.cursor()

    # 1. Users & Admins & Operators
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL,
        full_name TEXT,
        organization TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # 2. Drones Registry
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS drones (
        drone_id TEXT PRIMARY KEY,
        uin_number TEXT UNIQUE NOT NULL,
        model_name TEXT NOT NULL,
        drone_type TEXT NOT NULL,
        weight_category TEXT,
        owner_name TEXT NOT NULL,
        operator_contact TEXT,
        registration_status TEXT NOT NULL,
        registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # 3. Flight Permissions
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS flight_permissions (
        permission_id TEXT PRIMARY KEY,
        drone_id TEXT NOT NULL,
        operator_name TEXT NOT NULL,
        flight_purpose TEXT,
        allowed_zone TEXT NOT NULL,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP NOT NULL,
        max_altitude_m REAL NOT NULL,
        status TEXT NOT NULL,
        approved_by TEXT,
        requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (drone_id) REFERENCES drones(drone_id)
    )
    """)

    # 4. Cameras
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS camera_devices (
        camera_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        coverage_radius_m REAL NOT NULL,
        heading_deg REAL NOT NULL,
        fov_deg REAL NOT NULL,
        status TEXT NOT NULL,
        stream_type TEXT NOT NULL
    )
    """)

    # 5. Restricted Zones / Geofences (with expiration & temporary red zone support)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS restricted_zones (
        zone_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        zone_type TEXT NOT NULL,
        min_altitude_m REAL NOT NULL,
        max_altitude_m REAL NOT NULL,
        polygon_coords TEXT NOT NULL,
        severity TEXT NOT NULL,
        description TEXT,
        expires_at TIMESTAMP,
        created_by TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        active INTEGER DEFAULT 1,
        reason TEXT
    )
    """)
    for col, col_type in [
        ("expires_at", "TIMESTAMP"),
        ("created_by", "TEXT"),
        ("created_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"),
        ("active", "INTEGER DEFAULT 1"),
        ("reason", "TEXT")
    ]:
        try:
            cursor.execute(f"ALTER TABLE restricted_zones ADD COLUMN {col} {col_type}")
        except Exception:
            pass

    # 6. Object Tracks (Track Manager)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS object_tracks (
        track_id TEXT PRIMARY KEY,
        uas_id TEXT,
        object_type TEXT NOT NULL,
        radar_confidence REAL,
        camera_confidence REAL,
        fusion_status TEXT NOT NULL,
        current_lat REAL NOT NULL,
        current_lon REAL NOT NULL,
        altitude_m REAL,
        speed_mps REAL,
        heading_deg REAL,
        source TEXT DEFAULT 'REMOTE_ID_SIM',
        authorization_status TEXT NOT NULL,
        geofence_status TEXT NOT NULL,
        risk_level TEXT NOT NULL,
        risk_reasons TEXT,
        alert_classification TEXT,
        alert_subtype TEXT,
        suggested_action TEXT,
        associated_camera_id TEXT,
        is_active INTEGER DEFAULT 1,
        first_detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    for col, col_type in [
        ("uas_id", "TEXT"),
        ("source", "TEXT DEFAULT 'REMOTE_ID_SIM'"),
        ("alert_classification", "TEXT"),
        ("alert_subtype", "TEXT"),
        ("suggested_action", "TEXT"),
        ("last_seen", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    ]:
        try:
            cursor.execute(f"ALTER TABLE object_tracks ADD COLUMN {col} {col_type}")
        except Exception:
            pass

    # 7. Telemetry Reports (Raw Ingested Records)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS telemetry_reports (
        report_id TEXT PRIMARY KEY,
        track_id TEXT NOT NULL,
        uas_id TEXT,
        source TEXT NOT NULL,
        timestamp TIMESTAMP NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        altitude_m REAL NOT NULL,
        speed_mps REAL NOT NULL,
        heading_deg REAL NOT NULL,
        ingest_timestamp REAL NOT NULL,
        processing_timestamp REAL,
        alert_timestamp REAL,
        latency_ms REAL,
        FOREIGN KEY (track_id) REFERENCES object_tracks(track_id)
    )
    """)

    # 8. Alerts (with primary taxonomy & disposition tracking)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS alerts (
        alert_id TEXT PRIMARY KEY,
        track_id TEXT NOT NULL,
        alert_type TEXT NOT NULL,
        subtype TEXT,
        severity TEXT NOT NULL,
        title TEXT NOT NULL,
        reason TEXT NOT NULL,
        latitude REAL,
        longitude REAL,
        recommended_action TEXT,
        suggested_action TEXT,
        status TEXT DEFAULT 'ACTIVE',
        disposition TEXT,
        disposition_reason TEXT,
        disposition_notes TEXT,
        disposition_by TEXT,
        disposition_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    for col, col_type in [
        ("subtype", "TEXT"),
        ("suggested_action", "TEXT"),
        ("disposition", "TEXT"),
        ("disposition_reason", "TEXT"),
        ("disposition_notes", "TEXT"),
        ("disposition_by", "TEXT"),
        ("disposition_at", "TIMESTAMP")
    ]:
        try:
            cursor.execute(f"ALTER TABLE alerts ADD COLUMN {col} {col_type}")
        except Exception:
            pass

    # 9. Incidents
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS incidents (
        incident_id TEXT PRIMARY KEY,
        track_id TEXT NOT NULL,
        incident_type TEXT NOT NULL,
        severity TEXT NOT NULL,
        location_name TEXT,
        latitude REAL,
        longitude REAL,
        status TEXT DEFAULT 'OPEN',
        assigned_officer TEXT,
        summary TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # 10. Evidence Dossier
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS evidence (
        evidence_id TEXT PRIMARY KEY,
        incident_id TEXT NOT NULL,
        track_id TEXT NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        event_type TEXT NOT NULL,
        details TEXT NOT NULL,
        data_payload TEXT,
        FOREIGN KEY (incident_id) REFERENCES incidents(incident_id)
    )
    """)

    # 11. Tamper-Evident Audit Logs (Cryptographic Hash Chain)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        audit_id TEXT UNIQUE,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        operator_id TEXT NOT NULL,
        operator_role TEXT,
        action TEXT NOT NULL,
        resource_type TEXT,
        resource_id TEXT,
        result TEXT NOT NULL,
        reason_code TEXT,
        details TEXT,
        previous_hash TEXT NOT NULL,
        current_hash TEXT NOT NULL
    )
    """)
    for col, col_type in [
        ("audit_id", "TEXT"),
        ("operator_id", "TEXT"),
        ("user_name", "TEXT"),
        ("operator_role", "TEXT"),
        ("resource_type", "TEXT"),
        ("resource", "TEXT"),
        ("resource_id", "TEXT"),
        ("reason_code", "TEXT"),
        ("previous_hash", "TEXT"),
        ("current_hash", "TEXT")
    ]:
        try:
            cursor.execute(f"ALTER TABLE audit_logs ADD COLUMN {col} {col_type}")
        except Exception:
            pass

    # 12. System Settings (e.g., retention, timeouts)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS system_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # 13. Vision Detections (Multi-Object & Optical AI Logging)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS vision_detections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        camera_id TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        track_id TEXT,
        class_name TEXT NOT NULL,
        confidence REAL NOT NULL,
        bbox TEXT,
        sensor_mode TEXT DEFAULT 'EO',
        is_simulated INTEGER DEFAULT 1,
        inference_time_ms REAL
    )
    """)

    # 14. Sensor Observations (Raw Radar & Sensor Observations)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sensor_observations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sensor_type TEXT NOT NULL,
        sensor_id TEXT NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        track_id TEXT,
        raw_payload TEXT,
        correlated INTEGER DEFAULT 0
    )
    """)

    # 15. Alert Dispositions
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS alert_dispositions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        alert_id TEXT NOT NULL,
        disposition TEXT NOT NULL,
        reason_code TEXT NOT NULL,
        notes TEXT,
        operator_id TEXT NOT NULL,
        operator_role TEXT NOT NULL,
        audit_id TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # 16. Audit Logs Archive (Safe Retention Storage)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS audit_logs_archive (
        id INTEGER PRIMARY KEY,
        audit_id TEXT UNIQUE,
        timestamp TIMESTAMP,
        operator_id TEXT,
        operator_role TEXT,
        action TEXT,
        resource_type TEXT,
        resource_id TEXT,
        result TEXT,
        reason_code TEXT,
        details TEXT,
        previous_hash TEXT,
        current_hash TEXT,
        archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # 17. Audit Retention Runs & Checkpoints
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS audit_retention_runs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        run_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        retention_days INTEGER NOT NULL,
        records_purged INTEGER NOT NULL,
        checkpoint_hash TEXT,
        operator_id TEXT NOT NULL,
        audit_id TEXT
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS audit_checkpoints (
        checkpoint_id TEXT PRIMARY KEY,
        checkpoint_hash TEXT NOT NULL,
        record_id INTEGER NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        notes TEXT
    )
    """)

    conn.commit()
    seed_default_data(conn)
    conn.close()
    print("[DB] Initialized SQLite tables and verified seeds.")

def seed_default_data(conn):
    cursor = conn.cursor()

    # Seed Default Settings
    settings = [
        ("audit_retention_days", "365"),
        ("lost_link_timeout_seconds", "5"),
        ("auto_scenario_rotation", "false")
    ]
    for k, v in settings:
        cursor.execute("INSERT OR IGNORE INTO system_settings (key, value) VALUES (?, ?)", (k, v))

    # Seed Default Coastal Restricted Zones
    zones = [
        (
            "ZONE-NAVAL-01",
            "INS Adyar Naval Base & Coastal Defense Sector",
            "RED",
            0.0,
            1200.0,
            json.dumps([
                [13.085, 80.292],
                [13.085, 80.315],
                [13.060, 80.315],
                [13.060, 80.292]
            ]),
            "CRITICAL",
            "Tier-1 Military Harbor & Coastal Battery Installation",
            None,
            "SYSTEM",
            1,
            "Permanent Defense Airspace Restriction"
        ),
        (
            "ZONE-PORT-02",
            "Chennai Port Commercial Shipping Anchorage",
            "YELLOW",
            0.0,
            150.0,
            json.dumps([
                [13.110, 80.295],
                [13.110, 80.325],
                [13.088, 80.325],
                [13.088, 80.295]
            ]),
            "HIGH",
            "Commercial Maritime Ingress & Container Loading Channel",
            None,
            "SYSTEM",
            1,
            "Port Authority Commercial Buffer Zone"
        ),
        (
            "ZONE-CIVIL-03",
            "Marina Beach Public Coastal Strip",
            "GREEN",
            0.0,
            60.0,
            json.dumps([
                [13.055, 80.278],
                [13.055, 80.295],
                [13.030, 80.295],
                [13.030, 80.278]
            ]),
            "MEDIUM",
            "Recreational & Survey Flight Corridor (Sub-60m Permitted)",
            None,
            "SYSTEM",
            1,
            "Civilian Approved Flight Corridor"
        )
    ]
    for z in zones:
        cursor.execute("""
        INSERT OR IGNORE INTO restricted_zones 
        (zone_id, name, zone_type, min_altitude_m, max_altitude_m, polygon_coords, severity, description, expires_at, created_by, active, reason)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, z)

    # Seed Active Default Tactical Temporary Red Zone (placed on coastal sector, active for 45 min)
    temp_exp = (datetime.now(timezone.utc) + timedelta(minutes=45)).strftime("%Y-%m-%d %H:%M:%S")
    temp_poly = json.dumps([
        [13.060, 80.282],
        [13.076, 80.282],
        [13.076, 80.300],
        [13.060, 80.300]
    ])
    cursor.execute("""
    INSERT INTO restricted_zones 
    (zone_id, name, zone_type, min_altitude_m, max_altitude_m, polygon_coords, severity, description, expires_at, created_by, active, reason)
    VALUES ('ZONE-TEMP-TACTICAL-01', 'Tactical VIP Security & Bomb Squad Cordon', 'TEMPORARY_RED', 0.0, 400.0, ?, 'CRITICAL',
            'Emergency Coastal Tactical Cordon - Active Counter-UAS Perimeter', ?, 'TACTICAL_COMMAND', 1, 'VIP Movement & Anti-Sabotage Sweep')
    ON CONFLICT(zone_id) DO UPDATE SET
        active = 1,
        expires_at = excluded.expires_at,
        polygon_coords = excluded.polygon_coords,
        name = excluded.name,
        reason = excluded.reason
    """, (temp_poly, temp_exp))

    # Seed Default Coastal Optical Cameras
    cameras = [
        ("CAM-01", "Marina Beach Coastal Optical PTZ", 13.045, 80.282, 1400.0, 45.0, 60.0, "ACTIVE", "EO_IR_DUAL"),
        ("CAM-02", "Chennai Port North Breakwater EO/IR", 13.098, 80.301, 1800.0, 110.0, 75.0, "ACTIVE", "LONG_RANGE_PTZ"),
        ("CAM-03", "INS Adyar Naval Boresight Sensor", 13.068, 80.298, 1200.0, 350.0, 50.0, "ACTIVE", "THERMAL_OPTICAL")
    ]
    for c in cameras:
        cursor.execute("""
        INSERT OR IGNORE INTO camera_devices
        (camera_id, name, latitude, longitude, coverage_radius_m, heading_deg, fov_deg, status, stream_type)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, c)

    # Seed Default Registered Drones
    drones = [
        ("DRN-001", "UIN-2026-IND-0101", "DJI Matrice 300 RTK", "ROTORCRAFT", "MEDIUM", "Tamil Nadu Port Authority", "+91-9840123456", "VERIFIED"),
        ("DRN-002", "UIN-2026-IND-0102", "AeroVironment Puma LE", "FIXED_WING", "SMALL", "Coastal Guard Recon", "+91-9840998877", "VERIFIED"),
        ("DRN-003", "UIN-2026-IND-0915", "Autel EVO Max 4T", "ROTORCRAFT", "SMALL", "Oceanic Research Ltd", "+91-9444112233", "VERIFIED"),
        ("DRN-004", "UIN-2026-IND-0104", "IdeaForge Switch UAV", "HYBRID_VTOL", "MEDIUM", "State Police Air Wing", "+91-9444001122", "VERIFIED")
    ]
    for d in drones:
        cursor.execute("""
        INSERT OR REPLACE INTO drones
        (drone_id, uin_number, model_name, drone_type, weight_category, owner_name, operator_contact, registration_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, d)

    # Seed Active Permissions
    permissions = [
        (
            "PERM-2026-081",
            "DRN-001",
            "Tamil Nadu Port Authority",
            "Harbor Pier Infrastructure Inspection",
            "ZONE-PORT-02",
            "2026-01-01 00:00:00",
            "2028-12-31 23:59:59",
            80.0,
            "APPROVED",
            "Officer R. Sharma"
        ),
        (
            "PERM-2026-082",
            "DRN-002",
            "Coastal Guard Recon",
            "Port Perimeter Aerial Patrol",
            "ZONE-PORT-02",
            "2026-01-01 00:00:00",
            "2028-12-31 23:59:59",
            80.0,
            "APPROVED",
            "Officer V. Murugan"
        )
    ]
    for p in permissions:
        cursor.execute("""
        INSERT OR REPLACE INTO flight_permissions
        (permission_id, drone_id, operator_name, flight_purpose, allowed_zone, start_time, end_time, max_altitude_m, status, approved_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, p)

    # Seed Default Users
    users = [
        ("USR-OP-001", "operator", "operator@aeroguard.gov", hash_password("operator123"), "OPERATOR", "R. Karthik", "Tamil Nadu Maritime Logistics"),
        ("USR-OFF-001", "officer.raman", "officer@aeroguard.gov", hash_password("officer123"), "OFFICER", "Inspector V. Raman", "Coastal Defense Airspace Command"),
        ("USR-OFF-002", "admin", "admin.officer@aeroguard.gov", hash_password("admin123"), "OFFICER", "Commander S. Natarajan", "Coastal Airspace Enforcement SOC"),
        ("USR-SUP-001", "superadmin", "admin@aeroguard.gov", hash_password("superadmin123"), "SUPER_ADMIN", "Dr. S. Jayaram", "AeroGuard National Airspace Directorate")
    ]
    for u in users:
        cursor.execute("""
        INSERT OR REPLACE INTO users (id, username, email, password_hash, role, full_name, organization)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, u)

    # Seed Genesis Audit Block if table empty or fix empty hashes
    cursor.execute("SELECT COUNT(*) as count FROM audit_logs")
    count_row = cursor.fetchone()
    if count_row and count_row["count"] == 0:
        ts = datetime.now(timezone.utc).isoformat()
        h = calculate_audit_hash(ts, "SYSTEM_INIT", "GENESIS_BOOT", "SURVEILLANCE_CONSOLE", "SUCCESS", "INITIALIZE", "Tamper-evident audit ledger initialized.", GENESIS_HASH)
        cursor.execute("""
        INSERT INTO audit_logs (audit_id, timestamp, operator_id, operator_role, action, resource_type, resource_id, result, reason_code, details, previous_hash, current_hash)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            "AUDIT-GENESIS-000000",
            ts,
            "SYSTEM_INIT",
            "SYSTEM",
            "GENESIS_BOOT",
            "SYSTEM",
            "SURVEILLANCE_CONSOLE",
            "SUCCESS",
            "INITIALIZE",
            "Tamper-evident audit ledger initialized.",
            GENESIS_HASH,
            h
        ))
    else:
        # Check if legacy rows lack hashes; if so, construct the chain
        cursor.execute("SELECT id, timestamp, operator_id, user_name, action, resource_type, resource, resource_id, result, reason_code, details, previous_hash, current_hash FROM audit_logs ORDER BY id ASC")
        rows = cursor.fetchall()
        prev_h = GENESIS_HASH
        for r in rows:
            has_cur = False
            try:
                has_cur = bool(r["current_hash"] and r["previous_hash"])
            except Exception:
                has_cur = False
            if not has_cur:
                op = r["operator_id"] if ("operator_id" in r.keys() and r["operator_id"]) else (r["user_name"] if "user_name" in r.keys() and r["user_name"] else "SYSTEM")
                act = r["action"] if "action" in r.keys() and r["action"] else "UNKNOWN"
                res_id = r["resource_id"] if ("resource_id" in r.keys() and r["resource_id"]) else (r["resource"] if "resource" in r.keys() and r["resource"] else "SYSTEM")
                res_type = r["resource_type"] if ("resource_type" in r.keys() and r["resource_type"]) else "SYSTEM"
                ts = r["timestamp"] if "timestamp" in r.keys() and r["timestamp"] else datetime.now(timezone.utc).isoformat()
                rcode = r["reason_code"] if ("reason_code" in r.keys() and r["reason_code"]) else "SYSTEM_EVENT"
                det = r["details"] if ("details" in r.keys() and r["details"]) else ""
                cur_h = calculate_audit_hash(ts, op, act, res_id, r["result"] if "result" in r.keys() and r["result"] else "SUCCESS", rcode, det, prev_h)
                aid = f"AUDIT-LEGACY-{r['id']:06d}"
                cursor.execute("""
                    UPDATE audit_logs
                    SET audit_id = COALESCE(audit_id, ?),
                        operator_id = COALESCE(operator_id, ?),
                        operator_role = COALESCE(operator_role, 'OFFICER'),
                        resource_type = COALESCE(resource_type, ?),
                        resource_id = COALESCE(resource_id, ?),
                        reason_code = COALESCE(reason_code, ?),
                        previous_hash = ?,
                        current_hash = ?
                    WHERE id = ?
                """, (aid, op, res_type, res_id, rcode, prev_h, cur_h, r["id"]))
                prev_h = cur_h
            else:
                prev_h = r["current_hash"]

    conn.commit()

if __name__ == "__main__":
    init_db()
