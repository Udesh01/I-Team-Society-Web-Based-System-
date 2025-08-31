-- Debug Registration Issue - Comprehensive Check and Fix
-- Run this to diagnose and fix user registration problems

-- =====================================================
-- 1. CHECK CURRENT DATABASE STATE
-- =====================================================

SELECT 'CHECKING DATABASE TABLES...' as status;

-- Check if required tables exist
SELECT 
    'profiles' as table_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'profiles'
    ) THEN 'EXISTS' ELSE 'MISSING' END as status
UNION ALL
SELECT 
    'student_details' as table_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'student_details'
    ) THEN 'EXISTS' ELSE 'MISSING' END as status
UNION ALL
SELECT 
    'staff_details' as table_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'staff_details'
    ) THEN 'EXISTS' ELSE 'MISSING' END as status;

-- =====================================================
-- 2. CHECK TRIGGERS AND FUNCTIONS
-- =====================================================

SELECT 'CHECKING TRIGGERS AND FUNCTIONS...' as status;

-- Check if the registration trigger exists
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Check if the function exists
SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user'
AND routine_schema = 'public';

-- =====================================================
-- 3. CHECK ENUM TYPES
-- =====================================================

SELECT 'CHECKING ENUM TYPES...' as status;

SELECT 
    typname as enum_name,
    string_agg(enumlabel, ', ' ORDER BY enumsortorder) as values
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE typname IN ('user_role', 'membership_status', 'membership_tier')
GROUP BY typname;

-- =====================================================
-- 4. CHECK RLS POLICIES
-- =====================================================

SELECT 'CHECKING RLS POLICIES...' as status;

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'profiles';

-- =====================================================
-- 5. FIX MISSING COMPONENTS
-- =====================================================

-- Fix 1: Ensure UUID extension is enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Fix 2: Create enums if missing
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'staff', 'student');
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE 'user_role enum already exists';
END $$;

DO $$ BEGIN
    CREATE TYPE membership_status AS ENUM ('pending_payment', 'pending_approval', 'active', 'expired', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE 'membership_status enum already exists';
END $$;

DO $$ BEGIN
    CREATE TYPE membership_tier AS ENUM ('bronze', 'silver', 'gold');
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE 'membership_tier enum already exists';
END $$;

-- Fix 3: Create profiles table if missing
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  role user_role NOT NULL DEFAULT 'student',
  phone_number TEXT,
  address TEXT,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fix 4: Create the registration function (most important!)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a new profile for the user
  INSERT INTO public.profiles (id, first_name, last_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'student')::user_role
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix 5: Create the trigger (critical!)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Fix 6: Enable RLS and create basic policies (safe approach)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts (safe - won't error if they don't exist)
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Create basic RLS policies
CREATE POLICY "Users can view their own profile" ON profiles 
FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" ON profiles 
FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile" ON profiles 
FOR INSERT WITH CHECK (id = auth.uid());

-- Admin policy for viewing all profiles
CREATE POLICY "Admins can view all profiles" ON profiles 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Fix 7: Create student_details and staff_details tables if missing
CREATE TABLE IF NOT EXISTS student_details (
  id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  student_id TEXT UNIQUE NOT NULL,
  faculty TEXT,
  department TEXT,
  degree TEXT,
  level INTEGER CHECK (level >= 1 AND level <= 6)
);

CREATE TABLE IF NOT EXISTS staff_details (
  id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  staff_id TEXT UNIQUE NOT NULL,
  department TEXT,
  position TEXT
);

-- Fix 8: Enable RLS on detail tables
ALTER TABLE student_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_details ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for detail tables to avoid conflicts
DROP POLICY IF EXISTS "Users can manage own student details" ON student_details;
DROP POLICY IF EXISTS "Users can view own student details" ON student_details;
DROP POLICY IF EXISTS "Users can insert own student details" ON student_details;
DROP POLICY IF EXISTS "Users can update own student details" ON student_details;

DROP POLICY IF EXISTS "Users can manage own staff details" ON staff_details;
DROP POLICY IF EXISTS "Users can view own staff details" ON staff_details;
DROP POLICY IF EXISTS "Users can insert own staff details" ON staff_details;
DROP POLICY IF EXISTS "Users can update own staff details" ON staff_details;

-- Create comprehensive policies for student_details
CREATE POLICY "Users can view own student details" ON student_details 
FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can insert own student details" ON student_details 
FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own student details" ON student_details 
FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Users can delete own student details" ON student_details 
FOR DELETE USING (id = auth.uid());

-- Create comprehensive policies for staff_details
CREATE POLICY "Users can view own staff details" ON staff_details 
FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can insert own staff details" ON staff_details 
FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own staff details" ON staff_details 
FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Users can delete own staff details" ON staff_details 
FOR DELETE USING (id = auth.uid());

-- Admin policies for detail tables
CREATE POLICY "Admins can manage all student details" ON student_details 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can manage all staff details" ON staff_details 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- =====================================================
-- 9. CREATE MEMBERSHIPS TABLE AND POLICIES (ESSENTIAL FOR REGISTRATION)
-- =====================================================

-- Create memberships table if missing
CREATE TABLE IF NOT EXISTS memberships (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  eid TEXT UNIQUE,
  status membership_status NOT NULL DEFAULT 'pending_payment',
  tier membership_tier NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for memberships
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;

-- Drop existing membership policies
DROP POLICY IF EXISTS "Users can view own membership" ON memberships;
DROP POLICY IF EXISTS "Users can insert own membership" ON memberships;
DROP POLICY IF EXISTS "Users can update own membership" ON memberships;
DROP POLICY IF EXISTS "Admins can manage all memberships" ON memberships;

-- Create membership policies
CREATE POLICY "Users can view own membership" ON memberships 
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own membership" ON memberships 
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own membership" ON memberships 
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all memberships" ON memberships 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- =====================================================
-- 10. TEST THE SETUP
-- =====================================================

-- Check if everything is properly set up
SELECT 
    'Profiles table' as component,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') 
         THEN 'OK' ELSE 'MISSING' END as status
UNION ALL
SELECT 
    'Registration function' as component,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'handle_new_user') 
         THEN 'OK' ELSE 'MISSING' END as status
UNION ALL
SELECT 
    'Registration trigger' as component,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created') 
         THEN 'OK' ELSE 'MISSING' END as status
UNION ALL
SELECT 
    'RLS enabled' as component,
    CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'profiles' AND rowsecurity = true) 
         THEN 'OK' ELSE 'DISABLED' END as status;

-- Show the trigger details
SELECT 'TRIGGER VERIFICATION:' as info;
SELECT 
    trigger_name,
    event_object_table,
    action_timing,
    event_manipulation
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

SELECT 'Database setup completed! Try registering a user now.' as final_status;