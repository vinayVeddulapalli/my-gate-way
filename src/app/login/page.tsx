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
  Info,
  Server,
  AlertCircle,
  Wifi,
  Copy,
  ExternalLink
} from 'lucide-react';
import { appStore } from '@/lib/store';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

type PortalTab = 'resident' | 'guard' | 'admin' | 'superadmin';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initial tab from query parameter (e.g. /login?portal=guard or /login?tab=admin)
  const initialTab = (searchParams.get('portal') || searchParams.get('tab') || 'resident') as PortalTab;
  const [activeTab, setActiveTab] = useState<PortalTab>(
    ['resident', 'guard', 'admin', 'superadmin'].includes(initialTab) ? initialTab : 'resident'
  );

  // Common UI State
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCheatSheet, setShowCheatSheet] = useState(true);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Resident Form State
  const [residentEmail, setResidentEmail] = useState('owner@gatewaysecurity.in');
  const [residentPassword, setResidentPassword] = useState('Owner@123');
  const [useOtpMode, setUseOtpMode] = useState(false);
  const [residentPhone, setResidentPhone] = useState('+91 98111 22334');
  const [residentOtpSent, setResidentOtpSent] = useState(false);
  const [residentOtp, setResidentOtp] = useState('1234');

  // Guard Form State
  const [guardEmail, setGuardEmail] = useState('guard@gatewaysecurity.in');
  const [guardPassword, setGuardPassword] = useState('Guard@123');
  const [selectedGate, setSelectedGate] = useState('b0000000-0000-0000-0000-000000000001');

  // Admin Form State
  const [adminEmail, setAdminEmail] = useState('admin@gatewaysecurity.in');
  const [adminPassword, setAdminPassword] = useState('Admin@123');

  // Superadmin Form State
  const [superEmail, setSuperEmail] = useState('superadmin@gatewaysecurity.in');
  const [superPassword, setSuperPassword] = useState('Super@123');

  const state = appStore.getState();

  // Sync tab if URL param changes
  useEffect(() => {
    const tabParam = searchParams.get('portal') || searchParams.get('tab');
    if (tabParam && ['resident', 'guard', 'admin', 'superadmin'].includes(tabParam)) {
      setActiveTab(tabParam as PortalTab);
    }
  }, [searchParams]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Helper for real Supabase authentication
  const executeSupabaseAuth = async (
    email: string,
    password: string,
    roleTarget: string,
    redirectPath: string,
    localFallbackUserId: string
  ) => {
    setLoading(true);
    setAuthError(null);
    setAuthSuccess(null);

    const cleanEmail = email.trim();

    try {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: password
        });

        if (error) {
          // If credentials not found or unconfirmed in auth.users, provide helpful instruction
          console.warn('Supabase Auth error:', error.message);
          setAuthError(
            `${error.message}. (Ensure you have executed migrations/09_create_auth_users.sql in your Supabase SQL Editor, or use 1-Click Entry below).`
          );
          setLoading(false);
          return;
        }

        if (data?.user) {
          setAuthSuccess(`Authenticated with Supabase Cloud as ${cleanEmail}!`);
          appStore.switchActiveUser(data.user.email || data.user.id);
          setTimeout(() => {
            router.push(redirectPath);
          }, 400);
          return;
        }
      }

      // Local / Offline fallback mode
      appStore.switchActiveUser(localFallbackUserId);
      setAuthSuccess('Local security session active!');
      setTimeout(() => {
        router.push(redirectPath);
      }, 400);
    } catch (err) {
      console.error('Login error:', err);
      // Fallback
      appStore.switchActiveUser(localFallbackUserId);
      router.push(redirectPath);
    } finally {
      setLoading(false);
    }
  };

  // 1. RESIDENT LOGIN HANDLERS
  const handleResidentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (useOtpMode) {
      if (!residentOtpSent) {
        setLoading(true);
        setTimeout(() => {
          setLoading(false);
          setResidentOtpSent(true);
        }, 400);
        return;
      }
      const residentUser = state.users.find(u => u.role === 'resident') || state.users[1];
      appStore.switchActiveUser(residentUser.id);
      router.push('/resident');
      return;
    }

    const residentUser = state.users.find(u => u.role === 'resident') || state.users[1];
    await executeSupabaseAuth(
      residentEmail,
      residentPassword,
      'resident',
      '/resident',
      residentUser.id
    );
  };

  const handleQuickSignInResident = () => {
    const residentUser = state.users.find(u => u.role === 'resident') || state.users[1];
    appStore.switchActiveUser(residentUser.id);
    router.push('/resident');
  };

  // 2. GUARD LOGIN HANDLERS
  const handleGuardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const guardUser = state.users.find(u => u.role === 'security_guard') || state.users[0];
    await executeSupabaseAuth(
      guardEmail,
      guardPassword,
      'security_guard',
      '/guard',
      guardUser.id
    );
  };

  const handleQuickSignInGuard = () => {
    const guardUser = state.users.find(u => u.role === 'security_guard') || state.users[0];
    appStore.switchActiveUser(guardUser.id);
    router.push('/guard');
  };

  // 3. ADMIN LOGIN HANDLERS
  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const adminUser = state.users.find(u => u.role === 'community_admin') || state.users[3];
    await executeSupabaseAuth(
      adminEmail,
      adminPassword,
      'community_admin',
      '/admin',
      adminUser.id
    );
  };

  const handleQuickSignInAdmin = () => {
    const adminUser = state.users.find(u => u.role === 'community_admin') || state.users[3];
    appStore.switchActiveUser(adminUser.id);
    router.push('/admin');
  };

  // 4. SUPERADMIN LOGIN HANDLERS
  const handleSuperSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const superUser = state.users.find(u => u.role === 'super_admin') || state.users[4];
    await executeSupabaseAuth(
      superEmail,
      superPassword,
      'super_admin',
      '/super-admin',
      superUser.id
    );
  };

  const handleQuickSignInSuper = () => {
    const superUser = state.users.find(u => u.role === 'super_admin') || state.users[4];
    appStore.switchActiveUser(superUser.id);
    router.push('/super-admin');
  };

  return (
    <div className="min-h-[90vh] flex flex-col items-center justify-center p-4 sm:p-6 bg-gradient-to-b from-slate-100 via-slate-50 to-[#F4F2EE] space-y-6">
      
      {/* Multi-Phone Network Testing Guide Banner */}
      <div className="w-full max-w-2xl bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <Wifi className="w-5 h-5 text-emerald-700 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                Live Multi-Phone Realtime Testing
              </h2>
              <p className="text-xs text-slate-500">
                Connect your phones on the same Wi-Fi and log in as separate roles:
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowCheatSheet(!showCheatSheet)}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
          >
            {showCheatSheet ? 'Hide Credentials' : 'Show Credentials'}
          </button>
        </div>

        {/* Local Wi-Fi URL Pill */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="text-xs font-semibold text-slate-700 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Open on your phone browser:</span>
            <code className="px-2 py-0.5 bg-slate-200 text-slate-900 rounded font-mono font-bold text-xs">
              http://192.168.0.140:3001
            </code>
          </div>
          <button
            onClick={() => handleCopy('http://192.168.0.140:3001', 'URL')}
            className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Copy className="w-3 h-3 text-slate-500" />
            <span>{copiedText === 'URL' ? 'Copied!' : 'Copy Phone URL'}</span>
          </button>
        </div>

        {/* 4 Roles Credentials Grid */}
        {showCheatSheet && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs pt-1">
            {/* Guard */}
            <div className="p-3 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl space-y-1">
              <div className="font-extrabold text-emerald-800 flex items-center justify-between">
                <span>1. Gate Guard</span>
                <span className="text-[10px] bg-emerald-200 text-emerald-900 px-1.5 py-0.2 rounded font-bold">/guard</span>
              </div>
              <div className="text-[11px] text-slate-600 font-mono truncate">guard@gatewaysecurity.in</div>
              <div className="text-[11px] text-slate-800 font-mono font-bold">Guard@123</div>
            </div>

            {/* Resident */}
            <div className="p-3 bg-orange-50/60 border border-orange-200/80 rounded-2xl space-y-1">
              <div className="font-extrabold text-[#E05D44] flex items-center justify-between">
                <span>2. Owner (B-402)</span>
                <span className="text-[10px] bg-orange-200 text-orange-900 px-1.5 py-0.2 rounded font-bold">/resident</span>
              </div>
              <div className="text-[11px] text-slate-600 font-mono truncate">owner@gatewaysecurity.in</div>
              <div className="text-[11px] text-slate-800 font-mono font-bold">Owner@123</div>
            </div>

            {/* Admin */}
            <div className="p-3 bg-indigo-50/60 border border-indigo-200/80 rounded-2xl space-y-1">
              <div className="font-extrabold text-indigo-800 flex items-center justify-between">
                <span>3. Society Admin</span>
                <span className="text-[10px] bg-indigo-200 text-indigo-900 px-1.5 py-0.2 rounded font-bold">/admin</span>
              </div>
              <div className="text-[11px] text-slate-600 font-mono truncate">admin@gatewaysecurity.in</div>
              <div className="text-[11px] text-slate-800 font-mono font-bold">Admin@123</div>
            </div>

            {/* Super Admin */}
            <div className="p-3 bg-purple-50/60 border border-purple-200/80 rounded-2xl space-y-1">
              <div className="font-extrabold text-purple-800 flex items-center justify-between">
                <span>4. Super Admin</span>
                <span className="text-[10px] bg-purple-200 text-purple-900 px-1.5 py-0.2 rounded font-bold">/super-admin</span>
              </div>
              <div className="text-[11px] text-slate-600 font-mono truncate">superadmin@gatewaysecurity.in</div>
              <div className="text-[11px] text-slate-800 font-mono font-bold">Super@123</div>
            </div>
          </div>
        )}
      </div>

      {/* Main Login Card */}
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
              <span>Live Cloud</span>
            </span>
          </div>
        </div>

        {/* 4 Dedicated Role Selection Tabs */}
        <div className="grid grid-cols-4 bg-slate-100/90 p-1.5 border-b border-slate-200 text-[11px] sm:text-xs font-bold">
          {/* Tab 1: Resident */}
          <button
            type="button"
            onClick={() => { setActiveTab('resident'); setAuthError(null); setAuthSuccess(null); }}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1 py-2 px-1 rounded-xl transition-all cursor-pointer ${
              activeTab === 'resident'
                ? 'bg-white text-[#E05D44] shadow-xs ring-1 ring-black/5 font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Home className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Resident</span>
          </button>

          {/* Tab 2: Security Guard */}
          <button
            type="button"
            onClick={() => { setActiveTab('guard'); setAuthError(null); setAuthSuccess(null); }}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1 py-2 px-1 rounded-xl transition-all cursor-pointer ${
              activeTab === 'guard'
                ? 'bg-white text-emerald-700 shadow-xs ring-1 ring-black/5 font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Guard</span>
          </button>

          {/* Tab 3: Society Admin */}
          <button
            type="button"
            onClick={() => { setActiveTab('admin'); setAuthError(null); setAuthSuccess(null); }}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1 py-2 px-1 rounded-xl transition-all cursor-pointer ${
              activeTab === 'admin'
                ? 'bg-white text-indigo-700 shadow-xs ring-1 ring-black/5 font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Admin</span>
          </button>

          {/* Tab 4: Super Admin */}
          <button
            type="button"
            onClick={() => { setActiveTab('superadmin'); setAuthError(null); setAuthSuccess(null); }}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1 py-2 px-1 rounded-xl transition-all cursor-pointer ${
              activeTab === 'superadmin'
                ? 'bg-white text-purple-700 shadow-xs ring-1 ring-black/5 font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Server className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Super</span>
          </button>
        </div>

        {/* Global Feedback Banners */}
        {authError && (
          <div className="mx-6 mt-4 p-3.5 bg-rose-50 border border-rose-300 rounded-2xl flex items-start gap-2.5 text-rose-800 text-xs font-semibold animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">{authError}</div>
          </div>
        )}

        {authSuccess && (
          <div className="mx-6 mt-4 p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center gap-2.5 text-emerald-800 text-xs font-semibold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{authSuccess}</span>
          </div>
        )}

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
                      Flat 1204 (Primary) • 10-Flat Portfolio
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

              {/* Login mode toggle */}
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setUseOtpMode(!useOtpMode)}
                  className="text-xs text-[#E05D44] hover:underline font-bold"
                >
                  {useOtpMode ? 'Switch to Email / Password' : 'Login with Mobile OTP instead'}
                </button>
              </div>

              {/* Form: Email/Password or Phone/OTP */}
              <form onSubmit={handleResidentSubmit} className="space-y-4">
                {!useOtpMode ? (
                  <>
                    <div>
                      <label className="text-xs font-bold text-slate-800 block mb-1.5">
                        Resident Email
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Mail className="w-4 h-4" />
                        </div>
                        <input
                          type="email"
                          value={residentEmail}
                          onChange={(e) => setResidentEmail(e.target.value)}
                          placeholder="owner@gatewaysecurity.in"
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-medium focus:ring-2 focus:ring-[#E05D44] transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-800 block mb-1.5">
                        Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          type="password"
                          value={residentPassword}
                          onChange={(e) => setResidentPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-medium focus:ring-2 focus:ring-[#E05D44] transition-all"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {!residentOtpSent ? (
                      <div>
                        <label className="text-xs font-bold text-slate-800 block mb-1.5 flex items-center justify-between">
                          <span>Registered Mobile Number</span>
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
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-medium focus:ring-2 focus:ring-[#E05D44]"
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
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-lg font-bold tracking-widest text-slate-900 focus:ring-2 focus:ring-[#E05D44]"
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-[#E05D44] hover:bg-[#c94d35] text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span>Authenticating...</span>
                  ) : (
                    <>
                      <span>Sign In to Resident Portal</span>
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

              {/* Guard Login Form */}
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
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-medium focus:ring-2 focus:ring-emerald-600 appearance-none cursor-pointer"
                    >
                      {state.gates.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1.5">
                    Guard Official Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      value={guardEmail}
                      onChange={(e) => setGuardEmail(e.target.value)}
                      placeholder="guard@gatewaysecurity.in"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-medium focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1.5">
                    Gate Terminal Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      value={guardPassword}
                      onChange={(e) => setGuardPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-medium focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? (
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
                      placeholder="admin@gatewaysecurity.in"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-medium focus:ring-2 focus:ring-indigo-600"
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
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-medium focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? (
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

          {/* ========================================================================= */}
          {/* TAB 4: SUPER ADMIN PLATFORM CONSOLE */}
          {/* ========================================================================= */}
          {activeTab === 'superadmin' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div>
                <div className="inline-block px-2.5 py-0.5 bg-purple-50 text-purple-700 text-[10px] font-black uppercase tracking-wider rounded-md mb-2">
                  PLATFORM SUPER ADMIN
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  Multi-Society Master Operations
                </h2>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Global tenant provisioning, multi-estate database isolation, infrastructure health, and master audits.
                </p>
              </div>

              {/* Verified Super Admin Showcase Card */}
              <div className="p-4 bg-purple-50/70 border border-purple-200/70 rounded-2xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-purple-600 text-white font-extrabold text-sm flex items-center justify-center shrink-0 shadow-xs">
                    <Server className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span>Dev Administrator</span>
                      <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded font-semibold border border-purple-300">
                        Super Admin
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 truncate">
                      Multi-Tenant Infrastructure Node
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleQuickSignInSuper}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-colors shrink-0 shadow-xs cursor-pointer flex items-center gap-1"
                >
                  <span>1-Click Entry</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Super Admin Email & Password Form */}
              <form onSubmit={handleSuperSubmit} className="space-y-4 pt-1">
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1.5">
                    Super Admin Root Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      value={superEmail}
                      onChange={(e) => setSuperEmail(e.target.value)}
                      placeholder="superadmin@gatewaysecurity.in"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-medium focus:ring-2 focus:ring-purple-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1.5">
                    Root Security Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      value={superPassword}
                      onChange={(e) => setSuperPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-medium focus:ring-2 focus:ring-purple-600"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span>Authenticating Root Access...</span>
                  ) : (
                    <>
                      <span>Open Super Admin Console</span>
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
            <span>Supabase Cloud Auth & RLS</span>
          </span>
          <span className="font-semibold text-slate-600">
            {activeTab === 'resident'
              ? 'Resident Portal'
              : activeTab === 'guard'
              ? 'Gate Kiosk'
              : activeTab === 'admin'
              ? 'Estate Admin'
              : 'Super Admin'}
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
