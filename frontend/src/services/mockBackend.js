import { INITIAL_SEED_DATA } from './mockSeedData.js';

// Deep clone helper
const clone = (obj) => JSON.parse(JSON.stringify(obj));

class MockBackendEngine {
  constructor() {
    this.zones = clone(INITIAL_SEED_DATA.zones || []);
    this.drones = clone(INITIAL_SEED_DATA.drones || []);
    this.permissions = clone(INITIAL_SEED_DATA.permissions || []);
    this.cameras = clone(INITIAL_SEED_DATA.cameras || []);
    this.settings = clone(INITIAL_SEED_DATA.settings || {});
    this.scenarios = clone(INITIAL_SEED_DATA.scenarios || []);
    this.alerts = clone(INITIAL_SEED_DATA.alerts || []);
    this.incidents = clone(INITIAL_SEED_DATA.incidents || []);
    this.auditLogs = clone(INITIAL_SEED_DATA.audit_logs || []);
    this.tracks = clone(INITIAL_SEED_DATA.active_tracks || []);
    this.activeScenario = 'RESTRICTED_INTRUSION';
    this.simulationState = 'RUNNING';
    this.simulationSpeed = 1.0;
    this.lastStepTime = Date.now();

    // Ensure Temporary Red Zone exists with proper countdown
    this.ensureTemporaryRedZone();
  }

  ensureTemporaryRedZone() {
    const existing = this.zones.find((z) => z.zone_id === 'ZONE-TEMP-TACTICAL-01');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 45 * 60 * 1000); // 45 minutes from now
    const expiresStr = expiresAt.toISOString().replace('T', ' ').substring(0, 19);

