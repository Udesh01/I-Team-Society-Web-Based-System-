-- Comprehensive Login Role Issue Diagnostic and Fix
-- Run this to diagnose and resolve "no role information found" login errors

-- =====================================================
-- 1. DIAGNOSE THE ISSUE
-- =====================================================

SELECT 'DIAGNOSING LOGIN ROLE ISSUE...' as status;

-- Check if users exist in auth.users
SELECT 'USERS IN AUTH.USERS:' as info;
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at,
    raw_user_meta_data,
    CASE 
        WHEN email_confirmed_at IS NULL THEN '❌ NOT CONFIRMED'
        ELSE '✅ CONFIRMED'
    END as email_status
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- Check corresponding profiles
SELECT 'PROFILES FOR USERS:' as info;
SELECT 
    p.id,
    p.first_name,
    p.last_name,
    p.role,
    p.created_at,
    u.email,
    CASE 
        WHEN p.role IS NULL THEN '❌ NO ROLE'
        ELSE '✅ HAS ROLE: ' || p.role
    END as role_status
FROM profiles p
RIGHT JOIN auth.users u ON p.id = u.id
ORDER BY u.created_at DESC
LIMIT 5;

-- Check for orphaned users (users without profiles)
SELECT 'USERS WITHOUT PROFILES:' as info;
SELECT 
    u.id,
    u.email,
    u.created_at,
    'MISSING PROFILE' as issue
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL
ORDER BY u.created_at DESC;

-- Check RLS policies for profiles table
SELECT 'RLS POLICIES FOR PROFILES:' as info;
SELECT 
    policyname,
    cmd as operation,
    qual as condition
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'profiles';

-- =====================================================
-- 2. FIX MISSING PROFILES AND ROLES
-- =====================================================

SELECT 'FIXING MISSING PROFILES AND ROLES...' as status;

-- Create profiles for users who don't have them
INSERT INTO profiles (id, first_name, last_name, role)
SELECT 
    u.id,
    COALESCE(u.raw_user_meta_data->>'first_name', 'User'),
    COALESCE(u.raw_user_meta_data->>'last_name', 'Name'),
    COALESCE(u.raw_user_meta_data->>'user_type', 'student')::user_role
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO UPDATE SET
    first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
    last_name = COALESCE(EXCLUDED.last_name, profiles.last_name),
    role = COALESCE(EXCLUDED.role, profiles.role);

-- Update profiles that have NULL roles
UPDATE profiles 
SET role = 'student'::user_role
WHERE role IS NULL;

-- =====================================================
-- 3. ENSURE PROPER RLS POLICIES
-- =====================================================

SELECT 'ENSURING PROPER RLS POLICIES...' as status;

-- Drop and recreate essential policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

-- Create essential policies for profile access
CREATE POLICY "Users can view their own profile" ON profiles 
FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" ON profiles 
FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile" ON profiles 
FOR INSERT WITH CHECK (id = auth.uid());

-- =====================================================
-- 4. FIX THE REGISTRATION TRIGGER
-- =====================================================

SELECT 'ENSURING REGISTRATION TRIGGER WORKS...' as status;

-- Recreate the handle_new_user function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_role_val user_role;
BEGIN
    -- Determine the user role from metadata, default to 'student'
    user_role_val := COALESCE(NEW.raw_user_meta_data->>'user_type', 'student')::user_role;
    
    -- Insert a new profile for the user
    INSERT INTO public.profiles (id, first_name, last_name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        user_role_val
    )
    ON CONFLICT (id) DO UPDATE SET
        first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
        last_name = COALESCE(EXCLUDED.last_name, profiles.last_name),
        role = COALESCE(EXCLUDED.role, profiles.role);
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail the user creation
        RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
        -- Still try to create a basic profile
        INSERT INTO public.profiles (id, first_name, last_name, role)
        VALUES (NEW.id, 'User', 'Name', 'student'::user_role)
        ON CONFLICT (id) DO NOTHING;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 5. TEST THE FIX
-- =====================================================

SELECT 'TESTING THE FIX...' as status;

-- Show all users with their profile status
SELECT 'FINAL USER STATUS:' as info;
SELECT 
    u.email,
    p.first_name,
    p.last_name,
    p.role,
    CASE 
        WHEN p.id IS NULL THEN '❌ NO PROFILE'
        WHEN p.role IS NULL THEN '⚠️ NO ROLE'
        ELSE '✅ READY TO LOGIN'
    END as login_status,
    u.email_confirmed_at IS NOT NULL as email_confirmed
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
ORDER BY u.created_at DESC;

-- =====================================================
-- 6. VERIFICATION QUERIES
-- =====================================================

SELECT 'VERIFICATION RESULTS:' as header;

-- Count users vs profiles
SELECT 
    (SELECT COUNT(*) FROM auth.users) as total_users,
    (SELECT COUNT(*) FROM profiles) as total_profiles,
    (SELECT COUNT(*) FROM profiles WHERE role IS NOT NULL) as profiles_with_roles;

-- Check trigger exists
SELECT 
    trigger_name,
    event_object_table,
    action_timing,
    event_manipulation
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

SELECT 'LOGIN ROLE ISSUE FIX COMPLETED!' as final_status;
SELECT 'Users should now be able to login with proper role information.' as instruction;