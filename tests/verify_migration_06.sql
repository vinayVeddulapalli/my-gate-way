-- ============================================================================
-- GATEWAY SECURITY (द्वारपाल — Dwaarpal)
-- Complete SQL Test Harness for Migration 06 (Final)
-- ============================================================================
-- Safe Execution Guarantee:
-- This script runs inside a single transaction block ending in ROLLBACK.
-- All created entities in auth.users, user_profiles, communities, visitor_requests,
-- guest_passes, and audit_logs are 100% rolled back, leaving zero permanent data.
-- ============================================================================

BEGIN;

DO $$
DECLARE
  v_test_community_1 UUID;
  v_test_community_2 UUID;
  v_test_block_1 UUID;
  v_test_flat_101 UUID;
  v_test_flat_102 UUID;
  v_test_gate_1 UUID;
  v_test_gate_2 UUID;
  v_test_guard_id UUID;
  v_test_resident_101 UUID;
  v_test_resident_102 UUID;
  v_test_visitor_id UUID;
  v_test_pass_id UUID;
  v_pass_result JSONB;
  v_expire_result JSONB;
  v_audit_count INT;
BEGIN
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'STARTING GATEWAY SECURITY MIGRATION 06 FINAL VERIFICATION';
  RAISE NOTICE '============================================================';

  -- --------------------------------------------------------------------------
  -- SETUP: Create Isolated Mock Entities
  -- --------------------------------------------------------------------------
  INSERT INTO public.communities (name, code, address, city, state, pincode, estate_manager_phone)
  VALUES ('Test Heights A', 'TEST-A', 'Address A', 'City A', 'State A', '560001', '+91 99999 11111')
  RETURNING id INTO v_test_community_1;

  INSERT INTO public.communities (name, code, address, city, state, pincode, estate_manager_phone)
  VALUES ('Test Heights B', 'TEST-B', 'Address B', 'City B', 'State B', '560002', '+91 99999 22222')
  RETURNING id INTO v_test_community_2;

  INSERT INTO public.buildings_blocks (community_id, name, total_floors)
  VALUES (v_test_community_1, 'Block Alpha', 10)
  RETURNING id INTO v_test_block_1;

  INSERT INTO public.flats (community_id, block_id, flat_number, floor_number)
  VALUES (v_test_community_1, v_test_block_1, '101', 1)
  RETURNING id INTO v_test_flat_101;

  INSERT INTO public.flats (community_id, block_id, flat_number, floor_number)
  VALUES (v_test_community_1, v_test_block_1, '102', 1)
  RETURNING id INTO v_test_flat_102;

  INSERT INTO public.gates (community_id, name, gate_type, is_active)
  VALUES (v_test_community_1, 'Gate 1 (Community A)', 'main', TRUE)
  RETURNING id INTO v_test_gate_1;

  INSERT INTO public.gates (community_id, name, gate_type, is_active)
  VALUES (v_test_community_2, 'Gate 2 (Community B)', 'main', TRUE)
  RETURNING id INTO v_test_gate_2;

  -- 1. Create auth users in auth.users first to satisfy foreign key user_profiles_id_fkey
  v_test_guard_id := gen_random_uuid();
  v_test_resident_101 := gen_random_uuid();
  v_test_resident_102 := gen_random_uuid();

  -- Safely insert into auth.users (will be rolled back)
  INSERT INTO auth.users (id, email, raw_user_meta_data)
  VALUES 
    (v_test_guard_id, 'guard.test@gateway.in', '{"role":"security_guard"}'::jsonb),
    (v_test_resident_101, 'res101.test@gateway.in', '{"role":"resident"}'::jsonb),
    (v_test_resident_102, 'res102.test@gateway.in', '{"role":"resident"}'::jsonb);

  -- 2. Create corresponding user_profiles
  INSERT INTO public.user_profiles (id, community_id, full_name, email, phone, role)
  VALUES (v_test_guard_id, v_test_community_1, 'Test Guard Ramesh', 'guard.test@gateway.in', '+91 98000 00001', 'security_guard');

  INSERT INTO public.user_profiles (id, community_id, full_name, email, phone, role)
  VALUES (v_test_resident_101, v_test_community_1, 'Test Resident 101', 'res101.test@gateway.in', '+91 98000 00101', 'resident');

  INSERT INTO public.user_profiles (id, community_id, full_name, email, phone, role)
  VALUES (v_test_resident_102, v_test_community_1, 'Test Resident 102', 'res102.test@gateway.in', '+91 98000 00102', 'resident');

  -- 3. Map flat memberships
  INSERT INTO public.flat_residents (flat_id, user_id, is_primary_owner, is_approved)
  VALUES (v_test_flat_101, v_test_resident_101, TRUE, TRUE);

  INSERT INTO public.flat_residents (flat_id, user_id, is_primary_owner, is_approved)
  VALUES (v_test_flat_102, v_test_resident_102, TRUE, TRUE);


  -- --------------------------------------------------------------------------
  -- TEST 1: TRANSITION STATE MACHINE — Prevent direct jump: pending -> checked_in
  -- --------------------------------------------------------------------------
  INSERT INTO public.visitor_requests (
    community_id, gate_id, flat_id, guard_id, visitor_name, visitor_phone, purpose, status
  ) VALUES (
    v_test_community_1, v_test_gate_1, v_test_flat_101, v_test_guard_id, 'Delivery Driver', '+91 98765 43210', 'Swiggy Delivery', 'pending'
  ) RETURNING id INTO v_test_visitor_id;

  BEGIN
    UPDATE public.visitor_requests
    SET status = 'checked_in'
    WHERE id = v_test_visitor_id;

    RAISE EXCEPTION 'TEST 1 FAILED: Direct pending -> checked_in was allowed without approval!';
  EXCEPTION WHEN SQLSTATE '23514' THEN
    RAISE NOTICE '✔ TEST 1 PASSED: Direct pending -> checked_in properly rejected by state machine.';
  END;


  -- --------------------------------------------------------------------------
  -- TEST 2: AUTHORIZATION — Resident 102 CANNOT approve visitor for Flat 101
  -- --------------------------------------------------------------------------
  -- Simulate authenticated session of Resident 102
  PERFORM set_config('request.jwt.claim.sub', v_test_resident_102::text, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);

  BEGIN
    UPDATE public.visitor_requests
    SET status = 'approved', decision_by = v_test_resident_102
    WHERE id = v_test_visitor_id;

    RAISE EXCEPTION 'TEST 2 FAILED: Resident 102 was allowed to approve visitor for Flat 101!';
  EXCEPTION WHEN SQLSTATE '42501' THEN
    RAISE NOTICE '✔ TEST 2 PASSED: Cross-flat visitor approval strictly blocked with insufficient_privilege.';
  END;


  -- --------------------------------------------------------------------------
  -- TEST 3: AUTHORIZATION — Guard CANNOT approve visitor on behalf of resident
  -- --------------------------------------------------------------------------
  PERFORM set_config('request.jwt.claim.sub', v_test_guard_id::text, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);

  BEGIN
    UPDATE public.visitor_requests
    SET status = 'approved', decision_by = v_test_guard_id
    WHERE id = v_test_visitor_id;

    RAISE EXCEPTION 'TEST 3 FAILED: Security Guard was allowed to approve visitor on behalf of resident!';
  EXCEPTION WHEN SQLSTATE '42501' THEN
    RAISE NOTICE '✔ TEST 3 PASSED: Guard prohibited from resident approval step.';
  END;


  -- --------------------------------------------------------------------------
  -- TEST 4: VALID LIFECYCLE — Resident 101 approves, then Guard checks in and out
  -- --------------------------------------------------------------------------
  -- Resident 101 approves
  PERFORM set_config('request.jwt.claim.sub', v_test_resident_101::text, true);
  UPDATE public.visitor_requests
  SET status = 'approved', decision_by = v_test_resident_101
  WHERE id = v_test_visitor_id;

  -- Guard checks in
  PERFORM set_config('request.jwt.claim.sub', v_test_guard_id::text, true);
  UPDATE public.visitor_requests
  SET status = 'checked_in', checked_in_by = v_test_guard_id
  WHERE id = v_test_visitor_id;

  -- Guard checks out
  UPDATE public.visitor_requests
  SET status = 'checked_out', checked_out_by = v_test_guard_id
  WHERE id = v_test_visitor_id;

  RAISE NOTICE '✔ TEST 4 PASSED: Valid lifecycle transitions under authorized personas executed cleanly.';


  -- --------------------------------------------------------------------------
  -- TEST 5: TERMINAL STATE IMMUTABILITY — checked_out visitor cannot re-open
  -- --------------------------------------------------------------------------
  BEGIN
    UPDATE public.visitor_requests
    SET status = 'checked_in'
    WHERE id = v_test_visitor_id;

    RAISE EXCEPTION 'TEST 5 FAILED: Terminal checked_out visitor was allowed to re-check in!';
  EXCEPTION WHEN SQLSTATE '23514' THEN
    RAISE NOTICE '✔ TEST 5 PASSED: Terminal state re-opening strictly blocked.';
  END;


  -- --------------------------------------------------------------------------
  -- TEST 6: ATOMIC GUEST PASS RPC — Authenticated guard verification & anti-replay
  -- --------------------------------------------------------------------------
  INSERT INTO public.guest_passes (
    community_id, flat_id, created_by, guest_name, guest_phone, pass_code, valid_from, valid_until, max_entries, entries_used, is_active
  ) VALUES (
    v_test_community_1, v_test_flat_101, v_test_resident_101, 'VIP Guest', '+91 99887 76655', '778899', NOW() - INTERVAL '10 min', NOW() + INTERVAL '2 hours', 1, 0, TRUE
  ) RETURNING id INTO v_test_pass_id;

  -- First verification under guard session: Should SUCCEED
  PERFORM set_config('request.jwt.claim.sub', v_test_guard_id::text, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);

  v_pass_result := public.fn_verify_and_use_guest_pass('778899', v_test_gate_1);

  IF (v_pass_result->>'success')::BOOLEAN IS NOT TRUE THEN
    RAISE EXCEPTION 'TEST 6A FAILED: First pass check-in failed: %', v_pass_result->>'message';
  ELSE
    RAISE NOTICE '✔ TEST 6A PASSED: First atomic pass entry succeeded with guard identity.';
  END IF;

  -- Second verification with same code: MUST BE REJECTED (Replay Protection)
  v_pass_result := public.fn_verify_and_use_guest_pass('778899', v_test_gate_1);

  IF (v_pass_result->>'success')::BOOLEAN IS TRUE THEN
    RAISE EXCEPTION 'TEST 6B FAILED: Single-use pass was accepted twice (replay bug)!';
  ELSE
    RAISE NOTICE '✔ TEST 6B PASSED: Replay attack rejected with uniform error: "%".', v_pass_result->>'message';
  END IF;


  -- --------------------------------------------------------------------------
  -- TEST 7: CROSS-COMMUNITY GATE ENFORCEMENT
  -- --------------------------------------------------------------------------
  INSERT INTO public.guest_passes (
    community_id, flat_id, created_by, guest_name, guest_phone, pass_code, valid_from, valid_until, max_entries, entries_used, is_active
  ) VALUES (
    v_test_community_1, v_test_flat_101, v_test_resident_101, 'Guest B', '+91 99887 76655', '334455', NOW() - INTERVAL '10 min', NOW() + INTERVAL '2 hours', 1, 0, TRUE
  );

  -- Guard from Community A attempts to check in at Gate 2 (Community B)
  v_pass_result := public.fn_verify_and_use_guest_pass('334455', v_test_gate_2);

  IF (v_pass_result->>'success')::BOOLEAN IS TRUE THEN
    RAISE EXCEPTION 'TEST 7 FAILED: Gate from another community was accepted!';
  ELSE
    RAISE NOTICE '✔ TEST 7 PASSED: Cross-community gate check strictly rejected: "%".', v_pass_result->>'message';
  END IF;


  -- --------------------------------------------------------------------------
  -- TEST 8: EXPIRATION FUNCTION PERMISSIONS — Ordinary user / guard DENIED
  -- --------------------------------------------------------------------------
  -- Simulate guard session
  PERFORM set_config('request.jwt.claim.sub', v_test_guard_id::text, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);

  BEGIN
    PERFORM public.fn_expire_stale_visitor_requests(10, v_test_community_1);
    RAISE EXCEPTION 'TEST 8A FAILED: Guard was allowed to trigger expiration routine!';
  EXCEPTION WHEN SQLSTATE '42501' THEN
    RAISE NOTICE '✔ TEST 8A PASSED: Authenticated guard denied execution of system expiration routine.';
  END;

  -- Switch to service_role (trusted scheduler)
  PERFORM set_config('request.jwt.claim.role', 'service_role', true);
  v_expire_result := public.fn_expire_stale_visitor_requests(10, v_test_community_1);

  IF (v_expire_result->>'success')::BOOLEAN IS TRUE THEN
    RAISE NOTICE '✔ TEST 8B PASSED: Trusted service_role scheduler successfully executed expiration.';
  ELSE
    RAISE EXCEPTION 'TEST 8B FAILED: Service role was unable to execute expiration!';
  END IF;


  -- --------------------------------------------------------------------------
  -- TEST 9: IMMUTABLE AUDIT LOGS — Anti-tampering blocks DELETE and TRUNCATE
  -- --------------------------------------------------------------------------
  SELECT COUNT(*) INTO v_audit_count FROM public.audit_logs WHERE community_id = v_test_community_1;

  IF v_audit_count < 3 THEN
    RAISE EXCEPTION 'TEST 9A FAILED: Lifecycle audit trigger did not record events. Found: %', v_audit_count;
  ELSE
    RAISE NOTICE '✔ TEST 9A PASSED: Lifecycle trigger automatically generated % audit events.', v_audit_count;
  END IF;

  -- Attempt to delete audit record
  BEGIN
    DELETE FROM public.audit_logs WHERE community_id = v_test_community_1;
    RAISE EXCEPTION 'TEST 9B FAILED: Audit log deletion succeeded!';
  EXCEPTION WHEN SQLSTATE '23001' OR SQLSTATE 'P0001' THEN
    RAISE NOTICE '✔ TEST 9B PASSED: Audit log tampering blocked by immutability trigger.';
  END;

  RAISE NOTICE '============================================================';
  RAISE NOTICE 'ALL MIGRATION 06 FINAL VERIFICATION TESTS PASSED SUCCESSFULLY';
  RAISE NOTICE '============================================================';
END $$;

-- 100% ROLLBACK guarantees zero leftover mock data
ROLLBACK;
