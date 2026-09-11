import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TopBar from '../components/TopBar';
import Navigation from '../components/Navigation';
import LiveMap from '../components/LiveMap';
import RadarPipelinePanel from '../components/RadarPipelinePanel';
import CameraFusionPanel from '../components/CameraFusionPanel';
import LiveDetectionCard from '../components/LiveDetectionCard';
import SimulationControls from '../components/SimulationControls';
import AlertsPanel from '../components/AlertsPanel';
import IncidentsEvidenceView from '../components/IncidentsEvidenceView';
import AITransparencyView from '../components/AITransparencyView';
import AuditLogView from '../components/AuditLogView';
import PermissionsRegistryView from '../components/PermissionsRegistryView';
import DroneRegistryView from '../components/DroneRegistryView';
import RestrictedZonesView from '../components/RestrictedZonesView';
import DemoWalkthroughModal from '../components/DemoWalkthroughModal';
import TacticalRadarModal from '../components/TacticalRadarModal';
import NotificationToasts from '../components/NotificationToasts';
import { Clock, ChevronRight, FileCheck2 } from 'lucide-react';

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [currentTab, setTab] = useState('overview');
  const currentRole = 'OFFICER';

  // Backend state
  const [systemHealth, setSystemHealth] = useState(null);
  const [simSnapshot, setSimSnapshot] = useState(null);
  const [scenarios, setScenarios] = useState([]);
  const [cameras, setCameras] = useState([]);
  const [zones, setZones] = useState([]);
  const [drones, setDrones] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [demoSamples, setDemoSamples] = useState([]);

  // Selected entities & Pinning
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [pinnedTarget, setPinnedTarget] = useState(null);

  // Pop-Out Tactical Radar, Audio & Notification History
  const [isRadarModalOpen, setIsRadarModalOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationHistory, setNotificationHistory] = useState([]);

  const handleAddNotification = (newToast) => {
    setNotificationHistory((prev) => [newToast, ...prev.slice(0, 49)]);
  };

  // Demo Walkthrough State
  const [isDemoRunning, setIsDemoRunning] = useState(false);
  const [demoStep, setDemoStep] = useState(0);

  // Initial Fetch
  const fetchAllData = async () => {
    try {
      const [
        healthRes,
        scenariosRes,
        camerasRes,
        zonesRes,
        dronesRes,
        permsRes,
        alertsRes,
        incidentsRes,
        auditRes,
        samplesRes
      ] = await Promise.all([
        fetch('/api/health').then((r) => r.json()).catch(() => null),
        fetch('/api/scenarios').then((r) => r.json()).catch(() => null),
        fetch('/api/cameras').then((r) => r.json()).catch(() => null),
        fetch('/api/zones').then((r) => r.json()).catch(() => null),
        fetch('/api/drones').then((r) => r.json()).catch(() => null),
        fetch('/api/permissions').then((r) => r.json()).catch(() => null),
        fetch('/api/alerts').then((r) => r.json()).catch(() => null),
        fetch('/api/incidents').then((r) => r.json()).catch(() => null),
        fetch('/api/audit').then((r) => r.json()).catch(() => null),
        fetch('/api/radar/demo-samples').then((r) => r.json()).catch(() => null)
      ]);

      if (healthRes) setSystemHealth(healthRes);
      if (scenariosRes?.scenarios) setScenarios(scenariosRes.scenarios);
      if (camerasRes?.cameras) {
        setCameras(camerasRes.cameras);
        if (!selectedCamera && camerasRes.cameras.length > 2) {
          setSelectedCamera(camerasRes.cameras[2]); // Default to Cam-03
        }
      }
      if (zonesRes?.zones) setZones(zonesRes.zones);
      if (dronesRes?.drones) setDrones(dronesRes.drones);
      if (permsRes?.permissions) setPermissions(permsRes.permissions);
      if (alertsRes?.alerts) setAlerts(alertsRes.alerts);
      if (incidentsRes?.incidents) setIncidents(incidentsRes.incidents);
      if (auditRes?.logs) setAuditLogs(auditRes.logs);
      if (samplesRes?.samples) setDemoSamples(samplesRes.samples);
    } catch (e) {
      console.warn('Initial fetch warning:', e);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Connection & Offline Resilience State
  const [connectionStatus, setConnectionStatus] = useState('CONNECTED');
  const failureCountRef = useRef(0);

  // Poll Simulation Snapshot with Resilience & Backoff
  useEffect(() => {
    const pollInterval = setInterval(() => {
      fetch('/api/simulation/snapshot')
        .then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json();
        })
        .then((data) => {
          if (data?.success && data?.snapshot) {
            setSimSnapshot(data.snapshot);
            failureCountRef.current = 0;
            setConnectionStatus('CONNECTED');
          }
        })
        .catch(() => {
          failureCountRef.current += 1;
          if (failureCountRef.current >= 4) {
            setConnectionStatus('OFFLINE');
          } else {
            setConnectionStatus('RECONNECTING');
          }
        });
    }, 800);

    return () => clearInterval(pollInterval);
  }, []);

  // Periodic Refresh for alerts & incidents
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      fetch('/api/alerts')
        .then((r) => r.json())
        .then((data) => data?.alerts && setAlerts(data.alerts))
        .catch(() => {});

      fetch('/api/incidents')
        .then((r) => r.json())
        .then((data) => data?.incidents && setIncidents(data.incidents))
        .catch(() => {});

      fetch('/api/audit')
        .then((r) => r.json())
        .then((data) => data?.logs && setAuditLogs(data.logs))
        .catch(() => {});
    }, 3000);

    return () => clearInterval(refreshInterval);
  }, []);

  // Simulation Controls Handlers
  const handleStartSim = (scenarioKey, speed) => {
    setSelectedTrack(null);
    fetch('/api/simulation/scenario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario: scenarioKey, speed: speed || simSnapshot?.speed || 1.0 })
    })
      .then((r) => r.json())
      .then((d) => {
        if (d?.snapshot) setSimSnapshot(d.snapshot);
        if (d?.alerts) setAlerts(d.alerts);
        fetch('/api/alerts').then((r) => r.json()).then((a) => a?.alerts && setAlerts(a.alerts));
      })
      .catch(() => {});
  };

  const handlePauseSim = () => {
    fetch('/api/simulation/pause', { method: 'POST' })
      .then((r) => r.json())
      .then((d) => {
        if (simSnapshot) setSimSnapshot({ ...simSnapshot, state: 'PAUSED' });
      })
      .catch(() => {});
  };

  const handleResumeSim = () => {
    fetch('/api/simulation/resume', { method: 'POST' })
      .then((r) => r.json())
      .then((d) => {
        if (simSnapshot) setSimSnapshot({ ...simSnapshot, state: 'RUNNING' });
      })
      .catch(() => {});
  };

  const handleStopSim = () => {
    fetch('/api/simulation/stop', { method: 'POST' })
      .then((r) => r.json())
      .then((d) => {
        if (simSnapshot) setSimSnapshot({ ...simSnapshot, state: 'STOPPED' });
      })
      .catch(() => {});
  };

  const handleResetSim = () => {
    setSelectedTrack(null);
    fetch('/api/simulation/reset', { method: 'POST' })
      .then((r) => r.json())
      .then((d) => {
        if (d?.snapshot) setSimSnapshot(d.snapshot);
        fetchAllData();
      })
      .catch(() => {});
  };

  const handleSpeedChange = (speed) => {
    fetch('/api/simulation/speed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ speed })
    })
      .then((r) => r.json())
      .then((d) => {
        if (d?.speed && simSnapshot) setSimSnapshot({ ...simSnapshot, speed: d.speed });
      })
      .catch(() => {});
  };

  const handleScenarioChange = (scenarioKey) => {
    handleStartSim(scenarioKey, simSnapshot?.speed || 1.0);
  };

  const handleToggleAutoCycle = () => {
    fetch('/api/simulation/auto-cycle', { method: 'POST' })
      .then((r) => r.json())
      .then((d) => {
        if (d?.success && simSnapshot) {
          setSimSnapshot({ ...simSnapshot, auto_cycle: d.auto_cycle });
        }
      })
      .catch(() => {});
  };

  // Alert Actions
  const handleAlertAction = (alertId, action) => {
    fetch(`/api/alerts/${alertId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, officer: 'Inspector V. Raman' })
    }).then(() => {
      fetch('/api/alerts').then((r) => r.json()).then((d) => d?.alerts && setAlerts(d.alerts));
      fetch('/api/incidents').then((r) => r.json()).then((d) => d?.incidents && setIncidents(d.incidents));
    });
  };

  // Operator Portal actions
  const handleRegisterDrone = (droneData) => {
    fetch('/api/drones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(droneData)
    }).then(() => fetch('/api/drones').then((r) => r.json()).then((d) => d?.drones && setDrones(d.drones)));
  };

  const handleRequestPermission = (permData) => {
    fetch('/api/permissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(permData)
    }).then(() => fetch('/api/permissions').then((r) => r.json()).then((d) => d?.permissions && setPermissions(d.permissions)));
  };

  const handleApprovePermission = (permId) => {
    fetch(`/api/permissions/${permId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'APPROVED', officer: 'Inspector V. Raman' })
    }).then(() => fetch('/api/permissions').then((r) => r.json()).then((d) => d?.permissions && setPermissions(d.permissions)));
  };

  const handleRejectPermission = (permId) => {
    fetch(`/api/permissions/${permId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'REJECTED', officer: 'Inspector V. Raman' })
    }).then(() => fetch('/api/permissions').then((r) => r.json()).then((d) => d?.permissions && setPermissions(d.permissions)));
  };

  const handleCreateZone = (zoneData) => {
    fetch('/api/zones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(zoneData)
    }).then(() => fetch('/api/zones').then((r) => r.json()).then((d) => d?.zones && setZones(d.zones)));
  };

  const handleImportGeoJSON = async (parsedGeoJSON) => {
    const token = localStorage.getItem('aeroguard_token') || 'aerosec-admin-token';
    const res = await fetch('/api/zones/import-geojson', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(parsedGeoJSON)
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to import GeoJSON');
    }
    await fetchAllData();
    return data;
  };

  const handleUpdateIncident = (incId, updateData) => {
    fetch(`/api/incidents/${incId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    }).then(() => fetch('/api/incidents').then((r) => r.json()).then((d) => d?.incidents && setIncidents(d.incidents)));
  };

  // Full 21-Step One-Click Surveillance Demonstration
  const runFullDemo = () => {
    setTab('overview');
    setIsDemoRunning(true);
    setDemoStep(1);

    handleStartSim('RESTRICTED_INTRUSION', 2.0);

    let step = 1;
    const interval = setInterval(() => {
      step += 1;
      setDemoStep(step);
      if (step >= 21) {
        clearInterval(interval);
        setTimeout(() => {
          setIsDemoRunning(false);
        }, 4000);
      }
    }, 1500);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login', { replace: true });
  };

  const currentTrack = simSnapshot?.current_track;
  const historyTrail = simSnapshot?.history_trail;
  const liveEvents = simSnapshot?.live_events;
  const threatMood = simSnapshot?.threat_mood || 'NORMAL';

  return (
    <div className="flex flex-col h-screen w-screen bg-aerodark-950 text-slate-100 overflow-hidden font-sans">
      {/* Top Bar with Live DEFCON Mood */}
      <TopBar
        systemHealth={systemHealth}
        ingestionMetrics={simSnapshot?.ingestion_metrics}
        connectionStatus={connectionStatus}
        onRunDemo={runFullDemo}
        isDemoRunning={isDemoRunning}
        currentRole={currentRole}
        threatMood={threatMood}
        onOpenRadar={() => setIsRadarModalOpen(true)}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        notificationHistory={notificationHistory}
        onClearHistory={() => setNotificationHistory([])}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main Container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Navigation */}
        <Navigation
          currentTab={currentTab}
          setTab={setTab}
          alertCount={alerts?.filter((a) => a.status === 'ACTIVE').length || 0}
          incidentCount={incidents?.filter((i) => i.status === 'OPEN').length || 0}
          pendingPermCount={permissions?.filter((p) => p.status === 'PENDING').length || 0}
        />

        {/* View Content Area with Dynamic Atmospheric Perimeter Mood */}
        <main className={`flex-1 overflow-hidden flex flex-col bg-aerodark-950 transition-all duration-500 ${
          threatMood === 'CRITICAL'
            ? 'shadow-[inset_0_0_40px_rgba(239,68,68,0.08)] border-l-2 border-red-500/50'
            : threatMood === 'WARNING'
            ? 'shadow-[inset_0_0_30px_rgba(245,158,11,0.06)] border-l-2 border-amber-500/50'
            : threatMood === 'AUTHORIZED'
            ? 'shadow-[inset_0_0_30px_rgba(16,185,129,0.05)] border-l-2 border-emerald-500/40'
            : threatMood === 'WILDLIFE'
            ? 'shadow-[inset_0_0_30px_rgba(56,189,248,0.05)] border-l-2 border-sky-500/40'
            : threatMood === 'AIRCRAFT'
            ? 'shadow-[inset_0_0_30px_rgba(99,102,241,0.05)] border-l-2 border-indigo-500/40'
            : 'border-l border-aerodark-700'
        }`}>
          {currentTab === 'overview' && (
            <div className="flex flex-col h-full overflow-hidden p-2.5 space-y-2.5">
              {/* Dynamic Atmospheric Threat Mood Banner */}
              <div className={`shrink-0 rounded-xl px-4 py-2.5 text-xs transition-all duration-500 flex items-center justify-between shadow-sm border ${
                threatMood === 'CRITICAL'
                  ? 'bg-aerodark-850 border-red-500/40 text-red-300'
                  : threatMood === 'WARNING'
                  ? 'bg-aerodark-850 border-amber-500/40 text-amber-300'
                  : threatMood === 'AUTHORIZED'
                  ? 'bg-aerodark-850 border-emerald-500/30 text-emerald-300'
                  : threatMood === 'WILDLIFE'
                  ? 'bg-aerodark-850 border-sky-500/30 text-sky-300'
                  : threatMood === 'AIRCRAFT'
                  ? 'bg-aerodark-850 border-indigo-500/30 text-indigo-300'
                  : 'bg-aerodark-850 border-aerodark-700 text-slate-300'
              }`}>
                <div className="flex items-center space-x-3.5">
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    threatMood === 'CRITICAL'
                      ? 'bg-red-500 ring-4 ring-red-500/20'
                      : threatMood === 'WARNING'
                      ? 'bg-amber-500 ring-4 ring-amber-500/20'
                      : threatMood === 'AUTHORIZED'
                      ? 'bg-emerald-500 ring-4 ring-emerald-500/20'
                      : threatMood === 'WILDLIFE'
                      ? 'bg-sky-400 ring-4 ring-sky-400/20'
                      : 'bg-indigo-400 ring-4 ring-indigo-400/20'
                  }`}></div>
                  <div>
                    <div className="font-semibold tracking-wide uppercase text-xs flex items-center space-x-2 text-slate-100">
                      <span>
                        {threatMood === 'CRITICAL' && 'AIRSPACE DEFENSE ALERT: RESTRICTED SECTOR INTRUSION'}
                        {threatMood === 'WARNING' && 'TACTICAL ADVISORY: UNIDENTIFIED DRONE APPROACHING MARITIME SECTOR'}
                        {threatMood === 'AUTHORIZED' && 'CIVIL AIRSPACE SECURE: AUTHORIZED COMMERCIAL DRONE DETECTED'}
                        {threatMood === 'WILDLIFE' && 'ECOLOGICAL NORMAL: MARINE SEA BIRD FLOCK DETECTED'}
                        {threatMood === 'AIRCRAFT' && 'CIVIL AIRWAYS CORRIDOR: HIGH-ALTITUDE COMMERCIAL FLIGHT'}
                        {threatMood === 'NORMAL' && 'AIRSPACE PATROL: MONITORING CHENNAI COASTAL DEFENSE SECTOR'}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-aerodark-800 border border-aerodark-700 text-slate-300 font-mono font-medium">
                        {currentTrack?.object_type || 'TARGET'} ({((currentTrack?.radar_confidence || 0.96) * 100).toFixed(1)}%)
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-normal mt-0.5">
                      {threatMood === 'CRITICAL' && 'Unregistered UAV incursion near INS Adyar Naval Exclusion Zone. Civil law enforcement alert dispatched & evidence logged.'}
                      {threatMood === 'WARNING' && 'Micro-Doppler signature classified as DRONE without DGCA flight permit. Law enforcement advisory issued.'}
                      {threatMood === 'AUTHORIZED' && 'Tamil Nadu Port Authority inspection (PERM-2026-081) verified by DGCA civil registry.'}
                      {threatMood === 'WILDLIFE' && 'Organic Micro-Doppler wing oscillation detected with zero defense threat.'}
                      {threatMood === 'AIRCRAFT' && 'Commercial passenger aircraft on Chennai approach corridor. Altitude: 2,400m AGL.'}
                      {threatMood === 'NORMAL' && 'Autonomous radar surveillance and optical sensor cueing active.'}
                    </div>
                  </div>
                </div>

                {/* Live Sector Rotation Countdown */}
                <div className="hidden sm:flex items-center space-x-2 shrink-0 pl-3.5 border-l border-aerodark-700 text-xs">
                  <span className="text-slate-400 font-medium uppercase text-[10px] tracking-wider">Autonomous Rotation</span>
                  <span className="font-mono text-[11px] font-medium px-2 py-0.5 rounded-md bg-aerodark-800 border border-aerodark-700 text-slate-200">
                    {simSnapshot?.auto_cycle ? `CYCLING IN ${simSnapshot?.seconds_until_cycle || 0}s` : 'MANUAL HOLD'}
                  </span>
                </div>
              </div>

              {/* Incoming Flight Approval Notification Strip */}
              {permissions?.filter((p) => p.status === 'PENDING').length > 0 && (
                <div className="shrink-0 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-2 flex items-center justify-between text-xs text-amber-200 shadow-sm animate-fadeIn">
                  <div className="flex items-center space-x-2.5">
                    <Clock className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
                    <span>
                      <strong className="text-amber-300 font-semibold">{permissions.filter((p) => p.status === 'PENDING').length} Civilian Drone Flight Request(s)</strong> awaiting law enforcement adjudication.
                    </span>
                  </div>
                  <button
                    onClick={() => setTab('permissions')}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold px-2.5 py-1 rounded-md text-[11px] transition-all shadow-sm flex items-center space-x-1"
                  >
                    <span>REQUEST APPROVAL</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Simulation Controls Top Strip */}
              <SimulationControls
                simState={simSnapshot?.state || 'STOPPED'}
                scenarios={scenarios}
                activeScenarioKey={simSnapshot?.active_scenario?.id || 'RESTRICTED_INTRUSION'}
                speed={simSnapshot?.speed || 1.0}
                autoCycle={simSnapshot?.auto_cycle ?? true}
                secondsUntilCycle={simSnapshot?.seconds_until_cycle || 0}
                onStart={handleStartSim}
                onPause={handlePauseSim}
                onResume={handleResumeSim}
                onStop={handleStopSim}
                onReset={handleResetSim}
                onSpeedChange={handleSpeedChange}
                onScenarioChange={handleScenarioChange}
                onToggleAutoCycle={handleToggleAutoCycle}
              />

              {/* Upper Section: Live Map & Live Detection Card */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5 flex-1 min-h-[340px] overflow-hidden">
                {/* Left 2 Cols: Leaflet OpenStreetMap */}
                <div className="lg:col-span-2 h-full rounded-xl border border-aerodark-700 overflow-hidden shadow-sm bg-aerodark-850 flex flex-col relative z-0 isolate">
                  {/* Multi-object track selector bar if multiple tracks */}
                  {simSnapshot?.tracks && simSnapshot.tracks.length > 1 && (
                    <div className="bg-aerodark-900/90 border-b border-aerodark-700 px-3 py-1.5 flex items-center space-x-2 text-xs overflow-x-auto shrink-0">
                      <span className="text-slate-400 font-medium uppercase text-[10px] tracking-wider">Active Targets:</span>
                      {simSnapshot.tracks.map((t) => {
                        const isSel = (selectedTrack?.track_id || currentTrack?.track_id) === t.track_id;
                        let badgeCol = 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10';
                        if (t.risk_level === 'CRITICAL' || t.alert_classification === 'OUT_OF_ENVELOPE') badgeCol = 'border-red-500/40 text-red-300 bg-red-500/10';
                        else if (t.risk_level === 'HIGH' || t.alert_classification === 'UNREGISTERED') badgeCol = 'border-amber-500/40 text-amber-300 bg-amber-500/10';
                        return (
                          <button
                            key={t.track_id}
                            onClick={() => setSelectedTrack(t)}
                            className={`px-2 py-0.5 rounded border text-[11px] font-mono font-medium transition-all cursor-pointer flex items-center space-x-1.5 ${badgeCol} ${isSel ? 'ring-2 ring-aerocyan-400 font-bold' : 'opacity-70 hover:opacity-100'}`}
                          >
                            <span>{t.track_id}</span>
                            <span className="text-[9px] opacity-80">({t.object_type})</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  <div className="flex-1 relative overflow-hidden isolate z-0">
                    <LiveMap
                      track={selectedTrack || currentTrack}
                      tracks={simSnapshot?.active_tracks || simSnapshot?.tracks || (currentTrack ? [currentTrack] : [])}
                      historyTrail={historyTrail}
                      zones={zones}
                      cameras={cameras}
                      selectedCamera={selectedCamera}
                      onSelectCamera={setSelectedCamera}
                      onSelectTrack={setSelectedTrack}
                      pinnedTarget={pinnedTarget}
                      onZoneCreated={fetchAllData}
                    />
                  </div>
                </div>

                {/* Right Col: Live Detection Card & Threat Alerts */}
                <div className="flex flex-col space-y-2.5 h-full overflow-hidden">
                  <div className="shrink-0">
                    <LiveDetectionCard track={selectedTrack || currentTrack} />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <AlertsPanel
                      alerts={alerts}
                      liveEvents={liveEvents}
                      onAlertAction={handleAlertAction}
                      onRefreshAlerts={fetchAllData}
                    />
                  </div>
                </div>
              </div>

              {/* Lower Section: Radar Pipeline + Camera Fusion Panel */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 shrink-0 min-h-[290px]">
                <RadarPipelinePanel
                  currentTrack={selectedTrack || currentTrack}
                  demoSamples={demoSamples}
                  onOpenRadar={() => setIsRadarModalOpen(true)}
                  onClassifySample={(sample) => {
                    fetch('/api/radar/predict', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ features: sample.features })
                    });
                  }}
                />

                <CameraFusionPanel
                  currentTrack={selectedTrack || currentTrack}
                  cameras={cameras}
                  selectedCamera={selectedCamera}
                  onSelectCamera={setSelectedCamera}
                />
              </div>
            </div>
          )}

          {currentTab === 'radar' && (
            <div className="p-4 overflow-y-auto h-full space-y-4 max-w-6xl mx-auto">
              <RadarPipelinePanel
                currentTrack={currentTrack}
                demoSamples={demoSamples}
                onOpenRadar={() => setIsRadarModalOpen(true)}
                onClassifySample={(sample) => {
                  fetch('/api/radar/predict', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ features: sample.features })
                  });
                }}
              />
              <div className="bg-aerodark-900 border border-aerodark-700 p-4 rounded text-xs font-mono">
                <div className="text-slate-300 font-bold mb-2 uppercase">ASTRA Micro-Doppler Theory & Signal Characteristics</div>
                <div className="text-slate-400 space-y-2 leading-relaxed">
                  <p>
                    ASTRA evaluates 300 discrete frequency/amplitude features extracted from X-band radar reflection return sweeps. Each object class introduces distinct physical Doppler signatures:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-slate-300">
                    <li><strong>DRONE:</strong> Rapid rotor micro-Doppler modulation sidebands around carrier frequency.</li>
                    <li><strong>BIRD:</strong> Periodic wing-flapping frequency shifts with low-amplitude organic radar cross section (RCS).</li>
                    <li><strong>AIRCRAFT:</strong> High RCS bulk velocity shift without micro-Doppler blade harmonics.</li>
                    <li><strong>HELICOPTER / STEALTH UAV:</strong> Distinct low-frequency high-power rotor modulation.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {currentTab === 'camera' && (
            <div className="p-4 overflow-y-auto h-full space-y-4 max-w-6xl mx-auto">
              <CameraFusionPanel
                currentTrack={currentTrack}
                cameras={cameras}
                selectedCamera={selectedCamera}
                onSelectCamera={setSelectedCamera}
              />
            </div>
          )}

          {currentTab === 'tracks' && (
            <div className="p-4 overflow-y-auto h-full space-y-4 max-w-6xl mx-auto">
              <div className="bg-aerodark-850 border border-aerodark-700 rounded-xl p-5 shadow-sm">
                <div className="font-semibold text-slate-200 mb-3 text-xs uppercase tracking-wider">
                  Active Airspace Track Table
                </div>
                <div className="overflow-x-auto rounded-lg border border-aerodark-700/60">
                  <table className="w-full text-left font-mono text-xs">
                    <thead className="text-slate-400 border-b border-aerodark-700 bg-aerodark-900">
                      <tr>
                        <th className="px-3.5 py-2.5 font-medium text-[11px] tracking-wider uppercase">Track ID</th>
                        <th className="px-3.5 py-2.5 font-medium text-[11px] tracking-wider uppercase">Object Type</th>
                        <th className="px-3.5 py-2.5 font-medium text-[11px] tracking-wider uppercase">Radar Conf</th>
                        <th className="px-3.5 py-2.5 font-medium text-[11px] tracking-wider uppercase">Altitude</th>
                        <th className="px-3.5 py-2.5 font-medium text-[11px] tracking-wider uppercase">Speed</th>
                        <th className="px-3.5 py-2.5 font-medium text-[11px] tracking-wider uppercase">Heading</th>
                        <th className="px-3.5 py-2.5 font-medium text-[11px] tracking-wider uppercase">Fusion Status</th>
                        <th className="px-3.5 py-2.5 font-medium text-[11px] tracking-wider uppercase">Risk</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-300 divide-y divide-aerodark-700/40">
                      {((simSnapshot?.tracks && simSnapshot.tracks.length > 0) ? simSnapshot.tracks : (currentTrack ? [currentTrack] : [])).length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-3.5 py-6 text-center text-slate-500 font-sans">
                            No active airspace tracks detected in primary radar sweep sector.
                          </td>
                        </tr>
                      ) : (
                        ((simSnapshot?.tracks && simSnapshot.tracks.length > 0) ? simSnapshot.tracks : (currentTrack ? [currentTrack] : [])).map((tr) => (
                          <tr key={tr.track_id} className="hover:bg-aerodark-800/50 transition-colors">
                            <td className="px-3.5 py-2.5 font-bold text-blue-400">{tr.track_id}</td>
                            <td className="px-3.5 py-2.5 text-slate-200 font-sans font-medium">{tr.object_type || 'DRONE'}</td>
                            <td className="px-3.5 py-2.5 text-emerald-400 font-medium">{(((tr.radar_confidence ?? 0.96)) * 100).toFixed(1)}%</td>
                            <td className="px-3.5 py-2.5 text-slate-300">{Math.round(tr.altitude_m || 0)}m</td>
                            <td className="px-3.5 py-2.5 text-slate-300">{Math.round(tr.speed_mps || 0)} m/s</td>
                            <td className="px-3.5 py-2.5 text-slate-300">{Math.round(tr.heading_deg || 0)}°</td>
                            <td className="px-3.5 py-2.5">
                              <span className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-md font-sans font-medium text-[10px]">
                                {tr.fusion?.display_status || tr.fusion_status || 'CORRELATED'}
                              </span>
                            </td>
                            <td className="px-3.5 py-2.5">
                              <span className={`${
                                (tr.risk?.level || tr.risk_level) === 'CRITICAL' || (tr.risk?.level || tr.risk_level) === 'HIGH'
                                  ? 'bg-red-500/15 border-red-500/30 text-red-300'
                                  : (tr.risk?.level || tr.risk_level) === 'MEDIUM'
                                  ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                                  : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                              } border px-2 py-0.5 rounded-md font-sans font-medium text-[10px]`}>
                                {tr.risk?.level || tr.risk_level || 'LOW'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {currentTab === 'permissions' && (
            <PermissionsRegistryView
              drones={drones}
              permissions={permissions}
              zones={zones}
              onApprovePermission={handleApprovePermission}
              onRejectPermission={handleRejectPermission}
              onRequestPermission={handleRequestPermission}
            />
          )}

          {currentTab === 'registry' && (
            <DroneRegistryView
              drones={drones}
              onRegisterDrone={handleRegisterDrone}
              onRefreshDrones={fetchAllData}
            />
          )}

          {currentTab === 'zones' && (
            <RestrictedZonesView
              zones={zones}
              onCreateZone={handleCreateZone}
              onImportGeoJSON={handleImportGeoJSON}
            />
          )}

          {currentTab === 'alerts' && (
            <div className="p-4 overflow-y-auto h-full max-w-4xl mx-auto">
              <AlertsPanel
                alerts={alerts}
                liveEvents={liveEvents}
                onAlertAction={handleAlertAction}
                onRefreshAlerts={fetchAllData}
              />
            </div>
          )}

          {currentTab === 'incidents' && (
            <IncidentsEvidenceView
              incidents={incidents}
              selectedIncident={selectedIncident}
              onSelectIncident={setSelectedIncident}
              onUpdateIncident={handleUpdateIncident}
            />
          )}

          {currentTab === 'models' && <AITransparencyView systemHealth={systemHealth} />}

          {currentTab === 'audit' && <AuditLogView logs={auditLogs} onRefresh={fetchAllData} />}

          {currentTab === 'settings' && (
            <div className="bg-aerodark-900 border border-aerodark-700 rounded-xl p-6 max-w-xl space-y-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Console Operational Settings</h2>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-aerodark-800">
                  <span className="text-slate-400">SURVEILLANCE RADAR STATION</span>
                  <strong className="text-slate-200">INS Adyar Naval Command (13.065°N, 80.295°E)</strong>
                </div>
                <div className="flex justify-between py-2 border-b border-aerodark-800">
                  <span className="text-slate-400">ASTRA ML CONFIDENCE THRESHOLD</span>
                  <strong className="text-emerald-400 font-mono">0.85 (85%)</strong>
                </div>
                <div className="flex justify-between py-2 border-b border-aerodark-800">
                  <span className="text-slate-400">OPTICAL SENSOR FUSION CUEING</span>
                  <strong className="text-blue-400">AUTOMATIC SPATIAL LOCK</strong>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-400">LOGGED IN OFFICER</span>
                  <strong className="text-slate-200">{user?.full_name || 'Inspector V. Raman'}</strong>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Real-time Tactical Pop-up Notification Toasts for Drones and Electronic Signals */}
      <NotificationToasts
        currentTrack={currentTrack}
        onPinTarget={(trk) => {
          const target = trk || currentTrack;
          setPinnedTarget(target);
          setSelectedTrack(target);
          setTab('overview');
        }}
        onOpenRadar={() => setIsRadarModalOpen(true)}
        soundEnabled={soundEnabled}
        onAddNotification={handleAddNotification}
      />

      {/* Pop-Out Tactical PPI Radar Scope & Electronic SIGINT Spectrum Window Modal */}
      <TacticalRadarModal
        isOpen={isRadarModalOpen}
        onClose={() => setIsRadarModalOpen(false)}
        currentTrack={currentTrack}
        historyTrail={historyTrail}
        zones={zones}
        cameras={cameras}
        tracks={simSnapshot?.tracks || (currentTrack ? [currentTrack] : [])}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        onPinTarget={(trk) => {
          const target = trk || currentTrack;
          setPinnedTarget(target);
          setSelectedTrack(target);
          setTab('overview');
        }}
      />

      {/* 21-Step Walkthrough Demonstration Overlay */}
      <DemoWalkthroughModal
        currentStep={demoStep}
        isOpen={isDemoRunning}
        onClose={() => setIsDemoRunning(false)}
      />
    </div>
  );
}
