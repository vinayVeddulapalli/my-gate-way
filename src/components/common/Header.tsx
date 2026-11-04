'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { appStore, AppState } from '@/lib/store';
import {
  ShieldCheck,
  UserCheck,
  Building2,
  PhoneCall,
  ChevronDown,
  RotateCcw,
  Bot,
  Cloud,
  Bell,
  Search,
  LogOut
} from 'lucide-react';
import { CloudSetupModal } from './CloudSetupModal';
import { FlatSwitcherModal } from './FlatSwitcherModal';

export const Header: React.FC = () => {
  const [state, setState] = useState<AppState>(appStore.getBaselineState());
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isFlatModalOpen, setIsFlatModalOpen] = useState(false);
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);
  const [isCloudModalOpen, setIsCloudModalOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    return appStore.subscribe((newState) => {
      setState(newState);
    });
  }, []);

  const handleRoleSwitch = (userId: string) => {
    appStore.switchActiveUser(userId);
    setIsRoleDropdownOpen(false);

    const user = state.users.find(u => u.id === userId);
    if (!user) return;

    // Navigate to role-specific dashboard
    switch (user.role) {
      case 'security_guard':
        router.push('/guard');
        break;
      case 'resident':
      case 'family_member':
        router.push('/resident');
        break;
      case 'community_admin':
        router.push('/admin');
        break;
      case 'super_admin':
        router.push('/super-admin');
        break;
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'security_guard':
        return 'Security Guard';
      case 'resident':
        return 'Resident / Flat Owner';
      case 'family_member':
        return 'Authorized Family';
      case 'community_admin':
        return 'Community Admin';
      case 'super_admin':
        return 'Super Admin';
      default:
        return role;
    }
  };

    const isResidentRoute = pathname.startsWith('/resident');
  const isGuardRoute = pathname.startsWith('/guard');
  const guardDutyUser = state.users.find(u => u.role === 'security_guard') || state.currentUser;
  const activeHeaderUser = isGuardRoute ? guardDutyUser : state.currentUser;
  let currentFlat = state.flats.find(f => f.id === state.currentUser.flat_id);
  if (state.currentUser.flat_display) {
    const flatFromDisplay = state.flats.find(f => state.currentUser.flat_display?.includes(f.flat_number));
    if (flatFromDisplay && (!currentFlat || currentFlat.flat_number !== flatFromDisplay.flat_number)) {
      currentFlat = flatFromDisplay;
    }
  }
  if (!currentFlat && state.currentUser.flat_display) {
    currentFlat = state.flats.find(f => state.currentUser.flat_display?.includes(f.flat_number));
  }
  if (!currentFlat) {
    if (state.currentUser.role === 'resident' && state.currentUser.flat_display) {
      const parts = state.currentUser.flat_display.split('•').map(s => s.trim());
      const blockName = parts[0] || 'Tower D';
      const floorNum = parseInt(parts[1]?.replace(/\D/g, '') || '1') || 1;
      const flatNum = parts[2]?.replace(/[^\d\w]/g, '').replace('Flat', '').trim() || '1502';
      currentFlat = {
        id: state.currentUser.flat_id || 'custom-flat-1502',
        community_id: state.currentUser.community_id || state.currentCommunity.id,
        block_id: 'c0000000-0000-0000-0000-000000000004',
        block_name: blockName,
        flat_number: flatNum,
        floor_number: floorNum,
        intercom_number: flatNum,
        is_occupied: true,
        occupancy_type: state.currentUser.resident_type === 'tenant' ? 'rented' : 'self_occupied',
        owner_name: state.currentUser.resident_type === 'owner' ? state.currentUser.full_name : undefined,
        tenant_name: state.currentUser.resident_type === 'tenant' ? state.currentUser.full_name : undefined,
        tenant_phone: state.currentUser.resident_type === 'tenant' ? state.currentUser.phone : undefined,
        monthly_rent: 35000,
        maintenance_amount: 5000,
        maintenance_status: 'paid'
      };
    } else {
      currentFlat = state.flats[0];
    }
  }
  const pendingRequestsCount = state.visitorRequests.filter(
    r => r.flat_id === currentFlat?.id && r.status === 'pending'
  ).length;

  const roleDropdownMenu = isRoleDropdownOpen && (
    <div className="absolute right-0 mt-2 w-72 bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
      <div className="px-3 py-2 border-b border-slate-100">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Portal Profile</p>
        <p className="text-xs text-slate-500">Active account and role profiles</p>
      </div>

      <div className="max-h-80 overflow-y-auto py-1 divide-y divide-slate-100 text-xs">
        {/* Security Gate */}
        <div className="px-3 py-1.5 bg-slate-50 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
          Security Gate Terminal
        </div>
        {state.users.filter(u => u.role === 'security_guard').map(user => (
          <button
            key={user.id}
            onClick={() => handleRoleSwitch(user.id)}
            className={`w-full px-3 py-2 text-left flex items-center gap-2.5 hover:bg-slate-50 transition-colors ${state.currentUser.id === user.id ? 'bg-emerald-50/70 text-emerald-900 font-bold' : ''}`}
          >
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
              {user.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'SO'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 truncate">{user.full_name}</span>
                {state.currentUser.id === user.id && <span className="text-[9px] bg-emerald-600 text-white px-1.5 py-0.5 rounded-full font-bold">Active</span>}
              </div>
              <p className="text-[10px] text-slate-500">Security Guard • Gate 1 Kiosk</p>
            </div>
          </button>
        ))}

        {/* Flat Owners / Landlords */}
        <div className="px-3 py-1.5 bg-slate-50 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
          Property Owners (Landlords)
        </div>
        {state.users.filter(u => u.role === 'resident' && u.resident_type === 'owner').map(user => (
          <button
            key={user.id}
            onClick={() => handleRoleSwitch(user.id)}
            className={`w-full px-3 py-2 text-left flex items-center gap-2.5 hover:bg-slate-50 transition-colors ${state.currentUser.id === user.id ? 'bg-orange-50/70 text-[#E05D44] font-bold' : ''}`}
          >
            <div className="w-7 h-7 rounded-full bg-[#FDEEEB] text-[#E05D44] flex items-center justify-center text-[10px] font-bold shrink-0">
              {user.full_name.split(' ').map(n => n[0]).join('').substring(0, 2)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 truncate">{user.full_name}</span>
                {state.currentUser.id === user.id && <span className="text-[9px] bg-[#E05D44] text-white px-1.5 py-0.5 rounded-full font-bold">Active</span>}
              </div>
              <p className="text-[10px] text-slate-500">{user.flat_display || 'Flat Owner'}</p>
            </div>
          </button>
        ))}

        {/* Renters / Tenants */}
        <div className="px-3 py-1.5 bg-slate-50 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
          Renters / Tenants (Occupants)
        </div>
        {state.users.filter(u => u.role === 'resident' && u.resident_type === 'tenant').map(user => (
          <button
            key={user.id}
            onClick={() => handleRoleSwitch(user.id)}
            className={`w-full px-3 py-2 text-left flex items-center gap-2.5 hover:bg-slate-50 transition-colors ${state.currentUser.id === user.id ? 'bg-blue-50/70 text-blue-900 font-bold' : ''}`}
          >
            <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold shrink-0">
              {user.full_name.split(' ').map(n => n[0]).join('').substring(0, 2)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 truncate">{user.full_name}</span>
                {state.currentUser.id === user.id && <span className="text-[9px] bg-blue-600 text-white px-1.5 py-0.5 rounded-full font-bold">Active</span>}
              </div>
              <p className="text-[10px] text-blue-700 font-medium">{user.flat_display || 'Tenant'}</p>
            </div>
          </button>
        ))}

        {/* Administration */}
        <div className="px-3 py-1.5 bg-slate-50 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
          Society Admin
        </div>
        {state.users.filter(u => u.role === 'community_admin' || u.role === 'super_admin').map(user => (
          <button
            key={user.id}
            onClick={() => handleRoleSwitch(user.id)}
            className={`w-full px-3 py-2 text-left flex items-center gap-2.5 hover:bg-slate-50 transition-colors ${state.currentUser.id === user.id ? 'bg-slate-100 text-slate-900 font-bold' : ''}`}
          >
            <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
              {user.role === 'super_admin' ? 'SA' : 'AD'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 truncate">{user.full_name}</span>
                {state.currentUser.id === user.id && <span className="text-[9px] bg-slate-800 text-white px-1.5 py-0.5 rounded-full font-bold">Active</span>}
              </div>
              <p className="text-[10px] text-slate-500">{user.role === 'super_admin' ? 'Super Administrator' : 'Community Admin'}</p>
            </div>
          </button>
        ))}
      </div>
      <div className="p-2 border-t border-slate-100 bg-slate-50/60 space-y-1">
        <Link
          href="/login"
          onClick={() => setIsRoleDropdownOpen(false)}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-800 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer border border-slate-200 bg-white shadow-2xs"
        >
          <LogOut className="w-3.5 h-3.5 text-slate-600" />
          <span>Sign Out / Switch Portal</span>
        </Link>
        <button
          onClick={() => {
            appStore.resetDemoData();
            setIsRoleDropdownOpen(false);
          }}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Clear Test Logs & Reset State</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {isResidentRoute ? (
        /* Wireframe Resident Clean Top Bar (Matching Images 1, 2, 3, 4) */
        <header className="sticky top-0 z-40 bg-[#EDE8E0] border-b border-[#E7E6E1] shadow-2xs">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between h-16">
              {/* Left: Society Dropdown & Multi-Flat Switcher */}
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setIsFlatModalOpen(true)}
                  className="flex items-center gap-1 font-extrabold text-[#142E31] text-base hover:opacity-80 transition-opacity cursor-pointer text-left"
                >
                  <span>{state.currentCommunity.name}</span>
                  <ChevronDown className="w-4 h-4 text-[#808683]" />
                </button>
                <div className="hidden sm:block text-[11px] text-[#808683] font-medium border-l border-[#D6D2CA] pl-2.5">
                  {currentFlat?.occupancy_type === 'rented' 
                    ? `Flat ${currentFlat?.flat_number} · Rented to ${currentFlat?.tenant_name}` 
                    : `Flat ${currentFlat?.flat_number} · Primary Home`}
                </div>
              </div>

              {/* Right: Search, Notification Bell, AS Profile Avatar */}
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Search Icon */}
                <Link
                  href="/resident/passes"
                  className="p-2 text-[#142E31] hover:text-black transition-colors rounded-xl cursor-pointer"
                  title="Search visitor book"
                >
                  <Search className="w-5 h-5" />
                </Link>

                {/* Cloud indicator */}
                <button
                  onClick={() => setIsCloudModalOpen(true)}
                  className="hidden md:flex items-center gap-1 px-2.5 py-1 bg-white/70 hover:bg-white text-[#142E31] rounded-lg text-xs font-semibold border border-[#E7E6E1] transition-colors cursor-pointer"
                  title="Supabase Cloud Realtime Status"
                >
                  <Cloud className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-[10px]">Realtime</span>
                </button>

                {/* Notification Bell with red dot */}
                <Link
                  href="/resident/inbox"
                  className="relative p-2 text-[#142E31] hover:text-black transition-colors rounded-xl cursor-pointer"
                  title="Inbox & Updates"
                >
                  <Bell className="w-5 h-5" />
                  {pendingRequestsCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#EF5B75] ring-2 ring-[#EDE8E0]" />
                  )}
                </Link>

                {/* Profile Avatar A (Circle in #985D5E with white text A) */}
                <div className="relative">
                  <button
                    onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                    className="w-9 h-9 rounded-full bg-[#985D5E] text-white font-extrabold text-xs flex items-center justify-center hover:opacity-90 transition-opacity cursor-pointer shadow-2xs"
                    title="Switch Persona or Role"
                  >
                    A
                  </button>

                  {roleDropdownMenu}
                </div>
              </div>
            </div>
          </div>
        </header>
      ) : (
        /* Standard Navigation Header for Guard, Admin, SuperAdmin, Landing */
        <header className="sticky top-0 z-40 bg-[#0B132B] text-white border-b border-slate-800 shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Brand Logo & Community */}
              <div className="flex items-center gap-3">
                <Link href="/" className="flex items-center gap-2.5 group">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-900/30 group-hover:scale-105 transition-transform">
                    <ShieldCheck className="w-6 h-6 text-white" />
                  </div>
                  <div className="hidden sm:block">
                    <div className="text-base font-extrabold tracking-tight text-white flex items-center gap-1.5">
                      GATEWAY SECURITY
                    </div>
                    <div className="text-xs text-slate-400 font-medium">Apartment Visitor Management</div>
                  </div>
                </Link>

                {/* Community badge */}
                <div className="hidden md:flex items-center gap-2 ml-4 px-3 py-1 bg-slate-800/80 rounded-lg border border-slate-700/60 text-xs">
                  <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-medium text-slate-200">{state.currentCommunity.name}</span>
                  <span className="text-slate-400 font-mono">({state.currentCommunity.code})</span>
                </div>
              </div>

              {/* Navigation Links (Desktop) */}
              <nav className="hidden lg:flex items-center gap-1">
                <Link
                  href="/guard"
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${pathname.startsWith('/guard')
                      ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                    }`}
                >
                  Gate Terminal
                </Link>
                <Link
                  href="/resident"
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${pathname.startsWith('/resident')
                      ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                    }`}
                >
                  Resident App
                </Link>
                <Link
                  href="/admin"
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${pathname.startsWith('/admin')
                      ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                    }`}
                >
                  Community Admin
                </Link>
                <Link
                  href="/login"
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors text-slate-400 hover:text-white hover:bg-slate-800/50 flex items-center gap-1.5 ${
                    pathname === '/login' ? 'bg-slate-800 text-white border border-slate-700' : ''
                  }`}
                  title="Switch between Resident, Guard, and Admin portals"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Switch Portal</span>
                </Link>
              </nav>

              {/* Right Action Tools: Emergency & Role Switcher */}
              <div className="flex items-center gap-2 sm:gap-3">

                {/* Supabase Cloud Live Status Pill */}
                <button
                  onClick={() => setIsCloudModalOpen(true)}
                  title="Cloud Database & Realtime Status. Click to configure Supabase for multi-phone testing"
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${state.connectionStatus === 'connected'
                      ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/50 hover:bg-emerald-900/80 shadow-xs shadow-emerald-950'
                      : state.connectionStatus === 'connecting'
                        ? 'bg-amber-950/70 text-amber-300 border-amber-500/50 hover:bg-amber-900/80'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                    }`}
                >
                  <div className="relative flex items-center justify-center">
                    <Cloud className="w-3.5 h-3.5" />
                    <span className={`absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full ${state.connectionStatus === 'connected'
                        ? 'bg-emerald-400 animate-ping'
                        : state.connectionStatus === 'connecting'
                          ? 'bg-amber-400 animate-pulse'
                          : 'bg-slate-400'
                      }`} />
                  </div>
                  <span className="hidden sm:inline">
                    {state.connectionStatus === 'connected'
                      ? 'Cloud Realtime'
                      : state.connectionStatus === 'connecting'
                        ? 'Connecting...'
                        : 'Cloud Setup'}
                  </span>
                </button>

                {/* Emergency hotline button */}
                <button
                  onClick={() => setIsEmergencyOpen(!isEmergencyOpen)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold bg-red-600/90 hover:bg-red-600 text-white rounded-lg shadow-sm transition-colors cursor-pointer"
                  title="Emergency Contacts"
                >
                  <PhoneCall className="w-3.5 h-3.5 animate-pulse" />
                  <span className="hidden sm:inline">SOS Emergency</span>
                </button>

                {/* Role Switcher Pill */}
                <div className="relative">
                  <button
                    onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-left transition-colors cursor-pointer"
                  >
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold" suppressHydrationWarning>
                      {activeHeaderUser.full_name.charAt(0)}
                    </div>
                    <div className="hidden md:block" suppressHydrationWarning>
                      <div className="text-xs font-bold text-white leading-tight truncate max-w-[120px]">
                        {activeHeaderUser.full_name}
                      </div>
                      <div className="text-[10px] text-emerald-400 font-medium leading-tight">
                        {getRoleDisplayName(activeHeaderUser.role)}
                      </div>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {roleDropdownMenu}
                </div>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Emergency Drawer / Modal */}
      {isEmergencyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white text-slate-900 rounded-2xl shadow-2xl border border-red-200 overflow-hidden">
            <div className="bg-red-600 p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PhoneCall className="w-5 h-5 animate-bounce" />
                <h3 className="font-bold text-base">Emergency Contacts</h3>
              </div>
              <button
                onClick={() => setIsEmergencyOpen(false)}
                className="text-white/80 hover:text-white text-sm font-bold px-2 py-1 rounded cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="p-4 space-y-3">
              <a
                href={`tel:${state.currentCommunity.emergency_police}`}
                className="flex items-center justify-between p-3 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-colors"
              >
                <div>
                  <div className="text-xs font-semibold text-red-600 uppercase">Police Emergency</div>
                  <div className="text-base font-bold text-slate-900">{state.currentCommunity.emergency_police}</div>
                </div>
                <div className="p-2 bg-red-600 text-white rounded-lg">Call</div>
              </a>

              <a
                href={`tel:${state.currentCommunity.emergency_ambulance}`}
                className="flex items-center justify-between p-3 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-colors"
              >
                <div>
                  <div className="text-xs font-semibold text-red-600 uppercase">Medical Ambulance</div>
                  <div className="text-base font-bold text-slate-900">{state.currentCommunity.emergency_ambulance}</div>
                </div>
                <div className="p-2 bg-red-600 text-white rounded-lg">Call</div>
              </a>

              <a
                href={`tel:${state.currentCommunity.estate_manager_phone}`}
                className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
              >
                <div>
                  <div className="text-xs font-semibold text-slate-600 uppercase">Estate Manager / Security Office</div>
                  <div className="text-base font-bold text-slate-900">{state.currentCommunity.estate_manager_phone}</div>
                </div>
                <div className="p-2 bg-slate-800 text-white rounded-lg">Call</div>
              </a>
            </div>
            <div className="bg-slate-50 px-4 py-3 text-center border-t border-slate-100">
              <p className="text-xs text-slate-500">Security Gate Intercom: #000 or #999</p>
            </div>
          </div>
        </div>
      )}

      {/* Cloud & Realtime Setup Modal */}
      <CloudSetupModal
        isOpen={isCloudModalOpen}
        onClose={() => setIsCloudModalOpen(false)}
      />

      {/* Multi-Flat Portfolio Switcher Modal */}
      <FlatSwitcherModal
        isOpen={isFlatModalOpen}
        onClose={() => setIsFlatModalOpen(false)}
      />
    </>
  );
};
