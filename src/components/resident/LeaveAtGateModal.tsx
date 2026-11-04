'use client';

import React, { useState } from 'react';
import { VisitorRequest } from '@/types';
import { X, Package, ShieldCheck, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import { PhotoDisplay } from '@/components/common/PhotoDisplay';
import { getDeliveryCategoryBadge } from '@/lib/utils';

interface LeaveAtGateModalProps {
  isOpen: boolean;
  request: VisitorRequest | null;
  onClose: () => void;
  onConfirm: (notes?: string) => void;
}

export const LeaveAtGateModal: React.FC<LeaveAtGateModalProps> = ({
  isOpen,
  request,
  onClose,
  onConfirm
}) => {
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !request) return null;

  const catBadge = getDeliveryCategoryBadge(request.delivery_category);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    onConfirm(notes.trim() || undefined);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header (Clean Wireframe Style) */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 text-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600 border border-indigo-200">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] text-indigo-700 font-extrabold uppercase tracking-widest">
                RESIDENT GATE AUTHORIZATION
              </div>
              <h2 className="font-extrabold text-base text-slate-900">
                Authorize &ldquo;Leave at Gate&rdquo;
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

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-slate-200 border border-slate-300 overflow-hidden shrink-0">
              <PhotoDisplay
                photoPath={request.visitor_photo_path}
                alt={request.visitor_name}
                fallbackInitials={request.visitor_name.charAt(0)}
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900 truncate">{request.visitor_name}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${catBadge.bg} ${catBadge.text}`}>
                  {catBadge.label}
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-0.5 truncate">
                {request.delivery_company ? `${request.delivery_company} Delivery` : request.purpose}
              </div>
              <div className="text-[11px] text-slate-400">
                Gate: <strong className="text-slate-700">{request.gate_name}</strong>
              </div>
            </div>
          </div>

          <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-2xl text-xs text-indigo-900 leading-relaxed">
            <p className="font-bold flex items-center gap-1.5 mb-1 text-indigo-950">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>Safe Parcel Custody Policy</span>
            </p>
            <span>
              The security guard will accept the package, store it on the gate parcel shelf, and issue a 4-digit Collection PIN. You or an authorized person can collect it using this PIN.
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Pickup Instructions / Notes for Guard <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Leave with gate security desk, will collect in evening, or house help will pick up"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
            />
          </div>

          <div className="pt-2 flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-indigo-950/20 touch-press transition-all cursor-pointer"
            >
              <Package className="w-4 h-4 text-amber-300" />
              <span>LEAVE AT GATE</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
