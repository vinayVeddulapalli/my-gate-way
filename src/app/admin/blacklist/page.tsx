'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { appStore, AppState } from '@/lib/store';
import { 
  ArrowLeft, 
  Ban, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  Search, 
  ShieldAlert, 
  UserX, 
  CheckCircle2, 
  Phone, 
  Calendar 
} from 'lucide-react';
import { BlacklistEntry } from '@/types';
import { TimeAgo } from '@/components/common/TimeDisplay';

export default function AdminBlacklistPage() {
  const [state, setState] = useState<AppState>(appStore.getState());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [reason, setReason] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    return appStore.subscribe((s) => setState(s));
  }, []);

  const blacklist = state.blacklist || [];

  const filteredEntries = blacklist.filter((b) => {
    const q = search.trim().toLowerCase();
    return !q || 
      b.visitor_name.toLowerCase().includes(q) || 
      b.visitor_phone.includes(q) || 
      b.reason.toLowerCase().includes(q);
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Please enter visitor name');
      return;
    }
    if (!phone.trim() || phone.replace(/\D/g, '').length < 10) {
      setFormError('Please enter a valid 10-digit mobile number');
      return;
    }
    if (!reason.trim()) {
      setFormError('Please provide a reason for blacklisting');
      return;
    }

    setFormError('');
    const newEntry = appStore.addBlacklistEntry({
      visitor_name: name.trim(),
      visitor_phone: phone.trim(),
      reason: reason.trim()
    });

    setBannerMessage(`🚨 "${newEntry.visitor_name}" added to society blacklist. Gate terminal will now block entry.`);
    setName('');
    setPhone('');
    setReason('');
    setIsModalOpen(false);
    setTimeout(() => setBannerMessage(null), 5000);
  };

  const handleRemove = (id: string, visitorName: string) => {
    if (confirm(`Remove "${visitorName}" from society blacklist? Gate guards will no longer block this visitor.`)) {
      appStore.removeBlacklistEntry(id);
      setBannerMessage(`"${visitorName}" removed from blacklist.`);
      setTimeout(() => setBannerMessage(null), 4000);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-12 space-y-6">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-2 rounded-xl shadow-xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Admin Console</span>
        </Link>
        <span className="text-xs font-semibold text-slate-500">
          Society Security Controls • Phase 1
        </span>
      </div>

      {/* Banner */}
      {bannerMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center gap-3 text-emerald-900 text-xs sm:text-sm font-semibold animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{bannerMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-red-600 text-xs font-bold uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4" />
            <span>Blacklist & Security Enforcement</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Society Visitor Blacklist
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            Restricted individuals, unauthorized canvassers, and flagged delivery drivers. When a guard enters a blacklisted phone, the gate kiosk triggers an immediate audible barrier lockdown.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-3 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>ADD TO BLACKLIST</span>
        </button>
      </div>

      {/* Search Bar & Count Stats */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone (+91 91234...), or ban reason..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-red-600"
          />
        </div>

        <div className="text-xs font-bold text-slate-600 px-3 py-2 bg-slate-100 rounded-xl shrink-0 text-center">
          {filteredEntries.length} Restricted Individuals
        </div>
      </div>

      {/* Blacklist Items Roster */}
      <div className="space-y-3">
        {filteredEntries.length > 0 ? (
          filteredEntries.map((b) => (
            <div
              key={b.id}
              className="bg-white rounded-2xl border-2 border-red-100 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-red-200 transition-colors"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                  <UserX className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-base text-slate-900">
                      {b.visitor_name}
                    </span>
                    <span className="font-mono text-xs font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md border border-slate-200">
                      {b.visitor_phone}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-wider bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                      BANNED ENTRY
                    </span>
                  </div>

                  <p className="text-xs text-red-700 font-medium">
                    Reason: &ldquo;{b.reason}&rdquo;
                  </p>

                  <div className="text-[11px] text-slate-400 flex items-center gap-2 flex-wrap pt-0.5">
                    <span>Enforced by: <strong>{b.created_by_name}</strong></span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <TimeAgo date={b.created_at} />
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => handleRemove(b.id, b.visitor_name)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Unblock / Remove</span>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">No Blacklisted Visitors Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {search ? 'No blocked visitors match your search filter.' : 'All visitors are currently allowed according to standard gate verification rules.'}
            </p>
          </div>
        )}
      </div>

      {/* Add to Blacklist Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="bg-red-600 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ban className="w-5 h-5 text-white" />
                <h3 className="text-sm font-bold tracking-tight">Block Visitor from Community</h3>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setFormError('');
                }}
                className="text-white/80 hover:text-white font-bold text-base cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-700 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  Visitor / Delivery Agent Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Unauthorized Vendor or Banned Individual"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-red-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  Mobile Number (10 Digits) <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 91234 56789"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:outline-hidden focus:ring-2 focus:ring-red-600"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Guard kiosk checks this number in real-time during registration.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  Ban Reason / Incident Notes <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  placeholder="e.g. Repeated trespass without resident approval, altercation with gate security, fraudulent parcel scheme..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-red-600"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Confirm & Ban Visitor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

