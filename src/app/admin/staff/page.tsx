'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { appStore, AppState } from '@/lib/store';
import { 
  ArrowLeft, 
  UserCheck, 
  ShieldCheck, 
  DoorOpen, 
  Plus, 
  Phone, 
  Mail, 
  CheckCircle2,
  Trash2,
  Edit,
  Search,
  Lock,
  Building2,
  Server,
  X,
  AlertCircle
} from 'lucide-react';
import { UserProfile, UserRole } from '@/types';

export default function AdminStaffPage() {
  const [state, setState] = useState<AppState>(appStore.getState());
  const [activeTab, setActiveTab] = useState<'guards' | 'residents' | 'admins' | 'gates'>('guards');
  const [searchQuery, setSearchQuery] = useState('');
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('security_guard');
  const [formResidentType, setFormResidentType] = useState<'owner' | 'tenant'>('owner');
  const [formPassword, setFormPassword] = useState('Password@123');
  const [formFlatId, setFormFlatId] = useState('');

  useEffect(() => {
    return appStore.subscribe((s) => setState(s));
  }, []);

  const guards = state.users.filter(u => u.role === 'security_guard');
  const residents = state.users.filter(u => u.role === 'resident' || u.role === 'family_member');
  const admins = state.users.filter(u => u.role === 'community_admin' || u.role === 'super_admin');
  const gates = state.gates;
  const flats = state.flats;

  // Filter users by search query
  const filterList = (list: UserProfile[]) => {
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(u => 
      u.full_name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.phone.includes(q) ||
      (u.flat_display && u.flat_display.toLowerCase().includes(q))
    );
  };

  const handleOpenAdd = (defaultRole: UserRole = 'security_guard') => {
    setFormName('');
    setFormEmail('');
    setFormPhone('+91 ');
    setFormRole(defaultRole);
    setFormPassword('Welcome@123');
    setFormFlatId(flats[0]?.id || '');
    setErrorBanner(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (user: UserProfile) => {
    setEditingUser(user);
    setFormName(user.full_name);
    setFormEmail(user.email);
    setFormPhone(user.phone);
    setFormRole(user.role);
    setFormFlatId(user.flat_id || flats[0]?.id || '');
    setErrorBanner(null);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim() || !formPhone.trim()) {
      setErrorBanner('Please fill in Name, Email, and Phone.');
      return;
    }

    setIsSubmitting(true);
    setErrorBanner(null);

    const res = await appStore.createUser({
      full_name: formName,
      email: formEmail,
      phone: formPhone,
      role: formRole,
      resident_type: formRole === 'resident' ? formResidentType : undefined,
      password: formPassword,
      flat_id: formRole === 'resident' ? formFlatId : undefined
    });

    setIsSubmitting(false);

    if (res.error) {
      setErrorBanner(res.error);
      return;
    }

    setSuccessBanner(`✅ User "${res.user.full_name}" created successfully as ${res.user.role}!`);
    setIsAddModalOpen(false);
    setTimeout(() => setSuccessBanner(null), 4000);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setIsSubmitting(true);
    await appStore.updateUser(editingUser.id, {
      full_name: formName,
      phone: formPhone,
      role: formRole,
      flat_id: formRole === 'resident' ? formFlatId : undefined
    });
    setIsSubmitting(false);

    setSuccessBanner(`✅ User "${formName}" updated successfully!`);
    setEditingUser(null);
    setTimeout(() => setSuccessBanner(null), 4000);
  };

  const handleDeleteUser = async (user: UserProfile) => {
    if (user.id === state.currentUser.id) {
      alert("You cannot delete the account you are currently logged in with.");
      return;
    }

    if (confirm(`Are you sure you want to permanently delete user "${user.full_name}" (${user.email})?`)) {
      const ok = await appStore.deleteUser(user.id);
      if (ok) {
        setSuccessBanner(`🗑️ User "${user.full_name}" deleted.`);
        setTimeout(() => setSuccessBanner(null), 4000);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-12 space-y-6">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-2 rounded-xl shadow-xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Admin Dashboard</span>
        </Link>
        <span className="text-xs font-semibold text-slate-500">Self-Service Access & Credentials</span>
      </div>

      {/* Hero Header */}
      <div className="bg-[#0B132B] text-white p-6 rounded-3xl shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="text-emerald-400 text-xs font-bold uppercase tracking-wider">
            User & Role Management
          </div>
          <h1 className="text-2xl font-black tracking-tight mt-0.5">
            Guards, Residents & Admin Staff
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Create, update, and delete accounts for your community with instant Supabase authentication.
          </p>
        </div>

        <button
          onClick={() => handleOpenAdd(activeTab === 'guards' ? 'security_guard' : activeTab === 'residents' ? 'resident' : 'community_admin')}
          className="flex items-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-sm touch-press transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ ENROLL NEW USER</span>
        </button>
      </div>

      {/* Success / Error Banners */}
      {successBanner && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center gap-3 text-emerald-800 text-sm font-semibold animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successBanner}</span>
        </div>
      )}

      {errorBanner && (
        <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl flex items-center gap-3 text-rose-800 text-sm font-semibold animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorBanner}</span>
        </div>
      )}

      {/* Tabs and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('guards')}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
              activeTab === 'guards' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Guards ({guards.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('residents')}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
              activeTab === 'residents' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Residents & Owners ({residents.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('admins')}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
              activeTab === 'admins' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Administrators ({admins.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('gates')}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
              activeTab === 'gates' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <DoorOpen className="w-4 h-4" />
            <span>Gates ({gates.length})</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, flat..."
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. GUARDS TAB */}
      {/* ========================================================================= */}
      {activeTab === 'guards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filterList(guards).map((guard) => (
            <div key={guard.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-xs">
                      {guard.full_name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900">{guard.full_name}</h3>
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 uppercase">
                        Security Officer
                      </span>
                    </div>
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" title="Active Account" />
                </div>

                <div className="text-xs space-y-1.5 text-slate-600 pt-3 mt-3 border-t border-slate-100 font-mono">
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{guard.phone}</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{guard.email}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Edit & Delete */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => handleOpenEdit(guard)}
                  className="flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <Edit className="w-3 h-3 text-slate-500" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDeleteUser(guard)}
                  className="flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700 px-2.5 py-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. RESIDENTS TAB */}
      {/* ========================================================================= */}
      {activeTab === 'residents' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filterList(residents).map((res) => (
            <div key={res.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-orange-600 text-white flex items-center justify-center font-bold text-base shadow-xs">
                      {res.full_name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900">{res.full_name}</h3>
                      <span className="text-[10px] font-bold text-[#E05D44] bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200 uppercase">
                        {res.role === 'resident' ? 'Flat Owner' : 'Family Member'}
                      </span>
                    </div>
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" title="Active Resident" />
                </div>

                <div className="text-xs space-y-1.5 text-slate-600 pt-3 mt-3 border-t border-slate-100">
                  <div className="font-bold text-slate-800">
                    {res.flat_display || 'Tower A • Flat 1204'}
                  </div>
                  <div className="flex items-center gap-1.5 font-mono">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{res.phone}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{res.email}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Edit & Delete */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => handleOpenEdit(res)}
                  className="flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <Edit className="w-3 h-3 text-slate-500" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDeleteUser(res)}
                  className="flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700 px-2.5 py-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. ADMINISTRATORS TAB */}
      {/* ========================================================================= */}
      {activeTab === 'admins' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filterList(admins).map((adm) => (
            <div key={adm.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-indigo-700 text-white flex items-center justify-center font-bold text-base shadow-xs">
                      {adm.full_name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900">{adm.full_name}</h3>
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200 uppercase">
                        {adm.role === 'super_admin' ? 'Super Admin' : 'Society Admin'}
                      </span>
                    </div>
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                </div>

                <div className="text-xs space-y-1.5 text-slate-600 pt-3 mt-3 border-t border-slate-100 font-mono">
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{adm.phone}</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{adm.email}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Edit & Delete */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => handleOpenEdit(adm)}
                  className="flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <Edit className="w-3 h-3 text-slate-500" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDeleteUser(adm)}
                  className="flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700 px-2.5 py-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. GATES TAB */}
      {/* ========================================================================= */}
      {activeTab === 'gates' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {gates.map((gate) => (
            <div key={gate.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-start justify-between">
                <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
                  <DoorOpen className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-300">
                  Operational
                </span>
              </div>

              <div>
                <h3 className="font-extrabold text-base text-slate-900">{gate.name}</h3>
                <p className="text-xs text-slate-500 capitalize">Type: {gate.gate_type} Gate Terminal</p>
              </div>

              <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                Tablet Camera Active • Boom Barrier Interface Connected
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD NEW USER */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-black text-slate-900">
                Enroll New Community User
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5">
              {/* Role Selector */}
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  User Role
                </label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-slate-900 cursor-pointer"
                >
                  <option value="security_guard">Security Guard (Gate Kiosk)</option>
                  <option value="resident">Flat Owner / Resident</option>
                  <option value="family_member">Family Member</option>
                  <option value="community_admin">Society Admin (Estate Office)</option>
                  <option value="super_admin">Super Admin (Platform Root)</option>
                </select>
              </div>

              {/* Full Name */}
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-slate-900"
                />
              </div>

              {/* Email */}
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  Login Email
                </label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="e.g. rahul.guard@prestige.in"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-slate-900"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  Mobile Phone
                </label>
                <input
                  type="tel"
                  required
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-slate-900"
                />
              </div>

              {/* Password */}
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  Initial Password
                </label>
                <input
                  type="text"
                  required
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono font-bold focus:ring-2 focus:ring-slate-900"
                />
              </div>

              {/* Occupancy Type (If resident) */}
              {formRole === 'resident' && (
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    Occupancy Type
                  </label>
                  <select
                    value={formResidentType}
                    onChange={(e) => setFormResidentType(e.target.value as 'owner' | 'tenant')}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-slate-900 cursor-pointer"
                  >
                    <option value="owner">Property Owner (Landlord)</option>
                    <option value="tenant">Renter / Tenant (Occupant)</option>
                  </select>
                </div>
              )}

              {/* Flat Selector (If resident) */}
              {(formRole === 'resident' || formRole === 'family_member') && (
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    Assign Apartment Flat
                  </label>
                  <select
                    value={formFlatId}
                    onChange={(e) => setFormFlatId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-slate-900 cursor-pointer"
                  >
                    {flats.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.block_name || 'Tower A'} • Floor {f.floor_number} • Flat {f.flat_number}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {isSubmitting ? 'Creating...' : 'Enroll User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT USER */}
      {/* ========================================================================= */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-black text-slate-900">
                Edit User: {editingUser.full_name}
              </h2>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  Email (Read-only)
                </label>
                <input
                  type="email"
                  disabled
                  value={formEmail}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  Mobile Phone
                </label>
                <input
                  type="tel"
                  required
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  Role
                </label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-slate-900 cursor-pointer"
                >
                  <option value="security_guard">Security Guard</option>
                  <option value="resident">Flat Owner / Resident</option>
                  <option value="family_member">Family Member</option>
                  <option value="community_admin">Society Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>

              {(formRole === 'resident' || formRole === 'family_member') && (
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    Assign Apartment Flat
                  </label>
                  <select
                    value={formFlatId}
                    onChange={(e) => setFormFlatId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-slate-900 cursor-pointer"
                  >
                    {flats.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.block_name || 'Tower A'} • Floor {f.floor_number} • Flat {f.flat_number}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
