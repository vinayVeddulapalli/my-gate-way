'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { appStore, AppState } from '@/lib/store';
import { 
  Users, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Building, 
  FileSpreadsheet, 
  ShieldCheck, 
  ShieldAlert, 
  Download, 
  TrendingUp, 
  ArrowUpRight,
  UserCheck,
  Building2,
  Calendar,
  Bell,
  LogOut,
  Ban
} from 'lucide-react';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ActiveSosBanner } from '@/components/common/ActiveSosBanner';
import { getCategoryBadge } from '@/lib/utils';
import { TimeAgo } from '@/components/common/TimeDisplay';

export default function AdminDashboardPage() {
  const [state, setState] = useState<AppState>(appStore.getState());
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    return appStore.subscribe((s) => setState(s));
  }, []);

  const requests = state.visitorRequests;
  const insideCount = requests.filter(r => r.status === 'checked_in').length;
  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const approvedCount = requests.filter(r => r.status === 'approved' || r.status === 'checked_in' || r.status === 'checked_out').length;
  const rejectedCount = requests.filter(r => r.status === 'rejected').length;

  // Category breakdown
  const categoryCounts = {
    delivery: requests.filter(r => r.category === 'delivery').length,
    guest: requests.filter(r => r.category === 'guest').length,
    cab: requests.filter(r => r.category === 'cab').length,
    service: requests.filter(r => r.category === 'service').length
  };

  const handleDownloadCSV = () => {
    setIsExporting(true);
    const csvContent = appStore.exportVisitorsCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Gateway_Visitor_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExporting(false);
  };

  // Role Access Guard: Only Community Admins & Superadmins can access the Admin Dashboard
  if (state.currentUser.role !== 'community_admin' && state.currentUser.role !== 'super_admin') {
    return (
      <div className="max-w-md mx-auto my-16 px-4">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
            <ShieldAlert className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Admin Office Access Restricted</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            You are currently signed in as <strong className="text-slate-900">{state.currentUser.full_name}</strong> ({state.currentUser.role.replace('_', ' ')}). 
            Society governance ledgers, audit trails, and staff roster are restricted to Community Administrators.
          </p>
          <div className="pt-2 flex flex-col gap-2.5">
            <Link
              href={state.currentUser.role === 'security_guard' ? '/guard' : '/resident'}
              className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
            >
              Go to My Authorized Dashboard ({state.currentUser.role === 'security_guard' ? 'Guard Terminal' : 'Resident App'})
            </Link>
            <Link
              href="/login?tab=admin"
              className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors"
            >
              Sign In with Admin Credentials
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-12 space-y-6">
      {/* Real-time Emergency SOS Alert Banner */}
      <ActiveSosBanner alerts={state.sosAlerts || []} />

      {/* Top Banner (Clean Wireframe Style) */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-sm border border-slate-200/90 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold uppercase tracking-wider">
            <Building2 className="w-4 h-4" />
            <span>Community Admin Terminal • {state.currentCommunity.name}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
            Community Security Operations
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Estate Manager: <strong className="text-slate-800 font-bold">{state.currentUser.full_name}</strong> • Gate Access & Tenant Isolation Active
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/login?tab=admin"
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-200 transition-colors cursor-pointer"
            title="Sign out of Admin Console and return to Unified Portal Login"
          >
            <LogOut className="w-3.5 h-3.5 text-slate-600" />
            <span>Switch Portal</span>
          </Link>
          <button
            onClick={handleDownloadCSV}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs touch-press transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'Generating...' : 'EXPORT CSV REPORT'}</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Visitors Today</span>
            <div className="p-2 bg-slate-100 rounded-lg text-slate-700">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900">{requests.length}</div>
          <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>100% Verified Entry Requests</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-xs border border-blue-200 space-y-2">
          <div className="flex items-center justify-between text-blue-600">
            <span className="text-xs font-bold uppercase tracking-wider">Currently Inside</span>
            <div className="p-2 bg-blue-50 rounded-lg">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-blue-900">{insideCount}</div>
          <div className="text-[11px] text-blue-700 font-medium">
            Active within blocks
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-xs border border-amber-200 space-y-2">
          <div className="flex items-center justify-between text-amber-600">
            <span className="text-xs font-bold uppercase tracking-wider">Pending Approvals</span>
            <div className="p-2 bg-amber-50 rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-600">{pendingCount}</div>
          <div className="text-[11px] text-slate-500 font-medium">
            Avg. response: ~1.2 mins
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-xs border border-red-200 space-y-2">
          <div className="flex items-center justify-between text-red-600">
            <span className="text-xs font-bold uppercase tracking-wider">Rejected Requests</span>
            <div className="p-2 bg-red-50 rounded-lg">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-red-700">{rejectedCount}</div>
          <div className="text-[11px] text-red-600 font-medium">
            Access strictly denied
          </div>
        </div>
      </div>

      {/* Category Breakdown & Quick Navigation Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Breakdown Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
          <h2 className="font-extrabold text-base text-slate-900">
            Visitor Breakdown by Purpose
          </h2>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-amber-800">Deliveries (Food / Ecommerce)</span>
                <span>{categoryCounts.delivery} ({Math.round((categoryCounts.delivery / (requests.length || 1)) * 100)}%)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-amber-500 h-2.5 rounded-full"
                  style={{ width: `${(categoryCounts.delivery / (requests.length || 1)) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-emerald-800">Personal Guests</span>
                <span>{categoryCounts.guest} ({Math.round((categoryCounts.guest / (requests.length || 1)) * 100)}%)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-emerald-500 h-2.5 rounded-full"
                  style={{ width: `${(categoryCounts.guest / (requests.length || 1)) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-sky-800">Cabs & Taxis</span>
                <span>{categoryCounts.cab} ({Math.round((categoryCounts.cab / (requests.length || 1)) * 100)}%)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-sky-500 h-2.5 rounded-full"
                  style={{ width: `${(categoryCounts.cab / (requests.length || 1)) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-purple-800">Home Services / Repairs</span>
                <span>{categoryCounts.service} ({Math.round((categoryCounts.service / (requests.length || 1)) * 100)}%)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-purple-500 h-2.5 rounded-full"
                  style={{ width: `${(categoryCounts.service / (requests.length || 1)) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Administration Links Hub */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/admin/flats"
            className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-500 hover:shadow-md transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="p-2.5 bg-slate-100 group-hover:bg-emerald-50 text-slate-800 group-hover:text-emerald-700 rounded-xl w-fit mb-3 transition-colors">
                <Building className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900 group-hover:text-emerald-800">
                Flats & Blocks Directory
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Manage {state.blocks.length} towers, {state.flats.length} flats, resident ownerships, and intercoms.
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 mt-3">
              <span>View Flats</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </Link>

          <Link
            href="/admin/staff"
            className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-500 hover:shadow-md transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="p-2.5 bg-slate-100 group-hover:bg-emerald-50 text-slate-800 group-hover:text-emerald-700 rounded-xl w-fit mb-3 transition-colors">
                <UserCheck className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900 group-hover:text-emerald-800">
                Guards & Gate Terminal Staff
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Manage guard accounts, shift deployments across {state.gates.length} gates, and access privileges.
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 mt-3">
              <span>Manage Staff</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </Link>

          <Link
            href="/admin/daily-help"
            className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-500 hover:shadow-md transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="p-2.5 bg-purple-50 text-purple-700 rounded-xl w-fit mb-3 transition-colors">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900 group-hover:text-purple-800">
                Daily Help & Service Registry
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Manage {state.dailyHelpers?.length || 0} domestic staff (Maids, Drivers, Cooks) and gate check-in logs.
              </p>
            </div>
            <span className="text-xs font-bold text-purple-600 flex items-center gap-1 mt-3">
              <span>Daily Staff Directory</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </Link>

          <Link
            href="/admin/reports"
            className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-500 hover:shadow-md transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="p-2.5 bg-slate-100 group-hover:bg-emerald-50 text-slate-800 group-hover:text-emerald-700 rounded-xl w-fit mb-3 transition-colors">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900 group-hover:text-emerald-800">
                Visitor Reports & CSV Export
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Export filterable visitor logs, check-in durations, vehicle numbers, and audit entries.
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 mt-3">
              <span>Generate Reports</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </Link>

          <Link
            href="/admin/audit"
            className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-500 hover:shadow-md transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="p-2.5 bg-slate-100 group-hover:bg-emerald-50 text-slate-800 group-hover:text-emerald-700 rounded-xl w-fit mb-3 transition-colors">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900 group-hover:text-emerald-800">
                Security Audit & Retention
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Review immutable audit logs, set DPDP retention limits (90 days), and update community branding.
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 mt-3">
              <span>Audit Controls</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </Link>

          <Link
            href="/admin/notices"
            className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-500 hover:shadow-md transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="p-2.5 bg-amber-50 text-amber-700 rounded-xl w-fit mb-3 transition-colors">
                <Bell className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900 group-hover:text-amber-800">
                Society Notices & Circulars
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Publish and manage {state.notices?.length || 0} announcements (maintenance, festivals, general alerts).
              </p>
            </div>
            <span className="text-xs font-bold text-amber-600 flex items-center gap-1 mt-3">
              <span>Notice Board</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </Link>

          <Link
            href="/admin/blacklist"
            className="p-5 bg-white rounded-2xl border border-rose-200/80 shadow-xs hover:border-rose-500 hover:shadow-md transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="p-2.5 bg-rose-50 text-rose-700 rounded-xl w-fit mb-3 transition-colors">
                <Ban className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900 group-hover:text-rose-800">
                Visitor Blacklist & Security Bans
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Maintain {state.blacklist?.length || 0} banned profiles with instant gate-level entry interception and alerts.
              </p>
            </div>
            <span className="text-xs font-bold text-rose-600 flex items-center gap-1 mt-3">
              <span>Manage Blacklist</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </Link>
        </div>
      </div>

      {/* Live Visitor Feed Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-extrabold text-base text-slate-900">
            Recent Gate Activity (Today)
          </h2>
          <Link href="/admin/reports" className="text-xs font-bold text-emerald-600 hover:text-emerald-700">
            View All →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="p-4">Visitor</th>
                <th className="p-4">Category</th>
                <th className="p-4">Destination Flat</th>
                <th className="p-4">Status</th>
                <th className="p-4">Time</th>
                <th className="p-4">Gate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.slice(0, 5).map((req) => (
                <tr key={req.id} className="hover:bg-slate-50/70">
                  <td className="p-4">
                    <div className="font-bold text-slate-900">{req.visitor_name}</div>
                    <div className="text-slate-500 font-mono text-[11px]">{req.visitor_phone}</div>
                  </td>
                  <td className="p-4 capitalize">{req.category}</td>
                  <td className="p-4 font-semibold text-slate-800">
                    {req.block_name} • Flat {req.flat_number}
                  </td>
                  <td className="p-4">
                    <StatusBadge status={req.status} size="sm" />
                  </td>
                  <td className="p-4 text-slate-500" suppressHydrationWarning>
                    <TimeAgo date={req.created_at} />
                  </td>
                  <td className="p-4 text-slate-600">{req.gate_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
