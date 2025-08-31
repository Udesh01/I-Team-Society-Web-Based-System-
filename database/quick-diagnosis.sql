-- Quick Dashboard Diagnosis - Run this first to see what's wrong
-- This script only checks status, doesn't change anything

-- =====================================================
-- 1. CHECK AUTHENTICATION
-- =====================================================

SELECT 
  'Authentication Check' as test_name,
  CASE 
    WHEN auth.uid() IS NOT NULL THEN 'AUTHENTICATED ✅'
    ELSE 'NOT AUTHENTICATED ❌'
  END as status,
  auth.uid() as user_id;

-- =====================================================
-- 2. CHECK TABLE EXISTENCE
-- =====================================================

SELECT 
  'Table Existence Check' as test_name,
  table_name,
  CASE 
    WHEN table_name IS NOT NULL THEN 'EXISTS ✅'
    ELSE 'MISSING ❌'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('profiles', 'memberships', 'events', 'event_registrations', 'notifications')
ORDER BY table_name;

-- =====================================================
-- 3. CHECK RLS STATUS
-- =====================================================

SELECT 
  'RLS Status Check' as test_name,
  tablename as table_name,
  CASE 
    WHEN rowsecurity = true THEN 'ENABLED 🔒'
    ELSE 'DISABLED 🔓'
  END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'memberships', 'events', 'event_registrations', 'notifications')
ORDER BY tablename;

-- =====================================================
-- 4. CHECK BASIC DATA ACCESS
-- =====================================================

-- Try to count records in each table
SELECT 'profiles' as table_name, COUNT(*) as record_count FROM profiles
UNION ALL
SELECT 'memberships' as table_name, COUNT(*) as record_count FROM memberships
UNION ALL
SELECT 'events' as table_name, COUNT(*) as record_count FROM events
UNION ALL
SELECT 'event_registrations' as table_name, COUNT(*) as record_count FROM event_registrations
UNION ALL
SELECT 'notifications' as table_name, COUNT(*) as record_count FROM notifications;

-- =====================================================
-- 5. CHECK CURRENT USER'S DATA
-- =====================================================

-- Check if current user has profile
SELECT 
  'Current User Profile' as test_name,
  COUNT(*) as profile_count,
  CASE 
    WHEN COUNT(*) > 0 THEN 'FOUND ✅'
    ELSE 'NOT FOUND ❌'
  END as status
FROM profiles 
WHERE id = auth.uid();

-- Check if current user has membership
SELECT 
  'Current User Membership' as test_name,
  COUNT(*) as membership_count,
  CASE 
    WHEN COUNT(*) > 0 THEN 'FOUND ✅'
    ELSE 'NOT FOUND ❌'
  END as status
FROM memberships 
WHERE user_id = auth.uid();

-- =====================================================
-- 6. CHECK STORAGE BUCKETS
-- =====================================================

SELECT 
  'Storage Buckets Check' as test_name,
  id as bucket_id,
  name as bucket_name,
  CASE 
    WHEN public = true THEN 'PUBLIC ✅'
    ELSE 'PRIVATE 🔒'
  END as access_level
FROM storage.buckets 
WHERE id IN ('profile_photos', 'event-images', 'event_banners');

-- =====================================================
-- 7. CHECK POLICIES COUNT
-- =====================================================

SELECT 
  'Policies Count' as test_name,
  tablename,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'memberships', 'events', 'event_registrations', 'notifications')
GROUP BY tablename
ORDER BY tablename;

-- =====================================================
-- 8. DIAGNOSIS SUMMARY
-- =====================================================

SELECT 
  'DIAGNOSIS SUMMARY' as section,
  'Check the results above to identify issues:' as instructions
UNION ALL
SELECT 
  '1. Authentication', 
  'If NOT AUTHENTICATED, user needs to log in'
UNION ALL
SELECT 
  '2. Tables', 
  'If any table is MISSING, it needs to be created'
UNION ALL
SELECT 
  '3. RLS Status', 
  'If ENABLED and no data access, policies might be blocking'
UNION ALL
SELECT 
  '4. Data Access', 
  'If record_count shows 0 for all, check permissions'
UNION ALL
SELECT 
  '5. User Data', 
  'If NOT FOUND, user profile/membership might not exist'
UNION ALL
SELECT 
  '6. Storage', 
  'If buckets missing, profile photos won''t work'
UNION ALL
SELECT 
  '7. Policies', 
  'If policy_count is 0, no access rules are set';

-- =====================================================
-- NEXT STEPS BASED ON RESULTS
-- =====================================================

/*
BASED ON THE RESULTS ABOVE:

❌ NOT AUTHENTICATED:
   - User needs to log in to the dashboard
   - Check if login is working properly

❌ TABLES MISSING:
   - Run database setup scripts
   - Create missing tables

🔒 RLS ENABLED + NO DATA ACCESS:
   - RLS policies are blocking access
   - Run minimal-dashboard-fix.sql to temporarily disable RLS
   - Or create proper RLS policies

❌ NO USER PROFILE/MEMBERSHIP:
   - User account might not be properly set up
   - Check user registration process

❌ STORAGE BUCKETS MISSING:
   - Profile photo upload won't work
   - Create storage buckets

✅ EVERYTHING LOOKS GOOD:
   - Issue might be in the frontend code
   - Check browser console for JavaScript errors
   - Use the debug tool in the dashboard
*/
