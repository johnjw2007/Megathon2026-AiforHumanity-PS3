import os
import io
import json
import time
import uuid
import queue
import threading
from datetime import datetime, timezone, timedelta
from functools import wraps
from flask import Flask, jsonify, request, Response
from flask_cors import CORS

from db import init_db, get_db, hash_password, verify_password, GENESIS_HASH
from astra_engine import astra_engine
from yolo_engine import yolo_engine
from fusion_engine import fusion_engine
from rules_engine import rules_engine
from simulation_engine import simulation_engine, SCENARIOS
from track_manager import track_manager
from ingestion_service import ingestion_service
from spatial_engine import parse_geojson_zones
from audit_service import audit_service

app = Flask(__name__)
CORS(app)

# Background simulation runner thread
simulation_running = True

def background_sim_loop():
    while simulation_running:
        try:
            if simulation_engine.state == "RUNNING":
                simulation_engine.update_step(dt=0.8)
            interval = max(0.1, 0.8 / max(0.1, simulation_engine.speed))
            time.sleep(interval)
        except Exception as e:
            print(f"[Sim Thread Error] {e}")
            time.sleep(1.0)

sim_thread = threading.Thread(target=background_sim_loop, daemon=True)
sim_thread.start()

# ----------------- AUTHENTICATION & RBAC -----------------
ACTIVE_SESSIONS = {
    # Seed default tokens for persistent local sessions & automated tests
    "aerosec-officer-token": {
        "id": "USR-OFF-001",
        "username": "officer.raman",
        "email": "officer@aeroguard.gov",
        "role": "OFFICER",
        "full_name": "Inspector V. Raman",
        "organization": "Coastal Defense Airspace Command"
    },
    "aerosec-superadmin-token": {
        "id": "USR-SUP-001",
        "username": "superadmin",
        "email": "admin@aeroguard.gov",
        "role": "SUPER_ADMIN",
        "full_name": "Dr. S. Jayaram",
        "organization": "AeroGuard National Airspace Directorate"
    },
    "aerosec-super-admin-token": {
        "id": "USR-SUP-001",
        "username": "superadmin",
        "email": "admin@aeroguard.gov",
        "role": "SUPER_ADMIN",
        "full_name": "Dr. S. Jayaram",
        "organization": "AeroGuard National Airspace Directorate"
    },
    "aerosec-operator-token": {
        "id": "USR-OP-001",
        "username": "operator",
        "email": "operator@aeroguard.gov",
        "role": "OPERATOR",
        "full_name": "R. Karthik",
        "organization": "Tamil Nadu Maritime Logistics"
    }
}

def get_current_user():
    auth_header = request.headers.get("Authorization", "")
    token = None
    if auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1].strip()
    elif "X-Session-Token" in request.headers:
        token = request.headers["X-Session-Token"].strip()

    if token and token in ACTIVE_SESSIONS:
        return ACTIVE_SESSIONS[token]
    return None

def require_auth(allowed_roles=None):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            user = get_current_user()
            if not user:
                return jsonify({"success": False, "error": "Authentication required. Please provide a valid session token."}), 401
            if allowed_roles:
                user_role = user.get("role", "").upper()
                if user_role not in [r.upper() for r in allowed_roles]:
                    return jsonify({
                        "success": False,
                        "error": f"Access Denied: Role '{user_role}' is not authorized to perform this operation."
                    }), 403
            request.current_user = user
            return f(*args, **kwargs)
        return decorated_function
    return decorator

