'use client';

import React, { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  Home,
  Clock,
  CheckCircle2,
  XCircle,
  LogIn,
  LogOut,
  Bell,
  Search,
  Filter,
  Plus,
  Truck,
  AlertTriangle,
  QrCode,
  FileText,
  UserCheck,
  Building,
  KeyRound,
  ExternalLink,
  ChevronRight,
  Eye
} from 'lucide-react';

interface Visitor {
  id: string;
  name: string;
  phone: string;
  unit: string;
  residentName: string;
  purpose: 'GUEST' | 'DELIVERY' | 'CAB' | 'HOME_SERVICE' | 'MAINTENANCE';
  vehicleNumber?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CHECKED_IN' | 'CHECKED_OUT';
  verificationCode: string;
  checkInTime?: string;
  checkOutTime?: string;
  createdAt: string;
  rejectionReason?: string;
}

const INITIAL_VISITORS: Visitor[] = [
  {
    id: 'v-001',
    name: 'Deepak Verma',
    phone: '9845011223',
    unit: 'Tower A - 101',
    residentName: 'Ananya Sharma',
    purpose: 'GUEST',
    status: 'PENDING',
    verificationCode: '4192',
    createdAt: 'Just now',
  },
  {
    id: 'v-002',
    name: 'Sunil Kumar (Swiggy)',
    phone: '9812345678',
    unit: 'Tower A - 101',
    residentName: 'Ananya Sharma',
    purpose: 'DELIVERY',
    vehicleNumber: 'KA 05 EZ 8821',
    status: 'APPROVED',
    verificationCode: '8310',
    createdAt: '5 mins ago',
  },
  {
    id: 'v-003',
    name: 'Manoj Sharma (Urban Company AC)',
    phone: '9740112233',
    unit: 'Tower A - 201',
    residentName: 'Suresh Patel',
    purpose: 'HOME_SERVICE',
    vehicleNumber: 'KA 01 HG 3490',
    status: 'CHECKED_IN',
    verificationCode: '1092',
    checkInTime: '45 mins ago',
    createdAt: '50 mins ago',
  },
  {
    id: 'v-004',
    name: 'Rajesh Sen (Uber)',
    phone: '9900112233',
    unit: 'Tower A - 201',
    residentName: 'Suresh Patel',
    purpose: 'CAB',
    vehicleNumber: 'KA 03 AA 4567',
    status: 'CHECKED_OUT',
    verificationCode: '5561',
    checkInTime: '2 hours ago',
    checkOutTime: '1 hour ago',
    createdAt: '2.5 hours ago',
  },
];

