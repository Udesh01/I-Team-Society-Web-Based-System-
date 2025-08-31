-- ULTRA SIMPLE STORAGE FIX
-- Just drop the existing policy and recreate it

-- Drop the policy that already exists
DROP POLICY IF EXISTS "temp_allow_all" ON storage.objects;

-- Make sure bucket exists and is public
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

-- Create the policy with a unique name
CREATE POLICY "allow_profile_photo_access" ON storage.objects
FOR ALL USING (bucket_id = 'profile_photos');

-- Simple verification
SELECT 'Storage setup complete - try uploading now!' as message;