@app.route("/api/auth/login", methods=["POST"])
def auth_login():
    data = request.get_json() or {}
    username = (data.get("username") or data.get("email") or data.get("officer_id") or "").strip().lower()
    password = data.get("password") or ""
    expected_portal = (data.get("portal") or data.get("expected_role") or "").strip().upper()

    if not username or not password:
        return jsonify({"success": False, "message": "Username/Email and password are required."}), 400

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, username, email, password_hash, role, full_name, organization
        FROM users
        WHERE LOWER(username) = ? OR LOWER(email) = ?
    """, (username, username))
    user = cursor.fetchone()

    if not user:
        conn.close()
        return jsonify({"success": False, "message": "Invalid credentials. User not registered in AeroGuard database."}), 401

    if not verify_password(password, user["password_hash"]):
        audit_service.log_event(
            operator_id=username,
            operator_role="UNKNOWN",
            action="LOGIN_FAILED",
            resource_type="AUTH",
            resource_id="AUTH_PORTAL",
            result="FAILURE",
            reason_code="BAD_PASSWORD",
            details=f"Failed authentication attempt on portal {expected_portal}"
        )
        conn.close()
        return jsonify({"success": False, "message": "Incorrect password. Please verify your security credentials."}), 401

    user_role = user["role"].upper()

    # Enforce role matching per portal
    if expected_portal == "OPERATOR" and user_role != "OPERATOR":
        conn.close()
        return jsonify({
            "success": False,
            "message": f"Access Denied: Account '{username}' is registered as {user_role}. Please sign in via the appropriate portal."
        }), 403
    elif expected_portal in ["OFFICER", "ADMIN", "LAW_ENFORCEMENT"] and user_role not in ["OFFICER", "ADMIN"]:
        conn.close()
        return jsonify({
            "success": False,
            "message": f"Access Denied: Account '{username}' lacks Law Enforcement Officer authorization."
        }), 403
    elif expected_portal in ["SUPER_ADMIN", "SUPERADMIN"] and user_role != "SUPER_ADMIN":
        conn.close()
        return jsonify({
            "success": False,
            "message": f"Access Denied: Account '{username}' lacks Super Administrator security clearance."
        }), 403

    # Generate session token
    token = f"aerosec-{uuid.uuid4().hex}"
    session_data = {
        "id": user["id"],
        "username": user["username"],
        "email": user["email"],
        "role": user["role"],
        "full_name": user["full_name"],
        "organization": user["organization"],
        "logged_in_at": datetime.now(timezone.utc).isoformat()
    }
    ACTIVE_SESSIONS[token] = session_data

    audit_service.log_event(
        operator_id=user["username"],
        operator_role=user_role,
        action="LOGIN_SUCCESS",
        resource_type="AUTH",
        resource_id="AUTH_PORTAL",
        result="SUCCESS",
        reason_code="CREDENTIALS_VERIFIED",
        details=f"Successful sign-in as {user_role} ({user['full_name']})"
    )
    conn.close()

    return jsonify({
        "success": True,
        "token": token,
        "user": session_data,
        "message": f"Authenticated as {user['full_name']} ({user_role})"
    })

@app.route("/api/auth/me", methods=["GET"])
def auth_me():
    user = get_current_user()
    if not user:
        return jsonify({"success": False, "authenticated": False, "message": "Invalid or expired session token."}), 401
    return jsonify({"success": True, "authenticated": True, "user": user})

@app.route("/api/auth/logout", methods=["POST"])
def auth_logout():
    auth_header = request.headers.get("Authorization", "")
    token = auth_header.split(" ", 1)[1].strip() if auth_header.startswith("Bearer ") else None

    username = "UNKNOWN"
    role = "OFFICER"
    if token and token in ACTIVE_SESSIONS:
        username = ACTIVE_SESSIONS[token]["username"]
        role = ACTIVE_SESSIONS[token]["role"]
        del ACTIVE_SESSIONS[token]

    audit_service.log_event(
        operator_id=username,
        operator_role=role,
        action="LOGOUT",
        resource_type="AUTH",
        resource_id="AUTH_PORTAL",
        result="SUCCESS",
        reason_code="USER_DISCONNECT",
        details="Session terminated by user."
    )
    return jsonify({"success": True, "message": "Session invalidated and logged out."})

@app.route("/api/auth/register-operator", methods=["POST"])
def auth_register_operator():
    data = request.get_json() or {}
    username = (data.get("username") or "").strip().lower()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    full_name = (data.get("full_name") or "").strip()
    organization = (data.get("organization") or "Civilian Drone Pilot").strip()

    if not username or not password or not email or not full_name:
        return jsonify({"success": False, "message": "Username, email, full name, and password are required."}), 400

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE LOWER(username) = ? OR LOWER(email) = ?", (username, email))
    if cursor.fetchone():
        conn.close()
        return jsonify({"success": False, "message": "An account with this username or email already exists."}), 409

    user_id = f"USR-OP-{uuid.uuid4().hex[:6].upper()}"
    p_hash = hash_password(password)

    cursor.execute("""
        INSERT INTO users (id, username, email, password_hash, role, full_name, organization)
        VALUES (?, ?, ?, ?, 'OPERATOR', ?, ?)
    """, (user_id, username, email, p_hash, full_name, organization))

    audit_service.log_event(
        operator_id=username,
        operator_role="OPERATOR",
        action="REGISTER_OPERATOR",
        resource_type="USER",
        resource_id=user_id,
        result="SUCCESS",
        reason_code="NEW_USER_SELF_ENROLLMENT",
        details=f"Civilian drone operator account created: {full_name} ({organization})"
    )
    conn.commit()
    conn.close()

    return jsonify({"success": True, "message": "Operator account registered successfully. You may now sign in."})

# ----------------- TELEMETRY INGESTION (TRACK-A CORE) -----------------
@app.route("/api/ingest/telemetry", methods=["POST"])
def ingest_telemetry():
    """
    Track-A Telemetry Ingestion Endpoint:
    POST /api/ingest/telemetry
    """
    data = request.get_json() or {}
    valid, res, code = ingestion_service.validate_and_ingest(data)
    return jsonify(res), code

@app.route("/api/ingest/status", methods=["GET"])
def ingest_status():
    return jsonify({"success": True, "ingestion_metrics": track_manager.get_ingestion_metrics()})

# ----------------- GEOFENCE & TEMPORARY RED-ZONES -----------------
@app.route("/api/zones", methods=["GET"])
def get_zones():
    # Sweep active zones for automatic expiration
    now_utc = datetime.now(timezone.utc)
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM restricted_zones")
    zones = []
    for r in cursor.fetchall():
        d = dict(r)
        d["polygon_coords"] = json.loads(d["polygon_coords"])
        is_active = bool(d.get("active", 1))
        exp = d.get("expires_at")
        if exp:
            try:
                exp_dt = datetime.strptime(exp.replace("Z","").split(".")[0], "%Y-%m-%d %H:%M:%S").replace(tzinfo=timezone.utc)
                if now_utc >= exp_dt:
                    is_active = False
                    cursor.execute("UPDATE restricted_zones SET active = 0 WHERE zone_id = ?", (d["zone_id"],))
            except Exception:
                pass
        d["active"] = 1 if is_active else 0
        zones.append(d)
    conn.commit()
    conn.close()
    return jsonify({"success": True, "zones": zones})

@app.route("/api/zones", methods=["POST"])
def create_zone():
    user = get_current_user() or {"username": "OFFICER_STATION", "role": "OFFICER"}
    data = request.json or {}
    try:
        zone_id = data.get("zone_id") or f"ZONE-TEMP-{uuid.uuid4().hex[:8].upper()}"
        name = data.get("name", "Temporary Airspace Restriction")
        z_type = str(data.get("zone_type", "TEMPORARY_RED")).upper()
        severity = data.get("severity", "CRITICAL" if "RED" in z_type else "HIGH")
        min_alt = float(data.get("min_altitude_m", 0.0))
        max_alt = float(data.get("max_altitude_m", 120.0))
        coords = data.get("polygon_coords") or []
        reason = data.get("reason", "Law enforcement tactical temporary restricted airspace")

        # Expiry calculation: duration in seconds (e.g., 60) or explicit timestamp
        duration_s = data.get("duration_seconds")
        expires_at = data.get("expires_at")
        if duration_s and not expires_at:
            exp_time = datetime.now(timezone.utc) + timedelta(seconds=float(duration_s))
            expires_at = exp_time.strftime("%Y-%m-%d %H:%M:%S")

        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO restricted_zones 
            (zone_id, name, zone_type, min_altitude_m, max_altitude_m, polygon_coords, severity, description, expires_at, created_by, active, reason)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
        """, (
            zone_id, name, z_type, min_alt, max_alt, json.dumps(coords),
            severity, data.get("description", "Temporary Red Zone"),
            expires_at, user["username"], reason
        ))
        conn.commit()
        conn.close()

        # Audit record
        audit_service.log_event(
            operator_id=user["username"],
            operator_role=user.get("role", "OFFICER"),
            action="CREATE_GEOFENCE_ZONE",
            resource_type="GEOFENCE",
            resource_id=zone_id,
            result="CREATED",
            reason_code="TACTICAL_AIRSPACE_RESTRICTION",
            details=f"Created {z_type} zone '{name}' (Duration: {duration_s or 'Permanent'}s, Expires: {expires_at})"
        )

        return jsonify({"success": True, "zone_id": zone_id, "expires_at": expires_at})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

