-- Gateway Security: Apartment Visitor Management System
-- Migration 03: Seed Data (Prestige Lakeside Habitat, Bengaluru)

-- 1. Insert Community
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

-- 2. Insert Gates
INSERT INTO gates (id, community_id, name, gate_type, is_active) VALUES
    ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Main North Gate 1 (Visitor Entry & Cabs)', 'main', true),
    ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'South Service Gate 2 (Deliveries & Logistics)', 'service', true),
    ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'East Pedestrian Gate 3', 'pedestrian', true)
ON CONFLICT DO NOTHING;

-- 3. Insert Blocks
INSERT INTO buildings_blocks (id, community_id, name, total_floors) VALUES
    ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Tower A - Aster', 14),
    ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Tower B - Begonia', 14),
    ('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Tower C - Carnation', 18),
    ('c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Tower D - Daffodil', 18)
ON CONFLICT DO NOTHING;

-- 4. Insert Flats
INSERT INTO flats (id, community_id, block_id, flat_number, floor_number, intercom_number) VALUES
    -- Tower B
    ('d0000000-0000-0000-0000-000000000402', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', '402', 4, '2402'),
    ('d0000000-0000-0000-0000-000000000403', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', '403', 4, '2403'),
    ('d0000000-0000-0000-0000-000000000701', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', '701', 7, '2701'),
    ('d0000000-0000-0000-0000-000000001102', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', '1102', 11, '3102'),
    -- Tower A
    ('d0000000-0000-0000-0000-000000000102', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', '102', 1, '1102'),
    ('d0000000-0000-0000-0000-000000000301', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', '301', 3, '1301'),
    -- Tower C
    ('d0000000-0000-0000-0000-000000000801', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', '801', 8, '3801')
ON CONFLICT (block_id, flat_number) DO NOTHING;

-- 5. Insert Profiles (Demo Users)
-- In live Supabase, these link with auth.users id
INSERT INTO user_profiles (id, community_id, full_name, email, phone, role) VALUES
    ('e0000000-0000-0000-0000-000000000001', NULL, 'Dev Administrator', 'superadmin@gatewaysecurity.in', '+91 99000 00001', 'super_admin'),
    ('e0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Rajesh Iyer (Estate Mgr)', 'rajesh.admin@prestige.in', '+91 98450 12345', 'community_admin'),
    ('e0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Ramesh Kumar (Gate 1)', 'ramesh.guard@prestige.in', '+91 98765 43210', 'security_guard'),
    ('e0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Ananya Sharma (Owner B-402)', 'ananya.sharma@gmail.com', '+91 98111 22334', 'resident'),
    ('e0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'Vikram Sharma (Family B-402)', 'vikram.sharma@gmail.com', '+91 98111 22335', 'family_member'),
    ('e0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'Arun Nair (Owner A-102)', 'arun.nair@outlook.com', '+91 97222 33445', 'resident')
ON CONFLICT (id) DO NOTHING;

-- 6. Associate Residents to Flats
INSERT INTO flat_residents (flat_id, user_id, is_primary_owner, is_approved) VALUES
    ('d0000000-0000-0000-0000-000000000402', 'e0000000-0000-0000-0000-000000000004', true, true),
    ('d0000000-0000-0000-0000-000000000402', 'e0000000-0000-0000-0000-000000000005', false, true),
    ('d0000000-0000-0000-0000-000000000102', 'e0000000-0000-0000-0000-000000000006', true, true)
ON CONFLICT (flat_id, user_id) DO NOTHING;

-- 7. Pre-approved guest pass
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
    1,
    0,
    'Family lunch guest'
) ON CONFLICT DO NOTHING;
