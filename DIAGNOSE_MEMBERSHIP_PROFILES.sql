-- DIAGNOSE MEMBERSHIP PROFILES ISSUE
-- This script identifies missing profile data for membership users
-- Run this in Supabase SQL Editor to understand membership display issues

SELECT '🔍 DIAGNOSING MEMBERSHIP PROFILES ISSUE...' as status;

-- =====================================================
-- STEP 1: CHECK MEMBERSHIPS WITHOUT PROFILES
-- =====================================================

SELECT 'Step 1: Checking memberships with missing profiles...' as action;

-- Find memberships where user_id doesn't exist in profiles table
SELECT 
  'Memberships with Missing Profiles' as issue_type,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ NO ISSUES FOUND'
    ELSE '❌ MISSING PROFILES DETECTED'
  END as status
FROM memberships m
LEFT JOIN profiles pr ON m.user_id = pr.id
WHERE pr.id IS NULL AND m.user_id IS NOT NULL;

-- Show specific memberships with missing profiles
SELECT 
  m.id as membership_id,
  m.user_id,
  m.tier,
  m.status,
  m.eid,
  m.created_at,
  'MISSING PROFILE' as issue
FROM memberships m
LEFT JOIN profiles pr ON m.user_id = pr.id
WHERE pr.id IS NULL AND m.user_id IS NOT NULL
ORDER BY m.created_at DESC
LIMIT 10;

-- =====================================================
-- STEP 2: CHECK AUTH USERS WITHOUT PROFILES (FOR MEMBERSHIPS)
-- =====================================================

SELECT 'Step 2: Checking auth users with memberships but no profiles...' as action;

-- Find auth users who have memberships but no profiles
SELECT 
  'Auth Users with Memberships but No Profiles' as issue_type,
  COUNT(DISTINCT m.user_id) as count,
  CASE 
    WHEN COUNT(DISTINCT m.user_id) = 0 THEN '✅ ALL MEMBERSHIP USERS HAVE PROFILES'
    ELSE '❌ MEMBERSHIP USERS WITHOUT PROFILES DETECTED'
  END as status
FROM memberships m
LEFT JOIN profiles p ON m.user_id = p.id
WHERE p.id IS NULL AND m.user_id IS NOT NULL;

-- Show specific users with memberships but no profiles
SELECT 
  m.user_id,
  COUNT(m.id) as membership_count,
  STRING_AGG(m.tier::text, ', ') as tiers,
  STRING_AGG(m.status::text, ', ') as statuses,
  'MISSING PROFILE FOR MEMBERSHIP USER' as issue
FROM memberships m
LEFT JOIN profiles p ON m.user_id = p.id
WHERE p.id IS NULL AND m.user_id IS NOT NULL
GROUP BY m.user_id
ORDER BY membership_count DESC
LIMIT 10;

-- =====================================================
-- STEP 3: CHECK MEMBERSHIPS WITH NULL USER_ID
-- =====================================================

SELECT 'Step 3: Checking memberships with null user_id...' as action;

SELECT 
  'Memberships with NULL user_id' as issue_type,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ ALL MEMBERSHIPS HAVE USER_ID'
    ELSE '❌ MEMBERSHIPS WITH NULL USER_ID DETECTED'
  END as status
FROM memberships
WHERE user_id IS NULL;

-- Show memberships with null user_id
SELECT 
  id as membership_id,
  tier,
  status,
  eid,
  amount,
  created_at,
  'NULL USER_ID' as issue
FROM memberships
WHERE user_id IS NULL
ORDER BY created_at DESC
LIMIT 5;

-- =====================================================
-- STEP 4: MEMBERSHIP PROFILE DATA INTEGRITY CHECK
-- =====================================================

SELECT 'Step 4: Checking membership profile data integrity...' as action;

-- Check for profiles with missing names (that have memberships)
SELECT 
  'Membership Users with Missing Names' as issue_type,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ ALL MEMBERSHIP USERS HAVE NAMES'
    ELSE '❌ MEMBERSHIP USERS WITH MISSING NAMES DETECTED'
  END as status
FROM memberships m
JOIN profiles p ON m.user_id = p.id
WHERE p.first_name IS NULL OR p.last_name IS NULL OR TRIM(p.first_name) = '' OR TRIM(p.last_name) = '';

-- Show membership users with missing profile data
SELECT 
  m.id as membership_id,
  m.user_id,
  p.first_name,
  p.last_name,
  p.role,
  m.tier,
  m.status,
  CASE 
    WHEN p.first_name IS NULL OR TRIM(p.first_name) = '' THEN 'MISSING FIRST_NAME'
    WHEN p.last_name IS NULL OR TRIM(p.last_name) = '' THEN 'MISSING LAST_NAME'
    ELSE 'OTHER ISSUE'
  END as issue
FROM memberships m
JOIN profiles p ON m.user_id = p.id
WHERE p.first_name IS NULL OR p.last_name IS NULL OR TRIM(p.first_name) = '' OR TRIM(p.last_name) = ''
ORDER BY m.created_at DESC
LIMIT 10;

-- =====================================================
-- STEP 5: MEMBERSHIP-PROFILE JOIN ANALYSIS
-- =====================================================

SELECT 'Step 5: Analyzing membership-profile relationships...' as action;

-- Summary of membership-profile relationships
SELECT 
  CASE 
    WHEN m.user_id IS NULL THEN 'NULL_USER_ID'
    WHEN pr.id IS NULL THEN 'MISSING_PROFILE'
    WHEN pr.first_name IS NULL OR pr.last_name IS NULL THEN 'INCOMPLETE_PROFILE'
    ELSE 'COMPLETE'
  END as relationship_status,
  COUNT(*) as membership_count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM memberships), 2) as percentage