@app.route("/api/zones/<zone_id>/extend", methods=["POST"])
def extend_zone(zone_id):
    user = get_current_user() or {"username": "OFFICER_STATION", "role": "OFFICER"}
    data = request.json or {}
    additional_s = float(data.get("additional_seconds", 900))  # Default +15 minutes
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM restricted_zones WHERE zone_id = ?", (zone_id,))
        zone = cursor.fetchone()
        if not zone:
            conn.close()
            return jsonify({"success": False, "error": f"Zone '{zone_id}' not found"}), 404

        now = datetime.now(timezone.utc)
        base_time = now
        if zone["expires_at"]:
            try:
                current_exp = datetime.strptime(zone["expires_at"].replace("Z", "").split(".")[0], "%Y-%m-%d %H:%M:%S").replace(tzinfo=timezone.utc)
                if current_exp > now:
                    base_time = current_exp
            except Exception:
                pass

        new_exp_dt = base_time + timedelta(seconds=additional_s)
        new_exp = new_exp_dt.strftime("%Y-%m-%d %H:%M:%S")

        cursor.execute("""
            UPDATE restricted_zones 
            SET expires_at = ?, active = 1 
            WHERE zone_id = ?
        """, (new_exp, zone_id))
        conn.commit()
        conn.close()

        audit_service.log_event(
            operator_id=user["username"],
            operator_role=user.get("role", "OFFICER"),
            action="EXTEND_GEOFENCE_ZONE",
            resource_type="GEOFENCE",
            resource_id=zone_id,
            result="EXTENDED",
            reason_code="TACTICAL_AIRSPACE_EXTENSION",
            details=f"Extended temporary zone '{zone['name']}' by {int(additional_s)}s (New Expiry: {new_exp})"
        )

        return jsonify({"success": True, "zone_id": zone_id, "expires_at": new_exp, "active": 1})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/api/zones/<zone_id>/revoke", methods=["POST", "DELETE"])
