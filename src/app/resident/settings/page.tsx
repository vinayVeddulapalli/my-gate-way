'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { appStore, AppState } from '@/lib/store';
import { 
  Building2, 
  CheckCircle2, 
  AlertCircle,
  ArrowLeftRight, 
  RotateCcw, 
  Plus, 
  Bell, 
  Volume2, 
  MessageSquare,
  ShieldCheck,
  Check,
  LogOut
} from 'lucide-react';
import { soundNotifier } from '@/lib/audio';

export default function ResidentProfileSettingsPage() {
  const router = useRouter();
  const [state, setState] = useState<AppState>(appStore.getState());
  const [mounted, setMounted] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ text: string; success: boolean } | null>(null);

  useEffect(() => {
    setMounted(true);
    return appStore.subscribe((s) => {
      setState(s);
      setPushEnabled(s.currentUser.notification_push_enabled);
      setSoundEnabled(s.currentUser.notification_sound_enabled);
    });
  }, []);

  if (!mounted) {
    return (
      <div className="max-w-md mx-auto px-4 py-6 pb-28 space-y-4">
        <div className="h-10 bg-slate-100 rounded-xl animate-pulse" />
        <div className="h-44 bg-slate-100 rounded-2xl animate-pulse" />
        <div className="h-32 bg-slate-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  const currentUser = state.currentUser;
  let currentFlat = state.flats.find(f => f.id === currentUser.flat_id);
  if (currentUser.flat_display) {
    const flatFromDisplay = state.flats.find(f => currentUser.flat_display?.includes(f.flat_number));
    if (flatFromDisplay && (!currentFlat || currentFlat.flat_number !== flatFromDisplay.flat_number)) {
      currentFlat = flatFromDisplay;
    }
  }
  if (!currentFlat) {
    currentFlat = state.flats[0];
  }

  const handleSwitchToGuard = () => {
    const guardUser = state.users.find(u => u.role === 'security_guard') || state.users[0];
    appStore.switchActiveUser(guardUser.id);
    router.push('/guard');
  };

  const handleSyncCloud = async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const res = await appStore.syncWithCloud();
      if (res.success) {
        setSyncMessage({
          text: `Successfully synchronized ${res.count} society visitor records from Supabase Cloud!`,
          success: true
        });
      } else {
        setSyncMessage({
          text: `Cloud sync notice: ${res.error || 'Unable to connect to Supabase. Preserving offline records.'}`,
          success: false
        });
      }
    } catch (err: unknown) {
      setSyncMessage({
        text: `Sync error: ${(err as Error).message}`,
        success: false
      });
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMessage(null), 5000);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-6 pb-28 space-y-5">
      {/* Page Heading */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Make yourself at home.
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Your profile and community membership.
        </p>
      </div>

      {syncMessage && (
        <div className={`p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 border shadow-xs ${
          syncMessage.success
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-amber-50 border-amber-200 text-amber-800'
        }`}>
          {syncMessage.success ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          )}
          <span>{syncMessage.text}</span>
        </div>
      )}

      {/* Card 1: Resident Profile Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6 text-center flex flex-col items-center">
        <div className="w-20 h-20 rounded-full bg-[#FDEEEB] text-[#E05D44] text-2xl font-black flex items-center justify-center mb-3.5 shadow-xs">
          {currentUser.full_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || 'R'}
        </div>

        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          {currentUser.full_name || 'Resident Owner'}
        </h2>

        <p className="text-xs text-slate-500 mt-1">
          {currentUser.role === 'resident' ? (currentUser.resident_type === 'tenant' ? 'Resident • Tenant' : 'Resident • Owner') : currentUser.role.replace('_', ' ')}
        </p>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full mt-3.5 border border-emerald-100">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Verified Owner Profile</span>
        </div>
      </div>

      {/* Card 2: Community Membership Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 space-y-4">
        <h3 className="font-bold text-sm text-slate-900">
          Community membership
        </h3>

        <div className="flex items-center justify-between p-3.5 bg-slate-50/80 rounded-xl border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-slate-900">
                {state.currentCommunity.name}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {currentFlat.block_name} • Floor {currentFlat.floor_number || 12} • Flat {currentFlat.flat_number} {currentFlat.occupancy_type === 'rented' ? '(Rented)' : '(Primary)'}
              </div>
            </div>
          </div>

          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
        </div>

        <button
          onClick={() => alert('Additional society memberships can be linked with flat deed verification.')}
          className="text-xs font-bold text-[#E05D44] hover:text-[#c44a33] flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Request another membership</span>
        </button>
      </div>

      {/* Card 3: Gate Terminal Link & Testing Access */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 space-y-4">
        <h3 className="font-bold text-sm text-slate-900">
          Gate Terminal Link & Realtime Access
        </h3>

        <p className="text-xs text-slate-500 leading-relaxed">
          Connect your device to the Main Gate terminal. Any visitor registered at the security kiosk will synchronize in real time using Supabase WebSockets.
        </p>

        <div className="space-y-2.5 pt-1">
          {/* Primary Coral Button: Switch to Guard App */}
          <button
            onClick={handleSwitchToGuard}
            className="w-full py-3 px-4 bg-[#E05D44] hover:bg-[#c44a33] text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span>Switch to guard app</span>
          </button>

          {/* Secondary Button: Sync Society Cloud Data */}
          <button
            onClick={handleSyncCloud}
            disabled={syncing}
            className="w-full py-3 px-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60 shadow-xs"
          >
            <RotateCcw className={`w-4 h-4 text-emerald-600 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Synchronizing with Cloud...' : 'Synchronize Society Cloud Data'}</span>
          </button>
        </div>
      </div>

      {/* Card 4: Historical Data Retention & Privacy Policy (Question 4) */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900">
            Data Retention & Privacy Policy
          </h3>
          <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-100">
            DPDP Compliant
          </span>
        </div>

        <div className="space-y-2.5 text-xs text-slate-600">
          <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
            <span>Visitor Entry/Exit Logs:</span>
            <strong className="text-slate-900">90 Days (1 Quarter)</strong>
          </div>
          <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
            <span>Visitor Gate Photos:</span>
            <strong className="text-slate-900">30 Days Auto-Purge</strong>
          </div>
          <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
            <span>Maintenance & Payment Ledgers:</span>
            <strong className="text-slate-900">7 Years (Audit Standard)</strong>
          </div>
          <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
            <span>Emergency SOS Audio & Logs:</span>
            <strong className="text-slate-900">3 Years Retention</strong>
          </div>
        </div>

        <button
          onClick={() => {
            const res = appStore.purgeExpiredVisitorLogs(90);
            alert(`Retention Policy Executed: ${res.purgedCount} expired logs purged. ${res.retainedCount} active quarter entries preserved.`);
          }}
          className="w-full py-2.5 bg-[#F6F5F2] hover:bg-[#EAE6DE] text-[#142E31] text-xs font-bold rounded-xl transition-colors cursor-pointer border border-[#E7E6E1]"
        >
          Execute Retention Cleanup Policy
        </button>
      </div>

      {/* Notification Preferences Section */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 space-y-3.5">
        <h3 className="font-bold text-sm text-slate-900">
          Notification Preferences
        </h3>

        <div className="flex items-center justify-between py-1 text-xs">
          <div className="flex items-center gap-2.5">
            <Bell className="w-4 h-4 text-slate-500" />
            <span className="font-medium text-slate-700">Push Notifications</span>
          </div>
          <button
            onClick={() => setPushEnabled(!pushEnabled)}
            className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${
              pushEnabled ? 'bg-[#E05D44]' : 'bg-slate-200'
            }`}
          >
            <span
              className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                pushEnabled ? 'right-1' : 'left-1'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between py-1 text-xs">
          <div className="flex items-center gap-2.5">
            <Volume2 className="w-4 h-4 text-slate-500" />
            <span className="font-medium text-slate-700">Doorbell Ring Sound</span>
          </div>
          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              if (!soundEnabled) soundNotifier.playIncomingAlert();
            }}
            className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${
              soundEnabled ? 'bg-[#E05D44]' : 'bg-slate-200'
            }`}
          >
            <span
              className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                soundEnabled ? 'right-1' : 'left-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Account & Portal Switch */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 space-y-3">
        <h3 className="font-bold text-sm text-slate-900">
          Account & Portal Session
        </h3>
        <p className="text-xs text-slate-500">
          Switch between Gate Guard kiosk, Community Admin, or Sign Out to the Unified Portal.
        </p>

        <div className="pt-1 flex flex-col gap-2">
          <Link
            href="/login"
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
          >
            <LogOut className="w-4 h-4 text-slate-300" />
            <span>Sign Out / Switch Portal Entry</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
