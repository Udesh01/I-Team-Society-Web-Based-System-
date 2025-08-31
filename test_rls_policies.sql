-- Test RLS Policies Script
-- Run this script to verify that RLS policies are working correctly

-- Check if RLS is enabled on all tables
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('profiles', 'events', 'event_registrations', 'memberships', 'payments', 'notifications')
ORDER BY tablename;

-- List all policies for our tables
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd as operation,
  permissive,
  roles,
  qual as using_expression,
  with_check as check_expression
FROM pg_policies 
WHERE tablename IN ('profiles', 'events', 'event_registrations', 'memberships', 'payments', 'notifications')
ORDER BY tablename, policyname;

-- Test basic authentication functions
SELECT 
  'Current user ID: ' || COALESCE(auth.uid()::text, 'NULL') as auth_test,
  'Current role: ' || COALESCE(auth.role(), 'NULL') as role_test;

-- Test if we can access profiles table
SELECT 
  'Profiles accessible: ' || 
  CASE 
    WHEN EXISTS (SELECT 1 FROM profiles LIMIT 1) THEN 'YES'
    ELSE 'NO'
  END as profiles_test;

-- Test if we can access events table
SELECT 
  'Events accessible: ' || 
  CASE 
    WHEN EXISTS (SELECT 1 FROM events LIMIT 1) THEN 'YES'
    ELSE 'NO'
  END as events_test;

-- Test if we can access event_registrations table
SELECT 
  'Event registrations accessible: ' || 
  CASE 
    WHEN EXISTS (SELECT 1 FROM event_registrations LIMIT 1) THEN 'YES'
    ELSE 'NO'
  END as registrations_test;

-- Test if we can access memberships table
SELECT 
  'Memberships accessible: ' || 
  CASE 
    WHEN EXISTS (SELECT 1 FROM memberships LIMIT 1) THEN 'YES'
    ELSE 'NO'
  END as memberships_test;

-- Check for any users with admin role
SELECT 
  'Admin users found: ' || COUNT(*)::text
FROM profiles 
WHERE role = 'admin';

-- Check for any active events
SELECT 
  'Active events found: ' || COUNT(*)::text
FROM events 
WHERE status = 'active';

-- Summary report
DO $$
DECLARE
  rls_count INTEGER;
  policy_count INTEGER;
BEGIN
  -- Count tables with RLS enabled
  SELECT COUNT(*) INTO rls_count
  FROM pg_tables 
  WHERE tablename IN ('profiles', 'events', 'event_registrations', 'memberships', 'payments', 'notifications')
    AND rowsecurity = true;
  
  -- Count total policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies 
  WHERE tablename IN ('profiles', 'events', 'event_registrations', 'memberships', 'payments', 'notifications');
  
  RAISE NOTICE '=== RLS POLICY TEST SUMMARY ===';
  RAISE NOTICE 'Tables with RLS enabled: %', rls_count;
  RAISE NOTICE 'Total policies created: %', policy_count;
  RAISE NOTICE 'Expected tables with RLS: 6';
  RAISE NOTICE 'Expected minimum policies: 20';
  
  IF rls_count = 6 AND policy_count >= 20 THEN
    RAISE NOTICE 'STATUS: RLS setup appears to be COMPLETE';
  ELSE
    RAISE NOTICE 'STATUS: RLS setup may be INCOMPLETE';
  END IF;
  
  RAISE NOTICE '=== END SUMMARY ===';
END $$;