def revoke_zone(zone_id):
    user = get_current_user() or {"username": "OFFICER_STATION", "role": "OFFICER"}
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM restricted_zones WHERE zone_id = ?", (zone_id,))
        zone = cursor.fetchone()
        if not zone:
            conn.close()
            return jsonify({"success": False, "error": f"Zone '{zone_id}' not found"}), 404

        cursor.execute("UPDATE restricted_zones SET active = 0 WHERE zone_id = ?", (zone_id,))
        conn.commit()
        conn.close()

        audit_service.log_event(
            operator_id=user["username"],
            operator_role=user.get("role", "OFFICER"),
            action="REVOKE_GEOFENCE_ZONE",
            resource_type="GEOFENCE",
            resource_id=zone_id,
            result="REVOKED",
            reason_code="OPERATIONAL_DEACTIVATION",
            details=f"Deactivated/revoked temporary zone '{zone['name']}' ({zone_id})"
        )

        return jsonify({"success": True, "zone_id": zone_id, "active": 0})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/api/zones/import-geojson", methods=["POST"])
def import_geojson_zones():
    user = get_current_user() or {"username": "OFFICER_STATION", "role": "OFFICER"}
    data = request.json or {}
    ok, zones, err = parse_geojson_zones(data, default_creator=user["username"])
    if not ok:
        return jsonify({"success": False, "error": err}), 422

    conn = get_db()
    cursor = conn.cursor()
    imported_ids = []
    for z in zones:
        cursor.execute("""
            INSERT OR REPLACE INTO restricted_zones 
            (zone_id, name, zone_type, min_altitude_m, max_altitude_m, polygon_coords, severity, description, expires_at, created_by, active, reason)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            z["zone_id"], z["name"], z["zone_type"], z["min_altitude_m"],
            z["max_altitude_m"], json.dumps(z["polygon_coords"]), z["severity"],
            z["description"], z["expires_at"], z["created_by"], z["active"], z["reason"]
        ))
        imported_ids.append(z["zone_id"])
    conn.commit()
    conn.close()

    audit_service.log_event(
        operator_id=user["username"],
        operator_role=user.get("role", "OFFICER"),
        action="IMPORT_GEOJSON_ZONES",
        resource_type="GEOFENCE",
        resource_id=f"BATCH-{len(imported_ids)}",
        result="SUCCESS",
        reason_code="GEOJSON_LAYER_IMPORT",
        details=f"Imported {len(imported_ids)} airspace zones from GeoJSON layer."
    )

    return jsonify({"success": True, "imported_count": len(imported_ids), "zone_ids": imported_ids})

# ----------------- ALERTS & DISPOSITIONS -----------------
@app.route("/api/alerts", methods=["GET"])
def get_alerts():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM alerts ORDER BY created_at DESC LIMIT 50")
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return jsonify({"success": True, "alerts": rows})

@app.route("/api/alerts/<alert_id>/disposition", methods=["POST"])
def alert_disposition(alert_id):
    user = get_current_user() or {"username": "OFFICER_CONSOLE", "role": "OFFICER"}
    user_role = user.get("role", "OFFICER").upper()
    if user_role not in ["OFFICER", "ADMIN", "LAW_ENFORCEMENT", "SUPER_ADMIN"]:
        return jsonify({"success": False, "error": f"Access Denied: Role '{user_role}' is not authorized to dispose alerts."}), 403

    data = request.json or {}
    disposition = (data.get("disposition") or "").strip().upper()
    reason_code = (data.get("reason_code") or "").strip().upper()
    notes = (data.get("notes") or "").strip()

    if not disposition or not reason_code:
        return jsonify({"success": False, "error": "Both 'disposition' and 'reason_code' are strictly required."}), 400

    ok, msg, audit_rec = audit_service.record_alert_disposition(
        alert_id=alert_id,
        disposition=disposition,
        reason_code=reason_code,
        operator_id=user["username"],
        operator_role=user.get("role", "OFFICER"),
        notes=notes
    )

    if not ok:
        return jsonify({"success": False, "error": msg}), 400

    return jsonify({"success": True, "message": msg, "audit_entry": audit_rec})

@app.route("/api/alerts/<alert_id>/action", methods=["POST"])
def alert_action(alert_id):
    data = request.json or {}
    action = (data.get("action") or "ACKNOWLEDGE").strip().upper()
    officer = data.get("officer") or "Inspector V. Raman"

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM alerts WHERE alert_id = ?", (alert_id,))
    alt = cursor.fetchone()
    if not alt:
        conn.close()
        return jsonify({"success": False, "error": "Alert not found"}), 404

    new_status = "RESOLVED" if action in ["DISMISS", "CLOSE", "RESOLVE"] else "ACKNOWLEDGED"
    cursor.execute("UPDATE alerts SET status = ? WHERE alert_id = ?", (new_status, alert_id))
    conn.commit()
    conn.close()

    try:
        audit_service.log_event(
            event_type="ALERT_ACTION",
            details=f"Alert {alert_id} marked {new_status} via action {action} by {officer}",
            operator=officer,
            severity="INFO"
        )
    except Exception:
        pass
    return jsonify({"success": True, "message": f"Alert {alert_id} updated to {new_status}"})

# ----------------- AUDIT LEDGER, VERIFICATION & EXPORT -----------------
@app.route("/api/audit", methods=["GET"])
def get_audit_logs():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM audit_logs ORDER BY id DESC LIMIT 100")
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return jsonify({"success": True, "logs": rows})

@app.route("/api/audit/verify", methods=["GET"])
def verify_audit_ledger():
    res = audit_service.verify_chain()
    return jsonify({"success": True, "verification": res})

@app.route("/api/audit/export", methods=["GET"])
def export_audit_ledger():
    fmt = request.args.get("format", "csv").lower()
    if fmt == "json":
        json_content = audit_service.export_json()
        return Response(
            json_content,
            mimetype="application/json",
            headers={"Content-Disposition": f"attachment; filename=aeroguard_audit_{int(time.time())}.json"}
        )
    else:
        csv_content = audit_service.export_csv()
        return Response(
            csv_content,
            mimetype="text/csv",
            headers={"Content-Disposition": f"attachment; filename=aeroguard_audit_{int(time.time())}.csv"}
        )

@app.route("/api/audit/purge", methods=["POST"])
@require_auth(allowed_roles=["SUPER_ADMIN"])
def purge_audit_ledger():
    user = request.current_user
    res = audit_service.purge_expired_records(operator_id=user["username"], operator_role=user["role"])
    return jsonify(res)

@app.route("/api/audit/retention/run", methods=["POST"])
def run_audit_retention():
    user = get_current_user() or {"username": "SYSTEM_ADMIN", "role": "SUPER_ADMIN"}
    data = request.json or {}
    days = data.get("retention_days")
    res = audit_service.purge_expired_records(
        operator_id=user["username"],
        operator_role=user.get("role", "SUPER_ADMIN"),
        retention_days=int(days) if days is not None else None
    )
    return jsonify(res)

# ----------------- VISION & OPTICAL AI ENDPOINTS -----------------
@app.route("/api/vision/status", methods=["GET"])
def get_vision_status():
    return jsonify({"success": True, "vision": yolo_engine.get_status()})

@app.route("/api/vision/infer", methods=["POST"])
def post_vision_infer():
    data = request.json or {}
    image_data = data.get("image_data") or data.get("image")
    sensor_mode = data.get("sensor_mode", "EO")
    camera_id = data.get("camera_id", "CAM-03")
    track_id = data.get("track_id")
    target_hint = data.get("target_hint") or {"class_name": data.get("hint_class", "DRONE")}

    res = yolo_engine.infer_frame(
        image_data=image_data,
        target_hint=target_hint,
        in_fov=True,
        sensor_mode=sensor_mode,
        track_id=track_id,
        camera_id=camera_id
    )
    return jsonify(res)

@app.route("/api/vision/upload", methods=["POST"])
def post_vision_upload():
    import base64
    image_base64 = None
    sensor_mode = request.form.get("sensor_mode", "EO") if request.form else "EO"
    camera_id = request.form.get("camera_id", "CAM-03") if request.form else "CAM-03"

    if "file" in request.files:
        f = request.files["file"]
        raw_bytes = f.read()
        image_base64 = base64.b64encode(raw_bytes).decode("utf-8")
    elif request.json and ("image" in request.json or "image_data" in request.json):
        image_base64 = request.json.get("image") or request.json.get("image_data")
        sensor_mode = request.json.get("sensor_mode", sensor_mode)
        camera_id = request.json.get("camera_id", camera_id)

    if not image_base64:
        return jsonify({"success": False, "error": "No image or video file payload provided."}), 400

    res = yolo_engine.infer_frame(
        image_data=image_base64,
        target_hint={"class_name": "DRONE"},
        in_fov=True,
        sensor_mode=sensor_mode,
        camera_id=camera_id
    )
    return jsonify(res)

@app.route("/api/simulation/resume-lost-link", methods=["POST"])
def post_resume_lost_link():
    simulation_engine.resume_lost_link_telemetry()
    return jsonify({"success": True, "message": "Telemetry link resumed for target."})

# ----------------- SYSTEM SETTINGS -----------------
@app.route("/api/settings", methods=["GET"])
def get_system_settings():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM system_settings")
    settings = {r["key"]: r["value"] for r in cursor.fetchall()}
    conn.close()
    return jsonify({"success": True, "settings": settings})

@app.route("/api/settings", methods=["PUT"])
@require_auth(allowed_roles=["SUPER_ADMIN", "ADMIN", "OFFICER"])
def update_system_settings():
    data = request.json or {}
    conn = get_db()
    cursor = conn.cursor()
    for k, v in data.items():
        cursor.execute("INSERT OR REPLACE INTO system_settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)", (k, str(v)))
    conn.commit()
    conn.close()

    # Apply runtime changes
    if "lost_link_timeout_seconds" in data:
        try:
            track_manager.lost_link_timeout_seconds = float(data["lost_link_timeout_seconds"])
        except ValueError:
            pass

    return jsonify({"success": True, "settings": data})

# ----------------- REAL-TIME SERVER-SENT EVENTS (SSE) -----------------
@app.route("/api/stream/events", methods=["GET"])
def stream_events():
    def event_generator():
        q = queue.Queue()
        track_manager.subscribe(q)
        try:
            while True:
                try:
                    payload = q.get(timeout=15.0)
                    yield f"data: {payload}\n\n"
                except queue.Empty:
                    # Heartbeat ping
                    yield f": ping\n\n"
        except GeneratorExit:
            track_manager.unsubscribe(q)

    return Response(event_generator(), mimetype="text/event-stream")

# ----------------- SIMULATION & SCENARIOS -----------------
@app.route("/api/scenarios", methods=["GET"])
def get_scenarios():
    seen = set()
    unique = []
    for s in SCENARIOS.values():
        if s["id"] not in seen:
            seen.add(s["id"])
            unique.append(s)
    return jsonify({
        "success": True,
        "scenarios": unique,
        "active_scenario_key": simulation_engine.active_scenario_key
    })

@app.route("/api/simulation/scenario", methods=["POST"])
def post_simulation_scenario():
    data = request.json or {}
    scenario_key = data.get("scenario") or data.get("scenario_id") or "AUTHORIZED_DRONE"
    speed = float(data.get("speed", simulation_engine.speed))
    state = simulation_engine.start(scenario_key, speed)

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM alerts WHERE status = 'ACTIVE' ORDER BY created_at DESC")
    active_alerts = [dict(r) for r in cursor.fetchall()]
    conn.close()

    return jsonify({
        "success": True,
        "scenario": simulation_engine.active_scenario_key,
        "message": f"Scenario '{simulation_engine.active_scenario_key}' initiated successfully.",
        "track_ids": state.get("track_ids", []),
        "alerts": active_alerts,
        "scenario_state": state,
        "snapshot": simulation_engine.get_snapshot()
    })

@app.route("/api/simulation/start", methods=["POST"])
def sim_start():
    data = request.json or {}
    scenario_key = data.get("scenario") or data.get("scenario_id") or "AUTHORIZED_DRONE"
    speed = float(data.get("speed", 1.0))
    state = simulation_engine.start(scenario_key, speed)
    return jsonify({
        "success": True,
        "scenario": simulation_engine.active_scenario_key,
        "state": simulation_engine.state,
        "snapshot": simulation_engine.get_snapshot(),
        "scenario_state": state
    })

@app.route("/api/simulation/pause", methods=["POST"])
def sim_pause():
    simulation_engine.pause()
    return jsonify({"success": True, "state": simulation_engine.state, "scenario_state": simulation_engine.get_scenario_state()})

@app.route("/api/simulation/resume", methods=["POST"])
def sim_resume():
    simulation_engine.resume()
    return jsonify({"success": True, "state": simulation_engine.state, "scenario_state": simulation_engine.get_scenario_state()})

@app.route("/api/simulation/stop", methods=["POST"])
def sim_stop():
    simulation_engine.stop()
    return jsonify({"success": True, "state": simulation_engine.state, "scenario_state": simulation_engine.get_scenario_state()})

@app.route("/api/simulation/reset", methods=["POST"])
def sim_reset():
    simulation_engine.reset_simulation(keep_running=False)
    return jsonify({
        "success": True,
        "state": simulation_engine.state,
        "snapshot": simulation_engine.get_snapshot(),
        "scenario_state": simulation_engine.get_scenario_state()
    })

@app.route("/api/simulation/speed", methods=["POST"])
def sim_speed():
    data = request.json or {}
    speed = float(data.get("speed", 1.0))
    simulation_engine.set_speed(speed)
    return jsonify({"success": True, "speed": simulation_engine.speed})

@app.route("/api/simulation/auto-cycle", methods=["POST"])
def sim_auto_cycle():
    data = request.json or {}
    enabled = data.get("enabled", None)
    val = simulation_engine.toggle_auto_cycle(enabled)
    return jsonify({"success": True, "auto_cycle": val})

@app.route("/api/simulation/snapshot", methods=["GET"])
def sim_snapshot():
    return jsonify({
        "success": True,
        "snapshot": simulation_engine.get_snapshot()
    })

# ----------------- CAMERAS, DRONES, PERMISSIONS & INCIDENTS -----------------
@app.route("/api/cameras", methods=["GET"])
def get_cameras():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM camera_devices")
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return jsonify({"success": True, "cameras": rows})

@app.route("/api/drones", methods=["GET"])
def get_drones():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM drones ORDER BY registered_at DESC")
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return jsonify({"success": True, "drones": rows})

@app.route("/api/drones", methods=["POST"])
def register_drone():
    user = get_current_user() or {"username": "OPERATOR", "role": "OPERATOR"}
    try:
        data = request.json or {}
        conn = get_db()
        cursor = conn.cursor()
        drone_id = data.get("drone_id", f"DRN-{int(time.time()) % 10000:04d}")
        uin = data.get("uin_number", f"UIN-2026-IND-{int(time.time()) % 10000:04d}")
        cursor.execute("""
            INSERT INTO drones 
            (drone_id, uin_number, model_name, drone_type, weight_category, owner_name, operator_contact, registration_status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            drone_id, uin, data.get("model_name", "Standard Quadcopter"),
            data.get("drone_type", "ROTORCRAFT"), data.get("weight_category", "SMALL"),
            data.get("owner_name", user["username"]), data.get("operator_contact", "+91-9876543200"),
            data.get("registration_status", "VERIFIED")
        ))
        conn.commit()
        conn.close()

        audit_service.log_event(
            operator_id=user["username"],
            operator_role=user.get("role", "OPERATOR"),
            action="REGISTER_DRONE",
            resource_type="DRONE",
            resource_id=drone_id,
            result="SUCCESS",
            reason_code="UIN_REGISTRATION",
            details=f"Registered drone {drone_id} (UIN: {uin})"
        )
        return jsonify({"success": True, "drone_id": drone_id, "uin_number": uin})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

