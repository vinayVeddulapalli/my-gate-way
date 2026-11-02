-- Gateway Security: Apartment Visitor Management System
-- Migration 05: Enable Supabase Realtime & Multi-Device Live Sync
-- Run this in your Supabase SQL Editor to enable instant WebSocket push notifications

-- 1. Enable Full Replica Identity so UPDATE events broadcast full row data
ALTER TABLE visitor_requests REPLICA IDENTITY FULL;
ALTER TABLE guest_passes REPLICA IDENTITY FULL;
ALTER TABLE audit_logs REPLICA IDENTITY FULL;

-- 2. Add Tables to Supabase Realtime Publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'visitor_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE visitor_requests;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'guest_passes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE guest_passes;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'audit_logs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE audit_logs;
  END IF;
END $$;

-- 3. Grants for seamless Multi-Device Testing (Guards on tablet, Residents on phones)
GRANT SELECT, INSERT, UPDATE ON TABLE visitor_requests TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE guest_passes TO anon, authenticated;
GRANT SELECT, INSERT ON TABLE audit_logs TO anon, authenticated;
GRANT SELECT ON TABLE communities, gates, buildings_blocks, flats, user_profiles, flat_residents TO anon, authenticated;

-- 4. Permissive Dev/Demo Policies so Guards and Flat Owners can immediately interact across devices
DO $$
BEGIN
  -- Visitor Requests
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anon & Authenticated Select Visitor Requests' AND tablename = 'visitor_requests') THEN
    CREATE POLICY "Anon & Authenticated Select Visitor Requests" ON visitor_requests FOR SELECT TO anon, authenticated USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anon & Authenticated Insert Visitor Requests' AND tablename = 'visitor_requests') THEN
    CREATE POLICY "Anon & Authenticated Insert Visitor Requests" ON visitor_requests FOR INSERT TO anon, authenticated WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anon & Authenticated Update Visitor Requests' AND tablename = 'visitor_requests') THEN
    CREATE POLICY "Anon & Authenticated Update Visitor Requests" ON visitor_requests FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
  END IF;

  -- Guest Passes
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anon & Authenticated Select Guest Passes' AND tablename = 'guest_passes') THEN
    CREATE POLICY "Anon & Authenticated Select Guest Passes" ON guest_passes FOR SELECT TO anon, authenticated USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anon & Authenticated Insert Guest Passes' AND tablename = 'guest_passes') THEN
    CREATE POLICY "Anon & Authenticated Insert Guest Passes" ON guest_passes FOR INSERT TO anon, authenticated WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anon & Authenticated Update Guest Passes' AND tablename = 'guest_passes') THEN
    CREATE POLICY "Anon & Authenticated Update Guest Passes" ON guest_passes FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
  END IF;

  -- Audit Logs
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anon & Authenticated Select Audit Logs' AND tablename = 'audit_logs') THEN
    CREATE POLICY "Anon & Authenticated Select Audit Logs" ON audit_logs FOR SELECT TO anon, authenticated USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anon & Authenticated Insert Audit Logs' AND tablename = 'audit_logs') THEN
    CREATE POLICY "Anon & Authenticated Insert Audit Logs" ON audit_logs FOR INSERT TO anon, authenticated WITH CHECK (true);
  END IF;

  -- Catalog Tables
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anon View Communities' AND tablename = 'communities') THEN
    CREATE POLICY "Anon View Communities" ON communities FOR SELECT TO anon USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anon View Gates' AND tablename = 'gates') THEN
    CREATE POLICY "Anon View Gates" ON gates FOR SELECT TO anon USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anon View Blocks' AND tablename = 'buildings_blocks') THEN
    CREATE POLICY "Anon View Blocks" ON buildings_blocks FOR SELECT TO anon USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anon View Flats' AND tablename = 'flats') THEN
    CREATE POLICY "Anon View Flats" ON flats FOR SELECT TO anon USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anon View User Profiles' AND tablename = 'user_profiles') THEN
    CREATE POLICY "Anon View User Profiles" ON user_profiles FOR SELECT TO anon USING (true);
  END IF;
END $$;
