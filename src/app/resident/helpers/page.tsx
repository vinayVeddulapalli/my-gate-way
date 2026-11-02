'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { appStore, AppState } from '@/lib/store';
import { 
  ArrowLeft, 
  UserCheck, 
  Clock, 
  Phone, 
  Plus, 
  CheckCircle2, 
  Building2, 
  ShieldCheck, 
  Search,
  Users,
  AlertCircle
} from 'lucide-react';
import { DailyHelper, DailyHelpCategory } from '@/types';
import { TimeAgo } from '@/components/common/TimeDisplay';

export default function ResidentHelpersPage() {
  const [state, setState] = useState<AppState>(appStore.getState());
  const [search, setSearch] = useState('');
  const [selectedFlatId, setSelectedFlatId] = useState<string | null>(null);
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  // Modal to add helper
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState<DailyHelpCategory>('maid');
  const [passCode, setPassCode] = useState('');

  useEffect(() => {
    return appStore.subscribe((s) => setState(s));
  }, []);

  const currentUser = state.currentUser;
  const activeFlatId = selectedFlatId || currentUser.flat_id || state.flats[0]?.id;
  const currentFlat = state.flats.find(f => f.id === activeFlatId) || state.flats[0];

  const allHelpers = state.dailyHelpers || [];
  // Filter helpers assigned to this flat
  const flatHelpers = allHelpers.filter(h => h.assigned_flat_ids?.includes(currentFlat.id));

  const handleAddHelper = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    const code = passCode.trim() || Math.floor(1000 + Math.random() * 9000).toString();

    appStore.addDailyHelper({
      community_id: state.currentCommunity.id,
      name: name.trim(),
      phone: phone.trim(),
      category: category,
      pass_code: code,
      assigned_flat_ids: [currentFlat.id],
      is_active: true
    });

    setBannerMessage(`✅ Successfully added ${name} (${category.toUpperCase()}) to Flat ${currentFlat.flat_number}!`);
    setIsAddModalOpen(false);
    setName('');
    setPhone('');
    setPassCode('');
    setTimeout(() => setBannerMessage(null), 4000);
  };

  const filteredHelpers = flatHelpers.filter(h =>
    h.name.toLowerCase().includes(search.toLowerCase()) ||
    h.phone.includes(search) ||
    h.category.includes(search)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-12 space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/resident"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-2 rounded-xl shadow-xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Resident Portal</span>
        </Link>
        <span className="text-xs font-semibold text-slate-500">
          Household Management
        </span>
      </div>

      {/* Header Banner */}
      <div className="bg-[#0B132B] text-white p-6 rounded-3xl shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <UserCheck className="w-4 h-4" />
            <span>Daily Domestic Staff Attendance</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight mt-1">
            My Household Staff (कामगार)
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time gate arrival alerts for your Maids, Cooks, Drivers, and Cleaners for {currentFlat.block_name} • Flat {currentFlat.flat_number}.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950/40 touch-press transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Staff for My Flat</span>
        </button>
      </div>

      {/* Alert Banner */}
      {bannerMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center gap-3 text-emerald-800 text-sm font-semibold animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{bannerMessage}</span>
        </div>
      )}

      {/* Search & Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search your helpers by name or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-hidden focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase">Assigned to My Flat</div>
            <div className="text-2xl font-black text-slate-900 mt-0.5">{flatHelpers.length} Helpers</div>
          </div>
          <div className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
            {flatHelpers.filter(h => h.is_inside).length} Inside Now
          </div>
        </div>
      </div>

      {/* Helper Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredHelpers.length === 0 ? (
          <div className="col-span-full bg-white p-12 text-center rounded-3xl border border-slate-200 text-slate-400 space-y-3">
            <Users className="w-12 h-12 mx-auto text-slate-300" />
            <div className="font-bold text-slate-700">No domestic staff registered for Flat {currentFlat.flat_number}</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Add your maid, cook, personal driver, or car cleaner to track their daily arrival at the society gate.
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-emerald-500 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Register First Helper</span>
            </button>
          </div>
        ) : (
          filteredHelpers.map((helper) => (
            <div
              key={helper.id}
              className={`bg-white rounded-3xl border-2 p-6 shadow-xs transition-all space-y-4 ${
                helper.is_inside ? 'border-emerald-300 bg-emerald-50/20' : 'border-slate-200'
              }`}
            >
              {/* Header: Category & Live Indicator */}
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
                  {helper.is_inside ? 'Currently Inside' : 'Not on Premises'}
                </span>
              </div>

              {/* Name & Phone */}
              <div>
                <h3 className="font-extrabold text-lg text-slate-900">{helper.name}</h3>
                <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
                  <span>Pass PIN: <strong className="font-mono text-slate-800">#{helper.pass_code}</strong></span>
                  <a
                    href={`tel:${helper.phone}`}
                    className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-bold"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Staff</span>
                  </a>
                </div>
              </div>

              {/* Attendance Log Box */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-xs space-y-1.5">
                <div className="flex items-center justify-between text-slate-500">
                  <span>Gate Status:</span>
                  <span className="font-bold text-slate-800">
                    {helper.is_inside ? 'Entered at Main Gate' : 'Left Complex'}
                  </span>
                </div>

                {helper.is_inside && helper.current_check_in_time && (
                  <div className="flex items-center justify-between text-emerald-700 font-medium">
                    <span>Arrived:</span>
                    <span><TimeAgo date={helper.current_check_in_time} /></span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Add Helper for Flat */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-base text-slate-900">Add Domestic Helper for Flat</h3>
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
                  placeholder="e.g. Geeta Bai"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number (+91)</label>
                <input
                  type="tel"
                  placeholder="+91 98765 00000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Staff Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as DailyHelpCategory)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-hidden focus:border-emerald-500"
                >
                  <option value="maid">House Maid / Cleaning</option>
                  <option value="cook">Cook / Chef</option>
                  <option value="driver">Personal Driver</option>
                  <option value="car_cleaner">Car Cleaner</option>
                  <option value="other">Tutor / Other Helper</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Preferred Pass Code (Optional 4 digits)</label>
                <input
                  type="text"
                  placeholder="Auto-generated if empty (e.g. 1005)"
                  value={passCode}
                  onChange={(e) => setPassCode(e.target.value)}
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
                  Add Helper
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
