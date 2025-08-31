-- Fix Permission Denied Errors for RLS Policies
-- This fixes the "permission denied for table users" error (42501)

-- =====================================================
-- DIAGNOSE THE ISSUE
-- =====================================================

SELECT 'DIAGNOSING PERMISSION DENIED ISSUE...' as status;

-- Check current user context
SELECT 'CURRENT AUTH CONTEXT:' as info;
SELECT 
    COALESCE(auth.uid()::text, 'NO AUTH SESSION') as current_user_id,
    COALESCE(auth.jwt() ->> 'aud', 'NO AUDIENCE') as audience,
    COALESCE(auth.jwt() ->> 'role', 'NO ROLE') as jwt_role;

-- Check existing policies
SELECT 'CURRENT POLICIES ON PROFILES:' as info;
SELECT 
    policyname,
    cmd as operation,
    CASE 
        WHEN cmd = 'SELECT' THEN '👁️ READ'
        WHEN cmd = 'INSERT' THEN '➕ CREATE'
        WHEN cmd = 'UPDATE' THEN '✏️ UPDATE'
        WHEN cmd = 'ALL' THEN '🔧 ALL OPERATIONS'
        ELSE cmd
    END as operation_type
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'profiles'
ORDER BY cmd;

-- =====================================================
-- FIX THE PERMISSION ISSUES
-- =====================================================

SELECT 'FIXING PERMISSION DENIED ERRORS...' as status;

-- Temporarily disable RLS to clear all policies
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "simple_select_own_profile" ON profiles;
DROP POLICY IF EXISTS "simple_update_own_profile" ON profiles;
DROP POLICY IF EXISTS "simple_insert_own_profile" ON profiles;
DROP POLICY IF EXISTS "simple_admin_access" ON profiles;

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CREATE PROPER NON-RECURSIVE POLICIES
-- =====================================================

SELECT 'CREATING PROPER NON-RECURSIVE POLICIES...' as status;

-- CRITICAL: Allow authenticated users to read their own profile
-- This is essential for login and role retrieval
CREATE POLICY "authenticated_users_select_own_profile" ON profiles 
FOR SELECT TO authenticated 
USING (id = auth.uid());

-- Allow authenticated users to insert their own profile (registration)
CREATE POLICY "authenticated_users_insert_own_profile" ON profiles 
FOR INSERT TO authenticated 
WITH CHECK (id = auth.uid());

-- Allow authenticated users to update their own profile
CREATE POLICY "authenticated_users_update_own_profile" ON profiles 
FOR UPDATE TO authenticated 
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Allow service role full access (for admin operations)
CREATE POLICY "service_role_full_access" ON profiles 
FOR ALL TO service_role 
USING (true);

-- =====================================================
-- ALSO FIX OTHER TABLES THAT MIGHT HAVE ISSUES
-- =====================================================

SELECT 'FIXING POLICIES FOR DETAIL TABLES...' as status;

-- Student details
ALTER TABLE student_details DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "simple_student_select" ON student_details;
DROP POLICY IF EXISTS "simple_student_insert" ON student_details;
DROP POLICY IF EXISTS "simple_student_update" ON student_details;
ALTER TABLE student_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_users_student_select" ON student_details 
FOR SELECT TO authenticated 
USING (id = auth.uid());

CREATE POLICY "authenticated_users_student_insert" ON student_details 
FOR INSERT TO authenticated 
WITH CHECK (id = auth.uid());

CREATE POLICY "authenticated_users_student_update" ON student_details 
FOR UPDATE TO authenticated 
USING (id = auth.uid());

-- Staff details
ALTER TABLE staff_details DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "simple_staff_select" ON staff_details;
DROP POLICY IF EXISTS "simple_staff_insert" ON staff_details;
DROP POLICY IF EXISTS "simple_staff_update" ON staff_details;
ALTER TABLE staff_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_users_staff_select" ON staff_details 
FOR SELECT TO authenticated 
USING (id = auth.uid());

CREATE POLICY "authenticated_users_staff_insert" ON staff_details 
FOR INSERT TO authenticated 
WITH CHECK (id = auth.uid());

CREATE POLICY "authenticated_users_staff_update" ON staff_details 
FOR UPDATE TO authenticated 
USING (id = auth.uid());

-- Memberships
ALTER TABLE memberships DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "simple_membership_select" ON memberships;
DROP POLICY IF EXISTS "simple_membership_insert" ON memberships;
DROP POLICY IF EXISTS "simple_membership_update" ON memberships;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_users_membership_select" ON memberships 
FOR SELECT TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "authenticated_users_membership_insert" ON memberships 
FOR INSERT TO authenticated 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "authenticated_users_membership_update" ON memberships 
FOR UPDATE TO authenticated 
USING (user_id = auth.uid());

-- =====================================================
-- ENSURE PROPER GRANTS FOR AUTHENTICATED ROLE
-- =====================================================

SELECT 'ENSURING PROPER ROLE GRANTS...' as status;

-- Grant necessary permissions to authenticated role
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON student_details TO authenticated;
GRANT SELECT, INSERT, UPDATE ON staff_details TO authenticated;
GRANT SELECT, INSERT, UPDATE ON memberships TO authenticated;

-- Grant for notifications table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
        GRANT SELECT, INSERT, UPDATE ON notifications TO authenticated;
        
        -- Create basic policy for notifications if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE schemaname = 'public' 
            AND tablename = 'notifications' 
            AND policyname = 'authenticated_users_notifications'
        ) THEN
            ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
            CREATE POLICY "authenticated_users_notifications" ON notifications 
            FOR ALL TO authenticated 
            USING (user_id = auth.uid())
            WITH CHECK (user_id = auth.uid());
        END IF;
    END IF;
END $$;

-- =====================================================
-- VERIFICATION AND TESTING
-- =====================================================

SELECT 'VERIFICATION...' as status;

-- Show the new policies
SELECT 
    tablename,
    policyname,
    cmd as operation,
    roles,
    'AUTHENTICATED ROLE SPECIFIC' as policy_type
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'student_details', 'staff_details', 'memberships', 'notifications')
ORDER BY tablename, cmd;

-- Test basic profile access
SELECT 'TESTING PROFILE ACCESS...' as test;

-- This should show profiles count without permission errors
SELECT COUNT(*) as total_profiles FROM profiles;

-- Final status
SELECT 'PERMISSION DENIED FIX COMPLETED!' as final_status;
SELECT 'Users should now be able to login and access their profile data without permission errors.' as instruction;
SELECT 'All policies now explicitly target the "authenticated" role with proper grants.' as note;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';