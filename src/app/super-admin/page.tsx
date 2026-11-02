'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { appStore, AppState } from '@/lib/store';
import { 
  Building2, 
  ShieldCheck, 
  Database, 
  Server, 
  Users, 
  CheckCircle2, 
  ArrowRight,
  ExternalLink,
  Globe
} from 'lucide-react';

export default function SuperAdminPage() {
  const [state, setState] = useState<AppState>(appStore.getState());

  useEffect(() => {
    return appStore.subscribe((s) => setState(s));
  }, []);

  const communities = [
    {
      id: state.currentCommunity.id,
      name: state.currentCommunity.name,
      code: state.currentCommunity.code,
      city: state.currentCommunity.city,
      state: state.currentCommunity.state,
      units: '1,420 Units',
      gates: '3 Gates',
      status: 'Active (Current Tenant)'
    },
    {
      id: 'comm-2',
      name: 'Sobha Dream Acres',
      code: 'SDA-BLR',
      city: 'Bengaluru',
      state: 'Karnataka',
      units: '6,500 Units',
      gates: '6 Gates',
      status: 'Active'
    },
    {
      id: 'comm-3',
      name: 'Godrej Woods',
      code: 'GW-NOIDA',
      city: 'Noida',
      state: 'Uttar Pradesh',
      units: '980 Units',
      gates: '2 Gates',
      status: 'Active'
    },
    {
      id: 'comm-4',
      name: 'DLF Magnolias',
      code: 'DLF-GGN',
      city: 'Gurugram',
      state: 'Haryana',
      units: '589 Units',
      gates: '4 Gates',
      status: 'Active'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-12 space-y-6">
      <div className="bg-[#0B132B] text-white p-6 rounded-3xl shadow-xl border border-slate-800">
        <div className="text-amber-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
          <Globe className="w-4 h-4" />
          <span>Multi-Tenant Enterprise Portal</span>
        </div>
        <h1 className="text-2xl font-black tracking-tight mt-0.5">
          Super Admin Management Console
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Global multi-community oversight, PostgreSQL Row Level Security tenant partitions, and system health telemetry.
        </p>
      </div>

      {/* System Health Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="text-base font-black text-slate-900">PostgreSQL RLS</div>
            <div className="text-xs text-emerald-600 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Multi-Tenant Strict Isolation Active</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <div className="text-base font-black text-slate-900">Private Photo Storage</div>
            <div className="text-xs text-blue-600 font-bold">
              15-Min Signed Token Access
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-base font-black text-slate-900">DPDP Compliance</div>
            <div className="text-xs text-purple-600 font-bold">
              Automated 90-Day Retention Scrub
            </div>
          </div>
        </div>
      </div>

      {/* Communities Directory */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-extrabold text-base text-slate-900">
            Registered Residential Communities ({communities.length})
          </h2>
          <span className="text-xs text-slate-500 font-mono">Multi-Tenant Cloud</span>
        </div>

        <div className="divide-y divide-slate-100">
          {communities.map((comm, idx) => (
            <div key={comm.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-base shrink-0">
                  <Building2 className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base text-slate-900">{comm.name}</h3>
                    <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                      {comm.code}
                    </span>
                    {idx === 0 && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-300">
                        Current Active Scope
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {comm.city}, {comm.state} • {comm.units} • {comm.gates}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                >
                  <span>Access Community Portal</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
