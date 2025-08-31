-- FIX STORAGE PERMISSIONS FOR PROFILE PHOTOS
-- Run this in Supabase SQL Editor to fix photo upload issues

-- =====================================================
-- STEP 1: CHECK CURRENT STORAGE SETUP
-- =====================================================

-- Check if profile_photos bucket exists
SELECT 
    'STORAGE BUCKET CHECK' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'profile_photos') 
        THEN '✅ profile_photos bucket exists'
        ELSE '❌ profile_photos bucket missing'
    END as result;

-- Show current bucket configuration
SELECT 
    'BUCKET CONFIG' as info,
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
WHERE id = 'profile_photos';

-- Check current storage policies
SELECT 
    'STORAGE POLICIES' as info,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';

-- =====================================================
-- STEP 2: CREATE/RECREATE STORAGE BUCKET
-- =====================================================

-- Delete existing bucket if it has issues (this will remove all files in it)
-- Only uncomment if you're sure you want to recreate the bucket
-- DELETE FROM storage.buckets WHERE id = 'profile_photos';

-- Create profile_photos bucket with correct settings
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'profile_photos',
    'profile_photos',
    true,  -- Make it public so images can be viewed
    10485760, -- 10MB limit
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- =====================================================
-- STEP 3: REMOVE ALL EXISTING STORAGE POLICIES
-- =====================================================

-- Drop all existing storage policies for profile_photos
DROP POLICY IF EXISTS "Users can upload their own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access" ON storage.objects;

-- =====================================================
-- STEP 4: CREATE SIMPLE, WORKING STORAGE POLICIES
-- =====================================================

-- Simple policy: Any authenticated user can upload to profile_photos bucket
CREATE POLICY "Anyone can upload profile photos" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'profile_photos' 
    AND auth.role() = 'authenticated'
);

-- Simple policy: Any authenticated user can update files in profile_photos bucket
CREATE POLICY "Anyone can update profile photos" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'profile_photos' 
    AND auth.role() = 'authenticated'
);

-- Simple policy: Any authenticated user can delete files in profile_photos bucket
CREATE POLICY "Anyone can delete profile photos" ON storage.objects
FOR DELETE USING (
    bucket_id = 'profile_photos' 
    AND auth.role() = 'authenticated'
);

-- Simple policy: Anyone can view profile photos (public bucket)
CREATE POLICY "Anyone can view profile photos" ON storage.objects
FOR SELECT USING (bucket_id = 'profile_photos');

-- =====================================================
-- STEP 5: VERIFY AUTHENTICATION WORKS
-- =====================================================

-- Check if current user is authenticated
SELECT 
    'AUTHENTICATION CHECK' as check_type,
    CASE 
        WHEN auth.uid() IS NOT NULL 
        THEN '✅ User is authenticated: ' || auth.uid()::text
        ELSE '❌ User is not authenticated - this is the problem!'
    END as result;

-- Check user's role
SELECT 
    'USER ROLE CHECK' as check_type,
    CASE 
        WHEN auth.role() = 'authenticated' 
        THEN '✅ User has authenticated role'
        ELSE '❌ User role is: ' || COALESCE(auth.role()::text, 'NULL')
    END as result;

-- =====================================================
-- STEP 6: ALTERNATIVE - SUPER PERMISSIVE POLICY (TEMPORARY)
-- =====================================================

-- If the above doesn't work, use this super permissive policy temporarily
-- This allows ANYONE to upload to profile_photos (remove after testing)

/*
DROP POLICY IF EXISTS "Anyone can upload profile photos" ON storage.objects;
CREATE POLICY "Super permissive upload" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'profile_photos');
*/

-- =====================================================
-- STEP 7: FINAL VERIFICATION
-- =====================================================

SELECT 'FINAL VERIFICATION' as section;

-- Check bucket exists and is public
SELECT 
    'Bucket Status' as check,
    CASE 
        WHEN public = true THEN '✅ Bucket is public'
        ELSE '❌ Bucket is private'
    END as result
FROM storage.buckets 
WHERE id = 'profile_photos';

-- Count storage policies for profile_photos
SELECT 
    'Policy Count' as check,
    COUNT(*) || ' policies exist for profile_photos' as result
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND qual LIKE '%profile_photos%';

-- List all policies for profile_photos
SELECT 
    'Policy Details' as check,
    policyname as policy_name,
    cmd as operation
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND qual LIKE '%profile_photos%';

-- Test message
SELECT 
    'NEXT STEPS' as section,
    'After running this script, try uploading a profile photo again' as instruction;
