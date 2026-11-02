-- Gateway Security: Apartment Visitor Management System
-- Migration 01: Initial Database Schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enum types
CREATE TYPE user_role AS ENUM (
    'super_admin',
    'community_admin',
    'security_guard',
    'resident',
    'family_member'
);

CREATE TYPE visitor_status AS ENUM (
    'pending',
    'approved',
    'rejected',
    'expired',
    'cancelled',
    'checked_in',
    'checked_out'
);

CREATE TYPE visitor_category AS ENUM (
    'guest',
    'delivery',
    'cab',
    'service',
    'daily_staff'
);

-- 1. Communities (Tenants)
CREATE TABLE IF NOT EXISTS communities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    emergency_police VARCHAR(20) DEFAULT '112',
    emergency_ambulance VARCHAR(20) DEFAULT '108',
    emergency_fire VARCHAR(20) DEFAULT '101',
    estate_manager_phone VARCHAR(20) NOT NULL,
    visitor_retention_days INT DEFAULT 90,
    branding_logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Gates
CREATE TABLE IF NOT EXISTS gates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    gate_type VARCHAR(50) DEFAULT 'main', -- 'main', 'service', 'pedestrian', 'rear'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Buildings / Blocks
CREATE TABLE IF NOT EXISTS buildings_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- e.g. 'Block A - Lavender', 'Tower 3'
    total_floors INT NOT NULL DEFAULT 14,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Flats / Apartments
CREATE TABLE IF NOT EXISTS flats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    block_id UUID NOT NULL REFERENCES buildings_blocks(id) ON DELETE CASCADE,
    flat_number VARCHAR(50) NOT NULL, -- e.g. '402', '1201'
    floor_number INT NOT NULL,
    intercom_number VARCHAR(50),
    is_occupied BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(block_id, flat_number)
);

-- 5. User Profiles (Extends auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    community_id UUID REFERENCES communities(id) ON DELETE SET NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    role user_role NOT NULL DEFAULT 'resident',
    avatar_url TEXT,
    notification_push_enabled BOOLEAN DEFAULT TRUE,
    notification_sms_enabled BOOLEAN DEFAULT FALSE,
    notification_sound_enabled BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Flat Resident Association (residents and family members mapped to flats)
CREATE TABLE IF NOT EXISTS flat_residents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flat_id UUID NOT NULL REFERENCES flats(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    is_primary_owner BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(flat_id, user_id)
);

-- 7. Pre-approved Guest Passes
CREATE TABLE IF NOT EXISTS guest_passes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    flat_id UUID NOT NULL REFERENCES flats(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    guest_name VARCHAR(255) NOT NULL,
    guest_phone VARCHAR(20),
    pass_code VARCHAR(10) NOT NULL, -- 6-digit PIN / OTP
    category visitor_category DEFAULT 'guest',
    valid_from TIMESTAMPTZ NOT NULL,
    valid_until TIMESTAMPTZ NOT NULL,
    max_entries INT DEFAULT 1,
    entries_used INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Visitor Requests & Logs
CREATE TABLE IF NOT EXISTS visitor_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    gate_id UUID REFERENCES gates(id) ON DELETE SET NULL,
    flat_id UUID NOT NULL REFERENCES flats(id) ON DELETE RESTRICT,
    guard_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    guest_pass_id UUID REFERENCES guest_passes(id) ON DELETE SET NULL,
    
    -- Visitor Information
    visitor_name VARCHAR(255) NOT NULL,
    visitor_phone VARCHAR(20) NOT NULL,
    visitor_photo_path TEXT, -- storage path in private 'visitor-photos' bucket
    category visitor_category NOT NULL DEFAULT 'guest',
    delivery_company VARCHAR(100),
    purpose VARCHAR(255) NOT NULL,
    vehicle_number VARCHAR(50),
    
    -- Status and Lifecycle
    status visitor_status NOT NULL DEFAULT 'pending',
    consent_obtained BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Decision Info
    decision_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    decision_at TIMESTAMPTZ,
    rejection_reason TEXT,
    
    -- Check-in / Check-out timestamps
    check_in_time TIMESTAMPTZ,
    check_out_time TIMESTAMPTZ,
    checked_in_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    checked_out_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    
    -- Escalation
    supervisor_escalated BOOLEAN DEFAULT FALSE,
    supervisor_notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL, -- 'REGISTER_VISITOR', 'APPROVE_VISITOR', 'REJECT_VISITOR', 'CHECK_IN', 'CHECK_OUT', 'UPDATE_SETTINGS'
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for optimal queries & tenant isolation
CREATE INDEX IF NOT EXISTS idx_visitor_requests_community ON visitor_requests(community_id);
CREATE INDEX IF NOT EXISTS idx_visitor_requests_flat ON visitor_requests(flat_id);
CREATE INDEX IF NOT EXISTS idx_visitor_requests_status ON visitor_requests(status);
CREATE INDEX IF NOT EXISTS idx_visitor_requests_created_at ON visitor_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_flat_residents_flat ON flat_residents(flat_id);
CREATE INDEX IF NOT EXISTS idx_flat_residents_user ON flat_residents(user_id);
CREATE INDEX IF NOT EXISTS idx_guest_passes_code ON guest_passes(pass_code);
CREATE INDEX IF NOT EXISTS idx_audit_logs_community ON audit_logs(community_id);
