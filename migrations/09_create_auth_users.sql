-- ============================================================================
-- GATEWAY SECURITY: CREATE REAL CREDENTIALS IN SUPABASE AUTH
-- Migration 09 (Fixed): Dedicated Logins for Guard, Owner, Admin, and Super Admin
-- ============================================================================
-- HOW TO RUN:
-- 1. Open Supabase Dashboard: https://supabase.com/dashboard/project/lxiqquskupxdteasmfrw
-- 2. Go to "SQL Editor" -> Click "New query"
-- 3. Paste this ENTIRE script and click "RUN"
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Function to safely create or update auth user with pre-confirmed email
CREATE OR REPLACE FUNCTION create_gateway_auth_user(
    p_user_id UUID,
    p_email TEXT,
    p_password TEXT,
    p_full_name TEXT,
    p_phone TEXT,
    p_role TEXT,
    p_community_id UUID DEFAULT 'a0000000-0000-0000-0000-000000000001'
) RETURNS VOID AS $$
DECLARE
    v_encrypted_pw TEXT;
    v_role_enum user_role;
BEGIN
    v_encrypted_pw := crypt(p_password, gen_salt('bf'));
    v_role_enum := p_role::user_role;

    -- Clean up any prior conflicting signup with the same email but different UUID
    DELETE FROM auth.identities WHERE user_id IN (
        SELECT id FROM auth.users WHERE lower(email) = lower(p_email) AND id <> p_user_id
    );
    DELETE FROM auth.users WHERE lower(email) = lower(p_email) AND id <> p_user_id;

    -- 1. Insert or update in auth.users with empty string tokens (prevents GoTrue NULL scan error)
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
        updated_at,
        confirmation_token,
        recovery_token,
        email_change,
        email_change_token_new,
        phone,
        phone_change,
        phone_change_token
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        p_user_id,
        'authenticated',
        'authenticated',
        lower(p_email),
        v_encrypted_pw,
        now(),
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        json_build_object('full_name', p_full_name, 'phone', p_phone, 'role', p_role)::jsonb,
        CASE WHEN p_role = 'super_admin' THEN true ELSE false END,
        now(),
        now(),
        '',
        '',
        '',
        '',
        NULL,
        '',
        ''
    )
    ON CONFLICT (id) DO UPDATE SET
        email = lower(EXCLUDED.email),
        encrypted_password = EXCLUDED.encrypted_password,
        email_confirmed_at = now(),
        raw_user_meta_data = EXCLUDED.raw_user_meta_data,
        confirmation_token = COALESCE(auth.users.confirmation_token, ''),
        recovery_token = COALESCE(auth.users.recovery_token, ''),
        email_change = COALESCE(auth.users.email_change, ''),
        email_change_token_new = COALESCE(auth.users.email_change_token_new, ''),
        updated_at = now();

    -- 2. Insert or update in auth.identities (casting id to UUID to match newer Supabase schema)
    IF EXISTS (SELECT 1 FROM auth.identities WHERE user_id = p_user_id AND provider = 'email') THEN
        UPDATE auth.identities
        SET identity_data = format('{"sub":"%s","email":"%s"}', p_user_id, lower(p_email))::jsonb,
            last_sign_in_at = now(),
            updated_at = now()
        WHERE user_id = p_user_id AND provider = 'email';
    ELSE
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
            p_user_id, -- Passed as UUID (fixes ERROR 42804)
            p_user_id,
            format('{"sub":"%s","email":"%s"}', p_user_id, lower(p_email))::jsonb,
            'email',
            p_user_id::text,
            now(),
            now(),
            now()
        );
    END IF;

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
        lower(p_email),
        p_phone,
        v_role_enum,
        true,
        true,
        true
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = lower(EXCLUDED.email),
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
SELECT create_gateway_auth_user(
    'e0000000-0000-0000-0000-000000000003'::UUID,
    'guard@gatewaysecurity.in',
    'Guard@123',
    'Ramesh Kumar (Gate 1 Guard)',
    '+91 98765 43210',
    'security_guard',
    'a0000000-0000-0000-0000-000000000001'::UUID
);

-- 2. APARTMENT OWNER / RESIDENT (Flat 1204 & 402)
SELECT create_gateway_auth_user(
    'e0000000-0000-0000-0000-000000000004'::UUID,
    'owner@gatewaysecurity.in',
    'Owner@123',
    'Aarav Sharma (Flat 1204 Owner)',
    '+91 98111 22334',
    'resident',
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
SELECT create_gateway_auth_user(
    'e0000000-0000-0000-0000-000000000002'::UUID,
    'admin@gatewaysecurity.in',
    'Admin@123',
    'Rajesh Iyer (Estate Manager)',
    '+91 98450 12345',
    'community_admin',
    'a0000000-0000-0000-0000-000000000001'::UUID
);

-- 4. SUPER ADMIN (Multi-Society Platform Operations)
SELECT create_gateway_auth_user(
    'e0000000-0000-0000-0000-000000000001'::UUID,
    'superadmin@gatewaysecurity.in',
    'Super@123',
    'Chief Operations Admin',
    '+91 99000 00001',
    'super_admin',
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
