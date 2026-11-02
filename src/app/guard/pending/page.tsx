'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { appStore, AppState } from '@/lib/store';
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ArrowLeft, 
  Phone, 
  AlertTriangle, 
  Ban, 
  UserCheck, 
  Building2,
  PhoneCall,
  Sparkles,
  Package,
  Boxes
} from 'lucide-react';
import { ConfirmationModal } from '@/components/common/ConfirmationModal';
import { getCategoryBadge } from '@/lib/utils';
import { VisitorRequest } from '@/types';
import { PhotoDisplay } from '@/components/common/PhotoDisplay';

function PendingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestId = searchParams.get('id');

  const [state, setState] = useState<AppState>(appStore.getState());
  const [activeRequest, setActiveRequest] = useState<VisitorRequest | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(300); // 5 mins countdown
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isEscalateModalOpen, setIsEscalateModalOpen] = useState(false);

  useEffect(() => {
    return appStore.subscribe((s) => {
      setState(s);
    });
  }, []);

  // Update active request
  useEffect(() => {
    if (requestId) {
      const match = state.visitorRequests.find(r => r.id === requestId);
      if (match) {
        setActiveRequest(match);
        return;
      }
    }

    // Default to the latest pending or approved request
    const pendingOrApproved = state.visitorRequests.find(r => r.status === 'pending' || r.status === 'approved');
    if (pendingOrApproved) {
      setActiveRequest(pendingOrApproved);
    } else if (state.visitorRequests.length > 0) {
      setActiveRequest(state.visitorRequests[0]);
    }
  }, [requestId, state.visitorRequests]);

  // Countdown timer for pending
  useEffect(() => {
    if (!activeRequest || activeRequest.status !== 'pending') return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [activeRequest]);

  if (!activeRequest) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <Clock className="w-12 h-12 text-slate-300 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">No Active Gate Approvals Pending</h2>
        <p className="text-xs text-slate-500">All registered visitors have been processed.</p>
        <Link
          href="/guard/register"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white font-bold rounded-xl text-sm"
        >
          Register New Visitor
        </Link>
      </div>
    );
  }

  const catBadge = getCategoryBadge(activeRequest.category);
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timeFormatted = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  const handleConfirmCheckIn = () => {
    try {
      appStore.checkInVisitor(activeRequest.id, state.currentUser.id);
      router.push('/guard');
    } catch (err: unknown) {
      alert((err as Error).message);
    }
  };

  const handleCancelRequest = (reason?: string) => {
    appStore.cancelVisitorRequest(activeRequest.id, reason || 'Cancelled at gate');
    setIsCancelModalOpen(false);
  };

  const handleEscalate = (notes?: string) => {
    appStore.escalateToSupervisor(activeRequest.id, notes || 'Resident not answering');
    setIsEscalateModalOpen(false);
  };

  // Quick simulated resident action for demonstration
  const handleSimulatedApprove = () => {
    appStore.approveVisitorRequest(activeRequest.id, state.users[1].id);
  };

  const handleSimulatedReject = () => {
    appStore.rejectVisitorRequest(activeRequest.id, state.users[1].id, 'Not expected at home right now.');
  };

  const handleSimulatedLeaveAtGate = () => {
    appStore.authorizeLeaveAtGate(activeRequest.id, state.users[1].id, 'Please leave with guard Ramesh at Gate 1');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-12 space-y-6">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <Link
          href="/guard"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-2 rounded-xl shadow-xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Gate Dashboard</span>
        </Link>
        <span className="text-xs font-semibold text-slate-500 font-mono">
          Ref: {activeRequest.id}
        </span>
      </div>

      {/* MAIN STATUS CARD (Clean Wireframe Style) */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden transition-all">
        {/* Dynamic Status Header */}
        {activeRequest.status === 'pending' && (
          <div className="bg-gradient-to-r from-amber-600 to-amber-500 text-white p-6 text-center space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-extrabold uppercase tracking-widest">
              <Clock className="w-3.5 h-3.5 animate-spin" />
              <span>Awaiting Resident Approval</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black">
              Approval Request Dispatched
            </h1>
            <p className="text-xs text-amber-100">
              Notification sent to resident phone. Auto-expires in <span className="font-mono font-bold text-white text-sm">{timeFormatted}</span>
            </p>
          </div>
        )}

        {activeRequest.status === 'approved' && (
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6 text-center space-y-1 animate-in fade-in">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-extrabold uppercase tracking-widest">
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>ENTRY APPROVED</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black">
              Resident Has Granted Entry!
            </h1>
            <p className="text-xs text-emerald-100">
              Approved by: <strong className="text-white">{activeRequest.decision_by_name || 'Resident'}</strong>
            </p>
          </div>
        )}

        {activeRequest.status === 'rejected' && (
          <div className="bg-gradient-to-r from-red-600 to-rose-700 text-white p-6 text-center space-y-1 animate-in fade-in">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-extrabold uppercase tracking-widest">
              <XCircle className="w-4 h-4 text-white" />
              <span>ENTRY STRICTLY DENIED</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black">
              Resident Declined This Visitor
            </h1>
            <p className="text-xs text-red-100">
              Reason: &ldquo;{activeRequest.rejection_reason || 'Denied by flat resident'}&rdquo;
            </p>
          </div>
        )}

        {activeRequest.status === 'leave_at_gate' && (
          <div className="bg-gradient-to-r from-indigo-700 to-purple-800 text-white p-6 text-center space-y-1 animate-in fade-in">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-extrabold uppercase tracking-widest">
              <Package className="w-4 h-4 text-amber-300" />
              <span>LEAVE AT GATE AUTHORIZED</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black">
              Resident Selected &ldquo;Leave at Gate&rdquo;
            </h1>
            <p className="text-xs text-indigo-100">
              Collect parcel, place it on the parcel rack, and notify rider they may depart.
            </p>
          </div>
        )}

        {activeRequest.status === 'collected' && (
          <div className="bg-gradient-to-r from-teal-700 to-emerald-800 text-white p-6 text-center space-y-1 animate-in fade-in">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-extrabold uppercase tracking-widest">
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>PARCEL COLLECTED</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black">
              Parcel Handed Over & Completed!
            </h1>
            <p className="text-xs text-teal-100">
              Handover verified for: <strong className="text-white">{activeRequest.collected_by_name || 'Resident'}</strong>
            </p>
          </div>
        )}

        {activeRequest.status === 'checked_in' && (
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 text-center space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-extrabold uppercase tracking-widest">
              <UserCheck className="w-4 h-4 text-white" />
              <span>PHYSICALLY CHECKED-IN</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black">
              Visitor Currently Inside Premises
            </h1>
          </div>
        )}

        {/* Card Body */}
        <div className="p-6 space-y-6">
          {/* Visitor Visual Avatar with pulsing ring */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="relative">
              <div className={`w-28 h-28 rounded-3xl overflow-hidden border-4 bg-slate-200 shadow-xl ${
                activeRequest.status === 'pending' ? 'border-amber-400 pulse-ring-amber' :
                activeRequest.status === 'approved' ? 'border-emerald-500 pulse-ring-green' :
                activeRequest.status === 'leave_at_gate' ? 'border-indigo-500' :
                activeRequest.status === 'collected' ? 'border-teal-500' :
                activeRequest.status === 'rejected' ? 'border-red-500' :
                'border-slate-300'
              }`}>
                <PhotoDisplay
                  photoPath={activeRequest.visitor_photo_path}
                  alt={activeRequest.visitor_name}
                  fallbackInitials={activeRequest.visitor_name.charAt(0)}
                />
              </div>

              {/* Status Floating Badge */}
              <div className="absolute -bottom-2 -right-2">
                {activeRequest.status === 'pending' && (
                  <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-lg">
                    <Clock className="w-4 h-4 animate-spin" />
                  </div>
                )}
                {activeRequest.status === 'approved' && (
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                )}
                {activeRequest.status === 'leave_at_gate' && (
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg">
                    <Package className="w-4 h-4" />
                  </div>
                )}
                {activeRequest.status === 'collected' && (
                  <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center shadow-lg">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                )}
                {activeRequest.status === 'rejected' && (
                  <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg">
                    <XCircle className="w-5 h-5" />
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-center gap-2">
                <h2 className="text-xl font-extrabold text-slate-900">
                  {activeRequest.visitor_name}
                </h2>
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${catBadge.bg} ${catBadge.text}`}>
                  {catBadge.label}
                </span>
              </div>
              <p className="text-xs font-mono text-slate-500 mt-0.5">
                Phone: {activeRequest.visitor_phone}
              </p>
            </div>
          </div>

          {/* Details Table */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 divide-y divide-slate-200 text-xs">
            <div className="py-2 flex items-center justify-between">
              <span className="text-slate-500 font-semibold">Destination Apartment:</span>
              <span className="font-extrabold text-slate-900 text-sm">
                {activeRequest.block_name} • Flat {activeRequest.flat_number}
              </span>
            </div>
            <div className="py-2 flex items-center justify-between">
              <span className="text-slate-500 font-semibold">Visit Purpose / Items:</span>
              <span className="font-medium text-slate-800">{activeRequest.purpose}</span>
            </div>
            {activeRequest.delivery_company && (
              <div className="py-2 flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Delivery Partner:</span>
                <span className="font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  {activeRequest.delivery_company}
                </span>
              </div>
            )}
            {activeRequest.parcel_details && (
              <div className="py-2 flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Parcel Note / AWB:</span>
                <span className="font-mono text-slate-800">{activeRequest.parcel_details}</span>
              </div>
            )}
            <div className="py-2 flex items-center justify-between">
              <span className="text-slate-500 font-semibold">Gate Location / Desk:</span>
              <span className="font-medium text-slate-800">{activeRequest.gate_location || activeRequest.gate_name}</span>
            </div>
            {activeRequest.vehicle_number && (
              <div className="py-2 flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Vehicle Number:</span>
                <span className="font-mono font-bold text-slate-800">{activeRequest.vehicle_number}</span>
              </div>
            )}
          </div>

          {/* Collection PIN Card (When in leave_at_gate) */}
          {activeRequest.status === 'leave_at_gate' && activeRequest.collection_otp && (
            <div className="p-4 bg-indigo-50 border-2 border-indigo-300 rounded-2xl text-center space-y-1">
              <div className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                Resident Collection PIN / OTP
              </div>
              <div className="text-3xl font-mono font-black text-indigo-950 tracking-widest">
                {activeRequest.collection_otp}
              </div>
              <p className="text-[11px] text-indigo-700">
                Ask resident or authorized domestic help for this 4-digit PIN when handing over parcel.
              </p>
            </div>
          )}

          {/* ACTION BUTTONS BASED ON STATUS */}
          <div className="space-y-3">
            {/* If Approved: Check-in button */}
            {activeRequest.status === 'approved' && (
              <button
                type="button"
                onClick={handleConfirmCheckIn}
                className="w-full flex items-center justify-center gap-2 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-base rounded-2xl shadow-xl shadow-emerald-900/30 touch-press transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>CONFIRM CHECK-IN & PERMIT ENTRY</span>
              </button>
            )}

            {/* If Leave at Gate: Confirm storage button */}
            {activeRequest.status === 'leave_at_gate' && (
              <Link
                href="/guard"
                className="w-full flex items-center justify-center gap-2 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-base rounded-2xl shadow-xl shadow-indigo-950/30 touch-press transition-all cursor-pointer"
              >
                <Package className="w-5 h-5 text-amber-300" />
                <span>PARCEL STORED ON SHELF — RETURN TO GATE</span>
              </Link>
            )}

            {/* If Rejected: Rejection banner */}
            {activeRequest.status === 'rejected' && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-center space-y-2">
                <p className="text-xs font-bold text-red-700 uppercase">
                  Do Not Allow Visitor Through Security Boom Barrier
                </p>
                <Link
                  href="/guard"
                  className="inline-block px-5 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-colors"
                >
                  Return to Gate Dashboard
                </Link>
              </div>
            )}

            {/* If Pending: Guard assistance tools */}
            {activeRequest.status === 'pending' && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href="tel:2402"
                    className="flex items-center justify-center gap-1.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 transition-colors"
                  >
                    <Building2 className="w-3.5 h-3.5 text-slate-600" />
                    <span>Ring Intercom #2402</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => setIsEscalateModalOpen(true)}
                    className="flex items-center justify-center gap-1.5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs rounded-xl border border-amber-300 transition-colors"
                  >
                    <PhoneCall className="w-3.5 h-3.5 text-amber-600" />
                    <span>Escalate to Supervisor</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCancelModalOpen(true)}
                  className="w-full py-2.5 text-slate-500 hover:text-red-600 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel Registration Request
                </button>
              </div>
            )}
          </div>

          {/* Quick Demo Simulator Helper */}
          {activeRequest.status === 'pending' && (
            <div className="p-3.5 bg-emerald-50/70 border border-dashed border-emerald-300 rounded-2xl space-y-2 text-center">
              <div className="text-[11px] font-bold text-emerald-900 flex items-center justify-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Quick Evaluation Testing Bar</span>
              </div>
              <p className="text-[11px] text-slate-600">
                You can switch to the Resident tab in the top header, or click below to simulate immediate resident response:
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSimulatedApprove}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs cursor-pointer"
                >
                  Simulate: APPROVE
                </button>
                <button
                  type="button"
                  onClick={handleSimulatedLeaveAtGate}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-xs cursor-pointer"
                >
                  Simulate: LEAVE AT GATE
                </button>
                <button
                  type="button"
                  onClick={handleSimulatedReject}
                  className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg shadow-xs cursor-pointer"
                >
                  Simulate: REJECT
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cancel Modal */}
      <ConfirmationModal
        isOpen={isCancelModalOpen}
        title="Cancel Visitor Request"
        description="Are you sure you want to cancel this pending visitor request? The resident will see the request as cancelled."
        confirmLabel="Yes, Cancel"
        variant="danger"
        onConfirm={handleCancelRequest}
        onClose={() => setIsCancelModalOpen(false)}
      />

      {/* Escalate Modal */}
      <ConfirmationModal
        isOpen={isEscalateModalOpen}
        title="Escalate to Supervisor"
        description="Notify the head security supervisor that the resident is not responding to approval alerts."
        confirmLabel="Escalate Now"
        variant="warning"
        requiresReason={true}
        reasonPlaceholder="e.g. 2 calls made, no answer, delivery rider waiting..."
        onConfirm={handleEscalate}
        onClose={() => setIsEscalateModalOpen(false)}
      />
    </div>
  );
}

export default function PendingApprovalPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading terminal state...</div>}>
      <PendingContent />
    </Suspense>
  );
}
