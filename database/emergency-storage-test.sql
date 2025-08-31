-- EMERGENCY STORAGE TEST - Super permissive policies for testing
-- This removes all security to test if storage works at all
-- REMOVE THESE POLICIES AFTER TESTING!

-- =====================================================
-- NUCLEAR OPTION - Remove ALL storage security temporarily
-- =====================================================

-- Drop ALL existing storage policies
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'objects' AND schemaname = 'storage'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
        RAISE NOTICE 'Dropped policy: %', pol.policyname;
    END LOOP;
END $$;

-- Create super permissive policies (NO SECURITY - TESTING ONLY!)
CREATE POLICY "test_anyone_can_do_anything" ON storage.objects
FOR ALL USING (bucket_id = 'profile_photos');

-- Verify bucket exists and is public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'profile_photos',
    'profile_photos',
    true,  -- MUST be public
    10485760,
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO UPDATE SET
    public = true;  -- Force it to be public

-- Verification
SELECT 
    'TEST SETUP COMPLETE' as status,
    'Try uploading now - if this works, the issue is with RLS policies' as message;

-- Show current setup
SELECT 
    'Bucket' as type,
    id,
    name,
    public::text,
    file_size_limit::text
FROM storage.buckets 
WHERE id = 'profile_photos'

UNION ALL

SELECT 
    'Policy' as type,
    policyname as id,
    cmd as name,
    'N/A' as public,
    'N/A' as file_size_limit
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname = 'test_anyone_can_do_anything';

-- IMPORTANT: After testing, run this to restore proper security:
/*
DROP POLICY "test_anyone_can_do_anything" ON storage.objects;

-- Then run database/simple-storage-fix.sql to restore proper policies
*/
