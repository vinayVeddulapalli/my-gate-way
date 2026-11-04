-- ============================================================================
-- GATEWAY SECURITY: AUTOMATIC 2-WAY SYNC FOR USER CREATION, UPDATES & DELETION
-- Migration 10: Supabase Dashboard Trigger (Full Self-Service User Control)
-- ============================================================================
-- HOW TO RUN:
-- 1. Open Supabase Dashboard: https://supabase.com/dashboard/project/lxiqquskupxdteasmfrw
-- 2. Go to "SQL Editor" -> Click "New query"
-- 3. Paste this ENTIRE script and click "RUN"
-- ============================================================================
-- WHAT THIS DOES:
-- Whenever YOU create a user in Supabase Dashboard (Authentication -> Users -> Add User),
-- or whenever a user registers, this automatically creates and updates their record in
-- public.user_profiles. When you delete a user in Supabase Auth, it cleans up automatically!
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Function to handle automatic profile creation on auth.users insert/update
CREATE OR REPLACE FUNCTION public.handle_auth_user_sync()
RETURNS trigger AS $$
DECLARE
    v_role user_role;
    v_full_name TEXT;
    v_phone TEXT;
    v_community_id UUID;
BEGIN
    -- Determine role from user metadata, fallback to 'resident'
    BEGIN
        v_role := COALESCE((new.raw_user_meta_data->>'role')::user_role, 'resident'::user_role);
    EXCEPTION WHEN OTHERS THEN
        v_role := 'resident'::user_role;
    END;

    -- Determine Name, Phone, Community
    v_full_name := COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));
    v_phone := COALESCE(new.raw_user_meta_data->>'phone', new.phone, '+91 99999 99999');
    
    BEGIN
        v_community_id := COALESCE((new.raw_user_meta_data->>'community_id')::uuid, 'a0000000-0000-0000-0000-000000000001'::uuid);
    EXCEPTION WHEN OTHERS THEN
        v_community_id := 'a0000000-0000-0000-0000-000000000001'::uuid;
    END;

    -- Upsert profile in public.user_profiles
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
        new.id,
        CASE WHEN v_role = 'super_admin' THEN NULL ELSE v_community_id END,
        v_full_name,
        lower(new.email),
        v_phone,
        v_role,
        true,
        true,
        true
    )
    ON CONFLICT (id) DO UPDATE SET
        email = lower(EXCLUDED.email),
        full_name = CASE WHEN EXCLUDED.full_name <> '' THEN EXCLUDED.full_name ELSE public.user_profiles.full_name END,
        phone = CASE WHEN EXCLUDED.phone <> '+91 99999 99999' THEN EXCLUDED.phone ELSE public.user_profiles.phone END,
        role = EXCLUDED.role,
        is_active = true,
        updated_at = now();

    -- Also auto-confirm email for convenient phone testing
    IF new.email_confirmed_at IS NULL THEN
        new.email_confirmed_at := now();
    END IF;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if existing and attach to auth.users
DROP TRIGGER IF EXISTS on_auth_user_sync ON auth.users;
CREATE TRIGGER on_auth_user_sync
    BEFORE INSERT OR UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_auth_user_sync();

-- 2. Function to automatically clean up user_profiles when a user is deleted from Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_auth_user_delete()
RETURNS trigger AS $$
BEGIN
    DELETE FROM public.flat_residents WHERE user_id = old.id;
    DELETE FROM public.user_profiles WHERE id = old.id;
    RETURN old;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_delete ON auth.users;
CREATE TRIGGER on_auth_user_delete
    AFTER DELETE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_auth_user_delete();

