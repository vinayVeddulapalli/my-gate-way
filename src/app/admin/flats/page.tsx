'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { appStore, AppState } from '@/lib/store';
import { ArrowLeft, Building2, Search, Plus, Check, Phone, ShieldCheck } from 'lucide-react';

export default function AdminFlatsPage() {
  const [state, setState] = useState<AppState>(appStore.getState());
  const [search, setSearch] = useState('');
  const [selectedBlock, setSelectedBlock] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newBlockId, setNewBlockId] = useState('');
  const [newFlatNumber, setNewFlatNumber] = useState('');
  const [newFloorNumber, setNewFloorNumber] = useState(1);
  const [newIntercom, setNewIntercom] = useState('');
  const [newResidentName, setNewResidentName] = useState('');
  const [newResidentPhone, setNewResidentPhone] = useState('');
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  useEffect(() => {
    return appStore.subscribe((s) => setState(s));
  }, []);

  const blocks = state.blocks;
  const flats = state.flats;

  const handleAddFlat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFlatNumber.trim()) return;

    const chosenBlock = blocks.find(b => b.id === (newBlockId || blocks[0]?.id)) || blocks[0];

    appStore.addFlat({
      community_id: state.currentCommunity.id,
      block_id: chosenBlock.id,
      block_name: chosenBlock.name,
      flat_number: newFlatNumber.trim(),
      floor_number: Number(newFloorNumber),
      intercom_number: newIntercom.trim() || undefined,
      is_occupied: Boolean(newResidentName.trim()),
      primary_resident_name: newResidentName.trim() || undefined,
      primary_resident_phone: newResidentPhone.trim() || undefined
    });

    setBannerMessage(`✅ Flat ${chosenBlock.name} - ${newFlatNumber} registered successfully!`);
    setIsAddModalOpen(false);
    setNewFlatNumber('');
    setNewIntercom('');
    setNewResidentName('');
    setNewResidentPhone('');
    setTimeout(() => setBannerMessage(null), 4000);
  };

  const filteredFlats = flats.filter(f => {
    const matchesSearch = 
      f.flat_number.includes(search) || 
      (f.primary_resident_name && f.primary_resident_name.toLowerCase().includes(search.toLowerCase())) ||
      (f.block_name && f.block_name.toLowerCase().includes(search.toLowerCase()));

    const matchesBlock = selectedBlock === 'all' ? true : f.block_id === selectedBlock;

    return matchesSearch && matchesBlock;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-12 space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-2 rounded-xl shadow-xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Admin Dashboard</span>
        </Link>
        <span className="text-xs font-semibold text-slate-500">
          Apartment Directory
        </span>
      </div>

      <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-sm border border-slate-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="text-emerald-700 text-xs font-bold uppercase tracking-wider">
            Unit Hierarchy & Occupancy
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
            Buildings, Blocks & Flats Directory
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage apartment units, intercom linkages, primary resident associations, and tenant occupancy.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs touch-press transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Apartment Unit</span>
        </button>
      </div>

      {bannerMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center gap-3 text-emerald-800 text-sm font-semibold animate-in fade-in duration-200">
          <Check className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{bannerMessage}</span>
        </div>
      )}

      {/* Block Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {blocks.map((block) => {
          const blockFlats = flats.filter(f => f.block_id === block.id);
          return (
            <div key={block.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs font-bold text-slate-500 uppercase">{block.name}</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{blockFlats.length} Flats</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{block.total_floors} Floors • Elevator Equipped</div>
            </div>
          );
        })}
      </div>

      {/* Flats Directory Table & Filter */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-600" />
            <h2 className="font-extrabold text-base text-slate-900">
              Registered Apartments ({filteredFlats.length})
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search flat or resident..."
                className="pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:outline-hidden"
              />
            </div>

            <select
              value={selectedBlock}
              onChange={(e) => setSelectedBlock(e.target.value)}
              className="px-3 py-1.5 text-xs border border-slate-300 rounded-xl bg-white focus:outline-hidden"
            >
              <option value="all">All Towers / Blocks</option>
              {blocks.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="p-4">Flat Number</th>
                <th className="p-4">Tower / Block</th>
                <th className="p-4">Floor</th>
                <th className="p-4">Intercom</th>
                <th className="p-4">Primary Resident</th>
                <th className="p-4">Contact Phone</th>
                <th className="p-4">Occupancy Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFlats.map((flat) => (
                <tr key={flat.id} className="hover:bg-slate-50">
                  <td className="p-4 font-black text-sm text-slate-900">
                    Flat {flat.flat_number}
                  </td>
                  <td className="p-4 font-semibold text-slate-700">{flat.block_name}</td>
                  <td className="p-4 text-slate-600">Floor {flat.floor_number}</td>
                  <td className="p-4 font-mono font-bold text-slate-800">#{flat.intercom_number || '2402'}</td>
                  <td className="p-4 font-bold text-slate-900">{flat.primary_resident_name || 'Unassigned'}</td>
                  <td className="p-4 font-mono text-slate-600">{flat.primary_resident_phone || '—'}</td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>Occupied</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add New Apartment Unit */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-base text-slate-900">Register New Apartment Unit</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddFlat} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Building Tower / Block</label>
                <select
                  value={newBlockId || blocks[0]?.id}
                  onChange={(e) => setNewBlockId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-hidden focus:border-emerald-500"
                >
                  {blocks.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.total_floors} Floors)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Flat Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 501"
                    value={newFlatNumber}
                    onChange={(e) => setNewFlatNumber(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Floor Number</label>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={newFloorNumber}
                    onChange={(e) => setNewFloorNumber(Number(e.target.value))}
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Intercom Extension Number</label>
                <input
                  type="text"
                  placeholder="e.g. 2501"
                  value={newIntercom}
                  onChange={(e) => setNewIntercom(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Primary Resident Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Vikram Malhotra"
                  value={newResidentName}
                  onChange={(e) => setNewResidentName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Resident Phone (+91)</label>
                <input
                  type="tel"
                  placeholder="+91 98XXX XXXXX"
                  value={newResidentPhone}
                  onChange={(e) => setNewResidentPhone(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md"
                >
                  Register Flat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
