import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { 
  Radar, 
  X, 
  Maximize2, 
  Minimize2, 
  Volume2, 
  VolumeX, 
  ExternalLink, 
  Radio, 
  Wifi, 
  ShieldAlert, 
  Activity, 
  Crosshair, 
  FileText,
  ShieldCheck,
  RotateCw,
  Compass,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Layers
} from 'lucide-react';
import { playTacticalSound } from './NotificationToasts';

export default function TacticalRadarModal({
  isOpen,
  onClose,
  currentTrack,
  historyTrail = [],
  zones = [],
  cameras = [],
  tracks = [],
  soundEnabled = true,
  onToggleSound,
  onPinTarget
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [modalView, setModalView] = useState('PPI'); // 'PPI' or 'MAP'
  const [rangeScaleM, setRangeScaleM] = useState(3000); // 1000m, 3000m, 5000m
  const [sweepSpeedSec, setSweepSpeedSec] = useState(3.0); // 1.5s, 3.0s, 5.0s
  const [colorTheme, setColorTheme] = useState('CYAN'); // CYAN, GREEN, AMBER, STEALTH
  const [evidenceLogged, setEvidenceLogged] = useState(false);
  const [audioPingSweep, setAudioPingSweep] = useState(true);

  const leafletContainerRef = useRef(null);
  const leafletMapRef = useRef(null);
  const leafletMarkersRef = useRef([]);

  // Station Center (Chennai Naval Coastal Ops Center)
  const stationLat = 13.065;
  const stationLon = 80.295;

  // Sound ping on sweep revolutions
  useEffect(() => {
    if (!isOpen || !soundEnabled || !audioPingSweep || isMinimized) return;
    const interval = setInterval(() => {
      playTacticalSound('ping', true);
    }, sweepSpeedSec * 1000);
    return () => clearInterval(interval);
  }, [isOpen, soundEnabled, audioPingSweep, sweepSpeedSec, isMinimized]);

  // Leaflet Map Initialization & Invalidation
  useEffect(() => {
    if (!isOpen || isMinimized || modalView !== 'MAP' || !leafletContainerRef.current) return;

    if (!leafletMapRef.current) {
      const map = L.map(leafletContainerRef.current, {
        center: [currentTrack?.latitude || stationLat, currentTrack?.longitude || stationLon],
        zoom: 14,
        minZoom: 5,
        maxZoom: 18,
        zoomControl: false,
        attributionControl: false
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        subdomains: ['a', 'b', 'c'],
        className: 'dark-tiles'
      }).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Station Marker
      const stationIcon = L.divIcon({
        className: 'station-marker',
        html: '<div style="width:16px;height:16px;border-radius:50%;background:#38BDF8;border:2px solid #fff;box-shadow:0 0 10px #38BDF8;"></div>',
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });
      L.marker([stationLat, stationLon], { icon: stationIcon })
        .addTo(map)
        .bindTooltip('STATION: CHENNAI NAVAL COASTAL RADAR', { permanent: false, direction: 'top' });

      // Range Rings from station
      [1000, 3000, 5000].forEach((r) => {
        L.circle([stationLat, stationLon], {
          radius: r,
          color: '#38BDF8',
          weight: 1,
          opacity: 0.4,
          fillColor: '#38BDF8',
          fillOpacity: 0.03,
          dashArray: '4, 4'
        }).addTo(map);
      });

      leafletMapRef.current = map;
    }

    // Call map.invalidateSize() to guarantee full tile loading with zero blank areas
    const resizeTimer1 = setTimeout(() => {
      if (leafletMapRef.current) leafletMapRef.current.invalidateSize();
    }, 50);
    const resizeTimer2 = setTimeout(() => {
      if (leafletMapRef.current) leafletMapRef.current.invalidateSize();
    }, 200);
    const resizeTimer3 = setTimeout(() => {
      if (leafletMapRef.current) leafletMapRef.current.invalidateSize();
    }, 450);

    const handleWindowResize = () => {
      if (leafletMapRef.current) leafletMapRef.current.invalidateSize();
    };
    window.addEventListener('resize', handleWindowResize);

    return () => {
      clearTimeout(resizeTimer1);
      clearTimeout(resizeTimer2);
      clearTimeout(resizeTimer3);
      window.removeEventListener('resize', handleWindowResize);
    };
  }, [isOpen, isMinimized, modalView, isFullscreen]);

  // Update target marker on Leaflet map
  useEffect(() => {
    if (!leafletMapRef.current || modalView !== 'MAP') return;
    const map = leafletMapRef.current;

    // Clear previous target markers
    leafletMarkersRef.current.forEach(m => map.removeLayer(m));
    leafletMarkersRef.current = [];

    // Draw active target
    if (currentTrack && currentTrack.latitude && currentTrack.longitude) {
      const isCritical = currentTrack?.risk?.level === 'CRITICAL';
      const isWarning = currentTrack?.risk?.level === 'HIGH';
      const mColor = isCritical ? '#EF4444' : isWarning ? '#F59E0B' : '#10B981';

      const targetIcon = L.divIcon({
        className: 'tactical-target-icon',
        html: `<div style="position:relative;width:24px;height:24px;display:flex;align-items:center;justify-content:center;">
                 <div style="position:absolute;width:24px;height:24px;border-radius:50%;border:2px solid ${mColor};animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;opacity:0.75;"></div>
                 <div style="width:12px;height:12px;border-radius:50%;background:${mColor};border:2px solid #fff;box-shadow:0 0 10px ${mColor};"></div>
               </div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const marker = L.marker([currentTrack.latitude, currentTrack.longitude], { icon: targetIcon })
        .addTo(map)
        .bindPopup(`<b>${currentTrack.track_id}</b><br/>Type: ${currentTrack.object_type}<br/>Alt: ${currentTrack.altitude_m}m<br/>Speed: ${currentTrack.speed_mps}m/s`);
      leafletMarkersRef.current.push(marker);

      // Draw history trail
      if (historyTrail && historyTrail.length > 1) {
        const polyline = L.polyline(historyTrail, {
          color: mColor,
          weight: 2,
          opacity: 0.6,
          dashArray: '3, 6'
        }).addTo(map);
        leafletMarkersRef.current.push(polyline);
      }
    }

    // Draw other simultaneous contacts on tactical map
    if (tracks && tracks.length > 0) {
      tracks.forEach((t) => {
        if (!t.latitude || !t.longitude || t.track_id === currentTrack?.track_id) return;
        const isCrit = t?.risk?.level === 'CRITICAL' || t?.alert_classification === 'OUT_OF_ENVELOPE';
        const isWarn = t?.risk?.level === 'HIGH' || t?.alert_classification === 'UNREGISTERED';
        const tColor = isCrit ? '#EF4444' : isWarn ? '#F59E0B' : t.object_type === 'BIRD' ? '#38BDF8' : t.object_type === 'AIRCRAFT' ? '#818CF8' : '#10B981';

        const subIcon = L.divIcon({
          className: 'tactical-target-icon-sub',
          html: `<div style="position:relative;width:18px;height:18px;display:flex;align-items:center;justify-content:center;cursor:pointer;">
                   <div style="width:10px;height:10px;border-radius:50%;background:${tColor};border:1.5px solid #fff;box-shadow:0 0 8px ${tColor};"></div>
                   <div style="position:absolute;top:-15px;background:#0F172A;color:${tColor};font-family:monospace;font-size:8px;font-weight:bold;padding:0 3px;border-radius:2px;border:1px solid ${tColor};white-space:nowrap;">${t.track_id}</div>
                 </div>`,
          iconSize: [18, 18],
          iconAnchor: [9, 9]
        });

        const subMarker = L.marker([t.latitude, t.longitude], { icon: subIcon })
          .addTo(map)
          .bindPopup(`<b>${t.track_id}</b> (${t.object_type})<br/>Alt: ${t.altitude_m}m | Speed: ${t.speed_mps}m/s`);

        subMarker.on('click', () => {
          if (onPinTarget) onPinTarget(t);
        });
        leafletMarkersRef.current.push(subMarker);
      });
    }
  }, [currentTrack, tracks, historyTrail, modalView]);

  if (!isOpen) return null;

  // Calculate Polar Coordinates (R, Bearing Theta) from Station to Track
  const targetLat = currentTrack?.latitude || stationLat + 0.008;
  const targetLon = currentTrack?.longitude || stationLon + 0.005;

  const dLat = (targetLat - stationLat) * 111000;
  const dLon = (targetLon - stationLon) * 111000 * Math.cos((stationLat * Math.PI) / 180);
  const rawRange = Math.sqrt(dLat * dLat + dLon * dLon);
  const rangeM = Math.round(currentTrack?.range_m || rawRange);

  // Bearing in degrees (0° North, 90° East)
  let bearingDeg = Math.round((Math.atan2(dLon, dLat) * 180) / Math.PI);
  if (bearingDeg < 0) bearingDeg += 360;

  const getBearingText = (deg) => {
    if (deg >= 337.5 || deg < 22.5) return 'N';
    if (deg >= 22.5 && deg < 67.5) return 'NE';
    if (deg >= 67.5 && deg < 112.5) return 'E';
    if (deg >= 112.5 && deg < 157.5) return 'SE';
    if (deg >= 157.5 && deg < 202.5) return 'S';
    if (deg >= 202.5 && deg < 247.5) return 'SW';
    if (deg >= 247.5 && deg < 292.5) return 'W';
    return 'NW';
  };

  // Normalized Polar coordinates to percentage (Center is 50%, 50%)
  const maxR = rangeScaleM;
  const normalizedR = Math.min(0.92, rawRange / maxR);
  const radAngle = (bearingDeg - 90) * (Math.PI / 180);
  const blipX = 50 + normalizedR * 46 * Math.cos(radAngle);
  const blipY = 50 + normalizedR * 46 * Math.sin(radAngle);

  // History trail points normalized to radar
  const radarTrail = (historyTrail || []).slice(-15).map(([hLat, hLon]) => {
    const dhLat = (hLat - stationLat) * 111000;
    const dhLon = (hLon - stationLon) * 111000 * Math.cos((stationLat * Math.PI) / 180);
    const hRange = Math.sqrt(dhLat * dhLat + dhLon * dhLon);
    let hBear = Math.round((Math.atan2(dhLon, dhLat) * 180) / Math.PI);
    if (hBear < 0) hBear += 360;
    const hNormR = Math.min(0.95, hRange / maxR);
    const hRad = (hBear - 90) * (Math.PI / 180);
    return {
      x: 50 + hNormR * 46 * Math.cos(hRad),
      y: 50 + hNormR * 46 * Math.sin(hRad)
    };
  });

  const themes = {
    CYAN: {
      primary: '#38BDF8',
      primaryGlow: 'rgba(56, 189, 248, 0.15)',
      ringBorder: 'rgba(56, 189, 248, 0.20)',
      crosshair: 'rgba(56, 189, 248, 0.15)',
      sweepGradient: 'linear-gradient(45deg, rgba(56, 189, 248, 0.25) 0%, rgba(56, 189, 248, 0) 70%)'
    },
    GREEN: {
      primary: '#10B981',
      primaryGlow: 'rgba(16, 185, 129, 0.15)',
      ringBorder: 'rgba(16, 185, 129, 0.20)',
      crosshair: 'rgba(16, 185, 129, 0.15)',
      sweepGradient: 'linear-gradient(45deg, rgba(16, 185, 129, 0.25) 0%, rgba(16, 185, 129, 0) 70%)'
    },
    AMBER: {
      primary: '#F59E0B',
      primaryGlow: 'rgba(245, 158, 11, 0.15)',
      ringBorder: 'rgba(245, 158, 11, 0.20)',
      crosshair: 'rgba(245, 158, 11, 0.15)',
      sweepGradient: 'linear-gradient(45deg, rgba(245, 158, 11, 0.25) 0%, rgba(245, 158, 11, 0) 70%)'
    },
    STEALTH: {
      primary: '#EF4444',
      primaryGlow: 'rgba(239, 68, 68, 0.15)',
      ringBorder: 'rgba(239, 68, 68, 0.20)',
      crosshair: 'rgba(239, 68, 68, 0.15)',
      sweepGradient: 'linear-gradient(45deg, rgba(239, 68, 68, 0.25) 0%, rgba(239, 68, 68, 0) 70%)'
    }
  };

  const currentTheme = themes[colorTheme] || themes.CYAN;
  const intel = currentTrack?.electronic_intel || {};
  const riskLevel = currentTrack?.risk?.level || 'LOW';

  const blipColor = 
    riskLevel === 'CRITICAL' || currentTrack?.object_type === 'HELICOPTER / STEALTH UAV' ? '#EF4444' :
    riskLevel === 'HIGH' ? '#F59E0B' :
    currentTrack?.object_type === 'BIRD' ? '#38BDF8' :
    currentTrack?.object_type === 'AIRCRAFT' ? '#818CF8' : '#10B981';

  // Compute Polar coordinates for all concurrent contacts in airspace
  const otherBlips = (tracks || [])
    .filter((t) => t.track_id && t.track_id !== currentTrack?.track_id && t.latitude && t.longitude)
    .map((t) => {
      const dtLat = (t.latitude - stationLat) * 111000;
      const dtLon = (t.longitude - stationLon) * 111000 * Math.cos((stationLat * Math.PI) / 180);
      const tRange = Math.sqrt(dtLat * dtLat + dtLon * dtLon);
      let tBearing = Math.round((Math.atan2(dtLon, dtLat) * 180) / Math.PI);
      if (tBearing < 0) tBearing += 360;
      const tNormR = Math.min(0.95, tRange / maxR);
      const tRad = (tBearing - 90) * (Math.PI / 180);

      const tRisk = t?.risk?.level || t?.risk_level || 'LOW';
      const tBlipColor =
        tRisk === 'CRITICAL' || t?.alert_classification === 'OUT_OF_ENVELOPE'
          ? '#EF4444'
          : tRisk === 'HIGH' || t?.alert_classification === 'UNREGISTERED'
          ? '#F59E0B'
          : t?.object_type === 'BIRD'
          ? '#38BDF8'
          : t?.object_type === 'AIRCRAFT'
          ? '#818CF8'
          : '#10B981';

      return {
        track: t,
        x: 50 + tNormR * 46 * Math.cos(tRad),
        y: 50 + tNormR * 46 * Math.sin(tRad),
        color: tBlipColor,
        rangeM: Math.round(tRange),
        bearingDeg: tBearing,
        headingDeg: t.heading_deg
      };
    });

  // Pop-Out to Standalone External Browser Window (Dual-Monitor Ops)
  const handleOpenStandaloneWindow = () => {
    const win = window.open(
      '', 
      'AeroGuardRadarPopout', 
      'width=1100,height=800,menubar=no,toolbar=no,location=no,status=no'
    );
    if (!win) {
      alert('Pop-up window blocked by browser. Please allow pop-ups for this site.');
      return;
    }

    win.document.title = 'AeroGuard — Standalone Tactical Radar & SIGINT Scope';
    win.document.body.style.backgroundColor = '#030712';
    win.document.body.style.color = '#F3F4F6';
    win.document.body.style.fontFamily = 'monospace';
    win.document.body.style.margin = '0';
    win.document.body.style.overflow = 'hidden';

    win.document.body.innerHTML = `
      <div style="display: flex; flex-direction: column; height: 100vh; padding: 16px; background: #030712; color: #38BDF8; font-family: monospace;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1E293B; padding-bottom: 10px;">
          <div style="font-size: 16px; font-weight: bold; letter-spacing: 2px;">📡 AEROGUARD TACTICAL PPI RADAR SCOPE</div>
          <div style="font-size: 12px; color: #10B981; border: 1px solid #10B981; padding: 2px 8px; border-radius: 4px;">ACTIVE PPI FEED</div>
        </div>
        <div style="flex: 1; display: flex; align-items: center; justify-content: center; position: relative;">
          <div style="width: 480px; height: 480px; border-radius: 50%; border: 2px solid rgba(56, 189, 248, 0.4); position: relative; background: radial-gradient(circle, #082f49 0%, #030712 70%); display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 360px; height: 360px; border-radius: 50%; border: 1px solid rgba(56, 189, 248, 0.25);"></div>
            <div style="position: absolute; width: 240px; height: 240px; border-radius: 50%; border: 1px solid rgba(56, 189, 248, 0.25);"></div>
            <div style="position: absolute; width: 120px; height: 120px; border-radius: 50%; border: 1px solid rgba(56, 189, 248, 0.25);"></div>
            <div style="position: absolute; width: 100%; height: 1px; background: rgba(56, 189, 248, 0.3);"></div>
            <div style="position: absolute; height: 100%; width: 1px; background: rgba(56, 189, 248, 0.3);"></div>
            <div style="position: absolute; top: 38%; left: 62%; width: 14px; height: 14px; background: ${blipColor}; border: 2px solid #fff; border-radius: 50%; box-shadow: 0 0 15px ${blipColor};"></div>
            <div style="color: #fff; font-size: 11px; position: absolute; top: 32%; left: 66%; background: rgba(0,0,0,0.7); padding: 2px 6px; border: 1px solid #38BDF8;">
              ${currentTrack?.track_id || 'TRACK-0001'} | ${currentTrack?.object_type || 'DRONE'} | ${rangeM}m
            </div>
          </div>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 11px; background: #0f172a; padding: 8px 12px; border: 1px solid #1e293b; border-radius: 4px;">
          <span>RANGE: ${rangeM}m | BEARING: ${bearingDeg}° (${getBearingText(bearingDeg)})</span>
          <span>ALTITUDE: ${currentTrack?.altitude_m || 88}m | SPEED: ${currentTrack?.speed_mps || 18} m/s</span>
          <span>RF EMISSION: ${intel?.frequency_mhz || '2437'} MHz (${intel?.protocol || 'FHSS'})</span>
        </div>
      </div>
    `;
  };

  // Minimized Floating Pill
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-[9999] flex items-center space-x-3 bg-aerodark-900/95 border border-aerodark-700 p-2.5 rounded-xl shadow-xl backdrop-blur-md font-mono text-xs select-none">
        <div className="relative w-9 h-9 rounded-full border border-aerodark-700 bg-aerodark-950 flex items-center justify-center overflow-hidden shrink-0">
          <div 
            className="absolute inset-0 rounded-full animate-radar-sweep origin-center pointer-events-none"
            style={{ animationDuration: `${sweepSpeedSec}s` }}
          >
            <div className="w-1/2 h-1/2 absolute top-0 right-0 origin-bottom-left" style={{ background: currentTheme.sweepGradient }}></div>
          </div>
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: blipColor }}></div>
        </div>

        <div className="flex flex-col">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-200">RADAR SCOPE</span>
            <span className="text-[10px] text-blue-400 font-semibold">{currentTrack?.track_id || 'TRACK-0001'}</span>
          </div>
          <span className="text-[10px] text-slate-400">R: {rangeM}m | θ: {bearingDeg}° {getBearingText(bearingDeg)}</span>
        </div>

        <div className="flex items-center space-x-1 pl-2 border-l border-aerodark-700">
          <button
            onClick={() => setIsMinimized(false)}
            className="p-1.5 rounded-md text-slate-300 hover:text-white hover:bg-aerodark-800 transition-colors cursor-pointer"
            title="Restore Radar Window"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-red-400 hover:bg-aerodark-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm select-none animate-in fade-in-50 duration-200">
      {/* Main Centered Radar Scope Window Card */}
      <div 
        style={{
          width: isFullscreen ? '100vw' : 'min(1100px, 92vw)',
          height: isFullscreen ? '100vh' : 'min(750px, 88vh)',
          maxWidth: isFullscreen ? '100vw' : '95vw',
          maxHeight: isFullscreen ? '100vh' : '90vh'
        }}
        className="flex flex-col rounded-xl border border-aerodark-700 bg-aerodark-900 shadow-2xl overflow-hidden transition-all duration-200 relative"
      >
        {/* Modal Header: display: flex; justify-content: space-between; align-items: center */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 bg-aerodark-900 border-b border-aerodark-700 font-sans text-xs gap-3 shrink-0">
          {/* Radar Title Section */}
          <div className="flex items-center space-x-3 min-w-0 truncate">
            <div className="flex items-center space-x-2 shrink-0">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
              </span>
              <span className="font-semibold text-slate-100 tracking-wide uppercase text-xs sm:text-sm truncate">
                TACTICAL RADAR PPI SCOPE & ELECTRONIC SPECTRUM
              </span>
            </div>
            <span className="hidden lg:inline-block text-slate-600">|</span>
            <span className="hidden lg:inline-block text-[11px] text-slate-400 font-mono truncate">
              STATION: CHENNAI NAVAL COASTAL RADAR [13.065°N, 80.295°E]
            </span>
          </div>

          {/* Radar Action Section */}
          <div className="flex items-center space-x-2 shrink-0">
            {/* Audio Toggle */}
            <button
              onClick={onToggleSound}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                soundEnabled ? 'text-blue-400 bg-blue-600/15 border border-blue-500/30' : 'text-slate-500 hover:text-slate-300'
              }`}
              title={soundEnabled ? 'Mute Sonar Pings' : 'Enable Sonar Pings'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Standalone Window Pop-Out Button */}
            <button
              onClick={handleOpenStandaloneWindow}
              className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-blue-600/15 hover:bg-blue-600/25 text-blue-300 border border-blue-500/30 text-xs font-medium transition-all cursor-pointer"
              title="Pop out into separate external browser window for dual-monitor displays"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>2ND MONITOR</span>
            </button>

            {/* Minimize */}
            <button
              onClick={() => setIsMinimized(true)}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-aerodark-800 transition-colors cursor-pointer"
              title="Minimize to Floating Bar"
            >
              <Minimize2 className="w-4 h-4" />
            </button>

            {/* Maximize / Fullscreen */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-aerodark-800 transition-colors cursor-pointer"
              title={isFullscreen ? 'Restore Size' : 'Fullscreen'}
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-slate-400 hover:text-red-400 hover:bg-aerodark-800 transition-colors cursor-pointer"
              title="Close Radar Scope"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tactical Control Ribbon */}
        <div className="flex flex-wrap items-center justify-between px-4 sm:px-5 py-2 bg-aerodark-950/70 border-b border-aerodark-700 font-sans text-xs gap-2 shrink-0">
          {/* Target Summary Tag */}
          <div className="flex items-center space-x-2 flex-wrap">
            <span className="text-slate-400 uppercase text-[11px] font-medium">Target:</span>
            <span className="px-2 py-0.5 rounded-md font-mono font-semibold bg-aerodark-800 border border-aerodark-700 text-blue-400 text-xs">
              {currentTrack?.track_id || 'TRACK-0001'}
            </span>
            <span className="px-2 py-0.5 rounded-md font-medium bg-aerodark-800 border border-aerodark-700 text-slate-200 text-xs">
              {currentTrack?.object_type || 'DRONE'} ({((currentTrack?.radar_confidence || 0.96) * 100).toFixed(1)}%)
            </span>
            <span className={`px-2 py-0.5 rounded-md font-medium text-[10px] ${
              riskLevel === 'CRITICAL' ? 'bg-red-500/15 text-red-300 border border-red-500/30' :
              riskLevel === 'HIGH' ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' :
              'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
            }`}>
              DEFCON {riskLevel}
            </span>
          </div>

          {/* View Switcher: [📡 PPI SCOPE] | [🗺️ TACTICAL MAP] */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center bg-aerodark-850 p-0.5 rounded-lg border border-aerodark-700 font-sans text-[11px]">
              <button
                onClick={() => setModalView('PPI')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  modalView === 'PPI'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                📡 PPI SCOPE
              </button>
              <button
                onClick={() => setModalView('MAP')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  modalView === 'MAP'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🗺️ TACTICAL MAP
              </button>
            </div>

            {/* Radar Controls: Range, Speed, Theme */}
            <div className="hidden sm:flex items-center space-x-2 font-mono text-xs">
              <div className="flex items-center space-x-1">
                <span className="text-slate-400 font-sans text-[11px]">RANGE:</span>
                {[1000, 3000, 5000].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRangeScaleM(r)}
                    className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                      rangeScaleM === r
                        ? 'bg-blue-600 text-white font-medium shadow-sm'
                        : 'bg-aerodark-800 text-slate-400 hover:text-slate-200 border border-aerodark-700'
                    }`}
                  >
                    {r >= 1000 ? `${r / 1000}KM` : `${r}M`}
                  </button>
                ))}
              </div>

              {/* CRT Color Theme */}
              <div className="flex items-center space-x-1">
                {['CYAN', 'GREEN', 'AMBER', 'STEALTH'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setColorTheme(t)}
                    className={`w-3.5 h-3.5 rounded-full border transition-all cursor-pointer ${
                      colorTheme === t ? 'scale-125 border-white ring-2 ring-blue-500/50' : 'border-aerodark-700 opacity-60 hover:opacity-100'
                    }`}
                    style={{
                      backgroundColor:
                        t === 'CYAN' ? '#38BDF8' :
                        t === 'GREEN' ? '#10B981' :
                        t === 'AMBER' ? '#F59E0B' : '#EF4444'
                    }}
                    title={`Theme: ${t}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* View Mode 1: Interactive Tactical Leaflet Map */}
        {modalView === 'MAP' && (
          <div className="flex-1 w-full h-full min-h-[460px] relative overflow-hidden flex flex-col bg-aerodark-950">
            <div 
              ref={leafletContainerRef} 
              className="w-full h-full flex-1 relative z-10"
              style={{ minHeight: '440px', height: '100%', width: '100%' }}
            />
            {/* Map HUD Legend */}
            <div className="absolute bottom-4 left-4 z-20 bg-aerodark-900/90 border border-aerodark-700 p-2.5 rounded-lg shadow-xl backdrop-blur-md text-[11px] font-mono flex items-center space-x-3 text-slate-300">
              <div className="flex items-center space-x-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-400 border border-white"></div>
                <span>Station (0,0)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: blipColor }}></div>
                <span>Target: {currentTrack?.track_id || 'DRN-001'}</span>
              </div>
              <span className="text-slate-500">|</span>
              <span className="text-blue-300">R: {rangeM}m | θ: {bearingDeg}° {getBearingText(bearingDeg)}</span>
            </div>
          </div>
        )}

        {/* View Mode 2: Full PPI Polar Radar Scope Display & Electronic Spectrum */}
        {modalView === 'PPI' && (
          <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 min-h-0">
            {/* Left 7 Cols: PPI Polar Radar Scope Display */}
            <div className="lg:col-span-7 flex flex-col items-center justify-center p-3 rounded-xl bg-aerodark-950 border border-aerodark-700 relative overflow-hidden">
              {/* Tactical Polar Scope Container */}
              <div className="relative w-full max-w-[420px] aspect-square flex items-center justify-center">
                {/* Outer Azimuth Degrees Ring */}
                <div 
                  className="absolute inset-0 rounded-full border-2 flex items-center justify-center transition-colors duration-500"
                  style={{ borderColor: currentTheme.primary, boxShadow: `0 0 30px ${currentTheme.primaryGlow}` }}
                >
                  {/* 360° Compass Degree Markings */}
                  {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => {
                    const rad = (deg - 90) * (Math.PI / 180);
                    const x = 50 + 47 * Math.cos(rad);
                    const y = 50 + 47 * Math.sin(rad);
                    const label = deg === 0 ? '000° N' : deg === 90 ? '090° E' : deg === 180 ? '180° S' : deg === 270 ? '270° W' : `${deg.toString().padStart(3, '0')}°`;

                    return (
                      <div
                        key={deg}
                        className="absolute font-mono text-[9px] font-bold text-slate-400"
                        style={{
                          top: `${y}%`,
                          left: `${x}%`,
                          transform: 'translate(-50%, -50%)',
                          color: deg % 90 === 0 ? currentTheme.primary : undefined
                        }}
                      >
                        {label}
                      </div>
                    );
                  })}

                  {/* 15° Minor Radial Ticks */}
                  {[...Array(24)].map((_, i) => {
                    const deg = i * 15;
                    return (
                      <div
                        key={deg}
                        className="absolute w-full h-[1px] pointer-events-none"
                        style={{
                          transform: `rotate(${deg}deg)`,
                          background: `linear-gradient(to right, ${currentTheme.crosshair} 0%, transparent 8%, transparent 92%, ${currentTheme.crosshair} 100%)`
                        }}
                      />
                    );
                  })}
                </div>

                {/* Concentric Range Rings */}
                <div 
                  className="absolute inset-4 rounded-full border transition-colors duration-500"
                  style={{ borderColor: currentTheme.ringBorder }}
                >
                  <span className="absolute top-1 left-1/2 -translate-x-1/2 text-[9px] font-mono font-bold text-slate-400 bg-aerodark-950 px-1 rounded">
                    {rangeScaleM >= 1000 ? `${rangeScaleM / 1000}km` : `${rangeScaleM}m`}
                  </span>
                </div>

                <div 
                  className="absolute inset-16 rounded-full border transition-colors duration-500"
                  style={{ borderColor: currentTheme.ringBorder }}
                >
                  <span className="absolute top-1 left-1/2 -translate-x-1/2 text-[8px] font-mono text-slate-500 bg-aerodark-950 px-1 rounded">
                    {Math.round(rangeScaleM * 0.75)}m
                  </span>
                </div>

                <div 
                  className="absolute inset-28 rounded-full border transition-colors duration-500"
                  style={{ borderColor: currentTheme.ringBorder }}
                >
                  <span className="absolute top-1 left-1/2 -translate-x-1/2 text-[8px] font-mono text-slate-500 bg-aerodark-950 px-1 rounded">
                    {Math.round(rangeScaleM * 0.5)}m
                  </span>
                </div>

                <div 
                  className="absolute inset-40 rounded-full border transition-colors duration-500"
                  style={{ borderColor: currentTheme.ringBorder }}
                >
                  <span className="absolute top-1 left-1/2 -translate-x-1/2 text-[8px] font-mono text-slate-500 bg-aerodark-950 px-1 rounded">
                    {Math.round(rangeScaleM * 0.25)}m
                  </span>
                </div>

                {/* Crosshair Axes */}
                <div className="absolute w-full h-[1px] pointer-events-none" style={{ backgroundColor: currentTheme.crosshair }} />
                <div className="absolute h-full w-[1px] pointer-events-none" style={{ backgroundColor: currentTheme.crosshair }} />

                {/* Rotating PPI Radar Sweep Line */}
                <div 
                  className="absolute inset-4 rounded-full pointer-events-none animate-radar-sweep"
                  style={{ animationDuration: `${sweepSpeedSec}s` }}
                >
                  <div 
                    className="w-1/2 h-1/2 absolute top-0 right-0 origin-bottom-left"
                    style={{ background: currentTheme.sweepGradient }}
                  />
                  <div 
                    className="w-1/2 h-[2px] absolute top-1/2 right-0 origin-left"
                    style={{ 
                      transform: 'translateY(-1px)',
                      backgroundColor: currentTheme.primary,
                      boxShadow: `0 0 10px ${currentTheme.primary}` 
                    }}
                  />
                </div>

                {/* Track History Trail Breadcrumbs on Radar */}
                {radarTrail.map((p, idx) => (
                  <div
                    key={idx}
                    className="absolute w-1.5 h-1.5 rounded-full pointer-events-none transition-all duration-300"
                    style={{
                      top: `${p.y}%`,
                      left: `${p.x}%`,
                      transform: 'translate(-50%, -50%)',
                      backgroundColor: blipColor,
                      opacity: 0.15 + (idx / radarTrail.length) * 0.55
                    }}
                  />
                ))}

                {/* Other Simultaneous Airspace Contacts on Radar */}
                {otherBlips.map((ob) => (
                  <div
                    key={ob.track.track_id}
                    className="absolute z-15 transition-all duration-500 cursor-pointer group"
                    style={{
                      top: `${ob.y}%`,
                      left: `${ob.x}%`,
                      transform: 'translate(-50%, -50%)'
                    }}
                    onClick={() => onPinTarget && onPinTarget(ob.track)}
                    title={`${ob.track.track_id} (${ob.track.object_type}) - Click to lock target`}
                  >
                    {/* Contact Blip Core */}
                    <div
                      className="w-3 h-3 rounded-full border border-white shadow-md flex items-center justify-center opacity-85 group-hover:opacity-100 group-hover:scale-125 transition-transform"
                      style={{ backgroundColor: ob.color, boxShadow: `0 0 10px ${ob.color}` }}
                    >
                      <div className="w-0.5 h-0.5 rounded-full bg-white"></div>
                    </div>

                    {/* Miniature Heading Vector Line */}
                    {ob.headingDeg !== undefined && (
                      <div
                        className="absolute top-1/2 left-1/2 w-4 h-[1px] origin-left pointer-events-none opacity-70"
                        style={{
                          transform: `rotate(${ob.headingDeg - 90}deg)`,
                          backgroundColor: ob.color
                        }}
                      />
                    )}

                    {/* Track ID Pill */}
                    <div
                      className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-1 py-0.2 rounded text-[7px] font-mono font-bold whitespace-nowrap bg-aerodark-950/90 border pointer-events-none"
                      style={{ color: ob.color, borderColor: `${ob.color}66` }}
                    >
                      {ob.track.track_id}
                    </div>
                  </div>
                ))}

                {/* Live Target Contact Blip */}
                <div
                  className="absolute z-20 transition-all duration-500 cursor-pointer group"
                  style={{
                    top: `${blipY}%`,
                    left: `${blipX}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                  onClick={() => onPinTarget && onPinTarget(currentTrack)}
                >
                  {/* Sonar Pulse Ripple */}
                  <div 
                    className="absolute -inset-2.5 rounded-full border-2 animate-ping"
                    style={{ borderColor: blipColor, opacity: 0.75 }}
                  />

                  {/* Blip Core */}
                  <div 
                    className="w-4 h-4 rounded-full border-2 border-white shadow-xl flex items-center justify-center"
                    style={{ backgroundColor: blipColor, boxShadow: `0 0 16px ${blipColor}` }}
                  >
                    <div className="w-1 h-1 rounded-full bg-white"></div>
                  </div>

                  {/* Velocity Vector Line */}
                  {currentTrack?.heading_deg !== undefined && (
                    <div
                      className="absolute top-1/2 left-1/2 w-8 h-[2px] origin-left pointer-events-none"
                      style={{
                        transform: `rotate(${currentTrack.heading_deg - 90}deg)`,
                        backgroundColor: blipColor,
                        boxShadow: `0 0 6px ${blipColor}`
                      }}
                    >
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white"></div>
                    </div>
                  )}

                  {/* Tactical Callout HUD Overlay */}
                  <div className="absolute left-6 top-0 -translate-y-1/2 bg-aerodark-950/95 border border-aerocyan-500/70 rounded p-2 text-[10px] font-mono text-slate-200 shadow-2xl whitespace-nowrap pointer-events-none">
                    <div className="font-bold flex items-center space-x-1 text-aerocyan-300">
                      <Crosshair className="w-3 h-3" />
                      <span>LOCKED: {currentTrack?.track_id || 'TRACK-0001'}</span>
                    </div>
                    <div className="text-slate-300">
                      TYPE: <strong className="text-white">{currentTrack?.object_type || 'DRONE'}</strong>
                    </div>
                    <div className="text-slate-400">
                      POLAR: {rangeM}m | {bearingDeg}° {getBearingText(bearingDeg)}
                    </div>
                    <div className="text-slate-400">
                      ALT: {currentTrack?.altitude_m || 88}m | SPD: {currentTrack?.speed_mps || 18} m/s
                    </div>
                  </div>
                </div>

                {/* Station Center Origin */}
                <div className="absolute z-10 w-2.5 h-2.5 rounded-full bg-aerocyan-400 border border-white flex items-center justify-center shadow-lg">
                  <div className="w-1 h-1 rounded-full bg-aerodark-950"></div>
                </div>
              </div>

              {/* 4 Polar Readouts */}
              <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-aerodark-700 text-[10px] font-mono">
                <div className="bg-aerodark-850 p-2 rounded-lg border border-aerodark-700">
                  <div className="text-slate-400 font-medium">RANGE (R)</div>
                  <div className="text-blue-400 font-semibold text-xs mt-0.5">{rangeM.toLocaleString()} m</div>
                </div>
                <div className="bg-aerodark-850 p-2 rounded-lg border border-aerodark-700">
                  <div className="text-slate-400 font-medium">BEARING (θ)</div>
                  <div className="text-blue-400 font-semibold text-xs mt-0.5">{bearingDeg.toString().padStart(3, '0')}° {getBearingText(bearingDeg)}</div>
                </div>
                <div className="bg-aerodark-850 p-2 rounded-lg border border-aerodark-700">
                  <div className="text-slate-400 font-medium">ELEVATION (Z)</div>
                  <div className="text-slate-200 font-semibold text-xs mt-0.5">+{currentTrack?.altitude_m || 88} m AGL</div>
                </div>
                <div className="bg-aerodark-850 p-2 rounded-lg border border-aerodark-700">
                  <div className="text-slate-400 font-medium">DOPPLER VELOCITY</div>
                  <div className="text-emerald-400 font-semibold text-xs mt-0.5">{currentTrack?.speed_mps || 18} m/s</div>
                </div>
              </div>
            </div>

            {/* Right 5 Cols: Electronic SIGINT & Evidence Dossier */}
            <div className="lg:col-span-5 flex flex-col space-y-3 font-sans">
              {/* Section 1: RF Spectrum */}
              <div className="bg-aerodark-850 border border-aerodark-700 rounded-xl p-3 text-xs space-y-2 shadow-sm">
                <div className="flex items-center justify-between pb-1.5 border-b border-aerodark-700">
                  <div className="flex items-center space-x-2">
                    <Radio className={`w-4 h-4 ${intel.has_rf_emission ? 'text-amber-400' : 'text-slate-500'}`} />
                    <span className="font-semibold text-slate-200 uppercase tracking-wide text-xs">RF Electronic Spectrum</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${
                    intel.has_rf_emission ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' : 'bg-aerodark-800 text-slate-400 border border-aerodark-700'
                  }`}>
                    {intel.has_rf_emission ? 'EMISSION DETECTED' : 'RADIO SILENT'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="bg-aerodark-900 p-2 rounded-lg border border-aerodark-700/70">
                    <div className="text-[10px] text-slate-400 font-sans">FREQUENCY</div>
                    <div className="font-bold text-blue-400 text-sm mt-0.5">
                      {intel.frequency_mhz > 0 ? `${intel.frequency_mhz} MHz` : 'NONE'}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{intel.rf_band || 'Dual-Band ISM'}</div>
                  </div>

                  <div className="bg-aerodark-900 p-2 rounded-lg border border-aerodark-700/70">
                    <div className="text-[10px] text-slate-400 font-sans">SIGNAL STRENGTH</div>
                    <div className="font-bold text-amber-400 text-sm mt-0.5">
                      {intel.signal_strength_dbm || -82} dBm
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">SNR: {intel.snr_db || 12} dB</div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-300 pt-1 border-t border-aerodark-700 font-mono">
                  <span>PROTOCOL: <strong className="text-slate-100">{intel.protocol || 'Proprietary FHSS'}</strong></span>
                  <span>HOPPING: <strong className="text-slate-100">{intel.hopping_rate_hz || 1200} hops/s</strong></span>
                </div>
              </div>

              {/* Section 2: Remote ID Decoder */}
              <div className="bg-aerodark-850 border border-aerodark-700 rounded-xl p-3 text-xs space-y-2 shadow-sm">
                <div className="flex items-center justify-between pb-1.5 border-b border-aerodark-700">
                  <div className="flex items-center space-x-2">
                    <Wifi className="w-4 h-4 text-indigo-400" />
                    <span className="font-semibold text-slate-200 uppercase tracking-wide text-xs">Remote ID Broadcast</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${
                    intel.remote_id?.status === 'VERIFIED_DGCA' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' :
                    intel.remote_id?.status === 'ADS_B_TRANSPONDER' ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30' :
                    'bg-red-500/15 text-red-300 border border-red-500/30'
                  }`}>
                    {intel.remote_id?.status || 'NO BROADCAST'}
                  </span>
                </div>

                {intel.remote_id ? (
                  <div className="space-y-1 text-[11px] font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-sans">BROADCAST UIN:</span>
                      <span className="font-bold text-blue-400">{intel.remote_id.uin}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-sans">OPERATOR DISTANCE:</span>
                      <span className="font-medium text-slate-200">~{intel.remote_id.operator_distance_m}m</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-sans">ESTIMATED PILOT GPS:</span>
                      <span className="font-medium text-slate-200">{intel.remote_id.operator_lat}°N, {intel.remote_id.operator_lon}°E</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-400 text-xs py-1.5 text-center">
                    Zero Remote ID broadcast detected. Target operating in covert or non-transmitting mode.
                  </div>
                )}
              </div>

              {/* Section 3: Evidence Dossier Logging */}
              <div className="bg-aerodark-850 border border-aerodark-700 rounded-xl p-3 text-xs space-y-2 shadow-sm">
                <div className="flex items-center justify-between pb-1.5 border-b border-aerodark-700">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-blue-400" />
                    <span className="font-semibold text-slate-200 uppercase tracking-wide text-xs">Evidence Dossier</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-blue-600/15 text-blue-300 border border-blue-500/30">
                    PASSIVE LOG
                  </span>
                </div>

                <div className="text-[11px] text-slate-300 space-y-1 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-sans">TARGET CLASS:</span>
                    <strong className="text-slate-100">{currentTrack?.object_type || 'AERIAL_OBJECT'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-sans">SENSOR CORRELATION:</span>
                    <strong className="text-emerald-400">{currentTrack?.fusion_mode || 'RADAR + OPTICAL CORRELATED'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-sans">DOSSIER AUDIT ID:</span>
                    <strong className="text-blue-400">EVD-2026-{currentTrack?.track_id || 'TRK-001'}</strong>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setEvidenceLogged(true);
                    playTacticalSound('ping', true);
                    setTimeout(() => setEvidenceLogged(false), 3000);
                  }}
                  className={`w-full py-2 rounded-lg font-sans font-medium text-xs tracking-wide transition-all flex items-center justify-center space-x-2 shadow-sm cursor-pointer ${
                    evidenceLogged
                      ? 'bg-emerald-600 text-white'
                      : 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30'
                  }`}
                >
                  {evidenceLogged ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>FORENSIC EVIDENCE DOSSIER PRESERVED</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-3.5 h-3.5" />
                      <span>LOG FORENSIC EVIDENCE DOSSIER</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
