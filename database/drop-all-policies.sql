-- Drop All Existing Policies - Run This First
-- This will clean up any existing policies to prevent conflicts

-- =====================================================
-- DROP ALL STORAGE POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can upload their own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins and staff can upload event banners" ON storage.objects;
DROP POLICY IF EXISTS "Public can view event banners" ON storage.objects;

-- Additional storage policies that might exist
DROP POLICY IF EXISTS "Users can upload profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Public access to profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Profile photo access" ON storage.objects;

-- =====================================================
-- DROP ALL EVENT POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view all events" ON events;
DROP POLICY IF EXISTS "Admins and staff can create events" ON events;
DROP POLICY IF EXISTS "Admins and staff can update events" ON events;
DROP POLICY IF EXISTS "Admins can delete events" ON events;

-- Additional event policies that might exist
DROP POLICY IF EXISTS "Public can view events" ON events;
DROP POLICY IF EXISTS "Event access policy" ON events;
DROP POLICY IF EXISTS "Create events policy" ON events;

-- =====================================================
-- DROP ALL PROFILE POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- Additional profile policies that might exist
DROP POLICY IF EXISTS "Profile access policy" ON profiles;
DROP POLICY IF EXISTS "User profile access" ON profiles;

-- =====================================================
-- DROP ALL NOTIFICATION POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can create notifications" ON notifications;

-- Additional notification policies that might exist
DROP POLICY IF EXISTS "Notification access policy" ON notifications;
DROP POLICY IF EXISTS "User notifications" ON notifications;

-- =====================================================
-- DROP ALL EVENT REGISTRATION POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own registrations" ON event_registrations;
DROP POLICY IF EXISTS "Users can register for events" ON event_registrations;
DROP POLICY IF EXISTS "Users can update their own registrations" ON event_registrations;
DROP POLICY IF EXISTS "Users can cancel their own registrations" ON event_registrations;
DROP POLICY IF EXISTS "Admins can view all registrations" ON event_registrations;
DROP POLICY IF EXISTS "Admins can manage all registrations" ON event_registrations;

-- Additional registration policies that might exist
DROP POLICY IF EXISTS "Event registration access" ON event_registrations;
DROP POLICY IF EXISTS "Registration policy" ON event_registrations;

-- =====================================================
-- REFRESH SCHEMA CACHE
-- =====================================================

NOTIFY pgrst, 'reload schema';
