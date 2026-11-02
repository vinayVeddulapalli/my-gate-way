'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { appStore, AppState } from '@/lib/store';
import { 
  Building2, 
  Home, 
  ShieldCheck, 
  Pin, 
  Phone, 
  Search,
  CheckCircle2,
  Calendar,
  Wrench,
  Users
} from 'lucide-react';
import { Notice, NoticeCategory } from '@/types';

export default function ResidentCommunityPage() {
  const [state, setState] = useState<AppState>(appStore.getState());
  const [activeSegment, setActiveSegment] = useState<'notices' | 'directory'>('notices');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return appStore.subscribe((s) => setState(s));
  }, []);

  if (!mounted) {
    return (
      <div className="max-w-md mx-auto px-4 py-6 pb-28 space-y-4">
        <div className="h-10 bg-slate-100 rounded-xl animate-pulse" />
        <div className="h-48 bg-slate-100 rounded-2xl animate-pulse" />
        <div className="h-24 bg-slate-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  const notices = state.notices || [];

  return (
    <div className="max-w-md mx-auto px-4 py-6 pb-28 space-y-5">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          A place to belong.
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Say hello to your {state.currentCommunity.name} community.
        </p>
      </div>

      {/* Hero Visual Card (Modern Luxury Villa in Palm Meadows) */}
      <div className="relative rounded-2xl overflow-hidden shadow-md bg-gradient-to-tr from-slate-900 via-slate-800 to-emerald-950 text-white min-h-[170px] flex flex-col justify-end p-5">
        {/* Background Image / Architectural Overlay */}
        <div 
          className="absolute inset-0 opacity-40 bg-cover bg-center"
          style={{
            backgroundImage: `url('/assets/images/community.jpg')`
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

        <div className="relative z-10 space-y-1">
          <div className="text-[10px] uppercase tracking-widest text-emerald-300 font-extrabold">
            Our Little Corner of the World
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">
            {state.currentCommunity.name}
          </h2>
          <p className="text-xs text-slate-300 font-medium">
            {state.currentCommunity.address || 'Whitefield, Bengaluru'}
          </p>
        </div>
      </div>

      {/* Stats Summary Card (320 Homes | 4 Towers | 12 Guards) */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-4">
        <div className="grid grid-cols-3 divide-x divide-slate-100 text-center">
          <div className="flex flex-col items-center justify-center gap-1">
            <Home className="w-5 h-5 text-emerald-600" />
            <div className="text-xl font-black text-slate-900">320</div>
            <div className="text-[11px] text-slate-400 font-medium">Homes</div>
          </div>

          <div className="flex flex-col items-center justify-center gap-1">
            <Building2 className="w-5 h-5 text-emerald-600" />
            <div className="text-xl font-black text-slate-900">4</div>
            <div className="text-[11px] text-slate-400 font-medium">Towers</div>
          </div>

          <div className="flex flex-col items-center justify-center gap-1">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <div className="text-xl font-black text-slate-900">12</div>
            <div className="text-[11px] text-slate-400 font-medium">Guards</div>
          </div>
        </div>
      </div>

      {/* Segmented Control Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setActiveSegment('notices')}
          className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
            activeSegment === 'notices'
              ? 'bg-[#FCEBE6] text-[#E05D44]'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Notice board
        </button>

        <button
          onClick={() => setActiveSegment('directory')}
          className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
            activeSegment === 'directory'
              ? 'bg-[#FCEBE6] text-[#E05D44]'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Security & directory
        </button>
      </div>

      {/* Segment: Notice Board Content */}
      {activeSegment === 'notices' && (
        <div className="space-y-3.5">
          {notices.map((notice) => (
            <div
              key={notice.id}
              className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-[#FDF2EE] text-[#E05D44]">
                  {notice.category.toUpperCase()}
                </span>

                <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                  <Pin className="w-3 h-3 text-slate-400" />
                  <span>31 Oct</span>
                </div>
              </div>

              <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                {notice.title}
              </h3>

              <p className="text-xs text-slate-600 leading-relaxed">
                {notice.content}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Segment: Security & Directory */}
      {activeSegment === 'directory' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 space-y-4">
          <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">
            Society Gate & Emergency Directory
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <div>
                <div className="font-bold text-slate-900">Main North Gate 1 (Visitor & Cabs)</div>
                <div className="text-slate-500 text-[11px]">Active Guard Desk • Intercom #001</div>
              </div>
              <a href="tel:001" className="px-3 py-1 bg-emerald-600 text-white font-bold rounded-lg text-xs">
                Call
              </a>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <div>
                <div className="font-bold text-slate-900">Estate Management Office</div>
                <div className="text-slate-500 text-[11px]">{state.currentCommunity.estate_manager_phone}</div>
              </div>
              <a href={`tel:${state.currentCommunity.estate_manager_phone}`} className="px-3 py-1 bg-slate-800 text-white font-bold rounded-lg text-xs">
                Call
              </a>
            </div>

            <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-100">
              <div>
                <div className="font-bold text-red-900">Police & Medical Emergency</div>
                <div className="text-red-600 text-[11px]">Dial 112 / 108</div>
              </div>
              <a href="tel:112" className="px-3 py-1 bg-red-600 text-white font-bold rounded-lg text-xs">
                SOS
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
