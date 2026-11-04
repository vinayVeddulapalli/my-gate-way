'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { appStore, AppState } from '@/lib/store';
import { soundNotifier } from '@/lib/audio';
import { 
  UserPlus, 
  QrCode, 
  Users, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Search, 
  LogOut, 
  AlertTriangle,
  ArrowRight,
  Phone,
  Car,
  Package,
  Boxes,
  KeyRound,
  MapPin,
  Wifi,
  WifiOff,
  RefreshCw
} from 'lucide-react';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ConfirmationModal } from '@/components/common/ConfirmationModal';
import { PassVerificationModal } from '@/components/guard/PassVerificationModal';
import { ParcelHandoverModal } from '@/components/guard/ParcelHandoverModal';
import { PhotoDisplay } from '@/components/common/PhotoDisplay';
import { ActiveSosBanner } from '@/components/common/ActiveSosBanner';
import { getCategoryBadge, getDeliveryCategoryBadge, maskPhoneNumber } from '@/lib/utils';
import { TimeAgo, DurationDisplay } from '@/components/common/TimeDisplay';
import { VisitorRequest } from '@/types';

export default function GuardDashboardPage() {
  const [state, setState] = useState<AppState>(appStore.getState());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Modals state
  const [checkoutModalReq, setCheckoutModalReq] = useState<VisitorRequest | null>(null);
  const [escalateModalReq, setEscalateModalReq] = useState<VisitorRequest | null>(null);
  const [handoverModalReq, setHandoverModalReq] = useState<VisitorRequest | null>(null);
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  useEffect(() => {
    return appStore.subscribe((s) => setState(s));
  }, []);

  const requests = state.visitorRequests;
  const insideVisitors = requests.filter(r => r.status === 'checked_in');
  const pendingRequests = requests.filter(r => r.status === 'pending');
  const parcelsAtGate = requests.filter(r => r.status === 'leave_at_gate' || r.handover_status === 'at_gate');
  const approvedWaitingEntry = requests.filter(r => r.status === 'approved');
  const rejectedRequests = requests.filter(r => r.status === 'rejected');

  // Audible chime when a new approval comes in from a resident
  const prevApprovedCountRef = useRef(approvedWaitingEntry.length);
  useEffect(() => {
    if (approvedWaitingEntry.length > prevApprovedCountRef.current) {
      soundNotifier.playApprovalChime();
    }
    prevApprovedCountRef.current = approvedWaitingEntry.length;
  }, [approvedWaitingEntry.length]);

  // Filtered history list
  const filteredHistory = requests.filter(r => {
    const matchesSearch = 
      r.visitor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.flat_number && r.flat_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.vehicle_number && r.vehicle_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.delivery_company && r.delivery_company.toLowerCase().includes(searchQuery.toLowerCase())) ||
      r.visitor_phone.includes(searchQuery);

    const matchesStatus = statusFilter === 'all' ? true : r.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleConfirmCheckout = () => {
    if (!checkoutModalReq) return;
    appStore.checkOutVisitor(checkoutModalReq.id, state.currentUser.id);
    setSuccessBanner(`Visitor ${checkoutModalReq.visitor_name} checked out successfully.`);
    setCheckoutModalReq(null);
    setTimeout(() => setSuccessBanner(null), 4000);
  };

  const handleConfirmEscalation = (notes?: string) => {
    if (!escalateModalReq) return;
    appStore.escalateToSupervisor(escalateModalReq.id, notes || 'Gate supervisor alerted for assistance');
    setSuccessBanner(`Request for ${escalateModalReq.visitor_name} has been escalated to Supervisor.`);
    setEscalateModalReq(null);
    setTimeout(() => setSuccessBanner(null), 4000);
  };

  if (!mounted) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-24 md:pb-12">
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm animate-pulse h-36" />
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs animate-pulse h-20" />
          ))}
        </div>
      </div>
    );
  }

  // Role Access Guard: Only Security Guards & Superadmins can access the Gate Terminal
  if (state.currentUser.role !== 'security_guard' && state.currentUser.role !== 'super_admin') {
    return (
      <div className="max-w-md mx-auto my-16 px-4">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Gate Terminal Access Restricted</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            You are currently signed in as <strong className="text-slate-900">{state.currentUser.full_name}</strong> ({state.currentUser.role.replace('_', ' ')}). 
            The Gate Security Control Panel and physical entry authorization are reserved for on-duty security officers.
          </p>
          <div className="pt-2 flex flex-col gap-2.5">
            <Link
              href={state.currentUser.role === 'community_admin' ? '/admin' : '/resident'}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
            >
              Go to My Dashboard ({state.currentUser.role === 'community_admin' ? 'Admin Console' : 'Resident App'})
            </Link>
            <Link
              href="/login?tab=guard"
              className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors"
            >
              Sign In with Guard Credentials
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-24 md:pb-12">
      {/* Real-time Emergency SOS Alert Banner */}
      <ActiveSosBanner alerts={state.sosAlerts || []} />

      {/* Top Banner / Gate Info (Clean Wireframe Style) */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-sm border border-slate-200/90 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold uppercase tracking-wider flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              Live Guard Terminal • Main Gate 1
            </span>
            <span className="text-slate-300">•</span>
            {isOnline && state.connectionStatus === 'connected' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                Cloud Synced ({state.visitorRequests.length} records)
              </span>
            ) : isOnline && state.connectionStatus === 'connecting' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800 border border-sky-300 shadow-xs">
                <RefreshCw className="w-3 h-3 text-sky-600 animate-spin" />
                Connecting to Cloud...
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300 shadow-xs" title="Terminal is operating in offline resilient mode. All data is cached locally on this device.">
                <WifiOff className="w-3 h-3 text-amber-600" />
                Offline Kiosk Mode ({state.visitorRequests.length} cached locally)
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            Gate Security Control Panel
          </h1>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
            <span>Officer on duty: <strong className="text-slate-800 font-bold">{state.currentUser.full_name}</strong></span>
            <span>•</span>
            <span className="font-semibold text-slate-700">{state.currentCommunity.name}</span>
            <span>•</span>
            <Link 
              href="/login?tab=guard" 
              className="text-emerald-700 hover:text-emerald-900 font-bold underline inline-flex items-center gap-1"
              title="End gate shift and return to Unified Portal Login"
            >
              <LogOut className="w-3 h-3" />
              <span>End Shift / Switch Portal</span>
            </Link>
          </p>
        </div>

        {/* Big Action Buttons (Touch Friendly Kiosk Actions) */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full md:w-auto">
          <Link
            href="/guard/daily-help"
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-3 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold rounded-2xl border border-slate-200 shadow-xs touch-press transition-colors text-xs sm:text-sm cursor-pointer"
          >
            <Users className="w-4 h-4 text-purple-600" />
            <span>Daily Help ({state.dailyHelpers?.filter(h => h.is_inside).length || 0})</span>
          </Link>

          <button
            onClick={() => setIsPassModalOpen(true)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-3 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold rounded-2xl border border-slate-200 shadow-xs touch-press transition-colors text-xs sm:text-sm cursor-pointer"
          >
            <QrCode className="w-4 h-4 text-emerald-600" />
            <span>Verify Pass (OTP)</span>
          </button>

          <Link
            href="/guard/register"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl shadow-sm touch-press transition-all text-xs sm:text-sm tracking-wide cursor-pointer"
          >
            <UserPlus className="w-5 h-5" />
            <span>NEW ENTRY / DELIVERY</span>
          </Link>
        </div>
      </div>

      {/* Success Banner Notification */}
      {successBanner && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center gap-3 text-emerald-800 text-sm font-semibold animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successBanner}</span>
        </div>
      )}

      {/* KPI Stats Grid (5 Cards: Inside, Pending, Parcels, Entries, Denied) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* 1. Inside */}
        <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200 flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{insideVisitors.length}</div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Currently Inside</div>
          </div>
        </div>

        {/* 2. Pending Approval */}
        <Link
          href="/guard/pending"
          className="bg-white p-4 rounded-2xl shadow-xs border border-amber-200 hover:border-amber-400 transition-colors flex items-center gap-3 group"
        >
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl group-hover:scale-105 transition-transform">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-amber-600 flex items-center gap-1.5">
              {pendingRequests.length}
              {pendingRequests.length > 0 && (
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
              )}
            </div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Pending Alert</div>
          </div>
        </Link>

        {/* 3. Parcels Awaiting Collection */}
        <div className="bg-white p-4 rounded-2xl shadow-xs border border-indigo-200 flex items-center gap-3">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-indigo-700 flex items-center gap-1.5">
              {parcelsAtGate.length}
              {parcelsAtGate.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
              )}
            </div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Parcels at Gate</div>
          </div>
        </div>

        {/* 4. Today's Entries */}
        <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200 flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">
              {requests.filter(r => r.status === 'checked_in' || r.status === 'checked_out' || r.status === 'collected').length}
            </div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Today&apos;s Actions</div>
          </div>
        </div>

        {/* 5. Denied */}
        <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200 flex items-center gap-3">
          <div className="p-3 bg-red-50 text-red-600 rounded-xl">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{rejectedRequests.length}</div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Entry Denied</div>
          </div>
        </div>
      </div>

      {/* Approved Waiting Check-In Banner Alert (If Any) */}
      {approvedWaitingEntry.length > 0 && (
        <div className="p-4 bg-emerald-600 text-white rounded-2xl shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-100">
                Action Required at Boom Barrier
              </div>
              <div className="text-sm font-black">
                {approvedWaitingEntry.length} Visitor(s) Approved by Resident — Ready for Physical Entry!
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {approvedWaitingEntry.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => {
                  appStore.checkInVisitor(v.id, state.currentUser.id);
                  setSuccessBanner(`Checked in ${v.visitor_name} for Flat ${v.flat_number}!`);
                  setTimeout(() => setSuccessBanner(null), 4000);
                }}
                className="px-3.5 py-1.5 bg-white text-emerald-900 font-extrabold text-xs rounded-xl shadow-xs hover:bg-emerald-50 transition-colors cursor-pointer"
              >
                Admit {v.visitor_name.split(' ')[0]} (Flat {v.flat_number})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 1: PARCELS AWAITING COLLECTION (Requirement 8) */}
      <section className="bg-white rounded-3xl border-2 border-indigo-200 shadow-sm overflow-hidden">
        <div className="p-5 bg-gradient-to-r from-indigo-50/70 to-purple-50/70 border-b border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 text-white rounded-2xl shadow-sm">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-base text-slate-900">
                  Gate Parcel Inventory
                </h2>
                <span className="text-[11px] font-extrabold bg-indigo-600 text-white px-2.5 py-0.5 rounded-full">
                  {parcelsAtGate.length} Awaiting Collection
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Deliveries authorized under &quot;Leave at Gate&quot;. Verify resident OTP prior to physical handover.
              </p>
            </div>
          </div>
        </div>

        {parcelsAtGate.length === 0 ? (
          <div className="p-8 text-center text-slate-400 space-y-2">
            <Package className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-semibold text-slate-600">No parcels currently awaiting collection at the gate.</p>
            <p className="text-[11px] text-slate-400">When residents authorize &quot;Leave at Gate&quot;, parcels appear here automatically.</p>
          </div>
        ) : (
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {parcelsAtGate.map((parcel) => {
              const catBadge = getDeliveryCategoryBadge(parcel.delivery_category);
              return (
                <div
                  key={parcel.id}
                  className="bg-slate-50/80 rounded-2xl p-4 border border-indigo-200 hover:border-indigo-400 transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-16 h-16 rounded-xl bg-slate-200 border border-slate-300 overflow-hidden shrink-0">
                      <PhotoDisplay
                        photoPath={parcel.parcel_photo_path || parcel.visitor_photo_path}
                        alt="Parcel thumbnail"
                        type="parcel"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-black text-sm text-slate-900 truncate">
                          {parcel.delivery_company || 'Courier'}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${catBadge.bg} ${catBadge.text}`}>
                          {catBadge.label}
                        </span>
                      </div>

                      <div className="text-xs font-extrabold text-indigo-700 mt-0.5">
                        Flat {parcel.flat_number} ({parcel.block_name})
                      </div>

                      <div className="text-xs text-slate-600 mt-0.5 truncate">
                        Resident: {parcel.decision_by_name || 'Apartment Owner'}
                      </div>
                    </div>
                  </div>

                  {/* Parcel Details / Shelf Location */}
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-xs space-y-1">
                    {parcel.parcel_details && (
                      <p className="text-slate-600 font-mono text-[11px] truncate">
                        {parcel.parcel_details}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                      <span className="flex items-center gap-1 font-semibold text-slate-700">
                        <MapPin className="w-3 h-3 text-indigo-500" />
                        <span>{parcel.gate_location || 'Gate 1 Shelf'}</span>
                      </span>
                      <span>Arrived <TimeAgo date={parcel.decision_at || parcel.created_at} /></span>
                    </div>
                  </div>

                  {/* Handover Button */}
                  <button
                    type="button"
                    onClick={() => setHandoverModalReq(parcel)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-xs touch-press transition-colors cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-amber-300" />
                    <span>VERIFY OTP & HANDOVER PARCEL</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* SECTION 2: Active Inside Visitors */}
      <section className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <span>Visitors Currently Inside Premises</span>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">
                {insideVisitors.length} Active
              </span>
            </h2>
            <p className="text-xs text-slate-500">Fast check-out for departing vehicles and guests</p>
          </div>
        </div>

        {insideVisitors.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <p className="text-xs">No visitors currently inside the campus.</p>
          </div>
        ) : (
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {insideVisitors.map((visitor) => {
              const catBadge = getCategoryBadge(visitor.category);
              return (
                <div
                  key={visitor.id}
                  className="bg-slate-50 rounded-2xl p-4 border border-slate-200 hover:border-slate-300 transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-200 shrink-0 border border-slate-300">
                      <PhotoDisplay
                        photoPath={visitor.visitor_photo_path}
                        alt={visitor.visitor_name}
                        fallbackInitials={visitor.visitor_name.charAt(0)}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-900 truncate">
                          {visitor.visitor_name}
                        </h3>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${catBadge.bg} ${catBadge.text}`}>
                          {catBadge.label}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-emerald-700 mt-0.5">
                        Flat {visitor.flat_number} ({visitor.block_name})
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{visitor.visitor_phone}</span>
                      </div>
                    </div>
                  </div>

                  {/* Purpose & Vehicle */}
                  <div className="text-xs bg-white p-2.5 rounded-xl border border-slate-200 space-y-1">
                    <p className="text-slate-600 truncate">
                      <strong>Purpose:</strong> {visitor.purpose}
                    </p>
                    {visitor.vehicle_number && (
                      <p className="text-slate-600 flex items-center gap-1 font-mono text-[11px]">
                        <Car className="w-3 h-3 text-slate-400" />
                        <span>{visitor.vehicle_number}</span>
                      </p>
                    )}
                    <div className="text-[11px] text-blue-700 font-semibold pt-0.5 flex items-center justify-between" suppressHydrationWarning>
                      <span>Inside for:</span>
                      <DurationDisplay start={visitor.check_in_time || visitor.created_at} />
                    </div>
                  </div>

                  {/* Action: Fast Check-Out */}
                  <button
                    type="button"
                    onClick={() => setCheckoutModalReq(visitor)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs touch-press transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5 text-slate-300" />
                    <span>CHECK OUT VISITOR</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* SECTION 3: Today's Gate Log & Search */}
      <section id="visitor-history" className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="font-extrabold text-base text-slate-900">
              Gate Activity Log & History
            </h2>
            <p className="text-xs text-slate-500">Live feed of all registrations, approvals, and decisions</p>
          </div>

          {/* Search & Status Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search visitor, flat, phone, courier..."
                className="pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl w-full sm:w-60 focus:outline-hidden focus:border-slate-800"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-xs border border-slate-300 rounded-xl bg-white focus:outline-hidden"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending Approval</option>
              <option value="approved">Approved</option>
              <option value="leave_at_gate">At Gate (Parcels)</option>
              <option value="collected">Collected Parcels</option>
              <option value="checked_in">Inside (Checked-in)</option>
              <option value="checked_out">Checked-out</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Visitor Table / Mobile Cards */}
        {filteredHistory.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <p className="text-sm">No visitor records match the filter criteria.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 overflow-x-auto">
            {filteredHistory.map((visitor) => (
              <div
                key={visitor.id}
                className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-200 overflow-hidden shrink-0 border border-slate-300">
                    <PhotoDisplay
                      photoPath={visitor.visitor_photo_path}
                      alt={visitor.visitor_name}
                      fallbackInitials={visitor.visitor_name.charAt(0)}
                    />
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{visitor.visitor_name}</span>
                      <StatusBadge status={visitor.status} size="sm" />
                    </div>

                    <div className="text-xs text-slate-600">
                      Destination: <strong className="text-slate-800">Flat {visitor.flat_number}</strong> ({visitor.block_name}) • Purpose: {visitor.purpose}
                    </div>

                    <div className="text-[11px] text-slate-500 flex items-center gap-2" suppressHydrationWarning>
                      <span>Phone: <span className="font-mono">{visitor.visitor_phone}</span></span>
                      <span>•</span>
                      <span>Gate: {visitor.gate_name}</span>
                      <span>•</span>
                      <span>Logged <TimeAgo date={visitor.created_at} /></span>
                    </div>

                    {visitor.status === 'collected' && visitor.collected_by_name && (
                      <div className="text-[11px] text-teal-700 font-semibold pt-0.5">
                        Parcel collected by: <strong>{visitor.collected_by_name}</strong>
                      </div>
                    )}
                  </div>
                </div>

                {/* Row Quick Action Buttons */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  {visitor.status === 'approved' && (
                    <button
                      type="button"
                      onClick={() => {
                        appStore.checkInVisitor(visitor.id, state.currentUser.id);
                        setSuccessBanner(`Visitor ${visitor.visitor_name} entry recorded!`);
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Check-In</span>
                    </button>
                  )}

                  {visitor.status === 'leave_at_gate' && (
                    <button
                      type="button"
                      onClick={() => setHandoverModalReq(visitor)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Package className="w-3.5 h-3.5" />
                      <span>Handover</span>
                    </button>
                  )}

                  {visitor.status === 'checked_in' && (
                    <button
                      type="button"
                      onClick={() => setCheckoutModalReq(visitor)}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Check-Out</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setEscalateModalReq(visitor)}
                    title="Escalate to Supervisor"
                    className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <AlertTriangle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Confirmation Modals */}
      <ConfirmationModal
        isOpen={Boolean(checkoutModalReq)}
        title="Confirm Visitor Exit & Check-Out"
        description={`Record departure for visitor "${checkoutModalReq?.visitor_name}" leaving the community premises.`}
        confirmLabel="Confirm Check-Out"
        variant="primary"
        onConfirm={handleConfirmCheckout}
        onClose={() => setCheckoutModalReq(null)}
      />

      <ConfirmationModal
        isOpen={Boolean(escalateModalReq)}
        title="Supervisor Escalation"
        description={`Escalate visitor "${escalateModalReq?.visitor_name}" to the Head Security Supervisor or Estate Manager.`}
        confirmLabel="Escalate Now"
        variant="warning"
        requiresReason={true}
        reasonPlaceholder="e.g. Resident unreachable after 3 intercom attempts, delivery package urgent..."
        onConfirm={handleConfirmEscalation}
        onClose={() => setEscalateModalReq(null)}
      />

      {/* Parcel Handover Modal */}
      <ParcelHandoverModal
        isOpen={Boolean(handoverModalReq)}
        parcelRequest={handoverModalReq}
        onClose={() => setHandoverModalReq(null)}
        onSuccess={(msg) => {
          setSuccessBanner(msg);
          setTimeout(() => setSuccessBanner(null), 4000);
        }}
      />

      <PassVerificationModal
        isOpen={isPassModalOpen}
        onClose={() => setIsPassModalOpen(false)}
        onSuccess={(msg) => {
          setSuccessBanner(msg);
          setTimeout(() => setSuccessBanner(null), 4000);
        }}
      />
    </div>
  );
}
