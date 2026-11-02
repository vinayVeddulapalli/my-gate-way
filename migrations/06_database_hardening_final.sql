-- ============================================================================
-- GATEWAY SECURITY (द्वारपाल — Dwaarpal)
-- Migration 06 (Final): Database Security Hardening, Empty search_path Defense,
-- Restricted RPC Execution, Anti-Replay Guest Pass & Immutable Audit Trail
-- ============================================================================
-- Satisfies all Phase 2.1C Production Readiness Requirements:
-- 1. Revocation of all permissive anonymous policies and grants.
-- 2. Hardened SECURITY DEFINER functions with SET search_path = '' and fully-qualified names.
-- 3. Elimination of client-supplied guard IDs in guest pass verification (strictly auth.uid()).
-- 4. Single-role execution grant for expiration routine (service_role ONLY; revoking PUBLIC, anon, authenticated).
-- 5. Anti-tampering triggers on audit_logs for UPDATE, DELETE, and TRUNCATE.
-- 6. Hardened helper functions (get_auth_role, get_auth_community, is_user_flat_member).
-- 7. Composite performance indexes and data integrity check constraints.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- PART 1: REMOVAL OF PERMISSIVE ANONYMOUS ACCESS & GRANTS
-- ----------------------------------------------------------------------------

-- A. Drop permissive policies from 05_enable_realtime.sql
DROP POLICY IF EXISTS "Anon & Authenticated Select Visitor Requests" ON public.visitor_requests;
DROP POLICY IF EXISTS "Anon & Authenticated Insert Visitor Requests" ON public.visitor_requests;
DROP POLICY IF EXISTS "Anon & Authenticated Update Visitor Requests" ON public.visitor_requests;

DROP POLICY IF EXISTS "Anon & Authenticated Select Guest Passes" ON public.guest_passes;
DROP POLICY IF EXISTS "Anon & Authenticated Insert Guest Passes" ON public.guest_passes;
DROP POLICY IF EXISTS "Anon & Authenticated Update Guest Passes" ON public.guest_passes;

DROP POLICY IF EXISTS "Anon & Authenticated Select Audit Logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Anon & Authenticated Insert Audit Logs" ON public.audit_logs;

DROP POLICY IF EXISTS "Anon View Communities" ON public.communities;
DROP POLICY IF EXISTS "Anon View Gates" ON public.gates;
DROP POLICY IF EXISTS "Anon View Blocks" ON public.buildings_blocks;
DROP POLICY IF EXISTS "Anon View Flats" ON public.flats;
DROP POLICY IF EXISTS "Anon View User Profiles" ON public.user_profiles;

-- B. Drop permissive policies from all_in_one_setup.sql
DROP POLICY IF EXISTS "Live Multi-Device Select Visitor Requests" ON public.visitor_requests;
DROP POLICY IF EXISTS "Live Multi-Device Insert Visitor Requests" ON public.visitor_requests;
DROP POLICY IF EXISTS "Live Multi-Device Update Visitor Requests" ON public.visitor_requests;

DROP POLICY IF EXISTS "Live Multi-Device Select Guest Passes" ON public.guest_passes;
DROP POLICY IF EXISTS "Live Multi-Device Insert Guest Passes" ON public.guest_passes;
DROP POLICY IF EXISTS "Live Multi-Device Update Guest Passes" ON public.guest_passes;

DROP POLICY IF EXISTS "Live View Communities" ON public.communities;
DROP POLICY IF EXISTS "Live View Gates" ON public.gates;
DROP POLICY IF EXISTS "Live View Blocks" ON public.buildings_blocks;
DROP POLICY IF EXISTS "Live View Flats" ON public.flats;
DROP POLICY IF EXISTS "Live View User Profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Live View Flat Residents" ON public.flat_residents;
DROP POLICY IF EXISTS "Live View Audit Logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Live Insert Audit Logs" ON public.audit_logs;

-- C. Drop permissive storage policies
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'storage' AND tablename = 'objects') THEN
    DROP POLICY IF EXISTS "Live Upload Visitor Photos" ON storage.objects;
    DROP POLICY IF EXISTS "Live Read Visitor Photos" ON storage.objects;
  END IF;
END $$;

