-- ============================================================================
-- GATEWAY SECURITY: FIX SUPABASE GOTRUE AUTH SCHEMA (NULL String Error)
-- Migration 11: Fix "Database error querying schema" on auth.users
-- ============================================================================
-- WHY THIS IS NEEDED:
-- Supabase GoTrue Auth expects string columns in auth.users to be empty strings ('')
-- rather than NULL. If confirmation_token or recovery_token is NULL, GoTrue throws:
-- "sql: Scan error on column index 8, name confirmation_token: converting NULL to string is unsupported"
-- resulting in HTTP 500 "Database error querying schema".
--
-- HOW TO RUN:
-- 1. Open Supabase Dashboard -> SQL Editor -> New Query
-- 2. Paste this script and click "RUN"
-- ============================================================================

UPDATE auth.users 
SET 
    confirmation_token = COALESCE(confirmation_token, ''),
    recovery_token = COALESCE(recovery_token, ''),
    email_change = COALESCE(email_change, ''),
    email_change_token_new = COALESCE(email_change_token_new, ''),
    phone = COALESCE(phone, ''),
    phone_change = COALESCE(phone_change, ''),
    phone_change_token = COALESCE(phone_change_token, '')
WHERE 
    confirmation_token IS NULL 
    OR recovery_token IS NULL 
    OR email_change IS NULL 
    OR email_change_token_new IS NULL;

-- Confirm result
SELECT id, email, role, email_confirmed_at IS NOT NULL as confirmed 
FROM auth.users;
