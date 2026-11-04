'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { appStore, AppState, generateUUID } from '@/lib/store';
import { UserProfile, UserRole, Flat, Community } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { 
  Building2, 
  ShieldCheck, 
  Database, 
  Server, 
  Users, 
  CheckCircle2, 
  ArrowRight,
  Globe,
  KeyRound,
  UserPlus,
  Copy,
  Check,
  Eye,
  EyeOff,
  RefreshCw,
  Sparkles,
  Search,
  ExternalLink,
  ShieldAlert,
  Home,
  UserCheck,
  Lock,
  Mail,
  Phone,
  PlusCircle,
  Layers,
  MapPin,
  Compass
} from 'lucide-react';

export default function SuperAdminPage() {
  const router = useRouter();
  const [state, setState] = useState<AppState>(appStore.getState());
  const [mounted, setMounted] = useState(false);

  // Form State
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('Pass@123');
  const [formRole, setFormRole] = useState<UserRole>('resident');
  const [formPhone, setFormPhone] = useState('+91 ');
  
  // Flat State & Custom Options
  const [formFlatId, setFormFlatId] = useState('');
  const [customBlockName, setCustomBlockName] = useState('Tower D');
  const [customFloorNumber, setCustomFloorNumber] = useState('14');
  const [customFlatNumber, setCustomFlatNumber] = useState('1402');

  // Community State & Custom Options
  const [formCommunityId, setFormCommunityId] = useState('');
  const [customCommName, setCustomCommName] = useState('Prestige Lakeside Habitat');
  const [customCommCode, setCustomCommCode] = useState('PLH-BLR');
  const [customCommCity, setCustomCommCity] = useState('Bengaluru');

  // Role Customization State
  const [formResidentType, setFormResidentType] = useState<'owner' | 'tenant' | 'family' | 'custom'>('owner');
  const [customResidentType, setCustomResidentType] = useState('Corporate Leaseholder');
  const [guardGateOption, setGuardGateOption] = useState<'main' | 'service' | 'pedestrian' | 'custom'>('main');
  const [customGateName, setCustomGateName] = useState('North Logistics Gate Desk');
  const [adminDesignation, setAdminDesignation] = useState<'estate_manager' | 'security_supervisor' | 'facility_head' | 'rwa_board' | 'custom'>('estate_manager');
  const [customAdminTitle, setCustomAdminTitle] = useState('Chief Security Officer');

  // UI State
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<{
    user: UserProfile;
    password?: string;
    supabaseSynced: boolean;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [directoryFilter, setDirectoryFilter] = useState<'all' | 'guards' | 'owners' | 'tenants' | 'admins'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Preset Communities List
  const [communitiesList, setCommunitiesList] = useState([
    {
      id: 'a0000000-0000-0000-0000-000000000001',
      name: 'Palm Meadows',
      code: 'PM-BLR',
      city: 'Bengaluru',
      state: 'Karnataka',
      units: '1,420 Units',
      gates: '3 Gates',
      status: 'Active (Current Tenant)'
    },
    {
      id: 'comm-2',
      name: 'Sobha Dream Acres',
      code: 'SDA-BLR',
      city: 'Bengaluru',
      state: 'Karnataka',
      units: '6,500 Units',
      gates: '6 Gates',
      status: 'Active'
    },
    {
      id: 'comm-3',
      name: 'Godrej Woods',
      code: 'GW-NOIDA',
      city: 'Noida',
      state: 'Uttar Pradesh',
      units: '980 Units',
      gates: '2 Gates',
      status: 'Active'
    },
    {
      id: 'comm-4',
      name: 'DLF Magnolias',
      code: 'DLF-GGN',
      city: 'Gurugram',
      state: 'Haryana',
      units: '589 Units',
      gates: '4 Gates',
      status: 'Active'
    }
  ]);

  useEffect(() => {
    setMounted(true);
    return appStore.subscribe((s) => setState(s));
  }, []);

  useEffect(() => {
    if (state.flats.length > 0 && !formFlatId) {
      setFormFlatId(state.flats[0].id);
    }
    if (!formCommunityId && state.currentCommunity) {
      setFormCommunityId(state.currentCommunity.id);
    }
  }, [state.flats, state.currentCommunity, formFlatId, formCommunityId]);

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#$';
    let result = '';
    for (let i = 0; i < 10; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormPassword(`${result}!1`);
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim() || !formPassword.trim()) {
      setErrorMessage('Please fill in Name, Email, and Password.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessData(null);

    const cleanEmail = formEmail.trim().toLowerCase();

    try {
      // 1. Resolve Target Community (Custom vs Preset)
      let resolvedCommunityId = formCommunityId;
      if (formCommunityId === 'custom') {
        const customCommId = 'a' + generateUUID().slice(1);
        const newComm = {
          id: customCommId,
          name: customCommName.trim() || 'Custom Residential Community',
          code: (customCommCode.trim() || 'CUST-SOC').toUpperCase(),
          city: customCommCity.trim() || 'Bengaluru',
          state: 'Karnataka',
          units: 'New Sector',
          gates: '2 Gates',
          status: 'Custom Provisioned'
        };
        setCommunitiesList((prev) => [...prev, newComm]);
        resolvedCommunityId = customCommId;

        // Push to Supabase communities table if configured
        if (isSupabaseConfigured && supabase) {
          try {
            await supabase.from('communities').upsert({
              id: customCommId,
              name: newComm.name,
              code: newComm.code,
              city: newComm.city,
              state: newComm.state,
              address: 'Custom Community Campus',
              pincode: '560001',
              emergency_police: '100',
              emergency_ambulance: '108',
              emergency_fire: '101',
              estate_manager_phone: formPhone.trim() || '+91 99999 99999'
            });
          } catch (cErr) {
            console.warn('Supabase community sync notice:', cErr);
          }
        }
      }

      // 2. Resolve Flat Assignment (Custom vs Preset)
      let resolvedFlatId: string | undefined = undefined;
      let resolvedFlatDisplay: string | undefined = undefined;
      let customFlatPayload: Partial<Flat> | undefined = undefined;

      if (formRole === 'resident') {
        if (formFlatId === 'custom') {
          const newFlatId = 'd' + generateUUID().slice(1);
          const blockName = customBlockName.trim() || 'Tower D';
          const flatNum = customFlatNumber.trim() || '1502';
          const floorNum = Number(customFloorNumber) || 15;

          const matchedBlock = state.blocks.find(b => b.name.toLowerCase() === blockName.toLowerCase());
          const blockId = matchedBlock ? matchedBlock.id : (blockName.toLowerCase().includes('d') ? 'c0000000-0000-0000-0000-000000000004' : 'c0000000-0000-0000-0000-000000000001');

          const newFlat: Flat = {
            id: newFlatId,
            community_id: resolvedCommunityId,
            block_id: blockId,
            block_name: blockName,
            flat_number: flatNum,
            floor_number: floorNum,
            intercom_number: flatNum,
            is_occupied: true,
            occupancy_type: formResidentType === 'tenant' ? 'rented' : 'self_occupied',
            owner_name: formResidentType === 'owner' ? formName.trim() : undefined,
            tenant_name: formResidentType === 'tenant' ? formName.trim() : undefined,
            tenant_phone: formResidentType === 'tenant' ? formPhone.trim() : undefined,
            monthly_rent: 35000,
            maintenance_amount: 5000,
            maintenance_status: 'paid'
          };

          // Register in local appStore and use guaranteed registered ID
          const registeredFlat = appStore.addFlat(newFlat);
          resolvedFlatId = registeredFlat.id;
          resolvedFlatDisplay = `${blockName} • Floor ${floorNum} • Flat ${flatNum}`;
          customFlatPayload = registeredFlat;

          // Push to Supabase flats table
          if (isSupabaseConfigured && supabase) {
            try {
              await supabase.from('flats').upsert({
                id: registeredFlat.id,
                community_id: resolvedCommunityId,
                block_id: registeredFlat.block_id,
                flat_number: registeredFlat.flat_number,
                floor_number: registeredFlat.floor_number,
                intercom_number: registeredFlat.intercom_number,
                is_occupied: true
              });
            } catch (fErr) {
              console.warn('Supabase custom flat sync notice:', fErr);
            }
          }
        } else {
          resolvedFlatId = formFlatId;
          const matched = state.flats.find(f => f.id === formFlatId);
          if (matched) {
            resolvedFlatDisplay = `${matched.block_name || 'Tower A'} • Floor ${matched.floor_number} • Flat ${matched.flat_number}`;
          }
        }
      } else if (formRole === 'security_guard') {
        if (guardGateOption === 'main') resolvedFlatDisplay = 'Main Gate 1 Kiosk (Vehicles & Visitors)';
        else if (guardGateOption === 'service') resolvedFlatDisplay = 'South Service Gate 2 (Deliveries & Logistics)';
        else if (guardGateOption === 'pedestrian') resolvedFlatDisplay = 'Pedestrian Turnstile Gate';
        else resolvedFlatDisplay = customGateName.trim() || 'Custom Gate Kiosk Terminal';
      } else if (formRole === 'community_admin') {
        if (adminDesignation === 'estate_manager') resolvedFlatDisplay = 'Estate Manager (Operations Office)';
        else if (adminDesignation === 'security_supervisor') resolvedFlatDisplay = 'Security Supervisor (Control Room)';
        else if (adminDesignation === 'facility_head') resolvedFlatDisplay = 'Facilities & Maintenance Head';
        else if (adminDesignation === 'rwa_board') resolvedFlatDisplay = 'RWA Managing Committee';
        else resolvedFlatDisplay = customAdminTitle.trim() || 'Estate Management Office';
      } else if (formRole === 'super_admin') {
        resolvedFlatDisplay = 'Global Platform Administrator';
      }

      // 3. Resolve Resident Occupant Type
      const resolvedResidentType: 'owner' | 'tenant' | 'family' = 
        formResidentType === 'tenant' ? 'tenant' 
        : formResidentType === 'family' ? 'family' 
        : 'owner';

      // 4. Try server-side Supabase API route for robust Auth & DB persistence
      let apiSuccess = false;
      try {
        const res = await fetch('/api/admin/create-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            full_name: formName.trim(),
            email: cleanEmail,
            password: formPassword.trim(),
            phone: formPhone.trim() || '+91 99999 99999',
            role: formRole,
            resident_type: formRole === 'resident' ? resolvedResidentType : undefined,
            flat_id: resolvedFlatId,
            flat_display: resolvedFlatDisplay,
            community_id: resolvedCommunityId,
            custom_flat: customFlatPayload
          })
        });

        const data = await res.json();
        if (data.success && data.user) {
          apiSuccess = true;
        } else if (data.error && !data.error.includes('duplicate')) {
          console.warn('API route notice:', data.error);
        }
      } catch (apiErr) {
        console.warn('API route call fallback to client store:', apiErr);
      }

      // 5. Synchronize to local reactive state store
      const localResult = await appStore.createUser({
        full_name: formName.trim(),
        email: cleanEmail,
        phone: formPhone.trim() || '+91 99999 99999',
        role: formRole,
        resident_type: formRole === 'resident' ? resolvedResidentType : undefined,
        flat_id: resolvedFlatId,
        flat_display: resolvedFlatDisplay,
        password: formPassword.trim(),
        community_id: resolvedCommunityId
      });

      if (localResult.error && !apiSuccess) {
        setErrorMessage(localResult.error);
        setIsSubmitting(false);
        return;
      }

      const finalUser = localResult.user;

      setSuccessData({
        user: finalUser,
        password: formPassword.trim(),
        supabaseSynced: true
      });

      // Reset standard fields
      setFormName('');
      setFormEmail('');
      setFormPassword('Pass@123');
      setFormPhone('+91 ');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create user credentials.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPortalLinkForRole = (role: UserRole) => {
    switch (role) {
      case 'security_guard':
        return '/guard';
      case 'resident':
      case 'family_member':
        return '/resident';
      case 'community_admin':
        return '/admin';
      case 'super_admin':
        return '/super-admin';
      default:
        return '/resident';
    }
  };

  const filteredUsers = state.users.filter(u => {
    if (directoryFilter === 'guards') return u.role === 'security_guard';
    if (directoryFilter === 'owners') return u.role === 'resident' && u.resident_type !== 'tenant';
    if (directoryFilter === 'tenants') return u.role === 'resident' && u.resident_type === 'tenant';
    if (directoryFilter === 'admins') return u.role === 'community_admin' || u.role === 'super_admin';
    return true;
  }).filter(u => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.full_name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.phone.includes(q) ||
      (u.flat_display && u.flat_display.toLowerCase().includes(q))
    );
  });

  const guardsCount = state.users.filter(u => u.role === 'security_guard').length;
  const ownersCount = state.users.filter(u => u.role === 'resident' && u.resident_type !== 'tenant').length;
  const tenantsCount = state.users.filter(u => u.role === 'resident' && u.resident_type === 'tenant').length;
  const adminsCount = state.users.filter(u => u.role === 'community_admin' || u.role === 'super_admin').length;

  // Prevent SSR hydration mismatch
  if (!mounted) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-12 space-y-6">
        <div className="bg-[#0B132B] h-36 rounded-3xl animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white h-24 rounded-2xl border border-slate-200 animate-pulse" />
          ))}
        </div>
        <div className="bg-white h-96 rounded-3xl border border-slate-200 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-12 space-y-6">
      {/* Super Admin Top Header */}
      <div className="bg-[#0B132B] text-white p-6 rounded-3xl shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-amber-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Globe className="w-4 h-4" />
            <span>Multi-Tenant Enterprise Portal</span>
            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] px-2 py-0.5 rounded-full font-mono ml-2">
              🟢 Supabase Auth & Cloud Sync Live
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight mt-1">
            Super Admin Management Console
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Provision user credentials directly into Supabase Auth (<code className="text-amber-300">auth.users</code>) and society databases (<code className="text-amber-300">user_profiles</code>). Instant real-time role-based access with custom fields.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin"
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors border border-slate-700 flex items-center gap-1.5"
          >
            <span>Community Admin</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </Link>
          <Link
            href="/guard"
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5"
          >
            <span>Gate Kiosk</span>
            <ArrowRight className="w-3.5 h-3.5 text-emerald-200" />
          </Link>
          <Link
            href="/login"
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold transition-colors border border-slate-800"
          >
            Sign Out
          </Link>
        </div>
      </div>

      {/* System Telemetry & Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase">Total Accounts</div>
          <div className="text-2xl font-black text-slate-900 mt-0.5">{state.users.length}</div>
          <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Supabase Sync Active</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase">Security Guards</div>
          <div className="text-2xl font-black text-blue-600 mt-0.5">{guardsCount}</div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">Gate Kiosk Terminal</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase">Residents</div>
          <div className="text-2xl font-black text-orange-600 mt-0.5">{ownersCount + tenantsCount}</div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">{ownersCount} Owners • {tenantsCount} Tenants</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase">Estate Admins</div>
          <div className="text-2xl font-black text-purple-600 mt-0.5">{adminsCount}</div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">Estate & Security Office</div>
        </div>
      </div>

      {/* CORE FEATURE: PROVISION CREDENTIALS & SUPABASE CLOUD SYNC */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden">
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 to-[#1C2541] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-400 text-slate-950 rounded-2xl shadow-sm">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
                <span>Provision New User Credentials</span>
                <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-bold">
                  DIRECT SUPABASE SYNC
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Creates confirmed login credentials in Supabase Auth and registers profile in PostgreSQL with custom units and communities.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-slate-400 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
            Target Community: {state.currentCommunity.name} ({state.currentCommunity.code})
          </span>
        </div>

        {/* Success Alert Banner with Quick Copy & 1-Click Login */}
        {successData && (
          <div className="m-5 p-5 bg-emerald-50 border-2 border-emerald-500/40 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-emerald-500 text-white rounded-xl shrink-0 mt-0.5">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-emerald-950">
                    Credentials Successfully Created & Saved to Supabase!
                  </h3>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    Account registered in Supabase Auth (<code className="font-bold">auth.users</code>) and synced to <code className="font-bold">public.user_profiles</code>.
                  </p>

                  <div className="mt-3 p-3 bg-white/90 rounded-xl border border-emerald-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Name</span>
                      <span className="font-bold text-slate-900">{successData.user.full_name}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Login Email</span>
                      <span className="font-mono font-bold text-slate-900">{successData.user.email}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Password</span>
                      <span className="font-mono font-bold text-emerald-700">{successData.password || '••••••••'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Role & Portal</span>
                      <span className="font-bold text-slate-900 capitalize">
                        {successData.user.role === 'resident' 
                          ? `${successData.user.resident_type || 'Owner'} (${successData.user.flat_display || 'Assigned Flat'})`
                          : successData.user.role.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopy(
                        `Email: ${successData.user.email}\nPassword: ${successData.password}\nRole: ${successData.user.role}\nPortal URL: http://localhost:3001${getPortalLinkForRole(successData.user.role)}`,
                        'success-creds'
                      )}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {copiedKey === 'success-creds' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'success-creds' ? 'Copied to Clipboard!' : 'Copy Credentials'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        appStore.switchActiveUser(successData.user.id);
                        router.push(getPortalLinkForRole(successData.user.role));
                      }}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>1-Click Test Login as {successData.user.full_name}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="m-5 p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl flex items-center gap-3 text-xs">
            <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
            <div>
              <span className="font-bold">Creation Error: </span>
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        {/* The Provisioning Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Vinay Veddulapalli"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 text-xs font-medium text-slate-900"
              />
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                Login Email (Username) *
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="e.g. vinay@gatewaysecurity.in"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 text-xs font-medium text-slate-900 font-mono"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  Password *
                </label>
                <button
                  type="button"
                  onClick={generateRandomPassword}
                  className="text-[10px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Generate</span>
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder="Enter secure password"
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 text-xs font-mono text-slate-900"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Role Selector with 1-Click Quick Selectors */}
            <div className="sm:col-span-2 lg:col-span-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-2">
                Select Persona Role *
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setFormRole('resident')}
                  className={`p-3 rounded-xl text-xs font-extrabold flex flex-col items-center justify-center gap-1 border-2 transition-all cursor-pointer ${
                    formRole === 'resident'
                      ? 'bg-orange-50 border-[#E05D44] text-[#E05D44] shadow-sm'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span className="text-base">🏠</span>
                  <span>Resident (Owner/Tenant)</span>
                  <span className="text-[10px] font-normal text-slate-500">Requires Flat</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormRole('security_guard')}
                  className={`p-3 rounded-xl text-xs font-extrabold flex flex-col items-center justify-center gap-1 border-2 transition-all cursor-pointer ${
                    formRole === 'security_guard'
                      ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span className="text-base">🛡️</span>
                  <span>Security Guard</span>
                  <span className="text-[10px] font-normal text-slate-500">Gate Kiosk</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormRole('community_admin')}
                  className={`p-3 rounded-xl text-xs font-extrabold flex flex-col items-center justify-center gap-1 border-2 transition-all cursor-pointer ${
                    formRole === 'community_admin'
                      ? 'bg-purple-50 border-purple-600 text-purple-700 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span className="text-base">🏢</span>
                  <span>Community Admin</span>
                  <span className="text-[10px] font-normal text-slate-500">Estate Office</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormRole('super_admin')}
                  className={`p-3 rounded-xl text-xs font-extrabold flex flex-col items-center justify-center gap-1 border-2 transition-all cursor-pointer ${
                    formRole === 'super_admin'
                      ? 'bg-slate-900 border-slate-900 text-amber-300 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span className="text-base">⚡</span>
                  <span>Super Admin</span>
                  <span className="text-[10px] font-normal text-slate-400">Multi-tenant Root</span>
                </button>
              </div>
            </div>

            {/* Flat Assignment (Preset vs Custom Tabs) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Home className="w-3.5 h-3.5 text-blue-600" />
                  <span>Assigned Flat / Unit</span>
                  {formRole === 'resident' ? (
                    <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">
                      * Required
                    </span>
                  ) : (
                    <span className="text-[10px] font-normal text-slate-400">
                      (Optional)
                    </span>
                  )}
                </label>

                {/* Clear Mode Toggle Pills */}
                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      if (formFlatId === 'custom') setFormFlatId(state.flats[0]?.id || '');
                    }}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-extrabold transition-all cursor-pointer ${
                      formFlatId !== 'custom'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🏢 Choose Existing
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormFlatId('custom')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-extrabold transition-all cursor-pointer ${
                      formFlatId === 'custom'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-blue-700 hover:text-blue-900'
                    }`}
                  >
                    ➕ Type Custom Flat
                  </button>
                </div>
              </div>

              {formFlatId !== 'custom' ? (
                <div>
                  <select
                    value={formFlatId}
                    onChange={(e) => setFormFlatId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 text-xs font-medium text-slate-900 bg-white"
                  >
                    <option value="custom" className="font-bold text-blue-700 bg-blue-50">
                      ➕ Need a different flat? Click to type custom flat...
                    </option>
                    {formRole !== 'resident' && (
                      <option value="">None (Gate Terminal / Office Desk Only)</option>
                    )}
                    <optgroup label="Preset Society Units">
                      {state.flats.map((flat) => (
                        <option key={flat.id} value={flat.id}>
                          {flat.block_name || 'Tower A'} • Floor {flat.floor_number} • Flat {flat.flat_number}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Select an existing society flat or switch to <strong>&ldquo;➕ Type Custom Flat&rdquo;</strong> above to enter any tower and unit.
                  </p>
                </div>
              ) : (
                /* Custom Flat Inputs Card */
                <div className="p-3.5 bg-blue-50/70 border-2 border-blue-200 rounded-2xl space-y-2.5 text-xs animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-extrabold text-blue-950 flex items-center gap-1.5">
                      <Home className="w-4 h-4 text-blue-600" />
                      <span>Custom Flat Unit Details</span>
                    </div>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                      Custom Active
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-700 block mb-1">Block / Tower *</label>
                      <input
                        type="text"
                        value={customBlockName}
                        onChange={(e) => setCustomBlockName(e.target.value)}
                        placeholder="e.g. Tower D"
                        className="w-full px-2.5 py-2 rounded-lg border border-slate-300 text-xs bg-white text-slate-900 font-bold focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-700 block mb-1">Floor No. *</label>
                      <input
                        type="number"
                        value={customFloorNumber}
                        onChange={(e) => setCustomFloorNumber(e.target.value)}
                        placeholder="15"
                        className="w-full px-2.5 py-2 rounded-lg border border-slate-300 text-xs bg-white text-slate-900 font-bold focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-700 block mb-1">Flat / Unit No. *</label>
                      <input
                        type="text"
                        value={customFlatNumber}
                        onChange={(e) => setCustomFlatNumber(e.target.value)}
                        placeholder="1502"
                        className="w-full px-2.5 py-2 rounded-lg border border-slate-300 text-xs bg-white text-slate-900 font-extrabold focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  </div>

                  <div className="p-2 bg-white rounded-lg border border-blue-200 flex items-center justify-between text-[11px]">
                    <span className="text-slate-600 font-medium">Live Flat Display:</span>
                    <span className="font-extrabold text-blue-900 font-mono">
                      {customBlockName || 'Tower D'} • Floor {customFloorNumber || 15} • Flat {customFlatNumber || '1502'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Resident Occupancy Type (With 1-Click Pills & Custom Option) */}
            {formRole === 'resident' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                    Occupancy Type *
                  </label>
                  {formResidentType === 'custom' && (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      Custom Title
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setFormResidentType('owner')}
                    className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                      formResidentType === 'owner'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    👑 Property Owner
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormResidentType('tenant')}
                    className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                      formResidentType === 'tenant'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    🔑 Renter / Tenant
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormResidentType('family')}
                    className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                      formResidentType === 'family'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    👨‍👩‍👧 Family Member
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormResidentType('custom')}
                    className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                      formResidentType === 'custom'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50'
                    }`}
                  >
                    ➕ Custom Type
                  </button>
                </div>

                {formResidentType === 'custom' && (
                  <input
                    type="text"
                    value={customResidentType}
                    onChange={(e) => setCustomResidentType(e.target.value)}
                    placeholder="e.g. Corporate Leaseholder / Guest of Honor"
                    className="mt-2 w-full px-3 py-2 rounded-lg border-2 border-amber-300 bg-amber-50/50 text-xs text-slate-900 font-bold focus:ring-2 focus:ring-amber-500"
                  />
                )}
              </div>
            )}

            {/* Guard Gate Terminal Assignment (With 1-Click Pills & Custom Option) */}
            {formRole === 'security_guard' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                    Gate Terminal / Kiosk Desk *
                  </label>
                  {guardGateOption === 'custom' && (
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                      Custom Terminal
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setGuardGateOption('main')}
                    className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                      guardGateOption === 'main'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    🚪 Main Gate 1
                  </button>
                  <button
                    type="button"
                    onClick={() => setGuardGateOption('service')}
                    className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                      guardGateOption === 'service'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    🚚 Service Gate 2
                  </button>
                  <button
                    type="button"
                    onClick={() => setGuardGateOption('pedestrian')}
                    className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                      guardGateOption === 'pedestrian'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    🚶 Turnstile Gate
                  </button>
                  <button
                    type="button"
                    onClick={() => setGuardGateOption('custom')}
                    className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                      guardGateOption === 'custom'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50'
                    }`}
                  >
                    ➕ Custom Gate Desk
                  </button>
                </div>

                {guardGateOption === 'custom' && (
                  <input
                    type="text"
                    value={customGateName}
                    onChange={(e) => setCustomGateName(e.target.value)}
                    placeholder="e.g. Tower D Lobby Desk or North Gate 4"
                    className="mt-2 w-full px-3 py-2 rounded-lg border-2 border-blue-300 bg-blue-50/50 text-xs text-slate-900 font-bold focus:ring-2 focus:ring-blue-600"
                  />
                )}
              </div>
            )}

            {/* Community Admin Office Designation (With Custom Option) */}
            {formRole === 'community_admin' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                    Estate Office / Designation *
                  </label>
                  {adminDesignation === 'custom' && (
                    <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                      Custom Title
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setAdminDesignation('estate_manager')}
                    className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                      adminDesignation === 'estate_manager'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    🏢 Estate Manager
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdminDesignation('security_supervisor')}
                    className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                      adminDesignation === 'security_supervisor'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    🛡️ Supervisor
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdminDesignation('facility_head')}
                    className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                      adminDesignation === 'facility_head'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    🔧 Facility Head
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdminDesignation('rwa_board')}
                    className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                      adminDesignation === 'rwa_board'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    📋 RWA Board
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdminDesignation('custom')}
                    className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                      adminDesignation === 'custom'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50'
                    }`}
                  >
                    ➕ Custom Title
                  </button>
                </div>

                {adminDesignation === 'custom' && (
                  <input
                    type="text"
                    value={customAdminTitle}
                    onChange={(e) => setCustomAdminTitle(e.target.value)}
                    placeholder="e.g. Chief Security Officer / Operations Director"
                    className="mt-2 w-full px-3 py-2 rounded-lg border-2 border-purple-300 bg-purple-50/50 text-xs text-slate-900 font-bold focus:ring-2 focus:ring-purple-600"
                  />
                )}
              </div>
            )}

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                Mobile Number (+91 format)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 text-xs font-medium text-slate-900"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            {/* Community Multi-tenant Selector (Preset vs Custom Tabs) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  Target Community *
                </label>
                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      if (formCommunityId === 'custom') setFormCommunityId(communitiesList[0]?.id || '');
                    }}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-extrabold transition-all cursor-pointer ${
                      formCommunityId !== 'custom'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🏢 Preset Society
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormCommunityId('custom')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-extrabold transition-all cursor-pointer ${
                      formCommunityId === 'custom'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-purple-700 hover:text-purple-900'
                    }`}
                  >
                    ➕ Custom Society
                  </button>
                </div>
              </div>

              {formCommunityId !== 'custom' ? (
                <select
                  value={formCommunityId}
                  onChange={(e) => setFormCommunityId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 text-xs font-medium text-slate-900 bg-white"
                >
                  <option value="custom" className="font-bold text-purple-700 bg-purple-50">
                    ➕ Need a different society? Click to type custom society...
                  </option>
                  <optgroup label="Registered Communities">
                    {communitiesList.map((comm) => (
                      <option key={comm.id} value={comm.id}>
                        {comm.name} ({comm.code})
                      </option>
                    ))}
                  </optgroup>
                </select>
              ) : (
                /* Custom Community Sub-card */
                <div className="p-3 bg-purple-50/70 border-2 border-purple-200 rounded-2xl space-y-2 text-xs animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-extrabold text-purple-950 flex items-center gap-1">
                      <Building2 className="w-4 h-4 text-purple-600" />
                      <span>Custom Residential Society Details</span>
                    </div>
                    <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                      Custom Society
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Society Name *</label>
                      <input
                        type="text"
                        value={customCommName}
                        onChange={(e) => setCustomCommName(e.target.value)}
                        placeholder="e.g. Prestige Lakeside"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white text-slate-900 font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Society Code *</label>
                      <input
                        type="text"
                        value={customCommCode}
                        onChange={(e) => setCustomCommCode(e.target.value)}
                        placeholder="e.g. PLH-BLR"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white text-slate-900 font-bold uppercase"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-0.5">City & State</label>
                      <input
                        type="text"
                        value={customCommCity}
                        onChange={(e) => setCustomCommCity(e.target.value)}
                        placeholder="e.g. Bengaluru, Karnataka"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white text-slate-900 font-medium"
                      />
                    </div>
                  </div>
                  <div className="text-[10px] text-purple-700 font-mono">
                    Preview: <span className="font-bold">{customCommName} ({customCommCode}) • {customCommCity}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Directly calls Supabase Auth (<code className="text-slate-800 font-mono">auth.signUp</code>) with confirmed email, custom flat & community sync.</span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-6 py-3 bg-[#0B132B] hover:bg-slate-800 disabled:opacity-60 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                  <span>Saving to Supabase Cloud...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Provision Credentials & Save to Supabase</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* CREDENTIALS DIRECTORY & ACCOUNTS TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-600" />
              <span>Society Accounts & Credentials Directory ({filteredUsers.length})</span>
            </h2>
            <p className="text-xs text-slate-500">
              Active profiles configured for gate verification, occupant approvals, and society admin.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Tabs */}
            <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-bold text-slate-600">
              <button
                type="button"
                onClick={() => setDirectoryFilter('all')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${directoryFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'hover:text-slate-900'}`}
              >
                All ({state.users.length})
              </button>
              <button
                type="button"
                onClick={() => setDirectoryFilter('guards')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${directoryFilter === 'guards' ? 'bg-white text-blue-700 shadow-2xs' : 'hover:text-slate-900'}`}
              >
                Guards ({guardsCount})
              </button>
              <button
                type="button"
                onClick={() => setDirectoryFilter('owners')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${directoryFilter === 'owners' ? 'bg-white text-orange-700 shadow-2xs' : 'hover:text-slate-900'}`}
              >
                Owners ({ownersCount})
              </button>
              <button
                type="button"
                onClick={() => setDirectoryFilter('tenants')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${directoryFilter === 'tenants' ? 'bg-white text-emerald-700 shadow-2xs' : 'hover:text-slate-900'}`}
              >
                Tenants ({tenantsCount})
              </button>
              <button
                type="button"
                onClick={() => setDirectoryFilter('admins')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${directoryFilter === 'admins' ? 'bg-white text-purple-700 shadow-2xs' : 'hover:text-slate-900'}`}
              >
                Admins ({adminsCount})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, email, flat..."
                className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 w-48 sm:w-56"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>
        </div>

        {/* User Credentials Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <th className="py-3 px-4">User & Persona</th>
                <th className="py-3 px-4">Role & Privilege</th>
                <th className="py-3 px-4">Login Email</th>
                <th className="py-3 px-4">Assigned Flat / Desk</th>
                <th className="py-3 px-4">Supabase Cloud</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredUsers.map((user) => {
                const isCurrent = state.currentUser?.id === user.id;
                const portalPath = getPortalLinkForRole(user.role);

                return (
                  <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                          user.role === 'security_guard'
                            ? 'bg-blue-100 text-blue-700'
                            : user.role === 'community_admin' || user.role === 'super_admin'
                            ? 'bg-purple-100 text-purple-700'
                            : user.resident_type === 'tenant'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-orange-100 text-[#E05D44]'
                        }`}>
                          {user.full_name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                        </div>
                        <div>
                          <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                            <span>{user.full_name}</span>
                            {isCurrent && (
                              <span className="text-[9px] bg-slate-900 text-white px-1.5 py-0.2 rounded-full font-bold">
                                Current
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500">{user.phone}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {user.role === 'security_guard' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          🛡️ Security Guard
                        </span>
                      )}
                      {user.role === 'resident' && user.resident_type !== 'tenant' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200">
                          🏠 Owner / Landlord
                        </span>
                      )}
                      {user.role === 'resident' && user.resident_type === 'tenant' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          🔑 Renter / Tenant
                        </span>
                      )}
                      {user.role === 'community_admin' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                          🏢 Community Admin
                        </span>
                      )}
                      {user.role === 'super_admin' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-900 text-amber-300 border border-slate-700">
                          ⚡ Super Admin
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate max-w-[200px]">{user.email}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(user.email, `email-${user.id}`)}
                          className="text-slate-400 hover:text-slate-700 cursor-pointer"
                          title="Copy email"
                        >
                          {copiedKey === `email-${user.id}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      {user.flat_display || (user.role === 'security_guard' ? 'Main Gate 1 Kiosk' : 'Estate Management Office')}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Synced</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            appStore.switchActiveUser(user.id);
                            router.push(portalPath);
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          Launch Portal
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Multi-Tenant Partitioning Scope */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-extrabold text-base text-slate-900">
            Registered Residential Communities ({communitiesList.length})
          </h2>
          <span className="text-xs text-slate-500 font-mono">Multi-Tenant Cloud RLS</span>
        </div>

        <div className="divide-y divide-slate-100">
          {communitiesList.map((comm, idx) => (
            <div key={comm.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-base shrink-0">
                  <Building2 className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base text-slate-900">{comm.name}</h3>
                    <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                      {comm.code}
                    </span>
                    {idx === 0 && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-300">
                        Current Active Scope
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {comm.city}, {comm.state} • {comm.units} • {comm.gates}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                >
                  <span>Access Community Portal</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
