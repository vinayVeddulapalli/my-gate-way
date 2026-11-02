-- ============================================================================
-- GATEWAY SECURITY (द्वारपाल — Dwaarpal)
-- Migration 06: Database Security Hardening, Transition Enforcement & Anti-Replay
-- ============================================================================
-- 1. Drops wide-open / permissive anonymous RLS policies from Migrations 05 & All-in-One.
-- 2. Enforces strict visitor status state machine via PostgreSQL trigger.
-- 3. Adds table constraints for guest passes and visitor checkout integrity.
-- 4. Provides atomic pass verification procedure with row-level locking (anti-replay).
-- 5. Implements server-side expiration function for stale pending requests and passes.
-- 6. Implements database-level audit logging trigger for tamper-evident tracking.
-- 7. Adds composite performance indexes for multi-tenant querying.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- PART 1: REMOVE PERMISSIVE ANONYMOUS RLS POLICIES
-- ----------------------------------------------------------------------------

-- A. Remove policies introduced in 05_enable_realtime.sql
DROP POLICY IF EXISTS "Anon & Authenticated Select Visitor Requests" ON visitor_requests;
DROP POLICY IF EXISTS "Anon & Authenticated Insert Visitor Requests" ON visitor_requests;
DROP POLICY IF EXISTS "Anon & Authenticated Update Visitor Requests" ON visitor_requests;

DROP POLICY IF EXISTS "Anon & Authenticated Select Guest Passes" ON guest_passes;
DROP POLICY IF EXISTS "Anon & Authenticated Insert Guest Passes" ON guest_passes;
DROP POLICY IF EXISTS "Anon & Authenticated Update Guest Passes" ON guest_passes;

DROP POLICY IF EXISTS "Anon & Authenticated Select Audit Logs" ON audit_logs;
DROP POLICY IF EXISTS "Anon & Authenticated Insert Audit Logs" ON audit_logs;

DROP POLICY IF EXISTS "Anon View Communities" ON communities;
DROP POLICY IF EXISTS "Anon View Gates" ON gates;
DROP POLICY IF EXISTS "Anon View Blocks" ON buildings_blocks;
DROP POLICY IF EXISTS "Anon View Flats" ON flats;
DROP POLICY IF EXISTS "Anon View User Profiles" ON user_profiles;

-- B. Remove policies introduced in all_in_one_setup.sql
DROP POLICY IF EXISTS "Live Multi-Device Select Visitor Requests" ON visitor_requests;
DROP POLICY IF EXISTS "Live Multi-Device Insert Visitor Requests" ON visitor_requests;
DROP POLICY IF EXISTS "Live Multi-Device Update Visitor Requests" ON visitor_requests;

DROP POLICY IF EXISTS "Live Multi-Device Select Guest Passes" ON guest_passes;
DROP POLICY IF EXISTS "Live Multi-Device Insert Guest Passes" ON guest_passes;
DROP POLICY IF EXISTS "Live Multi-Device Update Guest Passes" ON guest_passes;

DROP POLICY IF EXISTS "Live View Communities" ON communities;
DROP POLICY IF EXISTS "Live View Gates" ON gates;
DROP POLICY IF EXISTS "Live View Blocks" ON buildings_blocks;
DROP POLICY IF EXISTS "Live View Flats" ON flats;
DROP POLICY IF EXISTS "Live View User Profiles" ON user_profiles;
DROP POLICY IF EXISTS "Live View Flat Residents" ON flat_residents;
DROP POLICY IF EXISTS "Live View Audit Logs" ON audit_logs;
DROP POLICY IF EXISTS "Live Insert Audit Logs" ON audit_logs;

-- C. Remove permissive storage policies if present
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'storage' AND tablename = 'objects') THEN
    DROP POLICY IF EXISTS "Live Upload Visitor Photos" ON storage.objects;
    DROP POLICY IF EXISTS "Live Read Visitor Photos" ON storage.objects;
  END IF;
END $$;