    if (!existing) {
      this.zones.unshift({
        zone_id: 'ZONE-TEMP-TACTICAL-01',
        name: 'Tactical VIP Security & Bomb Squad Cordon',
        zone_type: 'TEMPORARY_RED',
        severity: 'EMERGENCY',
        reason: 'VIP Convoy Transit & Perimeter Sweep',
        min_altitude_m: 0.0,
        max_altitude_m: 600.0,
        polygon_coords: [
          [13.065, 80.278],
          [13.065, 80.298],
          [13.048, 80.298],
          [13.048, 80.278]
        ],
        active: 1,
        created_by: 'Inspector V. Raman',
        created_at: now.toISOString().replace('T', ' ').substring(0, 19),
        expires_at: expiresStr,
        description: 'Authorized by CDAC. All unauthorized UAS subject to RF takeover.'
      });
    } else if (!existing.expires_at) {
      existing.expires_at = expiresStr;
    }
  }

  stepSimulation(dt = 0.8) {
    const effectiveDt = Math.max(0.2, Math.min(2.0, dt)) * this.simulationSpeed;

    for (const track of this.tracks) {
      if (!track.latitude || !track.longitude) continue;

      const speed = track.speed_mps || 14.0;

      // Unregistered Rogue Drone (TRACK-0001) erratic AI wander
      if (track.track_id === 'TRACK-0001') {
        track.heading_deg = (track.heading_deg + (Math.random() - 0.48) * 5.5 + 360) % 360;
      } else if (track.track_id === 'TRK-0003') {
        // Altitude violator oscillates > 120m
        track.altitude_m = +(130 + Math.sin(Date.now() / 3000) * 15).toFixed(1);
        track.heading_deg = (track.heading_deg + (Math.random() - 0.5) * 3 + 360) % 360;
      } else {
        // Mild wander for ambient drones
        if (Math.random() < 0.2) {
          track.heading_deg = (track.heading_deg + (Math.random() - 0.5) * 4 + 360) % 360;
        }
      }

      const rad = ((track.heading_deg || 0) * Math.PI) / 180;
      const dLat = (speed * Math.cos(rad) * effectiveDt) / 111000;
      const dLon = (speed * Math.sin(rad) * effectiveDt) / (111000 * Math.cos((track.latitude * Math.PI) / 180));

      track.latitude = +(track.latitude + dLat).toFixed(6);
      track.longitude = +(track.longitude + dLon).toFixed(6);

      // Bounce at Chennai operational airspace boundary
      if (track.latitude < 12.96 || track.latitude > 13.18) {
        track.heading_deg = (180 - track.heading_deg + 360) % 360;
      }
      if (track.longitude < 80.20 || track.longitude > 80.35) {
        track.heading_deg = (360 - track.heading_deg + 360) % 360;
      }

      // Maintain breadcrumb history
      if (!Array.isArray(track.history)) track.history = [];
      track.history.push([track.latitude, track.longitude]);
      if (track.history.length > 25) track.history.shift();

      track.last_seen = +(Date.now() / 1000).toFixed(1);
      track.last_telemetry_timestamp = new Date().toISOString();

      // Kinematic trajectory prediction for TRACK-0001
      if (track.track_id === 'TRACK-0001') {
        const predictedPoints = [];
        let curLat = track.latitude;
        let curLon = track.longitude;
        let curHead = track.heading_deg;
        for (let s = 1; s <= 8; s++) {
          const stepDt = 3.5;
          curHead = (curHead + 2.5) % 360;
          const pRad = (curHead * Math.PI) / 180;
          curLat += (speed * Math.cos(pRad) * stepDt) / 111000;
          curLon += (speed * Math.sin(pRad) * stepDt) / (111000 * Math.cos((curLat * Math.PI) / 180));
          predictedPoints.push({
            latitude: +curLat.toFixed(6),
            longitude: +curLon.toFixed(6),
            altitude_m: track.altitude_m,
            heading_deg: +curHead.toFixed(1),
            dt_seconds: s * 3.5,
            distance_m: Math.round(speed * s * 3.5)
          });
        }

        track.trajectory = {
          ai_prediction: {
            confidence: 0.96,
            intent: 'EVASIVE_ZIGZAG_MANEUVER',
            intent_label: 'EVASIVE ZIGZAG MANEUVER',
            model: 'AeroGuard-Kinematic-NeuralPredictor-v2.4',
            projected_max_altitude_m: track.altitude_m,
            summary: 'Erratic banking & yaw wander detected (turn rate 4.5 deg/s). AI predicts evasive recon maneuvers.',
            trajectory_type: 'CURVILINEAR_EVASIVE',
            breach_projected: true,
            breach_zone: 'ZONE-NAVAL-01',
            breach_eta_s: 38
          },
          breach_prediction: {
            breach_predicted: true,
            breach_time_seconds: 38,
            eta_s: 38,
            zone_id: 'ZONE-NAVAL-01',
            zone_name: 'INS Adyar Naval Base & Coastal Defense Sector'
          },
          predicted_points: predictedPoints
        };
      }
    }
  }

  getSnapshot() {
    const now = Date.now();
    const dt = (now - this.lastStepTime) / 1000;
    this.lastStepTime = now;
    this.stepSimulation(dt);

    return {
      success: true,
      snapshot: {
        active_scenario_key: this.activeScenario,
        active_tracks: this.tracks,
        active_tracks_count: this.tracks.length,
        state: this.simulationState,
        speed: this.simulationSpeed,
        timestamp: new Date().toISOString(),
        simulation_time: (now / 1000).toFixed(1),
        statistics: {
          total_tracks: this.tracks.length,
          threats_active: 2,
          registered_active: this.tracks.length - 2,
          radar_snr_db: 18.6,
          optical_locks: 3,
          fusion_confidence: 0.95
        }
      }
    };
  }

  handleLogin(body = {}) {
    const username = (body.username || '').toLowerCase();
    const portal = (body.portal || '').toUpperCase();

    let user;
    let token;

    if (username === 'superadmin' || portal === 'SUPER_ADMIN' || username.includes('admin')) {
      user = {
        id: 'USR-SUP-001',
        username: 'superadmin',
        email: 'admin@aeroguard.gov',
        role: 'SUPER_ADMIN',
        full_name: 'Dr. S. Jayaram',
        organization: 'AeroGuard National Airspace Directorate'
      };
      token = 'aerosec-superadmin-token';
    } else if (username === 'operator' || portal === 'OPERATOR') {
      user = {
        id: 'USR-OP-001',
        username: 'operator',
        email: 'operator@aeroguard.gov',
        role: 'OPERATOR',
        full_name: 'R. Karthik',
        organization: 'Tamil Nadu Maritime Logistics'
      };
      token = 'aerosec-operator-token';
    } else {
      user = {
        id: 'USR-OFF-001',
        username: body.username || 'officer.raman',
        email: 'officer@aeroguard.gov',
        role: 'OFFICER',
        full_name: 'Inspector V. Raman',
        organization: 'Coastal Defense Airspace Command'
      };
      token = 'aerosec-officer-token';
    }

    this.addAuditLog({
      action: 'LOGIN',
      resource: 'AUTH',
      user_id: user.id,
      user_name: user.full_name,
      details: 'Successful login to ' + (portal || 'ADMIN') + ' console via Standalone Simulator'
    });

    return { success: true, user, token };
  }

  addAuditLog(entry) {
    const log = {
      log_id: 'AUD-' + Date.now().toString().slice(-6),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      action: entry.action || 'ACTION',
      resource: entry.resource || 'SYSTEM',
      user_id: entry.user_id || 'USR-SYS-001',
      user_name: entry.user_name || 'Inspector V. Raman',
      details: entry.details || '',
      prev_hash: 'GENESIS-BLOCK-AEROGUARD',
      log_hash: Math.random().toString(36).substring(2, 18) + Math.random().toString(36).substring(2, 18)
    };
    this.auditLogs.unshift(log);
    if (this.auditLogs.length > 50) this.auditLogs.pop();
  }

  handleRequest(path, method = 'GET', body = null) {
    const cleanPath = path.split('?')[0];

    // Auth
    if (cleanPath === '/api/auth/login' && method === 'POST') {
      return this.handleLogin(body || {});
    }
    if (cleanPath === '/api/auth/me') {
      try {
        const saved = localStorage.getItem('aeroguard_user');
        if (saved) return { authenticated: true, user: JSON.parse(saved) };
      } catch {}
      return {
        authenticated: true,
        user: {
          id: 'USR-OFF-001',
          username: 'officer.raman',
          email: 'officer@aeroguard.gov',
          role: 'OFFICER',
          full_name: 'Inspector V. Raman',
          organization: 'Coastal Defense Airspace Command'
        }
      };
    }
    if (cleanPath === '/api/auth/logout') {
      return { success: true };
    }
    if (cleanPath === '/api/auth/register-operator' && method === 'POST') {
      return {
        success: true,
        message: 'Operator account created successfully.',
        user: {
          id: 'USR-OP-' + Date.now().toString().slice(-4),
          username: body?.username || 'operator',
          role: 'OPERATOR',
          full_name: body?.full_name || 'Civilian Operator'
        }
      };
    }

    // Simulation
    if (cleanPath === '/api/simulation/snapshot') {
      return this.getSnapshot();
    }
    if (cleanPath === '/api/simulation/scenario' && method === 'POST') {
      if (body?.scenario) this.activeScenario = body.scenario;
      if (body?.speed) this.simulationSpeed = body.speed;
      return this.getSnapshot();
    }
    if (cleanPath === '/api/simulation/start' || cleanPath === '/api/simulation/resume') {
      this.simulationState = 'RUNNING';
      return { success: true, state: 'RUNNING' };
    }
    if (cleanPath === '/api/simulation/pause') {
      this.simulationState = 'PAUSED';
      return { success: true, state: 'PAUSED' };
    }

    // Zones
    if (cleanPath === '/api/zones') {
      if (method === 'POST' && body) {
        const newZone = {
          zone_id: body.zone_id || ('ZONE-CUSTOM-' + Date.now().toString().slice(-4)),
          name: body.name || 'Custom Airspace Zone',
          zone_type: body.zone_type || 'AMBER',
          severity: body.severity || 'MEDIUM',
          reason: body.reason || 'Tactical Sector',
          min_altitude_m: body.min_altitude_m || 0,
          max_altitude_m: body.max_altitude_m || 120,
          polygon_coords: body.polygon_coords || [
            [13.08, 80.27],
            [13.08, 80.29],
            [13.06, 80.29],
            [13.06, 80.27]
          ],
          active: 1,
          created_by: 'Inspector V. Raman',
          created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
          expires_at: body.expires_at || null,
          description: body.description || 'Custom defined zone'
        };
        this.zones.unshift(newZone);
        this.addAuditLog({
          action: 'CREATE_ZONE',
          resource: newZone.zone_id,
          details: 'Created airspace zone ' + newZone.name + ' (' + newZone.zone_type + ')'
        });
        return { success: true, zone: newZone, zones: this.zones };
      }
      return { success: true, zones: this.zones };
    }

    if (cleanPath === '/api/zones/temporary' && method === 'POST') {
      const durationMins = Number(body?.duration_minutes) || 45;
      const now = new Date();
      const expiresAt = new Date(now.getTime() + durationMins * 60 * 1000);
      const expiresStr = expiresAt.toISOString().replace('T', ' ').substring(0, 19);

      let tempZone = this.zones.find((z) => z.zone_id === 'ZONE-TEMP-TACTICAL-01');
      if (tempZone) {
        tempZone.expires_at = expiresStr;
        tempZone.reason = body?.reason || tempZone.reason;
        tempZone.active = 1;
      } else {
        tempZone = {
          zone_id: 'ZONE-TEMP-TACTICAL-01',
          name: body?.name || 'Tactical VIP Security & Bomb Squad Cordon',
          zone_type: 'TEMPORARY_RED',
          severity: 'EMERGENCY',
          reason: body?.reason || 'VIP Convoy Transit & Perimeter Sweep',
          min_altitude_m: 0.0,
          max_altitude_m: 600.0,
          polygon_coords: [
            [13.065, 80.278],
            [13.065, 80.298],
            [13.048, 80.298],
            [13.048, 80.278]
          ],
          active: 1,
          created_by: 'Inspector V. Raman',
          created_at: now.toISOString().replace('T', ' ').substring(0, 19),
          expires_at: expiresStr,
          description: 'Authorized by CDAC. All unauthorized UAS subject to RF takeover.'
        };
        this.zones.unshift(tempZone);
      }
      this.addAuditLog({
        action: 'UPDATE_TEMP_ZONE',
        resource: tempZone.zone_id,
        details: 'Temporary Red Zone set with ' + durationMins + 'm countdown'
      });
      return { success: true, zone: tempZone, zones: this.zones };
    }

    if (cleanPath === '/api/zones/import-geojson' && method === 'POST') {
      return { success: true, message: 'GeoJSON imported successfully', imported_count: 1 };
    }

    // Drones
    if (cleanPath === '/api/drones') {
      if (method === 'POST' && body) {
        const newDrone = {
          drone_id: 'DRN-' + Date.now().toString().slice(-4),
          uin_number: 'UIN-2026-IND-' + Math.floor(1000 + Math.random() * 9000),
          model_name: body.model_name || 'Standard Quadcopter',
          drone_type: body.drone_type || 'ROTORCRAFT',
          weight_category: body.weight_category || 'MEDIUM',
          owner_name: body.owner_name || 'Registered Civilian Operator',
          operator_contact: body.operator_contact || '+91-9876543210',
          registration_status: 'VERIFIED',
          registered_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
        };
        this.drones.unshift(newDrone);
        this.addAuditLog({
          action: 'REGISTER_DRONE',
          resource: newDrone.drone_id,
          details: 'Registered UAS ' + newDrone.model_name + ' (Owner: ' + newDrone.owner_name + ')'
        });
        return { success: true, drone: newDrone, drones: this.drones };
      }
      return { success: true, drones: this.drones };
    }

    // Permissions
    if (cleanPath === '/api/permissions') {
      if (method === 'POST' && body) {
        const newPerm = {
          permission_id: 'PERM-2026-' + Math.floor(100 + Math.random() * 900),
          drone_id: body.drone_id || 'DRN-001',
          uin_number: 'UIN-2026-IND-0101',
          model_name: 'Commercial Multirotor',
          operator_name: body.operator_name || 'Civilian Operator',
          flight_purpose: body.flight_purpose || 'Infrastructure Survey',
          allowed_zone: body.allowed_zone || 'ZONE-PORT-02',
          max_altitude_m: Number(body.max_altitude_m) || 80.0,
          start_time: body.start_time || '2026-09-11 08:00:00',
          end_time: body.end_time || '2026-09-11 18:00:00',
          status: 'PENDING',
          requested_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
          approved_by: null
        };
        this.permissions.unshift(newPerm);
        this.addAuditLog({
          action: 'REQUEST_PERMISSION',
          resource: newPerm.permission_id,
          details: 'Flight request for ' + newPerm.flight_purpose + ' submitted'
        });
        return { success: true, permission: newPerm, permissions: this.permissions };
      }
      return { success: true, permissions: this.permissions };
    }

    // Permission status update: /api/permissions/:id/status
    if (cleanPath.includes('/api/permissions/') && cleanPath.endsWith('/status') && method === 'PUT') {
      const parts = cleanPath.split('/');
      const permId = parts[3];
      const newStatus = body?.status || 'APPROVED';
      const perm = this.permissions.find((p) => p.permission_id === permId);
      if (perm) {
        perm.status = newStatus;
        perm.approved_by = body?.officer || 'Inspector V. Raman';
      }
      this.addAuditLog({
        action: 'PERMISSION_' + newStatus,
        resource: permId,
        details: 'Flight authorization ' + permId + ' set to ' + newStatus
      });
      return { success: true, permissions: this.permissions };
    }

    // Alerts
    if (cleanPath === '/api/alerts') {
      return { success: true, alerts: this.alerts };
    }

    // Incidents
    if (cleanPath === '/api/incidents') {
      if (method === 'PUT' && body) {
        return { success: true, incidents: this.incidents };
      }
      return { success: true, incidents: this.incidents };
    }
    if (cleanPath.startsWith('/api/incidents/') && method === 'PUT') {
      return { success: true, incidents: this.incidents };
    }

    // Audit
    if (cleanPath === '/api/audit') {
      return { success: true, logs: this.auditLogs };
    }

    // Cameras
    if (cleanPath === '/api/cameras') {
      return { success: true, cameras: this.cameras };
    }

    // Settings
    if (cleanPath === '/api/settings') {
      if (method === 'PUT' && body) {
        this.settings = { ...this.settings, ...body };
        return { success: true, settings: this.settings };
      }
      return { success: true, settings: this.settings };
    }

    // Health
    if (cleanPath === '/api/health') {
      return {
        success: true,
        status: 'ONLINE',
        mode: 'STANDALONE_SIMULATION',
        engine_status: {
          radar_engine: 'ONLINE',
          optical_engine: 'ONLINE',
          fusion_engine: 'ONLINE',
          rules_engine: 'ONLINE',
          ai_trajectory_predictor: 'ONLINE'
        },
        active_tracks: this.tracks.length,
        timestamp: new Date().toISOString()
      };
    }

    // Scenarios
    if (cleanPath === '/api/scenarios') {
      return { success: true, scenarios: this.scenarios };
    }

    // Radar & AI Predict
    if (cleanPath === '/api/radar/predict') {
      return {
        success: true,
        predicted_class: 'UAS_CLASS_1_MICRO_DRONE',
        confidence: 0.95,
        risk_index: 0.88,
        intent: 'EVASIVE_SURVEILLANCE'
      };
    }
    if (cleanPath === '/api/radar/demo-samples') {
      return {
        success: true,
        samples: [
          {
            name: 'High-Speed Quadcopter (Evasive)',
            features: [18.2, 14.5, 45.0, 0.92, 1.4, 0.88]
          },
          {
            name: 'Autonomous Fixed-Wing Survey Drone',
            features: [24.0, 8.0, 110.0, 0.96, 0.4, 0.12]
          },
          {
            name: 'Bird Flock Radar Clutter',
            features: [8.5, 3.2, 15.0, 0.42, 3.8, 0.05]
          }
        ]
      };
    }

    // Generic fallback for any other /api route
    return { success: true, message: 'OK' };
  }
}

