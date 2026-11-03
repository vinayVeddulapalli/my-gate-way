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
  const currentFlat = state.flats.find(f => f.id === currentUser.flat_id) || state.flats[0];

  // Requests for this flat
  const flatRequests = state.visitorRequests.filter(r => r.flat_id === currentFlat.id);
  const pendingRequests = flatRequests.filter(r => r.status === 'pending');
  const gateParcels = flatRequests.filter(r => r.status === 'leave_at_gate');
  const recentVisits = flatRequests.slice(0, 3);

  const activeWaitingVisitor = pendingRequests.length > 0 ? pendingRequests[0] : null;

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
    // 1. If flat is rented out, show Landlord Asset Slide instead of tenant's daily gate approvals
    if (currentFlat.occupancy_type === 'rented') {
      return (
        <div className="bg-white rounded-3xl border border-[#E7E6E1] p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-900">
                Landlord Mode · Rented Property
              </span>
            </div>
            <span className="text-[11px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-lg border border-blue-100">
              {currentFlat.block_name || 'Tower A'} · Flat {currentFlat.flat_number}
            </span>
          </div>

          <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-100 space-y-1.5">
            <div className="text-xs font-bold text-blue-950 flex items-center justify-between">
              <span>Active Tenant:</span>
              <span className="text-emerald-700 font-extrabold text-[11px]">Lease Active</span>
            </div>
            <div className="text-base font-black text-[#142E31]">
              {currentFlat.tenant_name || 'Rohan Verma'}
            </div>
            <div className="text-xs text-[#808683] flex items-center gap-2 flex-wrap">
              <span>Phone: {currentFlat.tenant_phone || '+91 98222 33445'}</span>
              <span>•</span>
              <span>Lease valid till {currentFlat.lease_end_date || '31 Oct 2027'}</span>
            </div>
            <p className="text-[11px] text-[#808683] pt-1">
              🔒 Daily visitor gate approvals and delivery OTPs route directly to the tenant for privacy.
            </p>
          </div>

          {/* Financials & Maintenance Overview */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-3 bg-[#F6F5F2] rounded-2xl border border-[#E7E6E1]">
              <div className="text-[11px] text-[#808683] font-medium">Monthly Rental Income</div>
              <div className="text-base font-black text-[#142E31] mt-0.5">
                ₹{currentFlat.monthly_rent?.toLocaleString('en-IN') || '42,000'}/mo
              </div>
              <div className="text-[10px] text-emerald-700 font-semibold mt-1">Paid on 1st of month</div>
            </div>

            <div className="p-3 bg-[#F6F5F2] rounded-2xl border border-[#E7E6E1]">
              <div className="text-[11px] text-[#808683] font-medium">Society Maintenance</div>
              <div className="text-base font-black text-emerald-800 mt-0.5">
                ₹{currentFlat.maintenance_amount || 4200}/mo
              </div>
              <div className="text-[10px] text-emerald-700 font-semibold mt-1">Status: Paid (Up-to-date)</div>
            </div>
          </div>

          {/* Landlord Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => alert(`Connecting with tenant ${currentFlat.tenant_name} (${currentFlat.tenant_phone})...`)}
              className="flex-1 py-2.5 bg-[#142E31] hover:bg-black text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Contact Tenant
            </button>
            <button
              onClick={() => alert(`Maintenance Receipt #PM-${currentFlat.flat_number}-2026 generated and sent to email.`)}
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
            This unit is currently unoccupied. No gate approvals or daily staff are active for this flat.
          </p>
          <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-100 flex items-center justify-between">
            <span className="text-xs font-medium text-amber-900">Maintenance: ₹{currentFlat.maintenance_amount || 3500}/mo</span>
            <span className="text-xs font-bold text-emerald-700">Paid</span>
          </div>
        </div>
      );
    }

    // 3. If there is a real active visitor waiting at the gate
    if (activeWaitingVisitor) {
      return (
        <div className="bg-[#FFFDF9] rounded-3xl border border-[#F0DEC8] shadow-xs p-5 space-y-3.5 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#D39B50] animate-pulse" />
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#AD7D3E]">
                At Your Gate
              </span>
            </div>
            <Home className="w-4 h-4 text-[#AD7D3E]" />
          </div>

          <h3 className="text-base font-extrabold text-[#142E31] tracking-tight">
            Someone&apos;s here for you
          </h3>

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

            {/* Ask Guard to Call option (Escalation chain) */}
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

    // 4. When NO visitors are waiting, render the clean All-Clear Card!
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

            {/* AT YOUR GATE CARD (Image 4) */}
            {renderGateCard()}

            {/* VISITOR UPDATES TILE */}
            <div className="bg-white rounded-3xl border border-[#E7E6E1] p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-[#142E31]">
                    Visitor updates
                  </h3>
                  <p className="text-[11px] text-[#808683] mt-0.5">
                    A little peace of mind, in real time.
                  </p>
                </div>
                <Link
                  href="/resident/passes"
                  className="text-xs font-bold text-[#E05D44] hover:underline flex items-center gap-1"
                >
                  <span>View all</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="divide-y divide-[#E7E6E1]">
                {recentVisits.length > 0 ? (
                  recentVisits.map((v) => (
                    <Link
                      key={v.id}
                      href={`/resident/visitors/${v.id}`}
                      className="py-3 flex items-center justify-between hover:bg-slate-50/60 rounded-xl px-1.5 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#F6F5F2] flex items-center justify-center text-[#142E31]">
                          {v.category === 'cab' ? <Car className="w-5 h-5" /> :
                           v.category === 'service' ? <Wrench className="w-5 h-5" /> :
                           v.category === 'guest' ? <User className="w-5 h-5" /> :
                           <Package className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[#142E31]">{v.visitor_name}</div>
                          <div className="text-[11px] text-[#808683]">{v.delivery_company || v.category}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          v.status === 'checked_in' ? 'bg-[#E5F3EB] text-[#44816A]' :
                          v.status === 'approved' ? 'bg-blue-50 text-blue-700' :
                          v.status === 'pending' ? 'bg-[#FFF8C2] text-[#B45309]' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {v.status === 'checked_in' ? 'Inside' : v.status}
                        </span>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="py-4 text-center text-xs text-[#808683]">
                    No visitors yet today.
                  </div>
                )}
              </div>
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
                    AS
                  </div>
                  <span className="text-xs font-semibold text-[#142E31]">
                    {currentUser.full_name || 'Aarav Sharma'}
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