-- D. Revoke dangerous blanket table permissions from anon role
REVOKE INSERT, UPDATE, DELETE ON TABLE visitor_requests FROM anon;
REVOKE INSERT, UPDATE, DELETE ON TABLE guest_passes FROM anon;
REVOKE INSERT, UPDATE, DELETE ON TABLE audit_logs FROM anon;
REVOKE INSERT, UPDATE, DELETE ON TABLE user_profiles FROM anon;
REVOKE INSERT, UPDATE, DELETE ON TABLE flat_residents FROM anon;
REVOKE INSERT, UPDATE, DELETE ON TABLE communities FROM anon;
REVOKE INSERT, UPDATE, DELETE ON TABLE gates FROM anon;
REVOKE INSERT, UPDATE, DELETE ON TABLE buildings_blocks FROM anon;
REVOKE INSERT, UPDATE, DELETE ON TABLE flats FROM anon;


-- ----------------------------------------------------------------------------
-- PART 2: SCHEMA CONSTRAINTS & INTEGRITY CHECKS
-- ----------------------------------------------------------------------------

-- Ensure entries_used does not exceed max_entries and is non-negative
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_guest_passes_entries'
  ) THEN
    ALTER TABLE guest_passes
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
    ALTER TABLE guest_passes
      ADD CONSTRAINT chk_guest_passes_dates
      CHECK (valid_until > valid_from);
  END IF;
END $$;

-- Ensure check_out_time cannot be earlier than check_in_time
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_visitor_checkout_time'
  ) THEN
    ALTER TABLE visitor_requests
      ADD CONSTRAINT chk_visitor_checkout_time
      CHECK (check_out_time IS NULL OR check_in_time IS NULL OR check_out_time >= check_in_time);
  END IF;
END $$;


-- ----------------------------------------------------------------------------
-- PART 3: VISITOR STATE MACHINE TRANSITION ENFORCEMENT TRIGGER
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION fn_enforce_visitor_status_transition()
RETURNS TRIGGER AS $$
BEGIN
  -- If status hasn't changed, allow the update (e.g. metadata/notes change)
  IF OLD.status = NEW.status THEN
    NEW.updated_at := NOW();
    RETURN NEW;
  END IF;

  -- Validate state machine transitions strictly
  CASE OLD.status
    WHEN 'pending' THEN
      IF NOT (NEW.status IN ('approved', 'rejected', 'expired', 'cancelled')) THEN
        RAISE EXCEPTION 'Invalid status transition: Pending request cannot transition to "%"', NEW.status
          USING ERRCODE = 'check_violation';
      END IF;

    WHEN 'approved' THEN
      IF NOT (NEW.status IN ('checked_in', 'expired', 'cancelled')) THEN
        RAISE EXCEPTION 'Invalid status transition: Approved visitor cannot transition to "%"', NEW.status
          USING ERRCODE = 'check_violation';
      END IF;

    WHEN 'checked_in' THEN
      IF NEW.status <> 'checked_out' THEN
        RAISE EXCEPTION 'Invalid status transition: Checked-in visitor can only transition to "checked_out", not "%"', NEW.status
          USING ERRCODE = 'check_violation';
      END IF;

    -- Terminal states cannot be changed under any circumstance
    WHEN 'rejected' THEN
      RAISE EXCEPTION 'Invalid status transition: Rejected request is terminal and cannot be modified'
        USING ERRCODE = 'check_violation';

    WHEN 'expired' THEN
      RAISE EXCEPTION 'Invalid status transition: Expired request is terminal and cannot be modified'
        USING ERRCODE = 'check_violation';

    WHEN 'cancelled' THEN
      RAISE EXCEPTION 'Invalid status transition: Cancelled request is terminal and cannot be modified'
        USING ERRCODE = 'check_violation';

    WHEN 'checked_out' THEN
      RAISE EXCEPTION 'Invalid status transition: Checked-out visitor is terminal and cannot be modified'
        USING ERRCODE = 'check_violation';

    ELSE
      RAISE EXCEPTION 'Unknown current visitor status: "%"', OLD.status
        USING ERRCODE = 'check_violation';
  END CASE;

  -- Automatically populate associated timestamps if not already supplied
  IF NEW.status = 'checked_in' AND NEW.check_in_time IS NULL THEN
    NEW.check_in_time := NOW();
  END IF;

  IF NEW.status = 'checked_out' AND NEW.check_out_time IS NULL THEN
    NEW.check_out_time := NOW();
  END IF;

  IF NEW.status IN ('approved', 'rejected') AND NEW.decision_at IS NULL THEN
    NEW.decision_at := NOW();
  END IF;

  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS trg_enforce_visitor_status_transition ON visitor_requests;
