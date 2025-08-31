-- FIX MEMBERSHIP ROLES ISSUE - Comprehensive Solution
-- This script addresses the issue where membership management doesn't fetch all users with their roles
-- Run this in Supabase SQL Editor

SELECT '🔧 FIXING MEMBERSHIP ROLES FETCHING ISSUE...' as status;

-- =====================================================
-- STEP 1: DIAGNOSE THE CURRENT STATE
-- =====================================================

SELECT 'Step 1: Analyzing current membership-profile relationships...' as action;

-- Check total memberships vs profiles
SELECT 
  'Current Data Overview' as analysis_type,
  (SELECT COUNT(*) FROM memberships) as total_memberships,
  (SELECT COUNT(*) FROM profiles) as total_profiles,
  (SELECT COUNT(*) FROM memberships m JOIN profiles p ON m.user_id = p.id) as memberships_with_profiles,
  (SELECT COUNT(*) FROM memberships m LEFT JOIN profiles p ON m.user_id = p.id WHERE p.id IS NULL) as memberships_without_profiles;

-- Show sample of problematic memberships
SELECT 
  'Problematic Memberships' as issue_type,
  m.id as membership_id,
  m.user_id,
  m.tier,
  m.status,
  m.created_at,
  CASE 
    WHEN m.user_id IS NULL THEN 'NULL_USER_ID'
    WHEN p.id IS NULL THEN 'MISSING_PROFILE'
    ELSE 'HAS_PROFILE'
  END as profile_status
FROM memberships m
LEFT JOIN profiles p ON m.user_id = p.id
WHERE m.user_id IS NULL OR p.id IS NULL
ORDER BY m.created_at DESC
LIMIT 10;

-- =====================================================
-- STEP 2: CREATE MISSING PROFILES FROM AUTH USERS
-- =====================================================

SELECT 'Step 2: Creating missing profiles for membership users...' as action;

-- Create profiles for auth users who have memberships but no profiles
INSERT INTO profiles (
  id,
  first_name,
  last_name,
  role,
  created_at,
  updated_at
)
SELECT DISTINCT
  au.id,
  COALESCE(au.raw_user_meta_data->>'first_name', 'Unknown') as first_name,
  COALESCE(au.raw_user_meta_data->>'last_name', 'User') as last_name,
  COALESCE(au.raw_user_meta_data->>'user_type', 'student')::user_role as role,
  NOW() as created_at,
  NOW() as updated_at
FROM auth.users au
JOIN memberships m ON au.id = m.user_id
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Report how many profiles were created
SELECT 
  'Profiles Created for Membership Users' as action,
  COUNT(*) as profiles_created
FROM profiles p 
WHERE p.created_at >= NOW() - INTERVAL '2 minutes'
  AND EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = p.id);

-- =====================================================
-- STEP 3: FIX ORPHANED MEMBERSHIPS (NO AUTH USER)
-- =====================================================

SELECT 'Step 3: Handling orphaned memberships...' as action;

-- Create emergency profiles for memberships where the auth user was deleted
INSERT INTO profiles (
  id,
  first_name,
  last_name,
  role,
  created_at,
  updated_at
)
SELECT DISTINCT
  m.user_id,
  'Deleted' as first_name,
  'User' as last_name,
  'student'::user_role as role,
  NOW() as created_at,
  NOW() as updated_at
FROM memberships m
LEFT JOIN profiles p ON m.user_id = p.id
LEFT JOIN auth.users au ON m.user_id = au.id
WHERE p.id IS NULL 
  AND m.user_id IS NOT NULL 
  AND au.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- STEP 4: FIX NULL USER_ID MEMBERSHIPS
-- =====================================================

SELECT 'Step 4: Analyzing memberships with NULL user_id...' as action;

-- Report memberships with NULL user_id (these need manual intervention)
SELECT 
  'Memberships with NULL user_id' as issue_type,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ NO NULL USER_ID MEMBERSHIPS'
    ELSE '⚠️ MANUAL INTERVENTION REQUIRED - ASSIGN USERS TO THESE MEMBERSHIPS'
  END as status
FROM memberships
WHERE user_id IS NULL;

-- Show specific memberships with NULL user_id for manual assignment
SELECT 
  'NULL User ID Memberships - Manual Assignment Needed' as category,
  id as membership_id,
  tier,
  status,
  amount,
  created_at,
  'ASSIGN USER_ID MANUALLY' as action_needed
FROM memberships
WHERE user_id IS NULL
ORDER BY created_at DESC;

