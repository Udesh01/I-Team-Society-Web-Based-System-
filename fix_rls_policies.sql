-- Fix Row Level Security Policies Script

-- Enable RLS on all tables if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them (if they exist)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

DROP POLICY IF EXISTS "Users can view events" ON events;
DROP POLICY IF EXISTS "Event creators can manage own events" ON events;
DROP POLICY IF EXISTS "Admins can manage all events" ON events;
DROP POLICY IF EXISTS "Staff can manage all events" ON events;

DROP POLICY IF EXISTS "Users can view own registrations" ON event_registrations;
DROP POLICY IF EXISTS "Users can register for events" ON event_registrations;
DROP POLICY IF EXISTS "Users can update own registrations" ON event_registrations;
DROP POLICY IF EXISTS "Event creators can view registrations" ON event_registrations;
DROP POLICY IF EXISTS "Admins can manage all registrations" ON event_registrations;
DROP POLICY IF EXISTS "Staff can manage all registrations" ON event_registrations;

DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;

-- Create comprehensive profiles policies
CREATE POLICY "Users can view own profile" ON profiles
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can update all profiles" ON profiles
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Create comprehensive events policies
CREATE POLICY "Users can view active events" ON events
FOR SELECT USING (status = 'active' OR status = 'completed');

CREATE POLICY "Event creators can manage own events" ON events
FOR ALL USING (auth.uid() = created_by);

CREATE POLICY "Admins can manage all events" ON events
FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Staff can manage all events" ON events
FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
);

-- Create comprehensive event_registrations policies
CREATE POLICY "Users can view own registrations" ON event_registrations
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can register for events" ON event_registrations
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own registrations" ON event_registrations
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own registrations" ON event_registrations
FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Event creators can view registrations" ON event_registrations
FOR SELECT USING (
  EXISTS (SELECT 1 FROM events WHERE id = event_id AND created_by = auth.uid())
);

CREATE POLICY "Event creators can update registrations" ON event_registrations
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM events WHERE id = event_id AND created_by = auth.uid())
);

CREATE POLICY "Admins can manage all registrations" ON event_registrations
FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Staff can manage all registrations" ON event_registrations
FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
);

-- Create comprehensive notifications policies
CREATE POLICY "Users can view own notifications" ON notifications
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications" ON notifications
FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON notifications
FOR INSERT WITH CHECK (true);

-- Verify policies are created
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual
FROM 
  pg_policies
WHERE 
  tablename IN ('profiles', 'events', 'event_registrations', 'notifications')
ORDER BY 
  tablename, policyname;

-- Test policy functionality
DO $$
BEGIN
  RAISE NOTICE 'RLS policies have been updated successfully';
  RAISE NOTICE 'Please test event registration functionality';
END $$;
