-- ============================================================================
-- GATEWAY SECURITY: FIX SUPABASE GOTRUE AUTH SCHEMA (NULL String Error)
-- Migration 11: Fix "Database error querying schema" and unique phone constraint
-- ============================================================================

-- 1. Reset any empty string phones back to NULL so unique constraint 'users_phone_key' is never violated
UPDATE auth.users 
SET phone = NULL 
WHERE phone = '';

-- 2. Fix GoTrue string token columns (converts NULL to empty string '')
UPDATE auth.users 
SET 
    confirmation_token = COALESCE(confirmation_token, ''),
    recovery_token = COALESCE(recovery_token, ''),
    email_change = COALESCE(email_change, ''),
    email_change_token_new = COALESCE(email_change_token_new, ''),
    phone_change = COALESCE(phone_change, ''),
    phone_change_token = COALESCE(phone_change_token, '')
WHERE 
    confirmation_token IS NULL 
    OR recovery_token IS NULL 
    OR email_change IS NULL 
    OR email_change_token_new IS NULL;

-- 3. Confirm result
SELECT id, email, role, phone, email_confirmed_at IS NOT NULL as confirmed 
FROM auth.users;
