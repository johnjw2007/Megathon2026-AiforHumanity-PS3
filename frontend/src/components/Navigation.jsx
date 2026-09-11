import React from 'react';
import {
  LayoutDashboard,
  Radar,
  Camera,
  Crosshair,
  FileCheck2,
  Plane,
  ShieldAlert,
  BellRing,
  FolderGit2,
  Cpu,
  ScrollText,
  Settings
} from 'lucide-react';

export default function Navigation({ currentTab, setTab, alertCount, incidentCount, pendingPermCount = 0 }) {
  const navItems = [
    { id: 'overview', label: 'Live Surveillance', icon: LayoutDashboard, badge: null },
    { id: 'radar', label: 'Radar AI Pipeline', icon: Radar, badge: '99.8%' },
    { id: 'camera', label: 'Camera & YOLO', icon: Camera, badge: null },
    { id: 'tracks', label: 'Unified Tracks', icon: Crosshair, badge: 'LIVE' },
    { id: 'permissions', label: 'Flight Approvals & Permissions', icon: FileCheck2, badge: pendingPermCount > 0 ? `${pendingPermCount} PENDING` : null, alertColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30' },
    { id: 'zones', label: 'Restricted Zones', icon: ShieldAlert, badge: '3' },
    { id: 'alerts', label: 'Alert Center', icon: BellRing, badge: alertCount > 0 ? alertCount : null, alertColor: 'bg-red-500/20 text-red-300 border border-red-500/30' },
    { id: 'incidents', label: 'Incidents & Evidence', icon: FolderGit2, badge: incidentCount > 0 ? incidentCount : null, alertColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30' },
    { id: 'models', label: 'AI Transparency', icon: Cpu, badge: null },
    { id: 'audit', label: 'Audit Logs', icon: ScrollText, badge: null },
    { id: 'settings', label: 'Console Settings', icon: Settings, badge: null },
    { id: 'registry', label: 'Drone Registry', icon: Plane, badge: null }
  ];

  return (
    <aside className="w-60 bg-aerodark-900 border-r border-aerodark-700 flex flex-col justify-between py-3 shrink-0 select-none">
      <div className="space-y-1 px-3">
        <div className="px-3 py-1.5 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          OPERATIONAL MODULES
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-blue-600/15 text-blue-300 border border-blue-500/30 shadow-sm font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-aerodark-800/70 border border-transparent'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                    item.alertColor
                      ? item.alertColor
                      : isActive
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      : 'bg-aerodark-800 text-slate-400 border border-aerodark-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="px-4 py-3 border-t border-aerodark-700 font-mono text-[11px] text-slate-400 bg-aerodark-950/40 mx-2 rounded-lg mt-2">
        <div className="flex items-center justify-between">
          <span className="text-slate-300 font-sans font-medium text-xs">SECTOR 7</span>
          <span className="inline-flex items-center space-x-1.5 text-emerald-400 text-[10px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>DEFENSE ACTIVE</span>
          </span>
        </div>
        <div className="truncate text-[10px] text-slate-500 mt-1">LAT 13.065° LON 80.295°</div>
      </div>
    </aside>
  );
}
