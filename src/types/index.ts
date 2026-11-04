// Gateway Security: Core TypeScript Type Definitions

export type UserRole = 
  | 'super_admin' 
  | 'community_admin' 
  | 'security_guard' 
  | 'resident' 
  | 'family_member';

export type VisitorStatus = 
  | 'pending' 
  | 'approved' 
  | 'rejected' 
  | 'leave_at_gate'
  | 'collected'
  | 'expired' 
  | 'cancelled' 
  | 'checked_in' 
  | 'checked_out';

export type VisitorCategory = 
  | 'guest' 
  | 'delivery' 
  | 'cab' 
  | 'service' 
  | 'daily_staff';

export type DeliveryCategory = 
  | 'food' 
  | 'courier' 
  | 'grocery' 
  | 'e_commerce' 
  | 'other';

export interface Community {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  emergency_police: string;
  emergency_ambulance: string;
  emergency_fire: string;
  estate_manager_phone: string;
  visitor_retention_days: number;
  branding_logo_url?: string;
  created_at: string;
}

export interface Gate {
  id: string;
  community_id: string;
  name: string;
  gate_type: 'main' | 'service' | 'pedestrian' | 'rear';
  is_active: boolean;
}

export interface BuildingBlock {
  id: string;
  community_id: string;
  name: string;
  total_floors: number;
}

export interface Flat {
  id: string;
  community_id: string;
  block_id: string;
  block_name?: string;
  flat_number: string;
  floor_number: number;
  intercom_number?: string;
  is_occupied: boolean;
  occupancy_type?: 'self_occupied' | 'rented' | 'vacant';
  primary_resident_name?: string;
  primary_resident_phone?: string;
  tenant_name?: string;
  tenant_phone?: string;
  lease_end_date?: string;
  monthly_rent?: number;
  maintenance_amount?: number;
  maintenance_status?: 'paid' | 'pending';
  owner_name?: string;
}

export interface UserProfile {
  id: string;
  community_id: string | null;
  full_name: string;
  email: string;
  phone: string;
  role: UserRole;
  resident_type?: 'owner' | 'tenant' | 'family';
  avatar_url?: string;
  flat_id?: string;
  flat_display?: string;
  owned_flat_ids?: string[];
  notification_push_enabled: boolean;
  notification_sms_enabled: boolean;
  notification_sound_enabled: boolean;
  is_active: boolean;
}

export interface FlatResident {
  id: string;
  flat_id: string;
  user_id: string;
  is_primary_owner: boolean;
  is_approved: boolean;
  user?: UserProfile;
}

export interface GuestPass {
  id: string;
  community_id: string;
  flat_id: string;
  created_by: string;
  guest_name: string;
  guest_phone: string;
  pass_code: string; // 6-digit PIN
  category: VisitorCategory;
  valid_from: string;
  valid_until: string;
  max_entries: number;
  entries_used: number;
  is_active: boolean;
  notes?: string;
  flat_number?: string;
  block_name?: string;
  created_at: string;
}

export interface VisitorRequest {
  id: string;
  community_id: string;
  gate_id: string;
  gate_name?: string;
  flat_id: string;
  flat_number?: string;
  block_name?: string;
  guard_id: string;
  guard_name?: string;
  guest_pass_id?: string;

  // Visitor info
  visitor_name: string;
  visitor_phone: string;
  visitor_photo_path?: string; // Data URL or Supabase storage path
  category: VisitorCategory;
  delivery_category?: DeliveryCategory; // food, courier, grocery, e_commerce, other
  delivery_company?: string; // Swiggy, Zomato, Amazon, Blinkit, etc.
  purpose: string;
  vehicle_number?: string;
  visitor_count?: number;

  // Parcel & Leave at Gate Tracking
  parcel_count?: number;
  parcel_details?: string;
  parcel_photo_path?: string;
  gate_location?: string;
  handover_status?: 'at_gate' | 'collected';
  collection_otp?: string;
  collected_at?: string;
  collected_by?: string;
  collected_by_name?: string;
  handover_guard_id?: string;
  handover_guard_name?: string;

