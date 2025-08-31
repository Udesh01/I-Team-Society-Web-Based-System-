-- Fix RLS Policies for I-Team Society Dashboard
-- Run this in Supabase SQL Editor to fix security policy violations

-- =====================================================
-- EVENTS TABLE POLICIES
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all events" ON events;
DROP POLICY IF EXISTS "Admins and staff can create events" ON events;
DROP POLICY IF EXISTS "Admins and staff can update events" ON events;
DROP POLICY IF EXISTS "Admins can delete events" ON events;

-- Enable RLS on events table
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Allow everyone to view events (public access)
CREATE POLICY "Users can view all events" ON events
FOR SELECT USING (true);

-- Allow admins and staff to create events
CREATE POLICY "Admins and staff can create events" ON events
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'staff')
  )
);

-- Allow admins and staff to update events they created or all events for admins
CREATE POLICY "Admins and staff can update events" ON events
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND (
      profiles.role = 'admin' OR 
      (profiles.role = 'staff' AND events.created_by = auth.uid())
    )
  )
);

-- Allow only admins to delete events
CREATE POLICY "Admins can delete events" ON events
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- =====================================================
-- EVENT REGISTRATIONS TABLE POLICIES
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own registrations" ON event_registrations;
DROP POLICY IF EXISTS "Users can register for events" ON event_registrations;
DROP POLICY IF EXISTS "Users can update their own registrations" ON event_registrations;
DROP POLICY IF EXISTS "Users can cancel their own registrations" ON event_registrations;
DROP POLICY IF EXISTS "Admins can view all registrations" ON event_registrations;
DROP POLICY IF EXISTS "Admins can manage all registrations" ON event_registrations;

-- Enable RLS on event_registrations table
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own registrations
CREATE POLICY "Users can view their own registrations" ON event_registrations
FOR SELECT USING (user_id = auth.uid());

-- Allow admins and staff to view all registrations
CREATE POLICY "Admins can view all registrations" ON event_registrations
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'staff')
  )
);

-- Allow users to register for events
CREATE POLICY "Users can register for events" ON event_registrations
FOR INSERT WITH CHECK (user_id = auth.uid());

-- Allow users to update their own registrations
CREATE POLICY "Users can update their own registrations" ON event_registrations
FOR UPDATE USING (user_id = auth.uid());

-- Allow users to cancel their own registrations
CREATE POLICY "Users can cancel their own registrations" ON event_registrations
FOR DELETE USING (user_id = auth.uid());

-- Allow admins to manage all registrations
CREATE POLICY "Admins can manage all registrations" ON event_registrations
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- =====================================================
-- PROFILES TABLE POLICIES
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own profile
CREATE POLICY "Users can view their own profile" ON profiles
FOR SELECT USING (id = auth.uid());

-- Allow admins and staff to view all profiles
CREATE POLICY "Admins can view all profiles" ON profiles
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() 
    AND p.role IN ('admin', 'staff')
  )
);

-- Allow users to update their own profile (with restrictions)
CREATE POLICY "Users can update their own profile" ON profiles
FOR UPDATE USING (id = auth.uid())
WITH CHECK (
  id = auth.uid() AND
  -- Prevent users from changing their role
  role = (SELECT role FROM profiles WHERE id = auth.uid())
);

-- Allow admins to update all profiles
CREATE POLICY "Admins can update all profiles" ON profiles
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- =====================================================
-- STORAGE BUCKETS CREATION
-- =====================================================

-- Create profile_photos bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile_photos',
  'profile_photos',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Create event_banners bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event_banners',
  'event_banners',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- STORAGE POLICIES (for profile photos and event banners)
-- =====================================================

-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Users can upload their own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins and staff can upload event banners" ON storage.objects;
DROP POLICY IF EXISTS "Public can view event banners" ON storage.objects;

-- Profile photos bucket policies
CREATE POLICY "Users can upload their own profile photos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'profile_photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own profile photos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'profile_photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own profile photos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'profile_photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Public can view profile photos" ON storage.objects
FOR SELECT USING (bucket_id = 'profile_photos');

-- Event banners bucket policies
CREATE POLICY "Admins and staff can upload event banners" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'event_banners' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'staff')
  )
);

CREATE POLICY "Public can view event banners" ON storage.objects
FOR SELECT USING (bucket_id = 'event_banners');

-- =====================================================
-- NOTIFICATIONS TABLE POLICIES (if exists)
-- =====================================================

-- Create notifications table if it doesn't exist
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

-- Drop existing notification policies if they exist
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can create notifications" ON notifications;

-- Enable RLS on notifications table
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own notifications
CREATE POLICY "Users can view their own notifications" ON notifications
FOR SELECT USING (user_id = auth.uid());

-- Allow users to update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications" ON notifications
FOR UPDATE USING (user_id = auth.uid());

-- Allow admins to create notifications for any user
CREATE POLICY "Admins can create notifications" ON notifications
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- =====================================================
-- REFRESH SCHEMA CACHE
-- =====================================================

-- Refresh the schema cache to ensure policies take effect
NOTIFY pgrst, 'reload schema';
