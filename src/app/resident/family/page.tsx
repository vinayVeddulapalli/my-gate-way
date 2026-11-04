'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { appStore, AppState } from '@/lib/store';
import { ArrowLeft, UserPlus, Users, ShieldCheck, Check, Trash2, Phone, Mail } from 'lucide-react';
import { ConfirmationModal } from '@/components/common/ConfirmationModal';

interface FamilyMember {
  id: string;
  name: string;
  relation: string;
  phone: string;
  email: string;
  canApprove: boolean;
  isOwner: boolean;
}

export default function FamilyMembersPage() {
  const [state, setState] = useState<AppState>(appStore.getState());
  const [members, setMembers] = useState<FamilyMember[]>(() => {
    const u = appStore.getState().currentUser;
    return [
      {
        id: 'fam-1',
        name: u.full_name || 'Primary Resident',
        relation: u.resident_type === 'owner' ? 'Self (Primary Owner)' : 'Self (Primary Tenant)',
        phone: u.phone || '+91 98111 22334',
        email: u.email || 'resident@gatewaysecurity.in',
        canApprove: true,
        isOwner: u.resident_type === 'owner'
      }
    ];
  });

  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRelation, setNewRelation] = useState('Parent');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [memberToDelete, setMemberToDelete] = useState<FamilyMember | null>(null);

  useEffect(() => {
    return appStore.subscribe((s) => setState(s));
  }, []);

  let currentFlat = state.flats.find(f => f.id === state.currentUser.flat_id);
  if (state.currentUser.flat_display) {
    const flatFromDisplay = state.flats.find(f => state.currentUser.flat_display?.includes(f.flat_number));
    if (flatFromDisplay && (!currentFlat || currentFlat.flat_number !== flatFromDisplay.flat_number)) {
      currentFlat = flatFromDisplay;
    }
  }
  if (!currentFlat) {
    currentFlat = state.flats[0];
  }

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) {
      alert('Name and phone are required.');
      return;
    }

    const newMember: FamilyMember = {
      id: `fam-${Date.now()}`,
      name: newName.trim(),
      relation: newRelation,
      phone: newPhone.trim(),
      email: newEmail.trim() || `${newName.toLowerCase().replace(/\s+/g, '')}@family.in`,
      canApprove: true,
      isOwner: false
    };

    setMembers([...members, newMember]);
    setIsAdding(false);
    setNewName('');
    setNewPhone('');
    setNewEmail('');
  };

  const handleConfirmDelete = () => {
    if (!memberToDelete) return;
    setMembers(members.filter(m => m.id !== memberToDelete.id));
    setMemberToDelete(null);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-12 space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/resident"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-2 rounded-xl shadow-xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Approvals</span>
        </Link>
        <span className="text-xs font-semibold text-slate-500">
          Flat {currentFlat.flat_number}
        </span>
      </div>

      <div className="bg-[#0B132B] text-white p-6 rounded-3xl shadow-xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="text-emerald-400 text-xs font-bold uppercase tracking-wider">
            Access Permissions
          </div>
          <h1 className="text-2xl font-black tracking-tight mt-0.5">
            Authorized Family Members
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Authorize family members or co-residents to receive live gate alerts and approve visitors for Flat {currentFlat.flat_number}.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg touch-press transition-colors cursor-pointer shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>{isAdding ? 'Cancel' : 'ADD FAMILY MEMBER'}</span>
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAddMember} className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 space-y-4 animate-in slide-in-from-top-3">
          <h2 className="font-extrabold text-base text-slate-900 border-b border-slate-100 pb-2">
            Add New Co-Resident / Family
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Co-Resident Full Name"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Relationship to Owner
              </label>
              <select
                value={newRelation}
                onChange={(e) => setNewRelation(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl bg-white focus:outline-hidden"
              >
                <option value="Spouse">Spouse</option>
                <option value="Child">Son / Daughter</option>
                <option value="Parent">Parent / In-Law</option>
                <option value="Sibling">Sibling</option>
                <option value="Tenant">Registered Tenant</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="+91 98111 99999"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="resident@gatewaysecurity.in"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-hidden"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
          >
            AUTHORIZE MEMBER
          </button>
        </form>
      )}

      {/* Members Directory */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-extrabold text-base text-slate-900">
            Registered Co-Residents ({members.length})
          </h2>
          <span className="text-xs text-slate-500">Live Approval Enabled</span>
        </div>

        <div className="divide-y divide-slate-100">
          {members.map((member) => (
            <div key={member.id} className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
                  {member.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{member.name}</span>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      {member.relation}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                    <span className="flex items-center gap-1 font-mono">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {member.phone}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3 text-slate-400" />
                      {member.email}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                {member.isOwner ? (
                  <span className="text-xs font-bold text-slate-400 px-3 py-1 bg-slate-100 rounded-lg">
                    Primary Owner
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setMemberToDelete(member)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    title="Remove Authorization"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <ConfirmationModal
        isOpen={Boolean(memberToDelete)}
        title="Remove Authorized Member?"
        description={`Revoke visitor approval permissions for "${memberToDelete?.name}". They will no longer receive gate entry alerts for Flat ${currentFlat.flat_number}.`}
        confirmLabel="Revoke Access"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onClose={() => setMemberToDelete(null)}
      />
    </div>
  );
}
