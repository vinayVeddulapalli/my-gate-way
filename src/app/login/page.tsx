'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Home, 
  ShieldCheck, 
  Building2, 
  ArrowRight, 
  CheckCircle2, 
  Lock, 
  Smartphone, 
  KeyRound, 
  Mail, 
  MapPin, 
  UserCheck, 
  Sparkles,
  Info
} from 'lucide-react';
import { appStore } from '@/lib/store';

type PortalTab = 'resident' | 'guard' | 'admin';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initial tab from query parameter (e.g. /login?portal=guard or /login?tab=admin)
  const initialTab = (searchParams.get('portal') || searchParams.get('tab') || 'resident') as PortalTab;
  const [activeTab, setActiveTab] = useState<PortalTab>(
    ['resident', 'guard', 'admin'].includes(initialTab) ? initialTab : 'resident'
  );

  // Resident Form State
  const [residentPhone, setResidentPhone] = useState('+91 98111 22334');
  const [residentOtpSent, setResidentOtpSent] = useState(false);
  const [residentOtp, setResidentOtp] = useState('1234');
  const [residentLoading, setResidentLoading] = useState(false);

  // Guard Form State
  const [selectedGate, setSelectedGate] = useState('b0000000-0000-0000-0000-000000000001');
  const [guardPhone, setGuardPhone] = useState('+91 98765 43210');
  const [guardPin, setGuardPin] = useState('4321');
  const [guardLoading, setGuardLoading] = useState(false);

  // Admin Form State
  const [adminEmail, setAdminEmail] = useState('rajesh.admin@prestige.in');
  const [adminPassword, setAdminPassword] = useState('••••••••');
  const [adminLoading, setAdminLoading] = useState(false);

  const state = appStore.getState();

  // Sync tab if URL param changes
  useEffect(() => {
    const tabParam = searchParams.get('portal') || searchParams.get('tab');
    if (tabParam && ['resident', 'guard', 'admin'].includes(tabParam)) {
      setActiveTab(tabParam as PortalTab);
    }
  }, [searchParams]);

  // 1. RESIDENT LOGIN HANDLERS
  const handleResidentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!residentOtpSent) {
      setResidentLoading(true);
      setTimeout(() => {
        setResidentLoading(false);
        setResidentOtpSent(true);
      }, 400);
      return;
    }

    // Sign in verified resident
    const residentUser = state.users.find(u => u.role === 'resident') || state.users[1];
    appStore.switchActiveUser(residentUser.id);
    router.push('/resident');
  };

  const handleQuickSignInResident = () => {
    const residentUser = state.users.find(u => u.role === 'resident') || state.users[1];
    appStore.switchActiveUser(residentUser.id);
    router.push('/resident');
  };

  // 2. GUARD LOGIN HANDLERS
  const handleGuardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGuardLoading(true);
    setTimeout(() => {
      setGuardLoading(false);
      const guardUser = state.users.find(u => u.role === 'security_guard') || state.users[0];
      appStore.switchActiveUser(guardUser.id);
      router.push('/guard');
    }, 400);
  };

  const handleQuickSignInGuard = () => {
    const guardUser = state.users.find(u => u.role === 'security_guard') || state.users[0];
    appStore.switchActiveUser(guardUser.id);
    router.push('/guard');
  };

  // 3. ADMIN LOGIN HANDLERS
  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoading(true);
    setTimeout(() => {
      setAdminLoading(false);
      const adminUser = state.users.find(u => u.role === 'community_admin') || state.users[3];
      appStore.switchActiveUser(adminUser.id);
      router.push('/admin');
    }, 400);
  };

  const handleQuickSignInAdmin = () => {
    const adminUser = state.users.find(u => u.role === 'community_admin') || state.users[3];
    appStore.switchActiveUser(adminUser.id);
    router.push('/admin');
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center p-4 sm:p-6 bg-gradient-to-b from-slate-100 via-slate-50 to-[#F4F2EE]">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.06)] overflow-hidden">
        {/* Top Community Banner */}
        <div className="bg-[#101A3B] px-6 py-5 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-black tracking-tight text-white flex items-center gap-1.5">
                <span>{state.currentCommunity.name}</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded font-mono">
                  {state.currentCommunity.code}
                </span>
              </div>
              <p className="text-[11px] text-slate-300">Unified Gateway Access System</p>
            </div>
          </div>

          <div className="text-right">
            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live System</span>
            </span>
          </div>
        </div>

        {/* 3 Dedicated Role Selection Tabs */}
        <div className="grid grid-cols-3 bg-slate-100/90 p-1.5 border-b border-slate-200 text-xs font-bold">
          {/* Tab 1: Resident */}
          <button
            type="button"
            onClick={() => setActiveTab('resident')}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'resident'
                ? 'bg-white text-[#E05D44] shadow-xs ring-1 ring-black/5 font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Home className="w-4 h-4 shrink-0" />
            <span className="truncate">Resident</span>
          </button>

          {/* Tab 2: Security Guard */}
          <button
            type="button"
            onClick={() => setActiveTab('guard')}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'guard'
                ? 'bg-white text-emerald-700 shadow-xs ring-1 ring-black/5 font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span className="truncate">Gate Guard</span>
          </button>

          {/* Tab 3: Society Admin */}
          <button
            type="button"
            onClick={() => setActiveTab('admin')}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'admin'
                ? 'bg-white text-indigo-700 shadow-xs ring-1 ring-black/5 font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Building2 className="w-4 h-4 shrink-0" />
            <span className="truncate">Admin</span>
          </button>
        </div>

        <div className="p-6 sm:p-7 space-y-6">
          {/* ========================================================================= */}
          {/* TAB 1: RESIDENT & OWNER PORTAL */}
          {/* ========================================================================= */}
          {activeTab === 'resident' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div>
                <div className="inline-block px-2.5 py-0.5 bg-[#FDEEEB] text-[#E05D44] text-[10px] font-black uppercase tracking-wider rounded-md mb-2">
                  RESIDENT & OWNER ACCESS
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  Welcome to Your Home
                </h2>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Approve visitors at the gate, issue time-limited guest passes, and switch seamlessly between your 10-flat portfolio.
                </p>
              </div>

              {/* Verified Owner Showcase Card */}
              <div className="p-4 bg-orange-50/70 border border-orange-200/70 rounded-2xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-[#E05D44] text-white font-extrabold text-sm flex items-center justify-center shrink-0 shadow-xs">
                    AS
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span>Aarav Sharma</span>
                      <span className="text-[10px] bg-white text-[#E05D44] px-1.5 py-0.2 rounded font-semibold border border-orange-200">
                        Owner
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 truncate">
                      Flat 1204 (Primary) + 8 Rented + 1 Vacant
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleQuickSignInResident}
                  className="px-3 py-1.5 bg-[#E05D44] hover:bg-[#c94d35] text-white text-xs font-bold rounded-xl transition-colors shrink-0 shadow-xs cursor-pointer flex items-center gap-1"
                >
                  <span>1-Click Entry</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Standard Mobile + OTP Form */}
              <form onSubmit={handleResidentSubmit} className="space-y-4 pt-1">
                {!residentOtpSent ? (
                  <div>
                    <label className="text-xs font-bold text-slate-800 block mb-1.5 flex items-center justify-between">
                      <span>Registered Mobile Number</span>
                      <span className="text-[10px] text-slate-400 font-normal">Pre-filled with resident record</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <input
                        type="tel"
                        value={residentPhone}
                        onChange={(e) => setResidentPhone(e.target.value)}
                        placeholder="+91 98111 22334"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-medium placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#E05D44] focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="text-xs font-bold text-slate-800 block mb-1.5 flex items-center justify-between">
                      <span>4-Digit Verification Code</span>
                      <span className="text-[10px] text-emerald-600 font-bold">Auto-generated</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <KeyRound className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={residentOtp}
                        onChange={(e) => setResidentOtp(e.target.value)}
                        maxLength={4}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-lg font-bold tracking-widest text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#E05D44]"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 text-center">
                      Testing pre-filled OTP: <strong>1234</strong>
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={residentLoading}
                  className="w-full py-3.5 bg-[#E05D44] hover:bg-[#c94d35] text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  {residentLoading ? (
                    <span>Authenticating...</span>
                  ) : residentOtpSent ? (
                    <>
                      <span>Enter Resident Portal</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <span>Send Authorization Code</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: SECURITY GUARD TERMINAL */}
          {/* ========================================================================= */}
          {activeTab === 'guard' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div>
                <div className="inline-block px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-wider rounded-md mb-2">
                  SECURITY GATE TERMINAL
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  Gate Kiosk Terminal
                </h2>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Touch-friendly guard interface for capturing visitor photos, verifying pre-approved guest passes, and logging daily help.
                </p>
              </div>

              {/* Stationed Guard Showcase Card */}
              <div className="p-4 bg-emerald-50/70 border border-emerald-200/70 rounded-2xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-extrabold text-sm flex items-center justify-center shrink-0 shadow-xs">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span>Ramesh Kumar</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-semibold border border-emerald-300">
                        Duty Guard
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 truncate">
                      Main North Gate 1 • Active Duty Shift
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleQuickSignInGuard}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-colors shrink-0 shadow-xs cursor-pointer flex items-center gap-1"
                >
                  <span>1-Click Entry</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Guard Kiosk Gate Selection + PIN Form */}
              <form onSubmit={handleGuardSubmit} className="space-y-4 pt-1">
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1.5">
                    Stationed Gate Location
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <MapPin className="w-4 h-4 text-emerald-600" />
                    </div>
                    <select
                      value={selectedGate}
                      onChange={(e) => setSelectedGate(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all appearance-none cursor-pointer"
                    >
                      {state.gates.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-800 block mb-1.5">
                      Guard Mobile
                    </label>
                    <input
                      type="tel"
                      value={guardPhone}
                      onChange={(e) => setGuardPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-800 block mb-1.5">
                      Terminal Duty PIN
                    </label>
                    <input
                      type="password"
                      value={guardPin}
                      onChange={(e) => setGuardPin(e.target.value)}
                      maxLength={4}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-bold tracking-widest text-center focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={guardLoading}
                  className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  {guardLoading ? (
                    <span>Opening Gate Terminal...</span>
                  ) : (
                    <>
                      <span>Start Shift at Gate Kiosk</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: SOCIETY ADMIN CONSOLE */}
          {/* ========================================================================= */}
          {activeTab === 'admin' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div>
                <div className="inline-block px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-wider rounded-md mb-2">
                  COMMUNITY ADMIN CONSOLE
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  Estate Management Office
                </h2>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Oversee society occupancy, review live gate logs, download compliance CSV exports, and manage flat allocations.
                </p>
              </div>

              {/* Verified Estate Manager Showcase Card */}
              <div className="p-4 bg-indigo-50/70 border border-indigo-200/70 rounded-2xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-extrabold text-sm flex items-center justify-center shrink-0 shadow-xs">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span>Rajesh Iyer</span>
                      <span className="text-[10px] bg-indigo-100 text-indigo-800 px-1.5 py-0.2 rounded font-semibold border border-indigo-300">
                        Estate Mgr
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 truncate">
                      Palm Meadows Society Management Office
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleQuickSignInAdmin}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors shrink-0 shadow-xs cursor-pointer flex items-center gap-1"
                >
                  <span>1-Click Entry</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Admin Email & Password Form */}
              <form onSubmit={handleAdminSubmit} className="space-y-4 pt-1">
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1.5">
                    Official Admin Work Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="rajesh.admin@prestige.in"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1.5">
                    Master Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={adminLoading}
                  className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  {adminLoading ? (
                    <span>Verifying Credentials...</span>
                  ) : (
                    <>
                      <span>Open Management Console</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Global Footer info bar */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>DPDP & RLS Isolated Sessions</span>
          </span>
          <span className="font-semibold text-slate-600">
            {activeTab === 'resident'
              ? 'Resident View'
              : activeTab === 'guard'
              ? 'Gate Terminal View'
              : 'Admin View'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[90vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md h-96 bg-white rounded-3xl animate-pulse" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
