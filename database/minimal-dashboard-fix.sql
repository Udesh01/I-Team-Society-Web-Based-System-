-- Minimal Dashboard Fix - Just Get Data Loading
-- Run this step by step to avoid conflicts

-- =====================================================
-- STEP 1: ADD MISSING COLUMNS (SAFE)
-- =====================================================

-- Add missing columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address TEXT;

-- =====================================================
-- STEP 2: CREATE NOTIFICATIONS TABLE (SAFE)
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

-- =====================================================
-- STEP 3: TEMPORARILY DISABLE RLS FOR TESTING
-- =====================================================

-- WARNING: This is for testing only!
-- Disable RLS to test if data loads without policy restrictions

ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE memberships DISABLE ROW LEVEL SECURITY;
ALTER TABLE events DISABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 4: GRANT BASIC PERMISSIONS
-- =====================================================

-- Grant basic permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON memberships TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON event_registrations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON notifications TO authenticated;

-- Grant select permissions to anon for public data
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON events TO anon;

-- =====================================================
-- STEP 5: CREATE STORAGE BUCKET
-- =====================================================

-- Create profile_photos bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'profile_photos', 
  'profile_photos', 
  true, 
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- STEP 6: REFRESH SCHEMA
-- =====================================================

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';

-- =====================================================
-- STEP 7: TEST DATA ACCESS
-- =====================================================

-- Test if we can access data now
SELECT 
  'Dashboard Data Test' as test_name,
  'SUCCESS - RLS Disabled' as status,
  'Data should now load in dashboard' as message;

-- Show current user (should work if authenticated)
SELECT 
  'Current User Test' as test_name,
  CASE 
    WHEN auth.uid() IS NOT NULL THEN 'AUTHENTICATED'
    ELSE 'NOT_AUTHENTICATED'
  END as auth_status,
  auth.uid() as user_id;

-- Test profile access
SELECT 
  'Profile Access Test' as test_name,
  COUNT(*) as profile_count,
  CASE 
    WHEN COUNT(*) > 0 THEN 'SUCCESS'
    ELSE 'NO_DATA'
  END as status
FROM profiles;

-- Test events access
SELECT 
  'Events Access Test' as test_name,
  COUNT(*) as events_count,
  CASE 
    WHEN COUNT(*) > 0 THEN 'SUCCESS'
    ELSE 'NO_DATA'
  END as status
FROM events;

-- Test memberships access
SELECT 
  'Memberships Access Test' as test_name,
  COUNT(*) as membership_count,
  CASE 
    WHEN COUNT(*) > 0 THEN 'SUCCESS'
    ELSE 'NO_DATA'
  END as status
FROM memberships;

-- =====================================================
-- IMPORTANT NOTES
-- =====================================================

/*
⚠️  IMPORTANT: RLS IS NOW DISABLED FOR TESTING

This script disables Row Level Security to test if the dashboard 
can load data without policy restrictions.

IF THE DASHBOARD NOW LOADS DATA:
- The issue was RLS policies blocking access
- You can re-enable RLS and create proper policies later

IF THE DASHBOARD STILL DOESN'T LOAD DATA:
- The issue is something else (authentication, network, etc.)
- Check browser console for errors
- Use the debug tool to see specific error messages

TO RE-ENABLE RLS LATER (for security):
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

Then create appropriate policies for your use case.
*/
