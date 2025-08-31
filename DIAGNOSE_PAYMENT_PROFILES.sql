-- DIAGNOSE PAYMENT PROFILES ISSUE
-- This script identifies missing profile data for payment users
-- Run this in Supabase SQL Editor to understand the "Unknown Member" issue

SELECT '🔍 DIAGNOSING PAYMENT PROFILES ISSUE...' as status;

-- =====================================================
-- STEP 1: CHECK PAYMENTS WITHOUT PROFILES
-- =====================================================

SELECT 'Step 1: Checking payments with missing profiles...' as action;

-- Find payments where user_id doesn't exist in profiles table
SELECT 
  'Payments with Missing Profiles' as issue_type,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ NO ISSUES FOUND'
    ELSE '❌ MISSING PROFILES DETECTED'
  END as status
FROM payments p
LEFT JOIN profiles pr ON p.user_id = pr.id
WHERE pr.id IS NULL AND p.user_id IS NOT NULL;

-- Show specific payments with missing profiles
SELECT 
  p.id as payment_id,
  p.user_id,
  p.amount,
  p.status,
  p.created_at,
  'MISSING PROFILE' as issue
FROM payments p
LEFT JOIN profiles pr ON p.user_id = pr.id
WHERE pr.id IS NULL AND p.user_id IS NOT NULL
ORDER BY p.created_at DESC
LIMIT 10;

-- =====================================================
-- STEP 2: CHECK AUTH USERS WITHOUT PROFILES
-- =====================================================

SELECT 'Step 2: Checking auth users without profiles...' as action;

-- Find auth users who don't have profiles
SELECT 
  'Auth Users Without Profiles' as issue_type,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ ALL USERS HAVE PROFILES'
    ELSE '❌ USERS WITHOUT PROFILES DETECTED'
  END as status
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- Show specific auth users without profiles
SELECT 
  au.id as user_id,
  au.email,
  au.created_at,
  au.raw_user_meta_data->>'first_name' as meta_first_name,
  au.raw_user_meta_data->>'last_name' as meta_last_name,
  au.raw_user_meta_data->>'user_type' as meta_role,
  'MISSING PROFILE' as issue
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL
ORDER BY au.created_at DESC
LIMIT 10;

-- =====================================================
-- STEP 3: CHECK PAYMENTS WITH NULL USER_ID
-- =====================================================

SELECT 'Step 3: Checking payments with null user_id...' as action;

SELECT 
  'Payments with NULL user_id' as issue_type,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ ALL PAYMENTS HAVE USER_ID'
    ELSE '❌ PAYMENTS WITH NULL USER_ID DETECTED'
  END as status
FROM payments
WHERE user_id IS NULL;

-- Show payments with null user_id
SELECT 
  id as payment_id,
  amount,
  status,
  created_at,
  'NULL USER_ID' as issue
FROM payments
WHERE user_id IS NULL
ORDER BY created_at DESC
LIMIT 5;

-- =====================================================
-- STEP 4: PROFILE DATA INTEGRITY CHECK
-- =====================================================

SELECT 'Step 4: Checking profile data integrity...' as action;

-- Check for profiles with missing names
SELECT 
  'Profiles with Missing Names' as issue_type,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ ALL PROFILES HAVE NAMES'
    ELSE '❌ PROFILES WITH MISSING NAMES DETECTED'
  END as status
FROM profiles
WHERE first_name IS NULL OR last_name IS NULL OR TRIM(first_name) = '' OR TRIM(last_name) = '';

-- Show profiles with missing data
SELECT 
  id,
  first_name,
  last_name,
  role,
  created_at,
  CASE 
    WHEN first_name IS NULL OR TRIM(first_name) = '' THEN 'MISSING FIRST_NAME'
    WHEN last_name IS NULL OR TRIM(last_name) = '' THEN 'MISSING LAST_NAME'
    ELSE 'OTHER ISSUE'
  END as issue
