-- Check if Database Triggers Exist
-- Run this to verify automatic profile creation is set up

-- =====================================================
-- 1. CHECK IF PROFILE CREATION TRIGGER EXISTS
-- =====================================================

-- Check if the trigger function exists
SELECT 
  'Profile Creation Function' as check_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc 
      WHERE proname = 'handle_new_user'
    ) THEN 'EXISTS ✅'
    ELSE 'MISSING ❌'
  END as status;

-- Check if the trigger exists
SELECT 
  'Profile Creation Trigger' as check_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_trigger 
      WHERE tgname = 'on_auth_user_created'
    ) THEN 'EXISTS ✅'
    ELSE 'MISSING ❌'
  END as status;

-- =====================================================
-- 2. CHECK RECENT USER REGISTRATIONS
-- =====================================================

-- Show recent auth users (last 10)
SELECT 
  'Recent Auth Users' as check_name,
  id,
  email,
  created_at,
  raw_user_meta_data->>'first_name' as first_name,
  raw_user_meta_data->>'last_name' as last_name,
  raw_user_meta_data->>'user_type' as user_type
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 10;

-- =====================================================
-- 3. CHECK CORRESPONDING PROFILES
-- =====================================================

-- Show recent profiles (last 10)
SELECT 
  'Recent Profiles' as check_name,
  id,
  first_name,
  last_name,
  role,
  created_at
FROM profiles 
ORDER BY created_at DESC 
LIMIT 10;

-- =====================================================
-- 4. CHECK FOR ORPHANED USERS (AUTH BUT NO PROFILE)
-- =====================================================

-- Find auth users without profiles
SELECT 
  'Orphaned Users Check' as check_name,
  COUNT(*) as orphaned_count,
  CASE 
    WHEN COUNT(*) = 0 THEN 'NO ORPHANS ✅'
    ELSE 'ORPHANS FOUND ❌'
  END as status
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- Show orphaned users if any exist
SELECT 
  'Orphaned Users Details' as check_name,
  au.id,
  au.email,
  au.created_at,
  'NO PROFILE' as issue
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL
ORDER BY au.created_at DESC;

-- =====================================================
-- 5. CREATE MISSING TRIGGER IF NEEDED
-- =====================================================

-- Create the trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'student')::user_role
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    
    RAISE NOTICE 'Created profile creation trigger';
  ELSE
    RAISE NOTICE 'Profile creation trigger already exists';
  END IF;
END $$;

-- =====================================================
-- 6. FIX ORPHANED USERS (CREATE MISSING PROFILES)
-- =====================================================

-- Create profiles for any orphaned auth users
INSERT INTO public.profiles (id, first_name, last_name, role)
SELECT
  au.id,
  COALESCE(au.raw_user_meta_data->>'first_name', 'Unknown'),
  COALESCE(au.raw_user_meta_data->>'last_name', 'User'),
  COALESCE(au.raw_user_meta_data->>'user_type', 'student')::user_role
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 7. VERIFICATION
-- =====================================================

-- Final check - should show no orphaned users
SELECT 
  'Final Verification' as check_name,
  COUNT(*) as orphaned_count,
  CASE 
    WHEN COUNT(*) = 0 THEN 'ALL USERS HAVE PROFILES ✅'
    ELSE 'STILL HAVE ORPHANS ❌'
  END as status
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL;
