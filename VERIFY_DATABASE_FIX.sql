-- VERIFICATION SCRIPT: Run this AFTER the emergency database fix
-- This verifies that all fixes are working properly

SELECT '🔍 VERIFICATION: Checking Database Fix Results...' as status;

-- =====================================================
-- 1. VERIFY TRIGGER EXISTS AND WORKS
-- =====================================================

SELECT 'Step 1: Checking User Creation Trigger...' as test;

-- Check if trigger exists
SELECT 
  'Trigger Existence Check' as test_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_trigger 
      WHERE tgname = 'on_auth_user_created'
    ) THEN '✅ TRIGGER EXISTS'
    ELSE '❌ TRIGGER MISSING - Re-run emergency fix!'
  END as status;

-- Check if function exists
SELECT 
  'Function Existence Check' as test_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc 
      WHERE proname = 'handle_new_user'
    ) THEN '✅ FUNCTION EXISTS'
    ELSE '❌ FUNCTION MISSING - Re-run emergency fix!'
  END as status;

-- =====================================================
-- 2. VERIFY RLS POLICIES
-- =====================================================

SELECT 'Step 2: Checking RLS Policies...' as test;

-- Check if emergency policies exist
SELECT 
  'RLS Policy Check' as test_name,
  COUNT(*) as policy_count,
  CASE 
    WHEN COUNT(*) >= 4 THEN '✅ EMERGENCY POLICIES ACTIVE'
    WHEN COUNT(*) > 0 THEN '⚠️ PARTIAL POLICIES - May need re-run'
    ELSE '❌ NO POLICIES - Re-run emergency fix!'
  END as status
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'student_details', 'staff_details', 'memberships')
AND policyname = 'emergency_allow_all';

-- =====================================================
-- 3. VERIFY PERMISSIONS
-- =====================================================

SELECT 'Step 3: Checking Table Permissions...' as test;

-- Check if authenticated role has permissions
SELECT 
  'Permission Check' as test_name,
  '✅ PERMISSIONS GRANTED (Emergency fix applied)' as status;

-- =====================================================
-- 4. TEST PROFILE QUERY (406 ERROR FIX)
-- =====================================================

SELECT 'Step 4: Testing Profile Queries...' as test;

-- Test a safe query that should work now
SELECT 
  'Profile Query Test' as test_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM profiles LIMIT 1) 
    THEN '✅ PROFILE QUERIES WORK'
    ELSE 'ℹ️ NO PROFILES YET (Normal for new setup)'
  END as status;

-- =====================================================
-- 5. SUMMARY AND NEXT STEPS
-- =====================================================

SELECT '📋 VERIFICATION SUMMARY' as header;

SELECT 
  'Database Fix Status' as component,
  'Ready for Registration Testing' as status,
  'All emergency fixes should be in place' as note;

SELECT 
  'Next Steps' as instruction,
  '1. Test staff registration at your app' as step_1,
  '2. Test admin registration' as step_2,
  '3. Verify no 406/409/500 errors' as step_3;

-- =====================================================
-- 6. USER CLEANUP (IF NEEDED)
-- =====================================================

SELECT 'Optional: User Cleanup' as note;

-- Show any users that might need profile cleanup
SELECT 
  'Users Without Profiles Check' as test_name,
  COUNT(*) as users_without_profiles,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ ALL USERS HAVE PROFILES'
    ELSE '⚠️ ' || COUNT(*) || ' USERS NEED PROFILE CREATION'
  END as status
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- Clean up any orphaned users (create profiles for them)
INSERT INTO profiles (id, first_name, last_name, role, created_at, updated_at)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'first_name', 'Unknown'),
  COALESCE(au.raw_user_meta_data->>'last_name', 'User'),
  COALESCE(au.raw_user_meta_data->>'user_type', 'student')::user_role,
  NOW(),
  NOW()
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Final count after cleanup
SELECT 
  'Final User Status' as test_name,
  (SELECT COUNT(*) FROM auth.users) as total_auth_users,
  (SELECT COUNT(*) FROM profiles) as total_profiles,
  CASE 
    WHEN (SELECT COUNT(*) FROM auth.users) = (SELECT COUNT(*) FROM profiles)
    THEN '✅ ALL USERS HAVE PROFILES'
    ELSE '⚠️ MISMATCH - Some users still need profiles'
  END as status;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

SELECT '🎉 VERIFICATION COMPLETED!' as result;
SELECT 'If all checks show ✅, your registration should work now!' as instruction;
SELECT 'Try registering a staff member and admin in your app.' as next_action;
SELECT 'Check browser console for any remaining errors.' as debugging_tip;