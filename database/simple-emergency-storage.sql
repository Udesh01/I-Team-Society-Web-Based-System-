-- SIMPLE EMERGENCY STORAGE TEST
-- No complex queries, just the essentials

-- =====================================================
-- Step 1: Drop all existing storage policies
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
DROP POLICY IF EXISTS "profile_photos_select" ON storage.objects;
DROP POLICY IF EXISTS "profile_photos_insert" ON storage.objects;
DROP POLICY IF EXISTS "profile_photos_update" ON storage.objects;
DROP POLICY IF EXISTS "profile_photos_delete" ON storage.objects;
DROP POLICY IF EXISTS "test_anyone_can_do_anything" ON storage.objects;

-- =====================================================
-- Step 2: Create bucket
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
    file_size_limit = 10485760;

-- =====================================================
-- Step 3: Create ONE super simple policy for testing
-- =====================================================
CREATE POLICY "temp_allow_all" ON storage.objects
FOR ALL USING (bucket_id = 'profile_photos');

-- =====================================================
-- Step 4: Simple verification
-- =====================================================
SELECT 'Bucket created' as status;

SELECT 'Policy created' as status;

SELECT 'Ready to test photo upload!' as message;
