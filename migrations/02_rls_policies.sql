-- Gateway Security: Apartment Visitor Management System
-- Migration 02: Row Level Security (RLS) Policies & Tenant Isolation

-- Enable RLS on all tables
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE gates ENABLE ROW LEVEL SECURITY;
ALTER TABLE buildings_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE flats ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE flat_residents ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitor_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. Helper Security Functions
CREATE OR REPLACE FUNCTION get_auth_role()
RETURNS user_role AS $$
    SELECT role FROM user_profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_auth_community()
RETURNS UUID AS $$
    SELECT community_id FROM user_profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_user_flat_member(check_flat_id UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM flat_residents
        WHERE flat_id = check_flat_id
          AND user_id = auth.uid()
          AND is_approved = TRUE
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 2. Communities Table Policies
CREATE POLICY "Super Admins can view and manage all communities"
    ON communities FOR ALL
    TO authenticated
    USING (get_auth_role() = 'super_admin');

CREATE POLICY "Users can view their own community"
    ON communities FOR SELECT
    TO authenticated
    USING (id = get_auth_community());

CREATE POLICY "Community Admin can update their community branding"
    ON communities FOR UPDATE
    TO authenticated
    USING (id = get_auth_community() AND get_auth_role() = 'community_admin')
    WITH CHECK (id = get_auth_community() AND get_auth_role() = 'community_admin');

-- 3. Gates, Blocks, and Flats
CREATE POLICY "Community members can view gates in their community"
    ON gates FOR SELECT
    TO authenticated
    USING (community_id = get_auth_community() OR get_auth_role() = 'super_admin');

CREATE POLICY "Community Admin can manage gates"
    ON gates FOR ALL
    TO authenticated
    USING (community_id = get_auth_community() AND get_auth_role() = 'community_admin');

CREATE POLICY "Community members can view buildings and blocks"
    ON buildings_blocks FOR SELECT
    TO authenticated
    USING (community_id = get_auth_community() OR get_auth_role() = 'super_admin');

CREATE POLICY "Community Admin can manage blocks"
    ON buildings_blocks FOR ALL
    TO authenticated
    USING (community_id = get_auth_community() AND get_auth_role() = 'community_admin');

CREATE POLICY "Community members can view flats"
    ON flats FOR SELECT
    TO authenticated
    USING (community_id = get_auth_community() OR get_auth_role() = 'super_admin');

CREATE POLICY "Community Admin can manage flats"
    ON flats FOR ALL
    TO authenticated
    USING (community_id = get_auth_community() AND get_auth_role() = 'community_admin');

-- 4. User Profiles
CREATE POLICY "Users can view their own profile"
    ON user_profiles FOR SELECT
    TO authenticated
    USING (id = auth.uid() OR get_auth_role() = 'super_admin');

CREATE POLICY "Community Admin can view users in their community"
    ON user_profiles FOR SELECT
    TO authenticated
    USING (community_id = get_auth_community() AND get_auth_role() = 'community_admin');

CREATE POLICY "Guards can view resident names for flat verification"
    ON user_profiles FOR SELECT
    TO authenticated
    USING (community_id = get_auth_community() AND get_auth_role() = 'security_guard');

CREATE POLICY "Users can update their own preferences"
    ON user_profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid() AND role = (SELECT role FROM user_profiles WHERE id = auth.uid()));

-- 5. Flat Residents Mapping
CREATE POLICY "Users can view resident associations in their community"
    ON flat_residents FOR SELECT
    TO authenticated
    USING (
        get_auth_role() = 'super_admin'
        OR EXISTS (
            SELECT 1 FROM flats f
            WHERE f.id = flat_residents.flat_id
              AND f.community_id = get_auth_community()
        )
    );

CREATE POLICY "Community Admin can manage flat resident associations"
    ON flat_residents FOR ALL
    TO authenticated
    USING (
        get_auth_role() = 'community_admin'
        AND EXISTS (
            SELECT 1 FROM flats f
            WHERE f.id = flat_residents.flat_id
              AND f.community_id = get_auth_community()
        )
    );

-- 6. Visitor Requests (Core Security Policies)
-- Security Guards and Admins can view all visitor requests in their community
CREATE POLICY "Guards and Admins can view community visitor requests"
    ON visitor_requests FOR SELECT
    TO authenticated
    USING (
        get_auth_role() = 'super_admin'
        OR (
            community_id = get_auth_community()
            AND get_auth_role() IN ('security_guard', 'community_admin')
        )
    );

-- Residents can ONLY view visitor requests intended for their flat
CREATE POLICY "Residents can view visitor requests for their flat"
    ON visitor_requests FOR SELECT
    TO authenticated
    USING (
        get_auth_role() IN ('resident', 'family_member')
        AND is_user_flat_member(flat_id)
    );

-- Security Guards can insert visitor requests for their community
CREATE POLICY "Guards can create visitor requests"
    ON visitor_requests FOR INSERT
    TO authenticated
    WITH CHECK (
        community_id = get_auth_community()
        AND get_auth_role() = 'security_guard'
    );

-- Residents can ONLY update status to approved or rejected for their flat
CREATE POLICY "Residents can approve or reject visitor requests for their flat"
    ON visitor_requests FOR UPDATE
    TO authenticated
    USING (
        get_auth_role() IN ('resident', 'family_member')
        AND is_user_flat_member(flat_id)
        AND status = 'pending'
    )
    WITH CHECK (
        is_user_flat_member(flat_id)
        AND status IN ('approved', 'rejected')
    );

-- Guards can check-in approved visitors and check-out checked_in visitors
CREATE POLICY "Guards can update visitor check-in and check-out"
    ON visitor_requests FOR UPDATE
    TO authenticated
    USING (
        community_id = get_auth_community()
        AND get_auth_role() = 'security_guard'
    )
    WITH CHECK (
        community_id = get_auth_community()
        AND (
            -- check-in transition
            (status = 'checked_in')
            -- check-out transition
            OR (status = 'checked_out')
            -- cancel or supervisor escalate
            OR (status = 'cancelled')
            OR (supervisor_escalated = TRUE)
        )
    );

-- 7. Guest Passes
CREATE POLICY "Residents can manage guest passes for their flats"
    ON guest_passes FOR ALL
    TO authenticated
    USING (
        is_user_flat_member(flat_id)
        OR get_auth_role() = 'community_admin'
    );

CREATE POLICY "Guards can read and verify active guest passes in their community"
    ON guest_passes FOR SELECT
    TO authenticated
    USING (
        community_id = get_auth_community()
        AND get_auth_role() = 'security_guard'
    );

-- 8. Audit Logs
CREATE POLICY "Community Admin can read audit logs"
    ON audit_logs FOR SELECT
    TO authenticated
    USING (
        get_auth_role() = 'super_admin'
        OR (community_id = get_auth_community() AND get_auth_role() = 'community_admin')
    );

CREATE POLICY "All authenticated users can append audit logs"
    ON audit_logs FOR INSERT
    TO authenticated
    WITH CHECK (actor_id = auth.uid());
