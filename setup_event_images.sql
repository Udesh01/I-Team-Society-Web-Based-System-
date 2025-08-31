-- =====================================================
-- I-Team Society: Event Banner Image Setup Script
-- =====================================================
-- Run this script in your Supabase SQL Editor
-- Dashboard > SQL Editor > New Query > Paste this script > Run

-- Step 1: Create storage bucket for event images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-images',
  'event-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Step 2: Set up RLS policies for event images bucket
-- Allow public viewing of event images
CREATE POLICY "Public can view event images" ON storage.objects
FOR SELECT USING (bucket_id = 'event-images');

-- Allow authenticated users to upload event images
CREATE POLICY "Authenticated users can upload event images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'event-images' 
  AND auth.role() = 'authenticated'
);

-- Allow users to update their own event images
CREATE POLICY "Users can update their own event images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'event-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own event images
CREATE POLICY "Users can delete their own event images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'event-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Step 3: Add missing columns to events table
DO $$ 
BEGIN
  -- Add banner_image column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'banner_image'
  ) THEN
    ALTER TABLE events ADD COLUMN banner_image TEXT;
    RAISE NOTICE 'Added banner_image column to events table';
  ELSE
    RAISE NOTICE 'banner_image column already exists';
  END IF;
  
  -- Add event_type column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'event_type'
  ) THEN
    ALTER TABLE events ADD COLUMN event_type TEXT;
    RAISE NOTICE 'Added event_type column to events table';
  ELSE
    RAISE NOTICE 'event_type column already exists';
  END IF;
  
  -- Add requirements column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'requirements'
  ) THEN
    ALTER TABLE events ADD COLUMN requirements TEXT;
    RAISE NOTICE 'Added requirements column to events table';
  ELSE
    RAISE NOTICE 'requirements column already exists';
  END IF;
  
  -- Add contact_info column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'contact_info'
  ) THEN
    ALTER TABLE events ADD COLUMN contact_info TEXT;
    RAISE NOTICE 'Added contact_info column to events table';
  ELSE
    RAISE NOTICE 'contact_info column already exists';
  END IF;
END $$;

-- Step 4: Add comments to the new columns
COMMENT ON COLUMN events.banner_image IS 'URL to the event banner image stored in Supabase Storage';
COMMENT ON COLUMN events.event_type IS 'Type of event (workshop, seminar, conference, etc.)';
COMMENT ON COLUMN events.requirements IS 'Prerequisites or requirements for the event';
COMMENT ON COLUMN events.contact_info IS 'Contact information for event inquiries';

-- Step 5: Add attendance tracking columns to event_registrations table
DO $$
BEGIN
  -- Add attended column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'event_registrations' AND column_name = 'attended'
  ) THEN
    ALTER TABLE event_registrations ADD COLUMN attended BOOLEAN DEFAULT NULL;
    RAISE NOTICE 'Added attended column to event_registrations table';
  ELSE
    RAISE NOTICE 'attended column already exists';
  END IF;

  -- Add attended_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'event_registrations' AND column_name = 'attended_at'
  ) THEN
    ALTER TABLE event_registrations ADD COLUMN attended_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
    RAISE NOTICE 'Added attended_at column to event_registrations table';
  ELSE
    RAISE NOTICE 'attended_at column already exists';
  END IF;
END $$;

-- Add comments to attendance tracking columns
COMMENT ON COLUMN event_registrations.attended IS 'Whether the user attended the event (null = pending, true = attended, false = absent)';
COMMENT ON COLUMN event_registrations.attended_at IS 'Timestamp when attendance was marked';

-- Step 6: Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT DEFAULT 'info',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" ON notifications
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON notifications
FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can delete their own notifications" ON notifications
FOR DELETE USING (auth.uid() = user_id);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Add comments to notifications table
COMMENT ON TABLE notifications IS 'User notifications system';
COMMENT ON COLUMN notifications.user_id IS 'Reference to the user who should receive the notification';
COMMENT ON COLUMN notifications.title IS 'Notification title/subject';
COMMENT ON COLUMN notifications.message IS 'Notification content/body';
COMMENT ON COLUMN notifications.type IS 'Notification type (info, success, warning, error)';
COMMENT ON COLUMN notifications.read IS 'Whether the notification has been read';

-- Step 7: Verify the setup
SELECT 
  'Setup completed successfully!' as status,
  'event-images bucket created' as storage_bucket,
  'RLS policies applied' as security,
  'New columns added to events table' as database_changes;

-- Check if bucket was created successfully
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'event-images';

-- Check if columns were added successfully
SELECT
  'events' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'events'
  AND column_name IN ('banner_image', 'event_type', 'requirements', 'contact_info')

UNION ALL

SELECT
  'event_registrations' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'event_registrations'
  AND column_name IN ('attended', 'attended_at')
ORDER BY table_name, column_name;
