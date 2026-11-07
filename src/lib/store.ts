// Gateway Security: Reactive Multi-Role State Engine with Supabase Realtime Sync
import { 
  Community, 
  Gate, 
  BuildingBlock, 
  Flat, 
  UserProfile, 
  VisitorRequest, 
  GuestPass, 
  AuditLog, 
  VisitorStatus,
  DeliveryCategory,
  DailyHelper,
  DailyHelpLog,
  Notice,
  SosAlert,
  SosType,
  SosStatus,
  isValidStatusTransition,
  BlacklistEntry,
  UserRole
} from '@/types';
import { soundNotifier } from './audio';
import { supabase, isSupabaseConfigured, createIsolatedAuthClient } from './supabase';

export interface AppState {
  currentCommunity: Community;
  gates: Gate[];
  blocks: BuildingBlock[];
  flats: Flat[];
  users: UserProfile[];
  currentUser: UserProfile;
  visitorRequests: VisitorRequest[];
  guestPasses: GuestPass[];
  auditLogs: AuditLog[];
  dailyHelpers: DailyHelper[];
  dailyHelpLogs: DailyHelpLog[];
  notices: Notice[];
  sosAlerts: SosAlert[];
  blacklist: BlacklistEntry[];
  autoSimulateResident: boolean;
  connectionStatus: 'local' | 'connecting' | 'connected' | 'error';
}

const STORAGE_KEY = 'gateway_security_store_v3';
const BROADCAST_CHANNEL = 'gateway_security_sync';

// UUID Generator compatible with PostgreSQL UUID columns
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Default Seed Data (Palm Meadows, Whitefield, Bengaluru)
const defaultCommunity: Community = {
  id: 'a0000000-0000-0000-0000-000000000001',
  name: 'Palm Meadows',
  code: 'PM-BLR',
  address: 'Whitefield, Bengaluru',
  city: 'Bengaluru',
  state: 'Karnataka',
  pincode: '560066',
  emergency_police: '112',
  emergency_ambulance: '108',
  emergency_fire: '101',
  estate_manager_phone: '+91 98450 12345',
  visitor_retention_days: 90,
  branding_logo_url: '/logo-palmmeadows.png',
  created_at: '2026-10-24T06:00:00.000Z'
};

const defaultGates: Gate[] = [
  { id: 'b0000000-0000-0000-0000-000000000001', community_id: defaultCommunity.id, name: 'Main North Gate 1 (Visitor & Cabs)', gate_type: 'main', is_active: true },
  { id: 'b0000000-0000-0000-0000-000000000002', community_id: defaultCommunity.id, name: 'South Service Gate 2 (Deliveries & Logistics)', gate_type: 'service', is_active: true },
  { id: 'b0000000-0000-0000-0000-000000000003', community_id: defaultCommunity.id, name: 'East Pedestrian Gate 3', gate_type: 'pedestrian', is_active: true }
];

const defaultBlocks: BuildingBlock[] = [
  { id: 'c0000000-0000-0000-0000-000000000001', community_id: defaultCommunity.id, name: 'Tower A', total_floors: 14 },
  { id: 'c0000000-0000-0000-0000-000000000002', community_id: defaultCommunity.id, name: 'Tower B', total_floors: 14 },
  { id: 'c0000000-0000-0000-0000-000000000003', community_id: defaultCommunity.id, name: 'Tower C', total_floors: 18 },
  { id: 'c0000000-0000-0000-0000-000000000004', community_id: defaultCommunity.id, name: 'Tower D', total_floors: 18 }
];

const defaultFlats: Flat[] = [
  { 
    id: 'd0000000-0000-0000-0000-000000001204', 
    community_id: defaultCommunity.id, 
    block_id: defaultBlocks[0].id, 
    block_name: 'Tower A', 
    flat_number: '1204', 
    floor_number: 12, 
    intercom_number: '1204', 
    is_occupied: true, 
    occupancy_type: 'self_occupied', 
    primary_resident_name: 'Resident Owner', 
    owner_name: 'Resident Owner',
    maintenance_amount: 4200, 
    maintenance_status: 'paid' 
  },
  { 
    id: 'd0000000-0000-0000-0000-000000001205', 
    community_id: defaultCommunity.id, 
    block_id: defaultBlocks[0].id, 
    block_name: 'Tower A', 
    flat_number: '1205', 
    floor_number: 12, 
    intercom_number: '1205', 
    is_occupied: false, 
    occupancy_type: 'vacant', 
    maintenance_amount: 4200, 
    maintenance_status: 'paid' 
  },
  { 
    id: 'd0000000-0000-0000-0000-000000001206', 
    community_id: defaultCommunity.id, 
    block_id: defaultBlocks[0].id, 
    block_name: 'Tower A', 
    flat_number: '1206', 
    floor_number: 12, 
    intercom_number: '1206', 
    is_occupied: false, 
    occupancy_type: 'vacant', 
    maintenance_amount: 4200, 
    maintenance_status: 'paid' 
  },
  { 
    id: 'd0000000-0000-0000-0000-000000000301', 
    community_id: defaultCommunity.id, 
    block_id: defaultBlocks[0].id, 
    block_name: 'Tower A', 
    flat_number: '301', 
    floor_number: 3, 
    intercom_number: '1301', 
    is_occupied: false, 
    occupancy_type: 'vacant', 
    maintenance_amount: 3800, 
    maintenance_status: 'paid' 
  },
  { 
    id: 'd0000000-0000-0000-0000-000000000402', 
    community_id: defaultCommunity.id, 
    block_id: defaultBlocks[1].id, 
    block_name: 'Tower B', 
    flat_number: '402', 
    floor_number: 4, 
    intercom_number: '2402', 
    is_occupied: false, 
    occupancy_type: 'vacant', 
    maintenance_amount: 4000, 
    maintenance_status: 'paid' 
  },
  { 
    id: 'd0000000-0000-0000-0000-000000000403', 
    community_id: defaultCommunity.id, 
    block_id: defaultBlocks[1].id, 
    block_name: 'Tower B', 
    flat_number: '403', 
    floor_number: 4, 
    intercom_number: '2403', 
    is_occupied: false, 
    occupancy_type: 'vacant', 
    maintenance_amount: 3900, 
    maintenance_status: 'paid' 
  },
  { 
    id: 'd0000000-0000-0000-0000-000000000701', 
    community_id: defaultCommunity.id, 
    block_id: defaultBlocks[1].id, 
    block_name: 'Tower B', 
    flat_number: '701', 
    floor_number: 7, 
    intercom_number: '2701', 
    is_occupied: false, 
    occupancy_type: 'vacant', 
    maintenance_amount: 4400, 
    maintenance_status: 'paid' 
  },
  { 
    id: 'd0000000-0000-0000-0000-000000001102', 
    community_id: defaultCommunity.id, 
    block_id: defaultBlocks[1].id, 
    block_name: 'Tower B', 
    flat_number: '1102', 
    floor_number: 11, 
    intercom_number: '3102', 
    is_occupied: false, 
    occupancy_type: 'vacant', 
    maintenance_amount: 4800, 
    maintenance_status: 'paid' 
  },
  { 
    id: 'd0000000-0000-0000-0000-000000000102', 
    community_id: defaultCommunity.id, 
    block_id: defaultBlocks[0].id, 
    block_name: 'Tower A', 
    flat_number: '102', 
    floor_number: 1, 
    intercom_number: '1102', 
    is_occupied: false, 
    occupancy_type: 'vacant', 
    maintenance_amount: 3500, 
    maintenance_status: 'paid' 
  },
  { 
    id: 'd0000000-0000-0000-0000-000000000801', 
    community_id: defaultCommunity.id, 
    block_id: defaultBlocks[2].id, 
    block_name: 'Tower C', 
    flat_number: '801', 
    floor_number: 8, 
    intercom_number: '3801', 
    is_occupied: false, 
    occupancy_type: 'vacant', 
    maintenance_amount: 5200, 
    maintenance_status: 'paid' 
  }
];

const defaultUsers: UserProfile[] = [
  {
    id: 'e0000000-0000-0000-0000-000000000003',
    community_id: defaultCommunity.id,
    full_name: 'Security Officer',
    email: 'guard@gatewaysecurity.in',
    phone: '+91 98765 43210',
    role: 'security_guard',
    notification_push_enabled: true,
    notification_sms_enabled: false,
    notification_sound_enabled: true,
    is_active: true
  },
  {
    id: 'e0000000-0000-0000-0000-000000000004',
    community_id: defaultCommunity.id,
    full_name: 'Resident Owner',
    email: 'owner@gatewaysecurity.in',
    phone: '+91 98111 22334',
    role: 'resident',
    resident_type: 'owner',
    flat_id: defaultFlats[0].id,
    flat_display: 'Tower A • Floor 12 • Flat 1204',
    owned_flat_ids: [
      'd0000000-0000-0000-0000-000000001204'
    ],
    notification_push_enabled: true,
    notification_sms_enabled: true,
    notification_sound_enabled: true,
    is_active: true
  },
  {
    id: 'e0000000-0000-0000-0000-000000000002',
    community_id: defaultCommunity.id,
    full_name: 'Community Admin',
    email: 'admin@gatewaysecurity.in',
    phone: '+91 98450 12345',
    role: 'community_admin',
    notification_push_enabled: true,
    notification_sms_enabled: true,
    notification_sound_enabled: true,
    is_active: true
  },
  {
    id: 'e0000000-0000-0000-0000-000000000001',
    community_id: defaultCommunity.id,
    full_name: 'Super Admin',
    email: 'superadmin@gatewaysecurity.in',
    phone: '+91 99000 00001',
    role: 'super_admin',
    notification_push_enabled: true,
    notification_sms_enabled: false,
    notification_sound_enabled: false,
    is_active: true
  }
];

const defaultGuestPasses: GuestPass[] = [];
const defaultVisitorRequests: VisitorRequest[] = [];
const defaultAuditLogs: AuditLog[] = [];
const defaultDailyHelpers: DailyHelper[] = [];
const defaultDailyHelpLogs: DailyHelpLog[] = [];
const defaultNotices: Notice[] = [];
const defaultBlacklist: BlacklistEntry[] = [];
const defaultSosAlerts: SosAlert[] = [];

export function getBaselineState(): AppState {
  return {
    currentCommunity: defaultCommunity,
    gates: defaultGates,
    blocks: defaultBlocks,
    flats: defaultFlats,
    users: defaultUsers,
    currentUser: defaultUsers[0], // Default: Security Guard
    visitorRequests: defaultVisitorRequests,
    guestPasses: defaultGuestPasses,
    auditLogs: defaultAuditLogs,
    dailyHelpers: defaultDailyHelpers,
    dailyHelpLogs: defaultDailyHelpLogs,
    notices: defaultNotices,
    sosAlerts: defaultSosAlerts,
    blacklist: defaultBlacklist,
    autoSimulateResident: false,
    connectionStatus: isSupabaseConfigured ? 'connecting' : 'local'
  };
}

// In-Memory & Supabase Realtime State Engine
class AppStore {
  private state: AppState;
  private listeners: Set<(state: AppState) => void> = new Set();
  private broadcast: BroadcastChannel | null = null;
  private isLoadedFromStorage = false;
  private isSupabaseSyncInitialized = false;

