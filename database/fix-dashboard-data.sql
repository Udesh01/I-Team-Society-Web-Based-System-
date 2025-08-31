-- Fix Dashboard Data Fetching Issues
-- Run this in Supabase SQL Editor to fix data access problems

-- =====================================================
-- 1. ENSURE PROFILES TABLE HAS PROPER STRUCTURE
-- =====================================================

-- Add missing columns if they don't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address TEXT;

-- =====================================================
-- 2. FIX PROFILES TABLE RLS POLICIES
-- =====================================================

-- Drop ALL existing profile policies (comprehensive cleanup)
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Staff can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Profile access policy" ON profiles;
DROP POLICY IF EXISTS "User profile access" ON profiles;

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile" ON profiles
FOR SELECT USING (id = auth.uid());

-- Allow admins and staff to view all profiles
CREATE POLICY "Staff can view all profiles" ON profiles
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() 
    AND p.role IN ('admin', 'staff')
  )
);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE USING (id = auth.uid())
WITH CHECK (
  id = auth.uid() AND
  -- Prevent role changes by non-admins
  (role = (SELECT role FROM profiles WHERE id = auth.uid()) OR 
   EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
);

-- Allow admins to update any profile
CREATE POLICY "Admins can update any profile" ON profiles
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- =====================================================
-- 3. FIX MEMBERSHIPS TABLE RLS POLICIES
-- =====================================================

-- Drop ALL existing membership policies (comprehensive cleanup)
DROP POLICY IF EXISTS "Users can view their own membership" ON memberships;
DROP POLICY IF EXISTS "Users view own membership" ON memberships;
DROP POLICY IF EXISTS "Admins can view all memberships" ON memberships;
DROP POLICY IF EXISTS "Staff view all memberships" ON memberships;
DROP POLICY IF EXISTS "Users can create membership" ON memberships;
DROP POLICY IF EXISTS "Users create own membership" ON memberships;
DROP POLICY IF EXISTS "Admins can manage memberships" ON memberships;
DROP POLICY IF EXISTS "Admins manage memberships" ON memberships;
DROP POLICY IF EXISTS "Membership access policy" ON memberships;

-- Enable RLS
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own membership
CREATE POLICY "Users view own membership" ON memberships
FOR SELECT USING (user_id = auth.uid());

-- Allow admins and staff to view all memberships
CREATE POLICY "Staff view all memberships" ON memberships
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'staff')
  )
);

-- Allow users to create their own membership
CREATE POLICY "Users create own membership" ON memberships
FOR INSERT WITH CHECK (user_id = auth.uid());

-- Allow admins to manage all memberships
CREATE POLICY "Admins manage memberships" ON memberships
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- =====================================================
-- 4. FIX EVENTS TABLE RLS POLICIES
-- =====================================================

-- Drop ALL existing event policies (comprehensive cleanup)
DROP POLICY IF EXISTS "Users can view all events" ON events;
DROP POLICY IF EXISTS "Everyone can view events" ON events;
DROP POLICY IF EXISTS "Staff can create events" ON events;
DROP POLICY IF EXISTS "Staff can update events" ON events;
DROP POLICY IF EXISTS "Admins can delete events" ON events;
DROP POLICY IF EXISTS "Admins and staff can create events" ON events;
DROP POLICY IF EXISTS "Admins and staff can update events" ON events;
DROP POLICY IF EXISTS "Public can view events" ON events;
DROP POLICY IF EXISTS "Event access policy" ON events;

-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Allow everyone to view events
CREATE POLICY "Everyone can view events" ON events
FOR SELECT USING (true);

-- Allow admins and staff to create events
CREATE POLICY "Staff can create events" ON events
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'staff')
  )
);

-- Allow admins and staff to update events
CREATE POLICY "Staff can update events" ON events
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'staff')
  )
);

-- Allow admins to delete events
CREATE POLICY "Admins can delete events" ON events
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- =====================================================
-- 5. FIX EVENT REGISTRATIONS TABLE RLS POLICIES
-- =====================================================

-- Drop existing registration policies
DROP POLICY IF EXISTS "Users can view their own registrations" ON event_registrations;
DROP POLICY IF EXISTS "Users can register for events" ON event_registrations;
DROP POLICY IF EXISTS "Users can update their own registrations" ON event_registrations;
DROP POLICY IF EXISTS "Users can cancel their own registrations" ON event_registrations;
DROP POLICY IF EXISTS "Admins can view all registrations" ON event_registrations;

-- Enable RLS
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own registrations
CREATE POLICY "Users view own registrations" ON event_registrations
FOR SELECT USING (user_id = auth.uid());

-- Allow admins and staff to view all registrations
CREATE POLICY "Staff view all registrations" ON event_registrations
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'staff')
  )
);

-- Allow users to register for events
CREATE POLICY "Users can register" ON event_registrations
FOR INSERT WITH CHECK (user_id = auth.uid());

-- Allow users to update their own registrations
CREATE POLICY "Users update own registrations" ON event_registrations
FOR UPDATE USING (user_id = auth.uid());

-- Allow users to cancel their own registrations
CREATE POLICY "Users cancel own registrations" ON event_registrations
FOR DELETE USING (user_id = auth.uid());

-- Allow admins to manage all registrations
CREATE POLICY "Admins manage all registrations" ON event_registrations
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- =====================================================
-- 6. CREATE NOTIFICATIONS TABLE IF NOT EXISTS
-- =====================================================

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drop existing notification policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can create notifications" ON notifications;

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own notifications
CREATE POLICY "Users view own notifications" ON notifications
FOR SELECT USING (user_id = auth.uid());

-- Allow users to update their own notifications (mark as read)
CREATE POLICY "Users update own notifications" ON notifications
FOR UPDATE USING (user_id = auth.uid());

-- Allow admins to create notifications for any user
CREATE POLICY "Admins create notifications" ON notifications
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- =====================================================
-- 7. REFRESH SCHEMA CACHE
-- =====================================================

-- Refresh the schema cache to ensure policies take effect
NOTIFY pgrst, 'reload schema';

-- =====================================================
-- 8. GRANT NECESSARY PERMISSIONS
-- =====================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant permissions on tables
GRANT SELECT, INSERT, UPDATE, DELETE ON profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON memberships TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON event_registrations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON notifications TO authenticated;

-- Grant select permissions to anon for public data
GRANT SELECT ON events TO anon;
