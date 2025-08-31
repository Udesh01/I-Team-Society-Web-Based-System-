-- Simple Fix: Disable Automatic Profile Creation Trigger
-- This removes the trigger causing the 500 error
-- Profile creation will be handled manually in the application

-- =====================================================
-- 1. DISABLE ALL PROFILE CREATION TRIGGERS
-- =====================================================

-- Drop triggers completely (this will disable them)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_safe ON auth.users;

-- Drop trigger functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user_safe() CASCADE;

-- =====================================================
-- 2. VERIFICATION
-- =====================================================

-- Check that no triggers remain
SELECT 
  'Trigger Cleanup Status' as check_name,
  COUNT(*) as remaining_triggers,
  CASE 
    WHEN COUNT(*) = 0 THEN 'ALL TRIGGERS REMOVED ✅'
    ELSE 'TRIGGERS STILL EXIST ❌'
  END as status
FROM pg_trigger 
WHERE tgname LIKE '%auth_user_created%';

-- =====================================================
-- 3. SUCCESS MESSAGE
-- =====================================================

SELECT 
  'Registration Fix Applied' as status,
  'All automatic triggers disabled' as action,
  'Profile creation now handled by application' as method,
  'Registration should work without 500 errors' as result,
  'Test registration now' as next_step;
