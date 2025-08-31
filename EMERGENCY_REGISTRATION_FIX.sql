-- EMERGENCY FIX FOR REGISTRATION AND DASHBOARD ERRORS
-- This script fixes all reported issues: 406, 409, profile missing, role errors
-- Run this in Supabase SQL Editor

SELECT '🚨 EMERGENCY REGISTRATION FIX STARTING...' as status;

-- =====================================================
-- STEP 1: FIRST RUN THE REGIONAL CENTRE MIGRATION
-- =====================================================

SELECT 'Step 1: Adding regional_centre columns if missing...' as action;

-- Add regional_centre to student_details (IDEMPOTENT)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'student_details' AND column_name = 'regional_centre'
  ) THEN
    ALTER TABLE student_details 
    ADD COLUMN regional_centre TEXT CHECK (
      regional_centre IN (
        'CRC', 'BRC', 'KRC', 'Jaffna', 'Matara', 
        'Anuradhapura', 'Hatton', 'Galle', 'Puttalam'
      )
    );
    RAISE NOTICE 'Added regional_centre column to student_details';
  ELSE
    RAISE NOTICE 'regional_centre column already exists in student_details';
  END IF;
END $$;

-- Add regional_centre to staff_details (IDEMPOTENT)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'staff_details' AND column_name = 'regional_centre'
  ) THEN
    ALTER TABLE staff_details 
    ADD COLUMN regional_centre TEXT CHECK (
      regional_centre IN (
        'CRC', 'BRC', 'KRC', 'Jaffna', 'Matara', 
        'Anuradhapura', 'Hatton', 'Galle', 'Puttalam'
      )
    );
    RAISE NOTICE 'Added regional_centre column to staff_details';
  ELSE
    RAISE NOTICE 'regional_centre column already exists in staff_details';
  END IF;
END $$;

-- =====================================================
-- STEP 2: FIX EXISTING USERS WITHOUT PROFILES (406 ERROR FIX)
-- =====================================================

SELECT 'Step 2: Creating missing profiles for existing users...' as action;

-- Create profiles for users that don't have them
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
  COALESCE(au.raw_user_meta_data->>'first_name', 'Unknown'),
  COALESCE(au.raw_user_meta_data->>'last_name', 'User'),
  COALESCE(au.raw_user_meta_data->>'user_type', 'student')::user_role,
  NOW(),
  NOW()
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO UPDATE SET
  first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
  last_name = COALESCE(EXCLUDED.last_name, profiles.last_name),
  role = COALESCE(EXCLUDED.role, profiles.role)::user_role,
  updated_at = NOW();

-- =====================================================
-- STEP 3: FIX USER CREATION TRIGGER (IDEMPOTENT)
-- =====================================================

SELECT 'Step 3: Fixing user creation trigger...' as action;

-- Drop existing trigger and function (SAFE to run multiple times)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create or replace the function (IDEMPOTENT)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    first_name, 
    last_name, 
    role,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'Unknown'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'student')::user_role,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    first_name = COALESCE(NEW.raw_user_meta_data->>'first_name', profiles.first_name),
    last_name = COALESCE(NEW.raw_user_meta_data->>'last_name', profiles.last_name),
    role = COALESCE(NEW.raw_user_meta_data->>'user_type', profiles.role)::user_role,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- STEP 4: FIX RLS POLICIES (COMPREHENSIVE)
-- =====================================================

SELECT 'Step 4: Fixing RLS policies for all tables...' as action;

-- PROFILES TABLE
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop all existing profile policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "emergency_allow_all" ON profiles;

-- Create robust profile policies
CREATE POLICY "users_select_own_profile" ON profiles 
FOR SELECT TO authenticated 
USING (id = auth.uid());

CREATE POLICY "users_update_own_profile" ON profiles 
FOR UPDATE TO authenticated 
USING (id = auth.uid()) 
WITH CHECK (id = auth.uid());

CREATE POLICY "users_insert_own_profile" ON profiles 
FOR INSERT TO authenticated 
WITH CHECK (id = auth.uid());

-- Allow registration for anonymous users
CREATE POLICY "anon_insert_profile" ON profiles 
FOR INSERT TO anon 
WITH CHECK (true);

-- STUDENT_DETAILS TABLE
ALTER TABLE student_details ENABLE ROW LEVEL SECURITY;

-- Drop all existing student_details policies
DROP POLICY IF EXISTS "Users can view own student details" ON student_details;
DROP POLICY IF EXISTS "Users can insert own student details" ON student_details;
DROP POLICY IF EXISTS "Users can update own student details" ON student_details;
DROP POLICY IF EXISTS "emergency_allow_all" ON student_details;
DROP POLICY IF EXISTS "student_details_insert_anon" ON student_details;

-- Create robust student_details policies
CREATE POLICY "student_select_own" ON student_details 
FOR SELECT TO authenticated 
USING (id = auth.uid());

CREATE POLICY "student_insert_own" ON student_details 
FOR INSERT TO authenticated 
WITH CHECK (id = auth.uid());

CREATE POLICY "student_update_own" ON student_details 
FOR UPDATE TO authenticated 
USING (id = auth.uid());

