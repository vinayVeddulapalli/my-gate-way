'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { appStore, AppState } from '@/lib/store';
import { 
  UserPlus, 
  Users, 
  ClipboardList, 
  Shield, 
  Home, 
  Contact2, 
  Bell, 
  Plus,
  Package, 
  Car, 
  User, 
  Wrench, 
  ChevronRight, 
  MapPin, 
  Check, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  Building2,
  Heart,
  PhoneCall
} from 'lucide-react';
import { ConfirmationModal } from '@/components/common/ConfirmationModal';
import { LeaveAtGateModal } from '@/components/resident/LeaveAtGateModal';
import { EmergencySosModal } from '@/components/common/EmergencySosModal';
import { NeighbourhoodArt } from '@/components/common/NeighbourhoodArt';
import { VisitorRequest } from '@/types';

export default function ResidentHomePage() {
  const router = useRouter();
  const [state, setState] = useState<AppState>(appStore.getState());
  const [mounted, setMounted] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Decision Modal States
  const [approveModalReq, setApproveModalReq] = useState<VisitorRequest | null>(null);
  const [rejectModalReq, setRejectModalReq] = useState<VisitorRequest | null>(null);
  const [leaveAtGateModalReq, setLeaveAtGateModalReq] = useState<VisitorRequest | null>(null);
  const [isSosModalOpen, setIsSosModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    return appStore.subscribe((s) => setState(s));
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#EDE8E0] py-6 px-4">
        <div className="max-w-md mx-auto space-y-4">
          <div className="h-44 bg-white/60 rounded-3xl animate-pulse" />
          <div className="h-56 bg-white/60 rounded-3xl animate-pulse" />
        </div>
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
  if (!currentFlat && currentUser.flat_display) {
    currentFlat = state.flats.find(f => currentUser.flat_display?.includes(f.flat_number));
  }
  if (!currentFlat) {
    if (currentUser.role === 'resident' && currentUser.flat_display) {
      const parts = currentUser.flat_display.split('•').map(s => s.trim());
      const blockName = parts[0] || 'Tower D';
      const floorNum = parseInt(parts[1]?.replace(/\D/g, '') || '1') || 1;
      const flatNum = parts[2]?.replace(/[^\d\w]/g, '').replace('Flat', '').trim() || '1502';
      currentFlat = {
        id: currentUser.flat_id || 'custom-flat-1502',
        community_id: currentUser.community_id || state.currentCommunity.id,
        block_id: 'c0000000-0000-0000-0000-000000000004',
        block_name: blockName,
        flat_number: flatNum,
        floor_number: floorNum,
        intercom_number: flatNum,
        is_occupied: true,
        occupancy_type: currentUser.resident_type === 'tenant' ? 'rented' : 'self_occupied',
        owner_name: currentUser.resident_type === 'owner' ? currentUser.full_name : undefined,
        tenant_name: currentUser.resident_type === 'tenant' ? currentUser.full_name : undefined,
        tenant_phone: currentUser.resident_type === 'tenant' ? currentUser.phone : undefined,
        monthly_rent: 35000,
        maintenance_amount: 5000,
        maintenance_status: 'paid'
      };
    } else {
      currentFlat = state.flats[0];
    }
  }

  // STRICT PRIVACY SEPARATION (Owner / Landlord vs Tenant / Renter)
  const isRentedFlat = currentFlat.occupancy_type === 'rented';
  const isTenantOfThisFlat = isRentedFlat && (
    currentUser.resident_type === 'tenant' ||
    currentUser.full_name.toLowerCase() === (currentFlat.tenant_name || '').toLowerCase() ||
    currentUser.phone === currentFlat.tenant_phone ||
    (currentUser.flat_id === currentFlat.id && currentUser.resident_type !== 'owner')
  );
  // Is the current user an Owner / Landlord viewing a rented investment property?
  const isLandlordViewingRentedFlat = isRentedFlat && !isTenantOfThisFlat;

  // Requests for this flat (resilient match on flat_id or flat_number)
  const flatRequests = state.visitorRequests.filter(r => 
    r.flat_id === currentFlat.id || r.flat_number === currentFlat.flat_number
  );
  const pendingRequests = flatRequests.filter(r => r.status === 'pending');
  const gateParcels = flatRequests.filter(r => r.status === 'leave_at_gate');
  const recentVisits = flatRequests.slice(0, 3);

  // When a landlord is viewing a rented flat, activeWaitingVisitor is suppressed for tenant privacy!
  const activeWaitingVisitor = isLandlordViewingRentedFlat ? null : (pendingRequests.length > 0 ? pendingRequests[0] : null);

  // Cross-flat visitor check: only alert owner if another SELF-OCCUPIED or VACANT property has a visitor
  const allOwnedFlatIds = Array.from(new Set([
    currentUser.flat_id,
    ...(currentUser.owned_flat_ids || [])
  ].filter(Boolean) as string[]));

  const allOwnedFlats = state.flats.filter(f => allOwnedFlatIds.includes(f.id));
  const allOwnedFlatNumbers = allOwnedFlats.map(f => f.flat_number);

  const pendingForOtherFlat = state.visitorRequests.find(r => {
    if (r.status !== 'pending') return false;
    if (r.flat_id === currentFlat.id || r.flat_number === currentFlat.flat_number) return false;
    const targetFlat = state.flats.find(f => f.id === r.flat_id || f.flat_number === r.flat_number);
    // Never bother landlord with a tenant's personal guests or food deliveries
    if (targetFlat && targetFlat.occupancy_type === 'rented') return false;
    return allOwnedFlatIds.includes(r.flat_id) || Boolean(r.flat_number && allOwnedFlatNumbers.includes(r.flat_number));
  });

  const handleApproveConfirm = (req: VisitorRequest) => {
    try {
      appStore.approveVisitorRequest(req.id, currentUser.id);
      setSuccessBanner(`Entry approved for ${req.visitor_name}. Guard terminal notified for doorstep delivery.`);
      setApproveModalReq(null);
      setTimeout(() => setSuccessBanner(null), 4000);
    } catch (err: unknown) {
      alert((err as Error).message);
    }
  };

  const handleRejectConfirm = (req: VisitorRequest, reason?: string) => {
    try {
      appStore.rejectVisitorRequest(req.id, currentUser.id, reason || 'Declined by resident');
      setSuccessBanner(`Entry declined for ${req.visitor_name}. Security barrier alerted.`);
      setRejectModalReq(null);
      setTimeout(() => setSuccessBanner(null), 4000);
    } catch (err: unknown) {
      alert((err as Error).message);
    }
  };

  const handleLeaveAtGateConfirm = (notes?: string) => {
    if (!leaveAtGateModalReq) return;
    try {
      const res = appStore.authorizeLeaveAtGate(leaveAtGateModalReq.id, currentUser.id, notes);
      setSuccessBanner(`Delivery authorized to be left at Main Gate Parcel Desk. Collection OTP #${res.otp} generated.`);
      setLeaveAtGateModalReq(null);
      setTimeout(() => setSuccessBanner(null), 5000);
    } catch (err: unknown) {
      alert((err as Error).message);
    }
  };

  const handleAskGuardToCall = (req: VisitorRequest) => {
    try {
      appStore.requestCallFromGuard(req.id, currentUser.id);
      setSuccessBanner('Guard desk notified to call you directly on phone/intercom before approving.');
      setTimeout(() => setSuccessBanner(null), 5000);
    } catch (err: unknown) {
      alert((err as Error).message);
    }
  };

  /* Render At-Your-Gate Card or Landlord Asset Card */
  const renderGateCard = () => {
    // 1. If user is a Landlord viewing a rented flat, display Landlord Asset Mode & Privacy Shield
    if (isLandlordViewingRentedFlat) {
      return (
        <div className="bg-white rounded-3xl border border-blue-200/90 p-5 space-y-4 shadow-xs animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-900">
                Landlord Portfolio Mode · Rented Property
              </span>
            </div>
            <span className="text-[11px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-lg border border-blue-100">
              {currentFlat.block_name || 'Tower A'} · Flat {currentFlat.flat_number}
            </span>
          </div>

          <div className="p-4 bg-blue-50/70 rounded-2xl border border-blue-100 space-y-1.5">
            <div className="text-xs font-bold text-blue-950 flex items-center justify-between">
              <span>Active Tenant:</span>
              <span className="text-emerald-700 font-extrabold text-[11px] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">Lease Active</span>
            </div>
            <div className="text-base font-black text-[#142E31]">
              {currentFlat.tenant_name || 'Tenant Resident'}
            </div>
            <div className="text-xs text-[#808683] flex items-center gap-2 flex-wrap">
              <span>Phone: {currentFlat.tenant_phone || 'N/A'}</span>
              <span>•</span>
              <span>Lease valid till {currentFlat.lease_end_date || 'Ongoing'}</span>
            </div>
          </div>

          {/* Privacy Shield Notice (DPDP Compliance) */}
          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-1 text-xs text-emerald-950">
            <div className="flex items-center gap-1.5 font-bold text-emerald-900">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Tenant Privacy Shield Active (DPDP Act 2023)</span>
            </div>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              Daily visitor gate approvals, courier OTPs, and maid entries route directly to tenant <strong>{currentFlat.tenant_name}</strong>. As owner, you manage property financials, lease, and maintenance.
            </p>
          </div>

          {/* Financials & Maintenance Overview */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-3 bg-[#F6F5F2] rounded-2xl border border-[#E7E6E1]">
              <div className="text-[11px] text-[#808683] font-medium">Monthly Rental Income</div>
              <div className="text-base font-black text-[#142E31] mt-0.5">
                ₹{currentFlat.monthly_rent?.toLocaleString('en-IN') || '38,000'}/mo
              </div>
              <div className="text-[10px] text-emerald-700 font-semibold mt-1">Paid on 1st of month</div>
            </div>

            <div className="p-3 bg-[#F6F5F2] rounded-2xl border border-[#E7E6E1]">
              <div className="text-[11px] text-[#808683] font-medium">Society Maintenance</div>
              <div className="text-base font-black text-emerald-800 mt-0.5">
                ₹{currentFlat.maintenance_amount || 3800}/mo
              </div>
              <div className="text-[10px] text-emerald-700 font-semibold mt-1">Status: Paid (Up-to-date)</div>
            </div>
          </div>

          {/* Landlord Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => alert(`Dialing tenant ${currentFlat.tenant_name} (${currentFlat.tenant_phone})...`)}
              className="flex-1 py-2.5 bg-[#142E31] hover:bg-black text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Contact Tenant
            </button>
            <button
              onClick={() => alert(`Maintenance Receipt #PM-${currentFlat.flat_number}-2026 sent to your registered email.`)}
              className="flex-1 py-2.5 bg-[#F6F5F2] hover:bg-[#EAE6DE] text-[#142E31] text-xs font-bold rounded-xl transition-colors cursor-pointer border border-[#E7E6E1]"
            >
              Society Receipt
            </button>
          </div>
        </div>
      );
    }

    // 2. If flat is vacant, show Vacant Unit Card
    if (currentFlat.occupancy_type === 'vacant') {
      return (
        <div className="bg-white rounded-3xl border border-[#E7E6E1] p-5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-800">
                Property Portfolio · Vacant Unit
              </span>
            </div>
            <span className="text-[11px] font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded-lg border border-amber-200">
              {currentFlat.block_name || 'Tower A'} · Flat {currentFlat.flat_number}
            </span>
          </div>
          <p className="text-xs text-[#808683]">
            This unit is unoccupied. Pre-approvals or daily domestic staff are inactive for this unit.
          </p>
          <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-100 flex items-center justify-between">
            <span className="text-xs font-medium text-amber-900">Maintenance: ₹{currentFlat.maintenance_amount || 3500}/mo</span>
            <span className="text-xs font-bold text-emerald-700">Paid</span>
          </div>
        </div>
      );
    }

    // 3. For Occupants (Tenants living here, or Owner living in self-occupied home):
    // If a visitor is actively waiting at the gate:
    if (activeWaitingVisitor) {
      return (
        <div className="bg-[#FFFDF9] rounded-3xl border border-[#F0DEC8] shadow-xs p-5 space-y-3.5 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#D39B50] animate-pulse" />
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#AD7D3E]">
                At Your Gate {isTenantOfThisFlat ? '· Tenant Occupant' : ''}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-lg border border-amber-200">
                {currentFlat.block_name || 'Tower A'} · Flat {currentFlat.flat_number}
              </span>
              <Home className="w-4 h-4 text-[#AD7D3E]" />
            </div>
          </div>

          <div>
            <h3 className="text-base font-extrabold text-[#142E31] tracking-tight">
              Someone&apos;s here for you
            </h3>
            {isTenantOfThisFlat && (
              <p className="text-[11px] text-[#808683] mt-0.5">
                Logged in as Tenant: <strong className="text-slate-800">{currentUser.full_name}</strong>
              </p>
            )}
          </div>

          <div className="space-y-3">
            <Link
              href={`/resident/visitors/${activeWaitingVisitor.id}`}
              className="flex items-center justify-between p-3 bg-white rounded-2xl border border-orange-100 shadow-2xs hover:border-orange-200 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-[#FDEEEB] text-[#E05D44] flex items-center justify-center shrink-0">
                  {activeWaitingVisitor.category === 'cab' ? (
                    <Car className="w-5 h-5" />
                  ) : activeWaitingVisitor.category === 'service' ? (
                    <Wrench className="w-5 h-5" />
                  ) : activeWaitingVisitor.category === 'guest' ? (
                    <User className="w-5 h-5" />
                  ) : (
                    <Package className="w-5 h-5" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-[#142E31] truncate">
                    {activeWaitingVisitor.visitor_name}
                  </div>
                  <div className="text-xs text-[#808683] truncate mt-0.5">
                    {activeWaitingVisitor.delivery_company || activeWaitingVisitor.category} • {(activeWaitingVisitor.delivery_category || activeWaitingVisitor.category).toUpperCase()}
                  </div>
                </div>
              </div>

              <ChevronRight className="w-4 h-4 text-[#808683] shrink-0" />
            </Link>

            <div className="flex items-center gap-1 text-[11px] text-[#808683]">
              <MapPin className="w-3.5 h-3.5 text-[#E05D44]" />
              <span>{activeWaitingVisitor.gate_name || 'Main Gate'} • Waiting for your approval</span>
            </div>

            {/* Action Buttons: Deny & Approve Entry */}
            <div className="flex items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => handleRejectConfirm(activeWaitingVisitor)}
                className="flex-1 py-3 px-4 bg-white hover:bg-slate-50 border border-[#E7E6E1] text-[#142E31] font-bold text-xs rounded-2xl transition-colors cursor-pointer text-center"
              >
                Deny
              </button>

              <button
                type="button"
                onClick={() => handleApproveConfirm(activeWaitingVisitor)}
                className="flex-2 py-3 px-4 bg-[#E05D44] hover:bg-[#c44a33] text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Approve entry</span>
              </button>
            </div>

            {/* Ask Guard to Call option */}
            <div className="pt-1">
              {activeWaitingVisitor.call_requested ? (
                <div className="w-full p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-center text-[11px] font-bold text-amber-800 flex items-center justify-center gap-1.5">
                  <PhoneCall className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                  <span>Call Requested — Guard desk will call you shortly</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleAskGuardToCall(activeWaitingVisitor)}
                  className="w-full text-center text-xs font-semibold text-[#808683] hover:text-[#E05D44] hover:underline flex items-center justify-center gap-1.5 py-1 transition-colors cursor-pointer"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Ask guard to call before approving</span>
                </button>
              )}
            </div>

            {/* Option to Leave at Gate for Deliveries */}
            {activeWaitingVisitor.category === 'delivery' && (
              <button
                type="button"
                onClick={() => setLeaveAtGateModalReq(activeWaitingVisitor)}
                className="w-full text-center text-xs font-semibold text-purple-700 hover:underline pt-1 cursor-pointer"
              >
                📦 Leave at Main Gate Shelf instead
              </button>
            )}
          </div>
        </div>
      );
    }

    // 4. Clean All-Clear Card
    return renderAllClearCard();
  };

  /* Render All-Clear Card */
  const renderAllClearCard = () => (
    <div className="bg-[#F0F6EF] rounded-3xl border border-[#D5E5D3] p-5 space-y-2">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-5 h-5 text-[#44816A]" />
        <span className="text-[10px] font-black uppercase tracking-wider text-[#44816A]">Gate Status: All Clear</span>
      </div>
      <h3 className="text-base font-extrabold text-[#142E31]">
        No visitors or deliveries waiting
      </h3>
      <p className="text-xs text-[#808683] leading-relaxed">
        When a security guard logs a visitor or delivery for Flat {currentFlat.flat_number}, an approval prompt will appear here in real time.
      </p>
    </div>
  );

  // Role Guard: Prevent on-duty guards from seeing resident personal app
  if (currentUser.role === 'security_guard') {
    return (
      <div className="max-w-md mx-auto my-16 px-4">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[#FDEEEB] border border-[#F6D0C7] text-[#E05D44] flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-[#E05D44]" />
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Resident Portal Restricted</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            You are currently signed in as on-duty officer <strong className="text-slate-900">{currentUser.full_name}</strong> (Security Guard). 
            The Resident App is for apartment residents and tenants to approve their personal visitors.
          </p>
          <div className="pt-2 flex flex-col gap-2.5">
            <Link
              href="/guard"
              className="w-full py-3 px-4 bg-[#E05D44] hover:bg-[#c44a33] text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
            >
              Go to Guard Control Panel (/guard)
            </Link>
            <Link
              href="/login?tab=resident"
              className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors"
            >
              Sign In as Resident
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EDE8E0] py-6 pb-28 px-4 sm:px-6">
      <div className="max-w-md lg:max-w-6xl mx-auto space-y-5">
        {/* Success Notification Banner */}
        {successBanner && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-emerald-900 text-xs font-semibold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successBanner}</span>
          </div>
        )}

        {/* Urgent Cross-Flat Alert Banner (When a visitor arrives for another flat owned by this resident, e.g. Sneha arriving at 801 while resident is viewing 1204) */}
        {pendingForOtherFlat && (
          <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white rounded-3xl shadow-xl border-2 border-amber-300 animate-in fade-in space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-white animate-ping" />
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-100">
                  Visitor Waiting at Another Flat In Your Portfolio
                </span>
              </div>
              <span className="text-[11px] font-bold bg-white/20 px-2.5 py-1 rounded-xl border border-white/30 text-white">
                {pendingForOtherFlat.block_name || 'Tower C'} • Flat {pendingForOtherFlat.flat_number}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                  <span>{pendingForOtherFlat.visitor_name}</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/25 text-white uppercase tracking-wider">
                    {pendingForOtherFlat.category}
                  </span>
                </div>
                <div className="text-xs text-amber-100 mt-0.5">
                  Purpose: {pendingForOtherFlat.purpose || 'Visit'} • Waiting at Main Gate
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => appStore.switchActiveFlat(pendingForOtherFlat.flat_id)}
                  className="flex-1 sm:flex-none px-3.5 py-2.5 bg-slate-900/80 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer text-center"
                >
                  Switch to Flat {pendingForOtherFlat.flat_number}
                </button>
                <button
                  type="button"
                  onClick={() => handleApproveConfirm(pendingForOtherFlat)}
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-white hover:bg-amber-50 text-amber-950 text-xs font-black rounded-xl shadow-md transition-colors cursor-pointer text-center"
                >
                  Approve Entry Now
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Desktop 2-Column Split */}
        <div className="lg:flex lg:gap-8 items-start">
          {/* Main Content Column */}
          <div className="flex-1 space-y-5">
            {/* HERO BANNER CARD (Image 4) - Emerald Gradient with NeighbourhoodArt & Yellow Button */}
            <div className="bg-gradient-to-br from-[#08785F] to-[#20A987] rounded-3xl p-6 relative overflow-hidden shadow-xs min-h-[205px] flex items-center text-white">
              {/* Scalable Vector Artwork on right */}
              <div className="absolute -right-4 bottom-0 top-0 w-1/2 max-w-[280px] pointer-events-none flex items-end justify-end">
                <NeighbourhoodArt className="w-full h-full object-contain" />
              </div>

              <div className="relative z-10 max-w-[210px] sm:max-w-xs space-y-2.5">
                <div className="text-[9px] font-black uppercase tracking-widest text-[#CAF0DD]">
                  Life&apos;s better, together
                </div>
                <h2 className="text-2xl sm:text-3xl font-black leading-tight tracking-tight text-white">
                  A happier place to call home.
                </h2>
                <div className="pt-2">
                  <Link
                    href="/resident/passes"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#FFE500] hover:bg-[#ebd400] text-[#142E31] text-xs font-extrabold rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    <span>Invite a guest</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#142E31]" />
                  </Link>
                </div>
              </div>
            </div>

            {/* QUICK ACTIONS CARD (Image 4: 8 Items in 4x2 Grid, 8th Item is Yellow with + Icon) */}
            <div className="bg-white rounded-3xl border border-[#E7E6E1] p-5 shadow-xs">
              <h3 className="font-extrabold text-sm text-[#142E31] mb-4">
                Quick actions
              </h3>

              <div className="grid grid-cols-4 gap-y-4 gap-x-2 text-center">
                {/* 1: Pre-approve */}
                <Link href="/resident/passes" className="flex flex-col items-center gap-1.5 group cursor-pointer">
                  <div className="w-13 h-13 rounded-2xl bg-[#F6F5F2] text-[#142E31] flex items-center justify-center transition-transform group-hover:scale-105 border border-[#E7E6E1]">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-semibold text-[#142E31] leading-tight">Pre-approve</span>
                </Link>

                {/* 2: My visitors */}
                <Link href="/resident/passes" className="flex flex-col items-center gap-1.5 group cursor-pointer">
                  <div className="w-13 h-13 rounded-2xl bg-[#F6F5F2] text-[#142E31] flex items-center justify-center transition-transform group-hover:scale-105 border border-[#E7E6E1]">
                    <Users className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-semibold text-[#142E31] leading-tight">My visitors</span>
                </Link>

                {/* 3: Notice board */}
                <Link href="/resident/community#notices" className="flex flex-col items-center gap-1.5 group cursor-pointer">
                  <div className="w-13 h-13 rounded-2xl bg-[#F6F5F2] text-[#142E31] flex items-center justify-center transition-transform group-hover:scale-105 border border-[#E7E6E1]">
                    <ClipboardList className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-semibold text-[#142E31] leading-tight">Notice board</span>
                </Link>

                {/* 4: Security / SOS */}
                <button 
                  type="button" 
                  onClick={() => setIsSosModalOpen(true)}
                  className="flex flex-col items-center gap-1.5 group cursor-pointer"
                >
                  <div className="w-13 h-13 rounded-2xl bg-[#F6F5F2] text-[#142E31] flex items-center justify-center transition-transform group-hover:scale-105 border border-[#E7E6E1]">
                    <Shield className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-semibold text-[#142E31] leading-tight">Security</span>
                </button>

                {/* 5: My home */}
                <Link href="/resident/settings" className="flex flex-col items-center gap-1.5 group cursor-pointer">
                  <div className="w-13 h-13 rounded-2xl bg-[#F6F5F2] text-[#142E31] flex items-center justify-center transition-transform group-hover:scale-105 border border-[#E7E6E1]">
                    <Home className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-semibold text-[#142E31] leading-tight">My home</span>
                </Link>

                {/* 6: Directory */}
                <Link href="/resident/community#directory" className="flex flex-col items-center gap-1.5 group cursor-pointer">
                  <div className="w-13 h-13 rounded-2xl bg-[#F6F5F2] text-[#142E31] flex items-center justify-center transition-transform group-hover:scale-105 border border-[#E7E6E1]">
                    <Contact2 className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-semibold text-[#142E31] leading-tight">Directory</span>
                </Link>

                {/* 7: Updates */}
                <Link href="/resident/inbox" className="flex flex-col items-center gap-1.5 group cursor-pointer">
                  <div className="w-13 h-13 rounded-2xl bg-[#F6F5F2] text-[#142E31] flex items-center justify-center transition-transform group-hover:scale-105 border border-[#E7E6E1]">
                    <Bell className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-semibold text-[#142E31] leading-tight">Updates</span>
                </Link>

                {/* 8: View all -> Yellow Square with + Icon navigates to /resident/community (Image 4!) */}
                <Link href="/resident/community" className="flex flex-col items-center gap-1.5 group cursor-pointer">
                  <div className="w-13 h-13 rounded-2xl bg-[#FFE500] hover:bg-[#ebd400] text-[#142E31] flex items-center justify-center transition-transform group-hover:scale-105 shadow-2xs">
                    <Plus className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <span className="text-[10px] font-bold text-[#142E31] leading-tight">View all</span>
                </Link>
              </div>
            </div>

            {/* AT YOUR GATE CARD (Mobile only, on desktop it appears in the right sidebar) */}
            <div className="lg:hidden">
              {renderGateCard()}
            </div>

            {/* VISITOR UPDATES TILE */}
            <div className="bg-white rounded-3xl border border-[#E7E6E1] p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-[#142E31]">
                    Visitor updates
                  </h3>
                  <p className="text-[11px] text-[#808683] mt-0.5">
                    {isLandlordViewingRentedFlat ? 'Protected by DPDP Privacy Standards.' : 'A little peace of mind, in real time.'}
                  </p>
                </div>
                {!isLandlordViewingRentedFlat && (
                  <Link
                    href="/resident/passes"
                    className="text-xs font-bold text-[#E05D44] hover:underline flex items-center gap-1"
                  >
                    <span>View all</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>

              {isLandlordViewingRentedFlat ? (
                <div className="p-5 bg-slate-50/80 rounded-2xl border border-slate-200 text-center space-y-2">
                  <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center mx-auto">
                    <ShieldCheck className="w-5 h-5 text-blue-700" />
                  </div>
                  <h4 className="text-xs font-extrabold text-slate-800">Tenant Personal Log Hidden</h4>
                  <p className="text-[11px] text-slate-500 max-w-xs mx-auto leading-relaxed">
                    Personal visitor arrivals and food/courier deliveries for Flat {currentFlat.flat_number} are confidential to tenant <strong>{currentFlat.tenant_name}</strong> under the DPDP Act.
                  </p>
                  <button
                    onClick={() => alert(`Contacting tenant ${currentFlat.tenant_name} at ${currentFlat.tenant_phone}...`)}
                    className="mt-1 px-3 py-1.5 bg-[#142E31] text-white text-xs font-bold rounded-xl hover:bg-black transition-colors"
                  >
                    Contact Tenant
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-[#E7E6E1]">
                  {recentVisits.length === 0 ? (
                    <div className="py-6 text-center text-xs text-[#808683]">
                      No recent visitors recorded for this unit.
                    </div>
                  ) : (
                    recentVisits.map((v) => (
                      <div key={v.id} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#F6F5F2] text-[#142E31] flex items-center justify-center">
                            {v.category === 'cab' ? (
                              <Car className="w-4 h-4" />
                            ) : v.category === 'service' ? (
                              <Wrench className="w-4 h-4" />
                            ) : v.category === 'guest' ? (
                              <User className="w-4 h-4" />
                            ) : (
                              <Package className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-[#142E31]">
                              {v.visitor_name}
                            </div>
                            <div className="text-[10px] text-[#808683]">
                              {v.delivery_company || v.category}
                            </div>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            v.status === 'checked_in'
                              ? 'bg-emerald-50 text-emerald-700'
                              : v.status === 'approved'
                              ? 'bg-blue-50 text-blue-700'
                              : v.status === 'rejected'
                              ? 'bg-red-50 text-red-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {v.status === 'checked_in' ? 'Inside' : v.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* AROUND YOUR COMMUNITY CARD with community.jpg */}
            <div className="bg-white rounded-3xl border border-[#E7E6E1] overflow-hidden shadow-xs flex flex-col sm:flex-row">
              <div className="p-6 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <div className="text-[9px] font-black uppercase tracking-wider text-[#44816A]">
                    Around Your Community
                  </div>
                  <h3 className="text-lg font-black text-[#142E31] mt-2 leading-snug">
                    Good neighbours.<br />Great beginnings.
                  </h3>
                </div>
                <Link
                  href="/resident/community"
                  className="text-xs font-bold text-[#E05D44] hover:underline inline-flex items-center gap-1.5"
                >
                  <span>Explore your community</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="sm:w-56 h-40 sm:h-auto relative bg-slate-100 shrink-0">
                <img
                  src="/assets/images/community.jpg"
                  alt="Palm Meadows Community"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Side Column (Desktop) */}
          <div className="hidden lg:block w-80 xl:w-96 space-y-5 shrink-0">
            {activeWaitingVisitor ? renderGateCard() : renderAllClearCard()}

            {/* MY HOME CARD */}
            <div className="bg-white rounded-3xl border border-[#E7E6E1] p-5 space-y-3.5 shadow-xs">
              <div className="flex items-center gap-2 text-[#808683]">
                <Home className="w-4 h-4" />
                <span className="text-[10px] font-extrabold uppercase tracking-widest">
                  My Home
                </span>
              </div>

              <div className="flex items-end justify-between">
                <div className="text-3xl font-black text-[#142E31] tracking-tight">
                  {currentFlat.flat_number || 'A-1204'}
                </div>
                <Building2 className="w-10 h-10 text-[#CFD8C8]" />
              </div>

              <div className="text-xs text-[#808683]">
                {state.currentCommunity.name} • {currentFlat.block_name || 'Tower A'}
              </div>

              <div className="border-t border-[#E7E6E1] pt-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#FFF8C2] text-[#17464B] font-extrabold text-[9px] flex items-center justify-center">
                    {(currentUser.full_name || 'Resident').split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                  </div>
                  <span className="text-xs font-semibold text-[#142E31]">
                    {currentUser.full_name || 'Resident Owner'}
                  </span>
                </div>
                <Link
                  href="/resident/settings"
                  className="text-xs font-bold text-[#E05D44] hover:underline"
                >
                  Manage
                </Link>
              </div>
            </div>

            {/* NOTICE BOARD CARD */}
            <div className="bg-white rounded-3xl border border-[#E7E6E1] p-5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-sm text-[#142E31]">
                  On the notice board
                </h4>
                <Link
                  href="/resident/community#notices"
                  className="text-xs font-bold text-[#E05D44] hover:underline flex items-center gap-1"
                >
                  <span>All</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="inline-block px-2 py-0.5 rounded bg-[#EFF3F9] text-[#7888A7] text-[9px] font-black uppercase tracking-wider">
                Maintenance
              </div>

              <h5 className="font-bold text-sm text-[#142E31] leading-snug">
                Water tank cleaning
              </h5>

              <p className="text-xs text-[#808683] leading-relaxed">
                A quick heads-up: water supply in Tower A will pause this Sunday, 10 AM–12 PM.
              </p>

              <div className="flex items-center gap-2 pt-1 text-[10px] text-[#808683]">
                <div className="w-5 h-5 rounded-full bg-[#F1F3EE] text-[#44816A] flex items-center justify-center font-bold">
                  <Building2 className="w-3 h-3" />
                </div>
                <span className="flex-1">Management committee</span>
                <span>2h ago</span>
              </div>
            </div>
          </div>
        </div>

        {/* Gate Parcels Awaiting Collection Section */}
        {gateParcels.length > 0 && (
          <div className="bg-purple-50/70 border border-purple-200 rounded-3xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-purple-900 font-bold text-xs">
                <Package className="w-4 h-4 text-purple-600" />
                <span>Packages at Main Gate Shelf ({gateParcels.length})</span>
              </div>
            </div>

            <div className="space-y-2">
              {gateParcels.map((parcel) => (
                <div key={parcel.id} className="p-3 bg-white rounded-2xl border border-purple-100 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-[#142E31]">{parcel.delivery_company || 'Courier'} - {parcel.visitor_name}</div>
                    <div className="text-[11px] text-[#808683]">Show Guard OTP: #{parcel.collection_otp || '4821'}</div>
                  </div>
                  <div className="text-xs font-black font-mono bg-purple-100 text-purple-900 px-2 py-1 rounded-lg">
                    PIN: {parcel.collection_otp || '4821'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Watermark */}
        <div className="pt-6 pb-2 text-center flex items-center justify-center gap-1.5 text-[#808683] text-[11px]">
          <Heart className="w-3 h-3 text-[#808683]" />
          <span>Made for a little more togetherness.</span>
        </div>

        {/* Confirmation & Decision Modals */}
        {rejectModalReq && (
          <ConfirmationModal
            isOpen={!!rejectModalReq}
            title="Decline Visitor Entry"
            description={`Are you sure you want to deny entry to ${rejectModalReq.visitor_name}? Security gate barrier will remain closed.`}
            confirmLabel="Deny Entry"
            variant="danger"
            onConfirm={() => handleRejectConfirm(rejectModalReq)}
            onClose={() => setRejectModalReq(null)}
          />
        )}

        {leaveAtGateModalReq && (
          <LeaveAtGateModal
            isOpen={!!leaveAtGateModalReq}
            request={leaveAtGateModalReq}
            onConfirm={handleLeaveAtGateConfirm}
            onClose={() => setLeaveAtGateModalReq(null)}
          />
        )}

        {isSosModalOpen && (
          <EmergencySosModal
            isOpen={isSosModalOpen}
            onClose={() => setIsSosModalOpen(false)}
            flatNumber={currentFlat.flat_number || '1204'}
            blockName={currentFlat.block_name || 'Tower A'}
            onSuccess={(type) => {
              setIsSosModalOpen(false);
              setSuccessBanner(`Emergency SOS broadcasted: ${type.toUpperCase()}`);
            }}
          />
        )}
      </div>
    </div>
  );
}
