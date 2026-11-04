'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { appStore, AppState } from '@/lib/store';
import {
  Plus,
  Search,
  Calendar,
  ChevronDown,
  User,
  Package,
  Car,
  Wrench,
  ArrowLeft,
  Minus,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  Sparkles,
  QrCode
} from 'lucide-react';
import { GuestPass, VisitorRequest, VisitorCategory } from '@/types';
import { QrCodeVisual } from '@/components/common/QrCodeVisual';

export default function VisitorBookAndPassesPage() {
  const router = useRouter();
  const [state, setState] = useState<AppState>(appStore.getState());
  const [mounted, setMounted] = useState(false);
  const [isInviting, setIsInviting] = useState(false);

  // Filters (Image 9)
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'checked_in'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Pre-approve Form State (Image 10)
  const [selectedType, setSelectedType] = useState<VisitorCategory>('guest');
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [purpose, setPurpose] = useState('Personal visit');
  const [peopleCount, setPeopleCount] = useState(1);
  const [createdPass, setCreatedPass] = useState<GuestPass | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    setMounted(true);
    return appStore.subscribe((s) => setState(s));
  }, []);

  if (!mounted) {
    return (
      <div className="max-w-md mx-auto px-4 py-6 pb-28 space-y-4">
        <div className="h-10 bg-slate-100 rounded-xl animate-pulse" />
        <div className="h-12 bg-slate-100 rounded-xl animate-pulse" />
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

  // Visitor history and active requests for this flat
  const flatRequests = state.visitorRequests.filter(r => r.flat_id === currentFlat.id || r.flat_number === currentFlat.flat_number);

  const displayItems = flatRequests.map(r => ({
    id: r.id,
    visitor_name: r.visitor_name,
    category: r.category,
    subtext: `${r.delivery_company || (r.category === 'guest' ? 'Guest' : r.category)} • ${r.category.toUpperCase()}`,
    status: r.status,
    time: new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }));

  // Apply filters
  const filteredVisitors = displayItems.filter(item => {
    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!item.visitor_name.toLowerCase().includes(q) && !item.subtext.toLowerCase().includes(q)) {
        return false;
      }
    }

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'pending' && item.status !== 'pending') return false;
      if (statusFilter === 'checked_in' && item.status !== 'checked_in') return false;
      if (statusFilter === 'rejected' && item.status !== 'rejected') return false;
      if (statusFilter === 'approved' && item.status !== 'approved' && item.status !== 'checked_in' && item.status !== 'checked_out') return false;
    }

    // Type filter
    if (typeFilter !== 'all') {
      if (item.category !== typeFilter) return false;
    }

    return true;
  });

  const handleCreatePreApproval = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) {
      alert('Please enter visitor name');
      return;
    }

    const newPass = appStore.createGuestPass({
      flat_id: currentFlat.id,
      guest_name: guestName.trim(),
      guest_phone: guestPhone.trim() || '+91 98765 00000',
      category: selectedType,
      valid_hours: 24,
      notes: `${purpose} (${peopleCount} person${peopleCount > 1 ? 's' : ''})`
    });

    setCreatedPass(newPass);
  };

  const handleCopyCode = (code: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(`Palm Meadows Gate Entry Pass for ${guestName}: Code #${code}. Valid for flat A-1204.`);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            • Waiting
          </span>
        );
      case 'checked_in':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            • Inside
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
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
            • Denied
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            • Approved
          </span>
        );
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'delivery':
        return (
          <div className="w-10 h-10 rounded-xl bg-[#FDEEEB] text-[#E05D44] flex items-center justify-center shrink-0">
            <Package className="w-5 h-5" />
          </div>
        );
      case 'cab':
        return (
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
            <Car className="w-5 h-5" />
          </div>
        );
      case 'service':
        return (
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
            <Wrench className="w-5 h-5" />
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
            <User className="w-5 h-5" />
          </div>
        );
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-6 pb-28 space-y-5">
      {!isInviting ? (
        /* SCREEN 9: YOUR VISITOR BOOK */
        <>
          {/* Page Heading */}
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Your visitor book
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Every arrival, every goodbye. All in one place.
            </p>
          </div>

          {/* Search Bar + Coral + Invite Button */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search name, company or flat"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#E05D44]"
              />
            </div>

            <button
              onClick={() => {
                setIsInviting(true);
                setCreatedPass(null);
              }}
              className="py-2.5 px-4 bg-[#E05D44] hover:bg-[#c44a33] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-colors shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Invite</span>
            </button>
          </div>

          {/* Horizontal Status Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-medium transition-colors cursor-pointer ${statusFilter === 'all'
                  ? 'bg-[#FCEBE6] text-[#E05D44] font-bold'
                  : 'bg-white text-slate-600 border border-slate-200'
                }`}
            >
              All visitors
            </button>

            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-medium transition-colors cursor-pointer ${statusFilter === 'pending'
                  ? 'bg-[#FCEBE6] text-[#E05D44] font-bold'
                  : 'bg-white text-slate-600 border border-slate-200'
                }`}
            >
              Waiting
            </button>

            <button
              onClick={() => setStatusFilter('checked_in')}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-medium transition-colors cursor-pointer ${statusFilter === 'checked_in'
                  ? 'bg-[#FCEBE6] text-[#E05D44] font-bold'
                  : 'bg-white text-slate-600 border border-slate-200'
                }`}
            >
              Inside
            </button>

            <button
              onClick={() => setStatusFilter('approved')}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-medium transition-colors cursor-pointer ${statusFilter === 'approved'
                  ? 'bg-[#FCEBE6] text-[#E05D44] font-bold'
                  : 'bg-white text-slate-600 border border-slate-200'
                }`}
            >
              Approved
            </button>

            <button
              onClick={() => setStatusFilter('rejected')}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-medium transition-colors cursor-pointer ${statusFilter === 'rejected'
                  ? 'bg-[#FCEBE6] text-[#E05D44] font-bold'
                  : 'bg-white text-slate-600 border border-slate-200'
                }`}
            >
              Denied
            </button>
          </div>

          {/* Sub-Filter Row: Today / All Types / Count */}
          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium text-[11px]">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Today</span>
              </span>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium text-[11px] cursor-pointer"
              >
                <option value="all">All types</option>
                <option value="guest">Guests</option>
                <option value="delivery">Deliveries</option>
                <option value="cab">Cabs</option>
                <option value="service">Services</option>
              </select>
            </div>

            <span className="text-[11px] text-slate-400 font-medium">
              {filteredVisitors.length} visits
            </span>
          </div>

          {/* Visitors List Card (Image 9) */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden">
            <div className="divide-y divide-slate-100">
              {filteredVisitors.map((item) => (
                <Link
                  key={item.id}
                  href={`/resident/visitors/${item.id}`}
                  className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors block"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {getCategoryIcon(item.category)}
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-slate-900 truncate">
                        {item.visitor_name}
                      </h3>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {item.subtext}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 ml-2">
                    <div>{getStatusBadge(item.status)}</div>
                    <div className="text-[11px] text-slate-400 font-medium mt-1">
                      {item.time}
                    </div>
                  </div>
                </Link>
              ))}

              {filteredVisitors.length === 0 && (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No visitors match the current search or filters.
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        /* SCREEN 10: PRE-APPROVE / INVITE SCREEN */
        <>
          {/* Back Link */}
          <button
            onClick={() => setIsInviting(false)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#E05D44] hover:underline cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to home</span>
          </button>

          {/* Page Heading */}
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Good company starts with an invite.
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Pre-approve your visitor for a smoother arrival.
            </p>
          </div>

          {!createdPass ? (
            /* Invite Form Card (Image 10) */
            <form onSubmit={handleCreatePreApproval} className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 space-y-4">
              {/* Visitor Type Selector (4 Cards) */}
              <div>
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-2">
                  Visitor Type
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'guest', label: 'Guest', icon: User },
                    { id: 'delivery', label: 'Delivery', icon: Package },
                    { id: 'cab', label: 'Cab', icon: Car },
                    { id: 'service', label: 'Service', icon: Wrench }
                  ].map((t) => {
                    const IconComponent = t.icon;
                    const isSelected = selectedType === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSelectedType(t.id as VisitorCategory)}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all cursor-pointer ${isSelected
                            ? 'bg-[#FDEEEB] border-[#E05D44] text-[#E05D44]'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                      >
                        <IconComponent className="w-5 h-5 mb-1" />
                        <span className="text-[11px] font-bold">{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  Full name
                </label>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="e.g. Guest Full Name"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#E05D44]"
                />
              </div>

              {/* Mobile Number */}
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  Mobile number
                </label>
                <input
                  type="tel"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder="10-digit mobile number"
                  className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#E05D44]"
                />
              </div>

              {/* Visiting Flat */}
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  Visiting flat
                </label>
                <div className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>A-1204 • {state.currentCommunity.name}</span>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </div>
              </div>

              {/* Purpose of Visit */}
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  Purpose of visit
                </label>
                <input
                  type="text"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="Personal visit"
                  className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#E05D44]"
                />
              </div>

              {/* Number of People Stepper */}
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  Number of people
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setPeopleCount(Math.max(1, peopleCount - 1))}
                    className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold transition-colors cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-black text-base text-slate-900 w-8 text-center">
                    {peopleCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPeopleCount(peopleCount + 1)}
                    className="w-10 h-10 rounded-xl bg-[#FDEEEB] hover:bg-[#fadcd5] text-[#E05D44] flex items-center justify-center font-bold transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                className="w-full py-3.5 bg-[#E05D44] hover:bg-[#c44a33] text-white font-bold text-sm rounded-xl shadow-xs transition-colors cursor-pointer pt-3"
              >
                Create Pre-Approved Pass
              </button>
            </form>
          ) : (
            /* Created Pass Display */
            <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6 space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
                <CheckCircle2 className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-lg font-black text-slate-900">
                  Pass Ready for {createdPass.guest_name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Gate clearance code generated for Flat A-1204
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  6-Digit Gate PIN
                </div>
                <div className="text-3xl font-black font-mono tracking-widest text-[#E05D44] mt-1">
                  {createdPass.pass_code}
                </div>
              </div>

              <div className="flex justify-center py-2">
                <QrCodeVisual value={createdPass.pass_code} size={130} />
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleCopyCode(createdPass.pass_code)}
                  className="w-full py-3 bg-[#E05D44] hover:bg-[#c44a33] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedCode ? 'Invitation Copied!' : 'Copy Invitation to WhatsApp'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsInviting(false);
                    setCreatedPass(null);
                  }}
                  className="w-full py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                >
                  Return to Visitor Book
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
