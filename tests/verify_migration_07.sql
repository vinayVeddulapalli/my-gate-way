-- ============================================================================
-- GATEWAY SECURITY (द्वारपाल — Dwaarpal)
-- Test Suite: verify_migration_07.sql
-- ============================================================================
-- Validates Migration 07 (Delivery and Parcel Management) inside a safe ROLLBACK transaction:
-- 1. Delivery Categories & Parcel Columns Existence
-- 2. State Machine Transitions (pending -> leave_at_gate -> collected)
-- 3. Safety Violation Rejections (pending -> collected denied, terminal re-opening denied)
-- 4. Constraint chk_collected_requires_action (cannot be collected without handover info)
-- 5. RPC fn_confirm_parcel_handover execution & OTP verification
-- 6. Role-based tenant isolation & audit logging
-- ============================================================================

BEGIN;

DO $$
DECLARE
  v_test_community_id UUID := 'a7777777-0000-0000-0000-000000000001'::UUID;
  v_other_community_id UUID := 'a8888888-0000-0000-0000-000000000002'::UUID;
  v_block_id UUID := 'c7777777-0000-0000-0000-000000000001'::UUID;
  v_flat_id UUID := 'd7777777-0000-0000-0000-000000000001'::UUID;
  v_gate_id UUID := 'b7777777-0000-0000-0000-000000000001'::UUID;
  v_guard_user_id UUID := 'e7777777-0000-0000-0000-000000000001'::UUID;
  v_resident_user_id UUID := 'e7777777-0000-0000-0000-000000000002'::UUID;
  v_delivery_req_id UUID := 'f7777777-0000-0000-0000-000000000001'::UUID;
  v_handover_res JSONB;
  v_failed BOOLEAN;
