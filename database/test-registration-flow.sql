-- Test Registration Flow - Verify all data is saved correctly
-- Run this in Supabase SQL Editor to check if registration is working

-- =====================================================
-- 1. CHECK RECENT REGISTRATIONS (LAST 7 DAYS)
-- =====================================================

-- Check auth.users for recent registrations
SELECT 
  'Recent Auth Users' as test,
  id,
  email,
  email_confirmed_at,
  created_at,
  raw_user_meta_data->'user_type' as user_type,
  raw_user_meta_data->'first_name' as first_name,
  raw_user_meta_data->'last_name' as last_name
FROM auth.users
WHERE created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;

-- =====================================================
-- 2. CHECK PROFILES TABLE COMPLETENESS
-- =====================================================

-- Check if all recent users have complete profiles
SELECT 
  'Profile Completeness Check' as test,
  p.id,
  p.first_name,
  p.last_name,
  p.role,
  p.phone_number,
  p.address,
  p.photo_url,
  p.created_at,
  CASE 
    WHEN p.role IS NOT NULL AND p.first_name IS NOT NULL THEN '✅ COMPLETE'
    WHEN p.role IS NULL THEN '❌ MISSING ROLE'
    WHEN p.first_name IS NULL THEN '❌ MISSING NAME'
    ELSE '⚠️ INCOMPLETE'
  END as profile_status
FROM profiles p
WHERE p.created_at > NOW() - INTERVAL '7 days'
ORDER BY p.created_at DESC;

-- =====================================================
-- 3. CHECK STUDENT DETAILS
-- =====================================================

-- Check student-specific data
SELECT 
  'Student Details Check' as test,
  sd.id,
  p.first_name || ' ' || p.last_name as full_name,
  p.role,
  sd.student_id,
  sd.degree,
  sd.level,
  sd.faculty,
  sd.department,
  CASE 
    WHEN sd.student_id IS NOT NULL AND sd.degree IS NOT NULL THEN '✅ COMPLETE'
    ELSE '❌ INCOMPLETE'
  END as student_status
FROM student_details sd
JOIN profiles p ON sd.id = p.id
WHERE p.created_at > NOW() - INTERVAL '7 days'
ORDER BY p.created_at DESC;

-- =====================================================
-- 4. CHECK STAFF DETAILS
-- =====================================================

-- Check staff-specific data
SELECT 
  'Staff Details Check' as test,
  sd.id,
  p.first_name || ' ' || p.last_name as full_name,
  p.role,
  sd.staff_id,
  sd.position,
  sd.department,
  CASE 
    WHEN sd.staff_id IS NOT NULL AND sd.position IS NOT NULL THEN '✅ COMPLETE'
    ELSE '❌ INCOMPLETE'
  END as staff_status
FROM staff_details sd
JOIN profiles p ON sd.id = p.id
WHERE p.created_at > NOW() - INTERVAL '7 days'
ORDER BY p.created_at DESC;

-- =====================================================
-- 5. CHECK MEMBERSHIP RECORDS
-- =====================================================

-- Check membership creation and status
SELECT 
  'Membership Records Check' as test,
  m.id as membership_id,
  p.first_name || ' ' || p.last_name as full_name,
  p.role,
  m.tier,
  m.amount,
  m.status,
  m.start_date,
  m.end_date,
  m.created_at,
  CASE 
    WHEN m.tier IS NOT NULL AND m.amount IS NOT NULL THEN '✅ MEMBERSHIP CREATED'
    ELSE '❌ MEMBERSHIP INCOMPLETE'
  END as membership_status
FROM memberships m
JOIN profiles p ON m.user_id = p.id
WHERE m.created_at > NOW() - INTERVAL '7 days'
ORDER BY m.created_at DESC;

-- =====================================================
-- 6. ROLE DISTRIBUTION ANALYSIS
-- =====================================================

-- Count users by role (recent registrations)
SELECT 
  'Role Distribution (Last 7 Days)' as test,
  role,
  COUNT(*) as count,
  ARRAY_AGG(first_name || ' ' || last_name ORDER BY created_at DESC) as users
FROM profiles
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY role
ORDER BY count DESC;

-- =====================================================
-- 7. MEMBERSHIP TIER DISTRIBUTION
-- =====================================================

-- Count memberships by tier and status
SELECT 
  'Membership Distribution' as test,
  tier,
  status,
  COUNT(*) as count,
  AVG(amount) as avg_amount
FROM memberships
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY tier, status
ORDER BY tier, status;

-- =====================================================
-- 8. AUTHENTICATION READINESS CHECK
-- =====================================================

