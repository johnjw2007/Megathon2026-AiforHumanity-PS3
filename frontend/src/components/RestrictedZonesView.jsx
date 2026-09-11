import React, { useState } from 'react';
import { ShieldAlert, Plus, MapPin, AlertOctagon, CheckCircle2, Upload, FileJson, Clock, Check } from 'lucide-react';

export default function RestrictedZonesView({ zones, onCreateZone, onImportGeoJSON }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showGeoJSONModal, setShowGeoJSONModal] = useState(false);
  const [geoJSONText, setGeoJSONText] = useState('');
  const [geoJSONError, setGeoJSONError] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccessMsg, setImportSuccessMsg] = useState('');

  // Manual create form state
  const [name, setName] = useState('');
  const [zoneType, setZoneType] = useState('MILITARY_RESTRICTED');
  const [severity, setSeverity] = useState('CRITICAL');
  const [minAlt, setMinAlt] = useState(0);
  const [maxAlt, setMaxAlt] = useState(1000);
  const [description, setDescription] = useState('');
  const [actionNotice, setActionNotice] = useState('');

  const handleExtendZone = async (zoneId, additionalSeconds = 900) => {
    try {
      const token = localStorage.getItem('aeroguard_token') || 'aerosec-admin-token';
      const res = await fetch(`/api/zones/${encodeURIComponent(zoneId)}/extend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ additional_seconds: additionalSeconds })
      });
      const d = await res.json();
      if (d.success) {
        setActionNotice(`Extended zone '${zoneId}' by 15 minutes.`);
        setTimeout(() => setActionNotice(''), 3500);
        window.location.reload();
      }
    } catch (e) {
      console.error('Zone extension error:', e);
    }
  };

  const handleRevokeZone = async (zoneId) => {
    if (!window.confirm(`Are you sure you want to revoke and deactivate ${zoneId}?`)) return;
    try {
      const token = localStorage.getItem('aeroguard_token') || 'aerosec-admin-token';
      const res = await fetch(`/api/zones/${encodeURIComponent(zoneId)}/revoke`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
      });
      const d = await res.json();
      if (d.success) {
        setActionNotice(`Revoked/deactivated zone '${zoneId}'.`);
        setTimeout(() => setActionNotice(''), 3500);
        window.location.reload();
      }
    } catch (e) {
      console.error('Zone revoke error:', e);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name) return;
    if (onCreateZone) {
      onCreateZone({
        name,
        zone_type: zoneType,
        severity,
        min_altitude_m: minAlt,
        max_altitude_m: maxAlt,
        description,
        polygon_coords: [
          [13.070, 80.290],
          [13.080, 80.310],
          [13.060, 80.315],
          [13.055, 80.295]
        ]
      });
    }
    setName('');
    setDescription('');
    setShowAddModal(false);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        JSON.parse(text); // validate JSON syntax
        setGeoJSONText(text);
        setGeoJSONError('');
      } catch (err) {
        setGeoJSONError('Invalid JSON file format: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleGeoJSONSubmit = async (e) => {
    e.preventDefault();
    setGeoJSONError('');
    if (!geoJSONText.trim()) {
      setGeoJSONError('Please paste GeoJSON content or upload a .json / .geojson file.');
      return;
    }

    let parsed;
    try {
      parsed = JSON.parse(geoJSONText);
    } catch (err) {
      setGeoJSONError('Invalid GeoJSON syntax: ' + err.message);
      return;
    }

    setIsImporting(true);
    try {
      if (onImportGeoJSON) {
        await onImportGeoJSON(parsed);
      } else {
        const token = localStorage.getItem('aeroguard_token') || 'aerosec-admin-token';
        const res = await fetch('/api/zones/import-geojson', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(parsed)
        });
        const data = await res.json();
        if (!data.success) {
          throw new Error(data.error || 'Failed to import GeoJSON');
        }
      }
      setImportSuccessMsg('GeoJSON zones successfully imported and committed into spatial database.');
      setTimeout(() => {
        setImportSuccessMsg('');
        setShowGeoJSONModal(false);
        setGeoJSONText('');
      }, 1500);
    } catch (err) {
      setGeoJSONError(err.message || 'Error importing GeoJSON zones.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="p-4 space-y-4 max-w-6xl mx-auto text-xs font-sans select-none overflow-y-auto h-full">
      {/* Header */}
      <div className="bg-aerodark-850 border border-aerodark-700 rounded-xl p-5 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center space-x-3.5">
          <div className="p-2.5 rounded-lg bg-aerodark-900 border border-aerodark-700">
            <ShieldAlert className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <div className="font-semibold text-sm text-slate-100 tracking-wide flex items-center space-x-2">
              <span>COASTAL DEFENSE & RESTRICTED AIRSPACE GEOFENCES</span>
              <span className="bg-blue-500/15 text-blue-300 border border-blue-500/30 text-[10px] px-2 py-0.5 rounded font-mono font-medium">
                POSTGIS / RAY-CASTING
              </span>
            </div>
            <div className="text-slate-400 text-xs mt-0.5">
              Autonomous Jordan Ray-Casting 3D enforcement across permanent naval zones and tactical temporary red restrictions
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => setShowGeoJSONModal(true)}
            className="flex items-center space-x-1.5 bg-aerodark-800 hover:bg-aerodark-700 text-slate-200 border border-aerodark-600 font-medium px-3.5 py-1.5 rounded-lg transition-all shadow-sm text-xs font-sans"
          >
            <Upload className="w-3.5 h-3.5 text-blue-400" />
            <span>IMPORT GEOJSON</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-white font-medium px-3.5 py-1.5 rounded-lg transition-all shadow-sm text-xs font-sans"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>DEFINE GEOFENCE</span>
          </button>
        </div>
      </div>

      {/* Geofences Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {zones?.map((z) => {
          const isExpired = z.active === 0;
          return (
            <div
              key={z.zone_id}
              className={`border rounded-xl p-5 flex flex-col justify-between space-y-3.5 shadow-sm transition-all ${
                isExpired
                  ? 'bg-aerodark-900/60 border-aerodark-800 opacity-60'
                  : 'bg-aerodark-850 border-aerodark-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between font-mono text-[10px] mb-1.5">
                  <span className="text-slate-400 font-bold">{z.zone_id}</span>
                  <div className="flex items-center space-x-1.5">
                    {z.expires_at && (
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono flex items-center space-x-1 ${
                        isExpired
                          ? 'bg-slate-800 text-slate-400 border border-slate-700'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                      }`}>
                        <Clock className="w-2.5 h-2.5" />
                        <span>{isExpired ? 'EXPIRED' : 'TEMP'}</span>
                      </span>
                    )}
                    <span
                      className={`px-2 py-0.5 rounded-md font-sans font-medium text-[10px] ${
                        z.severity === 'CRITICAL'
                          ? 'bg-red-500/15 text-red-300 border border-red-500/30'
                          : z.severity === 'HIGH'
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          : 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                      }`}
                    >
                      {z.severity}
                    </span>
                  </div>
                </div>
                <div className="font-semibold text-slate-100 text-xs mb-1">{z.name}</div>
                <div className="text-xs text-slate-400 leading-relaxed">{z.description}</div>
              </div>

              <div className="bg-aerodark-900 p-2.5 rounded-lg border border-aerodark-700/70 font-mono text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">SECTOR TYPE:</span>
                  <span className="text-slate-200">{z.zone_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">ALTITUDE BOUNDS:</span>
                  <span className="text-blue-400 font-bold">{z.min_altitude_m}m - {z.max_altitude_m}m AGL</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">STATUS:</span>
                  <span className={isExpired ? 'text-slate-500 font-bold' : 'text-emerald-400 font-bold'}>
                    {isExpired ? 'INACTIVE / EXPIRED' : 'ACTIVE ENFORCEMENT'}
                  </span>
                </div>
                {z.expires_at && (
                  <div className="flex justify-between text-[10px] pt-1 border-t border-aerodark-800">
                    <span className="text-slate-500 font-sans">EXPIRES:</span>
                    <span className="text-slate-400">{z.expires_at}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">POLYGON VERTICES:</span>
                  <span className="text-slate-300">{z.polygon_coords?.length || 4} Points</span>
                </div>

                {(z.zone_type === 'TEMPORARY_RED' || z.expires_at) && (
                  <div className="pt-2 mt-1 border-t border-aerodark-800 flex items-center justify-end space-x-2">
                    <button
                      onClick={() => handleExtendZone(z.zone_id, 900)}
                      className="px-2 py-1 rounded bg-blue-600/80 hover:bg-blue-500 text-white text-[10px] font-bold cursor-pointer transition-all"
                    >
                      +15M EXTEND
                    </button>
                    {!isExpired && (
                      <button
                        onClick={() => handleRevokeZone(z.zone_id)}
                        className="px-2 py-1 rounded bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold cursor-pointer transition-all"
                      >
                        REVOKE
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal for importing GeoJSON */}
      {showGeoJSONModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-aerodark-900 border border-aerodark-700 rounded-xl p-6 max-w-xl w-full font-sans text-xs shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-aerodark-800 pb-3">
              <div className="flex items-center space-x-2">
                <FileJson className="w-5 h-5 text-blue-400" />
                <span className="font-semibold text-slate-100 text-sm">Import Airspace Boundaries via GeoJSON</span>
              </div>
              <button
                onClick={() => { setShowGeoJSONModal(false); setGeoJSONError(''); }}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {importSuccessMsg && (
              <div className="p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center space-x-2">
                <Check className="w-4 h-4" />
                <span>{importSuccessMsg}</span>
              </div>
            )}

            {geoJSONError && (
              <div className="p-3 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 flex items-center space-x-2">
                <AlertOctagon className="w-4 h-4" />
                <span>{geoJSONError}</span>
              </div>
            )}

            <form onSubmit={handleGeoJSONSubmit} className="space-y-3.5">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Upload GeoJSON File (.json / .geojson)
                </label>
                <input
                  type="file"
                  accept=".json,.geojson,application/geo+json,application/json"
                  onChange={handleFileUpload}
                  className="w-full bg-aerodark-950 border border-aerodark-700 rounded-lg p-2 text-slate-300 file:mr-3 file:py-1 file:px-2.5 file:rounded file:border-0 file:bg-blue-600 file:text-white file:text-xs file:cursor-pointer cursor-pointer text-xs"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 font-medium">Or Paste GeoJSON FeatureCollection / Feature</label>
                  <button
                    type="button"
                    onClick={() => {
                      const sample = {
                        type: "FeatureCollection",
                        features: [
                          {
                            type: "Feature",
                            properties: {
                              name: "Ennore Thermal Power Plant Exclusion",
                              zone_type: "MILITARY_RESTRICTED",
                              severity: "CRITICAL",
                              min_altitude_m: 0,
                              max_altitude_m: 500,
                              description: "Critical infrastructure safety buffer zone"
                            },
                            geometry: {
                              type: "Polygon",
                              coordinates: [[
                                [80.320, 13.200],
                                [80.340, 13.200],
                                [80.340, 13.220],
                                [80.320, 13.220],
                                [80.320, 13.200]
                              ]]
                            }
                          }
                        ]
                      };
                      setGeoJSONText(JSON.stringify(sample, null, 2));
                      setGeoJSONError('');
                    }}
                    className="text-[11px] text-blue-400 hover:text-blue-300 underline"
                  >
                    Insert Example GeoJSON
                  </button>
                </div>
                <textarea
                  value={geoJSONText}
                  onChange={(e) => { setGeoJSONText(e.target.value); setGeoJSONError(''); }}
                  placeholder="Paste GeoJSON JSON payload here..."
                  rows={8}
                  className="w-full bg-aerodark-950 border border-aerodark-700 rounded-lg p-2.5 text-slate-200 outline-none focus:border-blue-500 font-mono text-[11px]"
                ></textarea>
              </div>

              <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-aerodark-700">
                <button
                  type="button"
                  onClick={() => setShowGeoJSONModal(false)}
                  className="bg-aerodark-800 hover:bg-aerodark-700 text-slate-300 px-3.5 py-2 rounded-lg font-medium text-xs transition-colors"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={isImporting}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2 rounded-lg shadow-sm text-xs transition-colors flex items-center space-x-1.5"
                >
                  {isImporting ? <span>IMPORTING...</span> : <span>IMPORT ZONES</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for creating custom zone */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-aerodark-900 border border-aerodark-700 rounded-xl p-6 max-w-lg w-full font-sans text-xs shadow-2xl">
            <div className="font-semibold text-slate-100 text-sm mb-4">Define New Restricted Airspace Geofence</div>
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-slate-400 font-medium mb-1 uppercase text-[10px]">Zone Name</label>
                <input
                  type="text"
                  placeholder="e.g. VIP Helipad Security Perimeter"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-aerodark-950 border border-aerodark-700 rounded-lg p-2.5 text-slate-200 outline-none focus:border-blue-500 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1 uppercase text-[10px]">Zone Type</label>
                  <select
                    value={zoneType}
                    onChange={(e) => setZoneType(e.target.value)}
                    className="w-full bg-aerodark-950 border border-aerodark-700 rounded-lg p-2.5 text-slate-200 outline-none focus:border-blue-500 text-xs"
                  >
                    <option value="MILITARY_RESTRICTED">MILITARY RESTRICTED</option>
                    <option value="PORT_SECURITY">PORT SECURITY</option>
                    <option value="VIP_ROUTE">VIP ROUTE</option>
                    <option value="TEMPORARY_RESTRICTED">TEMPORARY RESTRICTED</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1 uppercase text-[10px]">Severity Level</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    className="w-full bg-aerodark-950 border border-aerodark-700 rounded-lg p-2.5 text-slate-200 outline-none focus:border-blue-500 text-xs"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1 uppercase text-[10px]">Min Altitude (m)</label>
                  <input
                    type="number"
                    value={minAlt}
                    onChange={(e) => setMinAlt(Number(e.target.value))}
                    className="w-full bg-aerodark-950 border border-aerodark-700 rounded-lg p-2.5 text-slate-200 outline-none focus:border-blue-500 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1 uppercase text-[10px]">Max Altitude (m)</label>
                  <input
                    type="number"
                    value={maxAlt}
                    onChange={(e) => setMaxAlt(Number(e.target.value))}
                    className="w-full bg-aerodark-950 border border-aerodark-700 rounded-lg p-2.5 text-slate-200 outline-none focus:border-blue-500 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1 uppercase text-[10px]">Operational Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Security rationale and rules of engagement..."
                  className="w-full bg-aerodark-950 border border-aerodark-700 rounded-lg p-2.5 text-slate-200 outline-none focus:border-blue-500 h-20 text-xs"
                ></textarea>
              </div>

              <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-aerodark-700">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="bg-aerodark-800 hover:bg-aerodark-700 text-slate-300 px-3.5 py-2 rounded-lg font-medium text-xs transition-colors"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2 rounded-lg shadow-sm text-xs transition-colors"
                >
                  SAVE GEOFENCE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
