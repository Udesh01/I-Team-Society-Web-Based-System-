-- Fix profile for the current user: e5b0e084-4892-4790-a653-fd31b3b0c014
-- This script will:
-- 1. Check if the profile exists
-- 2. Create it if missing
-- 3. Set a default role if missing

-- Check current state
SELECT 'Current User Profile Check' as status;
SELECT 
  au.id as auth_user_id,
  au.email as auth_email,
  p.id as profile_id,
  p.role as current_role,
  p.first_name,
  p.last_name,
  p.created_at as profile_created
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE au.id = 'e5b0e084-4892-4790-a653-fd31b3b0c014';

-- Create profile if it doesn't exist
INSERT INTO public.profiles (
  id, 
  first_name, 
  last_name, 
  role
)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'first_name', 'User'),
  COALESCE(au.raw_user_meta_data->>'last_name', 'Name'),
  COALESCE(au.raw_user_meta_data->>'user_type', 'student')::user_role
FROM auth.users au
WHERE au.id = 'e5b0e084-4892-4790-a653-fd31b3b0c014'
  AND NOT EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = au.id
  );

-- Update role if it's null or empty
UPDATE profiles 
SET role = 'student'::user_role,
    updated_at = NOW()
WHERE id = 'e5b0e084-4892-4790-a653-fd31b3b0c014' 
  AND (role IS NULL OR role::text = '');

-- Final verification
SELECT 'Final Verification' as status;
SELECT 
  id,
  role,
  first_name,
  last_name,
  created_at,
  updated_at
FROM profiles 
WHERE id = 'e5b0e084-4892-4790-a653-fd31b3b0c014';
