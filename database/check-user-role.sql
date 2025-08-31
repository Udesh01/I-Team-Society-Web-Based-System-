-- Check User Role in Database
-- Replace the user ID with the one from your logs: 4e38f21c-6b38-4711-88e4-e4441556ce8a

-- =====================================================
-- 1. CHECK SPECIFIC USER ROLE
-- =====================================================

-- Check the specific user from your logs
SELECT 
  'User Role Check' as test_name,
  id,
  first_name,
  last_name,
  role,
  created_at,
  CASE 
    WHEN role IS NOT NULL THEN 'HAS ROLE ✅'
    ELSE 'NO ROLE ❌'
  END as role_status
FROM profiles 
WHERE id = '4e38f21c-6b38-4711-88e4-e4441556ce8a';

-- =====================================================
-- 2. CHECK ALL USERS WITH MISSING ROLES
-- =====================================================

-- Find users without roles
SELECT 
  'Users Without Roles' as test_name,
  COUNT(*) as users_without_roles,
  CASE 
    WHEN COUNT(*) = 0 THEN 'ALL USERS HAVE ROLES ✅'
    ELSE 'SOME USERS MISSING ROLES ❌'
  END as status
FROM profiles 
WHERE role IS NULL;

-- Show users without roles
SELECT
  'Users Missing Roles Details' as test_name,
  id,
  first_name,
  last_name,
  created_at,
  'NO ROLE' as issue
FROM profiles
WHERE role IS NULL
ORDER BY created_at DESC;

-- =====================================================
-- 3. CHECK AUTH USERS VS PROFILES
-- =====================================================

-- Check if auth user exists but profile is missing role
SELECT 
  'Auth vs Profile Check' as test_name,
  au.id,
  au.email,
  au.created_at as auth_created,
  p.first_name,
  p.last_name,
  p.role,
  p.created_at as profile_created,
  CASE 
    WHEN p.role IS NOT NULL THEN 'PROFILE HAS ROLE ✅'
    WHEN p.id IS NOT NULL THEN 'PROFILE EXISTS BUT NO ROLE ❌'
    ELSE 'NO PROFILE ❌'
  END as status
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE au.id = '4e38f21c-6b38-4711-88e4-e4441556ce8a';

-- =====================================================
-- 4. FIX MISSING ROLE (IF NEEDED)
-- =====================================================

-- If the user exists but has no role, set it to student
UPDATE profiles 
SET role = 'student'::user_role
WHERE id = '4e38f21c-6b38-4711-88e4-e4441556ce8a' 
  AND role IS NULL;

-- Verify the fix
SELECT 
  'Role Fix Verification' as test_name,
  id,
  first_name,
  last_name,
  role,
  CASE 
    WHEN role IS NOT NULL THEN 'ROLE FIXED ✅'
    ELSE 'STILL NO ROLE ❌'
  END as fix_status
FROM profiles 
WHERE id = '4e38f21c-6b38-4711-88e4-e4441556ce8a';

-- =====================================================
-- 5. SET ROLE FOR ALL USERS WITHOUT ROLES
-- =====================================================

-- Set default role for all users without roles
UPDATE profiles 
SET role = 'student'::user_role
WHERE role IS NULL;

-- Final verification
SELECT 
  'Final Role Check' as test_name,
  COUNT(*) as users_without_roles,
  CASE 
    WHEN COUNT(*) = 0 THEN 'ALL USERS NOW HAVE ROLES ✅'
    ELSE 'STILL HAVE USERS WITHOUT ROLES ❌'
  END as final_status
FROM profiles 
WHERE role IS NULL;
