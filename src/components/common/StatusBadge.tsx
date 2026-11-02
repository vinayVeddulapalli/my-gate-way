'use client';

import React from 'react';
import { VisitorStatus } from '@/types';
import { Clock, CheckCircle2, XCircle, AlertTriangle, ArrowRightCircle, LogOut, Ban, Package } from 'lucide-react';

interface StatusBadgeProps {
  status: VisitorStatus;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs sm:text-sm px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm sm:text-base px-3.5 py-1.5 gap-2 font-semibold'
  }[size];

  switch (status) {
    case 'pending':
      return (
        <span className={`inline-flex items-center rounded-full bg-amber-50 text-amber-700 border border-amber-300 ${sizeClasses}`}>
          <Clock className="w-3.5 h-3.5 animate-spin text-amber-600" />
          <span>Pending Approval</span>
        </span>
      );
    case 'approved':
      return (
        <span className={`inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300 font-semibold ${sizeClasses}`}>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Approved — Permit Entry</span>
        </span>
      );
    case 'rejected':
      return (
        <span className={`inline-flex items-center rounded-full bg-red-50 text-red-700 border border-red-300 font-semibold ${sizeClasses}`}>
          <XCircle className="w-3.5 h-3.5 text-red-600" />
          <span>Entry Denied</span>
        </span>
      );
    case 'checked_in':
      return (
        <span className={`inline-flex items-center rounded-full bg-blue-50 text-blue-700 border border-blue-300 font-medium ${sizeClasses}`}>
          <ArrowRightCircle className="w-3.5 h-3.5 text-blue-600" />
          <span>Currently Inside</span>
        </span>
      );
    case 'checked_out':
      return (
        <span className={`inline-flex items-center rounded-full bg-slate-100 text-slate-700 border border-slate-300 ${sizeClasses}`}>
          <LogOut className="w-3.5 h-3.5 text-slate-500" />
          <span>Checked Out</span>
        </span>
      );
    case 'leave_at_gate':
      return (
        <span className={`inline-flex items-center rounded-full bg-indigo-50 text-indigo-700 border border-indigo-300 font-semibold ${sizeClasses}`}>
          <Package className="w-3.5 h-3.5 text-indigo-600" />
          <span>At Gate — Awaiting Pickup</span>
        </span>
      );
    case 'collected':
      return (
        <span className={`inline-flex items-center rounded-full bg-teal-50 text-teal-800 border border-teal-300 font-semibold ${sizeClasses}`}>
          <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
          <span>Parcel Collected</span>
        </span>
      );
    case 'expired':
      return (
        <span className={`inline-flex items-center rounded-full bg-zinc-100 text-zinc-600 border border-zinc-300 ${sizeClasses}`}>
          <AlertTriangle className="w-3.5 h-3.5 text-zinc-500" />
          <span>Expired</span>
        </span>
      );
    case 'cancelled':
      return (
        <span className={`inline-flex items-center rounded-full bg-zinc-100 text-zinc-600 border border-zinc-300 ${sizeClasses}`}>
          <Ban className="w-3.5 h-3.5 text-zinc-500" />
          <span>Cancelled</span>
        </span>
      );
    default:
      return null;
  }
};
