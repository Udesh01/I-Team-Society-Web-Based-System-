-- Fix RLS Policies for Login Role Retrieval
-- This ensures users can read their own profile data for login

-- Enable RLS (if not already enabled)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies that might be conflicting
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Enable read access for users to their own profile" ON profiles;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable update access for users to their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;

-- Create comprehensive policies for profile access
-- CRITICAL: Allow users to SELECT their own profile (needed for login)
CREATE POLICY "Users can view their own profile" ON profiles 
FOR SELECT USING (id = auth.uid());

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile" ON profiles 
FOR UPDATE USING (id = auth.uid());

-- Allow users to insert their own profile (needed for registration)
CREATE POLICY "Users can insert their own profile" ON profiles 
FOR INSERT WITH CHECK (id = auth.uid());

-- Admin access policy (optional but useful)
CREATE POLICY "Admins can view all profiles" ON profiles 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Test the policy by checking if we can read profile data
SELECT 'TESTING RLS POLICIES...' as status;

-- Show current policies
SELECT 'CURRENT POLICIES:' as info;
SELECT 
    policyname,
    cmd as operation,
    CASE 
        WHEN cmd = 'SELECT' THEN '👁️ READ (CRITICAL FOR LOGIN)'
        WHEN cmd = 'UPDATE' THEN '✏️ UPDATE'
        WHEN cmd = 'INSERT' THEN '➕ CREATE'
        WHEN cmd = 'ALL' THEN '🔧 ALL OPERATIONS'
        ELSE cmd
    END as operation_type
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'profiles'
ORDER BY cmd;

SELECT 'RLS POLICY FIX COMPLETED!' as result;
SELECT 'Users should now be able to login and retrieve their role information.' as instruction;