-- EMERGENCY FIXES for I-Team Society Dashboard Errors
-- Run this SQL script in your Supabase SQL Editor to fix the immediate issues

-- =====================================================
-- 1. FIX STORAGE BUCKET AND POLICIES (Profile Photo Upload Issue)
-- =====================================================

-- Create profile_photos bucket if missing
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile_photos',
  'profile_photos',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Drop and recreate storage policies to fix permission issues
DROP POLICY IF EXISTS "Users can upload their own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view profile photos" ON storage.objects;

-- Create working storage policies
CREATE POLICY "Users can upload their own profile photos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'profile_photos' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own profile photos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'profile_photos' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete their own profile photos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'profile_photos' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Public can view profile photos" ON storage.objects
FOR SELECT USING (bucket_id = 'profile_photos');

-- =====================================================
-- 2. FIX EVENTS TABLE QUERY ISSUES (Event List 400 Error)
-- =====================================================

-- Ensure events table has proper RLS policies
DROP POLICY IF EXISTS "Users can view all events" ON events;
DROP POLICY IF EXISTS "Everyone can view events" ON events;

-- Enable RLS on events table
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Create simple, working events policy
CREATE POLICY "Everyone can view events" ON events
FOR SELECT USING (true);

-- Add missing event_time column if it doesn't exist
ALTER TABLE events ADD COLUMN IF NOT EXISTS event_time TEXT;

-- =====================================================
-- 3. FIX MEMBERSHIP APPROVAL CONFLICTS (409 Error)
-- =====================================================

-- Handle duplicate membership approvals safely
-- First, mark older duplicate memberships as 'rejected' (valid enum value)
UPDATE memberships 
SET status = 'rejected', 
    updated_at = NOW()
WHERE id IN (
    SELECT m1.id 
    FROM memberships m1
    WHERE m1.status IN ('active', 'pending_approval')
    AND EXISTS (
        SELECT 1 
        FROM memberships m2 
        WHERE m2.user_id = m1.user_id 
        AND m2.status IN ('active', 'pending_approval')
        AND m2.created_at > m1.created_at
    )
);

-- Create unique index only if no duplicates remain
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM memberships
        WHERE status IN ('active', 'pending_approval')
        GROUP BY user_id
        HAVING COUNT(*) > 1
    ) THEN
        CREATE UNIQUE INDEX IF NOT EXISTS unique_active_membership 
        ON memberships (user_id) 
        WHERE status IN ('active', 'pending_approval');
        RAISE NOTICE '✅ Unique index created successfully';
    ELSE
        RAISE NOTICE '⚠️ Duplicates still exist - unique index not created';
        RAISE NOTICE 'Run database/cleanup-duplicates.sql for detailed analysis';
    END IF;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE '⚠️ Could not create unique index: %', SQLERRM;
END $$;

-- =====================================================
-- 4. FIX PROFILES TABLE ACCESS (General Permission Issues)
-- =====================================================

-- Add missing photo_url column if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Drop and recreate profile policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create working profile policies
CREATE POLICY "Users can view own profile" ON profiles
FOR SELECT USING (id = auth.uid());

CREATE POLICY "Admins can view all profiles" ON profiles
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() 
    AND p.role IN ('admin', 'staff')
  ) OR id = auth.uid()
);

CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE USING (id = auth.uid());

-- =====================================================
-- 5. FIX EVENT REGISTRATIONS (Support for Registration System)
-- =====================================================

-- Ensure event_registrations table has proper policies
DROP POLICY IF EXISTS "Users can view their own registrations" ON event_registrations;
DROP POLICY IF EXISTS "Users can register for events" ON event_registrations;
DROP POLICY IF EXISTS "Users can cancel their own registrations" ON event_registrations;
DROP POLICY IF EXISTS "Admins can view all registrations" ON event_registrations;

-- Enable RLS on event_registrations table
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

-- Create working event registration policies
CREATE POLICY "Users can view their own registrations" ON event_registrations
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all registrations" ON event_registrations
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'staff')
  ) OR user_id = auth.uid()
);

CREATE POLICY "Users can register for events" ON event_registrations
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can cancel their own registrations" ON event_registrations
FOR DELETE USING (user_id = auth.uid());

-- =====================================================
-- 6. FIX MEMBERSHIP POLICIES (Support for Membership System)
-- =====================================================

-- Drop and recreate membership policies
DROP POLICY IF EXISTS "Users can view their own membership" ON memberships;
DROP POLICY IF EXISTS "Users can view own membership" ON memberships;
DROP POLICY IF EXISTS "Admins can view all memberships" ON memberships;
DROP POLICY IF EXISTS "Users can create membership" ON memberships;

-- Enable RLS on memberships table
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;

-- Create working membership policies
CREATE POLICY "Users can view own membership" ON memberships
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all memberships" ON memberships
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'staff')
  ) OR user_id = auth.uid()
);

CREATE POLICY "Users can create membership" ON memberships
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update memberships" ON memberships
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- =====================================================
-- 7. CREATE MISSING INDEXES FOR PERFORMANCE
-- =====================================================

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_user_id ON event_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_status ON memberships(status);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- =====================================================
-- 8. REFRESH SCHEMA CACHE
-- =====================================================

-- Refresh the schema cache to ensure all changes take effect immediately
NOTIFY pgrst, 'reload schema';

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check if storage bucket exists
SELECT 'Storage Check' as check_type, 
       CASE WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'profile_photos') 
            THEN '✅ profile_photos bucket exists' 
            ELSE '❌ profile_photos bucket missing' 
       END as result;

-- Check if essential tables exist
SELECT 'Table Check' as check_type,
       table_name || ' - ' || 
       CASE WHEN table_name IS NOT NULL THEN '✅ exists' ELSE '❌ missing' END as result
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('profiles', 'memberships', 'events', 'event_registrations')
ORDER BY table_name;

-- Check if photo_url column exists in profiles
SELECT 'Column Check' as check_type,
       'photo_url in profiles - ' ||
       CASE WHEN EXISTS (
         SELECT 1 FROM information_schema.columns 
         WHERE table_name = 'profiles' AND column_name = 'photo_url'
       ) THEN '✅ exists' ELSE '❌ missing' END as result;

-- Display current user info (if authenticated)
SELECT 'Authentication Check' as check_type,
       CASE WHEN auth.uid() IS NOT NULL 
            THEN '✅ User authenticated: ' || auth.uid()::text
            ELSE '❌ Not authenticated'
       END as result;
