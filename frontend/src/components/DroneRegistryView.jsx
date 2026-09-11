import React, { useState } from 'react';
import { 
  Plane, 
  Search, 
  Plus, 
  ShieldCheck, 
  CheckCircle2, 
  Filter, 
  X, 
  Check 
} from 'lucide-react';

export default function DroneRegistryView({ drones = [], onRegisterDrone, onRefreshDrones }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newModel, setNewModel] = useState('');
  const [newType, setNewType] = useState('ROTORCRAFT');
  const [newWeight, setNewWeight] = useState('SMALL');
  const [newOwner, setNewOwner] = useState('');
  const [newContact, setNewContact] = useState('+91-');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionNotice, setActionNotice] = useState(null);

  const filteredDrones = (drones || []).filter((d) => {
    if (filterType !== 'ALL' && (d.drone_type || '').toUpperCase() !== filterType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = (d.drone_id || '').toLowerCase().includes(q);
      const matchUin = (d.uin_number || '').toLowerCase().includes(q);
      const matchModel = (d.model_name || '').toLowerCase().includes(q);
      const matchOwner = (d.owner_name || '').toLowerCase().includes(q);
      return matchId || matchUin || matchModel || matchOwner;
    }
    return true;
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newModel || !newOwner) return;
    setIsSubmitting(true);
    try {
      const payload = {
        model_name: newModel,
        drone_type: newType,
        weight_category: newWeight,
        owner_name: newOwner,
        operator_contact: newContact
      };
      if (onRegisterDrone) {
        await onRegisterDrone(payload);
      } else {
        const token = localStorage.getItem('aeroguard_token') || 'aerosec-officer-token';
        await fetch('/api/drones', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify(payload)
        });
      }
      setShowAddModal(false);
      setNewModel('');
      setNewOwner('');
      setActionNotice('Drone registered successfully in DGCA National Registry.');
      setTimeout(() => setActionNotice(null), 3500);
      if (onRefreshDrones) onRefreshDrones();
    } catch (err) {
      alert('Error registering drone.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 space-y-4 max-w-7xl mx-auto text-xs font-sans select-none overflow-y-auto h-full">
      {/* Action Notification Toast */}
      {actionNotice && (
        <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 px-4 py-2.5 rounded-xl shadow-lg flex items-center justify-between text-xs animate-fadeIn">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{actionNotice}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="text-emerald-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-aerodark-850 border border-aerodark-700 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between shadow-sm gap-3">
        <div className="flex items-center space-x-3.5">
          <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <Plane className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100 tracking-tight flex items-center space-x-2">
              <span>National Civil Drone Hardware Registry</span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 font-mono font-normal">
                DGCA DIGITAL SKY COMPLIANT
              </span>
            </h2>
            <p className="text-slate-400 text-xs mt-0.5">
              Verified UAS hardware registry cross-referenced against Remote-ID broadcasts and ASTRA micro-Doppler radar signatures.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-3.5 py-2 rounded-lg text-xs transition-all shadow-sm flex items-center space-x-2 self-start md:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>REGISTER NEW DRONE</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-aerodark-850 border border-aerodark-700 rounded-xl p-3.5">
          <div className="text-slate-400 text-[11px] uppercase tracking-wider font-medium">Total Registered</div>
          <div className="text-xl font-bold font-mono text-slate-100 mt-1">{drones?.length || 0}</div>
        </div>
        <div className="bg-aerodark-850 border border-aerodark-700 rounded-xl p-3.5">
          <div className="text-slate-400 text-[11px] uppercase tracking-wider font-medium">Verified UINs</div>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
            {drones?.filter((d) => d.registration_status === 'VERIFIED').length || 0}
          </div>
        </div>
        <div className="bg-aerodark-850 border border-aerodark-700 rounded-xl p-3.5">
          <div className="text-slate-400 text-[11px] uppercase tracking-wider font-medium">Rotorcraft UAVs</div>
          <div className="text-xl font-bold font-mono text-blue-400 mt-1">
            {drones?.filter((d) => (d.drone_type || '').toUpperCase() === 'ROTORCRAFT').length || 0}
          </div>
        </div>
        <div className="bg-aerodark-850 border border-aerodark-700 rounded-xl p-3.5">
          <div className="text-slate-400 text-[11px] uppercase tracking-wider font-medium">Fixed-Wing / VTOL</div>
          <div className="text-xl font-bold font-mono text-purple-400 mt-1">
            {drones?.filter((d) => ['FIXED_WING', 'HYBRID_VTOL'].includes((d.drone_type || '').toUpperCase())).length || 0}
          </div>
        </div>
      </div>

      {/* Search & Filter Strip */}
      <div className="bg-aerodark-850 border border-aerodark-700 rounded-xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Drone ID, DGCA UIN, Model, or Owner / Operator..."
            className="w-full bg-aerodark-900 border border-aerodark-700 rounded-lg pl-9 pr-3 py-1.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 text-xs"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto">
          {['ALL', 'ROTORCRAFT', 'FIXED_WING', 'HYBRID_VTOL'].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                filterType === t
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'bg-aerodark-900 text-slate-400 border border-aerodark-700 hover:text-slate-200'
              }`}
            >
              {t === 'ALL' ? 'All Types' : t.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Main Hardware Table */}
      <div className="bg-aerodark-850 border border-aerodark-700 rounded-xl p-5 space-y-3.5 shadow-sm">
        <div className="font-semibold text-slate-200 text-xs uppercase tracking-wider flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Plane className="w-4 h-4 text-blue-400" />
            <span>Active Civil Drone Hardware Registry</span>
          </div>
          <span className="text-slate-400 font-mono text-[11px] font-normal">
            Showing {filteredDrones.length} of {drones.length} drones
          </span>
        </div>

        <div className="overflow-x-auto rounded-lg border border-aerodark-700/60">
          <table className="w-full text-left font-mono text-xs">
            <thead className="text-slate-400 border-b border-aerodark-700 bg-aerodark-900 font-sans">
              <tr>
                <th className="px-3.5 py-2.5 font-medium text-[11px] tracking-wider uppercase">Drone ID</th>
                <th className="px-3.5 py-2.5 font-medium text-[11px] tracking-wider uppercase">DGCA UIN</th>
                <th className="px-3.5 py-2.5 font-medium text-[11px] tracking-wider uppercase">Model Name</th>
                <th className="px-3.5 py-2.5 font-medium text-[11px] tracking-wider uppercase">Type</th>
                <th className="px-3.5 py-2.5 font-medium text-[11px] tracking-wider uppercase">Weight Class</th>
                <th className="px-3.5 py-2.5 font-medium text-[11px] tracking-wider uppercase">Owner / Organization</th>
                <th className="px-3.5 py-2.5 font-medium text-[11px] tracking-wider uppercase">Contact</th>
                <th className="px-3.5 py-2.5 font-medium text-[11px] tracking-wider uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-aerodark-700/40 text-slate-300">
              {filteredDrones.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3.5 py-8 text-center text-slate-500 font-sans">
                    No registered drones matched your search query.
                  </td>
                </tr>
              ) : (
                filteredDrones.map((d) => (
                  <tr key={d.drone_id} className="hover:bg-aerodark-800/50 transition-colors">
                    <td className="px-3.5 py-2.5 font-bold text-blue-400">{d.drone_id}</td>
                    <td className="px-3.5 py-2.5 font-semibold text-slate-200">{d.uin_number}</td>
                    <td className="px-3.5 py-2.5 font-sans font-medium text-slate-100">{d.model_name}</td>
                    <td className="px-3.5 py-2.5 font-sans">
                      <span className="px-2 py-0.5 rounded bg-aerodark-900 border border-aerodark-700 text-slate-300 text-[10px]">
                        {d.drone_type}
                      </span>
                    </td>
                    <td className="px-3.5 py-2.5 font-sans text-slate-400">{d.weight_category}</td>
                    <td className="px-3.5 py-2.5 font-sans text-slate-200">{d.owner_name}</td>
                    <td className="px-3.5 py-2.5 text-slate-400">{d.operator_contact || 'N/A'}</td>
                    <td className="px-3.5 py-2.5">
                      <span className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-md font-sans font-medium text-[10px] inline-flex items-center space-x-1">
                        <ShieldCheck className="w-3 h-3" />
                        <span>{d.registration_status || 'VERIFIED'}</span>
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Register New Drone */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn font-sans">
          <div className="bg-aerodark-900 border border-aerodark-700 rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-aerodark-700 pb-3">
              <div className="flex items-center space-x-2">
                <Plane className="w-5 h-5 text-blue-400" />
                <h3 className="font-semibold text-slate-100 text-sm">Register Civil Drone Hardware</h3>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Model Name / Manufacturer</label>
                <input
                  type="text"
                  value={newModel}
                  onChange={(e) => setNewModel(e.target.value)}
                  placeholder="e.g. DJI Matrice 350 RTK"
                  className="w-full bg-aerodark-800 border border-aerodark-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Airframe Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full bg-aerodark-800 border border-aerodark-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="ROTORCRAFT">Rotorcraft</option>
                    <option value="FIXED_WING">Fixed Wing</option>
                    <option value="HYBRID_VTOL">Hybrid VTOL</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Weight Category</label>
                  <select
                    value={newWeight}
                    onChange={(e) => setNewWeight(e.target.value)}
                    className="w-full bg-aerodark-800 border border-aerodark-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="NANO">Nano (&lt;250g)</option>
                    <option value="MICRO">Micro (250g-2kg)</option>
                    <option value="SMALL">Small (2kg-25kg)</option>
                    <option value="MEDIUM">Medium (25kg-150kg)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Owner / Operating Organization</label>
                <input
                  type="text"
                  value={newOwner}
                  onChange={(e) => setNewOwner(e.target.value)}
                  placeholder="e.g. Chennai Port Authority"
                  className="w-full bg-aerodark-800 border border-aerodark-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Emergency Operator Contact</label>
                <input
                  type="text"
                  value={newContact}
                  onChange={(e) => setNewContact(e.target.value)}
                  placeholder="+91-9840123456"
                  className="w-full bg-aerodark-800 border border-aerodark-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-aerodark-700">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-aerodark-700 text-slate-300 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-1.5 rounded-lg shadow-sm flex items-center space-x-1 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Registering...' : 'Register Drone'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
