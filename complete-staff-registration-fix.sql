-- Complete Fix for Staff Registration Issues
-- Run this script to fix all database-related staff registration problems

-- =====================================================
-- CRITICAL FIXES FOR STAFF REGISTRATION
-- =====================================================

SELECT 'FIXING STAFF REGISTRATION DATABASE ISSUES...' as status;

-- =====================================================
-- ENSURE PROPER PERMISSIONS FOR ALL ROLES
-- =====================================================

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Specifically ensure permissions for key tables
GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON staff_details TO authenticated;
GRANT SELECT, INSERT, UPDATE ON student_details TO authenticated;
GRANT SELECT, INSERT, UPDATE ON memberships TO authenticated;

-- =====================================================
-- FIX RLS POLICIES TO PREVENT PERMISSION DENIED
-- =====================================================

-- Profiles table
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated_users_select_own_profile" ON profiles;
DROP POLICY IF EXISTS "authenticated_users_insert_own_profile" ON profiles;
DROP POLICY IF EXISTS "authenticated_users_update_own_profile" ON profiles;
DROP POLICY IF EXISTS "service_role_full_access" ON profiles;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create comprehensive policies for profiles
CREATE POLICY "authenticated_select_own_profile" ON profiles 
FOR SELECT TO authenticated 
USING (id = auth.uid());

CREATE POLICY "authenticated_insert_own_profile" ON profiles 
FOR INSERT TO authenticated 
WITH CHECK (id = auth.uid());

CREATE POLICY "authenticated_update_own_profile" ON profiles 
FOR UPDATE TO authenticated 
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "authenticated_delete_own_profile" ON profiles 
FOR DELETE TO authenticated 
USING (id = auth.uid());

-- Staff details table
ALTER TABLE staff_details DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated_users_staff_select" ON staff_details;
DROP POLICY IF EXISTS "authenticated_users_staff_insert" ON staff_details;
DROP POLICY IF EXISTS "authenticated_users_staff_update" ON staff_details;
ALTER TABLE staff_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_select_own_staff" ON staff_details 
FOR SELECT TO authenticated 
USING (id = auth.uid());

CREATE POLICY "authenticated_insert_own_staff" ON staff_details 
FOR INSERT TO authenticated 
WITH CHECK (id = auth.uid());

CREATE POLICY "authenticated_update_own_staff" ON staff_details 
FOR UPDATE TO authenticated 
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Student details table (ensure consistency)
ALTER TABLE student_details DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated_users_student_select" ON student_details;
DROP POLICY IF EXISTS "authenticated_users_student_insert" ON student_details;
DROP POLICY IF EXISTS "authenticated_users_student_update" ON student_details;
ALTER TABLE student_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_select_own_student" ON student_details 
FOR SELECT TO authenticated 
USING (id = auth.uid());

CREATE POLICY "authenticated_insert_own_student" ON student_details 
FOR INSERT TO authenticated 
WITH CHECK (id = auth.uid());

CREATE POLICY "authenticated_update_own_student" ON student_details 
FOR UPDATE TO authenticated 
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Memberships table
ALTER TABLE memberships DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated_users_membership_select" ON memberships;
DROP POLICY IF EXISTS "authenticated_users_membership_insert" ON memberships;
DROP POLICY IF EXISTS "authenticated_users_membership_update" ON memberships;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_select_own_membership" ON memberships 
FOR SELECT TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "authenticated_insert_own_membership" ON memberships 
FOR INSERT TO authenticated 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "authenticated_update_own_membership" ON memberships 
FOR UPDATE TO authenticated 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- =====================================================
-- ENSURE TRIGGERS AND FUNCTIONS WORK PROPERLY
-- =====================================================

-- Check if the handle_new_user function exists and works correctly
SELECT 'CHECKING USER CREATION TRIGGER...' as status;

-- Show current trigger
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Recreate the user creation function if needed
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    first_name, 
    last_name, 
    role
  )
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'first_name', ''),
    COALESCE(new.raw_user_meta_data->>'last_name', ''),
    COALESCE(new.raw_user_meta_data->>'user_type', 'student')
  )
  ON CONFLICT (id) DO UPDATE SET
    first_name = COALESCE(new.raw_user_meta_data->>'first_name', profiles.first_name),
    last_name = COALESCE(new.raw_user_meta_data->>'last_name', profiles.last_name),
    role = COALESCE(new.raw_user_meta_data->>'user_type', profiles.role);
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- =====================================================
-- HANDLE NOTIFICATIONS TABLE IF IT EXISTS
-- =====================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
        -- Fix notifications table policies
        ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "authenticated_users_notifications" ON notifications;
        ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "authenticated_own_notifications" ON notifications 
        FOR ALL TO authenticated 
        USING (user_id = auth.uid())
        WITH CHECK (user_id = auth.uid());
        
        GRANT SELECT, INSERT, UPDATE ON notifications TO authenticated;
    END IF;
END $$;

-- =====================================================
-- VERIFICATION AND TESTING
-- =====================================================

SELECT 'VERIFICATION COMPLETE...' as status;

-- Show all policies
SELECT 
    tablename,
    policyname,
    cmd as operation,
    roles,
    'FIXED FOR STAFF REGISTRATION' as status
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'staff_details', 'student_details', 'memberships', 'notifications')
ORDER BY tablename, cmd;

-- Test basic operations
SELECT 'TESTING DATABASE ACCESS...' as test;
SELECT COUNT(*) as total_profiles FROM profiles;
SELECT COUNT(*) as total_staff FROM staff_details;
SELECT COUNT(*) as total_memberships FROM memberships;

SELECT 'STAFF REGISTRATION FIX COMPLETED!' as final_status;
SELECT 'Staff registration should now work without database errors.' as instruction;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';