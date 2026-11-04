'use client';

import React, { useState, useEffect } from 'react';
import { VisitorRequest } from '@/types';
import { appStore } from '@/lib/store';
import { X, Package, ShieldCheck, CheckCircle2, AlertCircle, KeyRound, User } from 'lucide-react';
import { PhotoDisplay } from '@/components/common/PhotoDisplay';
import { getDeliveryCategoryBadge } from '@/lib/utils';
import { TimeAgo } from '@/components/common/TimeDisplay';

interface ParcelHandoverModalProps {
  isOpen: boolean;
  parcelRequest: VisitorRequest | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export const ParcelHandoverModal: React.FC<ParcelHandoverModalProps> = ({
  isOpen,
  parcelRequest,
  onClose,
  onSuccess
}) => {
  const [otp, setOtp] = useState('');
  const [collectorName, setCollectorName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (parcelRequest) {
      setCollectorName(parcelRequest.decision_by_name || 'Resident');
      setOtp('');
      setError(null);
    }
  }, [parcelRequest]);

  if (!isOpen || !parcelRequest) return null;

  const catBadge = getDeliveryCategoryBadge(parcelRequest.delivery_category);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (parcelRequest.collection_otp && !otp.trim()) {
      setError('Please enter the 4-digit Collection OTP provided by the resident.');
      return;
    }

    if (!collectorName.trim()) {
      setError('Please specify the name of the person collecting this parcel.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = appStore.confirmParcelHandover(
        parcelRequest.id,
        appStore.getState().currentUser.id,
        otp.trim(),
        collectorName.trim()
      );
      onSuccess(res.message);
      onClose();
    } catch (err: unknown) {
      setError((err as Error).message || 'Handover verification failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header (Clean Wireframe Style) */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 text-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600 border border-indigo-200">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] text-indigo-700 font-extrabold uppercase tracking-widest">
                GATE SECURITY INVENTORY HANDOVER
              </div>
              <h2 className="font-extrabold text-base text-slate-900">
                Release Parcel to Resident
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {/* Parcel Summary Card */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3">
            <div className="w-16 h-16 rounded-xl bg-slate-200 border border-slate-300 overflow-hidden shrink-0">
              <PhotoDisplay
                photoPath={parcelRequest.parcel_photo_path || parcelRequest.visitor_photo_path}
                alt="Parcel thumbnail"
                type="parcel"
              />
            </div>

            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-slate-900 truncate">
                  {parcelRequest.delivery_company || 'Courier Delivery'}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${catBadge.bg} ${catBadge.text}`}>
                  {catBadge.label}
                </span>
              </div>

              <div className="text-xs font-extrabold text-indigo-700">
                Destination: Flat {parcelRequest.flat_number} ({parcelRequest.block_name})
              </div>

              {parcelRequest.parcel_details && (
                <div className="text-xs text-slate-600 truncate font-mono">
                  {parcelRequest.parcel_details}
                </div>
              )}

              <div className="text-[11px] text-slate-500 pt-0.5">
                Shelf: <strong className="text-slate-800">{parcelRequest.gate_location || 'Gate 1 Parcel Desk'}</strong> • Arrived <TimeAgo date={parcelRequest.created_at} />
              </div>
            </div>
          </div>

          {/* Error Notice */}
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700 font-semibold animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form Inputs */}
          <div className="space-y-4">
            {/* Collection OTP */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center justify-between">
                <span>Enter Resident Collection OTP <span className="text-red-500">*</span></span>
                {parcelRequest.collection_otp ? (
                  <button
                    type="button"
                    onClick={() => {
                      setOtp(parcelRequest.collection_otp || '');
                      setError(null);
                    }}
                    className="text-[10px] font-mono font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded cursor-pointer transition-colors"
                    title="Click to auto-fill resident's pickup PIN for testing"
                  >
                    Test PIN: {parcelRequest.collection_otp} (Click to fill)
                  </button>
                ) : (
                  <span className="text-[11px] font-normal text-slate-500">Provided in Resident App</span>
                )}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <KeyRound className="w-4 h-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/[^0-9a-zA-Z]/g, ''));
                    if (error) setError(null);
                  }}
                  placeholder="e.g. 6824"
                  className="w-full pl-10 pr-4 py-3 text-base font-mono font-bold tracking-widest text-slate-900 border border-slate-300 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-hidden focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                  autoFocus
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                The resident receives a 4-digit collection PIN when approving &quot;Leave at Gate&quot;.
              </p>
            </div>

            {/* Collector Name */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Handed Over To (Collector Name / Relation) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="w-4 h-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={collectorName}
                  onChange={(e) => {
                    setCollectorName(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="e.g. Resident Owner or House Staff"
                  className="w-full pl-10 pr-4 py-2.5 text-xs font-medium text-slate-900 border border-slate-300 rounded-xl focus:outline-hidden focus:border-indigo-600"
                />
              </div>
            </div>
          </div>

          {/* Submit Handover Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full flex items-center justify-center gap-2 py-3.5 text-white font-extrabold text-sm rounded-2xl shadow-xl transition-all cursor-pointer ${
                isSubmitting 
                  ? 'bg-slate-400 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-950/20 touch-press'
              }`}
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-300" />
              <span>{isSubmitting ? 'VERIFYING HANDOVER...' : 'VERIFY OTP & RECORD HANDOVER'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
