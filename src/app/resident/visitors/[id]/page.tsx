'use client';

import React, { useState, useEffect, use, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { appStore, AppState } from '@/lib/store';
import {
  ArrowLeft,
  User,
  Building2,
  Phone,
  AlignLeft,
  Users,
  CheckCircle2,
  LogIn,
  Building
} from 'lucide-react';
import { VisitorRequest } from '@/types';

function VisitorDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [state, setState] = useState<AppState>(appStore.getState());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return appStore.subscribe((s) => setState(s));
  }, []);

  if (!mounted) {
    return (
      <div className="max-w-md mx-auto px-4 py-6 pb-28 space-y-4">
        <div className="h-6 w-32 bg-slate-100 rounded-lg animate-pulse" />
        <div className="h-44 bg-slate-100 rounded-2xl animate-pulse" />
        <div className="h-48 bg-slate-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  // Find the request by ID, or fallback to first request or sample
  const visitor: VisitorRequest = state.visitorRequests.find(r => r.id === resolvedParams.id) || {
    id: resolvedParams.id,
    community_id: state.currentCommunity.id,
    flat_id: state.flats[0].id,
    gate_id: state.gates[0].id,
    guard_id: state.users[0].id,
    visitor_name: 'Visitor Pass',
    visitor_phone: '+91 98765 43211',
    category: 'guest',
    purpose: 'Personal visit',
    status: 'checked_in',
    visitor_count: 1,
    consent_obtained: true,
    created_at: '2026-10-31T10:35:04.000Z',
    decision_at: '2026-10-31T10:35:34.000Z',
    check_in_time: '2026-10-31T10:36:04.000Z',
    updated_at: '2026-10-31T10:36:04.000Z'
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'checked_in':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
            • Inside
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100">
            • Waiting
          </span>
        );
      case 'checked_out':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
            • Exited
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-100">
            • Denied
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
            • Approved
          </span>
        );
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'delivery': return 'Delivery';
      case 'cab': return 'Cab';
      case 'service': return 'Service';
      default: return 'Guest';
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-6 pb-28 space-y-5">
      {/* Back Link */}
      <Link
        href="/resident/passes"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#E05D44] hover:underline cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to visitors</span>
      </Link>

      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Visit details
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Main Gate • {state.currentCommunity.name}
        </p>
      </div>

      {/* Card 1: Visitor Overview */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 space-y-4">
        {/* Top Profile Row */}
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
            <User className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
              {visitor.visitor_name}
            </h2>
            <div className="text-xs text-slate-500 mt-0.5">
              {getCategoryLabel(visitor.category)}
            </div>
            <div className="mt-1.5">
              {getStatusBadge(visitor.status)}
            </div>
          </div>
        </div>

        {/* Details List */}
        <div className="border-t border-slate-100 pt-3.5 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-400">
              <Building2 className="w-4 h-4" />
              <span>Visiting</span>
            </div>
            <span className="font-bold text-slate-900">
              A-1204 • {state.currentCommunity.name}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-400">
              <Phone className="w-4 h-4" />
              <span>Mobile number</span>
            </div>
            <span className="font-bold text-slate-900">
              {visitor.visitor_phone}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-400">
              <AlignLeft className="w-4 h-4" />
              <span>Purpose</span>
            </div>
            <span className="font-bold text-slate-900">
              {visitor.purpose || 'Personal visit'}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-400">
              <Users className="w-4 h-4" />
              <span>Number of people</span>
            </div>
            <span className="font-bold text-slate-900">
              {visitor.visitor_count || 1} person
            </span>
          </div>
        </div>
      </div>

      {/* Card 2: Visit Timeline (Image 8) */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 space-y-4">
        <h3 className="font-bold text-sm text-slate-900">
          Visit timeline
        </h3>

        <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-emerald-100">
          {/* Step 1: Registered at Main Gate */}
          <div className="relative">
            <div className="absolute -left-6 top-0 w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
              <Building className="w-3 h-3" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">
                Registered at Main Gate
              </div>
              <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                31 Oct 2026 • 10:35:04 AM
              </div>
            </div>
          </div>

          {/* Step 2: Approved by Resident */}
          <div className="relative">
            <div className="absolute -left-6 top-0 w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">
                Approved by resident
              </div>
              <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                31 Oct 2026 • 10:35:34 AM
              </div>
            </div>
          </div>

          {/* Step 3: Entry Recorded by Security */}
          <div className="relative">
            <div className="absolute -left-6 top-0 w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
              <LogIn className="w-3 h-3" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">
                Entry recorded by security
              </div>
              <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                31 Oct 2026 • 10:36:04 AM
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VisitorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="max-w-md mx-auto px-4 py-6 pb-28 space-y-4">
          <div className="h-6 w-32 bg-slate-100 rounded-lg animate-pulse" />
          <div className="h-44 bg-slate-100 rounded-2xl animate-pulse" />
          <div className="h-48 bg-slate-100 rounded-2xl animate-pulse" />
        </div>
      }
    >
      <VisitorDetailContent params={params} />
    </Suspense>
  );
}
