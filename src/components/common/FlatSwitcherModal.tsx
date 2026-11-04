'use client';

import React, { useState } from 'react';
import { appStore, AppState } from '@/lib/store';
import { 
  Building2, 
  Check, 
  Search, 
  Home, 
  Key, 
  Users, 
  Plus, 
  X, 
  ChevronRight,
  ShieldCheck,
  Building,
  RotateCcw
} from 'lucide-react';
import { Flat } from '@/types';

interface FlatSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRole?: (roleId: string) => void;
}

const DEFAULT_SELF_ID = 'd0000000-0000-0000-0000-000000001204';

export const FlatSwitcherModal: React.FC<FlatSwitcherModalProps> = ({
  isOpen,
  onClose,
  onSelectRole
}) => {
  const [state, setState] = useState<AppState>(appStore.getState());
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'all' | 'self' | 'rented' | 'vacant'>('all');
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  // New Flat Form State
  const [regBlock, setRegBlock] = useState('Tower A');
  const [regFlatNum, setRegFlatNum] = useState('');
  const [regOccupancy, setRegOccupancy] = useState<'self_occupied' | 'rented' | 'vacant'>('rented');
  const [regTenantName, setRegTenantName] = useState('');
  const [regTenantPhone, setRegTenantPhone] = useState('');
  const [regRent, setRegRent] = useState('42000');
  const [regSuccessMsg, setRegSuccessMsg] = useState<string | null>(null);

  React.useEffect(() => {
    return appStore.subscribe((s) => setState(s));
  }, []);

  if (!isOpen) return null;

  const currentUser = state.currentUser;
  let currentFlat = state.flats.find(f => f.id === currentUser.flat_id);
  if (!currentFlat && currentUser.flat_display) {
    currentFlat = state.flats.find(f => currentUser.flat_display?.includes(f.flat_number));
  }
  if (!currentFlat) {
    currentFlat = state.flats[0];
  }

  // Strict flat ownership separation:
  // Resident Owner has multi-flat portfolio.
  // Other residents only see their own assigned unit(s)!
  const isDefaultOwner = currentUser.id === 'e0000000-0000-0000-0000-000000000004' || 
                         currentUser.email === 'owner@gatewaysecurity.in';

  const ownedFlats = (() => {
    if (isDefaultOwner) {
      return state.flats;
    }
    const matched = state.flats.filter(f => 
      currentUser.owned_flat_ids?.includes(f.id) || 
      (f.owner_name && currentUser.full_name && f.owner_name.toLowerCase() === currentUser.full_name.toLowerCase()) || 
      f.id === currentFlat?.id
    );
    return matched.length > 0 ? matched : (currentFlat ? [currentFlat] : [state.flats[0]]);
  })();

  const selfFlats = ownedFlats.filter(f => f.occupancy_type === 'self_occupied' || f.id === DEFAULT_SELF_ID);
  const rentedFlats = ownedFlats.filter(f => f.occupancy_type === 'rented');
  const vacantFlats = ownedFlats.filter(f => f.occupancy_type === 'vacant');

  const filteredFlats = ownedFlats.filter(f => {
    const q = search.trim().toLowerCase();
    const matchesSearch = !q ||
      f.flat_number.toLowerCase().includes(q) ||
      (f.block_name || '').toLowerCase().includes(q) ||
      (f.tenant_name || '').toLowerCase().includes(q) ||
      (f.owner_name || '').toLowerCase().includes(q);

    const matchesTab = 
      tab === 'all' ? true :
      tab === 'self' ? f.occupancy_type === 'self_occupied' || f.id === DEFAULT_SELF_ID :
      tab === 'rented' ? f.occupancy_type === 'rented' :
      f.occupancy_type === 'vacant';

    return matchesSearch && matchesTab;
  });

  const handleSelectFlat = (flat: Flat) => {
    appStore.switchActiveFlat(flat.id);
    onClose();
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFlatNum.trim()) {
      alert('Please enter flat number');
      return;
    }

    const created = appStore.registerNewFlat({
      block_name: regBlock,
      flat_number: regFlatNum.trim(),
      occupancy_type: regOccupancy,
      tenant_name: regOccupancy === 'rented' ? (regTenantName || 'New Tenant') : undefined,
      tenant_phone: regOccupancy === 'rented' ? (regTenantPhone || '+91 98000 11222') : undefined,
      monthly_rent: regOccupancy === 'rented' ? Number(regRent) || 40000 : undefined
    });

    setRegSuccessMsg(`Flat ${created.flat_number} successfully registered in your portfolio!`);
    setShowRegisterModal(false);
    setRegFlatNum('');
    setRegTenantName('');
    setRegTenantPhone('');
    setTimeout(() => setRegSuccessMsg(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-150">
      <div 
        className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Handle / Header */}
        <div className="p-5 pb-3 border-b border-[#E7E6E1] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#F6F5F2] border border-[#E7E6E1] flex items-center justify-center text-[#142E31]">
              <Building2 className="w-5 h-5 text-emerald-800" />
            </div>
            <div>
              <h2 className="text-lg font-black text-[#142E31]">
                {state.currentCommunity.name}
              </h2>
              <p className="text-xs text-[#808683] font-medium">
                {ownedFlats.length} Properties in Society Portfolio
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F6F5F2] hover:bg-[#EAE6DE] flex items-center justify-center text-[#808683] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success Banner if newly added */}
        {regSuccessMsg && (
          <div className="mx-5 mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-900 flex items-center gap-2 animate-in fade-in shrink-0">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{regSuccessMsg}</span>
          </div>
        )}

        {/* Portfolio Stats Card */}
        <div className="px-5 pt-3 shrink-0">
          <div className="p-3 bg-[#F6F5F2] rounded-2xl border border-[#E7E6E1] flex items-center justify-around text-center">
            <button
              onClick={() => setTab('self')}
              className={`transition-opacity hover:opacity-80 cursor-pointer ${tab === 'self' ? 'scale-105' : ''}`}
            >
              <div className="text-xs text-[#808683] font-medium">Primary Home</div>
              <div className="text-sm font-black text-[#142E31]">{selfFlats.length} Flat</div>
            </button>
            <div className="h-6 w-px bg-[#E7E6E1]" />
            <button
              onClick={() => setTab('rented')}
              className={`transition-opacity hover:opacity-80 cursor-pointer ${tab === 'rented' ? 'scale-105' : ''}`}
            >
              <div className="text-xs text-[#808683] font-medium">Rented Properties</div>
              <div className="text-sm font-black text-emerald-800">{rentedFlats.length} Flats</div>
            </button>
            <div className="h-6 w-px bg-[#E7E6E1]" />
            <button
              onClick={() => setTab('all')}
              className="transition-opacity hover:opacity-80 cursor-pointer"
            >
              <div className="text-xs text-[#808683] font-medium">Society Dues</div>
              <div className="text-sm font-black text-emerald-700">All Paid</div>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-5 pt-3 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-[#808683] absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search flat number (e.g. 1205, 1206), tower, or tenant..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#F6F5F2] rounded-2xl pl-10 pr-4 py-2.5 text-xs text-[#142E31] placeholder-[#808683] border border-[#E7E6E1] focus:outline-hidden"
            />
          </div>
        </div>

        {/* Filter Tabs - Fixed Height, shrink-0 to prevent vertical squishing */}
        <div className="px-5 py-3 shrink-0 flex items-center gap-2 overflow-x-auto">
          {[
            { id: 'all', label: `All (${ownedFlats.length})` },
            { id: 'self', label: `Primary (${selfFlats.length})` },
            { id: 'rented', label: `Rented (${rentedFlats.length})` },
            { id: 'vacant', label: `Vacant (${vacantFlats.length})` }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={`h-8 px-3.5 text-xs font-bold rounded-xl transition-all cursor-pointer border shrink-0 flex items-center justify-center ${
                tab === t.id 
                  ? 'bg-[#142E31] text-white border-[#142E31] shadow-xs' 
                  : 'bg-[#F6F5F2] text-[#808683] border-[#E7E6E1] hover:bg-[#EAE6DE] hover:text-[#142E31]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Flats List - min-h-0 and flex-1 so ONLY this section scrolls and absorbs height constraints */}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-3 space-y-2.5">
          {filteredFlats.length === 0 ? (
            <div className="p-8 text-center bg-[#F6F5F2] rounded-2xl border border-[#E7E6E1] text-[#808683] space-y-1">
              <Building className="w-8 h-8 mx-auto text-[#808683]/50 mb-2" />
              <p className="text-xs font-bold text-[#142E31]">No properties found</p>
              <p className="text-[11px]">No properties match the selected filter or search.</p>
            </div>
          ) : (
            filteredFlats.map((flat) => {
              const isSelected = currentFlat.id === flat.id;
              const isRented = flat.occupancy_type === 'rented';
              const isVacant = flat.occupancy_type === 'vacant';

              return (
                <div
                  key={flat.id}
                  onClick={() => handleSelectFlat(flat)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected 
                      ? 'bg-emerald-50/70 border-emerald-400 ring-1 ring-emerald-400/50' 
                      : 'bg-white hover:bg-slate-50 border-[#E7E6E1]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 text-xs font-black ${
                      isSelected ? 'bg-emerald-600 text-white' :
                      isRented ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                      isVacant ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      'bg-[#FFF8C2] text-[#142E31] border border-[#E7E6E1]'
                    }`}>
                      {flat.flat_number}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-[#142E31]">
                          {flat.block_name || 'Tower A'} · Flat {flat.flat_number}
                        </span>
                        {isSelected && (
                          <span className="text-[9px] font-black uppercase bg-emerald-600 text-white px-1.5 py-0.5 rounded-md">
                            Current Active
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-[#808683] mt-0.5 truncate">
                        {isRented ? (
                          <span className="text-blue-900 font-medium">
                            Rented to: <strong>{flat.tenant_name}</strong> ({flat.tenant_phone})
                          </span>
                        ) : isVacant ? (
                          <span className="text-amber-800 font-medium">
                            Vacant Property · Ready for Lease
                          </span>
                        ) : (
                          <span className="text-emerald-800 font-medium">
                            Self-Occupied · Primary Residence
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isRented && (
                      <span className="hidden sm:inline-block text-[11px] font-bold text-[#808683]">
                        ₹{flat.monthly_rent?.toLocaleString('en-IN')}/mo
                      </span>
                    )}
                    {isSelected ? (
                      <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    ) : (
                      <ChevronRight className="w-4 h-4 text-[#808683]" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Inline Form: Register Another Flat */}
        {showRegisterModal && (
          <form onSubmit={handleRegisterSubmit} className="p-4 bg-slate-50 border-t border-[#E7E6E1] space-y-3 shrink-0 animate-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase text-[#142E31] tracking-wider">
                Register Property to Portfolio
              </h4>
              <button 
                type="button" 
                onClick={() => setShowRegisterModal(false)}
                className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer font-bold"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-[#808683]">Tower / Block</label>
                <select
                  value={regBlock}
                  onChange={(e) => setRegBlock(e.target.value)}
                  className="w-full bg-white border border-[#E7E6E1] rounded-xl px-2.5 py-1.5 text-xs text-[#142E31]"
                >
                  <option value="Tower A">Tower A</option>
                  <option value="Tower B">Tower B</option>
                  <option value="Tower C">Tower C</option>
                  <option value="Tower D">Tower D</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#808683]">Flat Number</label>
                <input
                  type="text"
                  placeholder="e.g. 1502"
                  value={regFlatNum}
                  onChange={(e) => setRegFlatNum(e.target.value)}
                  className="w-full bg-white border border-[#E7E6E1] rounded-xl px-2.5 py-1.5 text-xs text-[#142E31]"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {(['rented', 'self_occupied', 'vacant'] as const).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setRegOccupancy(type)}
                  className={`py-1 text-[11px] font-bold rounded-lg border transition-colors cursor-pointer ${
                    regOccupancy === type 
                      ? 'bg-[#142E31] text-white border-[#142E31]' 
                      : 'bg-white text-slate-600 border-[#E7E6E1]'
                  }`}
                >
                  {type === 'rented' ? 'Rented' : type === 'self_occupied' ? 'Primary' : 'Vacant'}
                </button>
              ))}
            </div>

            {regOccupancy === 'rented' && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Tenant Name (e.g. Rahul)"
                  value={regTenantName}
                  onChange={(e) => setRegTenantName(e.target.value)}
                  className="bg-white border border-[#E7E6E1] rounded-xl px-2.5 py-1.5 text-xs text-[#142E31]"
                />
                <input
                  type="text"
                  placeholder="Monthly Rent (₹)"
                  value={regRent}
                  onChange={(e) => setRegRent(e.target.value)}
                  className="bg-white border border-[#E7E6E1] rounded-xl px-2.5 py-1.5 text-xs text-[#142E31]"
                />
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2 bg-[#142E31] hover:bg-black text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Confirm & Save Property
            </button>
          </form>
        )}

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#E7E6E1] bg-[#F6F5F2] flex flex-col gap-2 shrink-0">
          {!showRegisterModal && (
            <button
              onClick={() => setShowRegisterModal(true)}
              className="w-full py-2.5 bg-white hover:bg-slate-50 border border-[#E7E6E1] text-[#142E31] text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Register Another Flat / Property</span>
            </button>
          )}

          {/* Clean testing role toggle */}
          <div className="pt-1 flex items-center justify-between text-[11px] text-[#808683]">
            <span>Security testing roles:</span>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  appStore.switchActiveUser('e0000000-0000-0000-0000-000000000003'); // Guard
                  onClose();
                  window.location.href = '/guard';
                }}
                className="font-bold text-emerald-800 hover:underline cursor-pointer"
              >
                Gate Guard
              </button>
              <span>•</span>
              <button
                onClick={() => {
                  appStore.switchActiveUser('e0000000-0000-0000-0000-000000000002'); // Admin
                  onClose();
                  window.location.href = '/admin';
                }}
                className="font-bold text-blue-800 hover:underline cursor-pointer"
              >
                Community Admin
              </button>
              <span>•</span>
              <button
                onClick={() => {
                  onClose();
                  window.location.href = '/login';
                }}
                className="font-bold text-slate-700 hover:underline cursor-pointer"
              >
                Switch Portal
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

