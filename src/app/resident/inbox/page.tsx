'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { appStore, AppState } from '@/lib/store';
import { 
  Bell, 
  Package, 
  Building2, 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  Clock,
  Sparkles
} from 'lucide-react';

export default function ResidentInboxPage() {
  const [state, setState] = useState<AppState>(appStore.getState());
  const [allRead, setAllRead] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return appStore.subscribe((s) => setState(s));
  }, []);

  if (!mounted) {
    return (
      <div className="max-w-md mx-auto px-4 py-6 pb-24 space-y-4">
        <div className="h-10 bg-slate-100 rounded-xl animate-pulse" />
        <div className="h-64 bg-slate-100 rounded-2xl animate-pulse" />
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

  const pendingRequests = state.visitorRequests.filter(
    r => r.flat_id === currentFlat.id && r.status === 'pending'
  );

  const gateParcels = state.visitorRequests.filter(
    r => r.flat_id === currentFlat.id && r.status === 'leave_at_gate'
  );

  return (
    <div className="max-w-md mx-auto px-4 py-6 pb-28 space-y-5">
      {/* Page Title & Mark All Read */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            A little heads-up.
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            All your community updates, together.
          </p>
        </div>

        <button
          onClick={() => setAllRead(true)}
          className="text-xs font-bold text-[#E05D44] hover:text-[#c44a33] transition-colors cursor-pointer pt-1"
        >
          Mark all read
        </button>
      </div>

      {/* Notifications Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="divide-y divide-slate-100">
          {/* Realtime Pending Requests Banner */}
          {pendingRequests.map((req) => (
            <Link
              key={req.id}
              href="/resident"
              className="p-4 sm:p-5 flex items-start gap-3.5 hover:bg-slate-50/70 transition-colors block"
            >
              <div className="w-10 h-10 rounded-xl bg-[#FDEEEB] text-[#E05D44] flex items-center justify-center shrink-0">
                <Package className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 truncate">
                    {req.visitor_name} is at the gate
                  </h3>
                  {!allRead && (
                    <span className="w-2 h-2 rounded-full bg-[#E05D44] shrink-0 ml-2" />
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  A {req.delivery_company || req.category} delivery is waiting for your approval
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[11px] text-slate-400 font-medium">
                    Just now • Action required
                  </span>
                  <span className="text-[11px] font-bold text-[#E05D44] flex items-center gap-1">
                    Review <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </Link>
          ))}

          {/* Gate Parcels Awaiting Pickup */}
          {gateParcels.map((parcel) => (
            <Link
              key={parcel.id}
              href="/resident"
              className="p-4 sm:p-5 flex items-start gap-3.5 hover:bg-slate-50/70 transition-colors block"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Package className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 truncate">
                    Parcel kept at Main Gate
                  </h3>
                  {!allRead && (
                    <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0 ml-2" />
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {parcel.visitor_name} ({parcel.delivery_company || 'Courier'}) left your package. Pickup OTP: #{parcel.collection_otp || '4821'}
                </p>
                <div className="mt-2 text-[11px] text-slate-400 font-medium">
                  Gate parcel shelf
                </div>
              </div>
            </Link>
          ))}

          {/* Wireframe Mock Item 1: Rahul Kumar at Gate (as shown in wireframe Image 2) */}
          {pendingRequests.length === 0 && (
            <div className="p-4 sm:p-5 flex items-start gap-3.5 hover:bg-slate-50/70 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-[#FDEEEB] text-[#E05D44] flex items-center justify-center shrink-0">
                <Package className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 truncate">
                    Rahul Kumar is at the gate
                  </h3>
                  {!allRead && (
                    <span className="w-2 h-2 rounded-full bg-[#E05D44] shrink-0 ml-2" />
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  An Amazon delivery is waiting for your approval
                </p>
                <span className="text-[11px] text-slate-400 font-medium block mt-1.5">
                  31 Oct • 11:05 AM
                </span>
              </div>
            </div>
          )}

          {/* Wireframe Mock Item 2: Welcome to your community (as shown in wireframe Image 2) */}
          <div className="p-4 sm:p-5 flex items-start gap-3.5 hover:bg-slate-50/70 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-[#FDEEEB] text-[#E05D44] flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 truncate">
                  Welcome to your community
                </h3>
                {!allRead && (
                  <span className="w-2 h-2 rounded-full bg-[#E05D44] shrink-0 ml-2" />
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Your home, your neighbours, and a little more peace of mind.
              </p>
              <span className="text-[11px] text-slate-400 font-medium block mt-1.5">
                31 Oct • 8:07 AM
              </span>
            </div>
          </div>
        </div>
      </div>

      {allRead && (
        <div className="text-center py-2 text-xs text-slate-400 font-medium">
          All notifications marked as read
        </div>
      )}
    </div>
  );
}
