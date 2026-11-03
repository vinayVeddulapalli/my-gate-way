-- ============================================================================
-- GATEWAY SECURITY: CREATE REAL CREDENTIALS IN SUPABASE AUTH
-- Migration 09: Dedicated Logins for Guard, Owner, Admin, and Super Admin
-- ============================================================================
-- HOW TO RUN:
-- 1. Open your Supabase Dashboard: https://supabase.com/dashboard/project/lxiqquskupxdteasmfrw
-- 2. Go to "SQL Editor" -> Click "New query"
-- 3. Paste this ENTIRE file into the editor and click "RUN"
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Function to safely create or update auth user with pre-confirmed email
CREATE OR REPLACE FUNCTION create_gateway_auth_user(
    p_user_id UUID,
    p_email TEXT,
    p_password TEXT,
    p_full_name TEXT,
    p_phone TEXT,
    p_role user_role,
    p_community_id UUID DEFAULT 'a0000000-0000-0000-0000-000000000001'
) RETURNS VOID AS $$
DECLARE
    v_encrypted_pw TEXT;
BEGIN
    v_encrypted_pw := crypt(p_password, gen_salt('bf'));

    -- 1. Insert or update in auth.users
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        created_at,
        updated_at
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        p_user_id,
        'authenticated',
        'authenticated',
        p_email,
        v_encrypted_pw,
        now(),
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        json_build_object('full_name', p_full_name, 'phone', p_phone, 'role', p_role)::jsonb,
        CASE WHEN p_role = 'super_admin' THEN true ELSE false END,
        now(),
        now()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        encrypted_password = EXCLUDED.encrypted_password,
        email_confirmed_at = now(),
        raw_user_meta_data = EXCLUDED.raw_user_meta_data,
        updated_at = now();

    -- 2. Insert or update in auth.identities
    INSERT INTO auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        provider_id,
        last_sign_in_at,
        created_at,
        updated_at
    ) VALUES (
        p_user_id::text,
        p_user_id,
        format('{"sub":"%s","email":"%s"}', p_user_id, p_email)::jsonb,
        'email',
        p_email,
        now(),
        now(),
        now()
    )
    ON CONFLICT (provider, provider_id) DO UPDATE SET
        identity_data = EXCLUDED.identity_data,
        last_sign_in_at = now(),
        updated_at = now();

    -- 3. Upsert corresponding profile in public.user_profiles
    INSERT INTO public.user_profiles (
        id,
        community_id,
        full_name,
        email,
        phone,
        role,
        is_active,
        notification_push_enabled,
        notification_sound_enabled
    ) VALUES (
        p_user_id,
        p_community_id,
        p_full_name,
        p_email,
        p_phone,
        p_role,
        true,
        true,
        true
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        role = EXCLUDED.role,
        is_active = true,
        updated_at = now();

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- CREATE THE 4 DISTINCT ROLES WITH REAL CREDENTIALS
-- ----------------------------------------------------------------------------

-- 1. SECURITY GUARD (Gate Kiosk Terminal)
-- Email: guard@gatewaysecurity.in OR ramesh.guard@prestige.in
-- Password: Guard@123
SELECT create_gateway_auth_user(
    'e0000000-0000-0000-0000-000000000003'::UUID,
    'guard@gatewaysecurity.in',
    'Guard@123',
    'Ramesh Kumar (Gate 1 Guard)',
    '+91 98765 43210',
    'security_guard'::user_role,
    'a0000000-0000-0000-0000-000000000001'::UUID
);

-- 2. APARTMENT OWNER / RESIDENT (Flat 1204 & 402)
-- Email: owner@gatewaysecurity.in OR ananya.sharma@gmail.com
-- Password: Owner@123
SELECT create_gateway_auth_user(
    'e0000000-0000-0000-0000-000000000004'::UUID,
    'owner@gatewaysecurity.in',
    'Owner@123',
    'Aarav Sharma (Flat 1204 Owner)',
    '+91 98111 22334',
    'resident'::user_role,
    'a0000000-0000-0000-0000-000000000001'::UUID
);

-- Ensure Owner is mapped to Flat 1204 / 402
INSERT INTO public.flat_residents (flat_id, user_id, is_primary_owner, is_approved)
VALUES (
    'd0000000-0000-0000-0000-000000000402',
    'e0000000-0000-0000-0000-000000000004',
    true,
    true
) ON CONFLICT (flat_id, user_id) DO NOTHING;

-- 3. SOCIETY ADMIN (Estate Management Office)
-- Email: admin@gatewaysecurity.in OR rajesh.admin@prestige.in
-- Password: Admin@123
SELECT create_gateway_auth_user(
    'e0000000-0000-0000-0000-000000000002'::UUID,
    'admin@gatewaysecurity.in',
    'Admin@123',
    'Rajesh Iyer (Estate Manager)',
    '+91 98450 12345',
    'community_admin'::user_role,
    'a0000000-0000-0000-0000-000000000001'::UUID
);

-- 4. SUPER ADMIN (Multi-Society Platform Operations)
-- Email: superadmin@gatewaysecurity.in
-- Password: Super@123
SELECT create_gateway_auth_user(
    'e0000000-0000-0000-0000-000000000001'::UUID,
    'superadmin@gatewaysecurity.in',
    'Super@123',
    'Chief Operations Admin',
    '+91 99000 00001',
    'super_admin'::user_role,
    NULL
);

-- Verify created credentials
SELECT 
    u.id, 
    u.email, 
    u.email_confirmed_at IS NOT NULL AS is_email_confirmed,
    p.role, 
    p.full_name
FROM auth.users u
JOIN public.user_profiles p ON p.id = u.id
ORDER BY p.role;
