'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { appStore, AppState } from '@/lib/store';
import { 
  ArrowLeft, 
  ShieldAlert, 
  Settings, 
  Save, 
  Check, 
  History, 
  Lock, 
  Building2,
  PhoneCall
} from 'lucide-react';
import { DateTimeDisplay } from '@/components/common/TimeDisplay';

export default function AdminAuditPage() {
  const [state, setState] = useState<AppState>(appStore.getState());
  const [retentionDays, setRetentionDays] = useState(90);
  const [policePhone, setPolicePhone] = useState('112');
  const [ambulancePhone, setAmbulancePhone] = useState('108');
  const [firePhone, setFirePhone] = useState('101');
  const [estateManagerPhone, setEstateManagerPhone] = useState('+91 98450 12345');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    return appStore.subscribe((s) => {
      setState(s);
      setRetentionDays(s.currentCommunity.visitor_retention_days || 90);
      setPolicePhone(s.currentCommunity.emergency_police || '112');
      setAmbulancePhone(s.currentCommunity.emergency_ambulance || '108');
      setFirePhone(s.currentCommunity.emergency_fire || '101');
      setEstateManagerPhone(s.currentCommunity.estate_manager_phone || '+91 98450 12345');
    });
  }, []);

  const logs = state.auditLogs;

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    appStore.updateCommunitySettings({
      visitor_retention_days: Number(retentionDays),
      emergency_police: policePhone,
      emergency_ambulance: ambulancePhone,
      emergency_fire: firePhone,
      estate_manager_phone: estateManagerPhone
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-12 space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-2 rounded-xl shadow-xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Admin Dashboard</span>
        </Link>
        <span className="text-xs font-semibold text-slate-500">Governance & Compliance</span>
      </div>

      <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-sm border border-slate-200/90">
        <div className="text-emerald-700 text-xs font-bold uppercase tracking-wider">
          Compliance & Security Controls
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
          Audit Trail & Community Settings
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Immutable event logs, DPDP visitor photo retention policies, and gate emergency contacts.
        </p>
      </div>

      {isSaved && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center gap-3 text-emerald-800 text-xs font-bold animate-in fade-in">
          <Check className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Community configuration updated successfully.</span>
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSaveSettings} className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Settings className="w-5 h-5 text-slate-700" />
          <h2 className="font-extrabold text-base text-slate-900">
            Community Retention & Safety Parameters
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Retention Days */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Visitor Photograph & Log Retention Period (DPDP Compliance)
            </label>
            <select
              value={retentionDays}
              onChange={(e) => setRetentionDays(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl bg-white focus:outline-hidden"
            >
              <option value={30}>30 Days (Maximum Privacy)</option>
              <option value={60}>60 Days</option>
              <option value={90}>90 Days (Recommended Standard)</option>
              <option value={180}>180 Days (Extended Audit)</option>
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              Photographs older than this limit are permanently scrubbed from private storage automatically.
            </p>
          </div>

          {/* Estate Manager Contact */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Security Office / Estate Manager Hotline
            </label>
            <input
              type="tel"
              value={estateManagerPhone}
              onChange={(e) => setEstateManagerPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm font-mono border border-slate-300 rounded-xl focus:outline-hidden"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Police Emergency Number
            </label>
            <input
              type="text"
              value={policePhone}
              onChange={(e) => setPolicePhone(e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-xl focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Medical Ambulance Number
            </label>
            <input
              type="text"
              value={ambulancePhone}
              onChange={(e) => setAmbulancePhone(e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-xl focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Fire Emergency Number
            </label>
            <input
              type="text"
              value={firePhone}
              onChange={(e) => setFirePhone(e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-xl focus:outline-hidden"
            />
          </div>
        </div>

        <button
          type="submit"
          className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>SAVE COMMUNITY CONFIGURATION</span>
        </button>
      </form>

      {/* Immutable Audit Logs Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-emerald-600" />
            <h2 className="font-extrabold text-base text-slate-900">
              Immutable Security Event Audit Trail ({logs.length})
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-400">PostgreSQL Append-Only</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="p-4">Timestamp</th>
                <th className="p-4">Action</th>
                <th className="p-4">Actor</th>
                <th className="p-4">Role</th>
                <th className="p-4">Entity Type</th>
                <th className="p-4">Event Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/70">
                  <td className="p-4 font-sans text-slate-500" suppressHydrationWarning>
                    <DateTimeDisplay date={log.created_at} />
                  </td>
                  <td className="p-4">
                    <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                      {log.action}
                    </span>
                  </td>
                  <td className="p-4 font-sans font-bold text-slate-800">{log.actor_name}</td>
                  <td className="p-4 font-sans capitalize text-slate-600">{log.actor_role.replace('_', ' ')}</td>
                  <td className="p-4 text-slate-600">{log.entity_type}</td>
                  <td className="p-4 text-slate-600 truncate max-w-[260px]">
                    {JSON.stringify(log.metadata || {})}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
