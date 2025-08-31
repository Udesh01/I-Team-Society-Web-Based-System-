-- Minimal Storage Fix - Just to Get Profile Photos Working
-- Run this after dropping policies if you're having conflicts

-- =====================================================
-- 1. CREATE STORAGE BUCKETS
-- =====================================================

-- Create profile_photos bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'profile_photos', 
  'profile_photos', 
  true, 
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 2. DROP EXISTING POLICIES FIRST
-- =====================================================

-- Drop any existing policies to prevent conflicts
DROP POLICY IF EXISTS "profile_photos_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "profile_photos_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "profile_photos_select_policy" ON storage.objects;

-- =====================================================
-- 3. CREATE MINIMAL STORAGE POLICIES
-- =====================================================

-- Allow users to upload their own profile photos
CREATE POLICY "profile_photos_insert_policy" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'profile_photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own profile photos
CREATE POLICY "profile_photos_update_policy" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'profile_photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public viewing of profile photos
CREATE POLICY "profile_photos_select_policy" ON storage.objects
FOR SELECT USING (bucket_id = 'profile_photos');

-- =====================================================
-- 3. ADD PHOTO_URL COLUMN
-- =====================================================

-- Add photo_url column to profiles table if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- =====================================================
-- 4. REFRESH SCHEMA
-- =====================================================

NOTIFY pgrst, 'reload schema';
