// Auto-generated initial state for AeroGuard Standalone & Offline Simulation
export const INITIAL_SEED_DATA = {
  "health": {
    "components": {
      "astra_model": "LOADED",
      "camera_feed": "ACTIVE",
      "database": "CONNECTED",
      "map_tiles": "ONLINE",
      "radar_simulator": "ONLINE",
      "telemetry_ingestion": "CONNECTED",
      "yolo_model": "STANDBY (WEIGHTS PENDING)"
    },
    "ingestion_metrics": {
      "active_tracks": 17,
      "last_report": "<1s ago",
      "latency_ms": 64.2,
      "report_rate_hz": 7.8,
      "report_to_console_target_met": true,
      "status": "CONNECTED",
      "total_reports": 7376
    },
    "status": "ok",
    "system": "AeroGuard Coastal Surveillance Console (Track A)",
    "timestamp": "2026-09-11T03:28:50.744099+00:00",
    "vision_metrics": {
      "classes": {
        "0": "drone",
        "1": "bird",
        "2": "airplane",
        "3": "helicopter"
      },
      "confidence_threshold": 0.45,
      "expected_file": "backend/weights/best.pt",
      "inference_mode": "SYNTHETIC_FRAME_FALLBACK",
      "is_loaded": false,
      "metrics": {
        "benchmark_dataset": "NOT_LOADED (Run backend/scripts/evaluate_vision.py with labeled test set)",
        "f1": null,
        "false_positives_per_sensor_hour": null,
        "map50": null,
        "map50_95": null,
        "precision": null,
        "recall": null
      },
      "metrics_status": "NOT YET EVALUATED",
      "status": "STANDBY (WEIGHTS PENDING)",
      "ultralytics_installed": true,
      "vision_mode": "SIMULATION / MODEL PENDING",
      "weights_path": null
    }
  },
  "zones": [
    {
      "active": 1,
      "created_at": "2026-09-11 03:08:07",
      "created_by": "SYSTEM",
      "description": "Tier-1 Military Harbor & Coastal Battery Installation",
      "expires_at": null,
      "max_altitude_m": 1200.0,
      "min_altitude_m": 0.0,
      "name": "INS Adyar Naval Base & Coastal Defense Sector",
      "polygon_coords": [
        [
          13.085,
          80.292
        ],
        [
          13.085,
          80.315
        ],
        [
          13.06,
          80.315
        ],
        [
          13.06,
          80.292
        ]
      ],
      "reason": "Permanent Defense Airspace Restriction",
      "severity": "CRITICAL",
      "zone_id": "ZONE-NAVAL-01",
      "zone_type": "RED"
    },
    {
      "active": 1,
      "created_at": "2026-09-11 03:08:07",
      "created_by": "SYSTEM",
      "description": "Commercial Maritime Ingress & Container Loading Channel",
      "expires_at": null,
      "max_altitude_m": 150.0,
      "min_altitude_m": 0.0,
      "name": "Chennai Port Commercial Shipping Anchorage",
      "polygon_coords": [
        [
          13.11,
          80.295
        ],
        [
          13.11,
          80.325
        ],
        [
          13.088,
          80.325
        ],
        [
          13.088,
          80.295
        ]
      ],
      "reason": "Port Authority Commercial Buffer Zone",
      "severity": "HIGH",
      "zone_id": "ZONE-PORT-02",
      "zone_type": "YELLOW"
    },
    {
      "active": 1,
      "created_at": "2026-09-11 03:08:07",
      "created_by": "SYSTEM",
      "description": "Recreational & Survey Flight Corridor (Sub-60m Permitted)",
      "expires_at": null,
      "max_altitude_m": 60.0,
      "min_altitude_m": 0.0,
      "name": "Marina Beach Public Coastal Strip",
      "polygon_coords": [
        [
          13.055,
          80.278
        ],
        [
          13.055,
          80.295
        ],
        [
          13.03,
          80.295
        ],
        [
          13.03,
          80.278
        ]
      ],
      "reason": "Civilian Approved Flight Corridor",
      "severity": "MEDIUM",
      "zone_id": "ZONE-CIVIL-03",
      "zone_type": "GREEN"
    },
    {
      "active": 1,
      "created_at": "2026-09-11 03:08:07",
      "created_by": "TACTICAL_COMMAND",
      "description": "Emergency Coastal Tactical Cordon - Active Counter-UAS Perimeter",
      "expires_at": "2026-09-11 03:53:07",
      "max_altitude_m": 400.0,
      "min_altitude_m": 0.0,
      "name": "Tactical VIP Security & Bomb Squad Cordon",
      "polygon_coords": [
        [
          13.06,
          80.282
        ],
        [
          13.076,
          80.282
        ],
        [
          13.076,
          80.3
        ],
        [
          13.06,
          80.3
        ]
      ],
      "reason": "VIP Movement & Anti-Sabotage Sweep",
      "severity": "CRITICAL",
      "zone_id": "ZONE-TEMP-TACTICAL-01",
      "zone_type": "TEMPORARY_RED"
    }
  ],
  "drones": [
    {
      "drone_id": "DRN-001",
      "drone_type": "ROTORCRAFT",
      "model_name": "DJI Matrice 300 RTK",
      "operator_contact": "+91-9840123456",
      "owner_name": "Tamil Nadu Port Authority",
      "registered_at": "2026-09-11 03:08:07",
      "registration_status": "VERIFIED",
      "uin_number": "UIN-2026-IND-0101",
      "weight_category": "MEDIUM"
    },
    {
      "drone_id": "DRN-002",
      "drone_type": "FIXED_WING",
      "model_name": "AeroVironment Puma LE",
      "operator_contact": "+91-9840998877",
      "owner_name": "Coastal Guard Recon",
      "registered_at": "2026-09-11 03:08:07",
      "registration_status": "VERIFIED",
      "uin_number": "UIN-2026-IND-0102",
      "weight_category": "SMALL"
    },
    {
      "drone_id": "DRN-003",
      "drone_type": "ROTORCRAFT",
      "model_name": "Autel EVO Max 4T",
      "operator_contact": "+91-9444112233",
      "owner_name": "Oceanic Research Ltd",
      "registered_at": "2026-09-11 03:08:07",
      "registration_status": "VERIFIED",
      "uin_number": "UIN-2026-IND-0915",
      "weight_category": "SMALL"
    },
    {
      "drone_id": "DRN-004",
      "drone_type": "HYBRID_VTOL",
      "model_name": "IdeaForge Switch UAV",
      "operator_contact": "+91-9444001122",
      "owner_name": "State Police Air Wing",
      "registered_at": "2026-09-11 03:08:07",
      "registration_status": "VERIFIED",
      "uin_number": "UIN-2026-IND-0104",
      "weight_category": "MEDIUM"
    }
  ],
  "permissions": [
    {
      "allowed_zone": "ZONE-PORT-02",
      "approved_by": "Officer R. Sharma",
      "drone_id": "DRN-001",
      "end_time": "2028-12-31 23:59:59",
      "flight_purpose": "Harbor Pier Infrastructure Inspection",
      "max_altitude_m": 80.0,
      "model_name": "DJI Matrice 300 RTK",
      "operator_name": "Tamil Nadu Port Authority",
      "permission_id": "PERM-2026-081",
      "requested_at": "2026-09-11 03:08:07",
      "start_time": "2026-01-01 00:00:00",
      "status": "APPROVED",
      "uin_number": "UIN-2026-IND-0101"
    },
    {
      "allowed_zone": "ZONE-PORT-02",
      "approved_by": "Officer V. Murugan",
      "drone_id": "DRN-002",
      "end_time": "2028-12-31 23:59:59",
      "flight_purpose": "Port Perimeter Aerial Patrol",
      "max_altitude_m": 80.0,
      "model_name": "AeroVironment Puma LE",
      "operator_name": "Coastal Guard Recon",
      "permission_id": "PERM-2026-082",
      "requested_at": "2026-09-11 03:08:07",
      "start_time": "2026-01-01 00:00:00",
      "status": "APPROVED",
      "uin_number": "UIN-2026-IND-0102"
    }
  ],
  "cameras": [
    {
      "camera_id": "CAM-01",
      "coverage_radius_m": 1400.0,
      "fov_deg": 60.0,
      "heading_deg": 45.0,
      "latitude": 13.045,
      "longitude": 80.282,
      "name": "Marina Beach Coastal Optical PTZ",
      "status": "ACTIVE",
      "stream_type": "EO_IR_DUAL"
    },
    {
      "camera_id": "CAM-02",
      "coverage_radius_m": 1800.0,
      "fov_deg": 75.0,
      "heading_deg": 110.0,
      "latitude": 13.098,
      "longitude": 80.301,
      "name": "Chennai Port North Breakwater EO/IR",
      "status": "ACTIVE",
      "stream_type": "LONG_RANGE_PTZ"
    },
    {
      "camera_id": "CAM-03",
      "coverage_radius_m": 1200.0,
      "fov_deg": 50.0,
      "heading_deg": 350.0,
      "latitude": 13.068,
      "longitude": 80.298,
      "name": "INS Adyar Naval Boresight Sensor",
      "status": "ACTIVE",
      "stream_type": "THERMAL_OPTICAL"
    }
  ],
  "settings": {
    "audit_retention_days": "365",
    "auto_scenario_rotation": "false",
    "lost_link_timeout_seconds": "5"
  },
  "scenarios": [
    {
      "altitude_m": 65.0,
      "description": "Tamil Nadu Port Authority inspection flight operating under approved permit PERM-2026-081 in ZONE-PORT-02.",
      "heading_deg": 35.0,
      "id": "AUTHORIZED_DRONE",
      "name": "1. Authorized Drone (Compliant)",
      "object_type": "DRONE",
      "speed_mps": 12.0,
      "start_lat": 13.095,
      "start_lon": 80.305,
      "target_lat": 13.105,
      "target_lon": 80.315,
      "track_id": "DRN-001",
      "uas_id": "UIN-2026-IND-0101"
    },
    {
      "altitude_m": 75.0,
      "description": "Unregistered quadcopter flying over civilian sector without DGCA civil registry match.",
      "heading_deg": 15.0,
      "id": "UNREGISTERED_DRONE",
      "name": "2. Unregistered Drone (Non-Compliant)",
      "object_type": "DRONE",
      "speed_mps": 15.0,
      "start_lat": 13.04,
      "start_lon": 80.285,
      "target_lat": 13.055,
      "target_lon": 80.29,
      "track_id": "UNKNOWN-UAS-999",
      "uas_id": "UNKNOWN-UAS-999"
    },
    {
      "altitude_m": 250.0,
      "description": "Registered drone exceeding maximum permitted altitude ceiling (250m vs 80m approved ceiling).",
      "heading_deg": 25.0,
      "id": "ALTITUDE_VIOLATION",
      "name": "3. Altitude Violation (Out of Envelope)",
      "object_type": "DRONE",
      "speed_mps": 14.0,
      "start_lat": 13.095,
      "start_lon": 80.305,
      "target_lat": 13.105,
      "target_lon": 80.315,
      "track_id": "DRN-001",
      "uas_id": "UIN-2026-IND-0101"
    },
    {
      "altitude_m": 65.0,
      "description": "Target penetrating newly active tactical law enforcement temporary red zone.",
      "heading_deg": 10.0,
      "id": "TEMP_RED_ZONE_VIOLATION",
      "name": "4. Temporary Red-Zone Violation",
      "object_type": "DRONE",
      "speed_mps": 10.0,
      "start_lat": 13.068,
      "start_lon": 80.298,
      "target_lat": 13.078,
      "target_lon": 80.305,
      "track_id": "TRACK-INTRUDER-01",
      "uas_id": "UIN-2026-IND-0101"
    },
    {
      "altitude_m": 70.0,
      "description": "Transmits 4 reports then cuts signal to trigger LOST_LINK, followed by automated telemetry restoration.",
      "heading_deg": 40.0,
      "id": "LOST_LINK",
      "max_reports": 4,
      "name": "5. Lost Link Telemetry Test",
      "object_type": "DRONE",
      "speed_mps": 10.0,
      "start_lat": 13.068,
      "start_lon": 80.298,
      "target_lat": 13.072,
      "target_lon": 80.3,
      "track_id": "RID-004",
      "uas_id": "UIN-2026-IND-0101"
    },
    {
      "altitude_m": 45.0,
      "description": "Micro-Doppler classifies target as DRONE, but Optical Camera classifies as BIRD. Flags VISION_RADAR_CONFLICT.",
      "heading_deg": 45.0,
      "id": "SENSOR_CONFLICT",
      "name": "6. Classification Conflict (Radar vs Camera)",
      "object_type": "DRONE",
      "speed_mps": 9.0,
      "start_lat": 13.068,
      "start_lon": 80.298,
      "target_lat": 13.074,
      "target_lon": 80.302,
      "track_id": "TRACK-CONFLICT-01",
      "uas_id": "UIN-2026-IND-0101",
      "vision_class": "BIRD"
    },
    {
      "altitude_m": 65.0,
      "description": "Simultaneous multi-target tracking: Authorized commercial UAV, unregistered drone, and out-of-envelope drone.",
      "heading_deg": 45.0,
      "id": "MULTI_OBJECT",
      "name": "7. Multiple Objects in Airspace",
      "object_type": "DRONE",
      "speed_mps": 12.0,
      "start_lat": 13.095,
      "start_lon": 80.305,
      "target_lat": 13.11,
      "target_lon": 80.32,
      "track_id": "DRN-001",
      "uas_id": "UIN-2026-IND-0101"
    },
    {
      "altitude_m": 88.0,
      "description": "Unregistered drone incursion penetrating INS Adyar Naval Base Restricted Airspace (0-1200m AGL).",
      "heading_deg": 38.0,
      "id": "RESTRICTED_INTRUSION",
      "name": "8. Restricted Sector Incursion (Naval Airspace)",
      "object_type": "DRONE",
      "speed_mps": 18.0,
      "start_lat": 13.06,
      "start_lon": 80.29,
      "target_lat": 13.072,
      "target_lon": 80.302,
      "track_id": "TRACK-0001",
      "uas_id": "UNKNOWN-UAS-001"
    }
  ],
  "active_tracks": [
    {
      "alert_classification": "UNREGISTERED",
      "alert_subtype": "NO_REGISTRY_MATCH",
      "altitude_m": 88.8,
      "associated_camera": null,
      "authorization": {
        "altitude_valid": false,
        "classification": "UNREGISTERED",
        "inside_zone": false,
        "permission_active": false,
        "permitted": false,
        "primary_status": "UNREGISTERED",
        "reason": "UAS identifier 'UNKNOWN-UAS-001' not found in official DGCA / AeroGuard registry.",
        "reason_codes": [
          "NO_REGISTRY_MATCH"
        ],
        "registered": false,
        "status": "UNAUTHORIZED",
        "subtype": "NO_REGISTRY_MATCH",
        "suggested_action": "VERIFY REGISTRY / IDENTIFY OPERATOR",
        "time_valid": false
      },
      "camera_confidence": 0.0,
      "display_status": "RADAR TRACK ACTIVE (OUT OF OPTICAL RANGE)",
      "fusion_status": "RADAR_ONLY",
      "geofence": {
        "classification": "AUTHORIZED",
        "reason": "Airspace perimeter clear.",
        "severity": "LOW",
        "status": "CLEAR",
        "subtype": "AIRSPACE_CLEAR",
        "suggested_action": "MONITOR"
      },
      "heading_deg": 38.0,
      "history": [
        [
          13.136978,
          80.351748
        ],
        [
          13.137182,
          80.351912
        ],
        [
          13.137387,
          80.352076
        ],
        [
          13.137591,
          80.35224
        ],
        [
          13.137796,
          80.352404
        ]
      ],
      "last_seen": 1789097329.8412838,
      "last_telemetry_timestamp": "2026-09-11T03:28:49.841283+00:00",
      "latitude": 13.137796,
      "longitude": 80.352404,
      "object_type": "DRONE",
      "radar_confidence": 0.97,
      "risk": {
        "level": "HIGH",
        "reasons": [
          "Unmanned Aerial Vehicle (UAV) detected",
          "UAS identifier 'UNKNOWN-UAS-001' not found in official DGCA / AeroGuard registry."
        ],
        "score": 70
      },
      "risk_level": "HIGH",
      "risk_reasons": [
        "Unmanned Aerial Vehicle (UAV) detected",
        "UAS identifier 'UNKNOWN-UAS-001' not found in official DGCA / AeroGuard registry."
      ],
      "source": "SIMULATOR",
      "speed_mps": 18.0,
      "status": "TRACKING",
      "suggested_action": "VERIFY REGISTRY / IDENTIFY OPERATOR",
      "track_id": "TRACK-0001",
      "trajectory": {
        "ai_prediction": {
          "breach_eta_s": null,
          "breach_projected": false,
          "breach_zone": null,
          "climb_rate_mps": 0.0,
          "confidence": 0.96,
          "intent": "EVASIVE_ZIGZAG_MANEUVER",
          "intent_label": "EVASIVE ZIGZAG MANEUVER",
          "model": "AeroGuard-Kinematic-NeuralPredictor-v2.4",
          "projected_max_altitude_m": 88.8,
          "summary": "Erratic banking & yaw wander detected (turn rate 5.2\u00b0/s). AI predicts evasive recon maneuvers.",
          "trajectory_type": "CURVILINEAR_EVASIVE",
          "turn_rate_deg_s": 5.2
        },
        "breach_prediction": null,
        "predicted_points": [
          {
            "altitude_m": 88.8,
            "distance_m": 90.0,
            "dt_seconds": 5,
            "heading_deg": 60.1,
            "latitude": 13.1382,
            "longitude": 80.353126
          },
          {
            "altitude_m": 88.8,
            "distance_m": 180.0,
            "dt_seconds": 10,
            "heading_deg": 82.2,
            "latitude": 13.13831,
            "longitude": 80.353951
          },
          {
            "altitude_m": 88.8,
            "distance_m": 270.0,
            "dt_seconds": 15,
            "heading_deg": 104.3,
            "latitude": 13.13811,
            "longitude": 80.354757
          },
          {
            "altitude_m": 88.8,
            "distance_m": 360.0,
            "dt_seconds": 20,
            "heading_deg": 126.4,
            "latitude": 13.137629,
            "longitude": 80.355428
          },
          {
            "altitude_m": 88.8,
            "distance_m": 450.0,
            "dt_seconds": 25,
            "heading_deg": 148.5,
            "latitude": 13.136937,
            "longitude": 80.355863
          },
          {
            "altitude_m": 88.8,
            "distance_m": 540.0,
            "dt_seconds": 30,
            "heading_deg": 170.6,
            "latitude": 13.136138,
            "longitude": 80.355999
          }
        ]
      },
      "uas_id": "UNKNOWN-UAS-001"
    },
    {
      "alert_classification": "UNREGISTERED",
      "alert_subtype": "NO_REGISTRY_MATCH",
      "altitude_m": 75.0,
      "associated_camera": null,
      "authorization": {
        "altitude_valid": false,
        "classification": "UNREGISTERED",
        "inside_zone": false,
        "permission_active": false,
        "permitted": false,
        "primary_status": "UNREGISTERED",
        "reason": "UAS identifier 'RID-670' not found in official DGCA / AeroGuard registry.",
        "reason_codes": [
          "NO_REGISTRY_MATCH"
        ],
        "registered": false,
        "status": "UNAUTHORIZED",
        "subtype": "NO_REGISTRY_MATCH",
        "suggested_action": "VERIFY REGISTRY / IDENTIFY OPERATOR",
        "time_valid": false
      },
      "camera_confidence": 0.0,
      "display_status": "RADAR TRACK ACTIVE (OUT OF OPTICAL RANGE)",
      "fusion_status": "RADAR_ONLY",
      "geofence": {
        "active_zones": [
          {
            "name": "INS Adyar Naval Base & Coastal Defense Sector",
            "reason": "Permanent Defense Airspace Restriction",
            "severity": "CRITICAL",
            "zone_id": "ZONE-NAVAL-01",
            "zone_type": "RED"
          },
          {
            "name": "Tactical VIP Security & Bomb Squad Cordon",
            "reason": "VIP Movement & Anti-Sabotage Sweep",
            "severity": "CRITICAL",
            "zone_id": "ZONE-TEMP-TACTICAL-01",
            "zone_type": "TEMPORARY_RED"
          }
        ],
        "classification": "OUT_OF_ENVELOPE",
        "reason": "Direct breach of INS Adyar Naval Base & Coastal Defense Sector (RED)!",
        "severity": "CRITICAL",
        "status": "RESTRICTED_ZONE_VIOLATION",
        "subtype": "HORIZONTAL_GEOFENCE",
        "suggested_action": "ESCALATE TO DUTY COMMAND"
      },
      "heading_deg": 290.1,
      "history": [
        [
          13.071289,
          80.293564
        ],
        [
          13.071307,
          80.293489
        ],
        [
          13.071327,
          80.293415
        ],
        [
          13.071349,
          80.293343
        ],
        [
          13.071374,
          80.293272
        ]
      ],
      "last_seen": 1789097330.3352733,
      "last_telemetry_timestamp": "2026-09-11T03:28:50.335273+00:00",
      "latitude": 13.071374,
      "longitude": 80.293272,
      "object_type": "DRONE",
      "radar_confidence": 0.99,
      "risk": {
        "level": "CRITICAL",
        "reasons": [
          "Unmanned Aerial Vehicle (UAV) detected",
          "UAS identifier 'RID-670' not found in official DGCA / AeroGuard registry.",
          "DIRECT BREACH: Direct breach of INS Adyar Naval Base & Coastal Defense Sector (RED)!",
          "Projected intrusion into INS Adyar Naval Base & Coastal Defense Sector in 5s"
        ],
        "score": 100
      },
      "risk_level": "CRITICAL",
      "risk_reasons": [
        "Unmanned Aerial Vehicle (UAV) detected",
        "UAS identifier 'RID-670' not found in official DGCA / AeroGuard registry.",
        "DIRECT BREACH: Direct breach of INS Adyar Naval Base & Coastal Defense Sector (RED)!",
        "Projected intrusion into INS Adyar Naval Base & Coastal Defense Sector in 5s"
      ],
      "source": "SIMULATED_REMOTE_ID",
      "speed_mps": 4.1,
      "status": "TRACKING",
      "suggested_action": "VERIFY REGISTRY / IDENTIFY OPERATOR",
      "track_id": "TRK-0001",
      "trajectory": {
        "ai_prediction": {
          "breach_eta_s": 5,
          "breach_projected": true,
          "breach_zone": "INS Adyar Naval Base & Coastal Defense Sector",
          "climb_rate_mps": 0.0,
          "confidence": 0.98,
          "intent": "EVASIVE_ZIGZAG_MANEUVER",
          "intent_label": "EVASIVE ZIGZAG MANEUVER",
          "model": "AeroGuard-Kinematic-NeuralPredictor-v2.4",
          "projected_max_altitude_m": 75.0,
          "summary": "Erratic banking & yaw wander detected (turn rate 5.2\u00b0/s). AI predicts evasive recon maneuvers.",
          "trajectory_type": "CURVILINEAR_EVASIVE",
          "turn_rate_deg_s": 5.2
        },
        "breach_prediction": {
          "estimated_seconds": 5,
          "predicted_altitude_m": 75.0,
          "predicted_distance_m": 20.5,
          "severity": "CRITICAL",
          "zone_id": "ZONE-NAVAL-01",
          "zone_name": "INS Adyar Naval Base & Coastal Defense Sector",
          "zone_type": "RED"
        },
        "predicted_points": [
          {
            "altitude_m": 75.0,
            "distance_m": 20.5,
            "dt_seconds": 5,
            "heading_deg": 312.2,
            "latitude": 13.071498,
            "longitude": 80.293132
          },
          {
            "altitude_m": 75.0,
            "distance_m": 41.0,
            "dt_seconds": 10,
            "heading_deg": 334.3,
            "latitude": 13.071664,
            "longitude": 80.293049
          },
          {
            "altitude_m": 75.0,
            "distance_m": 61.5,
            "dt_seconds": 15,
            "heading_deg": 356.4,
            "latitude": 13.071849,
            "longitude": 80.293037
          },
          {
            "altitude_m": 75.0,
            "distance_m": 82.0,
            "dt_seconds": 20,
            "heading_deg": 18.5,
            "latitude": 13.072024,
            "longitude": 80.293098
          },
          {
            "altitude_m": 75.0,
            "distance_m": 102.5,
            "dt_seconds": 25,
            "heading_deg": 40.6,
            "latitude": 13.072164,
            "longitude": 80.293221
          },
          {
            "altitude_m": 75.0,
            "distance_m": 123.0,
            "dt_seconds": 30,
            "heading_deg": 62.7,
            "latitude": 13.072249,
            "longitude": 80.293389
          }
        ]
      },
      "uas_id": "RID-670"
    },
    {
      "alert_classification": "UNREGISTERED",
      "alert_subtype": "NO_REGISTRY_MATCH",
      "altitude_m": 60.0,
      "associated_camera": null,
      "authorization": {
        "altitude_valid": false,
        "classification": "UNREGISTERED",
        "inside_zone": false,
        "permission_active": false,
        "permitted": false,
        "primary_status": "UNREGISTERED",
        "reason": "UAS identifier 'RID-327' not found in official DGCA / AeroGuard registry.",
        "reason_codes": [
          "NO_REGISTRY_MATCH"
        ],
        "registered": false,
        "status": "UNAUTHORIZED",
        "subtype": "NO_REGISTRY_MATCH",
        "suggested_action": "VERIFY REGISTRY / IDENTIFY OPERATOR",
        "time_valid": false
      },
      "camera_confidence": 0.0,
      "display_status": "RADAR TRACK ACTIVE (OUT OF OPTICAL RANGE)",
      "fusion_status": "RADAR_ONLY",
      "geofence": {
        "active_zones": [
          {
            "name": "INS Adyar Naval Base & Coastal Defense Sector",
            "reason": "Permanent Defense Airspace Restriction",
            "severity": "CRITICAL",
            "zone_id": "ZONE-NAVAL-01",
            "zone_type": "RED"
          },
          {
            "name": "Tactical VIP Security & Bomb Squad Cordon",
            "reason": "VIP Movement & Anti-Sabotage Sweep",
            "severity": "CRITICAL",
            "zone_id": "ZONE-TEMP-TACTICAL-01",
            "zone_type": "TEMPORARY_RED"
          }
        ],
        "classification": "OUT_OF_ENVELOPE",
        "reason": "Direct breach of INS Adyar Naval Base & Coastal Defense Sector (RED)!",
        "severity": "CRITICAL",
        "status": "RESTRICTED_ZONE_VIOLATION",
        "subtype": "HORIZONTAL_GEOFENCE",
        "suggested_action": "ESCALATE TO DUTY COMMAND"
      },
      "heading_deg": 323.3,
      "history": [
        [
          13.061947,
          80.29532
        ],
        [
          13.061939,
          80.295244
        ],
        [
          13.061956,
          80.295171
        ],
        [
          13.061998,
          80.295104
        ],
        [
          13.062055,
          80.295061
        ]
      ],
      "last_seen": 1789097330.411538,
      "last_telemetry_timestamp": "2026-09-11T03:28:50.411537+00:00",
      "latitude": 13.062055,
      "longitude": 80.295061,
      "object_type": "DRONE",
      "radar_confidence": 0.98,
      "risk": {
        "level": "CRITICAL",
        "reasons": [
          "Unmanned Aerial Vehicle (UAV) detected",
          "UAS identifier 'RID-327' not found in official DGCA / AeroGuard registry.",
          "DIRECT BREACH: Direct breach of INS Adyar Naval Base & Coastal Defense Sector (RED)!",
          "Projected intrusion into INS Adyar Naval Base & Coastal Defense Sector in 5s"
        ],
        "score": 100
      },
      "risk_level": "CRITICAL",
      "risk_reasons": [
        "Unmanned Aerial Vehicle (UAV) detected",
        "UAS identifier 'RID-327' not found in official DGCA / AeroGuard registry.",
        "DIRECT BREACH: Direct breach of INS Adyar Naval Base & Coastal Defense Sector (RED)!",
        "Projected intrusion into INS Adyar Naval Base & Coastal Defense Sector in 5s"
      ],
      "source": "SIMULATED_REMOTE_ID",
      "speed_mps": 4.2,
      "status": "TRACKING",
      "suggested_action": "VERIFY REGISTRY / IDENTIFY OPERATOR",
      "track_id": "TRK-0002",
      "trajectory": {
        "ai_prediction": {
          "breach_eta_s": 5,
          "breach_projected": true,
          "breach_zone": "INS Adyar Naval Base & Coastal Defense Sector",
          "climb_rate_mps": 0.0,
          "confidence": 0.98,
          "intent": "EVASIVE_ZIGZAG_MANEUVER",
          "intent_label": "EVASIVE ZIGZAG MANEUVER",
          "model": "AeroGuard-Kinematic-NeuralPredictor-v2.4",
          "projected_max_altitude_m": 60.0,
          "summary": "Erratic banking & yaw wander detected (turn rate 4.5\u00b0/s). AI predicts evasive recon maneuvers.",
          "trajectory_type": "CURVILINEAR_EVASIVE",
          "turn_rate_deg_s": -4.5
        },
        "breach_prediction": {
          "estimated_seconds": 5,
          "predicted_altitude_m": 60.0,
          "predicted_distance_m": 21.0,
          "severity": "CRITICAL",
          "zone_id": "ZONE-NAVAL-01",
          "zone_name": "INS Adyar Naval Base & Coastal Defense Sector",
          "zone_type": "RED"
        },
        "predicted_points": [
          {
            "altitude_m": 60.0,
            "distance_m": 21.0,
            "dt_seconds": 5,
            "heading_deg": 304.2,
            "latitude": 13.062161,
            "longitude": 80.2949
          },
          {
            "altitude_m": 60.0,
            "distance_m": 42.0,
            "dt_seconds": 10,
            "heading_deg": 285.1,
            "latitude": 13.06221,
            "longitude": 80.294713
          },
          {
            "altitude_m": 60.0,
            "distance_m": 63.0,
            "dt_seconds": 15,
            "heading_deg": 265.9,
            "latitude": 13.062197,
            "longitude": 80.294519
          },
          {
            "altitude_m": 60.0,
            "distance_m": 84.0,
            "dt_seconds": 20,
            "heading_deg": 246.8,
            "latitude": 13.062122,
            "longitude": 80.294341
          },
          {
            "altitude_m": 60.0,
            "distance_m": 105.0,
            "dt_seconds": 25,
            "heading_deg": 227.7,
            "latitude": 13.061995,
            "longitude": 80.294197
          },
          {
            "altitude_m": 60.0,
            "distance_m": 126.0,
            "dt_seconds": 30,
            "heading_deg": 208.6,
            "latitude": 13.061829,
            "longitude": 80.294104
          }
        ]
      },
      "uas_id": "RID-327"
    },
    {
      "alert_classification": "UNREGISTERED",
      "alert_subtype": "NO_REGISTRY_MATCH",
      "altitude_m": 85.0,
      "associated_camera": null,
      "authorization": {
        "altitude_valid": false,
        "classification": "UNREGISTERED",
        "inside_zone": false,
        "permission_active": false,
        "permitted": false,
        "primary_status": "UNREGISTERED",
        "reason": "UAS identifier 'UNKNOWN' not found in official DGCA / AeroGuard registry.",
        "reason_codes": [
          "NO_REGISTRY_MATCH"
        ],
        "registered": false,
        "status": "UNAUTHORIZED",
        "subtype": "NO_REGISTRY_MATCH",
        "suggested_action": "VERIFY REGISTRY / IDENTIFY OPERATOR",
        "time_valid": false
      },
      "camera_confidence": 0.0,
      "display_status": "RADAR TRACK ACTIVE (OUT OF OPTICAL RANGE)",
      "fusion_status": "RADAR_ONLY",
      "geofence": {
        "active_zones": [
          {
            "name": "INS Adyar Naval Base & Coastal Defense Sector",
            "reason": "Permanent Defense Airspace Restriction",
            "severity": "CRITICAL",
            "zone_id": "ZONE-NAVAL-01",
            "zone_type": "RED"
          }
        ],
        "classification": "OUT_OF_ENVELOPE",
        "reason": "Direct breach of INS Adyar Naval Base & Coastal Defense Sector (RED)!",
        "severity": "CRITICAL",
        "status": "RESTRICTED_ZONE_VIOLATION",
        "subtype": "HORIZONTAL_GEOFENCE",
        "suggested_action": "ESCALATE TO DUTY COMMAND"
      },
      "heading_deg": 205.1,
      "history": [
        [
          13.080371,
          80.305354
        ],
        [
          13.080328,
          80.305349
        ],
        [
          13.080282,
          80.305339
        ],
        [
          13.080235,
          80.305323
        ],
        [
          13.080189,
          80.305301
        ]
      ],
      "last_seen": 1789097330.5402925,
      "last_telemetry_timestamp": "2026-09-11T03:28:50.540292+00:00",
      "latitude": 13.080189,
      "longitude": 80.305301,
      "object_type": "DRONE",
      "radar_confidence": 0.96,
      "risk": {
        "level": "CRITICAL",
        "reasons": [
          "Unmanned Aerial Vehicle (UAV) detected",
          "UAS identifier 'UNKNOWN' not found in official DGCA / AeroGuard registry.",
          "DIRECT BREACH: Direct breach of INS Adyar Naval Base & Coastal Defense Sector (RED)!",
          "Projected intrusion into INS Adyar Naval Base & Coastal Defense Sector in 5s"
        ],
        "score": 100
      },
      "risk_level": "CRITICAL",
      "risk_reasons": [
        "Unmanned Aerial Vehicle (UAV) detected",
        "UAS identifier 'UNKNOWN' not found in official DGCA / AeroGuard registry.",
        "DIRECT BREACH: Direct breach of INS Adyar Naval Base & Coastal Defense Sector (RED)!",
        "Projected intrusion into INS Adyar Naval Base & Coastal Defense Sector in 5s"
      ],
      "source": "SIMULATED_REMOTE_ID",
      "speed_mps": 2.7,
      "status": "TRACKING",
      "suggested_action": "VERIFY REGISTRY / IDENTIFY OPERATOR",
      "track_id": "TRK-0003",
      "trajectory": {
        "ai_prediction": {
          "breach_eta_s": 5,
          "breach_projected": true,
          "breach_zone": "INS Adyar Naval Base & Coastal Defense Sector",
          "climb_rate_mps": 0.0,
          "confidence": 0.98,
          "intent": "EVASIVE_ZIGZAG_MANEUVER",
          "intent_label": "EVASIVE ZIGZAG MANEUVER",
          "model": "AeroGuard-Kinematic-NeuralPredictor-v2.4",
          "projected_max_altitude_m": 85.0,
          "summary": "Erratic banking & yaw wander detected (turn rate 4.5\u00b0/s). AI predicts evasive recon maneuvers.",
          "trajectory_type": "CURVILINEAR_EVASIVE",
          "turn_rate_deg_s": -4.5
        },
        "breach_prediction": {
          "estimated_seconds": 5,
          "predicted_altitude_m": 85.0,
          "predicted_distance_m": 13.5,
          "severity": "CRITICAL",
          "zone_id": "ZONE-NAVAL-01",
          "zone_name": "INS Adyar Naval Base & Coastal Defense Sector",
          "zone_type": "RED"
        },
        "predicted_points": [
          {
            "altitude_m": 85.0,
            "distance_m": 13.5,
            "dt_seconds": 5,
            "heading_deg": 186.0,
            "latitude": 13.080068,
            "longitude": 80.305288
          },
          {
            "altitude_m": 85.0,
            "distance_m": 27.0,
            "dt_seconds": 10,
            "heading_deg": 166.8,
            "latitude": 13.07995,
            "longitude": 80.305316
          },
          {
            "altitude_m": 85.0,
            "distance_m": 40.5,
            "dt_seconds": 15,
            "heading_deg": 147.7,
            "latitude": 13.079847,
            "longitude": 80.305383
          },
          {
            "altitude_m": 85.0,
            "distance_m": 54.0,
            "dt_seconds": 20,
            "heading_deg": 128.6,
            "latitude": 13.079771,
            "longitude": 80.305481
          },
          {
            "altitude_m": 85.0,
            "distance_m": 67.5,
            "dt_seconds": 25,
            "heading_deg": 109.5,
            "latitude": 13.07973,
            "longitude": 80.305598
          },
          {
            "altitude_m": 85.0,
            "distance_m": 81.0,
            "dt_seconds": 30,
            "heading_deg": 90.3,
            "latitude": 13.07973,
            "longitude": 80.305723
          }
        ]
      },
      "uas_id": "UNKNOWN"
    },
    {
      "alert_classification": "UNREGISTERED",
      "alert_subtype": "NO_REGISTRY_MATCH",
      "altitude_m": 50.0,
      "associated_camera": null,
      "authorization": {
        "altitude_valid": false,
        "classification": "UNREGISTERED",
        "inside_zone": false,
        "permission_active": false,
        "permitted": false,
        "primary_status": "UNREGISTERED",
        "reason": "UAS identifier 'RID-293' not found in official DGCA / AeroGuard registry.",
        "reason_codes": [
          "NO_REGISTRY_MATCH"
        ],
        "registered": false,
        "status": "UNAUTHORIZED",
        "subtype": "NO_REGISTRY_MATCH",
        "suggested_action": "VERIFY REGISTRY / IDENTIFY OPERATOR",
        "time_valid": false
      },
      "camera_confidence": 0.0,
      "display_status": "RADAR TRACK ACTIVE (OUT OF OPTICAL RANGE)",
      "fusion_status": "RADAR_ONLY",
      "geofence": {
        "active_zones": [
          {
            "name": "Chennai Port Commercial Shipping Anchorage",
            "reason": "Port Authority Commercial Buffer Zone",
            "severity": "HIGH",
            "zone_id": "ZONE-PORT-02",
            "zone_type": "YELLOW"
          }
        ],
        "classification": "OUT_OF_ENVELOPE",
        "reason": "Direct breach of Chennai Port Commercial Shipping Anchorage (YELLOW)!",
        "severity": "HIGH",
        "status": "RESTRICTED_ZONE_VIOLATION",
        "subtype": "HORIZONTAL_GEOFENCE",
        "suggested_action": "VERIFY / DISPATCH PATROL"
      },
      "heading_deg": 20.2,
      "history": [
        [
          13.107071,
          80.314689
        ],
        [
          13.107251,
          80.314723
        ],
        [
          13.107439,
          80.314767
        ],
        [
          13.107635,
          80.314828
        ],
        [
          13.107798,
          80.31489
        ]
      ],
      "last_seen": 1789097330.636291,
      "last_telemetry_timestamp": "2026-09-11T03:28:50.636291+00:00",
      "latitude": 13.107798,
      "longitude": 80.31489,
      "object_type": "DRONE",
      "radar_confidence": 0.98,
      "risk": {
        "level": "CRITICAL",
        "reasons": [
          "Unmanned Aerial Vehicle (UAV) detected",
          "UAS identifier 'RID-293' not found in official DGCA / AeroGuard registry.",
          "DIRECT BREACH: Direct breach of Chennai Port Commercial Shipping Anchorage (YELLOW)!",
          "Projected intrusion into Chennai Port Commercial Shipping Anchorage in 5s"
        ],
        "score": 100
      },
      "risk_level": "CRITICAL",
      "risk_reasons": [
        "Unmanned Aerial Vehicle (UAV) detected",
        "UAS identifier 'RID-293' not found in official DGCA / AeroGuard registry.",
        "DIRECT BREACH: Direct breach of Chennai Port Commercial Shipping Anchorage (YELLOW)!",
        "Projected intrusion into Chennai Port Commercial Shipping Anchorage in 5s"
      ],
      "source": "SIMULATED_REMOTE_ID",
      "speed_mps": 10.7,
      "status": "TRACKING",
      "suggested_action": "VERIFY REGISTRY / IDENTIFY OPERATOR",
      "track_id": "TRK-0004",
      "trajectory": {
        "ai_prediction": {
          "breach_eta_s": 5,
          "breach_projected": true,
          "breach_zone": "Chennai Port Commercial Shipping Anchorage",
          "climb_rate_mps": 0.0,
          "confidence": 0.98,
          "intent": "EVASIVE_ZIGZAG_MANEUVER",
          "intent_label": "EVASIVE ZIGZAG MANEUVER",
          "model": "AeroGuard-Kinematic-NeuralPredictor-v2.4",
          "projected_max_altitude_m": 50.0,
          "summary": "Erratic banking & yaw wander detected (turn rate 5.2\u00b0/s). AI predicts evasive recon maneuvers.",
          "trajectory_type": "CURVILINEAR_EVASIVE",
          "turn_rate_deg_s": 5.2
        },
        "breach_prediction": {
          "estimated_seconds": 5,
          "predicted_altitude_m": 50.0,
          "predicted_distance_m": 53.5,
          "severity": "HIGH",
          "zone_id": "ZONE-PORT-02",
          "zone_name": "Chennai Port Commercial Shipping Anchorage",
          "zone_type": "YELLOW"
        },
        "predicted_points": [
          {
            "altitude_m": 50.0,
            "distance_m": 53.5,
            "dt_seconds": 5,
            "heading_deg": 42.3,
            "latitude": 13.108154,
            "longitude": 80.315223
          },
          {
            "altitude_m": 50.0,
            "distance_m": 107.0,
            "dt_seconds": 10,
            "heading_deg": 64.4,
            "latitude": 13.108363,
            "longitude": 80.315669
          },
          {
            "altitude_m": 50.0,
            "distance_m": 160.5,
            "dt_seconds": 15,
            "heading_deg": 86.5,
            "latitude": 13.108392,
            "longitude": 80.316163
          },
          {
            "altitude_m": 50.0,
            "distance_m": 214.0,
            "dt_seconds": 20,
            "heading_deg": 108.6,
            "latitude": 13.108238,
            "longitude": 80.316632
          },
          {
            "altitude_m": 50.0,
            "distance_m": 267.5,
            "dt_seconds": 25,
            "heading_deg": 130.7,
            "latitude": 13.107924,
            "longitude": 80.317008
          },
          {
            "altitude_m": 50.0,
            "distance_m": 321.0,
            "dt_seconds": 30,
            "heading_deg": 152.8,
            "latitude": 13.107495,
            "longitude": 80.317234
          }
        ]
      },
      "uas_id": "RID-293"
    },
    {
      "alert_classification": "UNREGISTERED",
      "alert_subtype": "NO_REGISTRY_MATCH",
      "altitude_m": 70.0,
      "associated_camera": null,
      "authorization": {
        "altitude_valid": false,
        "classification": "UNREGISTERED",
        "inside_zone": false,
        "permission_active": false,
        "permitted": false,
        "primary_status": "UNREGISTERED",
        "reason": "UAS identifier 'RID-359' not found in official DGCA / AeroGuard registry.",
        "reason_codes": [
          "NO_REGISTRY_MATCH"
        ],
        "registered": false,
        "status": "UNAUTHORIZED",
        "subtype": "NO_REGISTRY_MATCH",
        "suggested_action": "VERIFY REGISTRY / IDENTIFY OPERATOR",
        "time_valid": false
      },
      "camera_confidence": 0.0,
      "display_status": "RADAR TRACK ACTIVE (OUT OF OPTICAL RANGE)",
      "fusion_status": "RADAR_ONLY",
      "geofence": {
        "active_zones": [
          {
            "name": "Chennai Port Commercial Shipping Anchorage",
            "reason": "Port Authority Commercial Buffer Zone",
            "severity": "HIGH",
            "zone_id": "ZONE-PORT-02",
            "zone_type": "YELLOW"
          }
        ],
        "classification": "OUT_OF_ENVELOPE",
        "reason": "Direct breach of Chennai Port Commercial Shipping Anchorage (YELLOW)!",
        "severity": "HIGH",
        "status": "RESTRICTED_ZONE_VIOLATION",
        "subtype": "HORIZONTAL_GEOFENCE",
        "suggested_action": "VERIFY / DISPATCH PATROL"
      },
      "heading_deg": 127.2,
      "history": [
        [
          13.101476,
          80.30699
        ],
        [
          13.101498,
          80.307185
        ],
        [
          13.101477,
          80.307382
        ],
        [
          13.101417,
          80.307545
        ],
        [
          13.101299,
          80.307704
        ]
      ],
      "last_seen": 1789097330.7114747,
      "last_telemetry_timestamp": "2026-09-11T03:28:50.711474+00:00",
      "latitude": 13.101299,
      "longitude": 80.307704,
      "object_type": "DRONE",
      "radar_confidence": 1.0,
      "risk": {
        "level": "CRITICAL",
        "reasons": [
          "Unmanned Aerial Vehicle (UAV) detected",
          "UAS identifier 'RID-359' not found in official DGCA / AeroGuard registry.",
          "DIRECT BREACH: Direct breach of Chennai Port Commercial Shipping Anchorage (YELLOW)!",
          "Projected intrusion into Chennai Port Commercial Shipping Anchorage in 5s"
        ],
        "score": 100
      },
      "risk_level": "CRITICAL",
      "risk_reasons": [
        "Unmanned Aerial Vehicle (UAV) detected",
        "UAS identifier 'RID-359' not found in official DGCA / AeroGuard registry.",
        "DIRECT BREACH: Direct breach of Chennai Port Commercial Shipping Anchorage (YELLOW)!",
        "Projected intrusion into Chennai Port Commercial Shipping Anchorage in 5s"
      ],
      "source": "SIMULATED_REMOTE_ID",
      "speed_mps": 9.9,
      "status": "TRACKING",
      "suggested_action": "VERIFY REGISTRY / IDENTIFY OPERATOR",
      "track_id": "TRK-0005",
      "trajectory": {
        "ai_prediction": {
          "breach_eta_s": 5,
          "breach_projected": true,
          "breach_zone": "Chennai Port Commercial Shipping Anchorage",
          "climb_rate_mps": 0.0,
          "confidence": 0.98,
          "intent": "EVASIVE_ZIGZAG_MANEUVER",
          "intent_label": "EVASIVE ZIGZAG MANEUVER",
          "model": "AeroGuard-Kinematic-NeuralPredictor-v2.4",
          "projected_max_altitude_m": 70.0,
          "summary": "Erratic banking & yaw wander detected (turn rate 5.2\u00b0/s). AI predicts evasive recon maneuvers.",
          "trajectory_type": "CURVILINEAR_EVASIVE",
          "turn_rate_deg_s": 5.2
        },
        "breach_prediction": {
          "estimated_seconds": 5,
          "predicted_altitude_m": 70.0,
          "predicted_distance_m": 49.5,
          "severity": "HIGH",
          "zone_id": "ZONE-PORT-02",
          "zone_name": "Chennai Port Commercial Shipping Anchorage",
          "zone_type": "YELLOW"
        },
        "predicted_points": [
          {
            "altitude_m": 70.0,
            "distance_m": 49.5,
            "dt_seconds": 5,
            "heading_deg": 149.3,
            "latitude": 13.100916,
            "longitude": 80.307938
          },
          {
            "altitude_m": 70.0,
            "distance_m": 99.0,
            "dt_seconds": 10,
            "heading_deg": 171.4,
            "latitude": 13.100475,
            "longitude": 80.308006
          },
          {
            "altitude_m": 70.0,
            "distance_m": 148.5,
            "dt_seconds": 15,
            "heading_deg": 193.5,
            "latitude": 13.100041,
            "longitude": 80.307899
          },
          {
            "altitude_m": 70.0,
            "distance_m": 198.0,
            "dt_seconds": 20,
            "heading_deg": 215.6,
            "latitude": 13.099678,
            "longitude": 80.307633
          },
          {
            "altitude_m": 70.0,
            "distance_m": 247.5,
            "dt_seconds": 25,
            "heading_deg": 237.7,
            "latitude": 13.09944,
            "longitude": 80.307246
          },
          {
            "altitude_m": 70.0,
            "distance_m": 297.0,
            "dt_seconds": 30,
            "heading_deg": 259.8,
            "latitude": 13.099361,
            "longitude": 80.306795
          }
        ]
      },
      "uas_id": "RID-359"
    },
    {
      "alert_classification": "UNREGISTERED",
      "alert_subtype": "NO_REGISTRY_MATCH",
      "altitude_m": 95.0,
      "associated_camera": null,
      "authorization": {
        "altitude_valid": false,
        "classification": "UNREGISTERED",
        "inside_zone": false,
        "permission_active": false,
        "permitted": false,
        "primary_status": "UNREGISTERED",
        "reason": "UAS identifier 'UNKNOWN' not found in official DGCA / AeroGuard registry.",
        "reason_codes": [
          "NO_REGISTRY_MATCH"
        ],
        "registered": false,
        "status": "UNAUTHORIZED",
        "subtype": "NO_REGISTRY_MATCH",
        "suggested_action": "VERIFY REGISTRY / IDENTIFY OPERATOR",
        "time_valid": false
      },
      "camera_confidence": 0.0,
      "display_status": "RADAR TRACK ACTIVE (OUT OF OPTICAL RANGE)",
      "fusion_status": "RADAR_ONLY",
      "geofence": {
        "active_zones": [
          {
            "name": "Chennai Port Commercial Shipping Anchorage",
            "reason": "Port Authority Commercial Buffer Zone",
            "severity": "HIGH",
            "zone_id": "ZONE-PORT-02",
            "zone_type": "YELLOW"
          }
        ],
        "classification": "OUT_OF_ENVELOPE",
        "reason": "Direct breach of Chennai Port Commercial Shipping Anchorage (YELLOW)!",
        "severity": "HIGH",
        "status": "RESTRICTED_ZONE_VIOLATION",
        "subtype": "HORIZONTAL_GEOFENCE",
        "suggested_action": "VERIFY / DISPATCH PATROL"
      },
      "heading_deg": 45.5,
      "history": [
        [
          13.088341,
          80.305701
        ],
        [
          13.088373,
          80.305881
        ],
        [
          13.088429,
          80.306023
        ],
        [
          13.088516,
          80.306163
        ],
        [
          13.088627,
          80.306279
        ]
      ],
      "last_seen": 1789097328.4173794,
      "last_telemetry_timestamp": "2026-09-11T03:28:48.417379+00:00",
      "latitude": 13.088627,
      "longitude": 80.306279,
      "object_type": "DRONE",
      "radar_confidence": 0.98,
      "risk": {
        "level": "CRITICAL",
        "reasons": [
          "Unmanned Aerial Vehicle (UAV) detected",
          "UAS identifier 'UNKNOWN' not found in official DGCA / AeroGuard registry.",
          "DIRECT BREACH: Direct breach of Chennai Port Commercial Shipping Anchorage (YELLOW)!",
          "Projected intrusion into Chennai Port Commercial Shipping Anchorage in 5s"
        ],
        "score": 100
      },
      "risk_level": "CRITICAL",
      "risk_reasons": [
        "Unmanned Aerial Vehicle (UAV) detected",
        "UAS identifier 'UNKNOWN' not found in official DGCA / AeroGuard registry.",
        "DIRECT BREACH: Direct breach of Chennai Port Commercial Shipping Anchorage (YELLOW)!",
        "Projected intrusion into Chennai Port Commercial Shipping Anchorage in 5s"
      ],
      "source": "SIMULATED_REMOTE_ID",
      "speed_mps": 9.2,
      "status": "TRACKING",
      "suggested_action": "VERIFY REGISTRY / IDENTIFY OPERATOR",
      "track_id": "TRK-0006",
      "trajectory": {
        "ai_prediction": {
          "breach_eta_s": 5,
          "breach_projected": true,
          "breach_zone": "Chennai Port Commercial Shipping Anchorage",
          "climb_rate_mps": 0.0,
          "confidence": 0.98,
          "intent": "EVASIVE_ZIGZAG_MANEUVER",
          "intent_label": "EVASIVE ZIGZAG MANEUVER",
          "model": "AeroGuard-Kinematic-NeuralPredictor-v2.4",
          "projected_max_altitude_m": 95.0,
          "summary": "Erratic banking & yaw wander detected (turn rate 4.5\u00b0/s). AI predicts evasive recon maneuvers.",
          "trajectory_type": "CURVILINEAR_EVASIVE",
          "turn_rate_deg_s": -4.5
        },
        "breach_prediction": {
          "estimated_seconds": 5,
          "predicted_altitude_m": 95.0,
          "predicted_distance_m": 46.0,
          "severity": "HIGH",
          "zone_id": "ZONE-PORT-02",
          "zone_name": "Chennai Port Commercial Shipping Anchorage",
          "zone_type": "YELLOW"
        },
        "predicted_points": [
          {
            "altitude_m": 95.0,
            "distance_m": 46.0,
            "dt_seconds": 5,
            "heading_deg": 26.4,
            "latitude": 13.088998,
            "longitude": 80.306468
          },
          {
            "altitude_m": 95.0,
            "distance_m": 92.0,
            "dt_seconds": 10,
            "heading_deg": 7.2,
            "latitude": 13.089409,
            "longitude": 80.306522
          },
          {
            "altitude_m": 95.0,
            "distance_m": 138.0,
            "dt_seconds": 15,
            "heading_deg": 348.1,
            "latitude": 13.089815,
            "longitude": 80.306434
          },
          {
            "altitude_m": 95.0,
            "distance_m": 184.0,
            "dt_seconds": 20,
            "heading_deg": 329.0,
            "latitude": 13.09017,
            "longitude": 80.306215
          },
          {
            "altitude_m": 95.0,
            "distance_m": 230.0,
            "dt_seconds": 25,
            "heading_deg": 309.9,
            "latitude": 13.090436,
            "longitude": 80.305888
          },
          {
            "altitude_m": 95.0,
            "distance_m": 276.0,
            "dt_seconds": 30,
            "heading_deg": 290.8,
            "latitude": 13.090583,
            "longitude": 80.305491
          }
        ]
      },
      "uas_id": "UNKNOWN"
    },
    {
      "alert_classification": "UNREGISTERED",
      "alert_subtype": "NO_REGISTRY_MATCH",
      "altitude_m": 40.0,
      "associated_camera": null,
      "authorization": {
        "altitude_valid": false,
        "classification": "UNREGISTERED",
        "inside_zone": false,
        "permission_active": false,
        "permitted": false,
        "primary_status": "UNREGISTERED",
        "reason": "UAS identifier 'RID-570' not found in official DGCA / AeroGuard registry.",
        "reason_codes": [
          "NO_REGISTRY_MATCH"
        ],
        "registered": false,
        "status": "UNAUTHORIZED",
        "subtype": "NO_REGISTRY_MATCH",
        "suggested_action": "VERIFY REGISTRY / IDENTIFY OPERATOR",
        "time_valid": false
      },
      "camera_confidence": 0.0,
      "display_status": "RADAR TRACK ACTIVE (OUT OF OPTICAL RANGE)",
      "fusion_status": "RADAR_ONLY",
      "geofence": {
        "active_zones": [
          {
            "name": "Tactical VIP Security & Bomb Squad Cordon",
            "reason": "VIP Movement & Anti-Sabotage Sweep",
            "severity": "CRITICAL",
            "zone_id": "ZONE-TEMP-TACTICAL-01",
            "zone_type": "TEMPORARY_RED"
          }
        ],
        "classification": "OUT_OF_ENVELOPE",
        "reason": "Direct breach of Tactical VIP Security & Bomb Squad Cordon (TEMPORARY_RED)!",
        "severity": "CRITICAL",
        "status": "RESTRICTED_ZONE_VIOLATION",
        "subtype": "HORIZONTAL_GEOFENCE",
        "suggested_action": "ESCALATE TO DUTY COMMAND"
      },
      "heading_deg": 134.7,
      "history": [
        [
          13.060419,
          80.290784
        ],
        [
          13.060443,
          80.290998
        ],
        [
          13.060403,
          80.291217
        ],
        [
          13.060294,
          80.291424
        ],
        [
          13.060149,
          80.291574
        ]
      ],
      "last_seen": 1789097328.5227304,
      "last_telemetry_timestamp": "2026-09-11T03:28:48.522730+00:00",
      "latitude": 13.060149,
      "longitude": 80.291574,
      "object_type": "DRONE",
      "radar_confidence": 0.89,
      "risk": {
        "level": "CRITICAL",
        "reasons": [
          "Unmanned Aerial Vehicle (UAV) detected",
          "UAS identifier 'RID-570' not found in official DGCA / AeroGuard registry.",
          "DIRECT BREACH: Direct breach of Tactical VIP Security & Bomb Squad Cordon (TEMPORARY_RED)!",
          "Projected intrusion into INS Adyar Naval Base & Coastal Defense Sector in 20s"
        ],
        "score": 100
      },
      "risk_level": "CRITICAL",
      "risk_reasons": [
        "Unmanned Aerial Vehicle (UAV) detected",
        "UAS identifier 'RID-570' not found in official DGCA / AeroGuard registry.",
        "DIRECT BREACH: Direct breach of Tactical VIP Security & Bomb Squad Cordon (TEMPORARY_RED)!",
        "Projected intrusion into INS Adyar Naval Base & Coastal Defense Sector in 20s"
      ],
      "source": "SIMULATED_REMOTE_ID",
      "speed_mps": 12.4,
      "status": "TRACKING",
      "suggested_action": "VERIFY REGISTRY / IDENTIFY OPERATOR",
      "track_id": "TRK-0007",
      "trajectory": {
        "ai_prediction": {
          "breach_eta_s": 20,
          "breach_projected": true,
          "breach_zone": "INS Adyar Naval Base & Coastal Defense Sector",
          "climb_rate_mps": 0.0,
          "confidence": 0.98,
          "intent": "EVASIVE_ZIGZAG_MANEUVER",
          "intent_label": "EVASIVE ZIGZAG MANEUVER",
          "model": "AeroGuard-Kinematic-NeuralPredictor-v2.4",
          "projected_max_altitude_m": 40.0,
          "summary": "Erratic banking & yaw wander detected (turn rate 4.5\u00b0/s). AI predicts evasive recon maneuvers.",
          "trajectory_type": "CURVILINEAR_EVASIVE",
          "turn_rate_deg_s": -4.5
        },
        "breach_prediction": {
          "estimated_seconds": 20,
          "predicted_altitude_m": 40.0,
          "predicted_distance_m": 248.0,
          "severity": "CRITICAL",
          "zone_id": "ZONE-NAVAL-01",
          "zone_name": "INS Adyar Naval Base & Coastal Defense Sector",
          "zone_type": "RED"
        },
        "predicted_points": [
          {
            "altitude_m": 40.0,
            "distance_m": 62.0,
            "dt_seconds": 5,
            "heading_deg": 115.6,
            "latitude": 13.059908,
            "longitude": 80.292091
          },
          {
            "altitude_m": 40.0,
            "distance_m": 124.0,
            "dt_seconds": 10,
            "heading_deg": 96.4,
            "latitude": 13.059845,
            "longitude": 80.292661
          },
          {
            "altitude_m": 40.0,
            "distance_m": 186.0,
            "dt_seconds": 15,
            "heading_deg": 77.3,
            "latitude": 13.059968,
            "longitude": 80.29322
          },
          {
            "altitude_m": 40.0,
            "distance_m": 248.0,
            "dt_seconds": 20,
            "heading_deg": 58.2,
            "latitude": 13.060262,
            "longitude": 80.293708
          },
          {
            "altitude_m": 40.0,
            "distance_m": 310.0,
            "dt_seconds": 25,
            "heading_deg": 39.1,
            "latitude": 13.060696,
            "longitude": 80.294069
          },
          {
            "altitude_m": 40.0,
            "distance_m": 372.0,
            "dt_seconds": 30,
            "heading_deg": 19.9,
            "latitude": 13.061221,
            "longitude": 80.294265
          }
        ]
      },
      "uas_id": "RID-570"
    },
    {
      "alert_classification": "UNREGISTERED",
      "alert_subtype": "NO_REGISTRY_MATCH",
      "altitude_m": 55.0,
      "associated_camera": null,
      "authorization": {
        "altitude_valid": false,
        "classification": "UNREGISTERED",
        "inside_zone": false,
        "permission_active": false,
        "permitted": false,
        "primary_status": "UNREGISTERED",
        "reason": "UAS identifier 'UNKNOWN' not found in official DGCA / AeroGuard registry.",
        "reason_codes": [
          "NO_REGISTRY_MATCH"
        ],
        "registered": false,
        "status": "UNAUTHORIZED",
        "subtype": "NO_REGISTRY_MATCH",
        "suggested_action": "VERIFY REGISTRY / IDENTIFY OPERATOR",
        "time_valid": false
      },
      "camera_confidence": 0.0,
      "display_status": "RADAR TRACK ACTIVE (OUT OF OPTICAL RANGE)",
      "fusion_status": "RADAR_ONLY",
      "geofence": {
        "active_zones": [
          {
            "name": "Marina Beach Public Coastal Strip",
            "reason": "Civilian Approved Flight Corridor",
            "severity": "MEDIUM",
            "zone_id": "ZONE-CIVIL-03",
            "zone_type": "GREEN"
          }
        ],
        "classification": "OUT_OF_ENVELOPE",
        "reason": "Direct breach of Marina Beach Public Coastal Strip (GREEN)!",
        "severity": "MEDIUM",
        "status": "RESTRICTED_ZONE_VIOLATION",
        "subtype": "HORIZONTAL_GEOFENCE",
        "suggested_action": "VERIFY / DISPATCH PATROL"
      },
      "heading_deg": 38.4,
      "history": [
        [
          13.04498,
          80.285305
        ],
        [
          13.045108,
          80.285309
        ],
        [
          13.045243,
          80.285348
        ],
        [
          13.045356,
          80.285408
        ],
        [
          13.045449,
          80.285484
        ]
      ],
      "last_seen": 1789097328.657011,
      "last_telemetry_timestamp": "2026-09-11T03:28:48.657011+00:00",
      "latitude": 13.045449,
      "longitude": 80.285484,
      "object_type": "DRONE",
      "radar_confidence": 0.99,
      "risk": {
        "level": "CRITICAL",
        "reasons": [
          "Unmanned Aerial Vehicle (UAV) detected",
          "UAS identifier 'UNKNOWN' not found in official DGCA / AeroGuard registry.",
          "DIRECT BREACH: Direct breach of Marina Beach Public Coastal Strip (GREEN)!",
          "Projected intrusion into Marina Beach Public Coastal Strip in 5s"
        ],
        "score": 100
      },
      "risk_level": "CRITICAL",
      "risk_reasons": [
        "Unmanned Aerial Vehicle (UAV) detected",
        "UAS identifier 'UNKNOWN' not found in official DGCA / AeroGuard registry.",
        "DIRECT BREACH: Direct breach of Marina Beach Public Coastal Strip (GREEN)!",
        "Projected intrusion into Marina Beach Public Coastal Strip in 5s"
      ],
      "source": "SIMULATED_REMOTE_ID",
      "speed_mps": 7.1,
      "status": "TRACKING",
      "suggested_action": "VERIFY REGISTRY / IDENTIFY OPERATOR",
      "track_id": "TRK-0008",
      "trajectory": {
        "ai_prediction": {
          "breach_eta_s": 5,
          "breach_projected": true,
          "breach_zone": "Marina Beach Public Coastal Strip",
          "climb_rate_mps": 0.0,
          "confidence": 0.98,
          "intent": "EVASIVE_ZIGZAG_MANEUVER",
          "intent_label": "EVASIVE ZIGZAG MANEUVER",
          "model": "AeroGuard-Kinematic-NeuralPredictor-v2.4",
          "projected_max_altitude_m": 55.0,
          "summary": "Erratic banking & yaw wander detected (turn rate 5.2\u00b0/s). AI predicts evasive recon maneuvers.",
          "trajectory_type": "CURVILINEAR_EVASIVE",
          "turn_rate_deg_s": 5.2
        },
        "breach_prediction": {
          "estimated_seconds": 5,
          "predicted_altitude_m": 55.0,
          "predicted_distance_m": 35.5,
          "severity": "MEDIUM",
          "zone_id": "ZONE-CIVIL-03",
          "zone_name": "Marina Beach Public Coastal Strip",
          "zone_type": "GREEN"
        },
        "predicted_points": [
          {
            "altitude_m": 55.0,
            "distance_m": 35.5,
            "dt_seconds": 5,
            "heading_deg": 60.5,
            "latitude": 13.045606,
            "longitude": 80.28577
          },
          {
            "altitude_m": 55.0,
            "distance_m": 71.0,
            "dt_seconds": 10,
            "heading_deg": 82.6,
            "latitude": 13.045648,
            "longitude": 80.286095
          },
          {
            "altitude_m": 55.0,
            "distance_m": 106.5,
            "dt_seconds": 15,
            "heading_deg": 104.7,
            "latitude": 13.045567,
            "longitude": 80.286413
          },
          {
            "altitude_m": 55.0,
            "distance_m": 142.0,
            "dt_seconds": 20,
            "heading_deg": 126.8,
            "latitude": 13.045375,
            "longitude": 80.286676
          },
          {
            "altitude_m": 55.0,
            "distance_m": 177.5,
            "dt_seconds": 25,
            "heading_deg": 148.9,
            "latitude": 13.045101,
            "longitude": 80.286845
          },
          {
            "altitude_m": 55.0,
            "distance_m": 213.0,
            "dt_seconds": 30,
            "heading_deg": 171.0,
            "latitude": 13.044785,
            "longitude": 80.286897
          }
        ]
      },
      "uas_id": "UNKNOWN"
    },
    {
      "alert_classification": "UNREGISTERED",
      "alert_subtype": "NO_REGISTRY_MATCH",
      "altitude_m": 36.2,
      "associated_camera": null,
      "authorization": {
        "altitude_valid": false,
        "classification": "UNREGISTERED",
        "inside_zone": false,
        "permission_active": false,
        "permitted": false,
        "primary_status": "UNREGISTERED",
        "reason": "UAS identifier 'RID-606' not found in official DGCA / AeroGuard registry.",
        "reason_codes": [
          "NO_REGISTRY_MATCH"
        ],
        "registered": false,
        "status": "UNAUTHORIZED",
        "subtype": "NO_REGISTRY_MATCH",
        "suggested_action": "VERIFY REGISTRY / IDENTIFY OPERATOR",
        "time_valid": false
      },
      "camera_confidence": 0.0,
      "display_status": "RADAR TRACK ACTIVE (OUT OF OPTICAL RANGE)",
      "fusion_status": "RADAR_ONLY",
      "geofence": {
        "classification": "AUTHORIZED",
        "reason": "Airspace perimeter clear.",
        "severity": "LOW",
        "status": "CLEAR",
        "subtype": "AIRSPACE_CLEAR",
        "suggested_action": "MONITOR"
      },
      "heading_deg": 35.6,
      "history": [
        [
          13.025211,
          80.269749
        ],
        [
          13.025469,
          80.269901
        ],
        [
          13.025723,
          80.270056
        ],
        [
          13.02597,
          80.270223
        ],
        [
          13.026207,
          80.270397
        ]
      ],
      "last_seen": 1789097328.812181,
      "last_telemetry_timestamp": "2026-09-11T03:28:48.812181+00:00",
      "latitude": 13.026207,
      "longitude": 80.270397,
      "object_type": "DRONE",
      "radar_confidence": 0.98,
      "risk": {
        "level": "HIGH",
        "reasons": [
          "Unmanned Aerial Vehicle (UAV) detected",
          "UAS identifier 'RID-606' not found in official DGCA / AeroGuard registry."
        ],
        "score": 70
      },
      "risk_level": "HIGH",
      "risk_reasons": [
        "Unmanned Aerial Vehicle (UAV) detected",
        "UAS identifier 'RID-606' not found in official DGCA / AeroGuard registry."
      ],
      "source": "SIMULATED_REMOTE_ID",
      "speed_mps": 17.5,
      "status": "TRACKING",
      "suggested_action": "VERIFY REGISTRY / IDENTIFY OPERATOR",
      "track_id": "TRK-0009",
      "trajectory": {
        "ai_prediction": {
          "breach_eta_s": null,
          "breach_projected": false,
          "breach_zone": null,
          "climb_rate_mps": 0.0,
          "confidence": 0.96,
          "intent": "EVASIVE_ZIGZAG_MANEUVER",
          "intent_label": "EVASIVE ZIGZAG MANEUVER",
          "model": "AeroGuard-Kinematic-NeuralPredictor-v2.4",
          "projected_max_altitude_m": 36.2,
          "summary": "Erratic banking & yaw wander detected (turn rate 4.5\u00b0/s). AI predicts evasive recon maneuvers.",
          "trajectory_type": "CURVILINEAR_EVASIVE",
          "turn_rate_deg_s": -4.5
        },
        "breach_prediction": null,
        "predicted_points": [
          {
            "altitude_m": 36.2,
            "distance_m": 87.5,
            "dt_seconds": 5,
            "heading_deg": 16.5,
            "latitude": 13.026963,
            "longitude": 80.270626
          },
          {
            "altitude_m": 36.2,
            "distance_m": 175.0,
            "dt_seconds": 10,
            "heading_deg": 357.4,
            "latitude": 13.02775,
            "longitude": 80.270589
          },
          {
            "altitude_m": 36.2,
            "distance_m": 262.5,
            "dt_seconds": 15,
            "heading_deg": 338.2,
            "latitude": 13.028482,
            "longitude": 80.270289
          },
          {
            "altitude_m": 36.2,
            "distance_m": 350.0,
            "dt_seconds": 20,
            "heading_deg": 319.1,
            "latitude": 13.029078,
            "longitude": 80.269759
          },
          {
            "altitude_m": 36.2,
            "distance_m": 437.5,
            "dt_seconds": 25,
            "heading_deg": 300.0,
            "latitude": 13.029472,
            "longitude": 80.269058
          },
          {
            "altitude_m": 36.2,
            "distance_m": 525.0,
            "dt_seconds": 30,
            "heading_deg": 280.9,
            "latitude": 13.02962,
            "longitude": 80.268264
          }
        ]
      },
      "uas_id": "RID-606"
    },
    {
      "alert_classification": "UNREGISTERED",
      "alert_subtype": "NO_REGISTRY_MATCH",
      "altitude_m": 121.1,
      "associated_camera": null,
      "authorization": {
        "altitude_valid": false,
        "classification": "UNREGISTERED",
        "inside_zone": false,
        "permission_active": false,
        "permitted": false,
        "primary_status": "UNREGISTERED",
        "reason": "UAS identifier 'RID-492' not found in official DGCA / AeroGuard registry.",
        "reason_codes": [
          "NO_REGISTRY_MATCH"
        ],
        "registered": false,
        "status": "UNAUTHORIZED",
        "subtype": "NO_REGISTRY_MATCH",
        "suggested_action": "VERIFY REGISTRY / IDENTIFY OPERATOR",
        "time_valid": false
      },
      "camera_confidence": 0.0,
      "display_status": "RADAR TRACK ACTIVE (OUT OF OPTICAL RANGE)",
      "fusion_status": "RADAR_ONLY",
      "geofence": {
        "classification": "AUTHORIZED",
        "reason": "Airspace perimeter clear.",
        "severity": "LOW",
        "status": "CLEAR",
        "subtype": "AIRSPACE_CLEAR",
        "suggested_action": "MONITOR"
      },
      "heading_deg": 12.0,
      "history": [
        [
          13.032025,
          80.333556
        ],
        [
          13.032274,
          80.333598
        ],
        [
          13.032512,
          80.333643
        ],
        [
          13.032754,
          80.333692
        ],
        [
          13.033036,
          80.333753
        ]
      ],
      "last_seen": 1789097328.97379,
      "last_telemetry_timestamp": "2026-09-11T03:28:48.973790+00:00",
      "latitude": 13.033036,
      "longitude": 80.333753,
      "object_type": "DRONE",
      "radar_confidence": 0.94,
      "risk": {
        "level": "HIGH",
        "reasons": [
          "Unmanned Aerial Vehicle (UAV) detected",
          "UAS identifier 'RID-492' not found in official DGCA / AeroGuard registry."
        ],
        "score": 70
      },
      "risk_level": "HIGH",
      "risk_reasons": [
        "Unmanned Aerial Vehicle (UAV) detected",
        "UAS identifier 'RID-492' not found in official DGCA / AeroGuard registry."
      ],
      "source": "SIMULATED_REMOTE_ID",
      "speed_mps": 14.8,
      "status": "TRACKING",
      "suggested_action": "VERIFY REGISTRY / IDENTIFY OPERATOR",
      "track_id": "TRK-0010",
      "trajectory": {
        "ai_prediction": {
          "breach_eta_s": null,
          "breach_projected": false,
          "breach_zone": null,
          "climb_rate_mps": 0.0,
          "confidence": 0.96,
          "intent": "EVASIVE_ZIGZAG_MANEUVER",
          "intent_label": "EVASIVE ZIGZAG MANEUVER",
          "model": "AeroGuard-Kinematic-NeuralPredictor-v2.4",
          "projected_max_altitude_m": 121.1,
          "summary": "Erratic banking & yaw wander detected (turn rate 5.2\u00b0/s). AI predicts evasive recon maneuvers.",
          "trajectory_type": "CURVILINEAR_EVASIVE",
          "turn_rate_deg_s": 5.2
        },
        "breach_prediction": null,
        "predicted_points": [
          {
            "altitude_m": 121.1,
            "distance_m": 74.0,
            "dt_seconds": 5,
            "heading_deg": 34.1,
            "latitude": 13.033588,
            "longitude": 80.334137
          },
          {
            "altitude_m": 121.1,
            "distance_m": 148.0,
            "dt_seconds": 10,
            "heading_deg": 56.2,
            "latitude": 13.033959,
            "longitude": 80.334705
          },
          {
            "altitude_m": 121.1,
            "distance_m": 222.0,
            "dt_seconds": 15,
            "heading_deg": 78.3,
            "latitude": 13.034094,
            "longitude": 80.335375
          },
          {
            "altitude_m": 121.1,
            "distance_m": 296.0,
            "dt_seconds": 20,
            "heading_deg": 100.4,
            "latitude": 13.033974,
            "longitude": 80.336048
          },
          {
            "altitude_m": 121.1,
            "distance_m": 370.0,
            "dt_seconds": 25,
            "heading_deg": 122.5,
            "latitude": 13.033616,
            "longitude": 80.336626
          },
          {
            "altitude_m": 121.1,
            "distance_m": 444.0,
            "dt_seconds": 30,
            "heading_deg": 144.6,
            "latitude": 13.033072,
            "longitude": 80.337022
          }
        ]
      },
      "uas_id": "RID-492"
    },
    {
      "alert_classification": "AUTHORIZED",
      "alert_subtype": "COMPLIANT_MISSION",
      "altitude_m": 911.7,
      "associated_camera": null,
      "authorization": {
        "classification": "AUTHORIZED",
        "permitted": false,
        "reason": "Commercial/Civilian aviation corridor (Civil transponder active).",
        "registered": false,
        "status": "NON_APPLICABLE",
        "subtype": "CIVIL_AVIATION",
        "suggested_action": "MONITOR"
      },
      "camera_confidence": 0.0,
      "display_status": "RADAR TRACK ACTIVE (OUT OF OPTICAL RANGE)",
      "fusion_status": "RADAR_ONLY",
      "geofence": {
        "classification": "AUTHORIZED",
        "reason": "Airspace perimeter clear.",
        "severity": "LOW",
        "status": "CLEAR",
        "subtype": "AIRSPACE_CLEAR",
        "suggested_action": "MONITOR"
      },
      "heading_deg": 303.3,
      "history": [
        [
          13.125064,
          80.301002
        ],
        [
          13.125663,
          80.300024
        ],
        [
          13.12621,
          80.299124
        ],
        [
          13.126831,
          80.298139
        ],
        [
          13.12738,
          80.297281
        ]
      ],
      "last_seen": 1789097329.1114721,
      "last_telemetry_timestamp": "2026-09-11T03:28:49.111472+00:00",
      "latitude": 13.12738,
      "longitude": 80.297281,
      "object_type": "AIRCRAFT",
      "radar_confidence": 0.79,
      "risk": {
        "level": "MEDIUM",
        "reasons": [
          "Civilian/Commercial aircraft corridor",
          "High-speed velocity profile (61.5 m/s)"
        ],
        "score": 30
      },
      "risk_level": "MEDIUM",
      "risk_reasons": [
        "Civilian/Commercial aircraft corridor",
        "High-speed velocity profile (61.5 m/s)"
      ],
      "source": "SIMULATED_REMOTE_ID",
      "speed_mps": 61.5,
      "status": "TRACKING",
      "suggested_action": "MONITOR",
      "track_id": "TRK-0011",
      "trajectory": {
        "ai_prediction": {
          "breach_eta_s": null,
          "breach_projected": false,
          "breach_zone": null,
          "climb_rate_mps": 0.0,
          "confidence": 0.96,
          "intent": "RESTRICTED_ALTITUDE_CEILING_BREACH",
          "intent_label": "RESTRICTED ALTITUDE CEILING BREACH",
          "model": "AeroGuard-Kinematic-NeuralPredictor-v2.4",
          "projected_max_altitude_m": 911.7,
          "summary": "Vertical surge profile (+0.0 m/s). AI projects flight envelope ceiling violation exceeding 912m AGL.",
          "trajectory_type": "BALLISTIC_LINEAR",
          "turn_rate_deg_s": 0.0
        },
        "breach_prediction": null,
        "predicted_points": [
          {
            "altitude_m": 911.7,
            "distance_m": 307.5,
            "dt_seconds": 5,
            "heading_deg": 303.3,
            "latitude": 13.128901,
            "longitude": 80.294903
          },
          {
            "altitude_m": 911.7,
            "distance_m": 615.0,
            "dt_seconds": 10,
            "heading_deg": 303.3,
            "latitude": 13.130422,
            "longitude": 80.292526
          },
          {
            "altitude_m": 911.7,
            "distance_m": 922.5,
            "dt_seconds": 15,
            "heading_deg": 303.3,
            "latitude": 13.131943,
            "longitude": 80.290148
          },
          {
            "altitude_m": 911.7,
            "distance_m": 1230.0,
            "dt_seconds": 20,
            "heading_deg": 303.3,
            "latitude": 13.133464,
            "longitude": 80.287771
          },
          {
            "altitude_m": 911.7,
            "distance_m": 1537.5,
            "dt_seconds": 25,
            "heading_deg": 303.3,
            "latitude": 13.134985,
            "longitude": 80.285393
          },
          {
            "altitude_m": 911.7,
            "distance_m": 1845.0,
            "dt_seconds": 30,
            "heading_deg": 303.3,
            "latitude": 13.136506,
            "longitude": 80.283016
          }
        ]
      },
      "uas_id": "RID-112"
    },
    {
      "alert_classification": "AUTHORIZED",
      "alert_subtype": "COMPLIANT_MISSION",
      "altitude_m": 1194.3,
      "associated_camera": null,
      "authorization": {
        "classification": "AUTHORIZED",
        "permitted": false,
        "reason": "Commercial/Civilian aviation corridor (Civil transponder active).",
        "registered": false,
        "status": "NON_APPLICABLE",
        "subtype": "CIVIL_AVIATION",
        "suggested_action": "MONITOR"
      },
      "camera_confidence": 0.0,
      "display_status": "RADAR TRACK ACTIVE (OUT OF OPTICAL RANGE)",
      "fusion_status": "RADAR_ONLY",
      "geofence": {
        "classification": "AUTHORIZED",
        "reason": "Airspace perimeter clear.",
        "severity": "LOW",
        "status": "CLEAR",
        "subtype": "AIRSPACE_CLEAR",
        "suggested_action": "MONITOR"
      },
      "heading_deg": 190.0,
      "history": [
        [
          13.040474,
          80.29391
        ],
        [
          13.03971,
          80.294843
        ],
        [
          13.038615,
          80.29549
        ],
        [
          13.037198,
          80.295748
        ],
        [
          13.03586,
          80.295507
        ]
      ],
      "last_seen": 1789097329.22157,
      "last_telemetry_timestamp": "2026-09-11T03:28:49.221570+00:00",
      "latitude": 13.03586,
      "longitude": 80.295507,
      "object_type": "AIRCRAFT",
      "radar_confidence": 0.9,
      "risk": {
        "level": "MEDIUM",
        "reasons": [
          "Civilian/Commercial aircraft corridor",
          "High-speed velocity profile (73.2 m/s)"
        ],
        "score": 30
      },
      "risk_level": "MEDIUM",
      "risk_reasons": [
        "Civilian/Commercial aircraft corridor",
        "High-speed velocity profile (73.2 m/s)"
      ],
      "source": "SIMULATED_REMOTE_ID",
      "speed_mps": 73.2,
      "status": "TRACKING",
      "suggested_action": "MONITOR",
      "track_id": "TRK-0012",
      "trajectory": {
        "ai_prediction": {
          "breach_eta_s": null,
          "breach_projected": false,
          "breach_zone": null,
          "climb_rate_mps": 0.0,
          "confidence": 0.96,
          "intent": "RESTRICTED_ALTITUDE_CEILING_BREACH",
          "intent_label": "RESTRICTED ALTITUDE CEILING BREACH",
          "model": "AeroGuard-Kinematic-NeuralPredictor-v2.4",
          "projected_max_altitude_m": 1194.3,
          "summary": "Vertical surge profile (+0.0 m/s). AI projects flight envelope ceiling violation exceeding 1194m AGL.",
          "trajectory_type": "BALLISTIC_LINEAR",
          "turn_rate_deg_s": 0.0
        },
        "breach_prediction": null,
        "predicted_points": [
          {
            "altitude_m": 1194.3,
            "distance_m": 366.0,
            "dt_seconds": 5,
            "heading_deg": 190.0,
            "latitude": 13.032613,
            "longitude": 80.294919
          },
          {
            "altitude_m": 1194.3,
            "distance_m": 732.0,
            "dt_seconds": 10,
            "heading_deg": 190.0,
            "latitude": 13.029366,
            "longitude": 80.294332
          },
          {
            "altitude_m": 1194.3,
            "distance_m": 1098.0,
            "dt_seconds": 15,
            "heading_deg": 190.0,
            "latitude": 13.026118,
            "longitude": 80.293744
          },
          {
            "altitude_m": 1194.3,
            "distance_m": 1464.0,
            "dt_seconds": 20,
            "heading_deg": 190.0,
            "latitude": 13.022871,
            "longitude": 80.293156
          },
          {
            "altitude_m": 1194.3,
            "distance_m": 1830.0,
            "dt_seconds": 25,
            "heading_deg": 190.0,
            "latitude": 13.019624,
            "longitude": 80.292568
          },
          {
            "altitude_m": 1194.3,
            "distance_m": 2196.0,
            "dt_seconds": 30,
            "heading_deg": 190.0,
            "latitude": 13.016377,
            "longitude": 80.291981
          }
        ]
      },
      "uas_id": "RID-282"
    },
    {
      "alert_classification": "UNREGISTERED",
      "alert_subtype": "NO_REGISTRY_MATCH",
      "altitude_m": 57.7,
      "associated_camera": null,
      "authorization": {
        "altitude_valid": false,
        "classification": "UNREGISTERED",
        "inside_zone": false,
        "permission_active": false,
        "permitted": false,
        "primary_status": "UNREGISTERED",
        "reason": "UAS identifier 'RID-255' not found in official DGCA / AeroGuard registry.",
        "reason_codes": [
          "NO_REGISTRY_MATCH"
        ],
        "registered": false,
        "status": "UNAUTHORIZED",
        "subtype": "NO_REGISTRY_MATCH",
        "suggested_action": "VERIFY REGISTRY / IDENTIFY OPERATOR",
        "time_valid": false
      },
      "camera_confidence": 0.0,
      "display_status": "RADAR TRACK ACTIVE (OUT OF OPTICAL RANGE)",
      "fusion_status": "RADAR_ONLY",
      "geofence": {
        "classification": "AUTHORIZED",
        "reason": "Airspace perimeter clear.",
        "severity": "LOW",
        "status": "CLEAR",
        "subtype": "AIRSPACE_CLEAR",
        "suggested_action": "MONITOR"
      },
      "heading_deg": 3.2,
      "history": [
        [
          13.0572,
          80.320859
        ],
        [
          13.057296,
          80.320935
        ],
        [
          13.057402,
          80.320987
        ],
        [
          13.057528,
          80.321021
        ],
        [
          13.057648,
          80.321028
        ]
      ],
      "last_seen": 1789097329.3382807,
      "last_telemetry_timestamp": "2026-09-11T03:28:49.338280+00:00",
      "latitude": 13.057648,
      "longitude": 80.321028,
      "object_type": "DRONE",
      "radar_confidence": 0.93,
      "risk": {
        "level": "HIGH",
        "reasons": [
          "Unmanned Aerial Vehicle (UAV) detected",
          "UAS identifier 'RID-255' not found in official DGCA / AeroGuard registry."
        ],
        "score": 70
      },
      "risk_level": "HIGH",
      "risk_reasons": [
        "Unmanned Aerial Vehicle (UAV) detected",
        "UAS identifier 'RID-255' not found in official DGCA / AeroGuard registry."
      ],
      "source": "SIMULATED_REMOTE_ID",
      "speed_mps": 7.2,
      "status": "TRACKING",
      "suggested_action": "VERIFY REGISTRY / IDENTIFY OPERATOR",
      "track_id": "TRK-0013",
      "trajectory": {
        "ai_prediction": {
          "breach_eta_s": null,
          "breach_projected": false,
          "breach_zone": null,
          "climb_rate_mps": 0.0,
          "confidence": 0.96,
          "intent": "EVASIVE_ZIGZAG_MANEUVER",
          "intent_label": "EVASIVE ZIGZAG MANEUVER",
          "model": "AeroGuard-Kinematic-NeuralPredictor-v2.4",
          "projected_max_altitude_m": 57.7,
          "summary": "Erratic banking & yaw wander detected (turn rate 5.2\u00b0/s). AI predicts evasive recon maneuvers.",
          "trajectory_type": "CURVILINEAR_EVASIVE",
          "turn_rate_deg_s": 5.2
        },
        "breach_prediction": null,
        "predicted_points": [
          {
            "altitude_m": 57.7,
            "distance_m": 36.0,
            "dt_seconds": 5,
            "heading_deg": 25.3,
            "latitude": 13.057941,
            "longitude": 80.32117
          },
          {
            "altitude_m": 57.7,
            "distance_m": 72.0,
            "dt_seconds": 10,
            "heading_deg": 47.4,
            "latitude": 13.058161,
            "longitude": 80.321415
          },
          {
            "altitude_m": 57.7,
            "distance_m": 108.0,
            "dt_seconds": 15,
            "heading_deg": 69.5,
            "latitude": 13.058274,
            "longitude": 80.321727
          },
          {
            "altitude_m": 57.7,
            "distance_m": 144.0,
            "dt_seconds": 20,
            "heading_deg": 91.6,
            "latitude": 13.058265,
            "longitude": 80.32206
          },
          {
            "altitude_m": 57.7,
            "distance_m": 180.0,
            "dt_seconds": 25,
            "heading_deg": 113.7,
            "latitude": 13.058135,
            "longitude": 80.322365
          },
          {
            "altitude_m": 57.7,
            "distance_m": 216.0,
            "dt_seconds": 30,
            "heading_deg": 135.8,
            "latitude": 13.057902,
            "longitude": 80.322597
          }
        ]
      },
      "uas_id": "RID-255"
    },
    {
      "alert_classification": "UNREGISTERED",
      "alert_subtype": "NO_REGISTRY_MATCH",
      "altitude_m": 146.2,
      "associated_camera": null,
      "authorization": {
        "altitude_valid": false,
        "classification": "UNREGISTERED",
        "inside_zone": false,
        "permission_active": false,
        "permitted": false,
        "primary_status": "UNREGISTERED",
        "reason": "UAS identifier 'RID-941' not found in official DGCA / AeroGuard registry.",
        "reason_codes": [
          "NO_REGISTRY_MATCH"
        ],
        "registered": false,
        "status": "UNAUTHORIZED",
        "subtype": "NO_REGISTRY_MATCH",
        "suggested_action": "VERIFY REGISTRY / IDENTIFY OPERATOR",
        "time_valid": false
      },
      "camera_confidence": 0.0,
      "display_status": "RADAR TRACK ACTIVE (OUT OF OPTICAL RANGE)",
      "fusion_status": "RADAR_ONLY",
      "geofence": {
        "classification": "AUTHORIZED",
        "reason": "Airspace perimeter clear.",
        "severity": "LOW",
        "status": "CLEAR",
        "subtype": "AIRSPACE_CLEAR",
        "suggested_action": "MONITOR"
      },
      "heading_deg": 222.6,
      "history": [
        [
          13.0492,
          80.254387
        ],
        [
          13.049073,
          80.254396
        ],
        [
          13.048951,
          80.254371
        ],
        [
          13.048852,
          80.254318
        ],
        [
          13.048765,
          80.254236
        ]
      ],
      "last_seen": 1789097329.4791424,
      "last_telemetry_timestamp": "2026-09-11T03:28:49.479142+00:00",
      "latitude": 13.048765,
      "longitude": 80.254236,
      "object_type": "DRONE",
      "radar_confidence": 0.97,
      "risk": {
        "level": "HIGH",
        "reasons": [
          "Unmanned Aerial Vehicle (UAV) detected",
          "UAS identifier 'RID-941' not found in official DGCA / AeroGuard registry."
        ],
        "score": 70
      },
      "risk_level": "HIGH",
      "risk_reasons": [
        "Unmanned Aerial Vehicle (UAV) detected",
        "UAS identifier 'RID-941' not found in official DGCA / AeroGuard registry."
      ],
      "source": "SIMULATED_REMOTE_ID",
      "speed_mps": 6.6,
      "status": "TRACKING",
      "suggested_action": "VERIFY REGISTRY / IDENTIFY OPERATOR",
      "track_id": "TRK-0014",
      "trajectory": {
        "ai_prediction": {
          "breach_eta_s": null,
          "breach_projected": false,
          "breach_zone": null,
          "climb_rate_mps": 0.0,
          "confidence": 0.96,
          "intent": "EVASIVE_ZIGZAG_MANEUVER",
          "intent_label": "EVASIVE ZIGZAG MANEUVER",
          "model": "AeroGuard-Kinematic-NeuralPredictor-v2.4",
          "projected_max_altitude_m": 146.2,
          "summary": "Erratic banking & yaw wander detected (turn rate 4.5\u00b0/s). AI predicts evasive recon maneuvers.",
          "trajectory_type": "CURVILINEAR_EVASIVE",
          "turn_rate_deg_s": -4.5
        },
        "breach_prediction": null,
        "predicted_points": [
          {
            "altitude_m": 146.2,
            "distance_m": 33.0,
            "dt_seconds": 5,
            "heading_deg": 203.5,
            "latitude": 13.048492,
            "longitude": 80.254114
          },
          {
            "altitude_m": 146.2,
            "distance_m": 66.0,
            "dt_seconds": 10,
            "heading_deg": 184.3,
            "latitude": 13.048196,
            "longitude": 80.254091
          },
          {
            "altitude_m": 146.2,
            "distance_m": 99.0,
            "dt_seconds": 15,
            "heading_deg": 165.2,
            "latitude": 13.047908,
            "longitude": 80.254169
          },
          {
            "altitude_m": 146.2,
            "distance_m": 132.0,
            "dt_seconds": 20,
            "heading_deg": 146.1,
            "latitude": 13.047662,
            "longitude": 80.254339
          },
          {
            "altitude_m": 146.2,
            "distance_m": 165.0,
            "dt_seconds": 25,
            "heading_deg": 127.0,
            "latitude": 13.047483,
            "longitude": 80.254583
          },
          {
            "altitude_m": 146.2,
            "distance_m": 198.0,
            "dt_seconds": 30,
            "heading_deg": 107.8,
            "latitude": 13.047392,
            "longitude": 80.254874
          }
        ]
      },
      "uas_id": "RID-941"
    },
    {
      "alert_classification": "UNREGISTERED",
      "alert_subtype": "NO_REGISTRY_MATCH",
      "altitude_m": 90.2,
      "associated_camera": null,
      "authorization": {
        "altitude_valid": false,
        "classification": "UNREGISTERED",
        "inside_zone": false,
        "permission_active": false,
        "permitted": false,
        "primary_status": "UNREGISTERED",
        "reason": "UAS identifier 'RID-377' not found in official DGCA / AeroGuard registry.",
        "reason_codes": [
          "NO_REGISTRY_MATCH"
        ],
        "registered": false,
        "status": "UNAUTHORIZED",
        "subtype": "NO_REGISTRY_MATCH",
        "suggested_action": "VERIFY REGISTRY / IDENTIFY OPERATOR",
        "time_valid": false
      },
      "camera_confidence": 0.0,
      "display_status": "RADAR TRACK ACTIVE (OUT OF OPTICAL RANGE)",
      "fusion_status": "RADAR_ONLY",
      "geofence": {
        "classification": "AUTHORIZED",
        "reason": "Airspace perimeter clear.",
        "severity": "LOW",
        "status": "CLEAR",
        "subtype": "AIRSPACE_CLEAR",
        "suggested_action": "MONITOR"
      },
      "heading_deg": 144.8,
      "history": [
        [
          13.038405,
          80.325279
        ],
        [
          13.038245,
          80.325263
        ],
        [
          13.038107,
          80.325287
        ],
        [
          13.037978,
          80.325341
        ],
        [
          13.037864,
          80.325424
        ]
      ],
      "last_seen": 1789097329.5926366,
      "last_telemetry_timestamp": "2026-09-11T03:28:49.592636+00:00",
      "latitude": 13.037864,
      "longitude": 80.325424,
      "object_type": "DRONE",
      "radar_confidence": 0.96,
      "risk": {
        "level": "HIGH",
        "reasons": [
          "Unmanned Aerial Vehicle (UAV) detected",
          "UAS identifier 'RID-377' not found in official DGCA / AeroGuard registry."
        ],
        "score": 70
      },
      "risk_level": "HIGH",
      "risk_reasons": [
        "Unmanned Aerial Vehicle (UAV) detected",
        "UAS identifier 'RID-377' not found in official DGCA / AeroGuard registry."
      ],
      "source": "SIMULATED_REMOTE_ID",
      "speed_mps": 8.5,
      "status": "TRACKING",
      "suggested_action": "VERIFY REGISTRY / IDENTIFY OPERATOR",
      "track_id": "TRK-0015",
      "trajectory": {
        "ai_prediction": {
          "breach_eta_s": null,
          "breach_projected": false,
          "breach_zone": null,
          "climb_rate_mps": 0.0,
          "confidence": 0.96,
          "intent": "EVASIVE_ZIGZAG_MANEUVER",
          "intent_label": "EVASIVE ZIGZAG MANEUVER",
          "model": "AeroGuard-Kinematic-NeuralPredictor-v2.4",
          "projected_max_altitude_m": 90.2,
          "summary": "Erratic banking & yaw wander detected (turn rate 5.2\u00b0/s). AI predicts evasive recon maneuvers.",
          "trajectory_type": "CURVILINEAR_EVASIVE",
          "turn_rate_deg_s": 5.2
        },
        "breach_prediction": null,
        "predicted_points": [
          {
            "altitude_m": 90.2,
            "distance_m": 42.5,
            "dt_seconds": 5,
            "heading_deg": 166.9,
            "latitude": 13.037491,
            "longitude": 80.325513
          },
          {
            "altitude_m": 90.2,
            "distance_m": 85.0,
            "dt_seconds": 10,
            "heading_deg": 189.0,
            "latitude": 13.037113,
            "longitude": 80.325452
          },
          {
            "altitude_m": 90.2,
            "distance_m": 127.5,
            "dt_seconds": 15,
            "heading_deg": 211.1,
            "latitude": 13.036785,
            "longitude": 80.325249
          },
          {
            "altitude_m": 90.2,
            "distance_m": 170.0,
            "dt_seconds": 20,
            "heading_deg": 233.2,
            "latitude": 13.036556,
            "longitude": 80.324934
          },
          {
            "altitude_m": 90.2,
            "distance_m": 212.5,
            "dt_seconds": 25,
            "heading_deg": 255.3,
            "latitude": 13.036459,
            "longitude": 80.324554
          },
          {
            "altitude_m": 90.2,
            "distance_m": 255.0,
            "dt_seconds": 30,
            "heading_deg": 277.4,
            "latitude": 13.036508,
            "longitude": 80.324164
          }
        ]
      },
      "uas_id": "RID-377"
    },
    {
      "alert_classification": "UNREGISTERED",
      "alert_subtype": "NO_REGISTRY_MATCH",
      "altitude_m": 152.5,
      "associated_camera": null,
      "authorization": {
        "altitude_valid": false,
        "classification": "UNREGISTERED",
        "inside_zone": false,
        "permission_active": false,
        "permitted": false,
        "primary_status": "UNREGISTERED",
        "reason": "UAS identifier 'UNKNOWN' not found in official DGCA / AeroGuard registry.",
        "reason_codes": [
          "NO_REGISTRY_MATCH"
        ],
        "registered": false,
        "status": "UNAUTHORIZED",
        "subtype": "NO_REGISTRY_MATCH",
        "suggested_action": "VERIFY REGISTRY / IDENTIFY OPERATOR",
        "time_valid": false
      },
      "camera_confidence": 0.0,
      "display_status": "RADAR TRACK ACTIVE (OUT OF OPTICAL RANGE)",
      "fusion_status": "RADAR_ONLY",
      "geofence": {
        "classification": "AUTHORIZED",
        "reason": "Airspace perimeter clear.",
        "severity": "LOW",
        "status": "CLEAR",
        "subtype": "AIRSPACE_CLEAR",
        "suggested_action": "MONITOR"
      },
      "heading_deg": 44.5,
      "history": [
        [
          13.061064,
          80.253942
        ],
        [
          13.061287,
          80.253957
        ],
        [
          13.061487,
          80.254027
        ],
        [
          13.061674,
          80.25415
        ],
        [
          13.061823,
          80.2543
        ]
      ],
      "last_seen": 1789097329.65561,
      "last_telemetry_timestamp": "2026-09-11T03:28:49.655610+00:00",
      "latitude": 13.061823,
      "longitude": 80.2543,
      "object_type": "DRONE",
      "radar_confidence": 0.98,
      "risk": {
        "level": "HIGH",
        "reasons": [
          "Unmanned Aerial Vehicle (UAV) detected",
          "UAS identifier 'UNKNOWN' not found in official DGCA / AeroGuard registry."
        ],
        "score": 70
      },
      "risk_level": "HIGH",
      "risk_reasons": [
        "Unmanned Aerial Vehicle (UAV) detected",
        "UAS identifier 'UNKNOWN' not found in official DGCA / AeroGuard registry."
      ],
      "source": "SIMULATED_REMOTE_ID",
      "speed_mps": 12.1,
      "status": "TRACKING",
      "suggested_action": "VERIFY REGISTRY / IDENTIFY OPERATOR",
      "track_id": "TRK-0016",
      "trajectory": {
        "ai_prediction": {
          "breach_eta_s": null,
          "breach_projected": false,
          "breach_zone": null,
          "climb_rate_mps": 0.0,
          "confidence": 0.96,
          "intent": "EVASIVE_ZIGZAG_MANEUVER",
          "intent_label": "EVASIVE ZIGZAG MANEUVER",
          "model": "AeroGuard-Kinematic-NeuralPredictor-v2.4",
          "projected_max_altitude_m": 152.5,
          "summary": "Erratic banking & yaw wander detected (turn rate 5.2\u00b0/s). AI predicts evasive recon maneuvers.",
          "trajectory_type": "CURVILINEAR_EVASIVE",
          "turn_rate_deg_s": 5.2
        },
        "breach_prediction": null,
        "predicted_points": [
          {
            "altitude_m": 152.5,
            "distance_m": 60.5,
            "dt_seconds": 5,
            "heading_deg": 66.6,
            "latitude": 13.062039,
            "longitude": 80.254814
          },
          {
            "altitude_m": 152.5,
            "distance_m": 121.0,
            "dt_seconds": 10,
            "heading_deg": 88.7,
            "latitude": 13.062052,
            "longitude": 80.255373
          },
          {
            "altitude_m": 152.5,
            "distance_m": 181.5,
            "dt_seconds": 15,
            "heading_deg": 110.8,
            "latitude": 13.061858,
            "longitude": 80.255896
          },
          {
            "altitude_m": 152.5,
            "distance_m": 242.0,
            "dt_seconds": 20,
            "heading_deg": 132.9,
            "latitude": 13.061487,
            "longitude": 80.256306
          },
          {
            "altitude_m": 152.5,
            "distance_m": 302.5,
            "dt_seconds": 25,
            "heading_deg": 155.0,
            "latitude": 13.060993,
            "longitude": 80.256542
          },
          {
            "altitude_m": 152.5,
            "distance_m": 363.0,
            "dt_seconds": 30,
            "heading_deg": 177.1,
            "latitude": 13.060449,
            "longitude": 80.256571
          }
        ]
      },
      "uas_id": "UNKNOWN"
    }
  ],
  "alerts": [
    {
      "alert_id": "ALT-LOST-TRK-0004",
      "alert_type": "LOST_LINK",
      "created_at": "2026-09-11 03:20:50",
      "disposition": null,
      "disposition_at": null,
      "disposition_by": null,
      "disposition_notes": null,
      "disposition_reason": null,
      "latitude": 13.106094,
      "longitude": 80.314894,
      "reason": "Track TRK-0004 (RID-293) lost heartbeat signal. Last seen 5.1s ago.",
      "recommended_action": "VERIFY SENSOR / SECONDARY OBSERVATION",
      "severity": "HIGH",
      "status": "ACTIVE",
      "subtype": "TELEMETRY_TIMEOUT",
      "suggested_action": "VERIFY SENSOR / SECONDARY OBSERVATION",
      "title": "LOST LINK: Telemetry Timeout",
      "track_id": "TRK-0004"
    },
    {
      "alert_id": "ALT-LOST-TRK-0006",
      "alert_type": "LOST_LINK",
      "created_at": "2026-09-11 03:20:50",
      "disposition": null,
      "disposition_at": null,
      "disposition_by": null,
      "disposition_notes": null,
      "disposition_reason": null,
      "latitude": 13.09343,
      "longitude": 80.308457,
      "reason": "Track TRK-0006 (UNKNOWN) lost heartbeat signal. Last seen 5.2s ago.",
      "recommended_action": "VERIFY SENSOR / SECONDARY OBSERVATION",
      "severity": "HIGH",
      "status": "ACTIVE",
      "subtype": "TELEMETRY_TIMEOUT",
      "suggested_action": "VERIFY SENSOR / SECONDARY OBSERVATION",
      "title": "LOST LINK: Telemetry Timeout",
      "track_id": "TRK-0006"
    },
    {
      "alert_id": "ALT-LOST-TRK-0002",
      "alert_type": "LOST_LINK",
      "created_at": "2026-09-11 03:20:49",
      "disposition": null,
      "disposition_at": null,
      "disposition_by": null,
      "disposition_notes": null,
      "disposition_reason": null,
      "latitude": 13.061854,
      "longitude": 80.294945,
      "reason": "Track TRK-0002 (RID-327) lost heartbeat signal. Last seen 5.0s ago.",
      "recommended_action": "VERIFY SENSOR / SECONDARY OBSERVATION",
      "severity": "HIGH",
      "status": "ACTIVE",
      "subtype": "TELEMETRY_TIMEOUT",
      "suggested_action": "VERIFY SENSOR / SECONDARY OBSERVATION",
      "title": "LOST LINK: Telemetry Timeout",
      "track_id": "TRK-0002"
    },
    {
      "alert_id": "ALT-LOST-TRK-0008",
      "alert_type": "LOST_LINK",
      "created_at": "2026-09-11 03:17:29",
      "disposition": null,
      "disposition_at": null,
      "disposition_by": null,
      "disposition_notes": null,
      "disposition_reason": null,
      "latitude": 13.045217,
      "longitude": 80.285412,
      "reason": "Track TRK-0008 (UNKNOWN) lost heartbeat signal. Last seen 5.1s ago.",
      "recommended_action": "VERIFY SENSOR / SECONDARY OBSERVATION",
      "severity": "HIGH",
      "status": "ACTIVE",
      "subtype": "TELEMETRY_TIMEOUT",
      "suggested_action": "VERIFY SENSOR / SECONDARY OBSERVATION",
      "title": "LOST LINK: Telemetry Timeout",
      "track_id": "TRK-0008"
    },
    {
      "alert_id": "ALT-LOST-TRK-0003",
      "alert_type": "LOST_LINK",
      "created_at": "2026-09-11 03:17:28",
      "disposition": null,
      "disposition_at": null,
      "disposition_by": null,
      "disposition_notes": null,
      "disposition_reason": null,
      "latitude": 13.077446,
      "longitude": 80.304368,
      "reason": "Track TRK-0003 (UNKNOWN) lost heartbeat signal. Last seen 5.3s ago.",
      "recommended_action": "VERIFY SENSOR / SECONDARY OBSERVATION",
      "severity": "HIGH",
      "status": "ACTIVE",
      "subtype": "TELEMETRY_TIMEOUT",
      "suggested_action": "VERIFY SENSOR / SECONDARY OBSERVATION",
      "title": "LOST LINK: Telemetry Timeout",
      "track_id": "TRK-0003"
    },
    {
      "alert_id": "ALT-LOST-TRK-0001",
      "alert_type": "LOST_LINK",
      "created_at": "2026-09-11 03:17:27",
      "disposition": "RECOVERED",
      "disposition_at": null,
      "disposition_by": null,
      "disposition_notes": "Telemetry link restored",
      "disposition_reason": null,
      "latitude": 13.07238,
      "longitude": 80.298677,
      "reason": "Track TRK-0001 (RID-670) lost heartbeat signal. Last seen 5.1s ago.",
      "recommended_action": "VERIFY SENSOR / SECONDARY OBSERVATION",
      "severity": "HIGH",
      "status": "RESOLVED",
      "subtype": "TELEMETRY_TIMEOUT",
      "suggested_action": "VERIFY SENSOR / SECONDARY OBSERVATION",
      "title": "LOST LINK: Telemetry Timeout",
      "track_id": "TRK-0001"
    },
    {
      "alert_id": "ALT-LOST-TRK-0014",
      "alert_type": "LOST_LINK",
      "created_at": "2026-09-11 03:15:39",
      "disposition": null,
      "disposition_at": null,
      "disposition_by": null,
      "disposition_notes": null,
      "disposition_reason": null,
      "latitude": 13.049878,
      "longitude": 80.254554,
      "reason": "Track TRK-0014 (RID-941) lost heartbeat signal. Last seen 5.3s ago.",
      "recommended_action": "VERIFY SENSOR / SECONDARY OBSERVATION",
      "severity": "HIGH",
      "status": "ACTIVE",
      "subtype": "TELEMETRY_TIMEOUT",
      "suggested_action": "VERIFY SENSOR / SECONDARY OBSERVATION",
      "title": "LOST LINK: Telemetry Timeout",
      "track_id": "TRK-0014"
    },
    {
      "alert_id": "ALT-LOST-TRK-0010",
      "alert_type": "LOST_LINK",
      "created_at": "2026-09-11 03:15:38",
      "disposition": "RECOVERED",
      "disposition_at": null,
      "disposition_by": null,
      "disposition_notes": "Telemetry link restored",
      "disposition_reason": null,
      "latitude": 13.029295,
      "longitude": 80.319367,
      "reason": "Track TRK-0010 (RID-492) lost heartbeat signal. Last seen 5.5s ago.",
      "recommended_action": "VERIFY SENSOR / SECONDARY OBSERVATION",
      "severity": "HIGH",
      "status": "RESOLVED",
      "subtype": "TELEMETRY_TIMEOUT",
      "suggested_action": "VERIFY SENSOR / SECONDARY OBSERVATION",
      "title": "LOST LINK: Telemetry Timeout",
      "track_id": "TRK-0010"
    },
    {
      "alert_id": "ALT-LOST-TRK-0011",
      "alert_type": "LOST_LINK",
      "created_at": "2026-09-11 03:15:38",
      "disposition": "RECOVERED",
      "disposition_at": null,
      "disposition_by": null,
      "disposition_notes": "Telemetry link restored",
      "disposition_reason": null,
      "latitude": 13.106062,
      "longitude": 80.318818,
      "reason": "Track TRK-0011 (RID-112) lost heartbeat signal. Last seen 5.2s ago.",
      "recommended_action": "VERIFY SENSOR / SECONDARY OBSERVATION",
      "severity": "HIGH",
      "status": "RESOLVED",
      "subtype": "TELEMETRY_TIMEOUT",
      "suggested_action": "VERIFY SENSOR / SECONDARY OBSERVATION",
      "title": "LOST LINK: Telemetry Timeout",
      "track_id": "TRK-0011"
    },
    {
      "alert_id": "ALT-LOST-TRK-0012",
      "alert_type": "LOST_LINK",
      "created_at": "2026-09-11 03:15:38",
      "disposition": null,
      "disposition_at": null,
      "disposition_by": null,
      "disposition_notes": null,
      "disposition_reason": null,
      "latitude": 13.057203,
      "longitude": 80.322467,
      "reason": "Track TRK-0012 (RID-282) lost heartbeat signal. Last seen 5.4s ago.",
      "recommended_action": "VERIFY SENSOR / SECONDARY OBSERVATION",
      "severity": "HIGH",
      "status": "ACTIVE",
      "subtype": "TELEMETRY_TIMEOUT",
      "suggested_action": "VERIFY SENSOR / SECONDARY OBSERVATION",
      "title": "LOST LINK: Telemetry Timeout",
      "track_id": "TRK-0012"
    },
    {
      "alert_id": "ALT-LOST-TRK-0013",
      "alert_type": "LOST_LINK",
      "created_at": "2026-09-11 03:15:38",
      "disposition": "RECOVERED",
      "disposition_at": null,
      "disposition_by": null,
      "disposition_notes": "Telemetry link restored",
      "disposition_reason": null,
      "latitude": 13.059744,
      "longitude": 80.324496,
      "reason": "Track TRK-0013 (RID-255) lost heartbeat signal. Last seen 5.0s ago.",
      "recommended_action": "VERIFY SENSOR / SECONDARY OBSERVATION",
      "severity": "HIGH",
      "status": "RESOLVED",
      "subtype": "TELEMETRY_TIMEOUT",
      "suggested_action": "VERIFY SENSOR / SECONDARY OBSERVATION",
      "title": "LOST LINK: Telemetry Timeout",
      "track_id": "TRK-0013"
    },
    {
      "alert_id": "ALT-LOST-TRK-0009",
      "alert_type": "LOST_LINK",
      "created_at": "2026-09-11 03:15:37",
      "disposition": "RECOVERED",
      "disposition_at": null,
      "disposition_by": null,
      "disposition_notes": "Telemetry link restored",
      "disposition_reason": null,
      "latitude": 13.034491,
      "longitude": 80.304927,
      "reason": "Track TRK-0009 (RID-606) lost heartbeat signal. Last seen 5.3s ago.",
      "recommended_action": "VERIFY SENSOR / SECONDARY OBSERVATION",
      "severity": "HIGH",
      "status": "RESOLVED",
      "subtype": "TELEMETRY_TIMEOUT",
      "suggested_action": "VERIFY SENSOR / SECONDARY OBSERVATION",
      "title": "LOST LINK: Telemetry Timeout",
      "track_id": "TRK-0009"
    },
    {
      "alert_id": "ALT-LOST-TRK-0005",
      "alert_type": "LOST_LINK",
      "created_at": "2026-09-11 03:15:36",
      "disposition": "RECOVERED",
      "disposition_at": null,
      "disposition_by": null,
      "disposition_notes": "Telemetry link restored",
      "disposition_reason": null,
      "latitude": 13.101593,
      "longitude": 80.308275,
      "reason": "Track TRK-0005 (RID-359) lost heartbeat signal. Last seen 5.3s ago.",
      "recommended_action": "VERIFY SENSOR / SECONDARY OBSERVATION",
      "severity": "HIGH",
      "status": "RESOLVED",
      "subtype": "TELEMETRY_TIMEOUT",
      "suggested_action": "VERIFY SENSOR / SECONDARY OBSERVATION",
      "title": "LOST LINK: Telemetry Timeout",
      "track_id": "TRK-0005"
    },
    {
      "alert_id": "ALT-LOST-TRK-0007",
      "alert_type": "LOST_LINK",
      "created_at": "2026-09-11 03:15:36",
      "disposition": "RECOVERED",
      "disposition_at": null,
      "disposition_by": null,
      "disposition_notes": "Telemetry link restored",
      "disposition_reason": null,
      "latitude": 13.051778,
      "longitude": 80.284074,
      "reason": "Track TRK-0007 (RID-570) lost heartbeat signal. Last seen 5.2s ago.",
      "recommended_action": "VERIFY SENSOR / SECONDARY OBSERVATION",
      "severity": "HIGH",
      "status": "RESOLVED",
      "subtype": "TELEMETRY_TIMEOUT",
      "suggested_action": "VERIFY SENSOR / SECONDARY OBSERVATION",
      "title": "LOST LINK: Telemetry Timeout",
      "track_id": "TRK-0007"
    },
    {
      "alert_id": "ALT-LOST-TRK-0015",
      "alert_type": "LOST_LINK",
      "created_at": "2026-09-11 03:15:33",
      "disposition": "RECOVERED",
      "disposition_at": null,
      "disposition_by": null,
      "disposition_notes": "Telemetry link restored",
      "disposition_reason": null,
      "latitude": 13.04256,
      "longitude": 80.321234,
      "reason": "Track TRK-0015 (RID-377) lost heartbeat signal. Last seen 5.5s ago.",
      "recommended_action": "VERIFY SENSOR / SECONDARY OBSERVATION",
      "severity": "HIGH",
      "status": "RESOLVED",
      "subtype": "TELEMETRY_TIMEOUT",
      "suggested_action": "VERIFY SENSOR / SECONDARY OBSERVATION",
      "title": "LOST LINK: Telemetry Timeout",
      "track_id": "TRK-0015"
    },
    {
      "alert_id": "ALT-LOST-TRK-0016",
      "alert_type": "LOST_LINK",
      "created_at": "2026-09-11 03:15:33",
      "disposition": "RECOVERED",
      "disposition_at": null,
      "disposition_by": null,
      "disposition_notes": "Telemetry link restored",
      "disposition_reason": null,
      "latitude": 13.061908,
      "longitude": 80.255484,
      "reason": "Track TRK-0016 (UNKNOWN) lost heartbeat signal. Last seen 5.0s ago.",
      "recommended_action": "VERIFY SENSOR / SECONDARY OBSERVATION",
      "severity": "HIGH",
      "status": "RESOLVED",
      "subtype": "TELEMETRY_TIMEOUT",
      "suggested_action": "VERIFY SENSOR / SECONDARY OBSERVATION",
      "title": "LOST LINK: Telemetry Timeout",
      "track_id": "TRK-0016"
    },
    {
      "alert_id": "ALT-LOST-TRACK-0001",
      "alert_type": "LOST_LINK",
      "created_at": "2026-09-11 03:15:33",
      "disposition": "RECOVERED",
      "disposition_at": null,
      "disposition_by": null,
      "disposition_notes": "Telemetry link restored",
      "disposition_reason": null,
      "latitude": 13.076868,
      "longitude": 80.303529,
      "reason": "Track TRACK-0001 (UNKNOWN-UAS-001) lost heartbeat signal. Last seen 5.4s ago.",
      "recommended_action": "VERIFY SENSOR / SECONDARY OBSERVATION",
      "severity": "HIGH",
      "status": "RESOLVED",
      "subtype": "TELEMETRY_TIMEOUT",
      "suggested_action": "VERIFY SENSOR / SECONDARY OBSERVATION",
      "title": "LOST LINK: Telemetry Timeout",
      "track_id": "TRACK-0001"
    },
    {
      "alert_id": "ALT-TRK-0012-HORIZONTAL_GEOFENCE",
      "alert_type": "OUT_OF_ENVELOPE",
      "created_at": "2026-09-11 03:14:50",
      "disposition": null,
      "disposition_at": null,
      "disposition_by": null,
      "disposition_notes": null,
      "disposition_reason": null,
      "latitude": 13.027951,
      "longitude": 80.291823,
      "reason": "Approaching Marina Beach Public Coastal Strip (413m away).",
      "recommended_action": "VERIFY VIOLATION / NOTIFY DUTY OFFICER",
      "severity": "MEDIUM",
      "status": "ACTIVE",
      "subtype": "HORIZONTAL_GEOFENCE",
      "suggested_action": "VERIFY VIOLATION / NOTIFY DUTY OFFICER",
      "title": "OUT_OF_ENVELOPE: HORIZONTAL_GEOFENCE",
      "track_id": "TRK-0012"
    },
    {
      "alert_id": "ALT-TRK-0011-HORIZONTAL_GEOFENCE",
      "alert_type": "OUT_OF_ENVELOPE",
      "created_at": "2026-09-11 03:13:14",
      "disposition": null,
      "disposition_at": null,
      "disposition_by": null,
      "disposition_notes": null,
      "disposition_reason": null,
      "latitude": 13.111606,
      "longitude": 80.321417,
      "reason": "Approaching Chennai Port Commercial Shipping Anchorage (427m away).",
      "recommended_action": "VERIFY VIOLATION / NOTIFY DUTY OFFICER",
      "severity": "MEDIUM",
      "status": "ACTIVE",
      "subtype": "HORIZONTAL_GEOFENCE",
      "suggested_action": "VERIFY VIOLATION / NOTIFY DUTY OFFICER",
      "title": "OUT_OF_ENVELOPE: HORIZONTAL_GEOFENCE",
      "track_id": "TRK-0011"
    },
    {
      "alert_id": "ALT-TRACK-0001-NO_REGISTRY_MATCH",
      "alert_type": "UNREGISTERED",
      "created_at": "2026-09-11 03:11:04",
      "disposition": null,
      "disposition_at": null,
      "disposition_by": null,
      "disposition_notes": null,
      "disposition_reason": null,
      "latitude": 13.137796,
      "longitude": 80.352404,
      "reason": "Airspace perimeter clear.",
      "recommended_action": "VERIFY REGISTRY / IDENTIFY OPERATOR",
      "severity": "HIGH",
      "status": "ACTIVE",
      "subtype": "NO_REGISTRY_MATCH",
      "suggested_action": "VERIFY REGISTRY / IDENTIFY OPERATOR",
      "title": "UNREGISTERED: NO_REGISTRY_MATCH",
      "track_id": "TRACK-0001"
    },
    {
      "alert_id": "ALT-LOST-DRN-001",
      "alert_type": "LOST_LINK",
      "created_at": "2026-09-11 03:10:59",
      "disposition": "RECOVERED",
      "disposition_at": null,
      "disposition_by": null,
      "disposition_notes": "Telemetry link restored",
      "disposition_reason": null,
      "latitude": 13.098684,
      "longitude": 80.307648,
      "reason": "Track DRN-001 (UIN-2026-IND-0101) lost heartbeat signal. Last seen 5.3s ago.",
      "recommended_action": "VERIFY SENSOR / SECONDARY OBSERVATION",
      "severity": "HIGH",
      "status": "RESOLVED",
      "subtype": "TELEMETRY_TIMEOUT",
      "suggested_action": "VERIFY SENSOR / SECONDARY OBSERVATION",
      "title": "LOST LINK: Telemetry Timeout",
      "track_id": "DRN-001"
    },
    {
      "alert_id": "ALT-TRK-0009-NO_REGISTRY_MATCH",
      "alert_type": "UNREGISTERED",
      "created_at": "2026-09-11 03:08:08",
      "disposition": null,
      "disposition_at": null,
      "disposition_by": null,
      "disposition_notes": null,
      "disposition_reason": null,
      "latitude": 13.026207,
      "longitude": 80.270397,
      "reason": "Airspace perimeter clear.",
      "recommended_action": "VERIFY REGISTRY / IDENTIFY OPERATOR",
      "severity": "HIGH",
      "status": "ACTIVE",
      "subtype": "NO_REGISTRY_MATCH",
      "suggested_action": "VERIFY REGISTRY / IDENTIFY OPERATOR",
      "title": "UNREGISTERED: NO_REGISTRY_MATCH",
      "track_id": "TRK-0009"
    },
    {
      "alert_id": "ALT-TRK-0010-NO_REGISTRY_MATCH",
      "alert_type": "UNREGISTERED",
      "created_at": "2026-09-11 03:08:08",
      "disposition": null,
      "disposition_at": null,
      "disposition_by": null,
      "disposition_notes": null,
      "disposition_reason": null,
      "latitude": 13.033036,
      "longitude": 80.333753,
      "reason": "Airspace perimeter clear.",
      "recommended_action": "VERIFY REGISTRY / IDENTIFY OPERATOR",
      "severity": "HIGH",
      "status": "ACTIVE",
      "subtype": "NO_REGISTRY_MATCH",
      "suggested_action": "VERIFY REGISTRY / IDENTIFY OPERATOR",
      "title": "UNREGISTERED: NO_REGISTRY_MATCH",
      "track_id": "TRK-0010"
    },
    {
      "alert_id": "ALT-TRK-0013-NO_REGISTRY_MATCH",
      "alert_type": "UNREGISTERED",
      "created_at": "2026-09-11 03:08:08",
      "disposition": null,
      "disposition_at": null,
      "disposition_by": null,
      "disposition_notes": null,
      "disposition_reason": null,
      "latitude": 13.057648,
      "longitude": 80.321028,
      "reason": "Airspace perimeter clear.",
      "recommended_action": "VERIFY REGISTRY / IDENTIFY OPERATOR",
      "severity": "HIGH",
      "status": "ACTIVE",
      "subtype": "NO_REGISTRY_MATCH",
      "suggested_action": "VERIFY REGISTRY / IDENTIFY OPERATOR",
      "title": "UNREGISTERED: NO_REGISTRY_MATCH",
      "track_id": "TRK-0013"
    },
    {
      "alert_id": "ALT-TRK-0014-NO_REGISTRY_MATCH",
      "alert_type": "UNREGISTERED",
      "created_at": "2026-09-11 03:08:08",
      "disposition": null,
      "disposition_at": null,
      "disposition_by": null,
      "disposition_notes": null,
      "disposition_reason": null,
      "latitude": 13.048765,
      "longitude": 80.254236,
      "reason": "Airspace perimeter clear.",
      "recommended_action": "VERIFY REGISTRY / IDENTIFY OPERATOR",
      "severity": "HIGH",
      "status": "ACTIVE",
      "subtype": "NO_REGISTRY_MATCH",
      "suggested_action": "VERIFY REGISTRY / IDENTIFY OPERATOR",
      "title": "UNREGISTERED: NO_REGISTRY_MATCH",
      "track_id": "TRK-0014"
    },
    {
      "alert_id": "ALT-TRK-0015-NO_REGISTRY_MATCH",
      "alert_type": "UNREGISTERED",
      "created_at": "2026-09-11 03:08:08",
      "disposition": null,
      "disposition_at": null,
      "disposition_by": null,
      "disposition_notes": null,
      "disposition_reason": null,
      "latitude": 13.037864,
      "longitude": 80.325424,
      "reason": "Airspace perimeter clear.",
      "recommended_action": "VERIFY REGISTRY / IDENTIFY OPERATOR",
      "severity": "HIGH",
      "status": "ACTIVE",
      "subtype": "NO_REGISTRY_MATCH",
      "suggested_action": "VERIFY REGISTRY / IDENTIFY OPERATOR",
      "title": "UNREGISTERED: NO_REGISTRY_MATCH",
      "track_id": "TRK-0015"
    },
    {
      "alert_id": "ALT-TRK-0016-NO_REGISTRY_MATCH",
      "alert_type": "UNREGISTERED",
      "created_at": "2026-09-11 03:08:08",
      "disposition": null,
      "disposition_at": null,
      "disposition_by": null,
      "disposition_notes": null,
      "disposition_reason": null,
      "latitude": 13.061823,
      "longitude": 80.2543,
      "reason": "Airspace perimeter clear.",
      "recommended_action": "VERIFY REGISTRY / IDENTIFY OPERATOR",
      "severity": "HIGH",
      "status": "ACTIVE",
      "subtype": "NO_REGISTRY_MATCH",
      "suggested_action": "VERIFY REGISTRY / IDENTIFY OPERATOR",
      "title": "UNREGISTERED: NO_REGISTRY_MATCH",
      "track_id": "TRK-0016"
    },
    {
      "alert_id": "ALT-TRK-0001-NO_REGISTRY_MATCH",
      "alert_type": "UNREGISTERED",
      "created_at": "2026-09-11 03:08:07",
      "disposition": null,
      "disposition_at": null,
      "disposition_by": null,
      "disposition_notes": null,
      "disposition_reason": null,
      "latitude": 13.071374,
      "longitude": 80.293272,
      "reason": "Direct breach of INS Adyar Naval Base & Coastal Defense Sector (RED)!",
      "recommended_action": "VERIFY REGISTRY / IDENTIFY OPERATOR",
      "severity": "CRITICAL",
      "status": "ACTIVE",
      "subtype": "NO_REGISTRY_MATCH",
      "suggested_action": "VERIFY REGISTRY / IDENTIFY OPERATOR",
      "title": "UNREGISTERED: NO_REGISTRY_MATCH",
      "track_id": "TRK-0001"
    },
    {
      "alert_id": "ALT-TRK-0002-NO_REGISTRY_MATCH",
      "alert_type": "UNREGISTERED",
      "created_at": "2026-09-11 03:08:07",
      "disposition": null,
      "disposition_at": null,
      "disposition_by": null,
      "disposition_notes": null,
      "disposition_reason": null,
      "latitude": 13.062055,
      "longitude": 80.295061,
      "reason": "Direct breach of INS Adyar Naval Base & Coastal Defense Sector (RED)!",
      "recommended_action": "VERIFY REGISTRY / IDENTIFY OPERATOR",
      "severity": "CRITICAL",
      "status": "ACTIVE",
      "subtype": "NO_REGISTRY_MATCH",
      "suggested_action": "VERIFY REGISTRY / IDENTIFY OPERATOR",
      "title": "UNREGISTERED: NO_REGISTRY_MATCH",
      "track_id": "TRK-0002"
    },
    {
      "alert_id": "ALT-TRK-0003-NO_REGISTRY_MATCH",
      "alert_type": "UNREGISTERED",
      "created_at": "2026-09-11 03:08:07",
      "disposition": null,
      "disposition_at": null,
      "disposition_by": null,
      "disposition_notes": null,
      "disposition_reason": null,
      "latitude": 13.080189,
      "longitude": 80.305301,
      "reason": "Direct breach of INS Adyar Naval Base & Coastal Defense Sector (RED)!",
      "recommended_action": "VERIFY REGISTRY / IDENTIFY OPERATOR",
      "severity": "CRITICAL",
      "status": "ACTIVE",
      "subtype": "NO_REGISTRY_MATCH",
      "suggested_action": "VERIFY REGISTRY / IDENTIFY OPERATOR",
      "title": "UNREGISTERED: NO_REGISTRY_MATCH",
      "track_id": "TRK-0003"
    },
    {
      "alert_id": "ALT-TRK-0004-NO_REGISTRY_MATCH",
      "alert_type": "UNREGISTERED",
      "created_at": "2026-09-11 03:08:07",
      "disposition": null,
      "disposition_at": null,
      "disposition_by": null,
      "disposition_notes": null,
      "disposition_reason": null,
      "latitude": 13.107798,
      "longitude": 80.31489,
      "reason": "Direct breach of Chennai Port Commercial Shipping Anchorage (YELLOW)!",
      "recommended_action": "VERIFY REGISTRY / IDENTIFY OPERATOR",
      "severity": "CRITICAL",
      "status": "ACTIVE",
      "subtype": "NO_REGISTRY_MATCH",
      "suggested_action": "VERIFY REGISTRY / IDENTIFY OPERATOR",
      "title": "UNREGISTERED: NO_REGISTRY_MATCH",
      "track_id": "TRK-0004"
    },
    {
      "alert_id": "ALT-TRK-0005-NO_REGISTRY_MATCH",
      "alert_type": "UNREGISTERED",
      "created_at": "2026-09-11 03:08:07",
      "disposition": null,
      "disposition_at": null,
      "disposition_by": null,
      "disposition_notes": null,
      "disposition_reason": null,
      "latitude": 13.101299,
      "longitude": 80.307704,
      "reason": "Direct breach of Chennai Port Commercial Shipping Anchorage (YELLOW)!",
      "recommended_action": "VERIFY REGISTRY / IDENTIFY OPERATOR",
      "severity": "CRITICAL",
      "status": "ACTIVE",
      "subtype": "NO_REGISTRY_MATCH",
      "suggested_action": "VERIFY REGISTRY / IDENTIFY OPERATOR",
      "title": "UNREGISTERED: NO_REGISTRY_MATCH",
      "track_id": "TRK-0005"
    },
    {
      "alert_id": "ALT-TRK-0006-NO_REGISTRY_MATCH",
      "alert_type": "UNREGISTERED",
      "created_at": "2026-09-11 03:08:07",
      "disposition": null,
      "disposition_at": null,
      "disposition_by": null,
      "disposition_notes": null,
      "disposition_reason": null,
      "latitude": 13.088627,
      "longitude": 80.306279,
      "reason": "Direct breach of Chennai Port Commercial Shipping Anchorage (YELLOW)!",
      "recommended_action": "VERIFY REGISTRY / IDENTIFY OPERATOR",
      "severity": "CRITICAL",
      "status": "ACTIVE",
      "subtype": "NO_REGISTRY_MATCH",
      "suggested_action": "VERIFY REGISTRY / IDENTIFY OPERATOR",
      "title": "UNREGISTERED: NO_REGISTRY_MATCH",
      "track_id": "TRK-0006"
    },
    {
      "alert_id": "ALT-TRK-0007-NO_REGISTRY_MATCH",
      "alert_type": "UNREGISTERED",
      "created_at": "2026-09-11 03:08:07",
      "disposition": null,
      "disposition_at": null,
      "disposition_by": null,
      "disposition_notes": null,
      "disposition_reason": null,
      "latitude": 13.060149,
      "longitude": 80.291574,
      "reason": "Direct breach of Tactical VIP Security & Bomb Squad Cordon (TEMPORARY_RED)!",
      "recommended_action": "VERIFY REGISTRY / IDENTIFY OPERATOR",
      "severity": "CRITICAL",
      "status": "ACTIVE",
      "subtype": "NO_REGISTRY_MATCH",
      "suggested_action": "VERIFY REGISTRY / IDENTIFY OPERATOR",
      "title": "UNREGISTERED: NO_REGISTRY_MATCH",
      "track_id": "TRK-0007"
    },
    {
      "alert_id": "ALT-TRK-0008-NO_REGISTRY_MATCH",
      "alert_type": "UNREGISTERED",
      "created_at": "2026-09-11 03:08:07",
      "disposition": null,
      "disposition_at": null,
      "disposition_by": null,
      "disposition_notes": null,
      "disposition_reason": null,
      "latitude": 13.045449,
      "longitude": 80.285484,
      "reason": "Direct breach of Marina Beach Public Coastal Strip (GREEN)!",
      "recommended_action": "VERIFY REGISTRY / IDENTIFY OPERATOR",
      "severity": "CRITICAL",
      "status": "ACTIVE",
      "subtype": "NO_REGISTRY_MATCH",
      "suggested_action": "VERIFY REGISTRY / IDENTIFY OPERATOR",
      "title": "UNREGISTERED: NO_REGISTRY_MATCH",
      "track_id": "TRK-0008"
    }
  ],
  "incidents": [],
  "audit_logs": [
    {
      "action": "HEARTBEAT_TIMEOUT",
      "audit_id": "AUDIT-1C7A0206F67C",
      "current_hash": "83b7256e3d89d3618739127830ce325e7b80e95a2ff3c751c15305fc9b47854e",
      "details": "No telemetry received for 5.2s (Threshold: 5.0s). Alert ALT-LOST-TRK-0006 opened.",
      "id": 451,
      "operator_id": "WATCHDOG_MONITOR",
      "operator_role": "SYSTEM",
      "previous_hash": "2e774c480eac344b822e98c4357a5fdf789e139c3638c560027d0a92a5aa2303",
      "reason_code": "TELEMETRY_TIMEOUT",
      "resource": "TRK-0006",
      "resource_id": "TRK-0006",
      "resource_type": "TRACK",
      "result": "LOST_LINK_DECLARED",
      "timestamp": "2026-09-11T03:20:50.838514+00:00",
      "user_name": "WATCHDOG_MONITOR"
    },
    {
      "action": "HEARTBEAT_TIMEOUT",
      "audit_id": "AUDIT-3C9D8EAE8DE8",
      "current_hash": "2e774c480eac344b822e98c4357a5fdf789e139c3638c560027d0a92a5aa2303",
      "details": "No telemetry received for 5.1s (Threshold: 5.0s). Alert ALT-LOST-TRK-0004 opened.",
      "id": 450,
      "operator_id": "WATCHDOG_MONITOR",
      "operator_role": "SYSTEM",
      "previous_hash": "23799432d0eb087750449a95c510a2cf83afe297aa9f08e46ab739ab47fcd8a1",
      "reason_code": "TELEMETRY_TIMEOUT",
      "resource": "TRK-0004",
      "resource_id": "TRK-0004",
      "resource_type": "TRACK",
      "result": "LOST_LINK_DECLARED",
      "timestamp": "2026-09-11T03:20:50.276072+00:00",
      "user_name": "WATCHDOG_MONITOR"
    },
    {
      "action": "HEARTBEAT_TIMEOUT",
      "audit_id": "AUDIT-364EE662A99E",
      "current_hash": "23799432d0eb087750449a95c510a2cf83afe297aa9f08e46ab739ab47fcd8a1",
      "details": "No telemetry received for 5.0s (Threshold: 5.0s). Alert ALT-LOST-TRK-0002 opened.",
      "id": 449,
      "operator_id": "WATCHDOG_MONITOR",
      "operator_role": "SYSTEM",
      "previous_hash": "045e6515e96ffbcc57ef194c452ab80fd4f15704c621caafca9180ed24448f4c",
      "reason_code": "TELEMETRY_TIMEOUT",
      "resource": "TRK-0002",
      "resource_id": "TRK-0002",
      "resource_type": "TRACK",
      "result": "LOST_LINK_DECLARED",
      "timestamp": "2026-09-11T03:20:49.673506+00:00",
      "user_name": "WATCHDOG_MONITOR"
    },
    {
      "action": "HEARTBEAT_TIMEOUT",
      "audit_id": "AUDIT-C2D15406A62D",
      "current_hash": "045e6515e96ffbcc57ef194c452ab80fd4f15704c621caafca9180ed24448f4c",
      "details": "No telemetry received for 5.0s (Threshold: 5.0s). Alert ALT-LOST-TRK-0002 opened.",
      "id": 448,
      "operator_id": "WATCHDOG_MONITOR",
      "operator_role": "SYSTEM",
      "previous_hash": "b226e52b9b94a15040a5b88daf8805380d0146c725df8c7bff7d959370768032",
      "reason_code": "TELEMETRY_TIMEOUT",
      "resource": "TRK-0002",
      "resource_id": "TRK-0002",
      "resource_type": "TRACK",
      "result": "LOST_LINK_DECLARED",
      "timestamp": "2026-09-11T03:20:40.513798+00:00",
      "user_name": "WATCHDOG_MONITOR"
    },
    {
      "action": "HEARTBEAT_TIMEOUT",
      "audit_id": "AUDIT-57DCEFCECD31",
      "current_hash": "b226e52b9b94a15040a5b88daf8805380d0146c725df8c7bff7d959370768032",
      "details": "No telemetry received for 5.1s (Threshold: 5.0s). Alert ALT-LOST-TRK-0008 opened.",
      "id": 447,
      "operator_id": "WATCHDOG_MONITOR",
      "operator_role": "SYSTEM",
      "previous_hash": "ab295b3e22d167eb6a58762b87405428d36b2c36a17c14d82d573a44e06c1689",
      "reason_code": "TELEMETRY_TIMEOUT",
      "resource": "TRK-0008",
      "resource_id": "TRK-0008",
      "resource_type": "TRACK",
      "result": "LOST_LINK_DECLARED",
      "timestamp": "2026-09-11T03:17:29.288966+00:00",
      "user_name": "WATCHDOG_MONITOR"
    },
    {
      "action": "LOST_LINK_RECOVERY",
      "audit_id": "AUDIT-00A4466F1813",
      "current_hash": "ab295b3e22d167eb6a58762b87405428d36b2c36a17c14d82d573a44e06c1689",
      "details": "Telemetry signal resumed for track TRK-0006 (UNKNOWN). Track restored to active monitoring.",
      "id": 446,
      "operator_id": "TELEMETRY_INGESTOR",
      "operator_role": "SYSTEM",
      "previous_hash": "02df729f7b549eea416a74a40df5b3a1198eb2245058c7843269f63f79a7b59f",
      "reason_code": "HEARTBEAT_RESUMED",
      "resource": "TRK-0006",
      "resource_id": "TRK-0006",
      "resource_type": "TRACK",
      "result": "RECOVERED",
      "timestamp": "2026-09-11T03:17:28.934613+00:00",
      "user_name": "TELEMETRY_INGESTOR"
    },
    {
      "action": "HEARTBEAT_TIMEOUT",
      "audit_id": "AUDIT-10CB6CC29D62",
      "current_hash": "02df729f7b549eea416a74a40df5b3a1198eb2245058c7843269f63f79a7b59f",
      "details": "No telemetry received for 5.1s (Threshold: 5.0s). Alert ALT-LOST-TRK-0006 opened.",
      "id": 445,
      "operator_id": "WATCHDOG_MONITOR",
      "operator_role": "SYSTEM",
      "previous_hash": "b7b9082193458ceb5b4a310b43e59076f51e3255b2f444c2ee76e739c2167128",
      "reason_code": "TELEMETRY_TIMEOUT",
      "resource": "TRK-0006",
      "resource_id": "TRK-0006",
      "resource_type": "TRACK",
      "result": "LOST_LINK_DECLARED",
      "timestamp": "2026-09-11T03:17:28.706370+00:00",
      "user_name": "WATCHDOG_MONITOR"
    },
    {
      "action": "HEARTBEAT_TIMEOUT",
      "audit_id": "AUDIT-126D32EDCCC1",
      "current_hash": "b7b9082193458ceb5b4a310b43e59076f51e3255b2f444c2ee76e739c2167128",
      "details": "No telemetry received for 5.3s (Threshold: 5.0s). Alert ALT-LOST-TRK-0003 opened.",
      "id": 444,
      "operator_id": "WATCHDOG_MONITOR",
      "operator_role": "SYSTEM",
      "previous_hash": "82fe1a96f47ccc156f48f75d73a1040683d75e9428cb85b5b814031a92ca570f",
      "reason_code": "TELEMETRY_TIMEOUT",
      "resource": "TRK-0003",
      "resource_id": "TRK-0003",
      "resource_type": "TRACK",
      "result": "LOST_LINK_DECLARED",
      "timestamp": "2026-09-11T03:17:28.120230+00:00",
      "user_name": "WATCHDOG_MONITOR"
    },
    {
      "action": "LOST_LINK_RECOVERY",
      "audit_id": "AUDIT-A10F6BDD3F43",
      "current_hash": "82fe1a96f47ccc156f48f75d73a1040683d75e9428cb85b5b814031a92ca570f",
      "details": "Telemetry signal resumed for track TRK-0001 (RID-670). Track restored to active monitoring.",
      "id": 443,
      "operator_id": "TELEMETRY_INGESTOR",
      "operator_role": "SYSTEM",
      "previous_hash": "c0bc3c9fcb234f0bb0cec42918704e115220b508cb1ed95d40d8241181a6eb59",
      "reason_code": "HEARTBEAT_RESUMED",
      "resource": "TRK-0001",
      "resource_id": "TRK-0001",
      "resource_type": "TRACK",
      "result": "RECOVERED",
      "timestamp": "2026-09-11T03:17:27.731974+00:00",
      "user_name": "TELEMETRY_INGESTOR"
    },
    {
      "action": "HEARTBEAT_TIMEOUT",
      "audit_id": "AUDIT-3073A02A77FE",
      "current_hash": "c0bc3c9fcb234f0bb0cec42918704e115220b508cb1ed95d40d8241181a6eb59",
      "details": "No telemetry received for 5.1s (Threshold: 5.0s). Alert ALT-LOST-TRK-0001 opened.",
      "id": 442,
      "operator_id": "WATCHDOG_MONITOR",
      "operator_role": "SYSTEM",
      "previous_hash": "a10de9ea7d00458d82cb3b6a1a1d43b942aa042157c5f5562837f46b68a2f9e1",
      "reason_code": "TELEMETRY_TIMEOUT",
      "resource": "TRK-0001",
      "resource_id": "TRK-0001",
      "resource_type": "TRACK",
      "result": "LOST_LINK_DECLARED",
      "timestamp": "2026-09-11T03:17:27.434573+00:00",
      "user_name": "WATCHDOG_MONITOR"
    },
    {
      "action": "HEARTBEAT_TIMEOUT",
      "audit_id": "AUDIT-9D17988A44D7",
      "current_hash": "a10de9ea7d00458d82cb3b6a1a1d43b942aa042157c5f5562837f46b68a2f9e1",
      "details": "No telemetry received for 5.3s (Threshold: 5.0s). Alert ALT-LOST-TRK-0014 opened.",
      "id": 441,
      "operator_id": "WATCHDOG_MONITOR",
      "operator_role": "SYSTEM",
      "previous_hash": "93c46fe5ea6b9f72648dcb63b2274672ca3b027291dc19f4ae4c6ab2c57c3e17",
      "reason_code": "TELEMETRY_TIMEOUT",
      "resource": "TRK-0014",
      "resource_id": "TRK-0014",
      "resource_type": "TRACK",
      "result": "LOST_LINK_DECLARED",
      "timestamp": "2026-09-11T03:15:39.295487+00:00",
      "user_name": "WATCHDOG_MONITOR"
    },
    {
      "action": "LOST_LINK_RECOVERY",
      "audit_id": "AUDIT-92FED9FCDD1A",
      "current_hash": "93c46fe5ea6b9f72648dcb63b2274672ca3b027291dc19f4ae4c6ab2c57c3e17",
      "details": "Telemetry signal resumed for track TRK-0013 (RID-255). Track restored to active monitoring.",
      "id": 440,
      "operator_id": "TELEMETRY_INGESTOR",
      "operator_role": "SYSTEM",
      "previous_hash": "4e65208472367db1f23c5e3ec1a3354ca4f4a57c553815241c74a98bebb07d9c",
      "reason_code": "HEARTBEAT_RESUMED",
      "resource": "TRK-0013",
      "resource_id": "TRK-0013",
      "resource_type": "TRACK",
      "result": "RECOVERED",
      "timestamp": "2026-09-11T03:15:39.057526+00:00",
      "user_name": "TELEMETRY_INGESTOR"
    },
    {
      "action": "HEARTBEAT_TIMEOUT",
      "audit_id": "AUDIT-AA968C2FFAAD",
      "current_hash": "4e65208472367db1f23c5e3ec1a3354ca4f4a57c553815241c74a98bebb07d9c",
      "details": "No telemetry received for 5.0s (Threshold: 5.0s). Alert ALT-LOST-TRK-0013 opened.",
      "id": 439,
      "operator_id": "WATCHDOG_MONITOR",
      "operator_role": "SYSTEM",
      "previous_hash": "edcc3175a6b3258c3f89931e4bc5768a34419ccd9d3837843650d59bb440c457",
      "reason_code": "TELEMETRY_TIMEOUT",
      "resource": "TRK-0013",
      "resource_id": "TRK-0013",
      "resource_type": "TRACK",
      "result": "LOST_LINK_DECLARED",
      "timestamp": "2026-09-11T03:15:38.717723+00:00",
      "user_name": "WATCHDOG_MONITOR"
    },
    {
      "action": "HEARTBEAT_TIMEOUT",
      "audit_id": "AUDIT-FFD26E1DF24A",
      "current_hash": "edcc3175a6b3258c3f89931e4bc5768a34419ccd9d3837843650d59bb440c457",
      "details": "No telemetry received for 5.4s (Threshold: 5.0s). Alert ALT-LOST-TRK-0012 opened.",
      "id": 438,
      "operator_id": "WATCHDOG_MONITOR",
      "operator_role": "SYSTEM",
      "previous_hash": "d6ebdf1a6ba56cef22eddbba85bb61e20caeb33fc905cd9b43b427d8f1c24f13",
      "reason_code": "TELEMETRY_TIMEOUT",
      "resource": "TRK-0012",
      "resource_id": "TRK-0012",
      "resource_type": "TRACK",
      "result": "LOST_LINK_DECLARED",
      "timestamp": "2026-09-11T03:15:38.682963+00:00",
      "user_name": "WATCHDOG_MONITOR"
    },
    {
      "action": "LOST_LINK_RECOVERY",
      "audit_id": "AUDIT-834443961E5E",
      "current_hash": "d6ebdf1a6ba56cef22eddbba85bb61e20caeb33fc905cd9b43b427d8f1c24f13",
      "details": "Telemetry signal resumed for track TRK-0011 (RID-112). Track restored to active monitoring.",
      "id": 437,
      "operator_id": "TELEMETRY_INGESTOR",
      "operator_role": "SYSTEM",
      "previous_hash": "24c982ed73f9df9bb6ffa16742061b645a33ca4be0ced234166350135018f173",
      "reason_code": "HEARTBEAT_RESUMED",
      "resource": "TRK-0011",
      "resource_id": "TRK-0011",
      "resource_type": "TRACK",
      "result": "RECOVERED",
      "timestamp": "2026-09-11T03:15:38.606290+00:00",
      "user_name": "TELEMETRY_INGESTOR"
    },
    {
      "action": "LOST_LINK_RECOVERY",
      "audit_id": "AUDIT-E5859493A6E5",
      "current_hash": "24c982ed73f9df9bb6ffa16742061b645a33ca4be0ced234166350135018f173",
      "details": "Telemetry signal resumed for track TRK-0010 (RID-492). Track restored to active monitoring.",
      "id": 436,
      "operator_id": "TELEMETRY_INGESTOR",
      "operator_role": "SYSTEM",
      "previous_hash": "e363ca185c2c9067ed4f6dfd5380ba82398d19197dde1a8843902c0321296b77",
      "reason_code": "HEARTBEAT_RESUMED",
      "resource": "TRK-0010",
      "resource_id": "TRK-0010",
      "resource_type": "TRACK",
      "result": "RECOVERED",
      "timestamp": "2026-09-11T03:15:38.467726+00:00",
      "user_name": "TELEMETRY_INGESTOR"
    },
    {
      "action": "LOST_LINK_RECOVERY",
      "audit_id": "AUDIT-C5654E13BA36",
      "current_hash": "e363ca185c2c9067ed4f6dfd5380ba82398d19197dde1a8843902c0321296b77",
      "details": "Telemetry signal resumed for track TRK-0009 (RID-606). Track restored to active monitoring.",
      "id": 435,
      "operator_id": "TELEMETRY_INGESTOR",
      "operator_role": "SYSTEM",
      "previous_hash": "a0ad273708073f97a0efc1baa1e3290e20023f316df8af2cc825d06b3cf93a2f",
      "reason_code": "HEARTBEAT_RESUMED",
      "resource": "TRK-0009",
      "resource_id": "TRK-0009",
      "resource_type": "TRACK",
      "result": "RECOVERED",
      "timestamp": "2026-09-11T03:15:38.241898+00:00",
      "user_name": "TELEMETRY_INGESTOR"
    },
    {
      "action": "HEARTBEAT_TIMEOUT",
      "audit_id": "AUDIT-8B6EF0EE4DA9",
      "current_hash": "a0ad273708073f97a0efc1baa1e3290e20023f316df8af2cc825d06b3cf93a2f",
      "details": "No telemetry received for 5.2s (Threshold: 5.0s). Alert ALT-LOST-TRK-0011 opened.",
      "id": 434,
      "operator_id": "WATCHDOG_MONITOR",
      "operator_role": "SYSTEM",
      "previous_hash": "51b9f252684342607410b057af2f38cfc1d9eeb2607ce6c2d3c2b17bc0321ea6",
      "reason_code": "TELEMETRY_TIMEOUT",
      "resource": "TRK-0011",
      "resource_id": "TRK-0011",
      "resource_type": "TRACK",
      "result": "LOST_LINK_DECLARED",
      "timestamp": "2026-09-11T03:15:38.150797+00:00",
      "user_name": "WATCHDOG_MONITOR"
    },
    {
      "action": "HEARTBEAT_TIMEOUT",
      "audit_id": "AUDIT-F293DC458960",
      "current_hash": "51b9f252684342607410b057af2f38cfc1d9eeb2607ce6c2d3c2b17bc0321ea6",
      "details": "No telemetry received for 5.5s (Threshold: 5.0s). Alert ALT-LOST-TRK-0010 opened.",
      "id": 433,
      "operator_id": "WATCHDOG_MONITOR",
      "operator_role": "SYSTEM",
      "previous_hash": "f10b5c3b7720f0cdd316d6ed303ac5e7f2d3661b918934a566c254840c33d3c1",
      "reason_code": "TELEMETRY_TIMEOUT",
      "resource": "TRK-0010",
      "resource_id": "TRK-0010",
      "resource_type": "TRACK",
      "result": "LOST_LINK_DECLARED",
      "timestamp": "2026-09-11T03:15:38.086067+00:00",
      "user_name": "WATCHDOG_MONITOR"
    },
    {
      "action": "LOST_LINK_RECOVERY",
      "audit_id": "AUDIT-7498491D228A",
      "current_hash": "f10b5c3b7720f0cdd316d6ed303ac5e7f2d3661b918934a566c254840c33d3c1",
      "details": "Telemetry signal resumed for track TRK-0008 (UNKNOWN). Track restored to active monitoring.",
      "id": 432,
      "operator_id": "TELEMETRY_INGESTOR",
      "operator_role": "SYSTEM",
      "previous_hash": "b7ce2a728cb666bcda524016088a14040989d1deb6369be2dea178bcb48c0273",
      "reason_code": "HEARTBEAT_RESUMED",
      "resource": "TRK-0008",
      "resource_id": "TRK-0008",
      "resource_type": "TRACK",
      "result": "RECOVERED",
      "timestamp": "2026-09-11T03:15:37.938401+00:00",
      "user_name": "TELEMETRY_INGESTOR"
    },
    {
      "action": "LOST_LINK_RECOVERY",
      "audit_id": "AUDIT-29D2846E52E4",
      "current_hash": "b7ce2a728cb666bcda524016088a14040989d1deb6369be2dea178bcb48c0273",
      "details": "Telemetry signal resumed for track TRK-0007 (RID-570). Track restored to active monitoring.",
      "id": 431,
      "operator_id": "TELEMETRY_INGESTOR",
      "operator_role": "SYSTEM",
      "previous_hash": "06ad3bd0f3e9a2df71c44d9625d6b7f2aa99df247fe350797b283c77c56a1033",
      "reason_code": "HEARTBEAT_RESUMED",
      "resource": "TRK-0007",
      "resource_id": "TRK-0007",
      "resource_type": "TRACK",
      "result": "RECOVERED",
      "timestamp": "2026-09-11T03:15:37.619633+00:00",
      "user_name": "TELEMETRY_INGESTOR"
    },
    {
      "action": "HEARTBEAT_TIMEOUT",
      "audit_id": "AUDIT-DF91377347E5",
      "current_hash": "06ad3bd0f3e9a2df71c44d9625d6b7f2aa99df247fe350797b283c77c56a1033",
      "details": "No telemetry received for 5.3s (Threshold: 5.0s). Alert ALT-LOST-TRK-0009 opened.",
      "id": 430,
      "operator_id": "WATCHDOG_MONITOR",
      "operator_role": "SYSTEM",
      "previous_hash": "f2fe5ab22c9aedba7ffbe295aaf94231eab1c7a1f7fef7fc21087ad07e55c93d",
      "reason_code": "TELEMETRY_TIMEOUT",
      "resource": "TRK-0009",
      "resource_id": "TRK-0009",
      "resource_type": "TRACK",
      "result": "LOST_LINK_DECLARED",
      "timestamp": "2026-09-11T03:15:37.482829+00:00",
      "user_name": "WATCHDOG_MONITOR"
    },
    {
      "action": "HEARTBEAT_TIMEOUT",
      "audit_id": "AUDIT-FF331EBB890A",
      "current_hash": "f2fe5ab22c9aedba7ffbe295aaf94231eab1c7a1f7fef7fc21087ad07e55c93d",
      "details": "No telemetry received for 5.5s (Threshold: 5.0s). Alert ALT-LOST-TRK-0008 opened.",
      "id": 429,
      "operator_id": "WATCHDOG_MONITOR",
      "operator_role": "SYSTEM",
      "previous_hash": "fe86e07af253dd7d915b8f1c1c5ce341bfa82ffa6ce7dfd2f91d667e097bee23",
      "reason_code": "TELEMETRY_TIMEOUT",
      "resource": "TRK-0008",
      "resource_id": "TRK-0008",
      "resource_type": "TRACK",
      "result": "LOST_LINK_DECLARED",
      "timestamp": "2026-09-11T03:15:37.427315+00:00",
      "user_name": "WATCHDOG_MONITOR"
    },
    {
      "action": "LOST_LINK_RECOVERY",
      "audit_id": "AUDIT-5757C9313A2E",
      "current_hash": "fe86e07af253dd7d915b8f1c1c5ce341bfa82ffa6ce7dfd2f91d667e097bee23",
      "details": "Telemetry signal resumed for track TRK-0006 (UNKNOWN). Track restored to active monitoring.",
      "id": 428,
      "operator_id": "TELEMETRY_INGESTOR",
      "operator_role": "SYSTEM",
      "previous_hash": "80f81093186ee64c4d1735eb166e7635cb5de763b1a5d5ae09b7481414123861",
      "reason_code": "HEARTBEAT_RESUMED",
      "resource": "TRK-0006",
      "resource_id": "TRK-0006",
      "resource_type": "TRACK",
      "result": "RECOVERED",
      "timestamp": "2026-09-11T03:15:37.370325+00:00",
      "user_name": "TELEMETRY_INGESTOR"
    },
    {
      "action": "LOST_LINK_RECOVERY",
      "audit_id": "AUDIT-E3D348838F99",
      "current_hash": "80f81093186ee64c4d1735eb166e7635cb5de763b1a5d5ae09b7481414123861",
      "details": "Telemetry signal resumed for track TRK-0005 (RID-359). Track restored to active monitoring.",
      "id": 427,
      "operator_id": "TELEMETRY_INGESTOR",
      "operator_role": "SYSTEM",
      "previous_hash": "bcf5ece776abef4d849e02b7eebfe3fa1c74e5bce7aebb1f92ed9612580103dc",
      "reason_code": "HEARTBEAT_RESUMED",
      "resource": "TRK-0005",
      "resource_id": "TRK-0005",
      "resource_type": "TRACK",
      "result": "RECOVERED",
      "timestamp": "2026-09-11T03:15:37.132150+00:00",
      "user_name": "TELEMETRY_INGESTOR"
    }
  ]
};
