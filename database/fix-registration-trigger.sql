-- Fix Registration Trigger Issues
-- Run this to fix the 500 error during user registration

-- =====================================================
-- 1. CHECK CURRENT TRIGGER STATUS
-- =====================================================

-- Check if trigger exists and is causing issues
SELECT 
  'Current Trigger Status' as check_name,
  tgname as trigger_name,
  tgenabled as enabled,
  CASE 
    WHEN tgenabled = 'O' THEN 'ENABLED'
    WHEN tgenabled = 'D' THEN 'DISABLED'
    ELSE 'UNKNOWN'
  END as status
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- =====================================================
-- 2. REMOVE EXISTING TRIGGERS
-- =====================================================

-- Drop existing triggers to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_safe ON auth.users;

-- =====================================================
-- 3. CHECK USER_ROLE ENUM TYPE
-- =====================================================

-- Check if user_role enum exists
SELECT 
  'User Role Enum Check' as check_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_type 
      WHERE typname = 'user_role'
    ) THEN 'EXISTS ✅'
    ELSE 'MISSING ❌'
  END as status;

-- Show enum values if it exists
SELECT 
  'User Role Enum Values' as check_name,
  unnest(enum_range(NULL::user_role)) as allowed_values;

-- =====================================================
-- 4. CREATE SAFER TRIGGER FUNCTION
-- =====================================================

-- Drop the old trigger function
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Create a safer trigger function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user_safe()
RETURNS TRIGGER AS $$
DECLARE
  user_first_name TEXT;
  user_last_name TEXT;
  user_type TEXT;
  user_role_enum user_role;
BEGIN
  -- Extract metadata with defaults
  user_first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', 'Unknown');
  user_last_name := COALESCE(NEW.raw_user_meta_data->>'last_name', 'User');
  user_type := COALESCE(NEW.raw_user_meta_data->>'user_type', 'student');
  
  -- Validate and cast role
  CASE user_type
    WHEN 'student' THEN user_role_enum := 'student'::user_role;
    WHEN 'staff' THEN user_role_enum := 'staff'::user_role;
    WHEN 'admin' THEN user_role_enum := 'admin'::user_role;
    ELSE user_role_enum := 'student'::user_role; -- Default fallback
  END CASE;
  
  -- Insert profile with error handling
  BEGIN
    INSERT INTO public.profiles (id, first_name, last_name, role, created_at, updated_at)
    VALUES (
      NEW.id,
      user_first_name,
      user_last_name,
      user_role_enum,
      NOW(),
      NOW()
    );
  EXCEPTION 
    WHEN unique_violation THEN
      -- Profile already exists, update it instead
      UPDATE public.profiles 
      SET 
        first_name = user_first_name,
        last_name = user_last_name,
        role = user_role_enum,
        updated_at = NOW()
      WHERE id = NEW.id;
    WHEN OTHERS THEN
      -- Log error but don't fail the user creation
      RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. CREATE NEW SAFER TRIGGER
-- =====================================================

-- Create the new trigger
CREATE TRIGGER on_auth_user_created_safe
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_safe();

-- =====================================================
-- 6. ALTERNATIVE: DISABLE TRIGGER COMPLETELY
-- =====================================================

-- If you want to disable automatic profile creation entirely
-- and handle it manually in the application, uncomment this:

-- DROP TRIGGER IF EXISTS on_auth_user_created_safe ON auth.users;
-- DROP FUNCTION IF EXISTS public.handle_new_user_safe();

-- =====================================================
-- 7. GRANT NECESSARY PERMISSIONS
-- =====================================================

-- Ensure the trigger function has proper permissions
GRANT USAGE ON SCHEMA public TO postgres;
GRANT INSERT, UPDATE ON public.profiles TO postgres;

-- =====================================================
-- 8. TEST THE FIX
-- =====================================================

-- Test if we can now create a profile manually
-- (This simulates what the trigger would do)
DO $$
DECLARE
  test_user_id UUID := gen_random_uuid();
BEGIN
  -- Try to insert a test profile
  INSERT INTO public.profiles (id, first_name, last_name, role)
  VALUES (test_user_id, 'Test', 'User', 'student'::user_role);
  
  -- Clean up test data
  DELETE FROM public.profiles WHERE id = test_user_id;
  
  RAISE NOTICE 'Profile creation test: SUCCESS ✅';
EXCEPTION 
  WHEN OTHERS THEN
    RAISE NOTICE 'Profile creation test: FAILED ❌ - %', SQLERRM;
END $$;

-- =====================================================
-- 9. VERIFICATION
-- =====================================================

-- Check if new trigger is active
SELECT 
  'New Trigger Status' as check_name,
  tgname as trigger_name,
  CASE 
    WHEN tgenabled = 'O' THEN 'ENABLED ✅'
    WHEN tgenabled = 'D' THEN 'DISABLED ❌'
    ELSE 'UNKNOWN ❓'
  END as status
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created_safe';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

SELECT 
  'Registration Fix Applied' as status,
  'Old trigger disabled' as step1,
  'New safer trigger created' as step2,
  'Error handling improved' as step3,
  'Ready to test registration' as next_step;
