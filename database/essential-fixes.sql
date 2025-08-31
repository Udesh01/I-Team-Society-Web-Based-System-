-- Essential Fixes for I-Team Society Dashboard
-- Run these commands one by one in Supabase SQL Editor

-- =====================================================
-- 1. CREATE STORAGE BUCKETS (MOST IMPORTANT)
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
-- 2. STORAGE POLICIES (REQUIRED FOR PHOTO UPLOAD)
-- =====================================================

-- Drop existing storage policies to avoid conflicts
DROP POLICY IF EXISTS "Users can upload their own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins and staff can upload event banners" ON storage.objects;
DROP POLICY IF EXISTS "Public can view event banners" ON storage.objects;

-- Profile photos policies
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

-- Event banners policies
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
-- 3. EVENTS TABLE POLICIES (FIX EVENT CREATION)
-- =====================================================

-- Drop existing event policies to avoid conflicts
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

-- Allow admins and staff to update events
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
-- 4. PROFILES TABLE POLICIES (PREVENT NULL VALUES)
-- =====================================================

-- Drop existing profile policies to avoid conflicts
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
  role = (SELECT role FROM profiles WHERE id = auth.uid()) AND
  -- Ensure required fields are not null
  first_name IS NOT NULL AND
  last_name IS NOT NULL AND
  first_name != '' AND
  last_name != ''
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
-- 5. ADD PHOTO_URL COLUMN IF MISSING
-- =====================================================

-- Add photo_url column to profiles table if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- =====================================================
-- 6. REFRESH SCHEMA CACHE
-- =====================================================

-- Refresh the schema cache to ensure policies take effect
NOTIFY pgrst, 'reload schema';
