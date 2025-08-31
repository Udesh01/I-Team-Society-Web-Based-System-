-- FIX ADMIN MEMBERSHIP ISSUE
-- This script specifically addresses the "admin role don't have membership" issue
-- Run this in Supabase SQL Editor

SELECT '🔧 FIXING ADMIN MEMBERSHIP ISSUE...' as status;

-- =====================================================
-- 1. CHECK CURRENT ADMIN USER STATUS
-- =====================================================

SELECT 'Step 1: Checking current admin user status...' as action;

-- Get the admin user ID (from previous conversation logs)
DO $$ 
DECLARE 
    admin_user_id UUID := 'cfe62211-cc94-4391-9678-962ccb341fdf';
BEGIN 
    RAISE NOTICE 'Checking admin user: %', admin_user_id;
END $$;

-- Check if admin user exists in auth and profiles
SELECT 
  'Admin User Status' as check_type,
  u.id,
  u.email,
  p.first_name,
  p.last_name,
  p.role,
  CASE 
    WHEN u.id IS NULL THEN '❌ NO AUTH USER FOUND'
    WHEN p.id IS NULL THEN '❌ NO PROFILE FOUND'
    WHEN p.role != 'admin' THEN '❌ WRONG ROLE: ' || p.role
    ELSE '✅ AUTH & PROFILE OK'
  END as user_status
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.id = 'cfe62211-cc94-4391-9678-962ccb341fdf';

-- Check current membership status
SELECT 
  'Current Membership Status' as check_type,
  m.user_id,
  m.status,
  m.tier,
  m.amount,
  m.start_date,
  m.end_date,
  CASE 
    WHEN m.user_id IS NULL THEN '❌ NO MEMBERSHIP RECORD'
    WHEN m.status != 'active' THEN '⚠️ MEMBERSHIP NOT ACTIVE: ' || m.status
    ELSE '✅ MEMBERSHIP ACTIVE'
  END as membership_status
FROM memberships m
WHERE m.user_id = 'cfe62211-cc94-4391-9678-962ccb341fdf';

-- =====================================================
-- 2. CREATE MISSING PROFILE IF NEEDED
-- =====================================================

SELECT 'Step 2: Ensuring admin profile exists...' as action;

-- Create admin profile if missing (idempotent)
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
  'admin'::user_role, -- Force admin role
  NOW(),
  NOW()
FROM auth.users au
WHERE au.id = 'cfe62211-cc94-4391-9678-962ccb341fdf'
ON CONFLICT (id) DO UPDATE SET
  role = 'admin'::user_role, -- Ensure role is admin
  updated_at = NOW();

-- =====================================================
-- 3. CREATE/FIX ADMIN MEMBERSHIP
-- =====================================================

SELECT 'Step 3: Creating/fixing admin membership...' as action;

-- First, delete any existing problematic membership
DELETE FROM memberships 
WHERE user_id = 'cfe62211-cc94-4391-9678-962ccb341fdf';

-- Now create fresh admin membership with correct details
INSERT INTO memberships (
  user_id,
  amount,
  tier,
  status,
  start_date,
  end_date,
  created_at,
  updated_at
) VALUES (
  'cfe62211-cc94-4391-9678-962ccb341fdf'::uuid,
  0, -- Admin membership is free
  'gold'::membership_tier,
  'active'::membership_status,
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '1 year', -- 1 year from today
  NOW(),
  NOW()
);

-- =====================================================
-- 4. VERIFY THE FIX
-- =====================================================

SELECT 'Step 4: Verifying the membership fix...' as action;

-- Check complete user status
SELECT 
  'FINAL ADMIN STATUS' as status_type,
  u.email,
  p.first_name || ' ' || p.last_name as full_name,
  p.role,
  m.status as membership_status,
  m.tier as membership_tier,
  m.amount as membership_amount,
  m.start_date,
  m.end_date,
  CASE 
    WHEN p.role = 'admin' AND m.status = 'active' AND m.tier = 'gold' THEN 
      '🎉 ADMIN MEMBERSHIP FIXED!'
    ELSE 
      '❌ STILL ISSUES - CHECK DETAILS ABOVE'
  END as fix_result
FROM auth.users u
JOIN profiles p ON u.id = p.id
LEFT JOIN memberships m ON u.id = m.user_id
WHERE u.id = 'cfe62211-cc94-4391-9678-962ccb341fdf';

-- =====================================================
-- 5. GENERATE E-ID FOR ADMIN (BONUS)
-- =====================================================

SELECT 'Step 5: Ensuring admin has E-ID...' as action;

-- Update membership with E-ID if missing
UPDATE memberships 
SET eid = 'ITS/' || EXTRACT(YEAR FROM CURRENT_DATE) || '/ADM/001'
WHERE user_id = 'cfe62211-cc94-4391-9678-962ccb341fdf'
  AND (eid IS NULL OR eid = '');

-- =====================================================
-- SUCCESS VERIFICATION
-- =====================================================

SELECT 'ADMIN MEMBERSHIP VERIFICATION' as final_check;

-- Show final membership details
SELECT 
  m.user_id,
  u.email,
  p.first_name || ' ' || p.last_name as admin_name,
  p.role,
  m.eid,
  m.tier,
  m.status,
  m.amount,
  m.start_date,
  m.end_date,
  '✅ ADMIN READY TO USE SYSTEM' as status
FROM memberships m
JOIN auth.users u ON m.user_id = u.id
JOIN profiles p ON m.user_id = p.id
WHERE m.user_id = 'cfe62211-cc94-4391-9678-962ccb341fdf';

-- =====================================================
-- FINAL INSTRUCTIONS
-- =====================================================

SELECT '🎉 ADMIN MEMBERSHIP FIX COMPLETE!' as result;
SELECT 'Admin user can now:' as capabilities;
SELECT '1. Login with ahamedsaja2016@gmail.com' as step_1;
SELECT '2. Access admin dashboard with full permissions' as step_2;
SELECT '3. See active Gold membership status' as step_3;
SELECT '4. Use all admin features without errors' as step_4;
SELECT 'Try logging in now - the membership issue should be resolved!' as next_action;