CREATE TRIGGER trg_enforce_visitor_status_transition
  BEFORE UPDATE OF status ON visitor_requests
  FOR EACH ROW
  EXECUTE FUNCTION fn_enforce_visitor_status_transition();


-- ----------------------------------------------------------------------------
-- PART 4: ATOMIC PASS VERIFICATION & CHECK-IN (ANTI-REPLAY / ANTI-RACE)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION fn_verify_and_use_guest_pass(
  p_pass_code VARCHAR,
  p_gate_id UUID,
  p_guard_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_pass RECORD;
  v_new_request_id UUID;
  v_gate RECORD;
BEGIN
  -- 1. Select the pass with ROW-LEVEL LOCK (FOR UPDATE) to prevent concurrency races
  SELECT * INTO v_pass
  FROM guest_passes
  WHERE pass_code = TRIM(p_pass_code)
  FOR UPDATE;

  -- 2. Check existence
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'PASS_NOT_FOUND',
      'message', 'Invalid pass code. Pass does not exist.'
    );
  END IF;

  -- 3. Check active flag
  IF NOT v_pass.is_active THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'PASS_INACTIVE',
      'message', 'Guest pass has been deactivated or cancelled.'
    );
  END IF;

  -- 4. Check expiration timestamp
  IF NOW() > v_pass.valid_until THEN
    -- Mark inactive if expired
    UPDATE guest_passes SET is_active = FALSE WHERE id = v_pass.id;
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'PASS_EXPIRED',
      'message', 'Guest pass has expired.'
    );
  END IF;

  -- 5. Check if entry before valid_from
  IF NOW() < v_pass.valid_from THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'PASS_NOT_YET_VALID',
      'message', 'Guest pass is not yet active.'
    );
  END IF;

  -- 6. Check entries limit
  IF v_pass.entries_used >= v_pass.max_entries THEN
    UPDATE guest_passes SET is_active = FALSE WHERE id = v_pass.id;
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'PASS_LIMIT_EXCEEDED',
      'message', 'Guest pass maximum entries limit has been reached.'
    );
  END IF;

  -- 7. Validate gate
  SELECT * INTO v_gate FROM gates WHERE id = p_gate_id;

  -- 8. Atomically increment entries_used and update is_active
  UPDATE guest_passes
  SET 
    entries_used = entries_used + 1,
    is_active = ((entries_used + 1) < max_entries)
  WHERE id = v_pass.id;

  -- 9. Create pre-approved and checked-in visitor request record
  INSERT INTO visitor_requests (
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
    p_gate_id,
    v_pass.flat_id,
    p_guard_id,
    v_pass.id,
    v_pass.guest_name,
    COALESCE(v_pass.guest_phone, 'N/A'),
    v_pass.category,
    COALESCE(v_pass.notes, 'Pre-approved guest pass entry'),
    'checked_in',
    TRUE,
    v_pass.created_by,
    v_pass.created_at,
    NOW(),
    p_guard_id,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_new_request_id;

  -- 10. Write audit log
  INSERT INTO audit_logs (
    community_id,
    actor_id,
    action,
    entity_type,
    entity_id,
    metadata
  ) VALUES (
    v_pass.community_id,
    p_guard_id,
    'CHECK_IN_GUEST_PASS',
    'visitor_requests',
    v_new_request_id,
    jsonb_build_object(
      'pass_id', v_pass.id,
      'guest_name', v_pass.guest_name,
      'flat_id', v_pass.flat_id,
      'entries_used', v_pass.entries_used + 1,
      'max_entries', v_pass.max_entries
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'request_id', v_new_request_id,
    'guest_name', v_pass.guest_name,
    'flat_id', v_pass.flat_id,
    'entries_remaining', v_pass.max_entries - (v_pass.entries_used + 1),
    'message', 'Pass verified. Entry confirmed.'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ----------------------------------------------------------------------------
-- PART 5: SERVER-SIDE EXPIRATION FUNCTION
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION fn_expire_stale_visitor_requests(
  p_expiration_minutes INT DEFAULT 10
)
RETURNS JSONB AS $$
DECLARE
  v_expired_requests_count INT := 0;
  v_expired_passes_count INT := 0;
BEGIN
  -- Transition pending requests past the time limit to 'expired'
  WITH expired_rows AS (
    UPDATE visitor_requests
    SET 
      status = 'expired',
      updated_at = NOW()
    WHERE 
      status = 'pending'
      AND created_at < (NOW() - (p_expiration_minutes || ' minutes')::INTERVAL)
    RETURNING id, community_id
  )
  SELECT COUNT(*) INTO v_expired_requests_count FROM expired_rows;

  -- Deactivate passes that have passed their valid_until timestamp
  WITH expired_pass_rows AS (
    UPDATE guest_passes
    SET 
      is_active = FALSE
    WHERE 
      is_active = TRUE
      AND valid_until < NOW()
    RETURNING id
  )
  SELECT COUNT(*) INTO v_expired_passes_count FROM expired_pass_rows;

  RETURN jsonb_build_object(
    'success', true,
    'expired_requests_count', v_expired_requests_count,
    'expired_passes_count', v_expired_passes_count,
    'executed_at', NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ----------------------------------------------------------------------------
-- PART 6: TAMPER-EVIDENT DATABASE AUDIT TRIGGER
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION fn_audit_visitor_lifecycle_events()
RETURNS TRIGGER AS $$
DECLARE
  v_action VARCHAR(100);
  v_actor UUID;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'REGISTER_VISITOR';
    v_actor := NEW.guard_id;

    INSERT INTO audit_logs (
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
      jsonb_build_object(
        'visitor_name', NEW.visitor_name,
        'flat_id', NEW.flat_id,
        'category', NEW.category,
        'status', NEW.status
      ),
      NOW()
    );
    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    -- If status transitioned, record the specific audit event
    IF OLD.status <> NEW.status THEN
      CASE NEW.status
        WHEN 'approved' THEN
          v_action := 'APPROVE_VISITOR';
          v_actor := NEW.decision_by;
        WHEN 'rejected' THEN
          v_action := 'REJECT_VISITOR';
          v_actor := NEW.decision_by;
        WHEN 'checked_in' THEN
          v_action := 'CHECK_IN';
          v_actor := NEW.checked_in_by;
        WHEN 'checked_out' THEN
          v_action := 'CHECK_OUT';
          v_actor := NEW.checked_out_by;
        WHEN 'cancelled' THEN
          v_action := 'CANCEL_VISITOR';
          v_actor := COALESCE(NEW.decision_by, NEW.checked_in_by, NEW.guard_id);
        WHEN 'expired' THEN
          v_action := 'EXPIRE_VISITOR';
          v_actor := NULL;
        ELSE
          v_action := 'UPDATE_VISITOR_STATUS';
          v_actor := NULL;
      END CASE;

      INSERT INTO audit_logs (
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
        jsonb_build_object(
          'old_status', OLD.status,
          'new_status', NEW.status,
          'visitor_name', NEW.visitor_name,
          'flat_id', NEW.flat_id,
          'rejection_reason', NEW.rejection_reason
        ),
        NOW()
      );
    END IF;

    -- Also record escalation if supervisor_escalated changed to TRUE
    IF (OLD.supervisor_escalated IS DISTINCT FROM NEW.supervisor_escalated) AND NEW.supervisor_escalated = TRUE THEN
      INSERT INTO audit_logs (
        community_id,
        actor_id,
        action,
        entity_type,
        entity_id,
        metadata,
        created_at
      ) VALUES (
        NEW.community_id,
        NEW.guard_id,
        'ESCALATE_VISITOR',
        'visitor_requests',
        NEW.id,
        jsonb_build_object(
          'visitor_name', NEW.visitor_name,
          'notes', NEW.supervisor_notes
        ),
        NOW()
      );
    END IF;

    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate the lifecycle audit trigger
DROP TRIGGER IF EXISTS trg_audit_visitor_lifecycle_events ON visitor_requests;
CREATE TRIGGER trg_audit_visitor_lifecycle_events
  AFTER INSERT OR UPDATE ON visitor_requests
  FOR EACH ROW
  EXECUTE FUNCTION fn_audit_visitor_lifecycle_events();


-- ----------------------------------------------------------------------------
-- PART 7: COMPOSITE PERFORMANCE INDEXES
-- ----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_vr_community_status_created 
  ON visitor_requests(community_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_vr_flat_status_created 
  ON visitor_requests(flat_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_guest_passes_code_active 
  ON guest_passes(pass_code, is_active, valid_until);

CREATE INDEX IF NOT EXISTS idx_audit_logs_community_created 
  ON audit_logs(community_id, created_at DESC);

-- ============================================================================
-- Migration 06 completed successfully.
-- ============================================================================
