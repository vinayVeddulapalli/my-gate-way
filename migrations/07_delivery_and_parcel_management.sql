-- ============================================================================
-- GATEWAY SECURITY (द्वारपाल — Dwaarpal)
-- Migration 07: MyGate-Inspired Delivery and Parcel Management System
-- ============================================================================
-- Implements complete Delivery & Parcel lifecycle:
-- 1. Delivery Categories: food, courier, grocery, e_commerce, other.
-- 2. Enhanced Visitor Status: 'leave_at_gate', 'collected'.
-- 3. Dedicated parcel tracking fields (photo path, gate location, handover status, OTP, timestamps).
-- 4. Server-enforced transition triggers & constraints preventing collection without recording.
-- 5. Atomic parcel handover RPC fn_confirm_parcel_handover with OTP verification.
-- 6. Updated RLS policies for residents and security guards.
-- 7. Audit log triggers for parcel lifecycle (LEAVE_AT_GATE, COLLECT_PARCEL).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- PART 1: ENUMS AND TYPES
-- ----------------------------------------------------------------------------

-- Add new visitor statuses to enum public.visitor_status safely
ALTER TYPE public.visitor_status ADD VALUE IF NOT EXISTS 'leave_at_gate';
ALTER TYPE public.visitor_status ADD VALUE IF NOT EXISTS 'collected';

-- Create delivery_category enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'delivery_category') THEN
    CREATE TYPE public.delivery_category AS ENUM (
      'food',
      'courier',
      'grocery',
      'e_commerce',
      'other'
    );
  END IF;
END $$;


-- ----------------------------------------------------------------------------
-- PART 2: PARCEL COLUMNS ON public.visitor_requests
-- ----------------------------------------------------------------------------

ALTER TABLE public.visitor_requests
  ADD COLUMN IF NOT EXISTS delivery_category public.delivery_category DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS parcel_count INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS parcel_details TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS parcel_photo_path TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS gate_location VARCHAR(100) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS handover_status VARCHAR(50) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS collection_otp VARCHAR(10) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS collected_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS collected_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS collected_by_name VARCHAR(255) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS handover_guard_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL;

-- ----------------------------------------------------------------------------
-- PART 3: DATA INTEGRITY CONSTRAINTS
-- ----------------------------------------------------------------------------

-- Rule: Cannot mark parcel collected without recording the actual collection action
ALTER TABLE public.visitor_requests
  DROP CONSTRAINT IF EXISTS chk_collected_requires_action;

ALTER TABLE public.visitor_requests
  ADD CONSTRAINT chk_collected_requires_action
  CHECK (
    status <> 'collected' 
    OR (
      collected_at IS NOT NULL 
      AND handover_status = 'collected' 
      AND (collected_by_name IS NOT NULL OR collected_by IS NOT NULL)
    )
  );

-- Rule: Handover status consistency when in leave_at_gate
ALTER TABLE public.visitor_requests
  DROP CONSTRAINT IF EXISTS chk_leave_at_gate_handover_status;

ALTER TABLE public.visitor_requests
  ADD CONSTRAINT chk_leave_at_gate_handover_status
  CHECK (
    status <> 'leave_at_gate'
    OR handover_status IN ('at_gate', 'collected')
  );

-- Rule: Parcel count must be at least 1 if specified
ALTER TABLE public.visitor_requests
  DROP CONSTRAINT IF EXISTS chk_parcel_count_positive;

ALTER TABLE public.visitor_requests
  ADD CONSTRAINT chk_parcel_count_positive
  CHECK (parcel_count IS NULL OR parcel_count >= 1);


