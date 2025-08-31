-- Create storage bucket for event images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-images',
  'event-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
);

-- Set up RLS policies for event images bucket
CREATE POLICY "Public can view event images" ON storage.objects
FOR SELECT USING (bucket_id = 'event-images');

CREATE POLICY "Authenticated users can upload event images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'event-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own event images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'event-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own event images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'event-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Add missing columns to events table
DO $$
BEGIN
  -- Add banner_image column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'banner_image'
  ) THEN
    ALTER TABLE events ADD COLUMN banner_image TEXT;
  END IF;

  -- Add event_type column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'event_type'
  ) THEN
    ALTER TABLE events ADD COLUMN event_type TEXT;
  END IF;

  -- Add requirements column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'requirements'
  ) THEN
    ALTER TABLE events ADD COLUMN requirements TEXT;
  END IF;

  -- Add contact_info column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'contact_info'
  ) THEN
    ALTER TABLE events ADD COLUMN contact_info TEXT;
  END IF;
END $$;

-- Add comments to the new columns
COMMENT ON COLUMN events.banner_image IS 'URL to the event banner image stored in Supabase Storage';
COMMENT ON COLUMN events.event_type IS 'Type of event (workshop, seminar, conference, etc.)';
COMMENT ON COLUMN events.requirements IS 'Prerequisites or requirements for the event';
COMMENT ON COLUMN events.contact_info IS 'Contact information for event inquiries';
