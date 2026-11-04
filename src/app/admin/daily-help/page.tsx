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
  Plus, 
  Phone, 
  Building2, 
  ShieldCheck, 
  Filter,
  Users
} from 'lucide-react';
import { DailyHelper, DailyHelpCategory } from '@/types';
import { TimeAgo } from '@/components/common/TimeDisplay';

export default function AdminDailyHelpPage() {
  const [state, setState] = useState<AppState>(appStore.getState());
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form states
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newCategory, setNewCategory] = useState<DailyHelpCategory>('maid');
  const [newPassCode, setNewPassCode] = useState('');
  const [selectedFlatId, setSelectedFlatId] = useState(state.flats[0]?.id || '');

  useEffect(() => {
    return appStore.subscribe((s) => setState(s));
  }, []);

  const helpers = state.dailyHelpers || [];
  const insideCount = helpers.filter(h => h.is_inside).length;

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
      assigned_flat_ids: selectedFlatId ? [selectedFlatId] : [],
      is_active: true
    });

    setIsAddModalOpen(false);
    setNewName('');
    setNewPhone('');
    setNewPassCode('');
  };

  const filteredHelpers = helpers.filter(h => {
    const matchesSearch = 
      h.name.toLowerCase().includes(search.toLowerCase()) ||
      h.phone.includes(search) ||
      h.pass_code.includes(search);

    const matchesCategory = categoryFilter === 'all' ? true : h.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-12 space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-2 rounded-xl shadow-xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Admin Dashboard</span>
        </Link>
        <span className="text-xs font-semibold text-slate-500">
          Society Staff & Service Provider Operations
        </span>
      </div>

      {/* Header Banner */}
      <div className="bg-[#0B132B] text-white p-6 rounded-3xl shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <UserCheck className="w-4 h-4" />
            <span>Daily Domestic Staff & Service Registry</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight mt-1">
            Community Daily Help Directory
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage approved recurring helpers (Maids, Drivers, Cooks, Maintenance) across all towers in {state.currentCommunity.name}.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950/40 touch-press transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Approved Staff</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase">Total Helpers</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{helpers.length} Registered</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-xs">
          <div className="text-xs font-bold text-emerald-700 uppercase">Currently Inside</div>
          <div className="text-2xl font-black text-emerald-700 mt-1">{insideCount} On Premises</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase">Maids & Cooks</div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {helpers.filter(h => h.category === 'maid' || h.category === 'cook').length} Active
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase">Drivers & Cleaners</div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {helpers.filter(h => h.category === 'driver' || h.category === 'car_cleaner').length} Active
          </div>
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search helper name, pass code, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-hidden focus:border-emerald-500"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-hidden focus:border-emerald-500"
          >
            <option value="all">All Staff Categories</option>
            <option value="maid">House Maids</option>
            <option value="cook">Cooks</option>
            <option value="driver">Drivers</option>
            <option value="car_cleaner">Car Cleaners</option>
            <option value="electrician">Electricians</option>
            <option value="plumber">Plumbers</option>
            <option value="gardener">Gardeners</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-extrabold uppercase border-b border-slate-200 tracking-wider">
                <th className="py-3 px-4">Staff Name & Category</th>
                <th className="py-3 px-4">Pass Code</th>
                <th className="py-3 px-4">Phone Number</th>
                <th className="py-3 px-4">Assigned Flats</th>
                <th className="py-3 px-4">Current Gate Status</th>
                <th className="py-3 px-4 text-right">Quick Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredHelpers.map((helper) => {
                const assignedFlats = state.flats.filter(f => helper.assigned_flat_ids?.includes(f.id));

                return (
                  <tr key={helper.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{helper.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono uppercase mt-0.5">
                        {helper.category.replace('_', ' ')}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-800">
                      #{helper.pass_code}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      {helper.phone}
                    </td>

                    <td className="py-3.5 px-4 text-slate-700">
                      {assignedFlats.length > 0 
                        ? assignedFlats.map(f => `${f.block_name ? f.block_name.split(' ')[1] : ''}-${f.flat_number}`).join(', ')
                        : 'Community Wide'}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          helper.is_inside 
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${helper.is_inside ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                        {helper.is_inside ? 'Inside Society' : 'Outside'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => appStore.toggleDailyHelperCheckIn(helper.id)}
                        className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition-colors cursor-pointer ${
                          helper.is_inside
                            ? 'bg-slate-800 text-white hover:bg-slate-700'
                            : 'bg-emerald-600 text-white hover:bg-emerald-500'
                        }`}
                      >
                        {helper.is_inside ? 'Log Exit' : 'Log Entry'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add Helper */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-base text-slate-900">Add Society Staff Member</h3>
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
                  placeholder="e.g. Daily Staff Full Name"
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
                <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as DailyHelpCategory)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-hidden focus:border-emerald-500"
                >
                  <option value="maid">House Maid</option>
                  <option value="cook">Cook</option>
                  <option value="driver">Driver</option>
                  <option value="car_cleaner">Car Cleaner</option>
                  <option value="electrician">Electrician</option>
                  <option value="plumber">Plumber</option>
                  <option value="gardener">Gardener</option>
                  <option value="other">Other Service Provider</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Household / Flat</label>
                <select
                  value={selectedFlatId}
                  onChange={(e) => setSelectedFlatId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-hidden focus:border-emerald-500"
                >
                  <option value="">Community General (All Towers)</option>
                  {state.flats.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.block_name} - Flat {f.flat_number} ({f.primary_resident_name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pass Code PIN (Optional)</label>
                <input
                  type="text"
                  placeholder="Auto-generated 4-digit code if empty"
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
                  Add Staff Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