-- ----------------------------------------------------------------------------
-- PART 4: HARDENED VISITOR & PARCEL STATE MACHINE TRIGGER
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

  -- If status has not changed, allow non-lifecycle updates (parcel metadata, shelf notes)
  IF OLD.status = NEW.status THEN
    NEW.updated_at := pg_catalog.now();
    RETURN NEW;
  END IF;

  -- 1. State machine transition check
  CASE OLD.status
    WHEN 'pending' THEN
      IF NOT (NEW.status IN ('approved', 'rejected', 'leave_at_gate', 'expired', 'cancelled')) THEN
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

    WHEN 'leave_at_gate' THEN
      IF NOT (NEW.status IN ('collected', 'cancelled')) THEN
        RAISE EXCEPTION 'Invalid status transition: Parcel awaiting collection at gate can only transition to "collected" or "cancelled", not "%"', NEW.status
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

    WHEN 'collected' THEN
      RAISE EXCEPTION 'Terminal state: Collected parcel request cannot be reopened or transitioned'
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
      -- A. Approvals, Rejections, and Leave at Gate: Strictly limited to authorized residents of that specific flat
      IF NEW.status IN ('approved', 'rejected', 'leave_at_gate') THEN
        SELECT EXISTS (
          SELECT 1 FROM public.flat_residents
          WHERE flat_id = OLD.flat_id
            AND user_id = auth.uid()
            AND is_approved = TRUE
        ) INTO v_is_flat_member;

        IF NOT v_is_flat_member AND v_caller_role <> 'community_admin' THEN
          RAISE EXCEPTION 'Unauthorized: Only an authorized resident of this flat can decide on visitor requests or authorize Leave at Gate'
            USING ERRCODE = 'insufficient_privilege';
        END IF;

        IF NEW.decision_by IS NULL THEN
          NEW.decision_by := auth.uid();
        END IF;

        IF NEW.status = 'leave_at_gate' AND NEW.handover_status IS NULL THEN
          NEW.handover_status := 'at_gate';
        END IF;
      END IF;

      -- B. Check-in, Check-out, and Parcel Collection: Strictly limited to security guards of the same community
      IF NEW.status IN ('checked_in', 'checked_out', 'collected') THEN
        IF v_caller_role <> 'security_guard' AND v_caller_role <> 'community_admin' THEN
          RAISE EXCEPTION 'Unauthorized: Only on-duty security personnel can check-in visitors or mark parcels collected'
            USING ERRCODE = 'insufficient_privilege';
        END IF;

        IF v_caller_community <> OLD.community_id THEN
          RAISE EXCEPTION 'Tenant isolation violation: Guard cannot operate across communities'
            USING ERRCODE = 'insufficient_privilege';
        END IF;
      END IF;
    END IF;
  END IF;

  -- 3. Automatic timestamp and audit assignments
  IF NEW.status = 'checked_in' AND NEW.check_in_time IS NULL THEN
    NEW.check_in_time := pg_catalog.now();
  END IF;

  IF NEW.status = 'checked_out' AND NEW.check_out_time IS NULL THEN
    NEW.check_out_time := pg_catalog.now();
  END IF;

  IF NEW.status IN ('approved', 'rejected', 'leave_at_gate') AND NEW.decision_at IS NULL THEN
    NEW.decision_at := pg_catalog.now();
  END IF;

  IF NEW.status = 'collected' THEN
    IF NEW.collected_at IS NULL THEN
      NEW.collected_at := pg_catalog.now();
    END IF;
    NEW.handover_status := 'collected';
    IF NEW.handover_guard_id IS NULL AND auth.uid() IS NOT NULL THEN
      NEW.handover_guard_id := auth.uid();
    END IF;
  END IF;

  NEW.updated_at := pg_catalog.now();
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_enforce_visitor_status_transition() FROM PUBLIC, anon;


-- ----------------------------------------------------------------------------
-- PART 5: ATOMIC PARCEL HANDOVER RPC (GUARD COLLECTION CONFIRMATION)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.fn_confirm_parcel_handover(
  p_request_id pg_catalog.uuid,
  p_collection_otp pg_catalog.text DEFAULT NULL,
  p_collector_name pg_catalog.text DEFAULT NULL
)
RETURNS pg_catalog.jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_guard_id pg_catalog.uuid;
  v_guard_role public.user_role;
  v_guard_community pg_catalog.uuid;
  v_guard_name pg_catalog.varchar(255);
  v_request RECORD;
  v_collector_final pg_catalog.text;