FROM memberships m
LEFT JOIN profiles pr ON m.user_id = pr.id
GROUP BY 
  CASE 
    WHEN m.user_id IS NULL THEN 'NULL_USER_ID'
    WHEN pr.id IS NULL THEN 'MISSING_PROFILE'
    WHEN pr.first_name IS NULL OR pr.last_name IS NULL THEN 'INCOMPLETE_PROFILE'
    ELSE 'COMPLETE'
  END
ORDER BY membership_count DESC;

-- =====================================================
-- STEP 6: ROLE DISTRIBUTION ANALYSIS
-- =====================================================

SELECT 'Step 6: Analyzing role distribution in memberships...' as action;

-- Show role distribution for memberships
SELECT 
  COALESCE(pr.role::text, 'MISSING_PROFILE') as member_role,
  COUNT(m.id) as membership_count,
  ROUND(COUNT(m.id) * 100.0 / (SELECT COUNT(*) FROM memberships), 2) as percentage,
  STRING_AGG(DISTINCT m.status::text, ', ') as statuses_found
FROM memberships m
LEFT JOIN profiles pr ON m.user_id = pr.id
GROUP BY pr.role::text
ORDER BY membership_count DESC;

-- =====================================================
-- STEP 7: RECENT MEMBERSHIPS ANALYSIS
-- =====================================================

SELECT 'Step 7: Analyzing recent memberships...' as action;

-- Show recent memberships with their profile status
SELECT 
  m.id as membership_id,
  m.user_id,
  m.tier,
  m.status as membership_status,
  m.eid,
  m.created_at,
  CASE 
    WHEN m.user_id IS NULL THEN 'NO_USER_ID'
    WHEN pr.id IS NULL THEN 'PROFILE_MISSING'
    WHEN pr.first_name IS NULL OR pr.last_name IS NULL THEN 'PROFILE_INCOMPLETE'
    ELSE CONCAT(pr.first_name, ' ', pr.last_name)
  END as member_name,
  pr.role
FROM memberships m
LEFT JOIN profiles pr ON m.user_id = pr.id
ORDER BY m.created_at DESC
LIMIT 15;

-- =====================================================
-- STEP 8: STAFF VS STUDENT ANALYSIS
-- =====================================================

SELECT 'Step 8: Analyzing staff vs student membership distribution...' as action;

-- Check if staff and student roles are present in memberships
SELECT 
  'Staff Memberships' as membership_type,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) = 0 THEN '❌ NO STAFF MEMBERSHIPS FOUND'
    ELSE '✅ STAFF MEMBERSHIPS EXIST'
  END as status
FROM memberships m
JOIN profiles pr ON m.user_id = pr.id
WHERE pr.role = 'staff';

SELECT 
  'Student Memberships' as membership_type,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) = 0 THEN '❌ NO STUDENT MEMBERSHIPS FOUND'
    ELSE '✅ STUDENT MEMBERSHIPS EXIST'
  END as status
FROM memberships m
JOIN profiles pr ON m.user_id = pr.id
WHERE pr.role = 'student';

-- Show sample staff and student memberships
SELECT 
  'Sample Staff Memberships' as sample_type,
  m.id,
  CONCAT(pr.first_name, ' ', pr.last_name) as member_name,
  pr.role,
  m.tier,
  m.status,
  m.created_at
FROM memberships m
JOIN profiles pr ON m.user_id = pr.id
WHERE pr.role = 'staff'
ORDER BY m.created_at DESC
LIMIT 5;

SELECT 
  'Sample Student Memberships' as sample_type,
  m.id,
  CONCAT(pr.first_name, ' ', pr.last_name) as member_name,
  pr.role,
  m.tier,
  m.status,
  m.created_at
FROM memberships m
JOIN profiles pr ON m.user_id = pr.id
WHERE pr.role = 'student'
ORDER BY m.created_at DESC
LIMIT 5;

-- =====================================================
-- SUMMARY AND RECOMMENDATIONS
-- =====================================================

SELECT '📋 DIAGNOSIS SUMMARY AND RECOMMENDATIONS' as result;

-- Count total issues
WITH issue_summary AS (
  SELECT 
    SUM(CASE WHEN m.user_id IS NULL THEN 1 ELSE 0 END) as null_user_id_count,
    SUM(CASE WHEN m.user_id IS NOT NULL AND pr.id IS NULL THEN 1 ELSE 0 END) as missing_profile_count,
    SUM(CASE WHEN pr.id IS NOT NULL AND (pr.first_name IS NULL OR pr.last_name IS NULL) THEN 1 ELSE 0 END) as incomplete_profile_count,
    COUNT(*) as total_memberships
  FROM memberships m
  LEFT JOIN profiles pr ON m.user_id = pr.id
)
SELECT 
  '🔍 MEMBERSHIP ISSUE BREAKDOWN:' as summary,
  CONCAT(total_memberships, ' total memberships') as total,
  CONCAT(null_user_id_count, ' memberships with NULL user_id') as issue_1,
  CONCAT(missing_profile_count, ' memberships with missing profiles') as issue_2,
  CONCAT(incomplete_profile_count, ' memberships with incomplete profiles') as issue_3
FROM issue_summary;

SELECT '💡 RECOMMENDED ACTIONS:' as recommendations;
SELECT '1. Run FIX_PAYMENT_PROFILES.sql script (it also fixes membership profiles)' as action_1;
SELECT '2. Check if registration process is creating memberships before profiles' as action_2;
SELECT '3. Verify that both staff and student roles can create memberships' as action_3;
SELECT '4. Check RLS policies for membership table access' as action_4;

SELECT '🎯 Next step: Check browser console logs when visiting admin/memberships page' as next_step;