@app.route("/api/drones/verify/<uin>", methods=["GET"])
def verify_drone(uin):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM drones WHERE uin_number = ? COLLATE NOCASE", (uin.strip(),))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return jsonify({
            "success": False,
            "registered": False,
            "error": f"Drone with UIN '{uin}' is not registered in the National Registry."
        }), 404
    drone = dict(row)
    cursor.execute("""
        SELECT * FROM flight_permissions
        WHERE drone_id = ? AND status = 'APPROVED'
        AND CURRENT_TIMESTAMP BETWEEN start_time AND end_time
    """, (drone["drone_id"],))
    perm = cursor.fetchone()
    conn.close()
    return jsonify({
        "success": True,
        "registered": True,
        "drone": drone,
        "has_active_permission": perm is not None,
        "active_permission": dict(perm) if perm else None
    })

@app.route("/api/permissions", methods=["GET"])
def get_permissions():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT p.*, d.model_name, d.uin_number 
        FROM flight_permissions p
        LEFT JOIN drones d ON p.drone_id = d.drone_id
        ORDER BY p.requested_at DESC
    """)
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return jsonify({"success": True, "permissions": rows})

@app.route("/api/permissions", methods=["POST"])
def request_permission():
    user = get_current_user() or {"username": "OPERATOR", "role": "OPERATOR"}
    try:
        data = request.json or {}
        conn = get_db()
        cursor = conn.cursor()
        perm_id = f"PERM-2026-{int(time.time()) % 10000:04d}"
        initial_status = data.get("status", "PENDING").upper()
        approver = "Officer V. Raman" if initial_status == "APPROVED" else None
        cursor.execute("""
            INSERT INTO flight_permissions 
            (permission_id, drone_id, operator_name, flight_purpose, allowed_zone, start_time, end_time, max_altitude_m, status, approved_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            perm_id, data.get("drone_id", "DRN-001"), data.get("operator_name") or user["username"],
            data.get("flight_purpose", "Aerial Photography / Survey"),
            data.get("allowed_zone", "ZONE-PORT-02"),
            data.get("start_time", "2026-09-10 00:00:00"),
            data.get("end_time", "2026-09-15 23:59:59"),
            float(data.get("max_altitude_m", 80.0)),
            initial_status,
            approver
        ))
        conn.commit()
        conn.close()

        audit_service.log_event(
            operator_id=user["username"],
            operator_role=user.get("role", "OPERATOR"),
            action="REQUEST_FLIGHT_PERMISSION",
            resource_type="PERMISSION",
            resource_id=perm_id,
            result=initial_status,
            reason_code="DGCA_STANDARD_CORRIDOR",
            details=f"Permit request {perm_id} submitted for drone {data.get('drone_id')} in {data.get('allowed_zone')} (Status: {initial_status})"
        )
        return jsonify({"success": True, "permission_id": perm_id, "status": initial_status})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