-- Check if users are ready for login (complete profile + role)
SELECT 
  'Login Readiness Check' as test,
  au.email,
  p.first_name || ' ' || p.last_name as full_name,
  p.role,
  au.email_confirmed_at,
  m.status as membership_status,
  CASE 
    WHEN p.role IS NOT NULL AND au.email_confirmed_at IS NOT NULL THEN '✅ READY TO LOGIN'
    WHEN p.role IS NULL THEN '❌ NO ROLE - WILL FAIL'
    WHEN au.email_confirmed_at IS NULL THEN '⚠️ EMAIL NOT CONFIRMED'
    ELSE '⚠️ NEEDS VERIFICATION'
  END as login_status
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
LEFT JOIN memberships m ON au.id = m.user_id
WHERE au.created_at > NOW() - INTERVAL '7 days'
ORDER BY au.created_at DESC;

-- =====================================================
-- 9. DATA INTEGRITY CHECK
-- =====================================================

-- Find users with missing data
SELECT 
  'Data Integrity Issues' as test,
  'Missing Profiles' as issue_type,
  COUNT(*) as count
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE au.created_at > NOW() - INTERVAL '7 days'
  AND p.id IS NULL

UNION ALL

SELECT 
  'Data Integrity Issues' as test,
  'Profiles Without Roles' as issue_type,
  COUNT(*) as count
FROM profiles
WHERE created_at > NOW() - INTERVAL '7 days'
  AND role IS NULL

UNION ALL

SELECT 
  'Data Integrity Issues' as test,
  'Students Without Details' as issue_type,
  COUNT(*) as count
FROM profiles p
LEFT JOIN student_details sd ON p.id = sd.id
WHERE p.created_at > NOW() - INTERVAL '7 days'
  AND p.role = 'student'
  AND sd.id IS NULL

UNION ALL

SELECT 
  'Data Integrity Issues' as test,
  'Staff Without Details' as issue_type,
  COUNT(*) as count
FROM profiles p
LEFT JOIN staff_details sd ON p.id = sd.id
WHERE p.created_at > NOW() - INTERVAL '7 days'
  AND p.role IN ('staff', 'admin')
  AND sd.id IS NULL

UNION ALL

SELECT 
  'Data Integrity Issues' as test,
  'Users Without Memberships' as issue_type,
  COUNT(*) as count
FROM profiles p
LEFT JOIN memberships m ON p.id = m.user_id
WHERE p.created_at > NOW() - INTERVAL '7 days'
  AND m.id IS NULL;

-- =====================================================
-- 10. DASHBOARD REDIRECT TEST
-- =====================================================

-- Simulate the dashboard redirect logic
SELECT 
  'Dashboard Redirect Test' as test,
  p.id,
  p.first_name || ' ' || p.last_name as full_name,
  p.role,
  CASE 
    WHEN p.role = 'admin' THEN 'Would redirect to: /dashboard/admin/modern'
    WHEN p.role = 'staff' THEN 'Would redirect to: /dashboard/modern-staff'
    WHEN p.role = 'student' THEN 'Would redirect to: /dashboard/modern-student'
    ELSE 'Would redirect to: /dashboard (fallback)'
  END as expected_redirect
FROM profiles p
WHERE p.created_at > NOW() - INTERVAL '7 days'
ORDER BY p.created_at DESC;

-- =====================================================
-- SUMMARY REPORT
-- =====================================================

SELECT 
  '📊 REGISTRATION SUMMARY' as section,
  'Last 7 Days Registration Report' as description

UNION ALL

SELECT 
  '👥 Total Registrations:',
  COUNT(*)::text || ' users'
FROM profiles
WHERE created_at > NOW() - INTERVAL '7 days'

UNION ALL

SELECT 
  '✅ Complete Profiles:',
  COUNT(*)::text || ' users'
FROM profiles
WHERE created_at > NOW() - INTERVAL '7 days'
  AND role IS NOT NULL
  AND first_name IS NOT NULL

UNION ALL

SELECT 
  '📧 Email Confirmed:',
  COUNT(*)::text || ' users'
FROM auth.users
WHERE created_at > NOW() - INTERVAL '7 days'
  AND email_confirmed_at IS NOT NULL

UNION ALL

SELECT 
  '💳 Memberships Created:',
  COUNT(*)::text || ' memberships'
FROM memberships
WHERE created_at > NOW() - INTERVAL '7 days'

UNION ALL

SELECT 
  '🔑 Ready for Login:',
  COUNT(*)::text || ' users'
FROM auth.users au
JOIN profiles p ON au.id = p.id
WHERE au.created_at > NOW() - INTERVAL '7 days'
  AND p.role IS NOT NULL
  AND au.email_confirmed_at IS NOT NULL;