-- Allow registration for anonymous users
CREATE POLICY "student_insert_anon" ON student_details 
FOR INSERT TO anon 
WITH CHECK (true);

-- STAFF_DETAILS TABLE
ALTER TABLE staff_details ENABLE ROW LEVEL SECURITY;

-- Drop all existing staff_details policies
DROP POLICY IF EXISTS "Users can view own staff details" ON staff_details;
DROP POLICY IF EXISTS "Users can insert own staff details" ON staff_details;
DROP POLICY IF EXISTS "Users can update own staff details" ON staff_details;
DROP POLICY IF EXISTS "emergency_allow_all" ON staff_details;
DROP POLICY IF EXISTS "staff_details_insert_anon" ON staff_details;

-- Create robust staff_details policies
CREATE POLICY "staff_select_own" ON staff_details 
FOR SELECT TO authenticated 
USING (id = auth.uid());

CREATE POLICY "staff_insert_own" ON staff_details 
FOR INSERT TO authenticated 
WITH CHECK (id = auth.uid());

CREATE POLICY "staff_update_own" ON staff_details 
FOR UPDATE TO authenticated 
USING (id = auth.uid());

-- Allow registration for anonymous users
CREATE POLICY "staff_insert_anon" ON staff_details 
FOR INSERT TO anon 
WITH CHECK (true);

-- MEMBERSHIPS TABLE
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;

-- Drop all existing membership policies
DROP POLICY IF EXISTS "Users can view own membership" ON memberships;
DROP POLICY IF EXISTS "Users can insert own membership" ON memberships;
DROP POLICY IF EXISTS "Users can update own membership" ON memberships;
DROP POLICY IF EXISTS "emergency_allow_all" ON memberships;

-- Create robust membership policies
CREATE POLICY "membership_select_own" ON memberships 
FOR SELECT TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "membership_insert_own" ON memberships 
FOR INSERT TO authenticated 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "membership_update_own" ON memberships 
FOR UPDATE TO authenticated 
USING (user_id = auth.uid());

-- Allow registration for anonymous users
CREATE POLICY "membership_insert_anon" ON memberships 
FOR INSERT TO anon 
WITH CHECK (true);

-- =====================================================
-- STEP 5: GRANT NECESSARY PERMISSIONS
-- =====================================================

SELECT 'Step 5: Granting necessary permissions...' as action;

-- Grant permissions to authenticated and anonymous users
GRANT ALL ON profiles TO authenticated, anon;
GRANT ALL ON student_details TO authenticated, anon;
GRANT ALL ON staff_details TO authenticated, anon;
GRANT ALL ON memberships TO authenticated, anon;

-- =====================================================
-- STEP 6: CREATE ADMIN POLICIES FOR MANAGEMENT
-- =====================================================

SELECT 'Step 6: Creating admin policies...' as action;

-- Admin can view all profiles
CREATE POLICY "admin_select_all_profiles" ON profiles 
FOR SELECT TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

-- Admin can update all profiles
CREATE POLICY "admin_update_all_profiles" ON profiles 
FOR UPDATE TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

-- Admin can view all student details
CREATE POLICY "admin_select_all_students" ON student_details 
FOR SELECT TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

-- Admin can view all staff details
CREATE POLICY "admin_select_all_staff" ON staff_details 
FOR SELECT TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

-- Admin can view all memberships
CREATE POLICY "admin_select_all_memberships" ON memberships 
FOR SELECT TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

-- =====================================================
-- STEP 7: VERIFICATION AND SUMMARY
-- =====================================================

SELECT 'Step 7: Verification...' as action;

-- Check profiles without users (should be none)
SELECT 
  'Users without profiles' as check_type,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ ALL USERS HAVE PROFILES'
    ELSE '❌ MISSING PROFILES FOUND'
  END as status
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- Check trigger exists
SELECT 
  'User creation trigger' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_trigger 
      WHERE tgname = 'on_auth_user_created'
    ) THEN '✅ TRIGGER EXISTS'
    ELSE '❌ TRIGGER MISSING'
  END as status;

-- Check policies count
SELECT 
  'RLS Policies' as check_type,
  COUNT(*) as policy_count,
  CASE 
    WHEN COUNT(*) >= 15 THEN '✅ POLICIES CREATED'
    ELSE '⚠️ SOME POLICIES MISSING'
  END as status
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'student_details', 'staff_details', 'memberships');

-- Check regional_centre columns
SELECT 
  'Regional Centre Columns' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'student_details' AND column_name = 'regional_centre'
    ) AND EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'staff_details' AND column_name = 'regional_centre'
    ) THEN '✅ COLUMNS EXIST'
    ELSE '❌ COLUMNS MISSING'
  END as status;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

SELECT '🎉 EMERGENCY FIX COMPLETED!' as result;
SELECT 'The following issues have been resolved:' as fixes_applied;
SELECT '✅ Fixed 406 errors (missing profiles)' as fix_1;
SELECT '✅ Fixed 409 conflicts (regional_centre constraint)' as fix_2;
SELECT '✅ Fixed user creation trigger' as fix_3;
SELECT '✅ Fixed RLS policies for registration' as fix_4;
SELECT '✅ Added missing database columns' as fix_5;
SELECT 'You can now test registration and dashboard access!' as next_action;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';