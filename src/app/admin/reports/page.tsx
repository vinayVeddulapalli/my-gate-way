'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { appStore, AppState } from '@/lib/store';
import { 
  ArrowLeft, 
  FileSpreadsheet, 
  Download, 
  Search, 
  Filter, 
  Calendar,
  CheckCircle2,
  Clock,
  Car,
  Package
} from 'lucide-react';
import { StatusBadge } from '@/components/common/StatusBadge';
import { PhotoDisplay } from '@/components/common/PhotoDisplay';
import { getCategoryBadge, getDeliveryCategoryBadge } from '@/lib/utils';
import { DateTimeDisplay, DurationDisplay } from '@/components/common/TimeDisplay';

export default function AdminReportsPage() {
  const [state, setState] = useState<AppState>(appStore.getState());
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [deliveryCategoryFilter, setDeliveryCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [gateFilter, setGateFilter] = useState('all');
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    return appStore.subscribe((s) => setState(s));
  }, []);

  const requests = state.visitorRequests;

  const filtered = requests.filter(r => {
    const matchesSearch = 
      r.visitor_name.toLowerCase().includes(search.toLowerCase()) ||
      r.visitor_phone.includes(search) ||
      (r.flat_number && r.flat_number.includes(search)) ||
      (r.delivery_company && r.delivery_company.toLowerCase().includes(search.toLowerCase())) ||
      (r.parcel_details && r.parcel_details.toLowerCase().includes(search.toLowerCase())) ||
      (r.vehicle_number && r.vehicle_number.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory = categoryFilter === 'all' ? true : r.category === categoryFilter;
    const matchesDeliveryCategory = deliveryCategoryFilter === 'all' 
      ? true 
      : r.delivery_category === deliveryCategoryFilter;
    const matchesStatus = statusFilter === 'all' ? true : r.status === statusFilter;
    const matchesGate = gateFilter === 'all' ? true : r.gate_id === gateFilter;

    return matchesSearch && matchesCategory && matchesDeliveryCategory && matchesStatus && matchesGate;
  });

  const handleExportCSV = () => {
    setIsExporting(true);
    const headers = [
      'ID',
      'Visitor / Agent Name',
      'Phone Number',
      'Category',
      'Delivery Category',
      'Delivery Partner / Company',
      'Destination Block & Flat',
      'Gate Location',
      'Purpose & Items',
      'Parcel Count',
      'Parcel Details / AWB',
      'Vehicle Number',
      'Status',
      'Handover Status',
      'Registration Time',
      'Decision Time',
      'Decided By',
      'Collection Time',
      'Collected By',
      'Check-in Time',
      'Check-out Time'
    ];

    const rows = filtered.map(r => [
      r.id,
      `"${r.visitor_name.replace(/"/g, '""')}"`,
      `"${r.visitor_phone}"`,
      r.category,
      r.delivery_category || 'N/A',
      `"${r.delivery_company || 'N/A'}"`,
      `"${r.block_name || ''} Flat ${r.flat_number || ''}"`,
      `"${r.gate_location || r.gate_name || ''}"`,
      `"${(r.purpose || '').replace(/"/g, '""')}"`,
      r.parcel_count || (r.category === 'delivery' ? 1 : 0),
      `"${(r.parcel_details || '').replace(/"/g, '""')}"`,
      r.vehicle_number || 'N/A',
      r.status,
      r.handover_status || 'N/A',
      r.created_at,
      r.decision_at || '',
      `"${r.decision_by_name || ''}"`,
      r.collected_at || '',
      `"${r.collected_by_name || ''}"`,
      r.check_in_time || '',
      r.check_out_time || ''
    ]);

    const csvString = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Gateway_Visitor_and_Delivery_Logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExporting(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-12 space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-2 rounded-xl shadow-xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Admin Dashboard</span>
        </Link>
        <span className="text-xs font-semibold text-slate-500">Security & Logistics Analytics</span>
      </div>

      <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-sm border border-slate-200/90 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="text-emerald-700 text-xs font-bold uppercase tracking-wider">
            Society Gate Audits & Parcel Analytics
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
            Visitor & Delivery Activity Reports
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Filter, inspect, and export complete visitor & parcel records with entry/exit timestamps, custody status, and resident authorizations.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={isExporting || filtered.length === 0}
          className="flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs touch-press transition-colors cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>{isExporting ? 'Exporting...' : `EXPORT ${filtered.length} RECORDS AS CSV`}</span>
        </button>
      </div>

      {/* Filter Toolbar (Requirement 9) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search visitor, phone, flat, partner, AWB..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden"
          />
        </div>

        {/* Main Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-hidden"
        >
          <option value="all">All Visitor Types</option>
          <option value="delivery">Deliveries</option>
          <option value="guest">Personal Guests</option>
          <option value="cab">Cabs / Taxis</option>
          <option value="service">Services & Techs</option>
          <option value="daily_staff">Daily Staff</option>
        </select>

        {/* Delivery Subcategory Filter */}
        <select
          value={deliveryCategoryFilter}
          onChange={(e) => setDeliveryCategoryFilter(e.target.value)}
          className="px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-hidden"
        >
          <option value="all">All Delivery Categories</option>
          <option value="food">Food Delivery</option>
          <option value="courier">Courier & Logistics</option>
          <option value="grocery">Instant Grocery</option>
          <option value="e_commerce">E-Commerce</option>
          <option value="other">Other Deliveries</option>
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-hidden"
        >
          <option value="all">All Statuses</option>
          <option value="checked_in">Inside (Checked-In)</option>
          <option value="checked_out">Checked-Out</option>
          <option value="approved">Approved</option>
          <option value="leave_at_gate">At Gate (Parcels)</option>
          <option value="collected">Collected Parcels</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
        </select>

        {/* Gate Filter */}
        <select
          value={gateFilter}
          onChange={(e) => setGateFilter(e.target.value)}
          className="px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-hidden"
        >
          <option value="all">All Gates</option>
          {state.gates.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <p className="text-sm">No visitor or delivery records found matching the specified filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="p-4">Visitor / Agent</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Destination</th>
                  <th className="p-4">Purpose / Package</th>
                  <th className="p-4">Status & Handover</th>
                  <th className="p-4">Gate & Timings</th>
                  <th className="p-4">Authorizer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item) => {
                  const catBadge = getCategoryBadge(item.category);
                  const delBadge = item.category === 'delivery' 
                    ? getDeliveryCategoryBadge(item.delivery_category) 
                    : null;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70">
                      <td className="p-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-slate-200 overflow-hidden shrink-0 border border-slate-300">
                            <PhotoDisplay
                              photoPath={item.parcel_photo_path || item.visitor_photo_path}
                              alt={item.visitor_name}
                              type={item.category === 'delivery' ? 'parcel' : 'visitor'}
                              fallbackInitials={item.visitor_name.charAt(0)}
                            />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{item.visitor_name}</div>
                            <div className="text-[11px] font-mono text-slate-500">{item.visitor_phone}</div>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="flex flex-col gap-1 items-start">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${catBadge.bg} ${catBadge.text}`}>
                            {catBadge.label}
                          </span>
                          {delBadge && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${delBadge.bg} ${delBadge.text}`}>
                              {delBadge.label}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="font-bold text-slate-800">{item.block_name}</div>
                        <div className="text-slate-500">Flat {item.flat_number}</div>
                      </td>

                      <td className="p-4 text-slate-700 max-w-[180px]">
                        <div className="font-medium truncate" title={item.purpose}>{item.purpose}</div>
                        {item.delivery_company && (
                          <div className="text-[11px] text-amber-800 font-semibold mt-0.5">
                            Partner: {item.delivery_company}
                          </div>
                        )}
                        {item.parcel_details && (
                          <div className="text-[11px] font-mono text-slate-500 truncate" title={item.parcel_details}>
                            {item.parcel_details}
                          </div>
                        )}
                      </td>

                      <td className="p-4">
                        <StatusBadge status={item.status} size="sm" />
                        {item.status === 'collected' && item.collected_by_name && (
                          <div className="text-[10px] text-teal-700 font-medium mt-1">
                            Collected by: {item.collected_by_name}
                          </div>
                        )}
                      </td>

                      <td className="p-4 text-slate-600" suppressHydrationWarning>
                        <div className="font-semibold text-slate-800">{item.gate_location || item.gate_name}</div>
                        <div className="text-[11px] text-slate-500">Entry: <DateTimeDisplay date={item.created_at} /></div>
                        {item.collected_at && (
                          <div className="text-[11px] text-teal-600">Collected: <DateTimeDisplay date={item.collected_at} /></div>
                        )}
                        {item.check_out_time && (
                          <div className="text-[11px] text-slate-500">Exit: <DateTimeDisplay date={item.check_out_time} /></div>
                        )}
                      </td>

                      <td className="p-4 text-slate-700">
                        <div className="font-medium">{item.decision_by_name || 'Pending'}</div>
                        {item.rejection_reason && (
                          <div className="text-[10px] text-red-600 font-semibold">{item.rejection_reason}</div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
