import React, { useState } from 'react';
import { 
  Plane, 
  CheckCircle2, 
  XCircle, 
  FileCheck2, 
  User, 
  Clock, 
  Shield, 
  Plus, 
  Search, 
  Filter, 
  AlertTriangle,
  Check,
  X,
  RotateCcw
} from 'lucide-react';

export default function PermissionsRegistryView({
  drones = [],
  permissions = [],
  zones = [],
  onApprovePermission,
  onRejectPermission,
  onRequestPermission
}) {
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalDroneId, setModalDroneId] = useState('');
  const [modalOperator, setModalOperator] = useState('');
  const [modalPurpose, setModalPurpose] = useState('');
  const [modalZone, setModalZone] = useState('ZONE-PORT-02');
  const [modalAlt, setModalAlt] = useState(80);
  const [modalStart, setModalStart] = useState('2026-09-11 06:00:00');
  const [modalEnd, setModalEnd] = useState('2026-09-12 20:00:00');
  const [modalStatus, setModalStatus] = useState('PENDING');
  const [actionNotice, setActionNotice] = useState(null);

  const pendingCount = permissions.filter((p) => p.status === 'PENDING').length;
  const approvedCount = permissions.filter((p) => p.status === 'APPROVED').length;
  const rejectedCount = permissions.filter((p) => p.status === 'REJECTED').length;

  const filteredPermissions = permissions.filter((p) => {
    if (filterStatus !== 'ALL' && p.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchPermit = (p.permission_id || '').toLowerCase().includes(q);
      const matchUin = (p.uin_number || p.drone_id || '').toLowerCase().includes(q);
      const matchOp = (p.operator_name || '').toLowerCase().includes(q);
      const matchPurpose = (p.flight_purpose || '').toLowerCase().includes(q);
      return matchPermit || matchUin || matchOp || matchPurpose;
    }
    return true;
  });

  const handleApprove = async (permId) => {
    if (onApprovePermission) {
      await onApprovePermission(permId);
      setActionNotice(`Permission ${permId} APPROVED successfully.`);
      setTimeout(() => setActionNotice(null), 3500);
    }
  };

  const handleReject = async (permId) => {
    if (onRejectPermission) {
      await onRejectPermission(permId);
      setActionNotice(`Permission ${permId} REJECTED / REVOKED.`);
      setTimeout(() => setActionNotice(null), 3500);
    }
  };

  const handleCreatePermit = async (e) => {
    e.preventDefault();
    if (!onRequestPermission) return;
    const drone = drones.find((d) => d.drone_id === modalDroneId) || drones[0];
    const payload = {
      drone_id: modalDroneId || (drone ? drone.drone_id : 'DRN-001'),
      operator_name: modalOperator || (drone ? drone.owner_name : 'Civilian Operator'),
      flight_purpose: modalPurpose || 'Infrastructure Inspection & Aerial Survey',
      allowed_zone: modalZone,
      max_altitude_m: parseFloat(modalAlt),
      start_time: modalStart,
      end_time: modalEnd,
      status: modalStatus
    };
    await onRequestPermission(payload);
    setShowModal(false);
    setActionNotice(`Flight Authorization ${modalStatus === 'APPROVED' ? 'Issued' : 'Submitted for Approval'}.`);
    setTimeout(() => setActionNotice(null), 3500);
  };

  return (
    <div className="p-4 space-y-4 max-w-7xl mx-auto text-xs font-sans select-none overflow-y-auto h-full">
      {/* Header Banner */}
      <div className="bg-aerodark-850 border border-aerodark-700 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between shadow-sm gap-3">
        <div className="flex items-center space-x-3.5">
          <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <FileCheck2 className="w-5 h-5" />
          </div>
          <div>
            <div className="font-semibold text-sm text-slate-100 tracking-wide flex items-center space-x-2">
              <span>DGCA & CIVIL AIRSPACE AUTHORIZATION DESK</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30">
                REQUEST APPROVAL
              </span>
            </div>
            <div className="text-slate-400 text-xs mt-0.5">
              Review and adjudicate incoming civilian drone flight requests, altitude waivers, and manage authorized corridors
            </div>
          </div>
        </div>

        {/* Quick Summary Counts & New Permit Button */}
        <div className="flex items-center space-x-2.5 flex-wrap gap-y-2">
          <span className={`px-3 py-1.5 rounded-lg border font-medium flex items-center space-x-1.5 ${
            pendingCount > 0 
              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 animate-pulse' 
              : 'bg-aerodark-900 text-slate-400 border-aerodark-700'
          }`}>
            <Clock className="w-3.5 h-3.5" />
            <span>{pendingCount} PENDING REQUESTS</span>
          </span>

          <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 font-medium flex items-center space-x-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{approvedCount} ACTIVE PERMITS</span>
          </span>

          <button
            onClick={() => {
              if (drones && drones.length > 0) {
                setModalDroneId(drones[0].drone_id);
                setModalOperator(drones[0].owner_name);
              }
              setShowModal(true);
            }}
            className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg font-medium text-xs flex items-center space-x-1.5 transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>NEW FLIGHT REQUEST</span>
          </button>
        </div>
      </div>

      {/* Action Notification Toast */}
      {actionNotice && (
        <div className="p-3 bg-blue-500/15 border border-blue-500/30 rounded-xl text-blue-200 text-xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center space-x-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{actionNotice}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="text-slate-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Flight Permissions Adjudication Table */}
      <div className="bg-aerodark-850 border border-aerodark-700 rounded-xl p-5 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-aerodark-700/60 pb-3.5">
          <div className="flex items-center space-x-2">
            <div className="font-semibold text-slate-200 text-xs uppercase tracking-wider">
              Civilian Drone Flight Requests & Authorizations
            </div>
          </div>

          {/* Filters & Search */}
          <div className="flex items-center space-x-2 flex-wrap gap-y-2">
            {/* Status Filter Tabs */}
            <div className="inline-flex rounded-lg bg-aerodark-900 p-1 border border-aerodark-700">
              <button
                onClick={() => setFilterStatus('ALL')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                  filterStatus === 'ALL'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                ALL ({permissions.length})
              </button>
              <button
                onClick={() => setFilterStatus('PENDING')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all flex items-center space-x-1 ${
                  filterStatus === 'PENDING'
                    ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                    : 'text-amber-400/90 hover:text-amber-300'
                }`}
              >
                <span>PENDING</span>
                {pendingCount > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                )}
                <span>({pendingCount})</span>
              </button>
              <button
                onClick={() => setFilterStatus('APPROVED')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                  filterStatus === 'APPROVED'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                APPROVED ({approvedCount})
              </button>
              <button
                onClick={() => setFilterStatus('REJECTED')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                  filterStatus === 'REJECTED'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                REJECTED ({rejectedCount})
              </button>
            </div>

            {/* Quick Search Box */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search permit, UIN, operator..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-aerodark-900 border border-aerodark-700 rounded-lg pl-7 pr-3 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 w-44 sm:w-56"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2 top-2" />
            </div>
          </div>
        </div>

        {/* Requests Table */}
        <div className="overflow-x-auto rounded-lg border border-aerodark-700/60">
          <table className="w-full text-left font-mono text-xs">
            <thead className="text-slate-400 border-b border-aerodark-700 bg-aerodark-900 font-sans">
              <tr>
                <th className="px-3.5 py-2.5 font-medium text-[11px] tracking-wider uppercase">Permit ID</th>
                <th className="px-3.5 py-2.5 font-medium text-[11px] tracking-wider uppercase">Drone UIN</th>
                <th className="px-3.5 py-2.5 font-medium text-[11px] tracking-wider uppercase">Operator</th>
                <th className="px-3.5 py-2.5 font-medium text-[11px] tracking-wider uppercase">Flight Purpose</th>
                <th className="px-3.5 py-2.5 font-medium text-[11px] tracking-wider uppercase">Authorized Corridor</th>
                <th className="px-3.5 py-2.5 font-medium text-[11px] tracking-wider uppercase">Max Alt</th>
                <th className="px-3.5 py-2.5 font-medium text-[11px] tracking-wider uppercase">Status</th>
                <th className="px-3.5 py-2.5 font-medium text-[11px] tracking-wider uppercase text-right">Approval Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-aerodark-700/40 text-slate-300">
              {filteredPermissions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500 font-sans">
                    No flight permission requests found matching filter '{filterStatus}'.
                  </td>
                </tr>
              ) : (
                filteredPermissions.map((p) => {
                  const isPending = p.status === 'PENDING';
                  const isApproved = p.status === 'APPROVED';
                  const isRejected = p.status === 'REJECTED';

                  return (
                    <tr 
                      key={p.permission_id} 
                      className={`transition-colors ${
                        isPending 
                          ? 'bg-amber-500/[0.04] hover:bg-amber-500/[0.08]' 
                          : 'hover:bg-aerodark-800/50'
                      }`}
                    >
                      <td className="px-3.5 py-2.5 font-bold text-blue-400">{p.permission_id}</td>
                      <td className="px-3.5 py-2.5 font-semibold text-slate-200">{p.uin_number || p.drone_id}</td>
                      <td className="px-3.5 py-2.5 font-sans">{p.operator_name}</td>
                      <td className="px-3.5 py-2.5 font-sans text-slate-300">{p.flight_purpose}</td>
                      <td className="px-3.5 py-2.5 text-slate-400 font-sans">{p.allowed_zone}</td>
                      <td className="px-3.5 py-2.5">{p.max_altitude_m}m AGL</td>
                      <td className="px-3.5 py-2.5">
                        <span
                          className={`px-2.5 py-1 rounded-md font-sans font-medium text-[10px] inline-flex items-center space-x-1 ${
                            isApproved
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                              : isPending
                              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                              : 'bg-red-500/15 text-red-300 border border-red-500/30'
                          }`}
                        >
                          {isApproved && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                          {isPending && <Clock className="w-3 h-3 text-amber-400 animate-pulse" />}
                          {isRejected && <XCircle className="w-3 h-3 text-red-400" />}
                          <span>{p.status}</span>
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5 text-right">
                        {isPending ? (
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => handleApprove(p.permission_id)}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded-md font-sans text-xs font-semibold flex items-center space-x-1 transition-all shadow-sm"
                              title="Approve flight permission request"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>APPROVE</span>
                            </button>
                            <button
                              onClick={() => handleReject(p.permission_id)}
                              className="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded-md font-sans text-xs font-semibold flex items-center space-x-1 transition-all shadow-sm"
                              title="Reject flight permission request"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>REJECT</span>
                            </button>
                          </div>
                        ) : isApproved ? (
                          <div className="flex items-center justify-end space-x-2">
                            <span className="text-slate-400 text-[11px] font-sans">
                              {p.approved_by || 'Officer Raman'}
                            </span>
                            <button
                              onClick={() => handleReject(p.permission_id)}
                              className="bg-aerodark-800 hover:bg-red-500/20 text-slate-300 hover:text-red-300 border border-aerodark-700 hover:border-red-500/40 px-2 py-0.5 rounded font-sans text-[11px] transition-all"
                              title="Revoke active permission"
                            >
                              REVOKE
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end space-x-2">
                            <span className="text-red-400/80 text-[11px] font-sans">Rejected</span>
                            <button
                              onClick={() => handleApprove(p.permission_id)}
                              className="bg-aerodark-800 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-300 border border-aerodark-700 hover:border-emerald-500/40 px-2 py-0.5 rounded font-sans text-[11px] transition-all"
                              title="Re-evaluate and grant approval"
                            >
                              APPROVE
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Grant Flight Authorization / Submit Request */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn font-sans">
          <div className="bg-aerodark-900 border border-aerodark-700 rounded-xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-aerodark-700 pb-3">
              <div className="flex items-center space-x-2">
                <FileCheck2 className="w-5 h-5 text-blue-400" />
                <h3 className="font-semibold text-slate-100 text-sm">
                  Issue Flight Authorization / Log Request
                </h3>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePermit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Select Registered Drone</label>
                <select
                  value={modalDroneId}
                  onChange={(e) => {
                    setModalDroneId(e.target.value);
                    const sel = drones.find((d) => d.drone_id === e.target.value);
                    if (sel) setModalOperator(sel.owner_name);
                  }}
                  className="w-full bg-aerodark-800 border border-aerodark-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  {drones?.map((d) => (
                    <option key={d.drone_id} value={d.drone_id}>
                      {d.model_name} ({d.uin_number || d.drone_id}) — {d.owner_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Operator / Organization Name</label>
                <input
                  type="text"
                  value={modalOperator}
                  onChange={(e) => setModalOperator(e.target.value)}
                  placeholder="e.g. Tamil Nadu Port Authority"
                  className="w-full bg-aerodark-800 border border-aerodark-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Flight Purpose / Mission</label>
                <input
                  type="text"
                  value={modalPurpose}
                  onChange={(e) => setModalPurpose(e.target.value)}
                  placeholder="e.g. Harbor Pier Structural Survey"
                  className="w-full bg-aerodark-800 border border-aerodark-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Authorized Corridor / Zone</label>
                  <select
                    value={modalZone}
                    onChange={(e) => setModalZone(e.target.value)}
                    className="w-full bg-aerodark-800 border border-aerodark-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="ZONE-PORT-02">ZONE-PORT-02 (Chennai Harbor Commercial Corridor)</option>
                    <option value="ZONE-MARINA-01">ZONE-MARINA-01 (Marina Beach Coastal Patrol)</option>
                    {zones?.map((z) => (
                      <option key={z.zone_id} value={z.zone_id}>
                        {z.zone_id} - {z.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Max Altitude (meters AGL)</label>
                  <input
                    type="number"
                    value={modalAlt}
                    onChange={(e) => setModalAlt(e.target.value)}
                    min={10}
                    max={120}
                    className="w-full bg-aerodark-800 border border-aerodark-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Start Time (UTC)</label>
                  <input
                    type="text"
                    value={modalStart}
                    onChange={(e) => setModalStart(e.target.value)}
                    className="w-full bg-aerodark-800 border border-aerodark-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-blue-500 font-mono text-[11px]"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">End Time (UTC)</label>
                  <input
                    type="text"
                    value={modalEnd}
                    onChange={(e) => setModalEnd(e.target.value)}
                    className="w-full bg-aerodark-800 border border-aerodark-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-blue-500 font-mono text-[11px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Initial Status</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`p-2.5 rounded-lg border cursor-pointer flex items-center space-x-2 transition-all ${
                    modalStatus === 'APPROVED'
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
                      : 'bg-aerodark-800 border-aerodark-700 text-slate-400'
                  }`}>
                    <input
                      type="radio"
                      name="modalStatus"
                      value="APPROVED"
                      checked={modalStatus === 'APPROVED'}
                      onChange={() => setModalStatus('APPROVED')}
                      className="hidden"
                    />
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <div className="font-semibold text-xs">Direct Approval</div>
                      <div className="text-[10px] text-slate-400">Issue active permit immediately</div>
                    </div>
                  </label>

                  <label className={`p-2.5 rounded-lg border cursor-pointer flex items-center space-x-2 transition-all ${
                    modalStatus === 'PENDING'
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-200'
                      : 'bg-aerodark-800 border-aerodark-700 text-slate-400'
                  }`}>
                    <input
                      type="radio"
                      name="modalStatus"
                      value="PENDING"
                      checked={modalStatus === 'PENDING'}
                      onChange={() => setModalStatus('PENDING')}
                      className="hidden"
                    />
                    <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <div className="font-semibold text-xs">Pending Review</div>
                      <div className="text-[10px] text-slate-400">Log request awaiting officer review</div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-2.5 pt-3 border-t border-aerodark-700">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-aerodark-800 hover:bg-aerodark-700 text-slate-300 px-3.5 py-1.5 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg font-semibold transition-all shadow-sm flex items-center space-x-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{modalStatus === 'APPROVED' ? 'Grant Flight Permit' : 'Submit Request'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