FROM profiles
WHERE first_name IS NULL OR last_name IS NULL OR TRIM(first_name) = '' OR TRIM(last_name) = ''
ORDER BY created_at DESC
LIMIT 10;

-- =====================================================
-- STEP 5: PAYMENT-PROFILE JOIN ANALYSIS
-- =====================================================

SELECT 'Step 5: Analyzing payment-profile relationships...' as action;

-- Summary of payment-profile relationships
SELECT 
  CASE 
    WHEN p.user_id IS NULL THEN 'NULL_USER_ID'
    WHEN pr.id IS NULL THEN 'MISSING_PROFILE'
    WHEN pr.first_name IS NULL OR pr.last_name IS NULL THEN 'INCOMPLETE_PROFILE'
    ELSE 'COMPLETE'
  END as relationship_status,
  COUNT(*) as payment_count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM payments), 2) as percentage
FROM payments p
LEFT JOIN profiles pr ON p.user_id = pr.id
GROUP BY 
  CASE 
    WHEN p.user_id IS NULL THEN 'NULL_USER_ID'
    WHEN pr.id IS NULL THEN 'MISSING_PROFILE'
    WHEN pr.first_name IS NULL OR pr.last_name IS NULL THEN 'INCOMPLETE_PROFILE'
    ELSE 'COMPLETE'
  END
ORDER BY payment_count DESC;

-- =====================================================
-- STEP 6: RECENT PAYMENTS ANALYSIS
-- =====================================================

SELECT 'Step 6: Analyzing recent payments...' as action;

-- Show recent payments with their profile status
SELECT 
  p.id as payment_id,
  p.user_id,
  p.amount,
  p.status as payment_status,
  p.created_at,
  CASE 
    WHEN p.user_id IS NULL THEN 'NO_USER_ID'
    WHEN pr.id IS NULL THEN 'PROFILE_MISSING'
    WHEN pr.first_name IS NULL OR pr.last_name IS NULL THEN 'PROFILE_INCOMPLETE'
    ELSE CONCAT(pr.first_name, ' ', pr.last_name)
  END as member_name,
  pr.role
FROM payments p
LEFT JOIN profiles pr ON p.user_id = pr.id
ORDER BY p.created_at DESC
LIMIT 15;

-- =====================================================
-- SUMMARY AND RECOMMENDATIONS
-- =====================================================

SELECT '📋 DIAGNOSIS SUMMARY AND RECOMMENDATIONS' as result;

-- Count total issues
WITH issue_summary AS (
  SELECT 
    SUM(CASE WHEN p.user_id IS NULL THEN 1 ELSE 0 END) as null_user_id_count,
    SUM(CASE WHEN p.user_id IS NOT NULL AND pr.id IS NULL THEN 1 ELSE 0 END) as missing_profile_count,
    SUM(CASE WHEN pr.id IS NOT NULL AND (pr.first_name IS NULL OR pr.last_name IS NULL) THEN 1 ELSE 0 END) as incomplete_profile_count
  FROM payments p
  LEFT JOIN profiles pr ON p.user_id = pr.id
)
SELECT 
  '🔍 ISSUE BREAKDOWN:' as summary,
  CONCAT(null_user_id_count, ' payments with NULL user_id') as issue_1,
  CONCAT(missing_profile_count, ' payments with missing profiles') as issue_2,
  CONCAT(incomplete_profile_count, ' payments with incomplete profiles') as issue_3
FROM issue_summary;

SELECT '💡 RECOMMENDED ACTIONS:' as recommendations;
SELECT '1. Run emergency profile creation script for missing profiles' as action_1;
SELECT '2. Update payments with NULL user_id to link to correct users' as action_2;
SELECT '3. Complete missing first_name/last_name data in profiles' as action_3;
SELECT '4. Check user registration process for profile creation failures' as action_4;

SELECT '🎯 Next step: Check browser console logs when visiting payment management page' as next_step;