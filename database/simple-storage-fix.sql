-- SIMPLE STORAGE FIX - Handles existing policies properly
-- Run this in Supabase SQL Editor

-- =====================================================
-- STEP 1: CHECK WHAT EXISTS
-- =====================================================
SELECT 'CURRENT SITUATION' as step;

-- Check bucket
SELECT 
    'Bucket Status' as check,
    CASE 
        WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'profile_photos') 
        THEN '✅ profile_photos bucket exists'
        ELSE '❌ profile_photos bucket missing'
    END as result;

-- Check policies
SELECT 
    'Existing Policies' as check,
    COUNT(*) || ' storage policies exist for profile_photos' as result
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND qual LIKE '%profile_photos%';

-- =====================================================
-- STEP 2: CREATE BUCKET (if missing)
-- =====================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'profile_photos',
    'profile_photos',
    true,
    10485760,
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

-- =====================================================
-- STEP 3: DROP ALL EXISTING POLICIES (be thorough)
-- =====================================================
DROP POLICY IF EXISTS "Anyone can view profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Super permissive upload" ON storage.objects;
DROP POLICY IF EXISTS "Temp super permissive upload" ON storage.objects;

-- =====================================================
-- STEP 4: CREATE NEW SIMPLE POLICIES
-- =====================================================

-- Allow anyone to view profile photos
CREATE POLICY "profile_photos_select" ON storage.objects
FOR SELECT USING (bucket_id = 'profile_photos');

-- Allow authenticated users to upload profile photos
CREATE POLICY "profile_photos_insert" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'profile_photos' 
    AND auth.role() = 'authenticated'
);

-- Allow authenticated users to update profile photos
CREATE POLICY "profile_photos_update" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'profile_photos' 
    AND auth.role() = 'authenticated'
);

-- Allow authenticated users to delete profile photos
CREATE POLICY "profile_photos_delete" ON storage.objects
FOR DELETE USING (
    bucket_id = 'profile_photos' 
    AND auth.role() = 'authenticated'
);

-- =====================================================
-- STEP 5: VERIFICATION
-- =====================================================
SELECT 'VERIFICATION' as step;

-- Check if bucket is properly configured
SELECT 
    'Final Bucket Check' as check,
    id,
    name,
    public,
    file_size_limit
FROM storage.buckets 
WHERE id = 'profile_photos';

-- Count new policies
SELECT 
    'New Policies' as check,
    COUNT(*) || ' policies created for profile_photos' as result
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE 'profile_photos_%';

-- List the policies
SELECT 
    'Policy List' as check,
    policyname,
    cmd as operation
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE 'profile_photos_%'
ORDER BY cmd;

-- Test authentication (run this while logged into the dashboard)
SELECT 
    'Authentication Test' as check,
    CASE 
        WHEN auth.uid() IS NOT NULL 
        THEN '✅ User is authenticated'
        ELSE '❌ User not authenticated - this is the problem!'
    END as result;

SELECT 'NEXT STEPS' as step, 'Try uploading a profile photo now' as instruction;
