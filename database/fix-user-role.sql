-- Fix Dashboard Issue for User: 4e38f21c-6b38-4711-88e4-e4441556ce8a
-- Run this in your Supabase SQL Editor

-- =====================================================
-- 1. DIAGNOSE THE PROBLEM
-- =====================================================

-- Check if user exists in auth.users
SELECT 
  'Auth User Check' as test,
  id, 
  email, 
  created_at,
  CASE WHEN id IS NOT NULL THEN '✅ EXISTS' ELSE '❌ NOT FOUND' END as status
FROM auth.users 
WHERE id = '4e38f21c-6b38-4711-88e4-e4441556ce8a';

-- Check if user exists in profiles table
SELECT 
  'Profile Check' as test,
  id, 
  first_name, 
  last_name, 
  role, 
  created_at,
  CASE 
    WHEN id IS NULL THEN '❌ NO PROFILE'
    WHEN role IS NULL THEN '⚠️ PROFILE EXISTS BUT NO ROLE'
    ELSE '✅ PROFILE AND ROLE EXIST'
  END as status
FROM profiles 
WHERE id = '4e38f21c-6b38-4711-88e4-e4441556ce8a';

-- =====================================================
-- 2. CREATE PROFILE IF MISSING
-- =====================================================

-- Insert profile if it doesn't exist (using auth.users email)
INSERT INTO profiles (id, first_name, last_name, role)
SELECT 
  u.id,
  COALESCE(SPLIT_PART(u.email, '@', 1), 'User') as first_name,
  'User' as last_name,
  'student'::user_role as role
FROM auth.users u
WHERE u.id = '4e38f21c-6b38-4711-88e4-e4441556ce8a'
  AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = u.id);

-- =====================================================
-- 3. SET ROLE IF MISSING
-- =====================================================

-- Update role to 'student' if it's NULL
UPDATE profiles 
SET role = 'student'::user_role
WHERE id = '4e38f21c-6b38-4711-88e4-e4441556ce8a' 
  AND role IS NULL;

-- =====================================================
-- 4. VERIFY THE FIX
-- =====================================================

-- Final check
SELECT 
  'Final Verification' as test,
  p.id, 
  p.first_name, 
  p.last_name, 
  p.role, 
  u.email,
  CASE 
    WHEN p.role IS NOT NULL THEN '✅ READY FOR DASHBOARD'
    ELSE '❌ STILL NEEDS FIXING'
  END as dashboard_status
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.id = '4e38f21c-6b38-4711-88e4-e4441556ce8a';

-- =====================================================
-- 5. TEMPORARILY DISABLE RLS IF NEEDED
-- =====================================================

-- If the above doesn't work, it might be RLS policies blocking access
-- Uncomment these lines to temporarily disable RLS:

-- ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Then re-enable with proper policies:
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 6. SHOW ALL USERS WITHOUT ROLES (BONUS)
-- =====================================================

-- Find and fix other users with missing roles
SELECT 
  'Users Without Roles' as info,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ ALL USERS HAVE ROLES'
    ELSE '⚠️ SOME USERS MISSING ROLES'
  END as status
FROM profiles 
WHERE role IS NULL;

-- Set default role for all users without roles
UPDATE profiles 
SET role = 'student'::user_role
WHERE role IS NULL;
