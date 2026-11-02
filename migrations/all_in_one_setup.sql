-- ============================================================================
-- GATEWAY SECURITY (द्वारपाल) — ALL-IN-ONE SUPABASE DATABASE SETUP
-- ============================================================================
-- Copy and paste this ENTIRE script into your Supabase Dashboard:
-- SQL Editor -> New Query -> Paste -> Click "RUN"
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. ENUMS
-- ----------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM (
        'super_admin',
        'community_admin',
        'security_guard',
        'resident',
        'family_member'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE visitor_status AS ENUM (
        'pending',
        'approved',
        'rejected',
        'expired',
        'cancelled',
        'checked_in',
        'checked_out'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE visitor_category AS ENUM (
        'guest',
        'delivery',
        'cab',
        'service',
        'daily_staff'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ----------------------------------------------------------------------------
-- 2. TABLES
-- ----------------------------------------------------------------------------

-- Communities (Tenants)
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

-- Gates
CREATE TABLE IF NOT EXISTS gates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    gate_type VARCHAR(50) DEFAULT 'main',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Buildings / Blocks
CREATE TABLE IF NOT EXISTS buildings_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    total_floors INT NOT NULL DEFAULT 14,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Flats / Apartments
CREATE TABLE IF NOT EXISTS flats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    block_id UUID NOT NULL REFERENCES buildings_blocks(id) ON DELETE CASCADE,
    flat_number VARCHAR(50) NOT NULL,
    floor_number INT NOT NULL,
    intercom_number VARCHAR(50),
    is_occupied BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(block_id, flat_number)
);

-- User Profiles (Works both with Supabase auth.users or direct profiles)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Flat Resident Mapping
CREATE TABLE IF NOT EXISTS flat_residents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flat_id UUID NOT NULL REFERENCES flats(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    is_primary_owner BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(flat_id, user_id)
);

-- Pre-approved Guest Passes
CREATE TABLE IF NOT EXISTS guest_passes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    flat_id UUID NOT NULL REFERENCES flats(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    guest_name VARCHAR(255) NOT NULL,
    guest_phone VARCHAR(20),
    pass_code VARCHAR(10) NOT NULL,
    category visitor_category DEFAULT 'guest',
    valid_from TIMESTAMPTZ NOT NULL,
    valid_until TIMESTAMPTZ NOT NULL,
    max_entries INT DEFAULT 1,
    entries_used INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Visitor Requests & Logs
CREATE TABLE IF NOT EXISTS visitor_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    gate_id UUID REFERENCES gates(id) ON DELETE SET NULL,
    flat_id UUID NOT NULL REFERENCES flats(id) ON DELETE RESTRICT,
    guard_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    guest_pass_id UUID REFERENCES guest_passes(id) ON DELETE SET NULL,
    
    visitor_name VARCHAR(255) NOT NULL,
    visitor_phone VARCHAR(20) NOT NULL,
    visitor_photo_path TEXT,
    category visitor_category NOT NULL DEFAULT 'guest',
    delivery_company VARCHAR(100),
    purpose VARCHAR(255) NOT NULL,
    vehicle_number VARCHAR(50),
    
    status visitor_status NOT NULL DEFAULT 'pending',
    consent_obtained BOOLEAN NOT NULL DEFAULT TRUE,
    
    decision_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    decision_at TIMESTAMPTZ,
    rejection_reason TEXT,
    
    check_in_time TIMESTAMPTZ,
    check_out_time TIMESTAMPTZ,
    checked_in_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    checked_out_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    
    supervisor_escalated BOOLEAN DEFAULT FALSE,
    supervisor_notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_visitor_requests_community ON visitor_requests(community_id);
CREATE INDEX IF NOT EXISTS idx_visitor_requests_flat ON visitor_requests(flat_id);
CREATE INDEX IF NOT EXISTS idx_visitor_requests_status ON visitor_requests(status);
CREATE INDEX IF NOT EXISTS idx_visitor_requests_created_at ON visitor_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_flat_residents_flat ON flat_residents(flat_id);
CREATE INDEX IF NOT EXISTS idx_flat_residents_user ON flat_residents(user_id);
CREATE INDEX IF NOT EXISTS idx_guest_passes_code ON guest_passes(pass_code);
CREATE INDEX IF NOT EXISTS idx_audit_logs_community ON audit_logs(community_id);

-- ----------------------------------------------------------------------------
-- 3. SEED INITIAL COMMUNITY DATA (Prestige Lakeside Habitat, Bengaluru)
-- ----------------------------------------------------------------------------

-- Community
INSERT INTO communities (
    id, name, code, address, city, state, pincode,
    emergency_police, emergency_ambulance, emergency_fire,
    estate_manager_phone, visitor_retention_days
) VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Prestige Lakeside Habitat',
    'PLH-BLR',
    'Varthur Main Road, Whitefield',
    'Bengaluru',
    'Karnataka',
    '560087',
    '112',
    '108',
    '101',
    '+91 98450 12345',
    90
) ON CONFLICT (code) DO NOTHING;

-- Gates
INSERT INTO gates (id, community_id, name, gate_type, is_active) VALUES
    ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Main North Gate 1 (Visitor Entry & Cabs)', 'main', true),
    ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'South Service Gate 2 (Deliveries & Logistics)', 'service', true),
    ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'East Pedestrian Gate 3', 'pedestrian', true)
