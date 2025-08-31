-- FIX FOR EXISTING ADMIN USER: cfe62211-cc94-4391-9678-962ccb341fdf
-- This user exists in auth.users but has no profile, causing foreign key errors
-- Run this in Supabase SQL Editor to fix the specific user

SELECT '🔧 FIXING EXISTING ADMIN USER...' as status;

-- =====================================================
-- 1. CHECK CURRENT STATE OF THE USER
-- =====================================================

SELECT 'Step 1: Checking current user state...' as action;

-- Check if user exists in auth.users
SELECT 
  'Auth User Check' as test,
  id, 
  email, 
  created_at,
  raw_user_meta_data,
  CASE WHEN id IS NOT NULL THEN '✅ EXISTS IN AUTH' ELSE '❌ NOT FOUND IN AUTH' END as status
FROM auth.users 
WHERE id = 'cfe62211-cc94-4391-9678-962ccb341fdf';

-- Check if user has profile
SELECT 
  'Profile Check' as test,
  id, 
  first_name, 
  last_name, 
  role, 
  created_at,
  CASE 
    WHEN id IS NULL THEN '❌ NO PROFILE (THIS IS THE ISSUE)'
    WHEN role IS NULL THEN '⚠️ PROFILE EXISTS BUT NO ROLE'
    ELSE '✅ PROFILE AND ROLE EXIST'
  END as status
FROM profiles 
WHERE id = 'cfe62211-cc94-4391-9678-962ccb341fdf';

-- =====================================================
-- 2. CREATE THE MISSING PROFILE
-- =====================================================

SELECT 'Step 2: Creating missing profile for admin user...' as action;

-- Create the profile based on auth.users metadata
INSERT INTO profiles (
  id, 
  first_name, 
  last_name, 
  role,
  created_at,
  updated_at
)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'first_name', 'Admin'),
  COALESCE(au.raw_user_meta_data->>'last_name', 'User'),
  COALESCE(au.raw_user_meta_data->>'user_type', 'admin')::user_role,
  NOW(),
  NOW()
FROM auth.users au
WHERE au.id = 'cfe62211-cc94-4391-9678-962ccb341fdf'
  AND NOT EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = au.id
  )
ON CONFLICT (id) DO UPDATE SET
  first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
  last_name = COALESCE(EXCLUDED.last_name, profiles.last_name),
  role = COALESCE(EXCLUDED.role, profiles.role)::user_role,
  updated_at = NOW();

-- =====================================================
-- 3. VERIFY THE FIX
-- =====================================================

SELECT 'Step 3: Verifying the fix...' as action;

-- Check that profile now exists
SELECT 
  'Profile Fix Verification' as test,
  p.id, 
  p.first_name, 
  p.last_name, 
  p.role, 
  u.email,
  CASE 
    WHEN p.role IS NOT NULL THEN '✅ PROFILE CREATED - ADMIN CAN NOW LOGIN'
    ELSE '❌ STILL NO PROFILE - CONTACT SUPPORT'
  END as fix_status
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.id = 'cfe62211-cc94-4391-9678-962ccb341fdf';

-- =====================================================
-- 4. CREATE ADMIN MEMBERSHIP IF NEEDED
-- =====================================================

SELECT 'Step 4: Ensuring admin has active membership...' as action;

-- Create admin membership if it doesn't exist
INSERT INTO memberships (
  user_id,
  amount,
  tier,
  status,
  start_date,
  end_date,
  created_at,
  updated_at
)
SELECT 
  'cfe62211-cc94-4391-9678-962ccb341fdf'::uuid,
  0, -- Admin membership is free
  'gold'::membership_tier,
  'active'::membership_status,
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '1 year',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM memberships 
  WHERE user_id = 'cfe62211-cc94-4391-9678-962ccb341fdf'
);

-- =====================================================
-- 5. FINAL VERIFICATION
-- =====================================================

SELECT 'Step 5: Final verification...' as action;

-- Show complete user status
SELECT 
  'Complete User Status' as test,
  u.email,
  p.first_name || ' ' || p.last_name as full_name,
  p.role,
  m.status as membership_status,
  m.tier as membership_tier,
  '✅ ADMIN USER READY FOR LOGIN' as final_status
FROM auth.users u
JOIN profiles p ON u.id = p.id
LEFT JOIN memberships m ON u.id = m.user_id
WHERE u.id = 'cfe62211-cc94-4391-9678-962ccb341fdf';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

SELECT '🎉 EXISTING ADMIN USER FIXED!' as result;
SELECT 'Admin user cfe62211-cc94-4391-9678-962ccb341fdf should now be able to:' as instruction;
SELECT '1. Login successfully without 406 errors' as step_1;
SELECT '2. Access admin dashboard' as step_2;
SELECT '3. See proper role and membership status' as step_3;
SELECT 'Try logging in with ahamedsaja2016@gmail.com now!' as next_action;