@app.route("/api/permissions/<perm_id>/status", methods=["PUT"])
def update_permission_status(perm_id):
    user = get_current_user() or {"username": "officer.raman", "role": "OFFICER"}
    data = request.json or {}
    new_status = data.get("status", "APPROVED").upper()
    officer = data.get("officer", user.get("username", "Law Enforcement Officer"))
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM flight_permissions WHERE permission_id = ?", (perm_id,))
    perm = cursor.fetchone()
    if not perm:
        conn.close()
        return jsonify({"success": False, "error": "Permission record not found"}), 404

    cursor.execute("""
        UPDATE flight_permissions
        SET status = ?, approved_by = ?
        WHERE permission_id = ?
    """, (new_status, officer, perm_id))
    conn.commit()
    conn.close()

    audit_service.log_event(
        operator_id=officer,
        operator_role="OFFICER",
        action=f"PERMISSION_{new_status}",
        resource_type="PERMISSION",
        resource_id=perm_id,
        result="SUCCESS",
        reason_code="OPERATOR_REQUEST_ADJUDICATED",
        details=f"Permission {perm_id} status changed to {new_status} by {officer}"
    )
    return jsonify({"success": True, "permission_id": perm_id, "status": new_status})

@app.route("/api/incidents", methods=["GET"])
def get_incidents():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM incidents ORDER BY created_at DESC")
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return jsonify({"success": True, "incidents": rows})