BEGIN
  -- 1. Identify and authenticate caller
  v_guard_id := auth.uid();
  IF v_guard_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to confirm parcel handover'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT role, community_id, full_name
  INTO v_guard_role, v_guard_community, v_guard_name
  FROM public.user_profiles
  WHERE id = v_guard_id;

  IF v_guard_role IS NULL OR v_guard_role NOT IN ('security_guard', 'community_admin', 'super_admin') THEN
    RAISE EXCEPTION 'Unauthorized: Only on-duty security guards or community administrators can confirm parcel handover'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- 2. Select request with atomic row lock
  SELECT *
  INTO v_request
  FROM public.visitor_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Parcel record not found'
      USING ERRCODE = 'no_data_found';
  END IF;

  -- 3. Community isolation check
  IF v_guard_role <> 'super_admin' AND v_request.community_id <> v_guard_community THEN
    RAISE EXCEPTION 'Tenant isolation violation: Guard cannot access parcels belonging to another community'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- 4. State validation: Must be currently awaiting collection at gate
  IF v_request.status <> 'leave_at_gate' THEN
    RAISE EXCEPTION 'Invalid parcel state: Request status is currently "%". Only parcels in "leave_at_gate" can be marked collected', v_request.status
      USING ERRCODE = 'check_violation';
  END IF;

  -- 5. Collection OTP verification (if OTP was set by resident)
  IF v_request.collection_otp IS NOT NULL AND pg_catalog.length(pg_catalog.trim(v_request.collection_otp)) > 0 THEN
    IF p_collection_otp IS NULL OR pg_catalog.trim(p_collection_otp) = '' THEN
      RAISE EXCEPTION 'Collection OTP is required for this parcel'
        USING ERRCODE = 'invalid_parameter_value';
    END IF;

    IF pg_catalog.upper(pg_catalog.trim(v_request.collection_otp)) <> pg_catalog.upper(pg_catalog.trim(p_collection_otp)) THEN
      RAISE EXCEPTION 'Invalid Collection OTP. Handover denied'
        USING ERRCODE = 'invalid_authorization_specification';
    END IF;
  END IF;

  v_collector_final := COALESCE(NULLIF(pg_catalog.trim(p_collector_name), ''), 'Resident on record');

  -- 6. Atomic state transition and handover record
  UPDATE public.visitor_requests
  SET
    status = 'collected',
    handover_status = 'collected',
    collected_at = pg_catalog.now(),
    collected_by_name = v_collector_final,
    handover_guard_id = v_guard_id,
    updated_at = pg_catalog.now()
  WHERE id = p_request_id;

  -- 7. Audit log generation
  INSERT INTO public.audit_logs (
    id,
    community_id,
    actor_id,
    action,
    entity_type,
    entity_id,
    metadata,
    created_at
  ) VALUES (
    pg_catalog.gen_random_uuid(),
    v_request.community_id,
    v_guard_id,
    'COLLECT_PARCEL',
    'visitor_requests',
    p_request_id,
    pg_catalog.jsonb_build_object(
      'visitor_name', v_request.visitor_name,
      'flat_id', v_request.flat_id,
      'delivery_category', v_request.delivery_category,
      'parcel_details', v_request.parcel_details,
      'collector_name', v_collector_final,
      'guard_name', v_guard_name,
      'gate_location', v_request.gate_location
    ),
    pg_catalog.now()
  );

  RETURN pg_catalog.jsonb_build_object(
    'success', true,
    'message', 'Parcel successfully collected and handover recorded',
    'request_id', p_request_id,
    'collected_at', pg_catalog.now(),
    'collector_name', v_collector_final
  );
END;
$$;

REVOKE ALL ON FUNCTION public.fn_confirm_parcel_handover(pg_catalog.uuid, pg_catalog.text, pg_catalog.text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_confirm_parcel_handover(pg_catalog.uuid, pg_catalog.text, pg_catalog.text) TO authenticated, service_role;


-- ----------------------------------------------------------------------------
-- PART 6: RLS POLICIES FOR DELIVERY AND PARCEL LIFECYCLE
-- ----------------------------------------------------------------------------

-- A. Update resident update policy to permit 'leave_at_gate'
DROP POLICY IF EXISTS "Residents can approve or reject visitor requests for their flat" ON public.visitor_requests;
DROP POLICY IF EXISTS "Residents can decide on visitor requests or leave at gate" ON public.visitor_requests;

CREATE POLICY "Residents can decide on visitor requests or leave at gate"
  ON public.visitor_requests FOR UPDATE
  TO authenticated
  USING (
    public.get_auth_role() IN ('resident', 'family_member')
    AND public.is_user_flat_member(flat_id)
    AND status = 'pending'
  )
  WITH CHECK (
    public.is_user_flat_member(flat_id)
    AND status IN ('approved', 'rejected', 'leave_at_gate')
  );

-- B. Update guard update policy to permit 'collected' and parcel handover metadata
DROP POLICY IF EXISTS "Guards can update visitor check-in and check-out" ON public.visitor_requests;
DROP POLICY IF EXISTS "Guards can update visitor check-in, check-out and parcel status" ON public.visitor_requests;

CREATE POLICY "Guards can update visitor check-in, check-out and parcel status"
  ON public.visitor_requests FOR UPDATE
  TO authenticated
  USING (
    community_id = public.get_auth_community()
    AND public.get_auth_role() = 'security_guard'
  )
  WITH CHECK (
    community_id = public.get_auth_community()
    AND (
      -- Check-in transition
      (status = 'checked_in')
      -- Check-out transition
      OR (status = 'checked_out')
      -- Parcel collected transition
      OR (status = 'collected')
      -- Cancel or supervisor escalate
      OR (status = 'cancelled')
      OR (supervisor_escalated = TRUE)
      -- Allow guard to attach parcel details/shelf location while pending or leave_at_gate
      OR (status IN ('pending', 'leave_at_gate'))
    )
  );

-- C. Storage Policy: Allow residents and guards to view parcel photos in addition to visitor photos
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'storage' AND tablename = 'objects') THEN
    DROP POLICY IF EXISTS "Authorized users can read visitor photos" ON storage.objects;
    DROP POLICY IF EXISTS "Authorized users can read visitor and parcel photos" ON storage.objects;

    CREATE POLICY "Authorized users can read visitor and parcel photos"
      ON storage.objects FOR SELECT
      TO authenticated
      USING (
        bucket_id = 'visitor-photos'
        AND (
          -- Admins & Guards can view
          EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_profiles.id = auth.uid()
              AND user_profiles.role IN ('security_guard', 'community_admin', 'super_admin')
          )
          -- Or resident whose flat has a visitor request with this visitor or parcel photo
          OR EXISTS (
            SELECT 1 FROM public.visitor_requests vr
            JOIN public.flat_residents fr ON fr.flat_id = vr.flat_id
            WHERE fr.user_id = auth.uid()
              AND (
                vr.visitor_photo_path = storage.objects.name
                OR vr.parcel_photo_path = storage.objects.name
              )
          )
        )
      );
  END IF;