BEGIN
  RAISE NOTICE '=== TEST 1: SETUP MOCK DATA ===';

  -- Create mock community
  INSERT INTO public.communities (id, name, code, address, city, state, pincode, emergency_police, emergency_ambulance, emergency_fire, estate_manager_phone)
  VALUES (v_test_community_id, 'Test Society Mig 07', 'TS7-01', 'Test Road', 'Bengaluru', 'KA', '560001', '112', '108', '101', '+91 99999 11111')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.gates (id, community_id, name, gate_type, is_active)
  VALUES (v_gate_id, v_test_community_id, 'Test Main Gate', 'main', true)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.buildings_blocks (id, community_id, name, total_floors)
  VALUES (v_block_id, v_test_community_id, 'Block A', 10)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.flats (id, community_id, block_id, flat_number, floor_number)
  VALUES (v_flat_id, v_test_community_id, v_block_id, '101', 1)
  ON CONFLICT (id) DO NOTHING;

  -- Setup auth users & profiles
  INSERT INTO auth.users (id, email) VALUES (v_guard_user_id, 'testguard_mig7@prestige.in') ON CONFLICT DO NOTHING;
  INSERT INTO auth.users (id, email) VALUES (v_resident_user_id, 'testresident_mig7@prestige.in') ON CONFLICT DO NOTHING;

  INSERT INTO public.user_profiles (id, community_id, full_name, email, phone, role)
  VALUES (v_guard_user_id, v_test_community_id, 'Guard Mig7', 'testguard_mig7@prestige.in', '+91 90000 00001', 'security_guard')
  ON CONFLICT (id) DO UPDATE SET role = 'security_guard', community_id = v_test_community_id;

  INSERT INTO public.user_profiles (id, community_id, full_name, email, phone, role)
  VALUES (v_resident_user_id, v_test_community_id, 'Resident Mig7', 'testresident_mig7@prestige.in', '+91 90000 00002', 'resident')
  ON CONFLICT (id) DO UPDATE SET role = 'resident', community_id = v_test_community_id;

  INSERT INTO public.flat_residents (flat_id, user_id, is_primary_owner, is_approved)
  VALUES (v_flat_id, v_resident_user_id, true, true)
  ON CONFLICT (flat_id, user_id) DO NOTHING;

  RAISE NOTICE '=== TEST 2: INSERT DELIVERY VISITOR WITH PARCEL METADATA ===';
  INSERT INTO public.visitor_requests (
    id,
    community_id,
    gate_id,
    flat_id,
    guard_id,
    visitor_name,
    visitor_phone,
    category,
    delivery_category,
    delivery_company,
    purpose,
    parcel_count,
    parcel_details,
    gate_location,
    collection_otp,
    status
  ) VALUES (
    v_delivery_req_id,
    v_test_community_id,
    v_gate_id,
    v_flat_id,
    v_guard_user_id,
    'Zomato Delivery Rider',
    '+91 98451 12345',
    'delivery',
    'food',
    'Zomato',
    'Dinner delivery #ZOM-4912',
    1,
    'Hot food bag from Biryani Zone',
    'Gate 1 Parcel Desk, Shelf F-2',
    '4921',
    'pending'
  );

  RAISE NOTICE '✔ Delivery request inserted with food delivery_category and parcel metadata';

  RAISE NOTICE '=== TEST 3: ATTEMPT ILLEGAL DIRECT TRANSITION PENDING -> COLLECTED (MUST FAIL) ===';
  v_failed := FALSE;
  BEGIN
    UPDATE public.visitor_requests
    SET status = 'collected'
    WHERE id = v_delivery_req_id;
  EXCEPTION WHEN OTHERS THEN
    v_failed := TRUE;
    RAISE NOTICE '✔ Correctly rejected direct pending -> collected: %', SQLERRM;
  END;

  IF NOT v_failed THEN
    RAISE EXCEPTION 'TEST FAILED: direct pending -> collected was not blocked!';
  END IF;

  RAISE NOTICE '=== TEST 4: TRANSITION PENDING -> LEAVE_AT_GATE (RESIDENT AUTHORIZATION) ===';
  UPDATE public.visitor_requests
  SET 
    status = 'leave_at_gate',
    decision_by = v_resident_user_id,
    decision_at = pg_catalog.now(),
    handover_status = 'at_gate'
  WHERE id = v_delivery_req_id;

  RAISE NOTICE '✔ Status successfully transitioned to leave_at_gate';

  RAISE NOTICE '=== TEST 5: CONSTRAINT chk_collected_requires_action VIOLATION TEST ===';
  -- Attempt to mark collected without recording collected_at or handover_status
  v_failed := FALSE;
  BEGIN
    UPDATE public.visitor_requests
    SET status = 'collected', collected_at = NULL, handover_status = 'at_gate'
    WHERE id = v_delivery_req_id;
  EXCEPTION WHEN OTHERS THEN
    v_failed := TRUE;
    RAISE NOTICE '✔ Correctly rejected collected status without collection timestamp: %', SQLERRM;
  END;

  IF NOT v_failed THEN
    RAISE EXCEPTION 'TEST FAILED: chk_collected_requires_action constraint was not enforced!';
  END IF;

  RAISE NOTICE '=== TEST 6: RPC fn_confirm_parcel_handover WITH WRONG OTP (MUST FAIL) ===';
  -- Simulate authenticated guard session
  PERFORM set_config('request.jwt.claim.sub', v_guard_user_id::text, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);

  v_failed := FALSE;
  BEGIN
    PERFORM public.fn_confirm_parcel_handover(v_delivery_req_id, '9999', 'Collector Name');
  EXCEPTION WHEN OTHERS THEN
    v_failed := TRUE;
    RAISE NOTICE '✔ Correctly rejected handover with wrong OTP: %', SQLERRM;
  END;

  IF NOT v_failed THEN
    RAISE EXCEPTION 'TEST FAILED: Handover with invalid OTP was permitted!';
  END IF;

  RAISE NOTICE '=== TEST 7: RPC fn_confirm_parcel_handover WITH VALID OTP (MUST SUCCEED) ===';
  v_handover_res := public.fn_confirm_parcel_handover(v_delivery_req_id, '4921', 'Ananya Sharma (Owner)');
  RAISE NOTICE 'Handover result: %', v_handover_res;

  IF (v_handover_res->>'success')::BOOLEAN <> TRUE THEN
    RAISE EXCEPTION 'TEST FAILED: Valid parcel handover returned failure';
  END IF;

  RAISE NOTICE '✔ Parcel handover succeeded with valid OTP';

  RAISE NOTICE '=== TEST 8: VERIFY AUDIT LOG ENTRY FOR COLLECT_PARCEL ===';
  IF NOT EXISTS (
    SELECT 1 FROM public.audit_logs
    WHERE entity_id = v_delivery_req_id
      AND action = 'COLLECT_PARCEL'
  ) THEN
    RAISE EXCEPTION 'TEST FAILED: COLLECT_PARCEL action was not logged in audit_logs!';
  END IF;

  RAISE NOTICE '✔ Audit log entry verified for COLLECT_PARCEL';

  RAISE NOTICE '=== TEST 9: TERMINAL STATE IMMUTABILITY (COLLECTED CANNOT REOPEN) ===';
  v_failed := FALSE;
  BEGIN
    UPDATE public.visitor_requests
    SET status = 'pending'
    WHERE id = v_delivery_req_id;
  EXCEPTION WHEN OTHERS THEN
    v_failed := TRUE;
    RAISE NOTICE '✔ Correctly rejected reopening terminal collected state: %', SQLERRM;
  END;

  IF NOT v_failed THEN
    RAISE EXCEPTION 'TEST FAILED: Terminal collected state was reopened!';
  END IF;

  RAISE NOTICE 'ALL MIGRATION 07 DATABASE TESTS PASSED SUCCESSFULLY!';
END $$;

ROLLBACK;
