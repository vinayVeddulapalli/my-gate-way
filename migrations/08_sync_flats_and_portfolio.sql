-- Gateway Security: Apartment Visitor Management System
-- Migration 08: Sync Palm Meadows Multi-Flat Portfolio (10 Flats)
-- Run this in your Supabase SQL Editor if you are connecting a live Supabase project

-- 1. Ensure Palm Meadows community exists
INSERT INTO communities (id, name, code, address, city, state, pincode, emergency_police, emergency_ambulance, emergency_fire, estate_manager_phone, visitor_retention_days)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Palm Meadows',
    'PM-BLR',
    'Whitefield, Bengaluru',
    'Bengaluru',
    'Karnataka',
    '560066',
    '112',
    '108',
    '101',
    '+91 98450 12345',
    90
) ON CONFLICT (code) DO NOTHING;

-- 2. Ensure Building Blocks exist
INSERT INTO buildings_blocks (id, community_id, name, total_floors) VALUES
    ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Tower A', 14),
    ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Tower B', 14),
    ('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Tower C', 18),
    ('c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Tower D', 18)
ON CONFLICT (community_id, name) DO NOTHING;

-- 3. Insert All 10 Portfolio Flats (Tower A, B, and C)
INSERT INTO flats (id, community_id, block_id, flat_number, floor_number, intercom_number) VALUES
    ('d0000000-0000-0000-0000-000000001204', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', '1204', 12, '1204'),
    ('d0000000-0000-0000-0000-000000001205', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', '1205', 12, '1205'),
    ('d0000000-0000-0000-0000-000000001206', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', '1206', 12, '1206'),
    ('d0000000-0000-0000-0000-000000000301', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', '301', 3, '1301'),
    ('d0000000-0000-0000-0000-000000000402', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', '402', 4, '2402'),
    ('d0000000-0000-0000-0000-000000000403', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', '403', 4, '2403'),
    ('d0000000-0000-0000-0000-000000000701', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', '701', 7, '2701'),
    ('d0000000-0000-0000-0000-000000001102', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', '1102', 11, '3102'),
    ('d0000000-0000-0000-0000-000000000102', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', '102', 1, '1102'),
    ('d0000000-0000-0000-0000-000000000801', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', '801', 8, '3801')
ON CONFLICT (block_id, flat_number) DO NOTHING;

-- 4. Ensure Aarav Sharma Profile exists for foreign keys
INSERT INTO user_profiles (id, community_id, full_name, email, phone, role) VALUES
    ('e0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Aarav Sharma', 'aarav.sharma@palmmeadows.in', '+91 98111 22334', 'resident')
ON CONFLICT (id) DO UPDATE SET full_name = 'Aarav Sharma';

