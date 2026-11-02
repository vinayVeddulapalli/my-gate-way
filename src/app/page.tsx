'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { appStore, AppState } from '@/lib/store';
import { 
  ShieldCheck, 
  UserCheck, 
  Bell, 
  QrCode, 
  Users, 
  ArrowRight, 
  Lock, 
  Camera, 
  CheckCircle2, 
  FileSpreadsheet, 
  Sparkles,
  Play,
  RotateCcw,
  Smartphone,
  Building2,
  Clock,
  Car
} from 'lucide-react';
import { StatusBadge } from '@/components/common/StatusBadge';
import { TimeAgo } from '@/components/common/TimeDisplay';

export default function HomePage() {
  const [state, setState] = useState<AppState>(appStore.getState());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return appStore.subscribe((s) => setState(s));
  }, []);

  const requests = state.visitorRequests;
  const insideCount = requests.filter(r => r.status === 'checked_in').length;
  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-12 pb-24 md:pb-16">
      {/* HERO SECTION */}
      <section className="bg-gradient-to-b from-[#0B132B] via-[#101A3B] to-[#1C2541] text-white pt-10 pb-16 px-4 sm:px-6 lg:px-8 border-b border-slate-800 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto space-y-6 relative z-10 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/80 text-emerald-400 text-xs font-bold tracking-wide shadow-inner">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>INDIAN RESIDENTIAL COMMUNITIES VISITOR MANAGEMENT</span>
          </div>

          <div className="max-w-3xl space-y-3">
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Gateway Security <span className="text-emerald-400 font-serif">द्वारपाल</span>
            </h1>
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
              Next-generation gated apartment visitor security with mobile-first guard terminals, real-time resident approval pipelines, DPDP-compliant private camera capture, and Supabase Row Level Security tenant isolation.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs">
            <div className="px-4 py-2 bg-slate-800/60 rounded-xl border border-slate-700 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Current Tenant: <strong>{state.currentCommunity.name}</strong></span>
            </div>
            <div className="px-4 py-2 bg-slate-800/60 rounded-xl border border-slate-700 flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-blue-400" />
              <span suppressHydrationWarning><strong>{mounted ? insideCount : 0}</strong> Visitors Inside Now</span>
            </div>
            <div className="px-4 py-2 bg-slate-800/60 rounded-xl border border-slate-700 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span suppressHydrationWarning><strong>{mounted ? pendingCount : 0}</strong> Pending Resident Approval</span>
            </div>
          </div>
        </div>
      </section>

      {/* THREE PRIMARY ROLE LAUNCHPADS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-8 space-y-1">
          <h2 className="text-xs font-extrabold text-emerald-700 uppercase tracking-widest">
            Interactive Role Portals
          </h2>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">
            Select an Interface to Test
          </h3>
          <p className="text-xs text-slate-500">
            Switch effortlessly between all 5 user roles at any time using the header persona switcher.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 1. SECURITY GUARD TERMINAL */}
          <div className="bg-white rounded-3xl border-2 border-slate-200 hover:border-emerald-500 hover:shadow-xl transition-all p-6 flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">
                  Gate Tablet UI
                </span>
              </div>

              <div>
                <h4 className="text-lg font-black text-slate-900 group-hover:text-blue-900">
                  Security Guard Terminal
                </h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Fast touch-friendly gate control. Register visitors with live camera capture, select flats, verify 6-digit guest passes, and trigger real-time approval requests.
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center gap-1.5 text-slate-800 font-semibold">
                  <Camera className="w-3.5 h-3.5 text-emerald-600" />
                  <span>WebRTC Camera + DPDP Consent</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-800 font-semibold">
                  <Smartphone className="w-3.5 h-3.5 text-blue-600" />
                  <span>Large Touch Buttons for Gate Tablets</span>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <Link
                href="/guard"
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
              >
                <span>OPEN GUARD TERMINAL</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* 2. RESIDENT & FAMILY DASHBOARD */}
          <div className="bg-white rounded-3xl border-2 border-slate-200 hover:border-emerald-500 hover:shadow-xl transition-all p-6 flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <Bell className="w-8 h-8" />
                </div>
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                  Flat B-402 Portal
                </span>
              </div>

              <div>
                <h4 className="text-lg font-black text-slate-900 group-hover:text-emerald-900">
                  Resident & Flat Owner App
                </h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Receive live visitor photos and masked phone alerts. One-tap Approve or Deny with safety confirmation modals, generate shareable guest passes, and manage family members.
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center gap-1.5 text-slate-800 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>1-Tap Decision with Confirmation</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-800 font-semibold">
                  <QrCode className="w-3.5 h-3.5 text-purple-600" />
                  <span>Time-Limited Guest Passes with PIN</span>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <Link
                href="/resident"
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-md shadow-emerald-950/20 transition-colors cursor-pointer"
              >
                <span>OPEN RESIDENT PORTAL</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* 3. COMMUNITY ADMIN DASHBOARD */}
          <div className="bg-white rounded-3xl border-2 border-slate-200 hover:border-emerald-500 hover:shadow-xl transition-all p-6 flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <Building2 className="w-8 h-8" />
                </div>
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-purple-100 text-purple-800">
                  Estate Manager
                </span>
              </div>

              <div>
                <h4 className="text-lg font-black text-slate-900 group-hover:text-purple-900">
                  Community Admin Console
                </h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Executive dashboard for estate managers. Real-time community occupancy, tower/flat directory, guard accounts, downloadable CSV reports, and immutable audit trails.
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center gap-1.5 text-slate-800 font-semibold">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Real CSV Export of Complete Logs</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-800 font-semibold">
                  <Lock className="w-3.5 h-3.5 text-slate-700" />
                  <span>Immutable Security Event Logs</span>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <Link
                href="/admin"
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
              >
                <span>OPEN ADMIN CONSOLE</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 8-STEP VISITOR LIFECYCLE WORKFLOW */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-1">
            <h2 className="text-xs font-bold text-emerald-700 uppercase tracking-widest">
              End-to-End State Machine
            </h2>
            <h3 className="text-2xl font-black text-slate-900">
              The 8-Step Gate Verification Workflow
            </h3>
            <p className="text-xs text-slate-500">
              Rigid transitions prevent unauthorized entries, expired passes, or bypassed steps.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="w-7 h-7 rounded-xl bg-slate-900 text-white font-black flex items-center justify-center text-xs">
                1
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Visitor Arrives</h4>
              <p className="text-slate-600">
                Guard records visitor name, +91 phone, purpose, and takes device camera photo with DPDP consent.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="w-7 h-7 rounded-xl bg-slate-900 text-white font-black flex items-center justify-center text-xs">
                2
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Flat Validation</h4>
              <p className="text-slate-600">
                System validates unit existence, displays verified resident names, and emits in-app alert.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="w-7 h-7 rounded-xl bg-slate-900 text-white font-black flex items-center justify-center text-xs">
                3
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Resident Decision</h4>
              <p className="text-slate-600">
                Resident views live photo and masked phone; clicks Approve or Deny with required confirmation modal.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white font-black flex items-center justify-center text-xs">
                4
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Real-Time Clearance</h4>
              <p className="text-slate-600">
                Guard screen turns vibrant green with audio chime. Only an explicit approved status allows Check-In.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* RECENT VISITOR ACTIVITY FEED PREVIEW */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <h3 className="font-extrabold text-base text-slate-900">
                Live Community Gate Activity Log
              </h3>
            </div>
            <Link href="/guard" className="text-xs font-bold text-emerald-700 hover:text-emerald-800">
              Open Full Terminal →
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {requests.slice(0, 4).map((r) => (
              <div key={r.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-200 overflow-hidden shrink-0 border border-slate-300">
                    {r.visitor_photo_path ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.visitor_photo_path} alt={r.visitor_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-slate-500 text-xs">
                        {r.visitor_name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{r.visitor_name}</span>
                      <StatusBadge status={r.status} size="sm" />
                    </div>
                    <div className="text-xs text-slate-500">
                      Destination: <strong>{r.block_name} • Flat {r.flat_number}</strong> • Purpose: {r.purpose}
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 text-right shrink-0" suppressHydrationWarning>
                  <TimeAgo date={r.created_at} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