END $$;


-- ----------------------------------------------------------------------------
-- PART 7: AUDIT LOG TRIGGER EXTENSION
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.fn_audit_visitor_lifecycle_events()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_action pg_catalog.text;
  v_actor_id pg_catalog.uuid;
  v_metadata pg_catalog.jsonb;
BEGIN
  v_actor_id := auth.uid();

  IF TG_OP = 'INSERT' THEN
    v_action := 'REGISTER_VISITOR';
    v_metadata := pg_catalog.jsonb_build_object(
      'visitor_name', NEW.visitor_name,
      'category', NEW.category,
      'delivery_category', NEW.delivery_category,
      'flat_id', NEW.flat_id,
      'status', NEW.status
    );
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status <> NEW.status THEN
      CASE NEW.status
        WHEN 'approved' THEN v_action := 'APPROVE_VISITOR';
        WHEN 'rejected' THEN v_action := 'REJECT_VISITOR';
        WHEN 'leave_at_gate' THEN v_action := 'AUTHORIZE_LEAVE_AT_GATE';
        WHEN 'collected' THEN v_action := 'COLLECT_PARCEL';
        WHEN 'checked_in' THEN v_action := 'CHECK_IN';
        WHEN 'checked_out' THEN v_action := 'CHECK_OUT';
        WHEN 'expired' THEN v_action := 'EXPIRE_REQUEST';
        WHEN 'cancelled' THEN v_action := 'CANCEL_REQUEST';
        ELSE v_action := 'UPDATE_STATUS_' || NEW.status;
      END CASE;
    ELSE
      v_action := 'UPDATE_VISITOR_METADATA';
    END IF;

    v_metadata := pg_catalog.jsonb_build_object(
      'visitor_name', NEW.visitor_name,
      'flat_id', NEW.flat_id,
      'old_status', OLD.status,
      'new_status', NEW.status,
      'delivery_category', NEW.delivery_category,
      'handover_status', NEW.handover_status,
      'gate_location', NEW.gate_location,
      'collected_by_name', NEW.collected_by_name
    );
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'DELETE_VISITOR_REQUEST';
    v_metadata := pg_catalog.jsonb_build_object(
      'visitor_name', OLD.visitor_name,
      'flat_id', OLD.flat_id,
      'status', OLD.status
    );
  END IF;

  INSERT INTO public.audit_logs (
    id,
    community_id,
    actor_id,
    action,
    entity_type,
    entity_id,
    metadata,
    created_at
  ) VALUES (
    pg_catalog.gen_random_uuid(),
    COALESCE(NEW.community_id, OLD.community_id),
    v_actor_id,
    v_action,
    'visitor_requests',
    COALESCE(NEW.id, OLD.id),
    v_metadata,
    pg_catalog.now()
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_visitor_lifecycle_events ON public.visitor_requests;
CREATE TRIGGER trg_audit_visitor_lifecycle_events
  AFTER INSERT OR UPDATE OR DELETE ON public.visitor_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_audit_visitor_lifecycle_events();


-- ----------------------------------------------------------------------------
-- PART 8: PERFORMANCE COMPOSITE INDEXES FOR PARCEL SEARCH & INVENTORY
-- ----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_visitor_requests_parcels_awaiting
  ON public.visitor_requests(community_id, status, handover_status, created_at DESC)
  WHERE status = 'leave_at_gate';

CREATE INDEX IF NOT EXISTS idx_visitor_requests_delivery_category
  ON public.visitor_requests(delivery_category, created_at DESC)
  WHERE delivery_category IS NOT NULL;
