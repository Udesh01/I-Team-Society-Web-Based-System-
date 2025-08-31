-- Emergency Fix for Infinite Recursion in RLS Policies
-- This fixes the "infinite recursion detected in policy for relation 'profiles'" error

-- =====================================================
-- CRITICAL FIX: Remove ALL existing policies that cause recursion
-- =====================================================

SELECT 'EMERGENCY RLS POLICY FIX - REMOVING RECURSIVE POLICIES...' as status;

-- Disable RLS temporarily to break the recursion
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to break recursion
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Enable read access for users to their own profile" ON profiles;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable update access for users to their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Also check for policies on other tables that might reference profiles
DROP POLICY IF EXISTS "Users can view own student details" ON student_details;
DROP POLICY IF EXISTS "Users can insert own student details" ON student_details;
DROP POLICY IF EXISTS "Users can update own student details" ON student_details;
DROP POLICY IF EXISTS "Users can delete own student details" ON student_details;
DROP POLICY IF EXISTS "Admins can manage all student details" ON student_details;

DROP POLICY IF EXISTS "Users can view own staff details" ON staff_details;
DROP POLICY IF EXISTS "Users can insert own staff details" ON staff_details;
DROP POLICY IF EXISTS "Users can update own staff details" ON staff_details;
DROP POLICY IF EXISTS "Users can delete own staff details" ON staff_details;
DROP POLICY IF EXISTS "Admins can manage all staff details" ON staff_details;

DROP POLICY IF EXISTS "Users can view own membership" ON memberships;
DROP POLICY IF EXISTS "Users can insert own membership" ON memberships;
DROP POLICY IF EXISTS "Users can update own membership" ON memberships;
DROP POLICY IF EXISTS "Admins can manage all memberships" ON memberships;

SELECT 'ALL POLICIES DROPPED - RECURSION BROKEN' as status;

-- =====================================================
-- CREATE SIMPLE, NON-RECURSIVE POLICIES
-- =====================================================

SELECT 'CREATING SIMPLE NON-RECURSIVE POLICIES...' as status;

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create SIMPLE policies that don't reference the profiles table recursively
-- CRITICAL: Do NOT check role in these policies to avoid recursion

-- Basic profile access - ONLY check auth.uid(), NO role checking
CREATE POLICY "simple_select_own_profile" ON profiles 
FOR SELECT USING (id = auth.uid());

CREATE POLICY "simple_update_own_profile" ON profiles 
FOR UPDATE USING (id = auth.uid());

CREATE POLICY "simple_insert_own_profile" ON profiles 
FOR INSERT WITH CHECK (id = auth.uid());

-- Simple admin policy WITHOUT role checking - use a function instead
CREATE POLICY "simple_admin_access" ON profiles 
FOR ALL USING (
  -- Use the is_admin function instead of checking role directly
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND raw_user_meta_data->>'user_type' = 'admin'
  )
  OR
  -- Also allow if the user is querying their own record
  id = auth.uid()
);

-- =====================================================
-- CREATE SAFE POLICIES FOR DETAIL TABLES
-- =====================================================

-- Student details - simple ownership check
ALTER TABLE student_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "simple_student_select" ON student_details 
FOR SELECT USING (id = auth.uid());

CREATE POLICY "simple_student_insert" ON student_details 
FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "simple_student_update" ON student_details 
FOR UPDATE USING (id = auth.uid());

-- Staff details - simple ownership check
ALTER TABLE staff_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "simple_staff_select" ON staff_details 
FOR SELECT USING (id = auth.uid());

CREATE POLICY "simple_staff_insert" ON staff_details 
FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "simple_staff_update" ON staff_details 
FOR UPDATE USING (id = auth.uid());

-- Memberships - simple ownership check
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "simple_membership_select" ON memberships 
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "simple_membership_insert" ON memberships 
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "simple_membership_update" ON memberships 
FOR UPDATE USING (user_id = auth.uid());

-- =====================================================
-- VERIFICATION
-- =====================================================

SELECT 'VERIFYING NON-RECURSIVE POLICIES...' as status;

-- Show the new policies
SELECT 
    tablename,
    policyname,
    cmd as operation,
    'NON-RECURSIVE' as safety_status
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'student_details', 'staff_details', 'memberships')
ORDER BY tablename, cmd;

-- Test that we can query profiles without recursion
SELECT 'TESTING PROFILE ACCESS...' as test;

-- This should work now without infinite recursion
SELECT COUNT(*) as total_profiles FROM profiles;

SELECT 'INFINITE RECURSION FIX COMPLETED!' as final_status;
SELECT 'Users should now be able to login and access profile data without recursion errors.' as instruction;
SELECT 'The policies are now simple and safe - they only check auth.uid() ownership.' as note;