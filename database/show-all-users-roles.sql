-- Show All Users and Their Roles
-- Run this in Supabase SQL Editor to see all users

-- =====================================================
-- 1. SIMPLE USER LIST WITH ROLES
-- =====================================================

-- Basic user list with roles
SELECT 
  'All Users List' as query_type,
  id,
  first_name,
  last_name,
  role,
  created_at
FROM profiles 
ORDER BY created_at DESC;

-- =====================================================
-- 2. DETAILED USER LIST WITH EMAILS
-- =====================================================

-- Users with email addresses from auth table
SELECT 
  'Users with Email' as query_type,
  p.id,
  p.first_name,
  p.last_name,
  p.role,
  au.email,
  p.created_at as profile_created,
  au.created_at as auth_created,
  CASE 
    WHEN p.role IS NOT NULL THEN '✅ HAS ROLE'
    ELSE '❌ NO ROLE'
  END as role_status
FROM profiles p
LEFT JOIN auth.users au ON p.id = au.id
ORDER BY p.created_at DESC;

-- =====================================================
-- 3. ROLE DISTRIBUTION SUMMARY
-- =====================================================

-- Count users by role
SELECT 
  'Role Distribution' as query_type,
  role,
  COUNT(*) as user_count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM profiles WHERE role IS NOT NULL), 2) as percentage
FROM profiles 
WHERE role IS NOT NULL
GROUP BY role
ORDER BY user_count DESC;

-- =====================================================
-- 4. ADMIN USERS ONLY
-- =====================================================

-- Show only admin users
SELECT 
  'Admin Users Only' as query_type,
  p.id,
  p.first_name,
  p.last_name,
  au.email,
  p.created_at
FROM profiles p
LEFT JOIN auth.users au ON p.id = au.id
WHERE p.role = 'admin'
ORDER BY p.created_at DESC;

-- =====================================================
-- 5. STAFF USERS ONLY
-- =====================================================

-- Show only staff users
SELECT 
  'Staff Users Only' as query_type,
  p.id,
  p.first_name,
  p.last_name,
  au.email,
  p.created_at
FROM profiles p
LEFT JOIN auth.users au ON p.id = au.id
WHERE p.role = 'staff'
ORDER BY p.created_at DESC;

-- =====================================================
-- 6. STUDENT USERS ONLY
-- =====================================================

-- Show only student users
SELECT 
  'Student Users Only' as query_type,
  p.id,
  p.first_name,
  p.last_name,
  au.email,
  p.created_at
FROM profiles p
LEFT JOIN auth.users au ON p.id = au.id
WHERE p.role = 'student'
ORDER BY p.created_at DESC
LIMIT 10; -- Limit to first 10 students

-- =====================================================
-- 7. USERS WITH MEMBERSHIPS
-- =====================================================

-- Show users with their membership status
SELECT 
  'Users with Memberships' as query_type,
  p.id,
  p.first_name,
  p.last_name,
  p.role,
  m.tier as membership_tier,
  m.status as membership_status,
  m.start_date,
  m.end_date
FROM profiles p
LEFT JOIN memberships m ON p.id = m.user_id
WHERE m.id IS NOT NULL
ORDER BY m.created_at DESC;

-- =====================================================
-- 8. RECENT REGISTRATIONS (LAST 30 DAYS)
-- =====================================================

-- Show users who registered in the last 30 days
SELECT 
  'Recent Registrations' as query_type,
  p.id,
  p.first_name,
  p.last_name,
  p.role,
  au.email,
  p.created_at,
  EXTRACT(DAY FROM NOW() - p.created_at) as days_ago
FROM profiles p
LEFT JOIN auth.users au ON p.id = au.id
WHERE p.created_at > NOW() - INTERVAL '30 days'
ORDER BY p.created_at DESC;

-- =====================================================
-- 9. SUMMARY STATISTICS
-- =====================================================

-- Overall statistics
SELECT 
  'Summary Statistics' as query_type,
  'Total Users' as metric,
  COUNT(*) as value
FROM profiles

UNION ALL

SELECT 
  'Summary Statistics' as query_type,
  'Users with Roles' as metric,
  COUNT(*) as value
FROM profiles 
WHERE role IS NOT NULL

UNION ALL

SELECT 
  'Summary Statistics' as query_type,
  'Admin Users' as metric,
  COUNT(*) as value
FROM profiles 
WHERE role = 'admin'

UNION ALL

SELECT 
  'Summary Statistics' as query_type,
  'Staff Users' as metric,
  COUNT(*) as value
FROM profiles 
WHERE role = 'staff'

UNION ALL

SELECT 
  'Summary Statistics' as query_type,
  'Student Users' as metric,
  COUNT(*) as value
FROM profiles 
WHERE role = 'student'

UNION ALL

SELECT 
  'Summary Statistics' as query_type,
  'Active Memberships' as metric,
  COUNT(*) as value
FROM memberships 
WHERE status = 'active';

-- =====================================================
-- 10. FIND SPECIFIC USER
-- =====================================================

-- Find your specific user from the logs
SELECT 
  'Your User Details' as query_type,
  p.id,
  p.first_name,
  p.last_name,
  p.role,
  au.email,
  p.created_at,
  CASE 
    WHEN p.role = 'admin' THEN '👑 ADMIN'
    WHEN p.role = 'staff' THEN '👨‍💼 STAFF'
    WHEN p.role = 'student' THEN '🎓 STUDENT'
    ELSE '❓ UNKNOWN'
  END as role_emoji
FROM profiles p
LEFT JOIN auth.users au ON p.id = au.id
WHERE p.id = '4e38f21c-6b38-4711-88e4-e4441556ce8a';
