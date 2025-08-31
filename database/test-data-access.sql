-- Test Data Access - Run this to check what's working
-- This script only tests access without changing policies

-- =====================================================
-- 1. TEST CURRENT USER ACCESS
-- =====================================================

-- Check current user
SELECT 
  'Current User' as test_name,
  auth.uid() as user_id,
  CASE WHEN auth.uid() IS NOT NULL THEN 'AUTHENTICATED' ELSE 'NOT_AUTHENTICATED' END as status;

-- =====================================================
-- 2. TEST PROFILE ACCESS
-- =====================================================

-- Test profile access
SELECT 
  'Profile Access' as test_name,
  COUNT(*) as record_count,
  CASE WHEN COUNT(*) > 0 THEN 'SUCCESS' ELSE 'NO_DATA' END as status
FROM profiles 
WHERE id = auth.uid();

-- Show profile data if accessible
SELECT 
  'Profile Data' as test_name,
  id, first_name, last_name, role, created_at
FROM profiles 
WHERE id = auth.uid();

-- =====================================================
-- 3. TEST MEMBERSHIP ACCESS
-- =====================================================

-- Test membership access
SELECT 
  'Membership Access' as test_name,
  COUNT(*) as record_count,
  CASE WHEN COUNT(*) > 0 THEN 'SUCCESS' ELSE 'NO_DATA' END as status
FROM memberships 
WHERE user_id = auth.uid();

-- =====================================================
-- 4. TEST EVENTS ACCESS
-- =====================================================

-- Test events access
SELECT 
  'Events Access' as test_name,
  COUNT(*) as record_count,
  CASE WHEN COUNT(*) > 0 THEN 'SUCCESS' ELSE 'NO_DATA' END as status
FROM events;

-- Show recent events if accessible
SELECT
  'Recent Events' as test_name,
  id,
  name as event_name,
  event_date,
  location,
  description,
  created_at
FROM events
ORDER BY created_at DESC
LIMIT 3;

-- =====================================================
-- 5. TEST EVENT REGISTRATIONS ACCESS
-- =====================================================

-- Test event registrations access
SELECT 
  'Event Registrations Access' as test_name,
  COUNT(*) as record_count,
  CASE WHEN COUNT(*) > 0 THEN 'SUCCESS' ELSE 'NO_DATA' END as status
FROM event_registrations 
WHERE user_id = auth.uid();

-- =====================================================
-- 6. TEST NOTIFICATIONS ACCESS (if table exists)
-- =====================================================

-- Test notifications access
SELECT 
  'Notifications Access' as test_name,
  COUNT(*) as record_count,
  CASE WHEN COUNT(*) > 0 THEN 'SUCCESS' ELSE 'NO_DATA' END as status
FROM notifications 
WHERE user_id = auth.uid();

-- =====================================================
-- 7. TEST ADMIN ACCESS (if user is admin)
-- =====================================================

-- Test admin access to all profiles
SELECT 
  'Admin - All Profiles Access' as test_name,
  COUNT(*) as record_count,
  CASE WHEN COUNT(*) > 0 THEN 'SUCCESS' ELSE 'NO_ACCESS' END as status
FROM profiles 
WHERE EXISTS (
  SELECT 1 FROM profiles p 
  WHERE p.id = auth.uid() 
  AND p.role = 'admin'
);

-- Test admin access to all memberships
SELECT 
  'Admin - All Memberships Access' as test_name,
  COUNT(*) as record_count,
  CASE WHEN COUNT(*) > 0 THEN 'SUCCESS' ELSE 'NO_ACCESS' END as status
FROM memberships 
WHERE EXISTS (
  SELECT 1 FROM profiles p 
  WHERE p.id = auth.uid() 
  AND p.role = 'admin'
);

-- =====================================================
-- 8. CHECK TABLE STRUCTURE
-- =====================================================

-- Check if required columns exist in profiles
SELECT 
  'Profiles Table Structure' as test_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if notifications table exists
SELECT 
  'Notifications Table Exists' as test_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'notifications' 
    AND table_schema = 'public'
  ) THEN 'EXISTS' ELSE 'MISSING' END as status;

-- =====================================================
-- 9. CHECK RLS STATUS
-- =====================================================

-- Check RLS status for all tables
SELECT 
  'RLS Status' as test_name,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'memberships', 'events', 'event_registrations', 'notifications');

-- =====================================================
-- 10. CHECK EXISTING POLICIES
-- =====================================================

-- Show existing policies
SELECT 
  'Existing Policies' as test_name,
  schemaname,
  tablename,
  policyname,
  cmd as command,
  roles
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