-- D. Revoke all table privileges from anon role
REVOKE ALL ON TABLE public.visitor_requests FROM anon;
REVOKE ALL ON TABLE public.guest_passes FROM anon;
REVOKE ALL ON TABLE public.audit_logs FROM anon;
REVOKE ALL ON TABLE public.user_profiles FROM anon;
REVOKE ALL ON TABLE public.flat_residents FROM anon;
REVOKE ALL ON TABLE public.communities FROM anon;
REVOKE ALL ON TABLE public.gates FROM anon;
REVOKE ALL ON TABLE public.buildings_blocks FROM anon;
REVOKE ALL ON TABLE public.flats FROM anon;


-- ----------------------------------------------------------------------------
-- PART 2: SCHEMA CONSTRAINTS & DATA INTEGRITY
-- ----------------------------------------------------------------------------

-- Ensure entries_used is within bounds [0, max_entries]
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_guest_passes_entries'
  ) THEN
    ALTER TABLE public.guest_passes
      ADD CONSTRAINT chk_guest_passes_entries
      CHECK (entries_used >= 0 AND entries_used <= max_entries);
  END IF;
END $$;

-- Ensure pass validity timeframe is positive
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_guest_passes_dates'
  ) THEN
    ALTER TABLE public.guest_passes
      ADD CONSTRAINT chk_guest_passes_dates
      CHECK (valid_until > valid_from);
  END IF;
END $$;

-- Ensure checkout timestamp cannot precede check-in timestamp
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_visitor_checkout_time'
  ) THEN
    ALTER TABLE public.visitor_requests
      ADD CONSTRAINT chk_visitor_checkout_time
      CHECK (check_out_time IS NULL OR check_in_time IS NULL OR check_out_time >= check_in_time);
  END IF;
END $$;


-- ----------------------------------------------------------------------------
-- PART 3: HARDEN RLS HELPER FUNCTIONS (SET search_path = '')
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS public.user_role
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT role FROM public.user_profiles WHERE id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.get_auth_role() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_auth_role() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.get_auth_community()
RETURNS pg_catalog.uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT community_id FROM public.user_profiles WHERE id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.get_auth_community() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_auth_community() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.is_user_flat_member(check_flat_id pg_catalog.uuid)
RETURNS pg_catalog.bool
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.flat_residents
    WHERE flat_id = check_flat_id
      AND user_id = auth.uid()
      AND is_approved = TRUE
  );
$$;

