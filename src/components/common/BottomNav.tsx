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
  LayoutGrid, 
  Home, 
  Handshake, 
  Store,
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

  // Resident 5 Bottom Tabs: Social, Homes, Community, Buy & Sell, Stores (Exact Mobile APK & Wireframes)
  if (role === 'resident' || role === 'family_member') {
    const isSocial = pathname === '/resident';
    const isHomes = pathname.startsWith('/resident/homes');
    const isCommunity = pathname.startsWith('/resident/community') || pathname.startsWith('/resident/notices');
    const isMarketplace = pathname.startsWith('/resident/marketplace');
    const isStores = pathname.startsWith('/resident/stores');

    return (
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E7E6E1] shadow-[0_-2px_10px_rgba(0,0,0,0.03)]">
        <div className="grid grid-cols-5 h-16 max-w-lg mx-auto">
          {/* 1. Social */}
          <Link
            href="/resident"
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${
              isSocial ? 'text-[#142E31] font-extrabold' : 'text-[#808683] hover:text-[#142E31] font-medium'
            }`}
          >
            <div className="w-8 h-8 flex items-center justify-center">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <span className="text-[10px] tracking-tight">Social</span>
          </Link>

          {/* 2. Homes */}
          <Link
            href="/resident/homes"
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${
              isHomes ? 'text-[#142E31] font-extrabold' : 'text-[#808683] hover:text-[#142E31] font-medium'
            }`}
          >
            <div className="w-8 h-8 flex items-center justify-center">
              <Home className="w-5 h-5" />
            </div>
            <span className="text-[10px] tracking-tight">Homes</span>
          </Link>

          {/* 3. Community (Central Tab with circle border from Flutter app_shell.dart line 405-412) */}
          <Link
            href="/resident/community"
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${
              isCommunity ? 'text-[#142E31] font-extrabold' : 'text-[#808683] hover:text-[#142E31] font-medium'
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              isCommunity ? 'border-[1.7px] border-[#CEDCB6] bg-[#F4F9F2]' : 'border-[1.7px] border-[#CEDCB6]'
            }`}>
              <Users className="w-4 h-4 text-[#142E31]" />
            </div>
            <span className="text-[10px] tracking-tight">Community</span>
          </Link>

          {/* 4. Buy & Sell */}
          <Link
            href="/resident/marketplace"
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${
              isMarketplace ? 'text-[#142E31] font-extrabold' : 'text-[#808683] hover:text-[#142E31] font-medium'
            }`}
          >
            <div className="w-8 h-8 flex items-center justify-center">
              <Handshake className="w-5 h-5" />
            </div>
            <span className="text-[10px] tracking-tight">Buy & Sell</span>
          </Link>

          {/* 5. Stores */}
          <Link
            href="/resident/stores"
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${
              isStores ? 'text-[#142E31] font-extrabold' : 'text-[#808683] hover:text-[#142E31] font-medium'
            }`}
          >
            <div className="w-8 h-8 flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
            <span className="text-[10px] tracking-tight">Stores</span>
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
