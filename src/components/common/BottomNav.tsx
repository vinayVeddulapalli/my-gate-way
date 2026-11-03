'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { appStore, AppState } from '@/lib/store';
import { 
  ShieldCheck, 
  UserPlus, 
  Users, 
  History, 
  Home, 
  QrCode,
  Bell,
  Building2,
  LayoutDashboard,
  Building,
  FileSpreadsheet
} from 'lucide-react';

export const BottomNav: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const [state, setState] = useState<AppState>(appStore.getBaselineState());
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    return appStore.subscribe((s) => setState(s));
  }, []);

  if (!mounted) {
    return null;
  }

  const role = state.currentUser.role;
  const insideCount = state.visitorRequests.filter(r => r.status === 'checked_in').length;

  if (role === 'security_guard') {
    return (
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E7E6E1] text-[#808683] shadow-lg">
        <div className="grid grid-cols-4 h-16">
          <Link
            href="/guard"
            className={`flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors ${
              pathname === '/guard' ? 'text-[#142E31] font-extrabold' : 'hover:text-[#142E31]'
            }`}
          >
            <ShieldCheck className="w-5 h-5" />
            <span>Gate</span>
          </Link>
          <Link
            href="/guard/register"
            className={`flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors ${
              pathname === '/guard/register' ? 'text-[#142E31] font-extrabold' : 'hover:text-[#142E31]'
            }`}
          >
            <UserPlus className="w-5 h-5" />
            <span>New Visitor</span>
          </Link>
          <Link
            href="/guard#active-inside"
            className={`flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors hover:text-[#142E31]`}
          >
            <div className="relative">
              <Users className="w-5 h-5" />
              {insideCount > 0 && (
                <span className="absolute -top-1 -right-2 bg-emerald-600 text-white text-[9px] font-extrabold px-1 rounded-full" suppressHydrationWarning>
                  {insideCount}
                </span>
              )}
            </div>
            <span>Inside</span>
          </Link>
          <Link
            href="/guard#visitor-history"
            className={`flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors hover:text-[#142E31]`}
          >
            <History className="w-5 h-5" />
            <span>History</span>
          </Link>
        </div>
      </nav>
    );
  }

  // Resident Phase 1 MVP 5 Bottom Tabs: Home, Passes, Helpers, Notices, Flats & Settings
  if (role === 'resident' || role === 'family_member') {
    const isHome = pathname === '/resident';
    const isPasses = pathname.startsWith('/resident/passes');
    const isHelpers = pathname.startsWith('/resident/helpers');
    const isNotices = pathname.startsWith('/resident/notices') || pathname.startsWith('/resident/community');
    const isSettings = pathname.startsWith('/resident/settings') || pathname.startsWith('/resident/homes');

    return (
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E7E6E1] shadow-[0_-2px_10px_rgba(0,0,0,0.03)]">
        <div className="grid grid-cols-5 h-16 max-w-lg mx-auto">
          {/* 1. Home / Gate Status */}
          <Link
            href="/resident"
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${
              isHome ? 'text-[#E05D44] font-extrabold' : 'text-[#808683] hover:text-[#142E31] font-medium'
            }`}
          >
            <div className="w-8 h-8 flex items-center justify-center">
              <Home className="w-5 h-5" />
            </div>
            <span className="text-[10px] tracking-tight">Home</span>
          </Link>

          {/* 2. Guest Passes */}
          <Link
            href="/resident/passes"
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${
              isPasses ? 'text-[#E05D44] font-extrabold' : 'text-[#808683] hover:text-[#142E31] font-medium'
            }`}
          >
            <div className="w-8 h-8 flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <span className="text-[10px] tracking-tight">Passes</span>
          </Link>

          {/* 3. Daily Help (Maids, Drivers) */}
          <Link
            href="/resident/helpers"
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${
              isHelpers ? 'text-[#E05D44] font-extrabold' : 'text-[#808683] hover:text-[#142E31] font-medium'
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              isHelpers ? 'border-[1.7px] border-emerald-400 bg-emerald-50 text-emerald-800' : 'border-[1.7px] border-[#CEDCB6] text-[#142E31]'
            }`}>
              <Users className="w-4 h-4" />
            </div>
            <span className="text-[10px] tracking-tight">Help</span>
          </Link>

          {/* 4. Notices & Community */}
          <Link
            href="/resident/notices"
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${
              isNotices ? 'text-[#E05D44] font-extrabold' : 'text-[#808683] hover:text-[#142E31] font-medium'
            }`}
          >
            <div className="w-8 h-8 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <span className="text-[10px] tracking-tight">Notices</span>
          </Link>

          {/* 5. Flats & Settings */}
          <Link
            href="/resident/settings"
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${
              isSettings ? 'text-[#E05D44] font-extrabold' : 'text-[#808683] hover:text-[#142E31] font-medium'
            }`}
          >
            <div className="w-8 h-8 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="text-[10px] tracking-tight">Flats</span>
          </Link>
        </div>
      </nav>
    );
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E7E6E1] text-[#808683] shadow-lg">
      <div className="grid grid-cols-3 h-16">
        <Link
          href="/admin"
          className={`flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors ${
            pathname === '/admin' ? 'text-emerald-700 font-extrabold' : 'hover:text-[#142E31]'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>Dashboard</span>
        </Link>
        <Link
          href="/admin/flats"
          className={`flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors ${
            pathname === '/admin/flats' ? 'text-emerald-700 font-extrabold' : 'hover:text-[#142E31]'
          }`}
        >
          <Building className="w-5 h-5" />
          <span>Flats</span>
        </Link>
        <Link
          href="/admin/reports"
          className={`flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors ${
            pathname === '/admin/reports' ? 'text-emerald-700 font-extrabold' : 'hover:text-[#142E31]'
          }`}
        >
          <FileSpreadsheet className="w-5 h-5" />
          <span>Reports</span>
        </Link>
      </div>
    </nav>
  );
};
