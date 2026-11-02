'use client';

import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Flame, 
  HeartPulse, 
  ShieldAlert, 
  Phone, 
  X, 
  CheckCircle2, 
  HelpCircle 
} from 'lucide-react';
import { SosType } from '@/types';
import { appStore } from '@/lib/store';

interface EmergencySosModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (type: SosType) => void;
  flatNumber: string;
  blockName: string;
}

export const EmergencySosModal: React.FC<EmergencySosModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  flatNumber,
  blockName
}) => {
  const [selectedType, setSelectedType] = useState<SosType>('medical');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      appStore.triggerSosAlert(selectedType, notes || undefined);
      onSuccess(selectedType);
      onClose();
    } catch {
      // ignore
    } finally {
      setIsSubmitting(false);
    }
  };

  const types = [
    {
      id: 'medical' as SosType,
      label: 'Medical Emergency',
      sub: 'Cardiac, fall, severe sickness, ambulance needed',
      icon: HeartPulse,
      color: 'text-red-600 bg-red-50 border-red-300'
    },
    {
      id: 'fire' as SosType,
      label: 'Fire Alert',
      sub: 'Smoke, gas leak, apartment fire',
      icon: Flame,
      color: 'text-orange-600 bg-orange-50 border-orange-300'
    },
    {
      id: 'lift_entrapment' as SosType,
      label: 'Lift Entrapment',
      sub: 'Trapped inside tower passenger / service elevator',
      icon: AlertTriangle,
      color: 'text-amber-600 bg-amber-50 border-amber-300'
    },
    {
      id: 'security' as SosType,
      label: 'Security Threat',
      sub: 'Trespasser, intrusion, harassment, immediate guard needed',
      icon: ShieldAlert,
      color: 'text-rose-600 bg-rose-50 border-rose-300'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border-2 border-red-500 space-y-4 animate-in fade-in duration-200">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-red-600 text-white rounded-2xl shadow-md shadow-red-900/30 animate-pulse">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-black text-lg text-slate-900">
                Trigger Emergency SOS Alert
              </h2>
              <div className="text-xs text-red-600 font-bold">
                Direct High-Priority Alert to All Gate Terminals
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 bg-red-50/70 border border-red-200 rounded-2xl text-xs text-red-800">
          Your location will instantly broadcast to on-duty security officers at Main Gate 1:
          <div className="font-extrabold text-sm text-red-950 mt-1">
            {blockName} • Flat {flatNumber}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              Select Emergency Category:
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {types.map((t) => {
                const Icon = t.icon;
                const isSelected = selectedType === t.id;

                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedType(t.id)}
                    className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-red-600 bg-red-50/80 shadow-md ring-2 ring-red-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-xl ${t.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="font-extrabold text-xs text-slate-900">{t.label}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 leading-tight">{t.sub}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Additional Details for Guards (Optional):
            </label>
            <input
              type="text"
              placeholder="e.g. Elevator stuck between 4th and 5th floor"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-red-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 text-xs font-extrabold text-white bg-red-600 hover:bg-red-500 rounded-xl shadow-lg shadow-red-950/40 animate-bounce cursor-pointer"
            >
              BROADCAST SOS NOW
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