export const mockBackend = new MockBackendEngine();

// Global Fetch Interceptor
export function setupGlobalFetchInterceptor() {
  if (typeof window === 'undefined') return;
  if (window.__AEROGUARD_INTERCEPTOR_INSTALLED__) return;
  window.__AEROGUARD_INTERCEPTOR_INSTALLED__ = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async function (resource, options = {}) {
    let url = typeof resource === 'string' ? resource : resource?.url || '';

    // Only intercept requests destined for /api/*
    if (!url.startsWith('/api/') && !url.includes('/api/')) {
      return originalFetch(resource, options);
    }

    const apiBase = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ? import.meta.env.VITE_API_URL.replace(/\/+$/, '') : '';
    const targetUrl = apiBase && url.startsWith('/api/') ? (apiBase + url) : url;

    // Method and body parsing
    const method = (options.method || 'GET').toUpperCase();
    let parsedBody = null;
    if (options.body && typeof options.body === 'string') {
      try {
        parsedBody = JSON.parse(options.body);
      } catch {
        parsedBody = options.body;
      }
    }

    try {
      // 1. First, attempt the real network request (local Flask or cloud backend)
      const res = await originalFetch(targetUrl, options);
      const contentType = res.headers.get('content-type') || '';

      // If the backend responded with valid JSON, pass it straight through!
      if (contentType.includes('application/json')) {
        return res;
      }

      // If Vercel rewrote /api/* to /index.html (text/html) because no backend is attached:
      console.warn('[AeroGuard Standalone] Backend route returned ' + (contentType || 'non-JSON') + ', falling back to in-browser simulation for: ' + url);
    } catch (networkErr) {
      // Network unreachable, connection refused, or offline
      console.warn('[AeroGuard Standalone] Live backend unreachable, falling back to in-browser simulation for: ' + url, networkErr);
    }

    // 2. Autonomous client simulation fallback
    const mockResult = mockBackend.handleRequest(url, method, parsedBody);
    return new Response(JSON.stringify(mockResult), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-AeroGuard-Mode': 'Standalone-Simulation'
      }
    });
  };

  console.info('🛡️ AeroGuard Zero-Failure Simulation & API Interceptor Activated.');
}
