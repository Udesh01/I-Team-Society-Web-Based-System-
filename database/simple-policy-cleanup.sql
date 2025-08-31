-- Simple Policy Cleanup - Just Drop Conflicting Policies
-- Run this first to clean up policy conflicts

-- =====================================================
-- DROP ALL CONFLICTING POLICIES
-- =====================================================

-- Events table policies
DROP POLICY IF EXISTS "Users can view all events" ON events;
DROP POLICY IF EXISTS "Everyone can view events" ON events;
DROP POLICY IF EXISTS "Staff can create events" ON events;
DROP POLICY IF EXISTS "Staff can update events" ON events;
DROP POLICY IF EXISTS "Admins can delete events" ON events;
DROP POLICY IF EXISTS "Admins and staff can create events" ON events;
DROP POLICY IF EXISTS "Admins and staff can update events" ON events;
DROP POLICY IF EXISTS "Public can view events" ON events;
DROP POLICY IF EXISTS "Event access policy" ON events;

-- Profiles table policies
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

-- Memberships table policies
DROP POLICY IF EXISTS "Users can view their own membership" ON memberships;
DROP POLICY IF EXISTS "Users view own membership" ON memberships;
DROP POLICY IF EXISTS "Admins can view all memberships" ON memberships;
DROP POLICY IF EXISTS "Staff view all memberships" ON memberships;
DROP POLICY IF EXISTS "Users can create membership" ON memberships;
DROP POLICY IF EXISTS "Users create own membership" ON memberships;
DROP POLICY IF EXISTS "Admins can manage memberships" ON memberships;
DROP POLICY IF EXISTS "Admins manage memberships" ON memberships;
DROP POLICY IF EXISTS "Membership access policy" ON memberships;

-- Event registrations table policies
DROP POLICY IF EXISTS "Users can view their own registrations" ON event_registrations;
DROP POLICY IF EXISTS "Users view own registrations" ON event_registrations;
DROP POLICY IF EXISTS "Users can register for events" ON event_registrations;
DROP POLICY IF EXISTS "Users can register" ON event_registrations;
DROP POLICY IF EXISTS "Users can update their own registrations" ON event_registrations;
DROP POLICY IF EXISTS "Users update own registrations" ON event_registrations;
DROP POLICY IF EXISTS "Users can cancel their own registrations" ON event_registrations;
DROP POLICY IF EXISTS "Users cancel own registrations" ON event_registrations;
DROP POLICY IF EXISTS "Admins can view all registrations" ON event_registrations;
DROP POLICY IF EXISTS "Staff view all registrations" ON event_registrations;
DROP POLICY IF EXISTS "Admins can manage all registrations" ON event_registrations;
DROP POLICY IF EXISTS "Admins manage all registrations" ON event_registrations;

-- Notifications table policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users update own notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can create notifications" ON notifications;
DROP POLICY IF EXISTS "Admins create notifications" ON notifications;

-- Storage policies
DROP POLICY IF EXISTS "Users can upload their own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view profile photos" ON storage.objects;
DROP POLICY IF EXISTS "profile_photos_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "profile_photos_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "profile_photos_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "iteam_upload_photos" ON storage.objects;
DROP POLICY IF EXISTS "iteam_view_photos" ON storage.objects;

-- =====================================================
-- ADD MISSING COLUMNS
-- =====================================================

-- Add missing columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address TEXT;

-- =====================================================
-- CREATE NOTIFICATIONS TABLE IF MISSING
-- =====================================================

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
-- CREATE STORAGE BUCKETS
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
-- DISABLE RLS TEMPORARILY (FOR TESTING)
-- =====================================================

-- Temporarily disable RLS to test data access
-- WARNING: Only do this for testing, re-enable for production

-- ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE memberships DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE events DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE event_registrations DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- Uncomment the above lines ONLY if you want to test without RLS
-- Remember to re-enable RLS after testing!

-- =====================================================
-- REFRESH SCHEMA
-- =====================================================

NOTIFY pgrst, 'reload schema';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

SELECT 
  'Policy cleanup completed!' as status,
  'All conflicting policies dropped' as policies,
  'Missing columns added' as columns,
  'Storage buckets created' as storage,
  'Ready for fresh policy creation' as next_step;