  // Lifecycle
  status: VisitorStatus;
  consent_obtained: boolean;

  // Decisions
  decision_by?: string;
  decision_by_name?: string;
  decision_at?: string;
  rejection_reason?: string;

  // Check-in / out
  check_in_time?: string;
  check_out_time?: string;
  checked_in_by?: string;
  checked_out_by?: string;

  // Escalations
  supervisor_escalated?: boolean;
  supervisor_notes?: string;
  call_requested?: boolean;
  call_requested_at?: string;

  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  community_id: string;
  actor_id: string;
  actor_name: string;
  actor_role: UserRole;
  action: string;
  entity_type: string;
  entity_id?: string;
  metadata?: Record<string, unknown>;
  ip_address?: string;
  created_at: string;
}

// -------------------------------------------------------------
// DAILY HELP & DOMESTIC STAFF
// -------------------------------------------------------------

export type DailyHelpCategory = 
  | 'maid' 
  | 'cook' 
  | 'driver' 
  | 'car_cleaner' 
  | 'electrician' 
  | 'plumber' 
  | 'gardener' 
  | 'other';

export interface DailyHelper {
  id: string;
  community_id: string;
  name: string;
  phone: string;
  category: DailyHelpCategory;
  pass_code: string; // 4-digit fast-entry PIN
  photo_url?: string;
  assigned_flat_ids: string[];
  is_active: boolean;
  is_inside?: boolean;
  current_check_in_time?: string;
  created_at: string;
}

export interface DailyHelpLog {
  id: string;
  helper_id: string;
  helper_name: string;
  category: DailyHelpCategory;
  community_id: string;
  gate_id: string;
  gate_name?: string;
  check_in_time: string;
  check_out_time?: string;
  guard_id: string;
  guard_name?: string;
}

// -------------------------------------------------------------
// NOTICES & ANNOUNCEMENTS
// -------------------------------------------------------------

export type NoticeCategory = 'general' | 'maintenance' | 'emergency' | 'event';

export interface Notice {
  id: string;
  community_id: string;
  title: string;
  content: string;
  category: NoticeCategory;
  is_pinned: boolean;
  author_id: string;
  author_name: string;
  created_at: string;
  expires_at?: string;
}

// -------------------------------------------------------------
// SOS & EMERGENCY ALERTS
// -------------------------------------------------------------

export type SosType = 'medical' | 'fire' | 'lift_entrapment' | 'security' | 'other';
export type SosStatus = 'active' | 'resolved' | 'false_alarm';

export interface SosAlert {
  id: string;
  community_id: string;
  flat_id: string;
  flat_number: string;
  block_name: string;
  resident_name: string;
  resident_phone: string;
  alert_type: SosType;
  status: SosStatus;
  notes?: string;
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
}

// State transition validation helper
export function isValidStatusTransition(current: VisitorStatus, next: VisitorStatus): boolean {
  switch (current) {
    case 'pending':
      return ['approved', 'rejected', 'leave_at_gate', 'expired', 'cancelled'].includes(next);
    case 'approved':
      return ['checked_in', 'expired', 'cancelled'].includes(next);
    case 'checked_in':
      return next === 'checked_out';
    case 'leave_at_gate':
      return ['collected', 'cancelled'].includes(next);
    case 'rejected':
    case 'expired':
    case 'cancelled':
    case 'checked_out':
    case 'collected':
      return false; // Terminal states
    default:
      return false;
  }
}

// BLACKLIST & BANNED VISITORS (Phase 1 US3.3.2 & US5.4.1)
export interface BlacklistEntry {
  id: string;
  community_id: string;
  visitor_name: string;
  visitor_phone: string;
  reason: string;
  created_at: string;
  created_by_name: string;
}
