'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { appStore, AppState } from '@/lib/store';
import { ArrowLeft, UserCheck, ShieldCheck, DoorOpen, Plus, Phone, Mail, CheckCircle2 } from 'lucide-react';

export default function AdminStaffPage() {
  const [state, setState] = useState<AppState>(appStore.getState());
  const [activeTab, setActiveTab] = useState<'guards' | 'gates' | 'residents'>('guards');

  useEffect(() => {
    return appStore.subscribe((s) => setState(s));
  }, []);

  const guards = state.users.filter(u => u.role === 'security_guard');
  const residents = state.users.filter(u => u.role === 'resident' || u.role === 'family_member');
  const gates = state.gates;

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
        <span className="text-xs font-semibold text-slate-500">Security Personnel</span>
      </div>

      <div className="bg-[#0B132B] text-white p-6 rounded-3xl shadow-xl border border-slate-800">
        <div className="text-emerald-400 text-xs font-bold uppercase tracking-wider">
          Access Control & Gate Stations
        </div>
        <h1 className="text-2xl font-black tracking-tight mt-0.5">
          Guards, Gates & Staff Operations
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage security guard accounts, physical gate barriers, and resident access credentials.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('guards')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-colors ${
            activeTab === 'guards' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Security Guards ({guards.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('gates')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-colors ${
            activeTab === 'gates' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <DoorOpen className="w-4 h-4" />
          <span>Entrance Gates ({gates.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('residents')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-colors ${
            activeTab === 'residents' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Resident Accounts ({residents.length})</span>
        </button>
      </div>

      {/* GUARDS LIST */}
      {activeTab === 'guards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {guards.map((guard) => (
            <div key={guard.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-base">
                    {guard.full_name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">{guard.full_name}</h3>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 uppercase">
                      Security Officer
                    </span>
                  </div>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" title="Active on duty" />
              </div>

              <div className="text-xs space-y-1 text-slate-600 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5 font-mono">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{guard.phone}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{guard.email}</span>
                </div>
                <div className="text-[11px] font-semibold text-slate-800 pt-1">
                  Primary Post: Main North Gate 1 (Boom Barrier Terminal)
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* GATES LIST */}
      {activeTab === 'gates' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {gates.map((gate) => (
            <div key={gate.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-start justify-between">
                <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
                  <DoorOpen className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-300">
                  Operational
                </span>
              </div>

              <div>
                <h3 className="font-extrabold text-base text-slate-900">{gate.name}</h3>
                <p className="text-xs text-slate-500 capitalize">Type: {gate.gate_type} Gate Terminal</p>
              </div>

              <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                Tablet Camera Active • Boom Barrier Interface Connected
              </div>
            </div>
          ))}
        </div>
      )}

      {/* RESIDENTS LIST */}
      {activeTab === 'residents' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 font-extrabold text-sm text-slate-900">
            Enrolled Residents & Flat Owners
          </div>
          <div className="divide-y divide-slate-100">
            {residents.map((res) => (
              <div key={res.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
                    {res.full_name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-900">{res.full_name}</div>
                    <div className="text-xs text-slate-500">{res.flat_display || 'Flat B-402'} • {res.phone}</div>
                  </div>
                </div>

                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-300">
                  {res.role === 'resident' ? 'Flat Owner' : 'Authorized Co-Resident'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