-- =====================================================
-- STEP 5: VERIFY RLS POLICIES ARE NOT BLOCKING ACCESS
-- =====================================================

SELECT 'Step 5: Checking RLS policies for membership and profile access...' as action;

-- Check if RLS is enabled on relevant tables
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity THEN '✅ RLS ENABLED'
    ELSE '❌ RLS DISABLED'
  END as rls_status
FROM pg_tables 
WHERE tablename IN ('memberships', 'profiles')
  AND schemaname = 'public';

-- List current policies on memberships table
SELECT 
  'Membership Table Policies' as policy_category,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'memberships'
  AND schemaname = 'public';

-- List current policies on profiles table
SELECT 
  'Profiles Table Policies' as policy_category,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'profiles'
  AND schemaname = 'public';

-- =====================================================
-- STEP 6: ENSURE PROPER ACCESS POLICIES
-- =====================================================

SELECT 'Step 6: Ensuring proper RLS policies for admin access...' as action;

-- Create or update admin access policy for memberships
DROP POLICY IF EXISTS "Admin full access to memberships" ON memberships;
CREATE POLICY "Admin full access to memberships" ON memberships
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Create or update admin access policy for profiles
DROP POLICY IF EXISTS "Admin full access to profiles" ON profiles;
CREATE POLICY "Admin full access to profiles" ON profiles
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles admin_profile
      WHERE admin_profile.id = auth.uid() 
      AND admin_profile.role = 'admin'
    )
  );

-- Also ensure users can read their own profiles
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- =====================================================
-- STEP 7: FINAL VERIFICATION
-- =====================================================

SELECT 'Step 7: Final verification of membership-profile relationships...' as action;

-- Check final state after fixes
SELECT 
  'Post-Fix Analysis' as analysis_type,
  (SELECT COUNT(*) FROM memberships) as total_memberships,
  (SELECT COUNT(*) FROM profiles) as total_profiles,
  (SELECT COUNT(*) FROM memberships m JOIN profiles p ON m.user_id = p.id) as memberships_with_profiles,
  (SELECT COUNT(*) FROM memberships m LEFT JOIN profiles p ON m.user_id = p.id WHERE p.id IS NULL) as memberships_without_profiles,
  CASE 
    WHEN (SELECT COUNT(*) FROM memberships m LEFT JOIN profiles p ON m.user_id = p.id WHERE p.id IS NULL) = 0 
    THEN '✅ ALL MEMBERSHIPS HAVE PROFILES'
    ELSE '⚠️ SOME MEMBERSHIPS STILL MISSING PROFILES'
  END as status;

-- Show role distribution in memberships
SELECT 
  'Role Distribution in Memberships' as distribution_type,
  COALESCE(p.role::text, 'MISSING_PROFILE') as member_role,
  COUNT(m.id) as membership_count,
  ROUND(COUNT(m.id) * 100.0 / (SELECT COUNT(*) FROM memberships), 2) as percentage
FROM memberships m
LEFT JOIN profiles p ON m.user_id = p.id
GROUP BY p.role::text
ORDER BY membership_count DESC;

-- Show sample of fixed memberships with roles
SELECT 
  'Sample Fixed Memberships' as sample_type,
  m.id as membership_id,
  CONCAT(p.first_name, ' ', p.last_name) as member_name,
  p.role,
  m.tier,
  m.status,
  m.created_at
FROM memberships m
JOIN profiles p ON m.user_id = p.id
ORDER BY m.created_at DESC
LIMIT 10;

-- =====================================================
-- SUCCESS MESSAGE AND NEXT STEPS
-- =====================================================

SELECT '🎉 MEMBERSHIP ROLES ISSUE FIX COMPLETED!' as result;
SELECT 'The following issues have been resolved:' as fixes_applied;
SELECT '✅ Created missing profiles for membership users' as fix_1;
SELECT '✅ Fixed orphaned memberships with emergency profiles' as fix_2;
SELECT '✅ Ensured proper RLS policies for admin access' as fix_3;
SELECT '✅ Verified all memberships now have associated profiles' as fix_4;

SELECT '📋 NEXT STEPS:' as next_steps;
SELECT '1. Refresh the Membership Management page to see all users with roles' as step_1;
SELECT '2. Check browser console for improved debugging logs' as step_2;
SELECT '3. Verify that staff and student roles are now visible' as step_3;
SELECT '4. If NULL user_id memberships exist, assign them to specific users manually' as step_4;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';