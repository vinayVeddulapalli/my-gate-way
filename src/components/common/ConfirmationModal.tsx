'use client';

import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, ShieldAlert, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  variant?: 'danger' | 'success' | 'primary' | 'warning';
  requiresReason?: boolean;
  reasonPlaceholder?: string;
  onConfirm: (reason?: string) => void;
  onClose: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  variant = 'primary',
  requiresReason = false,
  reasonPlaceholder = 'Please state the reason...',
  onConfirm,
  onClose
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (requiresReason && !reason.trim()) {
      setError('Please provide a reason before continuing.');
      return;
    }
    setError('');
    onConfirm(reason);
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: <AlertCircle className="w-6 h-6 text-red-600" />,
          btn: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
          bgIcon: 'bg-red-100 text-red-600'
        };
      case 'success':
        return {
          icon: <CheckCircle2 className="w-6 h-6 text-emerald-600" />,
          btn: 'bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-emerald-500',
          bgIcon: 'bg-emerald-100 text-emerald-600'
        };
      case 'warning':
        return {
          icon: <ShieldAlert className="w-6 h-6 text-amber-600" />,
          btn: 'bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-500',
          bgIcon: 'bg-amber-100 text-amber-600'
        };
      case 'primary':
      default:
        return {
          icon: <ShieldAlert className="w-6 h-6 text-slate-800" />,
          btn: 'bg-slate-900 hover:bg-slate-800 text-white focus:ring-slate-500',
          bgIcon: 'bg-slate-100 text-slate-800'
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all"
        role="dialog"
        aria-modal="true"
      >
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className={`p-3 rounded-xl ${styles.bgIcon}`}>
              {styles.icon}
            </div>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-4">
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">{description}</p>
          </div>

          {requiresReason && (
            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Reason / Remarks
              </label>
              <textarea
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (error) setError('');
                }}
                placeholder={reasonPlaceholder}
                rows={3}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-hidden"
              />
              {error && <p className="mt-1 text-xs text-red-600 font-medium">{error}</p>}
            </div>
          )}
        </div>

        <div className="bg-slate-50 px-6 py-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className={`w-full sm:w-auto px-5 py-2 text-sm font-semibold rounded-lg shadow-xs transition-colors ${styles.btn}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