ON CONFLICT DO NOTHING;

-- Blocks
INSERT INTO buildings_blocks (id, community_id, name, total_floors) VALUES
    ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Tower A - Aster', 14),
    ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Tower B - Begonia', 14),
    ('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Tower C - Carnation', 18),
    ('c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Tower D - Daffodil', 18)
ON CONFLICT DO NOTHING;

-- Flats
INSERT INTO flats (id, community_id, block_id, flat_number, floor_number, intercom_number) VALUES
    ('d0000000-0000-0000-0000-000000000402', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', '402', 4, '2402'),
    ('d0000000-0000-0000-0000-000000000403', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', '403', 4, '2403'),
    ('d0000000-0000-0000-0000-000000000701', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', '701', 7, '2701'),
    ('d0000000-0000-0000-0000-000000001102', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', '1102', 11, '3102'),
    ('d0000000-0000-0000-0000-000000000102', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', '102', 1, '1102'),
    ('d0000000-0000-0000-0000-000000000301', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', '301', 3, '1301'),
    ('d0000000-0000-0000-0000-000000000801', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', '801', 8, '3801')
ON CONFLICT (block_id, flat_number) DO NOTHING;

-- Demo User Profiles
INSERT INTO user_profiles (id, community_id, full_name, email, phone, role) VALUES
    ('e0000000-0000-0000-0000-000000000001', NULL, 'Dev Administrator', 'superadmin@gatewaysecurity.in', '+91 99000 00001', 'super_admin'),
    ('e0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Rajesh Iyer (Estate Mgr)', 'rajesh.admin@prestige.in', '+91 98450 12345', 'community_admin'),
    ('e0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Ramesh Kumar (Gate 1)', 'ramesh.guard@prestige.in', '+91 98765 43210', 'security_guard'),
    ('e0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Ananya Sharma (Owner B-402)', 'ananya.sharma@gmail.com', '+91 98111 22334', 'resident'),
    ('e0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'Vikram Sharma (Family B-402)', 'vikram.sharma@gmail.com', '+91 98111 22335', 'family_member'),
    ('e0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'Arun Nair (Owner A-102)', 'arun.nair@outlook.com', '+91 97222 33445', 'resident')
ON CONFLICT (id) DO NOTHING;

-- Flat-Resident Associations
INSERT INTO flat_residents (flat_id, user_id, is_primary_owner, is_approved) VALUES
    ('d0000000-0000-0000-0000-000000000402', 'e0000000-0000-0000-0000-000000000004', true, true),
    ('d0000000-0000-0000-0000-000000000402', 'e0000000-0000-0000-0000-000000000005', false, true),
    ('d0000000-0000-0000-0000-000000000102', 'e0000000-0000-0000-0000-000000000006', true, true)
ON CONFLICT (flat_id, user_id) DO NOTHING;

-- Seed Active Guest Pass (PIN: 847291)
INSERT INTO guest_passes (
    id, community_id, flat_id, created_by,
    guest_name, guest_phone, pass_code, category,
    valid_from, valid_until, max_entries, entries_used, notes
) VALUES (
    'f0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000402',
    'e0000000-0000-0000-0000-000000000004',
    'Kavita Deshmukh',
    '+91 99887 76655',
    '847291',
    'guest',
    NOW() - INTERVAL '1 hour',
    NOW() + INTERVAL '12 hours',
    2,
    0,
    'Family dinner guest'
) ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 4. PRIVATE STORAGE BUCKET FOR VISITOR PHOTOS
-- ----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'visitor-photos',
    'visitor-photos',
    false,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- ----------------------------------------------------------------------------
-- 5. REALTIME WEBSOCKET PUBLICATION & MULTI-DEVICE ACCESS
-- ----------------------------------------------------------------------------

-- Enable Full Replica Identity so updates broadcast complete row data
ALTER TABLE visitor_requests REPLICA IDENTITY FULL;
ALTER TABLE guest_passes REPLICA IDENTITY FULL;
ALTER TABLE audit_logs REPLICA IDENTITY FULL;

-- Add Tables to Supabase Realtime Publication
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'visitor_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE visitor_requests;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'guest_passes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE guest_passes;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'audit_logs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE audit_logs;
  END IF;
END $$;

-- Enable Row Level Security (RLS)
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE gates ENABLE ROW LEVEL SECURITY;
ALTER TABLE buildings_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE flats ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE flat_residents ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitor_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Grants for seamless Multi-Device Testing across phones, tablets, and desktops
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE visitor_requests TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE guest_passes TO anon, authenticated;
GRANT SELECT, INSERT ON TABLE audit_logs TO anon, authenticated;
GRANT SELECT ON TABLE communities, gates, buildings_blocks, flats, user_profiles, flat_residents TO anon, authenticated;

-- Policies for Realtime Access
DO $$ BEGIN
  -- Visitor Requests
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Live Multi-Device Select Visitor Requests' AND tablename = 'visitor_requests') THEN
    CREATE POLICY "Live Multi-Device Select Visitor Requests" ON visitor_requests FOR SELECT TO anon, authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Live Multi-Device Insert Visitor Requests' AND tablename = 'visitor_requests') THEN
    CREATE POLICY "Live Multi-Device Insert Visitor Requests" ON visitor_requests FOR INSERT TO anon, authenticated WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Live Multi-Device Update Visitor Requests' AND tablename = 'visitor_requests') THEN
    CREATE POLICY "Live Multi-Device Update Visitor Requests" ON visitor_requests FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
  END IF;

  -- Guest Passes
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Live Multi-Device Select Guest Passes' AND tablename = 'guest_passes') THEN
    CREATE POLICY "Live Multi-Device Select Guest Passes" ON guest_passes FOR SELECT TO anon, authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Live Multi-Device Insert Guest Passes' AND tablename = 'guest_passes') THEN
    CREATE POLICY "Live Multi-Device Insert Guest Passes" ON guest_passes FOR INSERT TO anon, authenticated WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Live Multi-Device Update Guest Passes' AND tablename = 'guest_passes') THEN
    CREATE POLICY "Live Multi-Device Update Guest Passes" ON guest_passes FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
  END IF;

  -- Catalog Tables
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Live View Communities' AND tablename = 'communities') THEN
    CREATE POLICY "Live View Communities" ON communities FOR SELECT TO anon, authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Live View Gates' AND tablename = 'gates') THEN
    CREATE POLICY "Live View Gates" ON gates FOR SELECT TO anon, authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Live View Blocks' AND tablename = 'buildings_blocks') THEN
    CREATE POLICY "Live View Blocks" ON buildings_blocks FOR SELECT TO anon, authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Live View Flats' AND tablename = 'flats') THEN
    CREATE POLICY "Live View Flats" ON flats FOR SELECT TO anon, authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Live View User Profiles' AND tablename = 'user_profiles') THEN
    CREATE POLICY "Live View User Profiles" ON user_profiles FOR SELECT TO anon, authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Live View Flat Residents' AND tablename = 'flat_residents') THEN
    CREATE POLICY "Live View Flat Residents" ON flat_residents FOR SELECT TO anon, authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Live View Audit Logs' AND tablename = 'audit_logs') THEN
    CREATE POLICY "Live View Audit Logs" ON audit_logs FOR SELECT TO anon, authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Live Insert Audit Logs' AND tablename = 'audit_logs') THEN
    CREATE POLICY "Live Insert Audit Logs" ON audit_logs FOR INSERT TO anon, authenticated WITH CHECK (true);
  END IF;
END $$;

-- Storage object policies for visitor photos
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Live Upload Visitor Photos' AND tablename = 'objects' AND schemaname = 'storage') THEN
    CREATE POLICY "Live Upload Visitor Photos" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'visitor-photos');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Live Read Visitor Photos' AND tablename = 'objects' AND schemaname = 'storage') THEN
    CREATE POLICY "Live Read Visitor Photos" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'visitor-photos');
  END IF;
END $$;

-- Done!
SELECT 'Gateway Security Database initialized successfully!' AS status;
