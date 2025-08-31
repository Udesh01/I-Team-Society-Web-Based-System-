-- Test Registration Setup - Quick Verification
-- Run this script to verify your registration system is properly configured

-- =====================================================
-- 1. QUICK HEALTH CHECK
-- =====================================================

SELECT 'REGISTRATION SYSTEM HEALTH CHECK' as header;

-- Check critical components
SELECT 
    'profiles table' as component,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') 
         THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
UNION ALL
SELECT 
    'student_details table' as component,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'student_details') 
         THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
UNION ALL
SELECT 
    'handle_new_user function' as component,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'handle_new_user') 
         THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
UNION ALL
SELECT 
    'on_auth_user_created trigger' as component,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created') 
         THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
UNION ALL
SELECT 
    'profiles RLS enabled' as component,
    CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'profiles' AND rowsecurity = true) 
         THEN '✅ ENABLED' ELSE '❌ DISABLED' END as status;

-- =====================================================
-- 2. CHECK ENUM TYPES
-- =====================================================

SELECT 'ENUM TYPES STATUS' as header;

SELECT 
    typname as enum_name,
    '✅ EXISTS: ' || string_agg(enumlabel, ', ' ORDER BY enumsortorder) as values
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE typname IN ('user_role', 'membership_status', 'membership_tier')
GROUP BY typname
ORDER BY typname;

-- =====================================================
-- 3. CHECK POLICIES
-- =====================================================

SELECT 'RLS POLICIES FOR PROFILES TABLE' as header;

SELECT 
    policyname as policy_name,
    cmd as operation,
    CASE 
        WHEN cmd = 'SELECT' THEN '👁️ READ'
        WHEN cmd = 'INSERT' THEN '➕ CREATE'
        WHEN cmd = 'UPDATE' THEN '✏️ UPDATE'
        WHEN cmd = 'DELETE' THEN '🗑️ DELETE'
        ELSE cmd
    END as operation_type
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'profiles'
ORDER BY cmd;

-- =====================================================
-- 4. TEST FUNCTION DEFINITION
-- =====================================================

SELECT 'REGISTRATION FUNCTION DEFINITION' as header;

SELECT 
    routine_name,
    routine_type,
    CASE 
        WHEN routine_definition IS NOT NULL THEN '✅ FUNCTION IS DEFINED'
        ELSE '❌ FUNCTION DEFINITION MISSING'
    END as status
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user' AND routine_schema = 'public';

-- =====================================================
-- 5. FINAL READINESS CHECK
-- =====================================================

SELECT 'SYSTEM READINESS SUMMARY' as header;

WITH readiness_check AS (
    SELECT 
        COUNT(*) as total_components,
        SUM(CASE 
            WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN 1 
            ELSE 0 END) +
        SUM(CASE 
            WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'student_details') THEN 1 
            ELSE 0 END) +
        SUM(CASE 
            WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'handle_new_user') THEN 1 
            ELSE 0 END) +
        SUM(CASE 
            WHEN EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created') THEN 1 
            ELSE 0 END) +
        SUM(CASE 
            WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'profiles' AND rowsecurity = true) THEN 1 
            ELSE 0 END) as ready_components
    FROM (SELECT 1) t
)
SELECT 
    CASE 
        WHEN ready_components = 5 THEN '🎉 SYSTEM READY - You can test user registration!'
        WHEN ready_components >= 3 THEN '⚠️ MOSTLY READY - Some components missing, but basic registration should work'
        ELSE '❌ NOT READY - Please run debug-registration-issue.sql first'
    END as readiness_status,
    ready_components || '/5 components ready' as details
FROM readiness_check;

-- =====================================================
-- 6. INSTRUCTIONS
-- =====================================================

SELECT 'NEXT STEPS' as header;

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles'
        ) AND EXISTS (
            SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created'
        ) AND EXISTS (
            SELECT 1 FROM pg_tables WHERE tablename = 'profiles' AND rowsecurity = true
        ) THEN 
            '✅ Ready to test! Try registering a new user in your application.'
        ELSE 
            '❌ Please run debug-registration-issue.sql to fix missing components first.'
    END as instruction;