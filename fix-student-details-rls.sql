-- Fix RLS Policy for Student Details Registration
-- Run this script to fix the "new row violates row-level security policy for table 'student_details'" error

-- =====================================================
-- DIAGNOSE THE ISSUE
-- =====================================================

SELECT 'DIAGNOSING RLS POLICY ISSUE FOR STUDENT_DETAILS...' as status;

-- Check current policies on student_details
SELECT 'CURRENT POLICIES ON STUDENT_DETAILS:' as info;
SELECT 
    policyname,
    cmd as operation,
    qual as condition,
    with_check as check_condition
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'student_details';

-- Check if RLS is enabled
SELECT 'RLS STATUS:' as info;
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('student_details', 'staff_details');

-- =====================================================
-- FIX THE POLICIES
-- =====================================================

SELECT 'FIXING RLS POLICIES...' as status;

-- Ensure RLS is enabled
ALTER TABLE student_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_details ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh (safe approach)
DROP POLICY IF EXISTS "Users can manage own student details" ON student_details;
DROP POLICY IF EXISTS "Users can view own student details" ON student_details;
DROP POLICY IF EXISTS "Users can insert own student details" ON student_details;
DROP POLICY IF EXISTS "Users can update own student details" ON student_details;
DROP POLICY IF EXISTS "Users can delete own student details" ON student_details;
DROP POLICY IF EXISTS "Admins can manage all student details" ON student_details;

DROP POLICY IF EXISTS "Users can manage own staff details" ON staff_details;
DROP POLICY IF EXISTS "Users can view own staff details" ON staff_details;
DROP POLICY IF EXISTS "Users can insert own staff details" ON staff_details;
DROP POLICY IF EXISTS "Users can update own staff details" ON staff_details;
DROP POLICY IF EXISTS "Users can delete own staff details" ON staff_details;
DROP POLICY IF EXISTS "Admins can manage all staff details" ON staff_details;

-- =====================================================
-- CREATE PROPER POLICIES FOR STUDENT_DETAILS
-- =====================================================

-- Allow users to view their own student details
CREATE POLICY "Users can view own student details" ON student_details 
FOR SELECT USING (id = auth.uid());

-- Allow users to insert their own student details (CRITICAL FOR REGISTRATION!)
CREATE POLICY "Users can insert own student details" ON student_details 
FOR INSERT WITH CHECK (id = auth.uid());

-- Allow users to update their own student details
CREATE POLICY "Users can update own student details" ON student_details 
FOR UPDATE USING (id = auth.uid());

-- Allow users to delete their own student details
CREATE POLICY "Users can delete own student details" ON student_details 
FOR DELETE USING (id = auth.uid());

-- =====================================================
-- CREATE PROPER POLICIES FOR STAFF_DETAILS
-- =====================================================

-- Allow users to view their own staff details
CREATE POLICY "Users can view own staff details" ON staff_details 
FOR SELECT USING (id = auth.uid());

-- Allow users to insert their own staff details
CREATE POLICY "Users can insert own staff details" ON staff_details 
FOR INSERT WITH CHECK (id = auth.uid());

-- Allow users to update their own staff details
CREATE POLICY "Users can update own staff details" ON staff_details 
FOR UPDATE USING (id = auth.uid());

-- Allow users to delete their own staff details
CREATE POLICY "Users can delete own staff details" ON staff_details 
FOR DELETE USING (id = auth.uid());

-- =====================================================
-- ADMIN POLICIES (OPTIONAL BUT RECOMMENDED)
-- =====================================================

-- Allow admins to manage all student details
CREATE POLICY "Admins can manage all student details" ON student_details 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Allow admins to manage all staff details
CREATE POLICY "Admins can manage all staff details" ON staff_details 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- =====================================================
-- VERIFICATION
-- =====================================================

SELECT 'VERIFICATION - NEW POLICIES:' as status;

-- Show the new policies
SELECT 
    tablename,
    policyname,
    cmd as operation,
    CASE 
        WHEN cmd = 'SELECT' THEN '👁️ READ'
        WHEN cmd = 'INSERT' THEN '➕ CREATE'
        WHEN cmd = 'UPDATE' THEN '✏️ UPDATE'
        WHEN cmd = 'DELETE' THEN '🗑️ DELETE'
        WHEN cmd = 'ALL' THEN '🔧 ALL OPERATIONS'
        ELSE cmd
    END as operation_type
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('student_details', 'staff_details')
ORDER BY tablename, cmd;

-- Final status
SELECT 'RLS POLICY FIX COMPLETED!' as status;
SELECT 'You can now try registering a student again.' as instruction;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';