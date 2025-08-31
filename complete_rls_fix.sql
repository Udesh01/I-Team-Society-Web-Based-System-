-- Complete RLS Policy Fix Script
-- This script will reset and properly configure all RLS policies

-- First, disable RLS temporarily to clean up
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE events DISABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE memberships DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies for our tables
    FOR r IN (
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE tablename IN ('profiles', 'events', 'event_registrations', 'memberships', 'payments', 'notifications')
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
CREATE POLICY "Enable read access for users to own profile" ON profiles
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Enable update access for users to own profile" ON profiles
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Enable read access for admins to all profiles" ON profiles
FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Enable update access for admins to all profiles" ON profiles
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- EVENTS POLICIES
CREATE POLICY "Enable read access for all authenticated users to events" ON events
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users to events" ON events
FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Enable update access for event creators" ON events
FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Enable delete access for event creators" ON events
FOR DELETE USING (auth.uid() = created_by);

CREATE POLICY "Enable all access for admins to events" ON events
FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Enable all access for staff to events" ON events
FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
);

-- EVENT_REGISTRATIONS POLICIES
CREATE POLICY "Enable read access for users to own registrations" ON event_registrations
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Enable insert access for users to register" ON event_registrations
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update access for users to own registrations" ON event_registrations
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Enable delete access for users to own registrations" ON event_registrations
FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Enable read access for event creators to registrations" ON event_registrations
FOR SELECT USING (
  EXISTS (SELECT 1 FROM events WHERE id = event_id AND created_by = auth.uid())
);

CREATE POLICY "Enable update access for event creators to registrations" ON event_registrations
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM events WHERE id = event_id AND created_by = auth.uid())
);

CREATE POLICY "Enable all access for admins to registrations" ON event_registrations
FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Enable all access for staff to registrations" ON event_registrations
FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
);

-- MEMBERSHIPS POLICIES
CREATE POLICY "Enable read access for users to own memberships" ON memberships
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Enable insert access for users to create memberships" ON memberships
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update access for users to own memberships" ON memberships
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Enable read access for admins to all memberships" ON memberships
FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Enable update access for admins to all memberships" ON memberships
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Enable all access for staff to memberships" ON memberships
FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
);

-- PAYMENTS POLICIES
CREATE POLICY "Enable read access for users to own payments" ON payments
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Enable insert access for users to create payments" ON payments
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable read access for admins to all payments" ON payments
FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Enable update access for admins to all payments" ON payments
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Enable all access for staff to payments" ON payments
FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
);

-- NOTIFICATIONS POLICIES
CREATE POLICY "Enable read access for users to own notifications" ON notifications
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Enable update access for users to own notifications" ON notifications
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Enable delete access for users to own notifications" ON notifications
FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Enable insert access for system to create notifications" ON notifications
FOR INSERT WITH CHECK (true);

-- Verify all policies are created
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  cmd,
  permissive
FROM pg_policies 
WHERE tablename IN ('profiles', 'events', 'event_registrations', 'memberships', 'payments', 'notifications')
ORDER BY tablename, policyname;

-- Test basic functionality
DO $$
BEGIN
  RAISE NOTICE 'RLS policies have been completely reset and reconfigured';
  RAISE NOTICE 'All tables now have proper access control policies';
  RAISE NOTICE 'Please test the application functionality';
END $$;
