'use client';

import React, { useState } from 'react';
import { appStore } from '@/lib/store';
import { QrCode, CheckCircle2, AlertCircle, X, ArrowRight, UserCheck } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { GuestPass } from '@/types';

interface PassVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export const PassVerificationModal: React.FC<PassVerificationModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [passCode, setPassCode] = useState('');
  const [selectedGateId, setSelectedGateId] = useState('');
  const [verifiedPass, setVerifiedPass] = useState<GuestPass | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const state = appStore.getState();
  const gates = state.gates;
  const currentGateId = selectedGateId || gates[0]?.id;

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setVerifiedPass(null);

    const clean = passCode.trim();
    if (!clean) {
      setError('Please enter a 6-digit pass code.');
      return;
    }

    const pass = state.guestPasses.find(p => p.pass_code === clean);
    if (!pass) {
      setError('No pass found with this code. Please verify code with visitor.');
      return;
    }

    if (!pass.is_active) {
      setError('This guest pass has already been deactivated or fully used.');
      return;
    }

    if (new Date(pass.valid_until) < new Date()) {
      setError(`Pass expired on ${formatDateTime(pass.valid_until)}`);
      return;
    }

    if (pass.entries_used >= pass.max_entries) {
      setError(`Max entries (${pass.max_entries}) already used.`);
      return;
    }

    setVerifiedPass(pass);
  };

  const handleConfirmEntry = () => {
    if (!verifiedPass) return;
    const result = appStore.checkInWithGuestPass(verifiedPass.pass_code, currentGateId);
    if (result.success) {
      onSuccess(result.message);
      onClose();
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 text-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-base text-slate-900">Verify Resident Guest Pass</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          <form onSubmit={handleVerify} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Enter 6-Digit Pass PIN / Code
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={10}
                  value={passCode}
                  onChange={(e) => {
                    setPassCode(e.target.value.toUpperCase());
                    setError(null);
                  }}
                  placeholder="e.g. 847291"
                  className="flex-1 px-4 py-3 text-lg font-mono tracking-widest text-center font-bold border-2 border-slate-300 rounded-xl focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
                />
                <button
                  type="submit"
                  className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer"
                >
                  Verify
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Entry Gate
              </label>
              <select
                value={currentGateId}
                onChange={(e) => setSelectedGateId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden"
              >
                {gates.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          </form>

          {/* Quick Demo Hint */}
          <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            💡 <strong>Demo Test Pass:</strong> Enter <span className="font-mono font-bold text-emerald-700">847291</span> (pre-issued by Flat B-402 for Kavita Deshmukh).
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {verifiedPass && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Valid Pass Found!</span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-emerald-200 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Guest Name:</span>
                  <span className="font-bold text-slate-900">{verifiedPass.guest_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Destination Flat:</span>
                  <span className="font-bold text-slate-900">{verifiedPass.block_name} / Flat {verifiedPass.flat_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Valid Until:</span>
                  <span className="font-medium text-slate-800">{formatDateTime(verifiedPass.valid_until)}</span>
                </div>
                {verifiedPass.notes && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Purpose:</span>
                    <span className="text-slate-700">{verifiedPass.notes}</span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleConfirmEntry}
                className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-900/20 active:scale-98 transition-all cursor-pointer"
              >
                <UserCheck className="w-4 h-4" />
                <span>CONFIRM CHECK-IN & ENTRY</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
