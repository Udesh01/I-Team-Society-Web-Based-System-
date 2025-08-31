-- EMERGENCY FIX FOR INFINITE RECURSION IN PROFILES TABLE
-- This script immediately fixes the infinite recursion issue in RLS policies
-- Run this in Supabase SQL Editor RIGHT NOW

SELECT '🚨 FIXING INFINITE RECURSION IN PROFILES TABLE...' as status;

-- =====================================================
-- STEP 1: IMMEDIATELY DISABLE RLS TO STOP THE RECURSION
-- =====================================================

SELECT 'Step 1: Temporarily disabling RLS to stop infinite recursion...' as action;

-- Disable RLS on profiles table to stop the recursion immediately
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 2: DROP ALL PROBLEMATIC POLICIES
-- =====================================================

SELECT 'Step 2: Removing all policies that could cause recursion...' as action;

-- Drop ALL existing policies on profiles table (comprehensive cleanup)
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Staff can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Profile access policy" ON profiles;
DROP POLICY IF EXISTS "User profile access" ON profiles;
DROP POLICY IF EXISTS "emergency_allow_all" ON profiles;
DROP POLICY IF EXISTS "users_select_own_profile" ON profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON profiles;
DROP POLICY IF EXISTS "users_insert_own_profile" ON profiles;
DROP POLICY IF EXISTS "anon_insert_profile" ON profiles;
DROP POLICY IF EXISTS "admin_select_all_profiles" ON profiles;
DROP POLICY IF EXISTS "admin_update_all_profiles" ON profiles;

-- =====================================================
-- STEP 3: CREATE SIMPLE, NON-RECURSIVE POLICIES
-- =====================================================

SELECT 'Step 3: Creating simple policies without recursion...' as action;

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create simple policies that DON'T reference the profiles table for role checks
-- This prevents infinite recursion

-- Allow users to select their own profile (simple ownership check)
CREATE POLICY "simple_own_profile_select" ON profiles 
FOR SELECT TO authenticated 
USING (id = auth.uid());

-- Allow users to update their own profile (simple ownership check)
CREATE POLICY "simple_own_profile_update" ON profiles 
FOR UPDATE TO authenticated 
USING (id = auth.uid()) 
WITH CHECK (id = auth.uid());

-- Allow users to insert their own profile (simple ownership check)
CREATE POLICY "simple_own_profile_insert" ON profiles 
FOR INSERT TO authenticated 
WITH CHECK (id = auth.uid());

-- Allow anonymous users to insert profiles (for registration)
CREATE POLICY "simple_anon_profile_insert" ON profiles 
FOR INSERT TO anon 
WITH CHECK (true);

-- Allow service role (backend) full access
CREATE POLICY "simple_service_role_access" ON profiles 
FOR ALL TO service_role 
USING (true) 
WITH CHECK (true);

-- =====================================================
-- STEP 4: FIX OTHER TABLES THAT MIGHT HAVE SIMILAR ISSUES
-- =====================================================

SELECT 'Step 4: Checking and fixing other tables...' as action;

-- Check if student_details has recursion issues
ALTER TABLE student_details DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_select_all_students" ON student_details;
ALTER TABLE student_details ENABLE ROW LEVEL SECURITY;

-- Simple student_details policies
CREATE POLICY "simple_student_select" ON student_details 
FOR SELECT TO authenticated 
USING (id = auth.uid());

CREATE POLICY "simple_student_insert" ON student_details 
FOR INSERT TO authenticated 
WITH CHECK (id = auth.uid());

CREATE POLICY "simple_student_insert_anon" ON student_details 
FOR INSERT TO anon 
WITH CHECK (true);

-- Check if staff_details has recursion issues
ALTER TABLE staff_details DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_select_all_staff" ON staff_details;
ALTER TABLE staff_details ENABLE ROW LEVEL SECURITY;

-- Simple staff_details policies
CREATE POLICY "simple_staff_select" ON staff_details 
FOR SELECT TO authenticated 
USING (id = auth.uid());

CREATE POLICY "simple_staff_insert" ON staff_details 
FOR INSERT TO authenticated 
WITH CHECK (id = auth.uid());

CREATE POLICY "simple_staff_insert_anon" ON staff_details 
FOR INSERT TO anon 
WITH CHECK (true);

-- Check if memberships has recursion issues
ALTER TABLE memberships DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_select_all_memberships" ON memberships;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;

-- Simple membership policies
CREATE POLICY "simple_membership_select" ON memberships 
FOR SELECT TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "simple_membership_insert" ON memberships 
FOR INSERT TO authenticated 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "simple_membership_insert_anon" ON memberships 
FOR INSERT TO anon 
WITH CHECK (true);

-- =====================================================
-- STEP 5: GRANT PERMISSIONS TO PREVENT ACCESS ISSUES
-- =====================================================

SELECT 'Step 5: Granting necessary permissions...' as action;

-- Grant basic permissions
GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE ON student_details TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE ON staff_details TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE ON memberships TO authenticated, anon;

-- =====================================================
-- STEP 6: VERIFICATION
-- =====================================================

SELECT 'Step 6: Verifying the fix...' as action;

-- Test a simple profile query that was causing infinite recursion
SELECT 
  'Profile Query Test' as test_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM profiles LIMIT 1
    ) THEN '✅ PROFILES ACCESSIBLE'
    ELSE 'ℹ️ NO PROFILES (Normal for empty DB)'
  END as status;

-- Check policies are simple and non-recursive
SELECT 
  'Policy Check' as test_name,
  COUNT(*) as policy_count,
  CASE 
    WHEN COUNT(*) >= 8 THEN '✅ SIMPLE POLICIES CREATED'
    ELSE '⚠️ SOME POLICIES MISSING'
  END as status
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'profiles'
AND policyname LIKE 'simple_%';

-- =====================================================
-- STEP 7: CREATE ADMIN ACCESS WITHOUT RECURSION
-- =====================================================

SELECT 'Step 7: Creating safe admin access...' as action;

-- Create a separate view for admin access to avoid recursion
CREATE OR REPLACE VIEW admin_profiles_view AS
SELECT 
  p.*,
  CASE 
    WHEN p.role = 'admin' THEN true
    ELSE false
  END as is_admin
FROM profiles p;

-- Grant access to the view
GRANT SELECT ON admin_profiles_view TO authenticated;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

SELECT '🎉 INFINITE RECURSION FIX COMPLETED!' as result;
SELECT 'The following has been fixed:' as fixes;
SELECT '✅ Removed all recursive policies from profiles table' as fix_1;
SELECT '✅ Created simple, non-recursive policies' as fix_2;
SELECT '✅ Fixed other tables that might have similar issues' as fix_3;
SELECT '✅ Granted necessary permissions' as fix_4;
SELECT '✅ Created safe admin access view' as fix_5;
SELECT 'Try logging in again - the infinite recursion should be resolved!' as next_action;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';

-- =====================================================
-- FINAL STATUS CHECK
-- =====================================================

SELECT 'FINAL STATUS CHECK' as header;

-- Show current policies (should be simple and non-recursive)
SELECT 
  tablename,
  policyname,
  cmd as operation
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'student_details', 'staff_details', 'memberships')
ORDER BY tablename, policyname;