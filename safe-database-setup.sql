-- Safe Database Setup for I-Team Society Management System
-- This script can be run multiple times safely on existing databases
-- Run this in your Supabase SQL Editor

-- =====================================================
-- 1. ENABLE EXTENSIONS (SAFE)
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 2. CREATE ENUMS (SAFE - SKIP IF EXISTS)
-- =====================================================
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'staff', 'student');
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE 'user_role enum already exists, skipping...';
END $$;

DO $$ BEGIN
    CREATE TYPE membership_status AS ENUM ('pending_payment', 'pending_approval', 'active', 'expired', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE 'membership_status enum already exists, skipping...';
END $$;

DO $$ BEGIN
    CREATE TYPE membership_tier AS ENUM ('bronze', 'silver', 'gold');
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE 'membership_tier enum already exists, skipping...';
END $$;

-- =====================================================
-- 3. CREATE CORE FUNCTIONS FIRST (NEEDED FOR TRIGGERS)
-- =====================================================

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'student')::user_role
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. CREATE PROFILES TABLE (MOST IMPORTANT)
-- =====================================================
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

-- Add columns if they don't exist
DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS photo_url TEXT;
EXCEPTION
  WHEN duplicate_column THEN 
    RAISE NOTICE 'photo_url column already exists in profiles table';
END $$;

-- =====================================================
-- 5. CREATE ESSENTIAL TABLES
-- =====================================================

-- Student details table
CREATE TABLE IF NOT EXISTS student_details (
  id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  student_id TEXT UNIQUE NOT NULL,
  faculty TEXT,
  department TEXT,
  degree TEXT,
  level INTEGER CHECK (level >= 1 AND level <= 6)
);

-- Staff details table
CREATE TABLE IF NOT EXISTS staff_details (
  id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  staff_id TEXT UNIQUE NOT NULL,
  department TEXT,
  position TEXT
);

-- Memberships table
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

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  max_participants INTEGER,
  poster_url TEXT,
  banner_image TEXT,
  event_type TEXT,
  requirements TEXT,
  contact_info TEXT,
  registration_deadline TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event registrations table
CREATE TABLE IF NOT EXISTS event_registrations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  attended BOOLEAN DEFAULT FALSE,
  attended_at TIMESTAMP WITH TIME ZONE,
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraint safely
DO $$ BEGIN
  ALTER TABLE event_registrations ADD CONSTRAINT event_registrations_event_user_unique UNIQUE(event_id, user_id);
EXCEPTION
  WHEN duplicate_table THEN 
    RAISE NOTICE 'Unique constraint already exists on event_registrations';
END $$;

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 6. CREATE ESSENTIAL TRIGGERS
-- =====================================================

-- Trigger for new user signup (replace if exists)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_memberships_updated_at ON memberships;
CREATE TRIGGER update_memberships_updated_at 
  BEFORE UPDATE ON memberships 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_events_updated_at ON events;
CREATE TRIGGER update_events_updated_at 
  BEFORE UPDATE ON events 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 7. ENABLE ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 8. CREATE ESSENTIAL RLS POLICIES
-- =====================================================

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles 
FOR SELECT USING (id = auth.uid());

CREATE POLICY "Admins can view all profiles" ON profiles 
FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'staff'))
);

CREATE POLICY "Users can update their own profile" ON profiles 
FOR UPDATE USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Events policies
DROP POLICY IF EXISTS "Users can view all events" ON events;
CREATE POLICY "Users can view all events" ON events FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins and staff can create events" ON events;
CREATE POLICY "Admins and staff can create events" ON events 
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'staff'))
);

-- Event registrations policies
DROP POLICY IF EXISTS "Users can view their own registrations" ON event_registrations;
CREATE POLICY "Users can view their own registrations" ON event_registrations 
FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can register for events" ON event_registrations;
CREATE POLICY "Users can register for events" ON event_registrations 
FOR INSERT WITH CHECK (user_id = auth.uid());

-- =====================================================
-- 9. CREATE STORAGE BUCKETS (SAFE)
-- =====================================================

-- Profile photos bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile_photos',
  'profile_photos',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Event images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-images',
  'event-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 10. ESSENTIAL STORAGE POLICIES
-- =====================================================

-- Profile photos policies
DROP POLICY IF EXISTS "Public can view profile photos" ON storage.objects;
CREATE POLICY "Public can view profile photos" ON storage.objects
FOR SELECT USING (bucket_id = 'profile_photos');

DROP POLICY IF EXISTS "Users can upload their own profile photos" ON storage.objects;
CREATE POLICY "Users can upload their own profile photos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'profile_photos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Event images policies
DROP POLICY IF EXISTS "Public can view event images" ON storage.objects;
CREATE POLICY "Public can view event images" ON storage.objects
FOR SELECT USING (bucket_id = 'event-images');

DROP POLICY IF EXISTS "Authenticated users can upload event images" ON storage.objects;
CREATE POLICY "Authenticated users can upload event images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'event-images' AND 
  auth.role() = 'authenticated'
);

-- =====================================================
-- 11. REFRESH SCHEMA CACHE
-- =====================================================
NOTIFY pgrst, 'reload schema';

-- Success message
SELECT 'Database setup completed successfully! You can now test user registration.' as status;