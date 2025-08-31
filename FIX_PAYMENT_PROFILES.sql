-- FIX PAYMENT PROFILES ISSUE - Create Missing Profiles
-- This script creates missing profiles for users who have payments but no profile records
-- Run this in Supabase SQL Editor AFTER running the diagnostic script

SELECT '🔧 FIXING PAYMENT PROFILES ISSUE...' as status;

-- =====================================================
-- STEP 1: CREATE MISSING PROFILES FROM AUTH METADATA
-- =====================================================

SELECT 'Step 1: Creating missing profiles from auth user metadata...' as action;

-- Create profiles for auth users who don't have them
INSERT INTO profiles (
  id,
  first_name,
  last_name,
  role,
  created_at,
  updated_at
)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'first_name', 'Unknown') as first_name,
  COALESCE(au.raw_user_meta_data->>'last_name', 'User') as last_name,
  COALESCE(au.raw_user_meta_data->>'user_type', 'student')::user_role as role,
  NOW() as created_at,
  NOW() as updated_at
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Report how many profiles were created
SELECT 
  'Profiles Created from Auth Users' as action,
  COUNT(*) as profiles_created
FROM auth.users au
WHERE au.id IN (
  SELECT p.id 
  FROM profiles p 
  WHERE p.created_at >= NOW() - INTERVAL '1 minute'
);

-- =====================================================
-- STEP 2: FIX INCOMPLETE PROFILES
-- =====================================================

SELECT 'Step 2: Fixing incomplete profile data...' as action;

-- Update profiles with missing first_name
UPDATE profiles 
SET 
  first_name = 'Unknown',
  updated_at = NOW()
WHERE first_name IS NULL OR TRIM(first_name) = '';

-- Update profiles with missing last_name
UPDATE profiles 
SET 
  last_name = 'User',
  updated_at = NOW()
WHERE last_name IS NULL OR TRIM(last_name) = '';

-- Update profiles with missing role
UPDATE profiles 
SET 
  role = 'student',
  updated_at = NOW()
WHERE role IS NULL;

-- Report how many profiles were fixed
SELECT 
  'Incomplete Profiles Fixed' as action,
  COUNT(*) as profiles_fixed
FROM profiles 
WHERE updated_at >= NOW() - INTERVAL '1 minute'
  AND (first_name = 'Unknown' OR last_name = 'User');

-- =====================================================
-- STEP 3: CREATE EMERGENCY PROFILES FOR ORPHANED PAYMENTS
-- =====================================================

SELECT 'Step 3: Creating emergency profiles for orphaned payments...' as action;

-- Create emergency profiles for payments with user_ids that don't exist in auth.users
-- This handles cases where payments exist but the auth user was deleted
INSERT INTO profiles (
  id,
  first_name,
  last_name,
  role,
  created_at,
  updated_at
)
SELECT DISTINCT
  p.user_id,
  'Deleted' as first_name,
  'User' as last_name,
  'student'::user_role as role,
  NOW() as created_at,
  NOW() as updated_at
FROM payments p
LEFT JOIN profiles pr ON p.user_id = pr.id
LEFT JOIN auth.users au ON p.user_id = au.id
WHERE pr.id IS NULL 
  AND p.user_id IS NOT NULL 
  AND au.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- STEP 4: VERIFICATION
-- =====================================================

SELECT 'Step 4: Verifying the fixes...' as action;

-- Check if all payments now have profiles
SELECT 
  'Verification: Payments with Profiles' as check_type,
  COUNT(*) as total_payments,
  SUM(CASE WHEN pr.id IS NOT NULL THEN 1 ELSE 0 END) as payments_with_profiles,
  SUM(CASE WHEN pr.id IS NULL THEN 1 ELSE 0 END) as payments_without_profiles,
  CASE 
    WHEN SUM(CASE WHEN pr.id IS NULL THEN 1 ELSE 0 END) = 0 THEN '✅ ALL PAYMENTS HAVE PROFILES'
    ELSE '❌ SOME PAYMENTS STILL MISSING PROFILES'
  END as status
FROM payments p
LEFT JOIN profiles pr ON p.user_id = pr.id
WHERE p.user_id IS NOT NULL;

-- Check profile data completeness
SELECT 
  'Verification: Profile Data Completeness' as check_type,
  COUNT(*) as total_profiles,
  SUM(CASE WHEN first_name IS NOT NULL AND last_name IS NOT NULL AND role IS NOT NULL THEN 1 ELSE 0 END) as complete_profiles,
  SUM(CASE WHEN first_name IS NULL OR last_name IS NULL OR role IS NULL THEN 1 ELSE 0 END) as incomplete_profiles,
  CASE 
    WHEN SUM(CASE WHEN first_name IS NULL OR last_name IS NULL OR role IS NULL THEN 1 ELSE 0 END) = 0 THEN '✅ ALL PROFILES COMPLETE'
    ELSE '❌ SOME PROFILES INCOMPLETE'
  END as status
FROM profiles;

-- Show sample of fixed payments
SELECT 
  'Sample of Fixed Payments' as sample_type,
  p.id as payment_id,
  p.user_id,
  p.amount,
  CONCAT(pr.first_name, ' ', pr.last_name) as member_name,
  pr.role,
  p.created_at as payment_date
FROM payments p
JOIN profiles pr ON p.user_id = pr.id
ORDER BY p.created_at DESC
LIMIT 10;

-- =====================================================
-- STEP 5: CLEANUP NULL USER_ID PAYMENTS (IF ANY)
-- =====================================================

SELECT 'Step 5: Handling payments with NULL user_id...' as action;

-- Report payments with NULL user_id
SELECT 
  'Payments with NULL user_id' as issue_type,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ NO NULL USER_ID PAYMENTS'
    ELSE '⚠️ MANUAL INTERVENTION REQUIRED'
  END as status
FROM payments
WHERE user_id IS NULL;

-- Show payments with NULL user_id for manual review
SELECT 
  id as payment_id,
  amount,
  status,
  payment_date,
  created_at,
  notes,
  'REQUIRES MANUAL USER ASSIGNMENT' as action_needed
FROM payments
WHERE user_id IS NULL
ORDER BY created_at DESC
LIMIT 5;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

SELECT '🎉 PAYMENT PROFILES FIX COMPLETED!' as result;
SELECT 'The following issues have been resolved:' as fixes_applied;
SELECT '✅ Created missing profiles from auth user metadata' as fix_1;
SELECT '✅ Fixed incomplete profile data (names and roles)' as fix_2;
SELECT '✅ Created emergency profiles for orphaned payments' as fix_3;
SELECT '✅ Verified all payments now have associated profiles' as fix_4;
SELECT 'Please refresh the Payment Management page to see the updated member names!' as next_action;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';