REVOKE ALL ON FUNCTION public.is_user_flat_member(pg_catalog.uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_user_flat_member(pg_catalog.uuid) TO authenticated, service_role;


-- ----------------------------------------------------------------------------
-- PART 4: VISITOR STATE MACHINE TRANSITION & AUTHORIZATION TRIGGER
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.fn_enforce_visitor_status_transition()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_caller_role public.user_role;
  v_caller_community pg_catalog.uuid;
  v_is_flat_member pg_catalog.bool;
BEGIN
  -- Prevent modification of immutable foreign keys
  IF NEW.community_id <> OLD.community_id THEN
    RAISE EXCEPTION 'Security violation: community_id is immutable on visitor requests'
      USING ERRCODE = 'integrity_constraint_violation';
  END IF;

  IF NEW.flat_id <> OLD.flat_id THEN
    RAISE EXCEPTION 'Security violation: flat_id is immutable on visitor requests'
      USING ERRCODE = 'integrity_constraint_violation';
  END IF;

  -- If status has not changed, allow non-lifecycle updates (metadata, notes)
  IF OLD.status = NEW.status THEN
    NEW.updated_at := pg_catalog.now();
    RETURN NEW;
  END IF;

  -- 1. State machine transition check
  CASE OLD.status
    WHEN 'pending' THEN
      IF NOT (NEW.status IN ('approved', 'rejected', 'expired', 'cancelled')) THEN
        RAISE EXCEPTION 'Invalid status transition: Pending request cannot transition directly to "%"', NEW.status
          USING ERRCODE = 'check_violation';
      END IF;

    WHEN 'approved' THEN
      IF NOT (NEW.status IN ('checked_in', 'expired', 'cancelled')) THEN
        RAISE EXCEPTION 'Invalid status transition: Approved request cannot transition to "%"', NEW.status
          USING ERRCODE = 'check_violation';
      END IF;

    WHEN 'checked_in' THEN
      IF NEW.status <> 'checked_out' THEN
        RAISE EXCEPTION 'Invalid status transition: Checked-in visitor can only transition to "checked_out", not "%"', NEW.status
          USING ERRCODE = 'check_violation';
      END IF;

    -- Terminal states cannot be reopened or modified under any circumstance
    WHEN 'rejected' THEN
      RAISE EXCEPTION 'Terminal state: Rejected visitor request cannot be reopened or transitioned'
        USING ERRCODE = 'check_violation';

    WHEN 'expired' THEN
      RAISE EXCEPTION 'Terminal state: Expired visitor request cannot be reopened or transitioned'
        USING ERRCODE = 'check_violation';

    WHEN 'cancelled' THEN
      RAISE EXCEPTION 'Terminal state: Cancelled visitor request cannot be reopened or transitioned'
        USING ERRCODE = 'check_violation';

    WHEN 'checked_out' THEN
      RAISE EXCEPTION 'Terminal state: Checked-out visitor request cannot be reopened or transitioned'
        USING ERRCODE = 'check_violation';

    ELSE
      RAISE EXCEPTION 'Unknown current visitor status: "%"', OLD.status
        USING ERRCODE = 'check_violation';
  END CASE;

  -- 2. Authorization enforcement when invoked by an authenticated session
  IF auth.uid() IS NOT NULL THEN
    SELECT role, community_id INTO v_caller_role, v_caller_community
    FROM public.user_profiles
    WHERE id = auth.uid();

    -- Super admins bypass community-level restriction
    IF v_caller_role <> 'super_admin' THEN
      -- A. Approvals and Rejections: Strictly limited to authorized residents of that specific flat
      IF NEW.status IN ('approved', 'rejected') THEN
        SELECT EXISTS (
          SELECT 1 FROM public.flat_residents
          WHERE flat_id = OLD.flat_id
            AND user_id = auth.uid()
            AND is_approved = TRUE
        ) INTO v_is_flat_member;

        IF NOT v_is_flat_member AND v_caller_role <> 'community_admin' THEN
          RAISE EXCEPTION 'Unauthorized: Only an authorized resident of this flat can approve or reject visitor requests'
            USING ERRCODE = 'insufficient_privilege';
        END IF;

        IF NEW.decision_by IS NULL THEN
          NEW.decision_by := auth.uid();
        END IF;
      END IF;

      -- B. Check-in and Check-out: Strictly limited to security guards of the same community
      IF NEW.status IN ('checked_in', 'checked_out') THEN
        IF v_caller_role <> 'security_guard' AND v_caller_role <> 'community_admin' THEN
          RAISE EXCEPTION 'Unauthorized: Only on-duty security personnel can check-in or check-out visitors'
            USING ERRCODE = 'insufficient_privilege';
        END IF;

        IF v_caller_community <> OLD.community_id THEN
          RAISE EXCEPTION 'Tenant isolation violation: Guard cannot operate across communities'
            USING ERRCODE = 'insufficient_privilege';
        END IF;
      END IF;
    END IF;
  END IF;

  -- 3. Automatic timestamp assignments
  IF NEW.status = 'checked_in' AND NEW.check_in_time IS NULL THEN
    NEW.check_in_time := pg_catalog.now();
  END IF;

  IF NEW.status = 'checked_out' AND NEW.check_out_time IS NULL THEN
    NEW.check_out_time := pg_catalog.now();
  END IF;

  IF NEW.status IN ('approved', 'rejected') AND NEW.decision_at IS NULL THEN
    NEW.decision_at := pg_catalog.now();
  END IF;

  NEW.updated_at := pg_catalog.now();
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_enforce_visitor_status_transition() FROM PUBLIC, anon;

DROP TRIGGER IF EXISTS trg_enforce_visitor_status_transition ON public.visitor_requests;
CREATE TRIGGER trg_enforce_visitor_status_transition
  BEFORE UPDATE OF status, community_id, flat_id ON public.visitor_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_enforce_visitor_status_transition();


-- ----------------------------------------------------------------------------
-- PART 5: ATOMIC GUEST PASS VERIFICATION & CHECK-IN (ANTI-REPLAY RPC)
-- ----------------------------------------------------------------------------

-- Drop old signatures to avoid overloaded ambivalence
DROP FUNCTION IF EXISTS public.fn_verify_and_use_guest_pass(character varying, uuid, uuid);
DROP FUNCTION IF EXISTS public.fn_verify_and_use_guest_pass(text, uuid, uuid);
DROP FUNCTION IF EXISTS public.fn_verify_and_use_guest_pass(text, uuid);

CREATE OR REPLACE FUNCTION public.fn_verify_and_use_guest_pass(
  p_pass_code pg_catalog.text,
  p_gate_id pg_catalog.uuid
)
RETURNS pg_catalog.jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_caller_id pg_catalog.uuid;
  v_guard_profile RECORD;
  v_gate RECORD;
  v_pass RECORD;
  v_new_request_id pg_catalog.uuid;
BEGIN
  -- 1. Authenticate caller strictly through session context (NEVER accept client-supplied guard ID)
  v_caller_id := auth.uid();

  IF v_caller_id IS NULL THEN
    RETURN pg_catalog.jsonb_build_object(
      'success', false,
      'error_code', 'AUTHENTICATION_REQUIRED',
      'message', 'Authentication required to verify guest pass.'
    );
  END IF;

  -- 2. Validate guard profile and active status
  SELECT * INTO v_guard_profile
  FROM public.user_profiles
  WHERE id = v_caller_id AND is_active = TRUE;

  IF NOT FOUND THEN
    RETURN pg_catalog.jsonb_build_object(
      'success', false,
      'error_code', 'GUARD_NOT_FOUND',
      'message', 'Operator profile not found or inactive.'
    );
  END IF;

  IF v_guard_profile.role NOT IN ('security_guard', 'community_admin', 'super_admin') THEN
    RETURN pg_catalog.jsonb_build_object(
      'success', false,
      'error_code', 'UNAUTHORIZED_ROLE',
      'message', 'Only on-duty security guards or community administrators may verify passes.'
    );
  END IF;

  -- 3. Verify gate belongs to the guard's community and is active
  SELECT * INTO v_gate
  FROM public.gates
  WHERE id = p_gate_id AND is_active = TRUE;

  IF NOT FOUND THEN
    RETURN pg_catalog.jsonb_build_object(
      'success', false,
      'error_code', 'INVALID_GATE',
      'message', 'Selected gate station is invalid or inactive.'
    );
  END IF;

  IF v_guard_profile.role <> 'super_admin' AND v_guard_profile.community_id <> v_gate.community_id THEN
    RETURN pg_catalog.jsonb_build_object(
      'success', false,
      'error_code', 'GATE_COMMUNITY_MISMATCH',
      'message', 'Gate belongs to another residential community.'
    );
  END IF;

  -- 4. Atomic Pass Lookup with ROW-LEVEL LOCK (FOR UPDATE)
  -- Scoped by community_id to eliminate cross-tenant PIN collisions
  SELECT * INTO v_pass
  FROM public.guest_passes
  WHERE pass_code = pg_catalog.btrim(p_pass_code)
    AND community_id = v_gate.community_id
  FOR UPDATE;

  -- 5. Non-enumerating validation: Uniform failure prevents PIN brute-force discovery
  IF NOT FOUND 
     OR NOT v_pass.is_active 
     OR pg_catalog.now() > v_pass.valid_until 
     OR pg_catalog.now() < v_pass.valid_from THEN
    
    -- Deactivate expired pass if encountered
    IF FOUND AND pg_catalog.now() > v_pass.valid_until THEN
      UPDATE public.guest_passes SET is_active = FALSE WHERE id = v_pass.id;
    END IF;

    RETURN pg_catalog.jsonb_build_object(
      'success', false,
      'error_code', 'INVALID_OR_EXPIRED_PASS',
      'message', 'Guest pass is invalid, expired, or inactive.'
    );
  END IF;

  -- 6. Check entry limit
  IF v_pass.entries_used >= v_pass.max_entries THEN
    UPDATE public.guest_passes SET is_active = FALSE WHERE id = v_pass.id;
    RETURN pg_catalog.jsonb_build_object(
      'success', false,
      'error_code', 'PASS_LIMIT_EXCEEDED',
      'message', 'Guest pass maximum entries limit has been reached.'
    );
  END IF;

  -- 7. Atomically increment entry counter and update active state
  UPDATE public.guest_passes
  SET 
    entries_used = entries_used + 1,
    is_active = ((entries_used + 1) < max_entries)
  WHERE id = v_pass.id;

  -- 8. Create checked_in visitor_requests row
  INSERT INTO public.visitor_requests (
    community_id,
    gate_id,
    flat_id,
    guard_id,
    guest_pass_id,
    visitor_name,
    visitor_phone,
    category,
    purpose,
    status,
    consent_obtained,
    decision_by,
    decision_at,
    check_in_time,
    checked_in_by,
    created_at,
    updated_at
  ) VALUES (
    v_pass.community_id,
    v_gate.id,
    v_pass.flat_id,
    v_caller_id,
    v_pass.id,
    v_pass.guest_name,
    pg_catalog.coalesce(v_pass.guest_phone, 'N/A'),
    v_pass.category,
    pg_catalog.coalesce(v_pass.notes, 'Pre-approved guest pass entry'),
    'checked_in',
    TRUE,
    v_pass.created_by,
    v_pass.created_at,
    pg_catalog.now(),
    v_caller_id,
    pg_catalog.now(),
    pg_catalog.now()
  )
  RETURNING id INTO v_new_request_id;

  -- 9. Write immutable audit log
  INSERT INTO public.audit_logs (
    community_id,
    actor_id,
    action,
    entity_type,
    entity_id,
    metadata
  ) VALUES (
    v_pass.community_id,
    v_caller_id,
    'CHECK_IN_GUEST_PASS',
    'visitor_requests',
    v_new_request_id,
    pg_catalog.jsonb_build_object(
      'pass_id', v_pass.id,
      'guest_name', v_pass.guest_name,
      'flat_id', v_pass.flat_id,
      'gate_id', v_gate.id,
      'entries_used', v_pass.entries_used + 1,
      'max_entries', v_pass.max_entries
    )
  );

  RETURN pg_catalog.jsonb_build_object(
    'success', true,
    'request_id', v_new_request_id,
    'guest_name', v_pass.guest_name,
    'flat_id', v_pass.flat_id,
    'entries_remaining', v_pass.max_entries - (v_pass.entries_used + 1),
    'message', 'Pass verified. Boom barrier entry confirmed.'
  );
END;
$$;

-- Restrict RPC execution: Revoke PUBLIC and anon, grant ONLY to authenticated
REVOKE ALL ON FUNCTION public.fn_verify_and_use_guest_pass(pg_catalog.text, pg_catalog.uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_verify_and_use_guest_pass(pg_catalog.text, pg_catalog.uuid) TO authenticated;


-- ----------------------------------------------------------------------------
-- PART 6: SYSTEM EXPIRATION FUNCTION (RESTRICTED TO service_role ONLY)
-- ----------------------------------------------------------------------------

-- Drop old signatures
DROP FUNCTION IF EXISTS public.fn_expire_stale_visitor_requests(integer);
DROP FUNCTION IF EXISTS public.fn_expire_stale_visitor_requests(integer, uuid);

CREATE OR REPLACE FUNCTION public.fn_expire_stale_visitor_requests(
  p_expiration_minutes pg_catalog.int4 DEFAULT 10,
  p_community_id pg_catalog.uuid DEFAULT NULL
)
RETURNS pg_catalog.jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_effective_minutes pg_catalog.int4;
  v_expired_requests_count pg_catalog.int4 := 0;
  v_expired_passes_count pg_catalog.int4 := 0;
BEGIN
  -- Strict caller verification: Reject any caller that is NOT service_role
  -- In Supabase, auth.role() returns 'service_role' for internal cron/workers and 'authenticated'/'anon' for users
  IF auth.role() IS NOT NULL AND auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Access denied: System expiration function may only be executed by service_role'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- Sanitize expiration cutoff (minimum 1 minute, default 10 minutes)
  v_effective_minutes := pg_catalog.greatest(pg_catalog.coalesce(p_expiration_minutes, 10), 1);

  -- 1. Expire stale pending visitor requests
  WITH expired_rows AS (
    UPDATE public.visitor_requests
    SET 
      status = 'expired',
      updated_at = pg_catalog.now()
    WHERE 
      status = 'pending'
      AND created_at < (pg_catalog.now() - (v_effective_minutes || ' minutes')::pg_catalog.interval)
      AND (p_community_id IS NULL OR community_id = p_community_id)
    RETURNING id
  )
  SELECT pg_catalog.count(*) INTO v_expired_requests_count FROM expired_rows;

  -- 2. Deactivate expired guest passes
  WITH expired_pass_rows AS (
    UPDATE public.guest_passes
    SET 
      is_active = FALSE
    WHERE 
      is_active = TRUE
      AND valid_until < pg_catalog.now()
      AND (p_community_id IS NULL OR community_id = p_community_id)
    RETURNING id
  )
  SELECT pg_catalog.count(*) INTO v_expired_passes_count FROM expired_pass_rows;

  RETURN pg_catalog.jsonb_build_object(
    'success', true,
    'expired_requests_count', v_expired_requests_count,
    'expired_passes_count', v_expired_passes_count,
    'cutoff_interval_minutes', v_effective_minutes,
    'executed_at', pg_catalog.now()
  );
END;
$$;

-- Critical: Revoke from PUBLIC, anon, AND authenticated to block all browser/resident/guard RPC access
REVOKE ALL ON FUNCTION public.fn_expire_stale_visitor_requests(pg_catalog.int4, pg_catalog.uuid) FROM PUBLIC, anon, authenticated;
-- Grant exclusively to service_role (trusted scheduler, pg_cron, or secure edge function worker)
GRANT EXECUTE ON FUNCTION public.fn_expire_stale_visitor_requests(pg_catalog.int4, pg_catalog.uuid) TO service_role;


-- ----------------------------------------------------------------------------
-- PART 7: IMMUTABLE AUDIT LOG PROTECTION & LIFECYCLE AUDIT TRIGGER
-- ----------------------------------------------------------------------------

-- A. Anti-tampering trigger function
CREATE OR REPLACE FUNCTION public.fn_prevent_audit_log_tampering()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RAISE EXCEPTION 'Security violation: Audit logs are immutable and cannot be updated, deleted, or truncated'
    USING ERRCODE = 'restrict_violation';
  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_prevent_audit_log_tampering() FROM PUBLIC, anon;

-- Row-level trigger catches UPDATE and DELETE
DROP TRIGGER IF EXISTS trg_prevent_audit_log_tampering_row ON public.audit_logs;
CREATE TRIGGER trg_prevent_audit_log_tampering_row
  BEFORE UPDATE OR DELETE ON public.audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_prevent_audit_log_tampering();

-- Statement-level trigger catches TRUNCATE
DROP TRIGGER IF EXISTS trg_prevent_audit_log_tampering_stmt ON public.audit_logs;
CREATE TRIGGER trg_prevent_audit_log_tampering_stmt
  BEFORE TRUNCATE ON public.audit_logs
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.fn_prevent_audit_log_tampering();

-- Revoke mutation grants on audit_logs from all non-admin roles
REVOKE UPDATE, DELETE, TRUNCATE ON TABLE public.audit_logs FROM anon, authenticated, public;

-- B. Tamper-evident lifecycle audit trigger on visitor requests (INSERT, UPDATE, DELETE)
CREATE OR REPLACE FUNCTION public.fn_audit_visitor_lifecycle_events()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_action pg_catalog.text;
  v_actor pg_catalog.uuid;
BEGIN
  v_actor := auth.uid();

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (
      community_id,
      actor_id,
      action,
      entity_type,
      entity_id,
      metadata,
      created_at
    ) VALUES (
      NEW.community_id,
      pg_catalog.coalesce(v_actor, NEW.guard_id),
      'REGISTER_VISITOR',
      'visitor_requests',
      NEW.id,
      pg_catalog.jsonb_build_object(
        'visitor_name', NEW.visitor_name,
        'flat_id', NEW.flat_id,
        'category', NEW.category,
        'status', NEW.status
      ),
      pg_catalog.now()
    );
    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    -- If status transitioned, record corresponding audit event
    IF OLD.status <> NEW.status THEN
      CASE NEW.status
        WHEN 'approved' THEN
          v_action := 'APPROVE_VISITOR';
          v_actor := pg_catalog.coalesce(v_actor, NEW.decision_by);
        WHEN 'rejected' THEN
          v_action := 'REJECT_VISITOR';
          v_actor := pg_catalog.coalesce(v_actor, NEW.decision_by);
        WHEN 'checked_in' THEN
          v_action := 'CHECK_IN';
          v_actor := pg_catalog.coalesce(v_actor, NEW.checked_in_by, NEW.guard_id);
        WHEN 'checked_out' THEN
          v_action := 'CHECK_OUT';
          v_actor := pg_catalog.coalesce(v_actor, NEW.checked_out_by, NEW.guard_id);
        WHEN 'cancelled' THEN
          v_action := 'CANCEL_VISITOR';
          v_actor := pg_catalog.coalesce(v_actor, NEW.decision_by, NEW.checked_in_by, NEW.guard_id);
        WHEN 'expired' THEN
          v_action := 'EXPIRE_VISITOR';
          v_actor := NULL; -- System/Scheduler action
        ELSE
          v_action := 'UPDATE_VISITOR_STATUS';
      END CASE;

      INSERT INTO public.audit_logs (
        community_id,
        actor_id,
        action,
        entity_type,
        entity_id,
        metadata,
        created_at
      ) VALUES (
        NEW.community_id,
        v_actor,
        v_action,
        'visitor_requests',
        NEW.id,
        pg_catalog.jsonb_build_object(
          'old_status', OLD.status,
          'new_status', NEW.status,
          'visitor_name', NEW.visitor_name,
          'flat_id', NEW.flat_id,
          'rejection_reason', NEW.rejection_reason
        ),
        pg_catalog.now()
      );
    END IF;

    -- Track supervisor escalation
    IF (OLD.supervisor_escalated IS DISTINCT FROM NEW.supervisor_escalated) AND NEW.supervisor_escalated = TRUE THEN
      INSERT INTO public.audit_logs (
        community_id,
        actor_id,
        action,
        entity_type,
        entity_id,
        metadata,
        created_at
      ) VALUES (
        NEW.community_id,
        pg_catalog.coalesce(v_actor, NEW.guard_id),
        'ESCALATE_VISITOR',
        'visitor_requests',
        NEW.id,
        pg_catalog.jsonb_build_object(
          'visitor_name', NEW.visitor_name,
          'notes', NEW.supervisor_notes
        ),
        pg_catalog.now()
      );
    END IF;

    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    -- Preserve audit trail even if record is deleted
    INSERT INTO public.audit_logs (
      community_id,
      actor_id,
      action,
      entity_type,
      entity_id,
      metadata,
      created_at
    ) VALUES (
      OLD.community_id,
      v_actor,
      'DELETE_VISITOR_REQUEST',
      'visitor_requests',
      OLD.id,
      pg_catalog.jsonb_build_object(
        'visitor_name', OLD.visitor_name,
        'flat_id', OLD.flat_id,
        'status', OLD.status
      ),
      pg_catalog.now()
    );
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_audit_visitor_lifecycle_events() FROM PUBLIC, anon;

DROP TRIGGER IF EXISTS trg_audit_visitor_lifecycle_events ON public.visitor_requests;
CREATE TRIGGER trg_audit_visitor_lifecycle_events
  AFTER INSERT OR UPDATE OR DELETE ON public.visitor_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_audit_visitor_lifecycle_events();


-- ----------------------------------------------------------------------------
-- PART 8: COMPOSITE PERFORMANCE INDEXES
-- ----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_vr_community_status_created 
  ON public.visitor_requests(community_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_vr_flat_status_created 
  ON public.visitor_requests(flat_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_guest_passes_code_community 
  ON public.guest_passes(pass_code, community_id, is_active);

CREATE INDEX IF NOT EXISTS idx_audit_logs_community_created 
  ON public.audit_logs(community_id, created_at DESC);

-- ============================================================================
-- Migration 06 (Final) successfully prepared.
-- ============================================================================
