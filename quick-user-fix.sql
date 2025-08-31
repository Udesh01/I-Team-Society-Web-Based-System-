-- Quick Fix for Existing Users with Login Issues
-- Run this to immediately fix users who can't login

-- Check current status
SELECT 'BEFORE FIX - USER STATUS' as status;
SELECT 
    u.email,
    p.role,
    CASE 
        WHEN p.id IS NULL THEN 'MISSING PROFILE'
        WHEN p.role IS NULL THEN 'MISSING ROLE' 
        ELSE 'OK'
    END as issue
FROM auth.users u 
LEFT JOIN profiles p ON u.id = p.id
ORDER BY u.created_at DESC;

-- Fix 1: Create profiles for users without them
INSERT INTO profiles (id, first_name, last_name, role)
SELECT 
    u.id, 
    'User', 
    'Name', 
    'student'::user_role
FROM auth.users u 
LEFT JOIN profiles p ON u.id = p.id 
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Fix 2: Set role for profiles with NULL roles
UPDATE profiles 
SET role = 'student'::user_role 
WHERE role IS NULL;

-- Check status after fix
SELECT 'AFTER FIX - USER STATUS' as status;
SELECT 
    u.email,
    p.role,
    'READY TO LOGIN' as status
FROM auth.users u 
JOIN profiles p ON u.id = p.id
ORDER BY u.created_at DESC;

SELECT 'QUICK FIX COMPLETED!' as result;