  constructor() {
    this.state = getBaselineState();
    if (typeof window !== 'undefined') {
      try {
        this.broadcast = new BroadcastChannel(BROADCAST_CHANNEL);
        this.broadcast.onmessage = (event) => {
          if (event.data === 'SYNC') {
            this.state = this.loadFromStorage();
            this.notify();
          }
        };
      } catch {
        // Fallback if BroadcastChannel unavailable
      }

      window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY) {
          this.state = this.loadFromStorage();
          this.notify();
        }
      });
    }
  }

  public getBaselineState(): AppState {
    return getBaselineState();
  }

  private loadFromStorage(): AppState {
    try {
      let data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        data = localStorage.getItem('gateway_security_store_v2') || localStorage.getItem('gateway_security_store_v1');
      }
      if (data) {
        const parsed = JSON.parse(data);

        // Merge default flats and any custom created flats so none are lost
        const parsedFlats: Flat[] = (parsed.flats && Array.isArray(parsed.flats)) ? parsed.flats : [];
        const baseFlatIds = new Set(defaultFlats.map(f => f.id));
        const customSavedFlats = parsedFlats.filter(f => !baseFlatIds.has(f.id));
        const flats = [...defaultFlats, ...customSavedFlats];

        const legacyDummyUserIds = new Set([
          'e0000000-0000-0000-0000-000000000006', // Arun Nair
          'e0000000-0000-0000-0000-000000000301', // Suresh Patel
          'e0000000-0000-0000-0000-000000000007', // Kishore Reddy
          'e0000000-0000-0000-0000-000000001205', // Rohan Verma
          'e0000000-0000-0000-0000-000000001206', // Pooja Hegde
          'e0000000-0000-0000-0000-000000000402', // Ananya Sharma
          'e0000000-0000-0000-0000-000000000005'  // Vikram Sharma
        ]);

        // Filter out legacy dummy users, preserve role accounts and real custom users
        const rawUsers: UserProfile[] = (parsed.users && Array.isArray(parsed.users) && parsed.users.length > 0)
          ? parsed.users.filter((u: UserProfile) => !legacyDummyUserIds.has(u.id))
          : defaultUsers;

        // Ensure default role accounts are always present with clean labels
        const userMap = new Map<string, UserProfile>();
        for (const def of defaultUsers) {
          userMap.set(def.id, def);
        }

        for (const u of rawUsers) {
          const defaultMatch = defaultUsers.find(du => du.id === u.id);
          if (defaultMatch) {
            userMap.set(u.id, {
              ...u,
              full_name: defaultMatch.full_name,
              email: defaultMatch.email
            });
            continue;
          }

          // Custom user (like Sneha or Vinay Veddulapalli)
          if (u.role === 'resident') {
            let matchingFlat = flats.find(f => f.id === u.flat_id);
            if (!matchingFlat && u.flat_display) {
              matchingFlat = flats.find(f => u.flat_display?.includes(f.flat_number));
            }

            // Auto-heal Sneha to Flat 1502 if needed
            if (u.full_name.toLowerCase().includes('sneha')) {
              let flat1502 = flats.find(f => f.flat_number === '1502');
              if (!flat1502) {
                flat1502 = {
                  id: 'd0000000-0000-0000-0000-000000001502',
                  community_id: u.community_id || defaultCommunity.id,
                  block_id: 'c0000000-0000-0000-0000-000000000004',
                  block_name: 'Tower D',
                  flat_number: '1502',
                  floor_number: 15,
                  intercom_number: '1502',
                  is_occupied: true,
                  occupancy_type: 'self_occupied',
                  owner_name: u.full_name,
                  maintenance_amount: 5000,
                  maintenance_status: 'paid'
                };
                flats.push(flat1502);
              }
              userMap.set(u.id, {
                ...u,
                flat_id: flat1502.id,
                flat_display: 'Tower D • Floor 15 • Flat 1502',
                owned_flat_ids: [flat1502.id]
              });
              continue;
            }

            if (!matchingFlat && u.flat_display) {
              const parts = u.flat_display.split('•').map(s => s.trim());
              const blockName = parts[0] || 'Tower D';
              const floorNum = parseInt(parts[1]?.replace(/\D/g, '') || '1') || 1;
              const flatNum = parts[2]?.replace(/[^\d\w]/g, '').replace('Flat', '').trim() || '1502';
              const newFlatId = u.flat_id || ('d' + generateUUID().slice(1));
              matchingFlat = {
                id: newFlatId,
                community_id: u.community_id || defaultCommunity.id,
                block_id: 'c0000000-0000-0000-0000-000000000004',
                block_name: blockName,
                flat_number: flatNum,
                floor_number: floorNum,
                intercom_number: flatNum,
                is_occupied: true,
                occupancy_type: u.resident_type === 'tenant' ? 'rented' : 'self_occupied',
                owner_name: u.resident_type === 'owner' ? u.full_name : undefined,
                tenant_name: u.resident_type === 'tenant' ? u.full_name : undefined,
                tenant_phone: u.resident_type === 'tenant' ? u.phone : undefined,
                monthly_rent: 35000,
                maintenance_amount: 5000,
                maintenance_status: 'paid'
              };
              flats.push(matchingFlat);
            }

            const resolvedFlatId = matchingFlat ? matchingFlat.id : (u.flat_id || defaultFlats[0].id);
            userMap.set(u.id, {
              ...u,
              flat_id: resolvedFlatId,
              owned_flat_ids: [resolvedFlatId]
            });
          } else {
            userMap.set(u.id, u);
          }
        }

        const users = Array.from(userMap.values());

        // Resolve current user: if user was a deleted dummy, fallback to default role user
        let baseCurrentUser = parsed.currentUser || defaultUsers[0];
        if (legacyDummyUserIds.has(baseCurrentUser.id)) {
          baseCurrentUser = defaultUsers[0];
        }
        let currentUser = users.find((u: UserProfile) => u.id === baseCurrentUser.id || (u.email && u.email.toLowerCase() === (baseCurrentUser.email || '').toLowerCase())) || defaultUsers[0];

        // Filter out dummy visitor requests (production baseline = 0 dummy records)
        const visitorRequests = (parsed.visitorRequests && Array.isArray(parsed.visitorRequests))
          ? parsed.visitorRequests.filter((r: VisitorRequest) => 
              !r.id.startsWith('f1000000-') && 
              r.id !== '09534460-7aa9-4dd9-9092-7af5f48ea570' && 
              r.id !== '21ea12cd-e726-425b-8ad3-1f5c14b0c4da'
            )
          : [];

        // Filter out dummy passes, helpers, notices, blacklist
        const guestPasses = (parsed.guestPasses && Array.isArray(parsed.guestPasses))
          ? parsed.guestPasses.filter((p: GuestPass) => !p.id.startsWith('f0000000-'))
          : [];

        const dailyHelpers = (parsed.dailyHelpers && Array.isArray(parsed.dailyHelpers))
          ? parsed.dailyHelpers.filter((h: DailyHelper) => !h.id.startsWith('h0000000-'))
          : [];

        const dailyHelpLogs = (parsed.dailyHelpLogs && Array.isArray(parsed.dailyHelpLogs))
          ? parsed.dailyHelpLogs.filter((l: DailyHelpLog) => !l.id.startsWith('hl000000-'))
          : [];

        const notices = (parsed.notices && Array.isArray(parsed.notices))
          ? parsed.notices.filter((n: Notice) => !n.id.startsWith('n0000000-'))
          : [];

        const blacklist = (parsed.blacklist && Array.isArray(parsed.blacklist))
          ? parsed.blacklist.filter((b: BlacklistEntry) => !b.id.startsWith('bl-00000000-'))
          : [];

        const auditLogs = (parsed.auditLogs && Array.isArray(parsed.auditLogs))
          ? parsed.auditLogs.filter((a: AuditLog) => !a.id.startsWith('al-00000000-'))
          : [];

        // Auto-enrich flat occupancy and occupant contacts with registered user profiles
        const enrichedFlats = flats.map(f => {
          const flatResidents = users.filter(u => 
            u.role === 'resident' && (
              u.flat_id === f.id || 
              (u.flat_display && u.flat_display.includes(`Flat ${f.flat_number}`)) ||
              (u.owned_flat_ids && u.owned_flat_ids.includes(f.id))
            )
          );
          const tenantUser = flatResidents.find(u => u.resident_type === 'tenant');
          const ownerUser = flatResidents.find(u => u.resident_type === 'owner' || !u.resident_type);
          
          if (tenantUser) {
            return {
              ...f,
              is_occupied: true,
              occupancy_type: 'rented' as const,
              tenant_name: tenantUser.full_name,
              tenant_phone: tenantUser.phone,
              owner_name: ownerUser?.full_name || f.owner_name || 'Resident Owner',
              primary_resident_name: tenantUser.full_name,
              primary_resident_phone: tenantUser.phone
            };
          } else if (ownerUser) {
            return {
              ...f,
              is_occupied: true,
              occupancy_type: 'self_occupied' as const,
              owner_name: ownerUser.full_name,
              tenant_name: undefined,
              tenant_phone: undefined,
              primary_resident_name: ownerUser.full_name,
              primary_resident_phone: ownerUser.phone
            };
          } else {
            return {
              ...f,
              is_occupied: f.is_occupied ?? false,
              occupancy_type: f.is_occupied ? (f.occupancy_type || 'self_occupied') : 'vacant' as const
            };
          }
        });

        const upgradedState: AppState = {
          ...parsed,
          flats: enrichedFlats,
          users,
          currentUser,
          visitorRequests,
          guestPasses,
          auditLogs,
          dailyHelpers,
          dailyHelpLogs,
          notices,
          sosAlerts: parsed.sosAlerts || [],
          blacklist,
          connectionStatus: isSupabaseConfigured ? (this.state.connectionStatus || 'connecting') : 'local'
        };

        this.saveToStorage(upgradedState);
        return upgradedState;
      }
    } catch {
      // ignore
    }
    const initial: AppState = getBaselineState();
    this.saveToStorage(initial);
    return initial;
  }

  private saveToStorage(state: AppState) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      this.broadcast?.postMessage('SYNC');
    } catch {
      // Storage quota or disabled
    }
  }

  private notify() {
    this.listeners.forEach((listener) => listener(this.state));
  }

  public subscribe(listener: (state: AppState) => void): () => void {
    if (typeof window !== 'undefined') {
      if (!this.isLoadedFromStorage) {
        this.isLoadedFromStorage = true;
        this.state = this.loadFromStorage();
      }
      if (!this.isSupabaseSyncInitialized && isSupabaseConfigured) {
        this.isSupabaseSyncInitialized = true;
        this.initSupabaseSync();
      }
    }
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  public getState(): AppState {
    return this.state;
  }

  // --- SUPABASE REALTIME & CLOUD SYNC ---

  public async syncWithCloud(): Promise<{ success: boolean; count: number; error?: string }> {
    if (!isSupabaseConfigured || !supabase || typeof window === 'undefined') {
      return { success: false, count: 0, error: 'Supabase credentials are not configured' };
    }

    try {
      this.state = { ...this.state, connectionStatus: 'connecting' };
      this.notify();

      // 1. Remote Fetch of Flats (Syncs custom flats across phone and desktop)
      let flats = [...this.state.flats];
      try {
        const { data: dbFlats, error: flatsErr } = await supabase.from('flats').select('*');
        if (!flatsErr && dbFlats && dbFlats.length > 0) {
          const flatMap = new Map<string, Flat>();
          for (const f of flats) flatMap.set(f.id, f);
          for (const row of dbFlats) {
            const existing = flatMap.get(row.id);
            const block = this.state.blocks.find(b => b.id === row.block_id);
            flatMap.set(row.id, {
              id: row.id,
              community_id: row.community_id || this.state.currentCommunity.id,
              block_id: row.block_id || (this.state.blocks[0]?.id || 'c0000000-0000-0000-0000-000000000001'),
              block_name: block?.name || existing?.block_name || 'Tower A',
              flat_number: String(row.flat_number),
              floor_number: Number(row.floor_number) || 1,
              intercom_number: String(row.intercom_number || row.flat_number),
              is_occupied: row.is_occupied ?? true,
              occupancy_type: existing?.occupancy_type || 'self_occupied',
              owner_name: existing?.owner_name,
              tenant_name: existing?.tenant_name,
              tenant_phone: existing?.tenant_phone,
              maintenance_amount: existing?.maintenance_amount || 4200,
              maintenance_status: existing?.maintenance_status || 'paid'
            });
          }
          flats = Array.from(flatMap.values());
        }
      } catch (fErr) {
        console.warn('Flats cloud sync notice:', fErr);
      }

      // 2. Remote Fetch of User Profiles & Flat Residents (Syncs credentials to mobile!)
      let users = [...this.state.users];
      try {
        const { data: dbUsers, error: usersErr } = await supabase.from('user_profiles').select('*');
        if (!usersErr && dbUsers && dbUsers.length > 0) {
          const { data: dbFlatResidents } = await supabase.from('flat_residents').select('*');
          const userFlatMap = new Map<string, string>();
          if (dbFlatResidents) {
            for (const fr of dbFlatResidents) {
              if (fr.user_id && fr.flat_id) {
                userFlatMap.set(fr.user_id, fr.flat_id);
              }
            }
          }

          const userMap = new Map<string, UserProfile>();
          for (const def of defaultUsers) userMap.set(def.id, def);
          for (const u of users) userMap.set(u.id, u);

          for (const row of dbUsers) {
            const assignedFlatId = userFlatMap.get(row.id);
            const flat = assignedFlatId ? flats.find(f => f.id === assignedFlatId) : undefined;
            const flatDisplay = flat ? `${flat.block_name || 'Tower A'} • Floor ${flat.floor_number} • Flat ${flat.flat_number}` : undefined;
            const existing = userMap.get(row.id);

            userMap.set(row.id, {
              id: row.id,
              community_id: row.community_id || this.state.currentCommunity.id,
              full_name: row.full_name || existing?.full_name || 'Resident',
              email: row.email || existing?.email || '',
              phone: row.phone || existing?.phone || '',
              role: (row.role as UserRole) || existing?.role || 'resident',
              resident_type: existing?.resident_type || (row.role === 'resident' ? 'owner' : undefined),
              flat_id: assignedFlatId || existing?.flat_id,
              flat_display: flatDisplay || existing?.flat_display,
              owned_flat_ids: assignedFlatId ? [assignedFlatId] : (existing?.owned_flat_ids || []),
              notification_push_enabled: true,
              notification_sms_enabled: false,
              notification_sound_enabled: true,
              is_active: row.is_active ?? true
            });
          }
          users = Array.from(userMap.values());

          // Enrich flats with resolved cloud users
          flats = flats.map(f => {
            const flatResidents = users.filter(u => 
              u.role === 'resident' && (
                u.flat_id === f.id || 
                (u.flat_display && u.flat_display.includes(`Flat ${f.flat_number}`)) ||
                (u.owned_flat_ids && u.owned_flat_ids.includes(f.id))
              )
            );
            const tenantUser = flatResidents.find(u => u.resident_type === 'tenant');
            const ownerUser = flatResidents.find(u => u.resident_type === 'owner' || !u.resident_type);
            if (tenantUser) {
              return {
                ...f,
                is_occupied: true,
                occupancy_type: 'rented' as const,
                tenant_name: tenantUser.full_name,
                tenant_phone: tenantUser.phone,
                owner_name: ownerUser?.full_name || f.owner_name || 'Resident Owner',
                primary_resident_name: tenantUser.full_name,
                primary_resident_phone: tenantUser.phone
              };
            } else if (ownerUser) {
              return {
                ...f,
                is_occupied: true,
                occupancy_type: 'self_occupied' as const,
                owner_name: ownerUser.full_name,
                tenant_name: undefined,
                tenant_phone: undefined,
                primary_resident_name: ownerUser.full_name,
                primary_resident_phone: ownerUser.phone
              };
            }
            return f;
          });
        }
      } catch (uErr) {
        console.warn('User profiles cloud sync notice:', uErr);
      }

      // 3. Remote Fetch of Visitor Requests
      const { data: dbRequests, error: reqError } = await supabase
        .from('visitor_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (reqError) {
        console.warn('Supabase visitor fetch error:', reqError.message);
        throw new Error(reqError.message);
      }

      let mappedRequests: VisitorRequest[] = [];
      if (dbRequests && dbRequests.length > 0) {
        mappedRequests = dbRequests.map((row) => {
          const flat = flats.find(f => f.id === row.flat_id);
          const gate = this.state.gates.find(g => g.id === row.gate_id);
          const guard = users.find(u => u.id === row.guard_id);
          const decisionMaker = users.find(u => u.id === row.decision_by);

          return {
            id: row.id,
            community_id: row.community_id,
            gate_id: row.gate_id,
            gate_name: gate?.name || 'Main Gate',
            flat_id: row.flat_id,
            flat_number: flat?.flat_number || 'N/A',
            block_name: flat?.block_name || 'N/A',
            guard_id: row.guard_id,
            guard_name: guard?.full_name || 'Gate Security',
            guest_pass_id: row.guest_pass_id,
            visitor_name: row.visitor_name,
            visitor_phone: row.visitor_phone,
            visitor_photo_path: row.visitor_photo_path,
            category: row.category,
            delivery_category: row.delivery_category,
            delivery_company: row.delivery_company,
            purpose: row.purpose,
            vehicle_number: row.vehicle_number,
            parcel_count: row.parcel_count,
            parcel_details: row.parcel_details,
            parcel_photo_path: row.parcel_photo_path,
            gate_location: row.gate_location,
            handover_status: row.handover_status,
            collection_otp: row.collection_otp,
            collected_at: row.collected_at,
            collected_by: row.collected_by,
            collected_by_name: row.collected_by_name,
            handover_guard_id: row.handover_guard_id,
            status: row.status,
            consent_obtained: row.consent_obtained ?? true,
            decision_by: row.decision_by,
            decision_by_name: decisionMaker?.full_name,
            decision_at: row.decision_at,
            rejection_reason: row.rejection_reason,
            check_in_time: row.check_in_time,
            check_out_time: row.check_out_time,
            checked_in_by: row.checked_in_by,
            checked_out_by: row.checked_out_by,
            supervisor_escalated: row.supervisor_escalated,
            supervisor_notes: row.supervisor_notes,
            created_at: row.created_at,
            updated_at: row.updated_at
          };
        });
      }

      // Merge with baseline requests
      const requestMap = new Map<string, VisitorRequest>();
      for (const def of defaultVisitorRequests) {
        requestMap.set(def.id, def);
      }
      for (const req of mappedRequests) {
        requestMap.set(req.id, req);
      }
      const combinedRequests = Array.from(requestMap.values())
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      // 4. Fetch Guest Passes
      const { data: dbPasses } = await supabase
        .from('guest_passes')
        .select('*')
        .order('created_at', { ascending: false });

      let mappedPasses: GuestPass[] = this.state.guestPasses;
      if (dbPasses && dbPasses.length > 0) {
        mappedPasses = dbPasses.map((p) => {
          const flat = flats.find(f => f.id === p.flat_id);
          return {
            id: p.id,
            community_id: p.community_id,
            flat_id: p.flat_id,
            flat_number: flat?.flat_number || 'N/A',
            block_name: flat?.block_name || 'N/A',
            created_by: p.created_by,
            guest_name: p.guest_name,
            guest_phone: p.guest_phone,
            pass_code: p.pass_code,
            category: p.category,
            valid_from: p.valid_from,
            valid_until: p.valid_until,
            max_entries: p.max_entries,
            entries_used: p.entries_used,
            is_active: p.is_active,
            notes: p.notes,
            created_at: p.created_at
          };
        });
      }

      this.state = {
        ...this.state,
        flats,
        users,
        visitorRequests: combinedRequests,
        guestPasses: mappedPasses,
        connectionStatus: 'connected'
      };
      this.saveToStorage(this.state);
      this.notify();

      return { success: true, count: combinedRequests.length };
    } catch (err: unknown) {
      console.warn('syncWithCloud error:', err);
      this.state = { ...this.state, connectionStatus: 'error' };
      this.notify();
      return { success: false, count: 0, error: (err as Error).message };
    }
  }

  private async initSupabaseSync() {
    if (!isSupabaseConfigured || !supabase || typeof window === 'undefined') return;

    // Immediately pull down all latest records from Supabase Cloud
    await this.syncWithCloud();

    try {
      // Subscribe to Realtime WebSocket Channels across visitors, passes, users, and flats
      supabase
        .channel('gateway_cross_device_sync')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'visitor_requests' },
          (payload) => {
            this.handleRealtimeVisitorPayload(payload);
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'guest_passes' },
          (payload) => {
            this.handleRealtimePassPayload(payload);
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'user_profiles' },
          () => {
            this.syncWithCloud();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'flats' },
          () => {
            this.syncWithCloud();
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            this.state = { ...this.state, connectionStatus: 'connected' };
            this.notify();
          } else if (status === 'CHANNEL_ERROR') {
            console.warn('Supabase realtime channel warning; REST sync remains operational');
          }
        });
    } catch (err) {
      console.warn('Supabase realtime channel subscription error:', err);
    }
  }

  // Handle incoming live payload from another device via Supabase
  private handleRealtimeVisitorPayload(payload: {
    eventType: string;
    new: Record<string, unknown>;
    old: Record<string, unknown>;
  }) {
    const { eventType } = payload;
    const newRecord = payload.new as unknown as Record<string, string | boolean | undefined>;
    const oldRecord = payload.old as unknown as Record<string, string | boolean | undefined>;

    if (eventType === 'INSERT' && newRecord) {
      const flat = this.state.flats.find(f => f.id === newRecord.flat_id);
      const gate = this.state.gates.find(g => g.id === newRecord.gate_id);
      const guard = this.state.users.find(u => u.id === newRecord.guard_id);

      const incoming: VisitorRequest = {
        id: String(newRecord.id),
        community_id: String(newRecord.community_id || this.state.currentCommunity.id),
        gate_id: String(newRecord.gate_id),
        gate_name: gate?.name || 'Main Gate',
        flat_id: String(newRecord.flat_id),
        flat_number: flat?.flat_number || 'N/A',
        block_name: flat?.block_name || 'N/A',
        guard_id: String(newRecord.guard_id),
        guard_name: guard?.full_name || 'Gate Security',
        visitor_name: String(newRecord.visitor_name),
        visitor_phone: String(newRecord.visitor_phone),
        visitor_photo_path: newRecord.visitor_photo_path as string | undefined,
        category: (newRecord.category as VisitorRequest['category']) || 'guest',
        delivery_category: newRecord.delivery_category as VisitorRequest['delivery_category'],
        delivery_company: newRecord.delivery_company as string | undefined,
        purpose: String(newRecord.purpose),
        vehicle_number: newRecord.vehicle_number as string | undefined,
        parcel_count: newRecord.parcel_count ? Number(newRecord.parcel_count) : undefined,
        parcel_details: newRecord.parcel_details as string | undefined,
        parcel_photo_path: newRecord.parcel_photo_path as string | undefined,
        gate_location: newRecord.gate_location as string | undefined,
        handover_status: newRecord.handover_status as VisitorRequest['handover_status'],
        collection_otp: newRecord.collection_otp as string | undefined,
        collected_at: newRecord.collected_at as string | undefined,
        collected_by: newRecord.collected_by as string | undefined,
        collected_by_name: newRecord.collected_by_name as string | undefined,
        handover_guard_id: newRecord.handover_guard_id as string | undefined,
        status: (newRecord.status as VisitorStatus) || 'pending',
        consent_obtained: Boolean(newRecord.consent_obtained ?? true),
        created_at: String(newRecord.created_at || new Date().toISOString()),
        updated_at: String(newRecord.updated_at || new Date().toISOString())
      };

      if (!this.state.visitorRequests.some(r => r.id === incoming.id)) {
        this.state = {
          ...this.state,
          visitorRequests: [incoming, ...this.state.visitorRequests]
        };
        this.saveToStorage(this.state);
        this.notify();
        soundNotifier.playIncomingAlert();
      }
    } else if (eventType === 'UPDATE' && newRecord) {
      const existingIndex = this.state.visitorRequests.findIndex(r => r.id === newRecord.id);
      if (existingIndex !== -1) {
        const oldReq = this.state.visitorRequests[existingIndex];
        const approver = this.state.users.find(u => u.id === newRecord.decision_by);
        const updated: VisitorRequest = {
          ...oldReq,
          status: (newRecord.status as VisitorStatus) || oldReq.status,
          delivery_category: (newRecord.delivery_category as VisitorRequest['delivery_category']) ?? oldReq.delivery_category,
          parcel_count: newRecord.parcel_count !== undefined ? Number(newRecord.parcel_count) : oldReq.parcel_count,
          parcel_details: (newRecord.parcel_details as string) ?? oldReq.parcel_details,
          parcel_photo_path: (newRecord.parcel_photo_path as string) ?? oldReq.parcel_photo_path,
          gate_location: (newRecord.gate_location as string) ?? oldReq.gate_location,
          handover_status: (newRecord.handover_status as VisitorRequest['handover_status']) ?? oldReq.handover_status,
          collection_otp: (newRecord.collection_otp as string) ?? oldReq.collection_otp,
          collected_at: (newRecord.collected_at as string) ?? oldReq.collected_at,
          collected_by: (newRecord.collected_by as string) ?? oldReq.collected_by,
          collected_by_name: (newRecord.collected_by_name as string) ?? oldReq.collected_by_name,
          handover_guard_id: (newRecord.handover_guard_id as string) ?? oldReq.handover_guard_id,
          decision_by: (newRecord.decision_by as string) || oldReq.decision_by,
          decision_by_name: approver?.full_name || oldReq.decision_by_name,
          decision_at: (newRecord.decision_at as string) || oldReq.decision_at,
          rejection_reason: (newRecord.rejection_reason as string) || oldReq.rejection_reason,
          check_in_time: (newRecord.check_in_time as string) || oldReq.check_in_time,
          check_out_time: (newRecord.check_out_time as string) || oldReq.check_out_time,
          checked_in_by: (newRecord.checked_in_by as string) || oldReq.checked_in_by,
          checked_out_by: (newRecord.checked_out_by as string) || oldReq.checked_out_by,
          updated_at: (newRecord.updated_at as string) || new Date().toISOString()
        };

        const newReqs = [...this.state.visitorRequests];
        newReqs[existingIndex] = updated;

        this.state = {
          ...this.state,
          visitorRequests: newReqs
        };
        this.saveToStorage(this.state);
        this.notify();

        // Audio feedback on status change
        if (oldReq.status !== newRecord.status) {
          if (newRecord.status === 'approved' || newRecord.status === 'checked_in' || newRecord.status === 'leave_at_gate' || newRecord.status === 'collected') {
            soundNotifier.playApprovalChime();
          } else if (newRecord.status === 'rejected') {
            soundNotifier.playRejectionTone();
          }
        }
      }
    } else if (eventType === 'DELETE' && oldRecord) {
      this.state = {
        ...this.state,
        visitorRequests: this.state.visitorRequests.filter(r => r.id !== oldRecord.id)
      };
      this.saveToStorage(this.state);
      this.notify();
    }
  }

  private handleRealtimePassPayload(payload: {
    eventType: string;
    new: Record<string, unknown>;
  }) {
    const { eventType } = payload;
    const newRecord = payload.new as unknown as Record<string, string | number | boolean | undefined>;

    if (eventType === 'INSERT' && newRecord) {
      if (!this.state.guestPasses.some(p => p.id === newRecord.id)) {
        const flat = this.state.flats.find(f => f.id === newRecord.flat_id);
        const incomingPass: GuestPass = {
          id: String(newRecord.id),
          community_id: String(newRecord.community_id || this.state.currentCommunity.id),
          flat_id: String(newRecord.flat_id),
          flat_number: flat?.flat_number || 'N/A',
          block_name: flat?.block_name || 'N/A',
          created_by: String(newRecord.created_by),
          guest_name: String(newRecord.guest_name),
          guest_phone: String(newRecord.guest_phone || 'N/A'),
          pass_code: String(newRecord.pass_code),
          category: (newRecord.category as GuestPass['category']) || 'guest',
          valid_from: String(newRecord.valid_from),
          valid_until: String(newRecord.valid_until),
          max_entries: Number(newRecord.max_entries || 1),
          entries_used: Number(newRecord.entries_used || 0),
          is_active: Boolean(newRecord.is_active ?? true),
          notes: newRecord.notes as string | undefined,
          created_at: String(newRecord.created_at || new Date().toISOString())
        };

        this.state = {
          ...this.state,
          guestPasses: [incomingPass, ...this.state.guestPasses]
        };
        this.saveToStorage(this.state);
        this.notify();
      }
    } else if (eventType === 'UPDATE' && newRecord) {
      this.state = {
        ...this.state,
        guestPasses: this.state.guestPasses.map(p => p.id === newRecord.id ? {
          ...p,
          entries_used: Number(newRecord.entries_used ?? p.entries_used),
          is_active: Boolean(newRecord.is_active ?? p.is_active)
        } : p)
      };
      this.saveToStorage(this.state);
      this.notify();
    }
  }

  // --- ACTIONS ---

  public switchActiveUser(identifier: string) {
    const lower = identifier.toLowerCase();
    const found = this.state.users.find(u => 
      u.id === identifier || 
      u.role === identifier || 
      (u.email && u.email.toLowerCase() === lower) ||
      (lower === 'guard@gatewaysecurity.in' && u.role === 'security_guard') ||
      (lower === 'owner@gatewaysecurity.in' && u.role === 'resident' && u.resident_type === 'owner') ||
      (lower === 'admin@gatewaysecurity.in' && u.role === 'community_admin') ||
      (lower === 'superadmin@gatewaysecurity.in' && u.role === 'super_admin')
    );
    if (found) {
      let resolvedUser = { ...found };
      let updatedFlats = [...this.state.flats];

      if (found.role === 'resident') {
        const isDefaultOwner = found.id === defaultUsers[1].id || 
                               found.email === 'owner@gatewaysecurity.in';

        if (!isDefaultOwner) {
          let matchingFlat = updatedFlats.find(f => f.id === found.flat_id);
          if (!matchingFlat && found.flat_display) {
            matchingFlat = updatedFlats.find(f => found.flat_display?.includes(f.flat_number));
          }

          if (!matchingFlat && found.flat_display) {
            const parts = found.flat_display.split('•').map(s => s.trim());
            const blockName = parts[0] || 'Tower D';
            const floorNum = parseInt(parts[1]?.replace(/\D/g, '') || '1') || 1;
            const flatNum = parts[2]?.replace(/[^\d\w]/g, '').replace('Flat', '').trim() || '1502';
            const flatId = found.flat_id || ('d' + generateUUID().slice(1));
            
            matchingFlat = {
              id: flatId,
              community_id: found.community_id || this.state.currentCommunity.id,
              block_id: 'c0000000-0000-0000-0000-000000000004',
              block_name: blockName,
              flat_number: flatNum,
              floor_number: floorNum,
              intercom_number: flatNum,
              is_occupied: true,
              occupancy_type: found.resident_type === 'tenant' ? 'rented' : 'self_occupied',
              owner_name: found.resident_type === 'owner' ? found.full_name : undefined,
              tenant_name: found.resident_type === 'tenant' ? found.full_name : undefined,
              tenant_phone: found.resident_type === 'tenant' ? found.phone : undefined,
              monthly_rent: 35000,
              maintenance_amount: 5000,
              maintenance_status: 'paid'
            };
            updatedFlats.push(matchingFlat);
          }

          if (matchingFlat) {
            resolvedUser.flat_id = matchingFlat.id;
            resolvedUser.owned_flat_ids = [matchingFlat.id];
          }
        }
      }

      this.state = { 
        ...this.state, 
        flats: updatedFlats,
        currentUser: resolvedUser,
        users: this.state.users.map(u => u.id === resolvedUser.id ? resolvedUser : u)
      };
      this.saveToStorage(this.state);
      this.notify();
    }
  }

  public switchActiveFlat(flatId: string) {
    const flat = this.state.flats.find(f => f.id === flatId);
    if (!flat) return;
    const updatedUser = {
      ...this.state.currentUser,
      flat_id: flat.id,
      flat_display: `${flat.block_name || 'Tower A'} • Floor ${flat.floor_number} • Flat ${flat.flat_number}`
    };
    this.state = {
      ...this.state,
      currentUser: updatedUser,
      users: this.state.users.map(u => u.id === updatedUser.id ? updatedUser : u)
    };
    this.saveToStorage(this.state);
    this.notify();
  }

  public registerNewFlat(params: {
    block_name: string;
    flat_number: string;
    floor_number?: number;
    occupancy_type: 'self_occupied' | 'rented' | 'vacant';
    tenant_name?: string;
    tenant_phone?: string;
    monthly_rent?: number;
    lease_end_date?: string;
  }): Flat {
    const block = this.state.blocks.find(b => b.name === params.block_name) || this.state.blocks[0];
    const newFlatId = generateUUID();
    const floor = params.floor_number || parseInt(params.flat_number.slice(0, -2)) || 1;

    const newFlat: Flat = {
      id: newFlatId,
      community_id: this.state.currentCommunity.id,
      block_id: block.id,
      block_name: params.block_name,
      flat_number: params.flat_number,
      floor_number: floor,
      intercom_number: `${params.block_name.slice(-1)}${params.flat_number}`,
      is_occupied: params.occupancy_type !== 'vacant',
      occupancy_type: params.occupancy_type,
      owner_name: this.state.currentUser.full_name || 'Resident Owner',
      tenant_name: params.tenant_name,
      tenant_phone: params.tenant_phone,
      monthly_rent: params.monthly_rent,
      lease_end_date: params.lease_end_date,
      maintenance_amount: 4200,
      maintenance_status: 'paid'
    };

    const updatedOwnedFlatIds = [
      ...(this.state.currentUser.owned_flat_ids || []),
      newFlatId
    ];

    const updatedUser = {
      ...this.state.currentUser,
      owned_flat_ids: updatedOwnedFlatIds
    };

    this.state = {
      ...this.state,
      flats: [newFlat, ...this.state.flats],
      currentUser: updatedUser,
      users: this.state.users.map(u => u.id === updatedUser.id ? updatedUser : u)
    };

    this.saveToStorage(this.state);
    this.notify();
    return newFlat;
  }

  public purgeExpiredVisitorLogs(days: number = 90) {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const beforeCount = this.state.visitorRequests.length;
    const kept = this.state.visitorRequests.filter(r => new Date(r.created_at) >= cutoffDate);
    const purgedCount = beforeCount - kept.length;
    this.state = {
      ...this.state,
      visitorRequests: kept
    };
    this.saveToStorage(this.state);
    this.notify();
    return { purgedCount, retainedCount: kept.length, retentionDays: days };
  }

  public toggleAutoSimulateResident(enabled: boolean) {
    this.state = { ...this.state, autoSimulateResident: enabled };
    this.saveToStorage(this.state);
    this.notify();
  }

  public resetDemoData() {
    const baseline = getBaselineState();
    const legacyDummyUserIds = new Set([
      'e0000000-0000-0000-0000-000000000006',
      'e0000000-0000-0000-0000-000000000301',
      'e0000000-0000-0000-0000-000000000007',
      'e0000000-0000-0000-0000-000000001205',
      'e0000000-0000-0000-0000-000000001206',
      'e0000000-0000-0000-0000-000000000402',
      'e0000000-0000-0000-0000-000000000005'
    ]);
    const customUsers = this.state.users.filter(u => 
      !defaultUsers.some(d => d.id === u.id) && 
      !legacyDummyUserIds.has(u.id)
    );
    const customFlats = this.state.flats.filter(f => 
      !defaultFlats.some(d => d.id === f.id)
    );
    const initial: AppState = {
      ...baseline,
      users: [...baseline.users, ...customUsers],
      flats: [...baseline.flats, ...customFlats]
    };
    this.state = initial;
    this.saveToStorage(initial);
    this.notify();
    if (isSupabaseConfigured && typeof window !== 'undefined') {
      this.syncWithCloud().catch(() => {});
    }
  }

  // Guard registers a visitor
  public createVisitorRequest(params: {
    gate_id: string;
    flat_id: string;
    visitor_name: string;
    visitor_phone: string;
    visitor_photo_path?: string;
    category: VisitorRequest['category'];
    delivery_category?: VisitorRequest['delivery_category'];
    delivery_company?: string;
    purpose: string;
    vehicle_number?: string;
    consent_obtained: boolean;
    parcel_count?: number;
    parcel_details?: string;
    parcel_photo_path?: string;
    gate_location?: string;
  }): VisitorRequest {
    const flat = this.state.flats.find(f => f.id === params.flat_id);
    const gate = this.state.gates.find(g => g.id === params.gate_id);

    const newRequest: VisitorRequest = {
      id: generateUUID(),
      community_id: this.state.currentCommunity.id,
      gate_id: params.gate_id,
      gate_name: gate?.name || 'Main Gate',
      flat_id: params.flat_id,
      flat_number: flat?.flat_number || 'N/A',
      block_name: flat?.block_name || 'N/A',
      guard_id: this.state.currentUser.id,
      guard_name: this.state.currentUser.full_name,
      visitor_name: params.visitor_name,
      visitor_phone: params.visitor_phone,
      visitor_photo_path: params.visitor_photo_path || '',
      category: params.category,
      delivery_category: params.delivery_category,
      delivery_company: params.delivery_company,
      purpose: params.purpose,
      vehicle_number: params.vehicle_number,
      parcel_count: params.parcel_count || (params.category === 'delivery' ? 1 : undefined),
      parcel_details: params.parcel_details,
      parcel_photo_path: params.parcel_photo_path,
      gate_location: params.gate_location || gate?.name || 'Main Gate',
      status: 'pending',
      consent_obtained: params.consent_obtained,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const newLog: AuditLog = {
      id: generateUUID(),
      community_id: this.state.currentCommunity.id,
      actor_id: this.state.currentUser.id,
      actor_name: this.state.currentUser.full_name,
      actor_role: this.state.currentUser.role,
      action: 'REGISTER_VISITOR',
      entity_type: 'visitor_requests',
      entity_id: newRequest.id,
      metadata: { 
        visitor: newRequest.visitor_name, 
        flat: newRequest.flat_number, 
        category: newRequest.category,
        delivery_category: newRequest.delivery_category,
        parcel_details: newRequest.parcel_details
      },
      created_at: new Date().toISOString()
    };

    this.state = {
      ...this.state,
      visitorRequests: [newRequest, ...this.state.visitorRequests],
      auditLogs: [newLog, ...this.state.auditLogs]
    };

    this.saveToStorage(this.state);
    this.notify();
    soundNotifier.playIncomingAlert();

    // Async push to Supabase Cloud Database with automatic dependency upserting & schema fallback
    if (isSupabaseConfigured && supabase) {
      const client = supabase;
      const corePayload: Record<string, unknown> = {
        id: newRequest.id,
        community_id: newRequest.community_id,
        gate_id: newRequest.gate_id,
        flat_id: newRequest.flat_id,
        guard_id: newRequest.guard_id,
        visitor_name: newRequest.visitor_name,
        visitor_phone: newRequest.visitor_phone,
        visitor_photo_path: newRequest.visitor_photo_path,
        category: newRequest.category,
        delivery_company: newRequest.delivery_company,
        purpose: newRequest.delivery_category 
          ? `[${newRequest.delivery_category.toUpperCase()}] ${newRequest.purpose}` 
          : newRequest.purpose,
        vehicle_number: newRequest.vehicle_number,
        status: newRequest.status,
        consent_obtained: newRequest.consent_obtained,
        created_at: newRequest.created_at,
        updated_at: newRequest.updated_at
      };

      const fullPayload: Record<string, unknown> = {
        ...corePayload,
        delivery_category: newRequest.delivery_category,
        parcel_count: newRequest.parcel_count,
        parcel_details: newRequest.parcel_details,
        parcel_photo_path: newRequest.parcel_photo_path,
        gate_location: newRequest.gate_location
      };

      (async () => {
        try {
          // 1. Ensure the flat exists in the remote database so foreign key doesn't fail
          if (flat) {
            await client.from('flats').upsert({
              id: flat.id,
              community_id: flat.community_id,
              block_id: flat.block_id,
              flat_number: flat.flat_number,
              floor_number: flat.floor_number || 12,
              intercom_number: flat.intercom_number || flat.flat_number
            }, { onConflict: 'id' }).select();
          }

          // 2. Ensure guard exists in user_profiles
          const guardUser = this.state.currentUser;
          if (guardUser) {
            await client.from('user_profiles').upsert({
              id: guardUser.id,
              community_id: this.state.currentCommunity.id,
              full_name: guardUser.full_name,
              email: guardUser.email,
              phone: guardUser.phone,
              role: guardUser.role
            }, { onConflict: 'id' }).select();
          }

          // 3. Ensure gate exists in gates
          if (gate) {
            await client.from('gates').upsert({
              id: gate.id,
              community_id: gate.community_id,
              name: gate.name,
              gate_type: gate.gate_type,
              is_active: gate.is_active
            }, { onConflict: 'id' }).select();
          }

          // 4. Try insert with fullPayload; if remote DB lacks migration 07 columns (PGRST204), fallback to corePayload
          const { error } = await client.from('visitor_requests').insert(fullPayload);
          if (error) {
            if (error.code === 'PGRST204' || error.message?.includes('delivery_category') || error.message?.includes('schema cache')) {
              console.warn('Remote Supabase schema missing migration 07 columns, syncing via core schema...');
              const retryRes = await client.from('visitor_requests').insert(corePayload);
              if (retryRes.error) {
                console.warn('Supabase visitor request sync notice (core fallback):', retryRes.error.message || retryRes.error.code);
              } else {
                console.log('✅ Supabase visitor request successfully synced to cloud database!');
              }
            } else {
              console.warn('Supabase visitor request insert notice:', error.message || error.code);
            }
          } else {
            console.log('✅ Supabase visitor request successfully synced with full schema!');
          }
        } catch (err) {
          console.warn('Supabase visitor request sync bypassed, stored locally:', (err as Error).message);
        }
      })();
    }

    // Auto simulate approval if enabled
    if (this.state.autoSimulateResident) {
      setTimeout(() => {
        this.approveVisitorRequest(newRequest.id, defaultUsers[1].id);
      }, 4500);
    }

    return newRequest;
  }

  // Resident Approves
  public approveVisitorRequest(requestId: string, residentId: string): boolean {
    const req = this.state.visitorRequests.find(r => r.id === requestId);
    if (!req) return false;

    if (!isValidStatusTransition(req.status, 'approved')) {
      throw new Error(`Cannot transition visitor status from ${req.status} to approved`);
    }

    const approver = this.state.users.find(u => u.id === residentId) || this.state.currentUser;

    const updated: VisitorRequest = {
      ...req,
      status: 'approved',
      decision_by: approver.id,
      decision_by_name: approver.full_name,
      decision_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const newLog: AuditLog = {
      id: generateUUID(),
      community_id: this.state.currentCommunity.id,
      actor_id: approver.id,
      actor_name: approver.full_name,
      actor_role: approver.role,
      action: 'APPROVE_VISITOR',
      entity_type: 'visitor_requests',
      entity_id: req.id,
      metadata: { visitor: req.visitor_name, flat: req.flat_number },
      created_at: new Date().toISOString()
    };

    this.state = {
      ...this.state,
      visitorRequests: this.state.visitorRequests.map(r => r.id === requestId ? updated : r),
      auditLogs: [newLog, ...this.state.auditLogs]
    };

    this.saveToStorage(this.state);
    this.notify();
    soundNotifier.playApprovalChime();

    // Async push to Supabase Cloud Database
    if (isSupabaseConfigured && supabase) {
      supabase.from('visitor_requests').update({
        status: 'approved',
        decision_by: approver.id,
        decision_at: updated.decision_at,
        updated_at: updated.updated_at
      }).eq('id', requestId).then(({ error }) => {
        if (error) console.error('Supabase approve error:', error);
      });
    }

    return true;
  }

  // Resident Rejects
  public rejectVisitorRequest(requestId: string, residentId: string, reason: string): boolean {
    const req = this.state.visitorRequests.find(r => r.id === requestId);
    if (!req) return false;

    if (!isValidStatusTransition(req.status, 'rejected')) {
      throw new Error(`Cannot transition visitor status from ${req.status} to rejected`);
    }

    const rejector = this.state.users.find(u => u.id === residentId) || this.state.currentUser;

    const updated: VisitorRequest = {
      ...req,
      status: 'rejected',
      decision_by: rejector.id,
      decision_by_name: rejector.full_name,
      decision_at: new Date().toISOString(),
      rejection_reason: reason || 'Declined by resident',
      updated_at: new Date().toISOString()
    };

    const newLog: AuditLog = {
      id: generateUUID(),
      community_id: this.state.currentCommunity.id,
      actor_id: rejector.id,
      actor_name: rejector.full_name,
      actor_role: rejector.role,
      action: 'REJECT_VISITOR',
      entity_type: 'visitor_requests',
      entity_id: req.id,
      metadata: { visitor: req.visitor_name, flat: req.flat_number, reason },
      created_at: new Date().toISOString()
    };

    this.state = {
      ...this.state,
      visitorRequests: this.state.visitorRequests.map(r => r.id === requestId ? updated : r),
      auditLogs: [newLog, ...this.state.auditLogs]
    };

    this.saveToStorage(this.state);
    this.notify();
    soundNotifier.playRejectionTone();

    // Async push to Supabase Cloud Database
    if (isSupabaseConfigured && supabase) {
      supabase.from('visitor_requests').update({
        status: 'rejected',
        decision_by: rejector.id,
        decision_at: updated.decision_at,
        rejection_reason: updated.rejection_reason,
        updated_at: updated.updated_at
      }).eq('id', requestId).then(({ error }) => {
        if (error) console.error('Supabase reject error:', error);
      });
    }

    return true;
  }

  // Resident Authorizes Leave at Gate
  public authorizeLeaveAtGate(requestId: string, residentId: string, notes?: string): { success: boolean; otp: string } {
    const req = this.state.visitorRequests.find(r => r.id === requestId);
    if (!req) throw new Error('Visitor request not found');

    if (!isValidStatusTransition(req.status, 'leave_at_gate')) {
      throw new Error(`Cannot authorize Leave at Gate: request status is currently "${req.status}"`);
    }

    const approver = this.state.users.find(u => u.id === residentId) || this.state.currentUser;
    // Generate secure 4-digit collection OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    const updated: VisitorRequest = {
      ...req,
      status: 'leave_at_gate',
      handover_status: 'at_gate',
      collection_otp: otp,
      decision_by: approver.id,
      decision_by_name: approver.full_name,
      decision_at: new Date().toISOString(),
      parcel_details: notes ? (req.parcel_details ? `${req.parcel_details} | Resident Note: ${notes}` : `Resident Note: ${notes}`) : req.parcel_details,
      updated_at: new Date().toISOString()
    };

    const newLog: AuditLog = {
      id: generateUUID(),
      community_id: this.state.currentCommunity.id,
      actor_id: approver.id,
      actor_name: approver.full_name,
      actor_role: approver.role,
      action: 'AUTHORIZE_LEAVE_AT_GATE',
      entity_type: 'visitor_requests',
      entity_id: req.id,
      metadata: { 
        visitor: req.visitor_name, 
        flat: req.flat_number, 
        otp, 
        courier: req.delivery_company,
        delivery_category: req.delivery_category
      },
      created_at: new Date().toISOString()
    };

    this.state = {
      ...this.state,
      visitorRequests: this.state.visitorRequests.map(r => r.id === requestId ? updated : r),
      auditLogs: [newLog, ...this.state.auditLogs]
    };

    this.saveToStorage(this.state);
    this.notify();
    soundNotifier.playApprovalChime();

    // Async push to Supabase Cloud Database with schema fallback
    if (isSupabaseConfigured && supabase) {
      const client = supabase;
      client.from('visitor_requests').update({
        status: 'leave_at_gate',
        handover_status: 'at_gate',
        collection_otp: otp,
        decision_by: approver.id,
        decision_at: updated.decision_at,
        parcel_details: updated.parcel_details,
        updated_at: updated.updated_at
      }).eq('id', requestId).then(async ({ error }) => {
        if (error) {
          // If remote schema lacks leave_at_gate enum or columns, fallback to status approved with note
          console.warn('Supabase leave_at_gate update failed, retrying with core schema...');
          await client.from('visitor_requests').update({
            status: 'approved',
            decision_by: approver.id,
            decision_at: updated.decision_at,
            purpose: `[LEAVE AT GATE - OTP: ${otp}] ${req.purpose}`,
            updated_at: updated.updated_at
          }).eq('id', requestId);
        }
      });
    }

    return { success: true, otp };
  }

  // Guard Confirms Parcel Handover to Resident (Collection)
  public confirmParcelHandover(
    requestId: string,
    guardId?: string,
    enteredOtp?: string,
    collectorName?: string
  ): { success: boolean; message: string } {
    const req = this.state.visitorRequests.find(r => r.id === requestId);
    if (!req) throw new Error('Parcel record not found');

    if (!isValidStatusTransition(req.status, 'collected')) {
      throw new Error(`Cannot collect parcel: current status is "${req.status}". Only parcels awaiting collection can be marked collected.`);
    }

    // OTP validation if collection_otp is set
    if (req.collection_otp) {
      if (!enteredOtp || enteredOtp.trim() === '') {
        throw new Error('Collection OTP is required to verify parcel handover.');
      }
      if (enteredOtp.trim().toUpperCase() !== req.collection_otp.trim().toUpperCase()) {
        throw new Error('Invalid collection OTP. Verification failed.');
      }
    }

    const guard = this.state.users.find(u => u.id === guardId) || this.state.currentUser;
    const finalCollectorName = (collectorName && collectorName.trim()) || 'Resident';

    const updated: VisitorRequest = {
      ...req,
      status: 'collected',
      handover_status: 'collected',
      collected_at: new Date().toISOString(),
      collected_by_name: finalCollectorName,
      handover_guard_id: guard.id,
      handover_guard_name: guard.full_name,
      updated_at: new Date().toISOString()
    };

    const newLog: AuditLog = {
      id: generateUUID(),
      community_id: this.state.currentCommunity.id,
      actor_id: guard.id,
      actor_name: guard.full_name,
      actor_role: guard.role,
      action: 'COLLECT_PARCEL',
      entity_type: 'visitor_requests',
      entity_id: req.id,
      metadata: { 
        visitor: req.visitor_name, 
        flat: req.flat_number, 
        collector: finalCollectorName, 
        guard: guard.full_name,
        courier: req.delivery_company
      },
      created_at: new Date().toISOString()
    };

    this.state = {
      ...this.state,
      visitorRequests: this.state.visitorRequests.map(r => r.id === requestId ? updated : r),
      auditLogs: [newLog, ...this.state.auditLogs]
    };

    this.saveToStorage(this.state);
    this.notify();
    soundNotifier.playApprovalChime();

    // Async push to Supabase Cloud Database: Try RPC fn_confirm_parcel_handover first, fallback to table update
    if (isSupabaseConfigured && supabase) {
      const client = supabase;
      client.rpc('fn_confirm_parcel_handover', {
        p_request_id: requestId,
        p_collection_otp: enteredOtp || null,
        p_collector_name: finalCollectorName
      }).then(({ error }) => {
        if (error) {
          console.warn('RPC fn_confirm_parcel_handover fallback to direct update:', error.message);
          client.from('visitor_requests').update({
            status: 'collected',
            handover_status: 'collected',
            collected_at: updated.collected_at,
            collected_by_name: finalCollectorName,
            handover_guard_id: guard.id,
            updated_at: updated.updated_at
          }).eq('id', requestId);
        }
      });
    }

    return { success: true, message: `Parcel handover successfully recorded for ${finalCollectorName}.` };
  }

  // Guard Checks-In Approved Visitor
  public checkInVisitor(requestId: string, guardId?: string): boolean {
    const req = this.state.visitorRequests.find(r => r.id === requestId);
    if (!req) return false;

    if (!isValidStatusTransition(req.status, 'checked_in')) {
      throw new Error(`Entry denied: Status is currently "${req.status}". Only approved requests permit check-in.`);
    }

    const guard = this.state.users.find(u => u.id === guardId) || this.state.currentUser;

    const updated: VisitorRequest = {
      ...req,
      status: 'checked_in',
      check_in_time: new Date().toISOString(),
      checked_in_by: guard.id,
      updated_at: new Date().toISOString()
    };

    const newLog: AuditLog = {
      id: generateUUID(),
      community_id: this.state.currentCommunity.id,
      actor_id: guard.id,
      actor_name: guard.full_name,
      actor_role: guard.role,
      action: 'CHECK_IN',
      entity_type: 'visitor_requests',
      entity_id: req.id,
      metadata: { visitor: req.visitor_name, flat: req.flat_number },
      created_at: new Date().toISOString()
    };

    this.state = {
      ...this.state,
      visitorRequests: this.state.visitorRequests.map(r => r.id === requestId ? updated : r),
      auditLogs: [newLog, ...this.state.auditLogs]
    };

    this.saveToStorage(this.state);
    this.notify();
    soundNotifier.playApprovalChime();

    // Async push to Supabase Cloud Database
    if (isSupabaseConfigured && supabase) {
      supabase.from('visitor_requests').update({
        status: 'checked_in',
        check_in_time: updated.check_in_time,
        checked_in_by: guard.id,
        updated_at: updated.updated_at
      }).eq('id', requestId).then(({ error }) => {
        if (error) console.error('Supabase check-in error:', error);
      });
    }

    return true;
  }

  // Guard Checks-Out Departing Visitor
  public checkOutVisitor(requestId: string, guardId?: string): boolean {
    const req = this.state.visitorRequests.find(r => r.id === requestId);
    if (!req) return false;

    if (!isValidStatusTransition(req.status, 'checked_out')) {
      throw new Error(`Cannot checkout visitor: status is currently "${req.status}". Only checked_in visitors can be checked out.`);
    }

    const guard = this.state.users.find(u => u.id === guardId) || this.state.currentUser;

    const updated: VisitorRequest = {
      ...req,
      status: 'checked_out',
      check_out_time: new Date().toISOString(),
      checked_out_by: guard.id,
      updated_at: new Date().toISOString()
    };

    const newLog: AuditLog = {
      id: generateUUID(),
      community_id: this.state.currentCommunity.id,
      actor_id: guard.id,
      actor_name: guard.full_name,
      actor_role: guard.role,
      action: 'CHECK_OUT',
      entity_type: 'visitor_requests',
      entity_id: req.id,
      metadata: { visitor: req.visitor_name, flat: req.flat_number },
      created_at: new Date().toISOString()
    };

    this.state = {
      ...this.state,
      visitorRequests: this.state.visitorRequests.map(r => r.id === requestId ? updated : r),
      auditLogs: [newLog, ...this.state.auditLogs]
    };

    this.saveToStorage(this.state);
    this.notify();

    // Async push to Supabase Cloud Database
    if (isSupabaseConfigured && supabase) {
      supabase.from('visitor_requests').update({
        status: 'checked_out',
        check_out_time: updated.check_out_time,
        checked_out_by: guard.id,
        updated_at: updated.updated_at
      }).eq('id', requestId).then(({ error }) => {
        if (error) console.error('Supabase check-out error:', error);
      });
    }

    return true;
  }

  // Cancel Visitor Request (by Guard or Resident)
  public cancelVisitorRequest(requestId: string, reason?: string): boolean {
    const req = this.state.visitorRequests.find(r => r.id === requestId);
    if (!req) return false;

    const updated: VisitorRequest = {
      ...req,
      status: 'cancelled',
      rejection_reason: reason || 'Request cancelled at gate',
      updated_at: new Date().toISOString()
    };

    const newLog: AuditLog = {
      id: generateUUID(),
      community_id: this.state.currentCommunity.id,
      actor_id: this.state.currentUser.id,
      actor_name: this.state.currentUser.full_name,
      actor_role: this.state.currentUser.role,
      action: 'CANCEL_VISITOR',
      entity_type: 'visitor_requests',
      entity_id: req.id,
      metadata: { visitor: req.visitor_name, reason },
      created_at: new Date().toISOString()
    };

    this.state = {
      ...this.state,
      visitorRequests: this.state.visitorRequests.map(r => r.id === requestId ? updated : r),
      auditLogs: [newLog, ...this.state.auditLogs]
    };

    this.saveToStorage(this.state);
    this.notify();

    if (isSupabaseConfigured && supabase) {
      supabase.from('visitor_requests').update({
        status: 'cancelled',
        rejection_reason: updated.rejection_reason,
        updated_at: updated.updated_at
      }).eq('id', requestId).then(({ error }) => {
        if (error) console.error('Supabase cancel error:', error);
      });
    }

    return true;
  }

  // Guard escalates pending request to supervisor / intercom call
  public escalateToSupervisor(requestId: string, notes?: string): boolean {
    const req = this.state.visitorRequests.find(r => r.id === requestId);
    if (!req) return false;

    const updated: VisitorRequest = {
      ...req,
      supervisor_escalated: true,
      supervisor_notes: notes || 'Resident not answering; escalated to security supervisor',
      updated_at: new Date().toISOString()
    };

    const newLog: AuditLog = {
      id: generateUUID(),
      community_id: this.state.currentCommunity.id,
      actor_id: this.state.currentUser.id,
      actor_name: this.state.currentUser.full_name,
      actor_role: this.state.currentUser.role,
      action: 'ESCALATE_VISITOR',
      entity_type: 'visitor_requests',
      entity_id: req.id,
      metadata: { visitor: req.visitor_name, notes },
      created_at: new Date().toISOString()
    };

    this.state = {
      ...this.state,
      visitorRequests: this.state.visitorRequests.map(r => r.id === requestId ? updated : r),
      auditLogs: [newLog, ...this.state.auditLogs]
    };

    this.saveToStorage(this.state);
    this.notify();

    if (isSupabaseConfigured && supabase) {
      supabase.from('visitor_requests').update({
        supervisor_escalated: true,
        supervisor_notes: updated.supervisor_notes,
        updated_at: updated.updated_at
      }).eq('id', requestId).then(({ error }) => {
        if (error) console.error('Supabase escalate error:', error);
      });
    }

    return true;
  }

  // Resident asks guard to call before approving entry
  public requestCallFromGuard(requestId: string, residentId: string): boolean {
    const req = this.state.visitorRequests.find(r => r.id === requestId);
    if (!req) return false;

    const caller = this.state.users.find(u => u.id === residentId) || this.state.currentUser;

    const updated: VisitorRequest = {
      ...req,
      call_requested: true,
      call_requested_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const newLog: AuditLog = {
      id: generateUUID(),
      community_id: this.state.currentCommunity.id,
      actor_id: caller.id,
      actor_name: caller.full_name,
      actor_role: caller.role,
      action: 'REQUEST_CALL_FROM_GUARD',
      entity_type: 'visitor_requests',
      entity_id: req.id,
      metadata: { visitor: req.visitor_name, requested_by: caller.full_name },
      created_at: new Date().toISOString()
    };

    this.state = {
      ...this.state,
      visitorRequests: this.state.visitorRequests.map(r => r.id === requestId ? updated : r),
      auditLogs: [newLog, ...this.state.auditLogs]
    };

    this.saveToStorage(this.state);
    this.notify();

    if (isSupabaseConfigured && supabase) {
      supabase.from('visitor_requests').update({
        call_requested: true,
        updated_at: updated.updated_at
      }).eq('id', requestId).then(({ error }) => {
        if (error) console.error('Supabase request call error:', error);
      });
    }

    soundNotifier.playIncomingAlert();
    return true;
  }

  // Resident Creates Pre-approved Guest Pass
  public createGuestPass(params: {
    flat_id?: string;
    guest_name: string;
    guest_phone?: string;
    category: GuestPass['category'];
    valid_hours: number;
    notes?: string;
  }): GuestPass {
    const userFlat = params.flat_id 
      ? (this.state.flats.find(f => f.id === params.flat_id) || this.state.flats[0])
      : (this.state.flats.find(f => f.id === this.state.currentUser.flat_id) || this.state.flats[0]);
    const passCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit PIN

    const newPass: GuestPass = {
      id: generateUUID(),
      community_id: this.state.currentCommunity.id,
      flat_id: userFlat.id,
      flat_number: userFlat.flat_number,
      block_name: userFlat.block_name,
      created_by: this.state.currentUser.id,
      guest_name: params.guest_name,
      guest_phone: params.guest_phone || 'N/A',
      pass_code: passCode,
      category: params.category,
      valid_from: new Date().toISOString(),
      valid_until: new Date(Date.now() + params.valid_hours * 3600000).toISOString(),
      max_entries: 1,
      entries_used: 0,
      is_active: true,
      notes: params.notes,
      created_at: new Date().toISOString()
    };

    this.state = {
      ...this.state,
      guestPasses: [newPass, ...this.state.guestPasses]
    };

    this.saveToStorage(this.state);
    this.notify();

    // Async push to Supabase Cloud Database with automatic foreign key resolution
    if (isSupabaseConfigured && supabase) {
      const client = supabase;
      (async () => {
        try {
          // 1. Ensure the flat exists in the remote database so foreign key doesn't fail
          if (userFlat) {
            await client.from('flats').upsert({
              id: userFlat.id,
              community_id: userFlat.community_id,
              block_id: userFlat.block_id,
              flat_number: userFlat.flat_number,
              floor_number: userFlat.floor_number || 12,
              intercom_number: userFlat.intercom_number || userFlat.flat_number
            }, { onConflict: 'id' }).select();
          }

          // 2. Ensure created_by user exists in user_profiles
          const creator = this.state.currentUser;
          if (creator) {
            await client.from('user_profiles').upsert({
              id: creator.id,
              community_id: this.state.currentCommunity.id,
              full_name: creator.full_name,
              email: creator.email,
              phone: creator.phone,
              role: creator.role
            }, { onConflict: 'id' }).select();
          }

          // 3. Insert the guest pass
          const { error } = await client.from('guest_passes').insert({
            id: newPass.id,
            community_id: newPass.community_id,
            flat_id: newPass.flat_id,
            created_by: newPass.created_by,
            guest_name: newPass.guest_name,
            guest_phone: newPass.guest_phone,
            pass_code: newPass.pass_code,
            category: newPass.category,
            valid_from: newPass.valid_from,
            valid_until: newPass.valid_until,
            max_entries: newPass.max_entries,
            entries_used: newPass.entries_used,
            is_active: newPass.is_active,
            notes: newPass.notes,
            created_at: newPass.created_at
          });

          if (error) {
            console.warn('Supabase guest pass insert notice:', error.message || error.code || JSON.stringify(error));
          } else {
            console.log('✅ Guest pass synchronized with Supabase Cloud Database!');
          }
        } catch (err) {
          console.warn('Supabase guest pass sync bypassed, stored locally:', (err as Error).message);
        }
      })();
    }

    return newPass;
  }

  // Guard verifies and checks in with pre-approved guest pass
  public checkInWithGuestPass(passCode: string, gateId: string): { success: boolean; message: string; request?: VisitorRequest } {
    const cleanCode = passCode.trim();
    const pass = this.state.guestPasses.find(p => p.pass_code === cleanCode && p.is_active);

    if (!pass) {
      return { success: false, message: 'Invalid or inactive pass code.' };
    }

    const now = new Date();
    if (new Date(pass.valid_until) < now) {
      return { success: false, message: 'This guest pass has expired.' };
    }

    if (pass.entries_used >= pass.max_entries) {
      return { success: false, message: 'Pass maximum entries limit reached.' };
    }

    const gate = this.state.gates.find(g => g.id === gateId) || this.state.gates[0];

    // Create an automatically approved & checked-in visitor request
    const newRequest: VisitorRequest = {
      id: generateUUID(),
      community_id: this.state.currentCommunity.id,
      gate_id: gate.id,
      gate_name: gate.name,
      flat_id: pass.flat_id,
      flat_number: pass.flat_number,
      block_name: pass.block_name,
      guard_id: this.state.currentUser.id,
      guard_name: this.state.currentUser.full_name,
      guest_pass_id: pass.id,
      visitor_name: pass.guest_name,
      visitor_phone: pass.guest_phone || 'N/A',
      category: pass.category,
      purpose: pass.notes || 'Pre-approved guest pass entry',
      status: 'checked_in',
      consent_obtained: true,
      decision_by: pass.created_by,
      decision_by_name: 'Pre-Approved by Resident',
      decision_at: pass.created_at,
      check_in_time: new Date().toISOString(),
      checked_in_by: this.state.currentUser.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Increment entries used on pass
    const updatedPass: GuestPass = {
      ...pass,
      entries_used: pass.entries_used + 1,
      is_active: pass.entries_used + 1 < pass.max_entries
    };

    this.state = {
      ...this.state,
      visitorRequests: [newRequest, ...this.state.visitorRequests],
      guestPasses: this.state.guestPasses.map(p => p.id === pass.id ? updatedPass : p)
    };

    this.saveToStorage(this.state);
    this.notify();
    soundNotifier.playApprovalChime();

    // Async push to Supabase Cloud Database
    if (isSupabaseConfigured && supabase) {
      supabase.from('visitor_requests').insert({
        id: newRequest.id,
        community_id: newRequest.community_id,
        gate_id: newRequest.gate_id,
        flat_id: newRequest.flat_id,
        guard_id: newRequest.guard_id,
        guest_pass_id: newRequest.guest_pass_id,
        visitor_name: newRequest.visitor_name,
        visitor_phone: newRequest.visitor_phone,
        category: newRequest.category,
        purpose: newRequest.purpose,
        status: newRequest.status,
        consent_obtained: true,
        decision_by: newRequest.decision_by,
        decision_at: newRequest.decision_at,
        check_in_time: newRequest.check_in_time,
        checked_in_by: newRequest.checked_in_by,
        created_at: newRequest.created_at,
        updated_at: newRequest.updated_at
      }).then(({ error }) => {
        if (error) console.warn('Supabase pass visitor check-in notice:', error.message || error.code || JSON.stringify(error));
      });

      supabase.from('guest_passes').update({
        entries_used: updatedPass.entries_used,
        is_active: updatedPass.is_active
      }).eq('id', pass.id).then(({ error }) => {
        if (error) console.warn('Supabase pass update notice:', error.message || error.code || JSON.stringify(error));
      });
    }

    return { success: true, message: `Pass verified! Entry confirmed for ${pass.guest_name}.`, request: newRequest };
  }

  // CSV Export for Community Admin
  public exportVisitorsCSV(): string {
    const headers = [
      'Request ID',
      'Visitor Name',
      'Phone',
      'Category',
      'Flat',
      'Gate',
      'Purpose',
      'Vehicle Number',
      'Status',
      'Requested At',
      'Decision Time',
      'Approved/Rejected By',
      'Check In Time',
      'Check Out Time'
    ];

    const rows = this.state.visitorRequests.map(r => [
      r.id,
      `"${r.visitor_name.replace(/"/g, '""')}"`,
      r.visitor_phone,
      r.category,
      `"${(r.block_name || '')} - ${(r.flat_number || '')}"`,
      `"${(r.gate_name || '').replace(/"/g, '""')}"`,
      `"${(r.purpose || '').replace(/"/g, '""')}"`,
      r.vehicle_number || 'N/A',
      r.status,
      r.created_at,
      r.decision_at || '',
      `"${(r.decision_by_name || '').replace(/"/g, '""')}"`,
      r.check_in_time || '',
      r.check_out_time || ''
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  // -------------------------------------------------------------
  // DAILY HELP & DOMESTIC STAFF ACTIONS
  // -------------------------------------------------------------

  public toggleDailyHelperCheckIn(helperId: string, gateId?: string): { success: boolean; message: string; is_inside: boolean } {
    const helperIndex = this.state.dailyHelpers.findIndex(h => h.id === helperId);
    if (helperIndex === -1) {
      return { success: false, message: 'Daily helper not found', is_inside: false };
    }

    const helper = this.state.dailyHelpers[helperIndex];
    const willBeInside = !helper.is_inside;
    const nowIso = new Date().toISOString();
    const gate = this.state.gates.find(g => g.id === gateId) || this.state.gates[0];

    const updatedHelper: DailyHelper = {
      ...helper,
      is_inside: willBeInside,
      current_check_in_time: willBeInside ? nowIso : undefined
    };

    const newDailyHelpers = [...this.state.dailyHelpers];
    newDailyHelpers[helperIndex] = updatedHelper;

    let newLogs = [...this.state.dailyHelpLogs];

    if (willBeInside) {
      // Check in log
      const newLog: DailyHelpLog = {
        id: generateUUID(),
        helper_id: helper.id,
        helper_name: helper.name,
        category: helper.category,
        community_id: this.state.currentCommunity.id,
        gate_id: gate?.id || defaultGates[0].id,
        gate_name: gate?.name || 'Main Gate',
        check_in_time: nowIso,
        guard_id: this.state.currentUser.id,
        guard_name: this.state.currentUser.full_name
      };
      newLogs = [newLog, ...newLogs];
      soundNotifier.playCheckInChime();
    } else {
      // Check out: close current active log
      newLogs = newLogs.map(l => {
        if (l.helper_id === helper.id && !l.check_out_time) {
          return { ...l, check_out_time: nowIso };
        }
        return l;
      });
      soundNotifier.playBell();
    }

    // Add Audit Log
    const audit: AuditLog = {
      id: generateUUID(),
      community_id: this.state.currentCommunity.id,
      actor_id: this.state.currentUser.id,
      actor_name: this.state.currentUser.full_name,
      actor_role: this.state.currentUser.role,
      action: willBeInside ? 'DAILY_HELP_CHECK_IN' : 'DAILY_HELP_CHECK_OUT',
      entity_type: 'daily_helpers',
      entity_id: helper.id,
      metadata: { helper_name: helper.name, category: helper.category, gate: gate?.name },
      created_at: nowIso
    };

    this.state = {
      ...this.state,
      dailyHelpers: newDailyHelpers,
      dailyHelpLogs: newLogs,
      auditLogs: [audit, ...this.state.auditLogs]
    };

    this.saveToStorage(this.state);
    this.notify();

    return {
      success: true,
      message: willBeInside 
        ? `${helper.name} (${helper.category.toUpperCase()}) Checked-In at ${gate?.name || 'Gate'}`
        : `${helper.name} Checked-Out successfully`,
      is_inside: willBeInside
    };
  }

  public addDailyHelper(data: Omit<DailyHelper, 'id' | 'created_at'>): DailyHelper {
    const newHelper: DailyHelper = {
      ...data,
      id: generateUUID(),
      is_inside: false,
      created_at: new Date().toISOString()
    };

    this.state = {
      ...this.state,
      dailyHelpers: [newHelper, ...this.state.dailyHelpers]
    };

    this.saveToStorage(this.state);
    this.notify();
    return newHelper;
  }

  // -------------------------------------------------------------
  // NOTICES & ANNOUNCEMENTS ACTIONS
  // -------------------------------------------------------------

  public addNotice(data: Omit<Notice, 'id' | 'created_at'>): Notice {
    const newNotice: Notice = {
      ...data,
      id: generateUUID(),
      created_at: new Date().toISOString()
    };

    this.state = {
      ...this.state,
      notices: [newNotice, ...this.state.notices]
    };

    this.saveToStorage(this.state);
    this.notify();
    soundNotifier.playNotificationChime();
    return newNotice;
  }

  public deleteNotice(noticeId: string): void {
    this.state = {
      ...this.state,
      notices: this.state.notices.filter(n => n.id !== noticeId)
    };
    this.saveToStorage(this.state);
    this.notify();
  }

  // -------------------------------------------------------------
  // EMERGENCY SOS ACTIONS
  // -------------------------------------------------------------

  public triggerSosAlert(alertType: SosType = 'security', notes?: string): SosAlert {
    const flat = this.state.flats.find(f => f.id === this.state.currentUser.flat_id) || this.state.flats[0];

    const newAlert: SosAlert = {
      id: generateUUID(),
      community_id: this.state.currentCommunity.id,
      flat_id: flat.id,
      flat_number: flat.flat_number,
      block_name: flat.block_name || 'Tower B',
      resident_name: this.state.currentUser.full_name,
      resident_phone: this.state.currentUser.phone,
      alert_type: alertType,
      status: 'active',
      notes: notes || 'Resident triggered emergency alarm button',
      created_at: new Date().toISOString()
    };

    const audit: AuditLog = {
      id: generateUUID(),
      community_id: this.state.currentCommunity.id,
      actor_id: this.state.currentUser.id,
      actor_name: this.state.currentUser.full_name,
      actor_role: this.state.currentUser.role,
      action: 'SOS_TRIGGERED',
      entity_type: 'sos_alerts',
      entity_id: newAlert.id,
      metadata: { flat: `${newAlert.block_name} - ${newAlert.flat_number}`, type: alertType },
      created_at: newAlert.created_at
    };

    this.state = {
      ...this.state,
      sosAlerts: [newAlert, ...this.state.sosAlerts],
      auditLogs: [audit, ...this.state.auditLogs]
    };

    this.saveToStorage(this.state);
    this.notify();
    soundNotifier.playEmergencyAlarm();

    return newAlert;
  }

  public resolveSosAlert(alertId: string, status: SosStatus = 'resolved'): void {
    const nowIso = new Date().toISOString();
    this.state = {
      ...this.state,
      sosAlerts: this.state.sosAlerts.map(a => 
        a.id === alertId ? { ...a, status, resolved_by: this.state.currentUser.full_name, resolved_at: nowIso } : a
      )
    };

    this.saveToStorage(this.state);
    this.notify();
  }

  // -------------------------------------------------------------
  // FLAT & UNIT MANAGEMENT ACTIONS
  // -------------------------------------------------------------

  public addFlat(flat: Omit<Flat, 'id'> & { id?: string }): Flat {
    const flatId = flat.id || generateUUID();
    const existingIndex = this.state.flats.findIndex(f => 
      f.id === flatId || 
      (f.block_name === flat.block_name && f.flat_number === flat.flat_number)
    );

    const newFlat: Flat = {
      ...flat,
      id: existingIndex >= 0 ? this.state.flats[existingIndex].id : flatId
    };

    let updatedFlats: Flat[];
    if (existingIndex >= 0) {
      updatedFlats = [...this.state.flats];
      updatedFlats[existingIndex] = { ...updatedFlats[existingIndex], ...newFlat };
    } else {
      updatedFlats = [...this.state.flats, newFlat];
    }

    this.state = {
      ...this.state,
      flats: updatedFlats
    };

    this.saveToStorage(this.state);
    this.notify();
    return newFlat;
  }

  // Update Community Settings
  public updateCommunitySettings(params: {
    emergency_police?: string;
    emergency_ambulance?: string;
    emergency_fire?: string;
    estate_manager_phone?: string;
    visitor_retention_days?: number;
  }) {
    this.state = {
      ...this.state,
      currentCommunity: {
        ...this.state.currentCommunity,
        ...params
      }
    };
    this.saveToStorage(this.state);
    this.notify();
  }

  // Society Visitor Blacklist (US3.3.2 & US5.4.1)
  public isBlacklisted(phone: string): BlacklistEntry | null {
    if (!phone) return null;
    const cleanQuery = phone.replace(/\D/g, '');
    if (cleanQuery.length < 5) return null;
    const list = this.state.blacklist || [];
    return list.find(entry => {
      const cleanEntry = entry.visitor_phone.replace(/\D/g, '');
      return cleanEntry.endsWith(cleanQuery) || cleanQuery.endsWith(cleanEntry) || cleanEntry === cleanQuery;
    }) || null;
  }

  public addBlacklistEntry(entry: {
    visitor_name: string;
    visitor_phone: string;
    reason: string;
    created_by_name?: string;
  }): BlacklistEntry {
    const newEntry: BlacklistEntry = {
      id: generateUUID(),
      community_id: this.state.currentCommunity.id,
      visitor_name: entry.visitor_name,
      visitor_phone: entry.visitor_phone,
      reason: entry.reason,
      created_at: new Date().toISOString(),
      created_by_name: entry.created_by_name || this.state.currentUser.full_name || 'Society Estate Office'
    };

    const newLog: AuditLog = {
      id: generateUUID(),
      community_id: this.state.currentCommunity.id,
      actor_id: this.state.currentUser.id,
      actor_name: this.state.currentUser.full_name,
      actor_role: this.state.currentUser.role,
      action: 'ADD_TO_BLACKLIST',
      entity_type: 'blacklist',
      entity_id: newEntry.id,
      metadata: { visitor: newEntry.visitor_name, phone: newEntry.visitor_phone, reason: newEntry.reason },
      created_at: new Date().toISOString()
    };

    this.state = {
      ...this.state,
      blacklist: [newEntry, ...(this.state.blacklist || [])],
      auditLogs: [newLog, ...this.state.auditLogs]
    };

    this.saveToStorage(this.state);
    this.notify();
    return newEntry;
  }

  public removeBlacklistEntry(id: string): boolean {
    const target = (this.state.blacklist || []).find(b => b.id === id);
    if (!target) return false;

    const newLog: AuditLog = {
      id: generateUUID(),
      community_id: this.state.currentCommunity.id,
      actor_id: this.state.currentUser.id,
      actor_name: this.state.currentUser.full_name,
      actor_role: this.state.currentUser.role,
      action: 'REMOVE_FROM_BLACKLIST',
      entity_type: 'blacklist',
      entity_id: id,
      metadata: { visitor: target.visitor_name, phone: target.visitor_phone },
      created_at: new Date().toISOString()
    };

    this.state = {
      ...this.state,
      blacklist: (this.state.blacklist || []).filter(b => b.id !== id),
      auditLogs: [newLog, ...this.state.auditLogs]
    };

    this.saveToStorage(this.state);
    this.notify();
    return true;
  }

  // Dynamic User & Role Management (CRUD)
  public async createUser(params: {
    full_name: string;
    email: string;
    phone: string;
    role: UserRole;
    resident_type?: 'owner' | 'tenant' | 'family';
    flat_id?: string;
    flat_display?: string;
    password?: string;
    community_id?: string;
  }): Promise<{ user: UserProfile; error?: string; supabaseSynced?: boolean }> {
    const cleanEmail = params.email.trim().toLowerCase();
    const existing = this.state.users.find(u => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      return { user: existing, error: 'User with this email already exists', supabaseSynced: false };
    }

    let authUserId = generateUUID();
    let supabaseSuccess = false;

    // Use isolated Supabase client without session persistence to create user in auth.users
    // without hijacking the active admin's current browser session
    const isolatedClient = createIsolatedAuthClient();
    if (isolatedClient && params.password) {
      try {
        const { data, error } = await isolatedClient.auth.signUp({
          email: cleanEmail,
          password: params.password,
          options: {
            data: {
              full_name: params.full_name.trim(),
              phone: params.phone.trim(),
              role: params.role,
              resident_type: params.resident_type || (params.role === 'resident' ? 'owner' : undefined),
              community_id: params.community_id || this.state.currentCommunity.id
            }
          }
        });
        if (error) {
          console.warn('Supabase Auth signUp notice:', error.message);
        } else if (data?.user?.id) {
          authUserId = data.user.id;
          supabaseSuccess = true;
        }
      } catch (err) {
        console.warn('Supabase signup bypass:', err);
      }
    }

    const flat = params.flat_id ? this.state.flats.find(f => f.id === params.flat_id) : undefined;
    const computedFlatDisplay = flat ? `${flat.block_name || 'Tower A'} • Floor ${flat.floor_number} • Flat ${flat.flat_number}` : undefined;
    const finalFlatDisplay = params.flat_display || computedFlatDisplay;

    const newUser: UserProfile = {
      id: authUserId,
      community_id: params.community_id || this.state.currentCommunity.id,
      full_name: params.full_name.trim(),
      email: cleanEmail,
      phone: params.phone.trim(),
      role: params.role,
      resident_type: params.resident_type || (params.role === 'resident' ? 'owner' : undefined),
      flat_id: params.flat_id,
      flat_display: finalFlatDisplay,
      owned_flat_ids: params.flat_id ? [params.flat_id] : [],
      notification_push_enabled: true,
      notification_sms_enabled: false,
      notification_sound_enabled: true,
      is_active: true
    };

    const newLog: AuditLog = {
      id: generateUUID(),
      community_id: this.state.currentCommunity.id,
      actor_id: this.state.currentUser.id,
      actor_name: this.state.currentUser.full_name,
      actor_role: this.state.currentUser.role,
      action: 'CREATE_USER',
      entity_type: 'user_profiles',
      entity_id: newUser.id,
      metadata: { 
        full_name: newUser.full_name, 
        email: newUser.email, 
        role: newUser.role,
        resident_type: newUser.resident_type,
        supabase_synced: supabaseSuccess
      },
      created_at: new Date().toISOString()
    };

    let updatedFlats = [...this.state.flats];
    if (params.flat_id && newUser.role === 'resident') {
      const flatIndex = updatedFlats.findIndex(f => 
        f.id === params.flat_id || 
        (finalFlatDisplay && finalFlatDisplay.includes(`Flat ${f.flat_number}`))
      );
      if (flatIndex >= 0) {
        const targetFlat = { ...updatedFlats[flatIndex] };
        targetFlat.is_occupied = true;
        if (newUser.resident_type === 'tenant') {
          targetFlat.occupancy_type = 'rented';
          targetFlat.tenant_name = newUser.full_name;
          targetFlat.tenant_phone = newUser.phone;
          targetFlat.primary_resident_name = newUser.full_name;
          targetFlat.primary_resident_phone = newUser.phone;
        } else {
          targetFlat.owner_name = newUser.full_name;
          if (targetFlat.occupancy_type !== 'rented') {
            targetFlat.occupancy_type = 'self_occupied';
            targetFlat.primary_resident_name = newUser.full_name;
            targetFlat.primary_resident_phone = newUser.phone;
          }
        }
        updatedFlats[flatIndex] = targetFlat;
      }
    }

    this.state = {
      ...this.state,
      flats: updatedFlats,
      users: [...this.state.users, newUser],
      auditLogs: [newLog, ...this.state.auditLogs]
    };

    this.saveToStorage(this.state);
    this.notify();

    // Direct push to Supabase public.user_profiles & public.flat_residents
    if (isSupabaseConfigured && supabase) {
      try {
        const { error: profileErr } = await supabase.from('user_profiles').upsert({
          id: newUser.id,
          community_id: newUser.community_id,
          full_name: newUser.full_name,
          email: newUser.email,
          phone: newUser.phone,
          role: newUser.role,
          is_active: true
        });
        if (!profileErr) {
          supabaseSuccess = true;
        } else {
          console.warn('Supabase user profile sync error:', profileErr.message);
        }

        if (params.flat_id) {
          await supabase.from('flat_residents').upsert({
            flat_id: params.flat_id,
            user_id: newUser.id,
            is_primary_owner: newUser.role === 'resident' && newUser.resident_type !== 'tenant',
            is_approved: true
          });
        }
      } catch (e) {
        console.warn('Supabase profile/flat sync exception:', e);
      }
    }

    return { user: newUser, supabaseSynced: supabaseSuccess };
  }

  public async updateUser(userId: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
    const existing = this.state.users.find(u => u.id === userId);
    if (!existing) return null;

    let flatDisplay = existing.flat_display;
    if (updates.flat_id && updates.flat_id !== existing.flat_id) {
      const flat = this.state.flats.find(f => f.id === updates.flat_id);
      if (flat) {
        flatDisplay = `${flat.block_name || 'Tower A'} • Floor ${flat.floor_number} • Flat ${flat.flat_number}`;
      }
    }

    const updated: UserProfile = {
      ...existing,
      ...updates,
      flat_display: flatDisplay,
      owned_flat_ids: updates.flat_id ? [updates.flat_id] : existing.owned_flat_ids
    };

    const newLog: AuditLog = {
      id: generateUUID(),
      community_id: this.state.currentCommunity.id,
      actor_id: this.state.currentUser.id,
      actor_name: this.state.currentUser.full_name,
      actor_role: this.state.currentUser.role,
      action: 'UPDATE_USER',
      entity_type: 'user_profiles',
      entity_id: userId,
      metadata: { updates },
      created_at: new Date().toISOString()
    };

    this.state = {
      ...this.state,
      users: this.state.users.map(u => u.id === userId ? updated : u),
      currentUser: this.state.currentUser.id === userId ? updated : this.state.currentUser,
      auditLogs: [newLog, ...this.state.auditLogs]
    };

    this.saveToStorage(this.state);
    this.notify();

    // Async push to Supabase
    if (isSupabaseConfigured && supabase) {
      supabase.from('user_profiles').update({
        full_name: updated.full_name,
        phone: updated.phone,
        role: updated.role,
        is_active: updated.is_active
      }).eq('id', userId).then(({ error }) => {
        if (error) console.warn('Supabase update user error:', error.message);
      });
    }

    return updated;
  }

  public async deleteUser(userId: string): Promise<boolean> {
    const target = this.state.users.find(u => u.id === userId);
    if (!target) return false;

    // Safety: Cannot delete current logged in user
    if (this.state.currentUser.id === userId) {
      return false;
    }

    const newLog: AuditLog = {
      id: generateUUID(),
      community_id: this.state.currentCommunity.id,
      actor_id: this.state.currentUser.id,
      actor_name: this.state.currentUser.full_name,
      actor_role: this.state.currentUser.role,
      action: 'DELETE_USER',
      entity_type: 'user_profiles',
      entity_id: userId,
      metadata: { email: target.email, role: target.role, name: target.full_name },
      created_at: new Date().toISOString()
    };

    this.state = {
      ...this.state,
      users: this.state.users.filter(u => u.id !== userId),
      auditLogs: [newLog, ...this.state.auditLogs]
    };

    this.saveToStorage(this.state);
    this.notify();

    // Async delete from Supabase
    if (isSupabaseConfigured && supabase) {
      const client = supabase;
      client.from('flat_residents').delete().eq('user_id', userId).then(() => {
        client.from('user_profiles').delete().eq('id', userId).then(({ error }) => {
          if (error) console.warn('Supabase delete user error:', error.message);
        });
      });
    }

    return true;
  }
}

// Singleton instance
export const appStore = new AppStore();
