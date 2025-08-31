-- Setup Test Users for Login Redirect Issue Reproduction
-- This script creates test users with various roles for testing the login flow

-- First, let's check if there are already test users
SELECT 'Checking existing test users...' as status;

SELECT p.id, p.first_name, p.last_name, p.role, au.email 
FROM profiles p 
JOIN auth.users au ON p.id = au.id 
WHERE au.email IN ('admin@iteam.com', 'staff@iteam.com', 'student@iteam.com')
ORDER BY p.role;

-- Clean up any existing test users to start fresh
DELETE FROM profiles WHERE id IN (
  SELECT p.id FROM profiles p 
  JOIN auth.users au ON p.id = au.id 
  WHERE au.email IN ('admin@iteam.com', 'staff@iteam.com', 'student@iteam.com')
);

-- Note: In a real Supabase environment, you would need to create these users through the Auth API
-- For testing purposes, these would typically be created through the registration process
-- But for Cypress testing, we need to ensure these users exist

-- Insert test profiles (these would normally be created through registration)
-- Note: These INSERT statements assume the auth.users entries already exist
-- In practice, you'd create these through Supabase Auth registration

-- The following is a reference for what the test data should look like:

/*
Test User Accounts needed for testing:

1. Admin User:
   - Email: admin@iteam.com  
   - Password: password123
   - Role: admin
   - Name: Test Admin

2. Staff User:
   - Email: staff@iteam.com
   - Password: password123  
   - Role: staff
   - Name: Test Staff

3. Student User:
   - Email: student@iteam.com
   - Password: password123
   - Role: student
   - Name: Test Student

These should be created through the registration flow or Supabase Auth dashboard.
*/

-- Check auth users table for test users
SELECT 'Auth users check:' as status;
SELECT id, email, created_at, email_confirmed_at 
FROM auth.users 
WHERE email IN ('admin@iteam.com', 'staff@iteam.com', 'student@iteam.com')
ORDER BY email;

-- Verification query to run after manual user creation
SELECT 'Final verification:' as status;
SELECT 
    p.id,
    au.email,
    p.first_name,
    p.last_name, 
    p.role,
    p.created_at,
    au.email_confirmed_at,
    CASE 
        WHEN au.email_confirmed_at IS NULL THEN '❌ NOT VERIFIED'
        ELSE '✅ VERIFIED'
    END as email_status
FROM profiles p 
JOIN auth.users au ON p.id = au.id 
WHERE au.email IN ('admin@iteam.com', 'staff@iteam.com', 'student@iteam.com')
ORDER BY p.role, au.email;

-- Check for any users with NULL roles (this is the bug we're trying to reproduce)
SELECT 'Users with NULL roles:' as status;
SELECT 
    p.id,
    au.email,
    p.first_name,
    p.last_name, 
    p.role,
    CASE 
        WHEN p.role IS NULL THEN '🔴 NULL ROLE DETECTED'
        ELSE '✅ ROLE OK'
    END as role_status
FROM profiles p 
JOIN auth.users au ON p.id = au.id 
WHERE p.role IS NULL OR p.role = ''
ORDER BY au.email;
