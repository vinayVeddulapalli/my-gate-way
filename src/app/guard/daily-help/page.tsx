'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { appStore, AppState } from '@/lib/store';
import { 
  ArrowLeft, 
  Search, 
  UserCheck, 
  Clock, 
  LogIn, 
  LogOut, 
  CheckCircle2, 
  Plus, 
  Phone, 
  ShieldCheck, 
  KeyRound,
  Filter,
  Users
} from 'lucide-react';
import { DailyHelper, DailyHelpCategory } from '@/types';
import { TimeAgo } from '@/components/common/TimeDisplay';

export default function GuardDailyHelpPage() {
  const [state, setState] = useState<AppState>(appStore.getState());
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [insideFilter, setInsideFilter] = useState<'all' | 'inside' | 'outside'>('all');
  const [pinInput, setPinInput] = useState('');
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  // Modal to register new helper
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newCategory, setNewCategory] = useState<DailyHelpCategory>('maid');
  const [newPassCode, setNewPassCode] = useState('');
  const [newAssignedFlatId, setNewAssignedFlatId] = useState(state.flats[0]?.id || '');

  useEffect(() => {
    return appStore.subscribe((s) => setState(s));
  }, []);

  const helpers = state.dailyHelpers || [];
  const insideHelpers = helpers.filter(h => h.is_inside);

  // Fast PIN Search / Quick Check-In
  const handleQuickPinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput.trim()) return;

    const matchedHelper = helpers.find(h => h.pass_code === pinInput.trim());
    if (matchedHelper) {
      const res = appStore.toggleDailyHelperCheckIn(matchedHelper.id, state.gates[0]?.id);
      setBannerMessage(res.message);
      setPinInput('');
      setTimeout(() => setBannerMessage(null), 4000);
    } else {
      setBannerMessage(`⚠️ No daily helper found with Pass Code #${pinInput}`);
      setTimeout(() => setBannerMessage(null), 4000);
    }
  };

  const handleToggleCheckIn = (helper: DailyHelper) => {
    const res = appStore.toggleDailyHelperCheckIn(helper.id, state.gates[0]?.id);
    setBannerMessage(res.message);
    setTimeout(() => setBannerMessage(null), 4000);
  };

  const handleAddHelper = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) return;

    const passCode = newPassCode.trim() || Math.floor(1000 + Math.random() * 9000).toString();

    appStore.addDailyHelper({
      community_id: state.currentCommunity.id,
      name: newName.trim(),
      phone: newPhone.trim(),
      category: newCategory,
      pass_code: passCode,
      assigned_flat_ids: newAssignedFlatId ? [newAssignedFlatId] : [],
      is_active: true
    });

    setBannerMessage(`✅ Registered ${newName} as ${newCategory.toUpperCase()} (Pass Code: #${passCode})`);
    setIsAddModalOpen(false);
    setNewName('');
    setNewPhone('');
    setNewPassCode('');
    setTimeout(() => setBannerMessage(null), 4000);
  };

  const filteredHelpers = helpers.filter(h => {
    const matchesSearch = 
      h.name.toLowerCase().includes(search.toLowerCase()) ||
      h.phone.includes(search) ||
      h.pass_code.includes(search);

    const matchesCategory = categoryFilter === 'all' ? true : h.category === categoryFilter;

    let matchesInside = true;
    if (insideFilter === 'inside') matchesInside = !!h.is_inside;
    if (insideFilter === 'outside') matchesInside = !h.is_inside;

    return matchesSearch && matchesCategory && matchesInside;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-12 space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/guard"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-2 rounded-xl shadow-xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Gate Terminal</span>
        </Link>
        <span className="text-xs font-semibold text-slate-500">
          Main Gate Daily Staff Terminal
        </span>
      </div>

      {/* Header Banner */}
      <div className="bg-[#0B132B] text-white p-6 rounded-3xl shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <UserCheck className="w-4 h-4" />
            <span>Daily Staff & Domestic Help (कामगार)</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight mt-1">
            Gate Entry & Departure Control
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Record arrival and departure for Maids, Cooks, Drivers, and Maintenance staff with instant resident notification.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950/40 touch-press transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Staff</span>
        </button>
      </div>

      {/* Alert Banner */}
      {bannerMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center gap-3 text-emerald-800 text-sm font-semibold animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{bannerMessage}</span>
        </div>
      )}

      {/* FAST PIN ENTRY & METRICS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Fast PIN Bar */}
        <div className="lg:col-span-2 bg-gradient-to-r from-slate-900 to-[#101A3B] text-white p-5 rounded-2xl border border-slate-800 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5" />
              <span>Fast Gate Pass Entry (Code Tap)</span>
            </div>
            <div className="text-xs text-slate-300">
              Staff states their 4-digit PIN for instant 1-tap admission or checkout.
            </div>
          </div>

          <form onSubmit={handleQuickPinSubmit} className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              placeholder="e.g. 1001"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-slate-800/90 border border-slate-700 text-white font-mono text-sm tracking-wider focus:outline-hidden focus:border-emerald-500 w-32 text-center"
              maxLength={6}
            />
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
            >
              Verify & Log
            </button>
          </form>
        </div>

        {/* Quick KPI: Inside Staff */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase">Currently Inside Society</div>
            <div className="text-3xl font-black text-blue-600 mt-1">{insideHelpers.length} Staff</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Total registered: {helpers.length}</div>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by staff name, phone, pass code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-hidden focus:border-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter pills */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setInsideFilter('all')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                insideFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({helpers.length})
            </button>
            <button
              type="button"
              onClick={() => setInsideFilter('inside')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                insideFilter === 'inside' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Inside ({insideHelpers.length})
            </button>
            <button
              type="button"
              onClick={() => setInsideFilter('outside')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                insideFilter === 'outside' ? 'bg-slate-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Outside ({helpers.length - insideHelpers.length})
            </button>
          </div>

          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-hidden focus:border-emerald-500"
          >
            <option value="all">All Categories</option>
            <option value="maid">Maids / Housekeeping</option>
            <option value="driver">Personal Drivers</option>
            <option value="cook">Cooks / Chefs</option>
            <option value="car_cleaner">Car Cleaners</option>
            <option value="electrician">Electricians</option>
            <option value="plumber">Plumbers</option>
            <option value="gardener">Gardeners</option>
          </select>
        </div>
      </div>

      {/* STAFF LIST */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredHelpers.length === 0 ? (
          <div className="col-span-full bg-white p-12 text-center rounded-3xl border border-slate-200 text-slate-400">
            <UserCheck className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <div className="font-bold text-slate-600">No staff members found</div>
            <div className="text-xs text-slate-400 mt-1">Try resetting the search filters or register a new staff member.</div>
          </div>
        ) : (
          filteredHelpers.map((helper) => {
            const assignedFlats = state.flats.filter(f => helper.assigned_flat_ids?.includes(f.id));

            return (
              <div
                key={helper.id}
                className={`bg-white rounded-2xl border-2 transition-all p-5 flex flex-col justify-between shadow-xs ${
                  helper.is_inside ? 'border-emerald-300 bg-emerald-50/20 shadow-md' : 'border-slate-200'
                }`}
              >
                <div className="space-y-3">
                  {/* Top Bar: Category & Status */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-mono tracking-wider">
                      {helper.category.replace('_', ' ')}
                    </span>

                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        helper.is_inside 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${helper.is_inside ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                      {helper.is_inside ? 'Inside Society' : 'Outside'}
                    </span>
                  </div>

                  {/* Name & Phone */}
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900">{helper.name}</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{helper.phone}</span>
                    </div>
                  </div>

                  {/* Pass code & Assigned Flats */}
                  <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-500">
                      <span>Pass Code:</span>
                      <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                        #{helper.pass_code}
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-2">
                      <span className="text-slate-500 shrink-0">Working for:</span>
                      <span className="font-semibold text-slate-800 text-right">
                        {assignedFlats.length > 0 
                          ? assignedFlats.map(f => `${f.block_name ? f.block_name.split(' ')[1] : ''}-${f.flat_number}`).join(', ')
                          : 'Community General'}
                      </span>
                    </div>

                    {helper.is_inside && helper.current_check_in_time && (
                      <div className="flex items-center justify-between text-[11px] text-emerald-700 pt-1">
                        <span>Admitted:</span>
                        <span><TimeAgo date={helper.current_check_in_time} /></span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 1-Tap Toggle Check-In Button */}
                <div className="pt-4 mt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleToggleCheckIn(helper)}
                    className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer ${
                      helper.is_inside
                        ? 'bg-slate-800 hover:bg-slate-700 text-white'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    }`}
                  >
                    {helper.is_inside ? (
                      <>
                        <LogOut className="w-4 h-4" />
                        <span>Log Departure (Check Out)</span>
                      </>
                    ) : (
                      <>
                        <LogIn className="w-4 h-4" />
                        <span>Check In at Gate</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Register New Staff */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-base text-slate-900">Register Domestic Helper</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddHelper} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Meena Kumari"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number (+91)</label>
                <input
                  type="tel"
                  placeholder="+91 98765 00000"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Staff Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as DailyHelpCategory)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-hidden focus:border-emerald-500"
                >
                  <option value="maid">House Maid / Cleaning</option>
                  <option value="cook">Cook / Chef</option>
                  <option value="driver">Driver</option>
                  <option value="car_cleaner">Car Cleaner</option>
                  <option value="electrician">Electrician</option>
                  <option value="plumber">Plumber</option>
                  <option value="gardener">Gardener</option>
                  <option value="other">Other Service</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Flat (Permitted Household)</label>
                <select
                  value={newAssignedFlatId}
                  onChange={(e) => setNewAssignedFlatId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-hidden focus:border-emerald-500"
                >
                  {state.flats.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.block_name} - Flat {f.flat_number} ({f.primary_resident_name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Fast Entry Pass Code (Optional 4 digits)</label>
                <input
                  type="text"
                  placeholder="Leave empty for auto-generated PIN"
                  value={newPassCode}
                  onChange={(e) => setNewPassCode(e.target.value)}
                  maxLength={6}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md"
                >
                  Register & Activate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
