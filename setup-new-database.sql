-- Complete Database Setup for I-Team Society Management System
-- Run this in your new Supabase SQL Editor to set up all required tables, functions, and policies

-- =====================================================
-- 1. ENABLE EXTENSIONS
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 2. CREATE ENUMS (IF NOT EXISTS)
-- =====================================================
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'staff', 'student');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE membership_status AS ENUM ('pending_payment', 'pending_approval', 'active', 'expired', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE membership_tier AS ENUM ('bronze', 'silver', 'gold');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- 3. CREATE TABLES (IF NOT EXISTS)
-- =====================================================

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'student',
  phone_number TEXT,
  address TEXT,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  membership_id UUID REFERENCES memberships(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  bank_slip_url TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  payment_date DATE,
  verified_by UUID REFERENCES profiles(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
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
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

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
-- 4. CREATE FUNCTIONS
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
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate E-ID
CREATE OR REPLACE FUNCTION generate_eid(user_role TEXT, user_id UUID)
RETURNS TEXT AS $$
DECLARE
  year_part TEXT;
  role_part TEXT;
  sequence_num INTEGER;
  eid_result TEXT;
BEGIN
  year_part := EXTRACT(YEAR FROM NOW())::TEXT;

  CASE user_role
    WHEN 'student' THEN role_part := 'STU';
    WHEN 'staff' THEN role_part := 'STA';
    WHEN 'admin' THEN role_part := 'ADM';
    ELSE role_part := 'MEM';
  END CASE;

  SELECT COALESCE(MAX(
    CAST(SUBSTRING(eid FROM LENGTH(eid) - 3) AS INTEGER)
  ), 0) + 1
  INTO sequence_num
  FROM memberships
  WHERE eid LIKE 'ITS/' || year_part || '/' || role_part || '/%';

  eid_result := 'ITS/' || year_part || '/' || role_part || '/' || LPAD(sequence_num::TEXT, 4, '0');

  RETURN eid_result;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-generate E-ID when membership approved
CREATE OR REPLACE FUNCTION auto_generate_eid()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
BEGIN
  IF NEW.status = 'active' AND (OLD.status != 'active' OR OLD.eid IS NULL) AND NEW.eid IS NULL THEN
    SELECT role::TEXT INTO user_role FROM profiles WHERE id = NEW.user_id;
    NEW.eid := generate_eid(user_role, NEW.user_id);

    IF NEW.start_date IS NULL THEN
      NEW.start_date := CURRENT_DATE;
    END IF;

    IF NEW.end_date IS NULL THEN
      NEW.end_date := CURRENT_DATE + INTERVAL '1 year';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Utility functions
CREATE OR REPLACE FUNCTION has_active_membership(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM memberships 
    WHERE user_id = has_active_membership.user_id 
    AND status = 'active' 
    AND end_date > CURRENT_DATE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = is_admin.user_id 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_staff(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = is_staff.user_id 
    AND role IN ('staff', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. CREATE TRIGGERS
-- =====================================================

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger for E-ID generation
DROP TRIGGER IF EXISTS trigger_auto_generate_eid ON memberships;
CREATE TRIGGER trigger_auto_generate_eid
  BEFORE UPDATE ON memberships
  FOR EACH ROW EXECUTE FUNCTION auto_generate_eid();

-- Updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_memberships_updated_at BEFORE UPDATE ON memberships FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 6. ENABLE ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 7. CREATE RLS POLICIES
-- =====================================================

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'staff'))
);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (id = auth.uid())
WITH CHECK (id = auth.uid() AND role = (SELECT role FROM profiles WHERE id = auth.uid()) AND first_name IS NOT NULL AND last_name IS NOT NULL AND first_name != '' AND last_name != '');
CREATE POLICY "Admins can update all profiles" ON profiles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Student details policies
CREATE POLICY "Users can view own student details" ON student_details FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users can insert own student details" ON student_details FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "Users can update own student details" ON student_details FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Admins can view all student details" ON student_details FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'staff'))
);

-- Staff details policies
CREATE POLICY "Users can view own staff details" ON staff_details FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users can insert own staff details" ON staff_details FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "Users can update own staff details" ON staff_details FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Admins can view all staff details" ON staff_details FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'staff'))
);

-- Memberships policies
CREATE POLICY "Users can view own membership" ON memberships FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own membership" ON memberships FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own membership" ON memberships FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Admins can view all memberships" ON memberships FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'staff'))
);
CREATE POLICY "Admins can manage all memberships" ON memberships FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Payments policies
CREATE POLICY "Users can view own payments" ON payments FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own payments" ON payments FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can view all payments" ON payments FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'staff'))
);
CREATE POLICY "Admins can manage all payments" ON payments FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Events policies
CREATE POLICY "Users can view all events" ON events FOR SELECT USING (true);
CREATE POLICY "Admins and staff can create events" ON events FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'staff'))
);
CREATE POLICY "Admins and staff can update events" ON events FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR (profiles.role = 'staff' AND events.created_by = auth.uid())))
);
CREATE POLICY "Admins can delete events" ON events FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Event registrations policies
CREATE POLICY "Users can view their own registrations" ON event_registrations FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins can view all registrations" ON event_registrations FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'staff'))
);
CREATE POLICY "Users can register for events" ON event_registrations FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own registrations" ON event_registrations FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can cancel their own registrations" ON event_registrations FOR DELETE USING (user_id = auth.uid());
CREATE POLICY "Admins can manage all registrations" ON event_registrations FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "System can insert notifications" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage all notifications" ON notifications FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- =====================================================
-- 8. CREATE STORAGE BUCKETS
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

-- Event banners bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event_banners',
  'event_banners',
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

-- Payment slips bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment_slips',
  'payment_slips',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 9. CREATE STORAGE POLICIES
-- =====================================================

-- Profile photos policies
CREATE POLICY "Users can upload their own profile photos" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'profile_photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own profile photos" ON storage.objects
FOR UPDATE USING (bucket_id = 'profile_photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own profile photos" ON storage.objects
FOR DELETE USING (bucket_id = 'profile_photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Public can view profile photos" ON storage.objects
FOR SELECT USING (bucket_id = 'profile_photos');

-- Event banners policies
CREATE POLICY "Admins and staff can upload event banners" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'event_banners' AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'staff')));

CREATE POLICY "Public can view event banners" ON storage.objects
FOR SELECT USING (bucket_id = 'event_banners');

-- Event images policies
CREATE POLICY "Public can view event images" ON storage.objects
FOR SELECT USING (bucket_id = 'event-images');

CREATE POLICY "Authenticated users can upload event images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'event-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own event images" ON storage.objects
FOR UPDATE USING (bucket_id = 'event-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own event images" ON storage.objects
FOR DELETE USING (bucket_id = 'event-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Payment slips policies
CREATE POLICY "Admins can view payment slips" ON storage.objects
FOR SELECT USING (bucket_id = 'payment_slips' AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE POLICY "Users can upload own payment slips" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'payment_slips' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can manage payment slips" ON storage.objects
FOR ALL USING (bucket_id = 'payment_slips' AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- =====================================================
-- 10. REFRESH SCHEMA CACHE
-- =====================================================
NOTIFY pgrst, 'reload schema';

-- Setup complete! Your database is now ready for the I-Team Society Management System.