@app.route("/api/incidents/<inc_id>", methods=["GET", "PUT"])
def get_incident_detail(inc_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM incidents WHERE incident_id = ?", (inc_id,))
    inc = cursor.fetchone()
    if not inc:
        conn.close()
        return jsonify({"success": False, "error": "Incident not found"}), 404

    if request.method == "PUT":
        data = request.json or {}
        new_status = data.get("status", inc["status"])
        notes = data.get("notes")
        assigned_officer = data.get("assigned_officer", inc["assigned_officer"])
        summary = data.get("summary", inc["summary"])
        now_iso = datetime.now(timezone.utc).isoformat()

        combined_notes = inc["notes"] or ""
        if notes:
            if combined_notes:
                combined_notes += f"\n[{now_iso}] {notes}"
            else:
                combined_notes = f"[{now_iso}] {notes}"

        cursor.execute("""
            UPDATE incidents
            SET status = ?, notes = ?, assigned_officer = ?, summary = ?, updated_at = ?
            WHERE incident_id = ?
        """, (new_status, combined_notes, assigned_officer, summary, now_iso, inc_id))
        conn.commit()

        audit_service.log_event(
            operator_id=assigned_officer or "officer.raman",
            operator_role="OFFICER",
            action="UPDATE_INCIDENT",
            resource_type="INCIDENT",
            resource_id=inc_id,
            result="SUCCESS",
            reason_code="STATUS_UPDATE",
            details=f"Status: {new_status}, Updated notes: {bool(notes)}"
        )

        cursor.execute("SELECT * FROM incidents WHERE incident_id = ?", (inc_id,))
        updated = dict(cursor.fetchone())
        conn.close()
        return jsonify({"success": True, "incident": updated, "message": "Incident updated successfully"})

    cursor.execute("SELECT * FROM evidence WHERE incident_id = ? ORDER BY timestamp ASC", (inc_id,))
    evidence_rows = [dict(e) for e in cursor.fetchall()]
    conn.close()
    return jsonify({"success": True, "incident": dict(inc), "evidence": evidence_rows})

# ----------------- SYSTEM HEALTH -----------------
@app.route("/api/health", methods=["GET"])
def health():
    astra_info = astra_engine.get_info()
    yolo_info = yolo_engine.get_status()
    db_status = "CONNECTED"
    try:
        conn = get_db()
        conn.cursor().execute("SELECT 1")
        conn.close()
    except Exception:
        db_status = "DEGRADED"

    metrics = track_manager.get_ingestion_metrics()

    return jsonify({
        "status": "ok",
        "system": "AeroGuard Coastal Surveillance Console (Track A)",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "components": {
            "radar_simulator": "ONLINE",
            "telemetry_ingestion": metrics["status"],
            "astra_model": astra_info["status"],
            "yolo_model": yolo_info["status"],
            "camera_feed": "ACTIVE",
            "map_tiles": "ONLINE",
            "database": db_status
        },
        "ingestion_metrics": metrics,
        "vision_metrics": yolo_info
    })

# ----------------- RADAR & SAMPLES -----------------
@app.route("/api/radar/predict", methods=["POST"])
def radar_predict():
    data = request.json or {}
    features = data.get("features", [])
    return jsonify(astra_engine.predict(features))

@app.route("/api/radar/demo-samples", methods=["GET"])
def radar_demo_samples():
    samples = []
    for cls_id in range(4):
        for _ in range(2):
            feat = astra_engine.get_sample_for_class(cls_id, jitter=0.005)
            pred = astra_engine.predict(feat)
            samples.append({
                "class_id": cls_id,
                "class_name": pred["class_name"],
                "confidence": pred["confidence"],
                "features": feat
            })
    return jsonify({"success": True, "samples": samples})

if __name__ == "__main__":
    init_db()
    print("[AeroGuard Backend] Running on http://127.0.0.1:5000")
    app.run(host="0.0.0.0", port=5000, debug=False, threaded=True)
