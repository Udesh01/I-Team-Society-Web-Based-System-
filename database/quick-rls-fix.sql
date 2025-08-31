-- Quick RLS Fix for Dashboard Access Issue
-- Run this in Supabase SQL Editor

-- =====================================================
-- STEP 1: CHECK CURRENT RLS STATUS
-- =====================================================

-- Check if RLS is enabled on profiles table
SELECT 
  'RLS Status Check' as test,
  tablename,
  CASE 
    WHEN rowsecurity = true THEN 'RLS ENABLED 🔒'
    ELSE 'RLS DISABLED 🔓'
  END as status
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'profiles';

-- Check existing policies on profiles table
SELECT 
  'Current Policies' as test,
  policyname,
  permissive,
  roles,
  cmd,
  CASE 
    WHEN qual IS NOT NULL THEN 'HAS CONDITIONS'
    ELSE 'NO CONDITIONS'
  END as conditions
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'profiles';

-- =====================================================
-- STEP 2: DROP ALL EXISTING PROFILES POLICIES
-- =====================================================

-- Remove all existing policies that might be causing conflicts
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;

-- =====================================================
-- STEP 3: CREATE SIMPLE, WORKING POLICIES
-- =====================================================

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Simple policy: Users can view their own profile
CREATE POLICY "users_can_view_own_profile" ON profiles
  FOR SELECT 
  USING (id = auth.uid());

-- Simple policy: Users can update their own profile
CREATE POLICY "users_can_update_own_profile" ON profiles
  FOR UPDATE 
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Simple policy: Allow admins to view all profiles (check role after user can access their own)
CREATE POLICY "admins_can_view_all_profiles" ON profiles
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM profiles admin_check 
      WHERE admin_check.id = auth.uid() 
      AND admin_check.role = 'admin'
    )
    OR id = auth.uid()  -- This ensures user can always see their own profile
  );

-- =====================================================
-- STEP 4: TEST ACCESS
-- =====================================================

-- Test if the current user can now access their profile
SELECT 
  'Access Test' as test,
  'Current User Profile Access' as description,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ CAN ACCESS PROFILE'
    ELSE '❌ STILL CANNOT ACCESS'
  END as result
FROM profiles 
WHERE id = auth.uid();

-- Show current user's profile data if accessible
SELECT 
  'Profile Data Test' as test,
  id,
  first_name,
  last_name,
  role,
  '✅ PROFILE ACCESSIBLE' as status
FROM profiles 
WHERE id = auth.uid();

-- =====================================================
-- STEP 5: ALTERNATIVE - TEMPORARY DISABLE RLS
-- =====================================================

-- If the above policies still don't work, temporarily disable RLS
-- Uncomment the line below ONLY if the policies above don't work:

-- ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================

-- Final verification - this should work now
SELECT 
  'Final Test' as test_name,
  p.id,
  p.first_name,
  p.last_name,  
  p.role,
  au.email,
  'Dashboard should work now! 🎉' as status
FROM profiles p
JOIN auth.users au ON p.id = au.id
WHERE p.id = auth.uid();