const FLATS = [
  { id: 'u1', unit: 'Tower A - 101', resident: 'Ananya Sharma', phone: '7777777777', type: 'Owner' },
  { id: 'u2', unit: 'Tower A - 102', resident: 'Rohit Deshmukh', phone: '7777777778', type: 'Tenant' },
  { id: 'u3', unit: 'Tower A - 201', resident: 'Suresh Patel', phone: '6666666666', type: 'Owner' },
  { id: 'u4', unit: 'Tower A - 202', resident: 'Kavita Menon', phone: '6666666667', type: 'Tenant' },
  { id: 'u5', unit: 'Tower B - 101', resident: 'Arjun Rao', phone: '8888888881', type: 'Owner' },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'gate' | 'history' | 'units' | 'notices'>('gate');
  const [roleView, setRoleView] = useState<'admin' | 'guard' | 'resident'>('guard');
  const [visitors, setVisitors] = useState<Visitor[]>(INITIAL_VISITORS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentTime, setCurrentTime] = useState<string>('');

  // New Visitor Form State (Guard App simulation)
  const [showAddModal, setShowAddModal] = useState(false);
  const [newVisitorName, setNewVisitorName] = useState('');
  const [newVisitorPhone, setNewVisitorPhone] = useState('');
  const [newVisitorUnit, setNewVisitorUnit] = useState(FLATS[0].unit);
  const [newVisitorPurpose, setNewVisitorPurpose] = useState<Visitor['purpose']>('GUEST');
  const [newVisitorVehicle, setNewVisitorVehicle] = useState('');

  // Toast alert
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 1. Guard registers arriving visitor
  const handleRegisterVisitor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVisitorName || !newVisitorPhone) {
      showToast('⚠️ Please enter visitor name and phone number');
      return;
    }

    const selectedFlat = FLATS.find((f) => f.unit === newVisitorUnit);
    const code = Math.floor(1000 + Math.random() * 9000).toString();

    const newEntry: Visitor = {
      id: `v-${Date.now()}`,
      name: newVisitorName,
      phone: newVisitorPhone,
      unit: newVisitorUnit,
      residentName: selectedFlat ? selectedFlat.resident : 'Resident',
      purpose: newVisitorPurpose,
      vehicleNumber: newVisitorVehicle || undefined,
      status: 'PENDING',
      verificationCode: code,
      createdAt: 'Just now',
    };

    setVisitors([newEntry, ...visitors]);
    setShowAddModal(false);
    setNewVisitorName('');
    setNewVisitorPhone('');
    setNewVisitorVehicle('');

    showToast(`🔔 Visitor ${newEntry.name} registered. Notification sent to ${newEntry.residentName}!`);
  };

  // 2. Resident approves visitor
  const handleApprove = (id: string) => {
    setVisitors((prev) =>
      prev.map((v) => (v.id === id ? { ...v, status: 'APPROVED' } : v))
    );
    const v = visitors.find((x) => x.id === id);
    showToast(`✅ Flat resident approved entry for ${v?.name || 'visitor'}. Gate can now check-in.`);
  };

  // 3. Resident rejects visitor
  const handleReject = (id: string) => {
    setVisitors((prev) =>
      prev.map((v) =>
        v.id === id
          ? { ...v, status: 'REJECTED', rejectionReason: 'Declined by resident' }
          : v
      )
    );
    const v = visitors.find((x) => x.id === id);
    showToast(`❌ Visitor ${v?.name || ''} entry was REJECTED by resident.`);
  };

  // 4. Guard checks in visitor
  const handleCheckIn = (id: string) => {
    const v = visitors.find((x) => x.id === id);
    if (!v) return;

    if (v.status === 'PENDING') {
      showToast('⚠️ Cannot check in: Resident approval is still PENDING!');
      return;
    }
    if (v.status === 'REJECTED') {
      showToast('🛑 Access Denied: Resident has REJECTED this visitor!');
      return;
    }

    setVisitors((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status: 'CHECKED_IN', checkInTime: 'Just now' }
          : item
      )
    );
    showToast(`🎉 Visitor ${v.name} checked in at Gate! Entry timestamp recorded.`);
  };

  // 5. Guard checks out visitor
  const handleCheckOut = (id: string) => {
    setVisitors((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status: 'CHECKED_OUT', checkOutTime: 'Just now' }
          : item
      )
    );
    const v = visitors.find((x) => x.id === id);
    showToast(`👋 Visitor ${v?.name || ''} checked out. Departure logged.`);
  };

  // Filtered visitor list
  const filteredVisitors = visitors.filter((v) => {
    const matchesSearch =
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.unit.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.phone.includes(searchQuery);

    if (statusFilter === 'ALL') return matchesSearch;
    return matchesSearch && v.status === statusFilter;
  });

  const pendingCount = visitors.filter((v) => v.status === 'PENDING').length;
  const checkedInCount = visitors.filter((v) => v.status === 'CHECKED_IN').length;
  const approvedCount = visitors.filter((v) => v.status === 'APPROVED').length;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 1000,
            background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
            border: '1px solid #818cf8',
            color: '#ffffff',
            padding: '14px 20px',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontWeight: 500,
            animation: 'fadeIn 0.3s ease',
          }}
        >
          <Bell size={20} color="#a5b4fc" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <header
        style={{
          borderBottom: '1px solid var(--border-subtle)',
          background: 'rgba(9, 13, 22, 0.85)',
          backdropFilter: 'blur(16px)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          padding: '14px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
            }}
          >
            <Shield size={24} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                MyCommunity
              </h1>
              <span
                style={{
                  fontSize: '0.7rem',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  background: 'rgba(99, 102, 241, 0.2)',
                  color: '#a5b4fc',
                  fontWeight: 600,
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                }}
              >
                ₹0 Zero-Cost Architecture
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Palm Meadows Heights (PMH-01) • Bellandur, Bengaluru
            </p>
          </div>
        </div>

        {/* Center: System Status & Time */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              padding: '6px 12px',
              borderRadius: '9999px',
              fontSize: '0.8rem',
              color: '#34d399',
              fontWeight: 600,
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#10b981',
                boxShadow: '0 0 10px #10b981',
              }}
            />
            Main Gate Terminal Active
          </div>

          <div
            style={{
              fontSize: '0.875rem',
              color: 'var(--text-muted)',
              fontFamily: "'JetBrains Mono', monospace",
              background: 'rgba(255, 255, 255, 0.04)',
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle)',
            }}
          >
            {currentTime || '17:30:00'} IST
          </div>
        </div>

        {/* Right: Role Switcher for Interactive Demo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '4px',
              borderRadius: '10px',
              display: 'flex',
              gap: '4px',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <button
              onClick={() => setRoleView('guard')}
              style={{
                background: roleView === 'guard' ? '#6366f1' : 'transparent',
                color: roleView === 'guard' ? '#fff' : 'var(--text-muted)',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '7px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              👮 Guard View
            </button>
            <button
              onClick={() => setRoleView('resident')}
              style={{
                background: roleView === 'resident' ? '#6366f1' : 'transparent',
                color: roleView === 'resident' ? '#fff' : 'var(--text-muted)',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '7px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              📱 Resident View
            </button>
            <button
              onClick={() => setRoleView('admin')}
              style={{
                background: roleView === 'admin' ? '#6366f1' : 'transparent',
                color: roleView === 'admin' ? '#fff' : 'var(--text-muted)',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '7px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              🏢 Admin View
            </button>
          </div>

          <a
            href="http://localhost:4000/api/docs"
            target="_blank"
            rel="noreferrer"
            className="btn btn-outline"
            style={{ fontSize: '0.75rem', padding: '6px 12px', textDecoration: 'none' }}
          >
            <ExternalLink size={14} />
            Swagger API Docs
          </a>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: '1440px', margin: '0 auto', width: '100%', padding: '28px 24px', flex: 1 }}>
        {/* Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '24px',
            borderBottom: '1px solid var(--border-subtle)',
            paddingBottom: '12px',
          }}
        >
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setActiveTab('gate')}
              className="btn"
              style={{
                background: activeTab === 'gate' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                color: activeTab === 'gate' ? '#a5b4fc' : 'var(--text-muted)',
                border: activeTab === 'gate' ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
              }}
            >
              <Shield size={16} />
              Gate Operations (Live)
              {pendingCount > 0 && (
                <span
                  style={{
                    background: '#f59e0b',
                    color: '#000',
                    fontSize: '0.7rem',
                    padding: '1px 6px',
                    borderRadius: '9999px',
                    fontWeight: 700,
                  }}
                >
                  {pendingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className="btn"
              style={{
                background: activeTab === 'history' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                color: activeTab === 'history' ? '#a5b4fc' : 'var(--text-muted)',
                border: activeTab === 'history' ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
              }}
            >
              <Clock size={16} />
              Visitor History & Logs
            </button>

            <button
              onClick={() => setActiveTab('units')}
              className="btn"
              style={{
                background: activeTab === 'units' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                color: activeTab === 'units' ? '#a5b4fc' : 'var(--text-muted)',
                border: activeTab === 'units' ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
              }}
            >
              <Building size={16} />
              Flats & Residents ({FLATS.length})
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={16} />
            Register Visitor at Gate
          </button>
        </div>

        {/* Metrics Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '16px',
            marginBottom: '28px',
          }}
        >
          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Inside Society</span>
              <div
                style={{
                  padding: '8px',
                  borderRadius: '10px',
                  background: 'rgba(6, 182, 212, 0.15)',
                  color: '#38bdf8',
                }}
              >
                <LogIn size={20} />
              </div>
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '8px', color: '#38bdf8' }}>
              {checkedInCount}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Active checked-in visitors</span>
          </div>

          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Pending Approvals</span>
              <div
                style={{
                  padding: '8px',
                  borderRadius: '10px',
                  background: 'rgba(245, 158, 11, 0.15)',
                  color: '#fbbf24',
                }}
              >
                <Clock size={20} />
              </div>
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '8px', color: '#fbbf24' }}>
              {pendingCount}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Waiting for flat resident approval</span>
          </div>

          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Ready for Check-In</span>
              <div
                style={{
                  padding: '8px',
                  borderRadius: '10px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#34d399',
                }}
              >
                <CheckCircle2 size={20} />
              </div>
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '8px', color: '#34d399' }}>
              {approvedCount}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Approved by resident, at gate</span>
          </div>

          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Flats Registered</span>
              <div
                style={{
                  padding: '8px',
                  borderRadius: '10px',
                  background: 'rgba(99, 102, 241, 0.15)',
                  color: '#a5b4fc',
                }}
              >
                <Home size={20} />
              </div>
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '8px', color: '#a5b4fc' }}>
              {FLATS.length}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Tower A & Tower B units</span>
          </div>
        </div>

        {/* Role Helper Banner */}
        <div
          style={{
            background:
              roleView === 'resident'
                ? 'linear-gradient(90deg, rgba(99, 102, 241, 0.15), rgba(168, 85, 247, 0.15))'
                : roleView === 'guard'
                ? 'linear-gradient(90deg, rgba(6, 182, 212, 0.15), rgba(16, 185, 129, 0.15))'
                : 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            padding: '12px 18px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ fontSize: '1.25rem' }}>
              {roleView === 'guard' && '👮'}
              {roleView === 'resident' && '📱'}
              {roleView === 'admin' && '🏢'}
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: '0.875rem' }}>
                {roleView === 'guard' && 'Security Guard Simulation Mode'}
                {roleView === 'resident' && 'Resident Mobile App Simulation Mode (Flat A-101 Ananya Sharma)'}
                {roleView === 'admin' && 'Community Administrator Overview'}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {roleView === 'guard' &&
                  'Register arriving visitors, see live approval statuses from residents, check-in approved guests, and record departures.'}
                {roleView === 'resident' &&
                  'Test real-time visitor alerts: you can Approve or Reject visitors registered for Flat 101 with one click.'}
                {roleView === 'admin' &&
                  'Review complete visitor logs, flats directory, audit trails, and society security settings.'}
              </p>
            </div>
          </div>
        </div>

        {/* Tab 1: Gate Operations (Live Board) */}
        {activeTab === 'gate' && (
          <div>
            {/* Filter Bar */}
            <div
              style={{
                display: 'flex',
                gap: '12px',
                marginBottom: '18px',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', gap: '12px', flex: 1, maxWidth: '480px' }}>
                <div style={{ position: 'relative', width: '100%' }}>
                  <Search
                    size={16}
                    color="var(--text-dim)"
                    style={{ position: 'absolute', left: '12px', top: '12px' }}
                  />
                  <input
                    type="text"
                    placeholder="Search by visitor name, flat number, phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ paddingLeft: '36px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                {['ALL', 'PENDING', 'APPROVED', 'CHECKED_IN', 'CHECKED_OUT', 'REJECTED'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    style={{
                      background: statusFilter === st ? '#6366f1' : 'rgba(255,255,255,0.04)',
                      color: statusFilter === st ? '#fff' : 'var(--text-muted)',
                      border: '1px solid var(--border-subtle)',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Visitors Table */}
            <div className="glass-panel" style={{ overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                  <thead>
                    <tr
                      style={{
                        background: 'rgba(255, 255, 255, 0.02)',
                        borderBottom: '1px solid var(--border-subtle)',
                        color: 'var(--text-muted)',
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      <th style={{ padding: '14px 18px' }}>Visitor Details</th>
                      <th style={{ padding: '14px 18px' }}>Destination Flat</th>
                      <th style={{ padding: '14px 18px' }}>Purpose & Vehicle</th>
                      <th style={{ padding: '14px 18px' }}>Approval Status</th>
                      <th style={{ padding: '14px 18px' }}>Gate Pass Code</th>
                      <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVisitors.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                          No visitor requests found matching the current filters.
                        </td>
                      </tr>
                    ) : (
                      filteredVisitors.map((v) => (
                        <tr
                          key={v.id}
                          style={{
                            borderBottom: '1px solid var(--border-subtle)',
                            transition: 'background 0.15s ease',
                          }}
                        >
                          {/* Visitor Details */}
                          <td style={{ padding: '16px 18px' }}>
                            <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{v.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                              📞 {v.phone} • {v.createdAt}
                            </div>
                          </td>

                          {/* Flat & Resident */}
                          <td style={{ padding: '16px 18px' }}>
                            <div style={{ fontWeight: 600, color: '#a5b4fc' }}>{v.unit}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                              Resident: {v.residentName}
                            </div>
                          </td>

                          {/* Purpose */}
                          <td style={{ padding: '16px 18px' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                              {v.purpose === 'DELIVERY' && <Truck size={14} color="#f59e0b" />}
                              <span style={{ fontWeight: 600 }}>{v.purpose}</span>
                            </div>
                            {v.vehicleNumber && (
                              <div
                                style={{
                                  fontSize: '0.7rem',
                                  color: 'var(--text-muted)',
                                  fontFamily: "'JetBrains Mono', monospace",
                                  marginTop: '2px',
                                }}
                              >
                                🚗 {v.vehicleNumber}
                              </div>
                            )}
                          </td>

                          {/* Status */}
                          <td style={{ padding: '16px 18px' }}>
                            <span className={`badge badge-${v.status.toLowerCase()}`}>
                              {v.status === 'PENDING' && '⏳ Pending Approval'}
                              {v.status === 'APPROVED' && '✅ Approved'}
                              {v.status === 'REJECTED' && '❌ Declined'}
                              {v.status === 'CHECKED_IN' && '🟢 Inside'}
                              {v.status === 'CHECKED_OUT' && '⚪ Departed'}
                            </span>
                            {v.rejectionReason && (
                              <div style={{ fontSize: '0.7rem', color: '#fb7185', marginTop: '4px' }}>
                                Reason: {v.rejectionReason}
                              </div>
                            )}
                          </td>

                          {/* Verification Code */}
                          <td style={{ padding: '16px 18px' }}>
                            <span
                              style={{
                                fontFamily: "'JetBrains Mono', monospace",
                                background: 'rgba(255, 255, 255, 0.05)',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                border: '1px solid var(--border-subtle)',
                                fontWeight: 700,
                                letterSpacing: '0.1em',
                                color: '#38bdf8',
                              }}
                            >
                              {v.verificationCode}
                            </span>
                          </td>

                          {/* Actions */}
                          <td style={{ padding: '16px 18px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                              {/* If PENDING: Resident can Approve or Reject */}
                              {v.status === 'PENDING' && (
                                <>
                                  <button
                                    onClick={() => handleApprove(v.id)}
                                    className="btn btn-success"
                                    style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                                    title="Resident Approve"
                                  >
                                    <CheckCircle2 size={14} />
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleReject(v.id)}
                                    className="btn btn-danger"
                                    style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                                    title="Resident Reject"
                                  >
                                    <XCircle size={14} />
                                    Reject
                                  </button>
                                </>
                              )}

                              {/* If APPROVED: Guard can Check In */}
                              {v.status === 'APPROVED' && (
                                <button
                                  onClick={() => handleCheckIn(v.id)}
                                  className="btn btn-primary"
                                  style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                                >
                                  <LogIn size={14} />
                                  Check In Gate
                                </button>
                              )}

                              {/* If CHECKED_IN: Guard can Check Out */}
                              {v.status === 'CHECKED_IN' && (
                                <button
                                  onClick={() => handleCheckOut(v.id)}
                                  className="btn btn-outline"
                                  style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                                >
                                  <LogOut size={14} />
                                  Check Out
                                </button>
                              )}

                              {/* Completed or Rejected state */}
                              {(v.status === 'CHECKED_OUT' || v.status === 'REJECTED') && (
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Archived</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Visitor History & Audit Trail */}
        {activeTab === 'history' && (
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>
              Historical Audit Trail & Access Logs
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Every visitor entry, resident approval, guard check-in, and check-out is permanently logged with UTC
              timestamps and guard credentials.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {visitors.map((v) => (
                <div
                  key={v.id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    padding: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontWeight: 700 }}>{v.name}</span>
                      <span className={`badge badge-${v.status.toLowerCase()}`}>{v.status}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>ID: {v.id}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Flat: {v.unit} • Resident: {v.residentName} • Purpose: {v.purpose}
                      {v.checkInTime && ` • Checked In: ${v.checkInTime}`}
                      {v.checkOutTime && ` • Checked Out: ${v.checkOutTime}`}
                    </div>
                  </div>
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '0.8rem',
                      color: '#a5b4fc',
                    }}
                  >
                    Pass #{v.verificationCode}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Flats & Residents Directory */}
        {activeTab === 'units' && (
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>
              Community Units & Approved Residents Directory
            </h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '16px',
              }}
            >
              {FLATS.map((f) => (
                <div
                  key={f.id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '12px',
                    padding: '18px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#a5b4fc' }}>{f.unit}</span>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        padding: '3px 8px',
                        borderRadius: '9999px',
                        background: 'rgba(99, 102, 241, 0.2)',
                        color: '#c7d2fe',
                        fontWeight: 600,
                      }}
                    >
                      {f.type}
                    </span>
                  </div>
                  <div style={{ marginTop: '12px', fontSize: '0.875rem' }}>
                    <div style={{ color: 'var(--text-main)', fontWeight: 600 }}>{f.resident}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '2px' }}>
                      📞 {f.phone}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Modal: Guard Registers Arriving Visitor */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '16px',
          }}
        >
          <div
            className="glass-panel"
            style={{
              maxWidth: '480px',
              width: '100%',
              padding: '24px',
              background: '#0f172a',
              border: '1px solid rgba(99, 102, 241, 0.3)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Shield size={20} color="#6366f1" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Register Arriving Visitor</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterVisitor} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Destination Flat / Unit
                </label>
                <select
                  value={newVisitorUnit}
                  onChange={(e) => setNewVisitorUnit(e.target.value)}
                  style={{ width: '100%' }}
                >
                  {FLATS.map((f) => (
                    <option key={f.id} value={f.unit}>
                      {f.unit} — {f.resident}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Visitor Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Swiggy Partner, Amit Verma, Plumber"
                  value={newVisitorName}
                  onChange={(e) => setNewVisitorName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Visitor Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={newVisitorPhone}
                  onChange={(e) => setNewVisitorPhone(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Purpose of Entry
                </label>
                <select
                  value={newVisitorPurpose}
                  onChange={(e) => setNewVisitorPurpose(e.target.value as Visitor['purpose'])}
                >
                  <option value="GUEST">Personal Guest</option>
                  <option value="DELIVERY">Delivery / Parcel</option>
                  <option value="CAB">Cab / Taxi (Uber / Ola)</option>
                  <option value="HOME_SERVICE">Home Service / Technician</option>
                  <option value="MAINTENANCE">Society Maintenance</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Vehicle Registration Number (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. KA 01 AB 1234"
                  value={newVisitorVehicle}
                  onChange={(e) => setNewVisitorVehicle(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-outline"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Notify Resident & Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
