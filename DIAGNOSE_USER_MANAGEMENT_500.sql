-- DIAGNOSE USER MANAGEMENT 500 ERROR
-- This script identifies issues with table relationships causing 500 errors
-- Run this in Supabase SQL Editor

SELECT '🔍 DIAGNOSING USER MANAGEMENT 500 ERROR...' as status;

-- =====================================================
-- STEP 1: CHECK TABLE EXISTENCE
-- =====================================================

SELECT 'Step 1: Checking if required tables exist...' as action;

-- Check if tables exist
SELECT 
  'Table Existence Check' as check_type,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') 
    THEN '✅ profiles table exists' 
    ELSE '❌ profiles table missing' 
  END as profiles_status,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'student_details' AND table_schema = 'public') 
    THEN '✅ student_details table exists' 
    ELSE '❌ student_details table missing' 
  END as student_details_status,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'staff_details' AND table_schema = 'public') 
    THEN '✅ staff_details table exists' 
    ELSE '❌ staff_details table missing' 
  END as staff_details_status,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'memberships' AND table_schema = 'public') 
    THEN '✅ memberships table exists' 
    ELSE '❌ memberships table missing' 
  END as memberships_status;

-- =====================================================
-- STEP 2: CHECK FOREIGN KEY RELATIONSHIPS
-- =====================================================

SELECT 'Step 2: Checking foreign key relationships...' as action;

-- Check foreign key constraints
SELECT 
  'Foreign Key Constraints' as constraint_type,
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name IN ('student_details', 'staff_details', 'memberships')
  AND tc.table_schema = 'public';

-- =====================================================
-- STEP 3: CHECK PROFILES TABLE STRUCTURE
-- =====================================================

SELECT 'Step 3: Checking profiles table structure...' as action;

-- Check profiles table columns
SELECT 
  'Profiles Table Structure' as table_info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- =====================================================
-- STEP 4: CHECK RELATED TABLES STRUCTURE
-- =====================================================

SELECT 'Step 4: Checking related tables structure...' as action;

-- Check student_details table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'student_details' AND table_schema = 'public') THEN
    RAISE NOTICE 'student_details table exists - checking structure...';
  ELSE
    RAISE NOTICE 'student_details table does not exist';
  END IF;
END $$;

-- Show student_details columns if table exists
SELECT 
  'Student Details Table Structure' as table_info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'student_details' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check staff_details table if it exists
SELECT 
  'Staff Details Table Structure' as table_info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'staff_details' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- =====================================================
-- STEP 5: CHECK RLS POLICIES ON RELATED TABLES
-- =====================================================

SELECT 'Step 5: Checking RLS policies...' as action;

-- Check RLS status on all tables
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  CASE WHEN rowsecurity THEN '✅ RLS ENABLED' ELSE '❌ RLS DISABLED' END as rls_status
FROM pg_tables 
WHERE tablename IN ('profiles', 'student_details', 'staff_details', 'memberships')
  AND schemaname = 'public';

-- List policies on each table
SELECT 
  'Profiles Table Policies' as policy_category,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'profiles' AND schemaname = 'public';

-- Check policies on related tables
SELECT 
  'Related Tables Policies' as policy_category,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename IN ('student_details', 'staff_details', 'memberships') 
  AND schemaname = 'public';

-- =====================================================
-- STEP 6: TEST SIMPLE PROFILE QUERY
-- =====================================================

SELECT 'Step 6: Testing simple profile queries...' as action;

-- Test basic profiles query
SELECT 
  'Basic Profiles Query Test' as test_type,
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count,
  COUNT(CASE WHEN role = 'staff' THEN 1 END) as staff_count,
  COUNT(CASE WHEN role = 'student' THEN 1 END) as student_count
FROM profiles;

-- =====================================================
-- STEP 7: TEST INDIVIDUAL JOIN QUERIES
-- =====================================================

SELECT 'Step 7: Testing individual join queries...' as action;

-- Test profiles with student_details join (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'student_details' AND table_schema = 'public') THEN
    PERFORM (SELECT COUNT(*) FROM profiles p LEFT JOIN student_details sd ON p.id = sd.id);
    RAISE NOTICE 'Profiles-StudentDetails join test passed';
  ELSE
    RAISE NOTICE 'student_details table missing - cannot test join';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Profiles-StudentDetails join test FAILED: %', SQLERRM;
END $$;

-- Test profiles with staff_details join (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'staff_details' AND table_schema = 'public') THEN
    PERFORM (SELECT COUNT(*) FROM profiles p LEFT JOIN staff_details sd ON p.id = sd.id);
    RAISE NOTICE 'Profiles-StaffDetails join test passed';
  ELSE
    RAISE NOTICE 'staff_details table missing - cannot test join';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Profiles-StaffDetails join test FAILED: %', SQLERRM;
END $$;

-- Test profiles with memberships join
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'memberships' AND table_schema = 'public') THEN
    PERFORM (SELECT COUNT(*) FROM profiles p LEFT JOIN memberships m ON p.id = m.user_id);
    RAISE NOTICE 'Profiles-Memberships join test passed';
  ELSE
    RAISE NOTICE 'memberships table missing - cannot test join';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Profiles-Memberships join test FAILED: %', SQLERRM;
END $$;

-- =====================================================
-- STEP 8: RECOMMENDATIONS
-- =====================================================

SELECT 'Step 8: Providing recommendations...' as action;

SELECT '📋 DIAGNOSIS COMPLETE' as result;
SELECT 'Check the results above to identify the root cause:' as instructions;
SELECT '1. Missing tables (student_details, staff_details) may need to be created' as recommendation_1;
SELECT '2. Foreign key constraints may be incorrectly configured' as recommendation_2;
SELECT '3. RLS policies may be blocking access to related tables' as recommendation_3;
SELECT '4. Column mismatches in join relationships' as recommendation_4;

SELECT '🔧 NEXT STEPS:' as next_steps;
SELECT '1. Review table existence results above' as step_1;
SELECT '2. Check if missing tables need to be created or query needs to be simplified' as step_2;
SELECT '3. Verify RLS policies allow proper joins' as step_3;
SELECT '4. Update UserManagement component to handle missing tables gracefully' as step_4;