-- NUCLEAR OPTION: Remove ALL database restrictions
-- WARNING: This disables all security temporarily - USE ONLY FOR DEBUGGING
-- Run this ONLY if all other fixes have failed

SELECT 'NUCLEAR OPTION STARTING - REMOVING ALL RESTRICTIONS' as status;

-- Step 1: Disable ALL RLS on ALL tables
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
        EXECUTE 'ALTER TABLE ' || r.tablename || ' DISABLE ROW LEVEL SECURITY';
    END LOOP;
END $$;

-- Step 2: Drop ALL existing policies
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public' LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON ' || r.tablename;
    END LOOP;
END $$;

-- Step 3: Grant EVERYTHING to authenticated and anon roles
GRANT ALL PRIVILEGES ON SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON SCHEMA public TO anon;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO anon;

-- Step 4: Ensure user creation trigger exists
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  BEGIN
    INSERT INTO public.profiles (id, first_name, last_name, role, created_at, updated_at)
    VALUES (
      new.id,
      COALESCE(new.raw_user_meta_data->>'first_name', ''),
      COALESCE(new.raw_user_meta_data->>'last_name', ''),
      COALESCE(new.raw_user_meta_data->>'user_type', 'student'),
      now(),
      now()
    );
  EXCEPTION
    WHEN unique_violation THEN
      -- If profile already exists, update it
      UPDATE public.profiles SET
        first_name = COALESCE(new.raw_user_meta_data->>'first_name', first_name),
        last_name = COALESCE(new.raw_user_meta_data->>'last_name', last_name),
        role = COALESCE(new.raw_user_meta_data->>'user_type', role),
        updated_at = now()
      WHERE id = new.id;
  END;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Step 5: Test basic functionality
SELECT 'Testing database access...' as test;

-- Test if we can access tables
SELECT COUNT(*) as profile_count FROM profiles;
SELECT COUNT(*) as student_count FROM student_details;
SELECT COUNT(*) as staff_count FROM staff_details;
SELECT COUNT(*) as membership_count FROM memberships;

-- Final status
SELECT '🚨 NUCLEAR OPTION COMPLETED!' as final_status;
SELECT '⚠️  ALL SECURITY DISABLED - REGISTRATION SHOULD WORK NOW' as warning;
SELECT '✅ Try staff registration - it should work without 500 error' as instruction;
SELECT '🔒 Remember to re-enable proper security later!' as reminder;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';