-- Fix Notifications Table Script

-- Check if notifications table exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'notifications'
  ) THEN
    -- Create notifications table if it doesn't exist
    CREATE TABLE notifications (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      message TEXT,
      type TEXT DEFAULT 'info',
      read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    RAISE NOTICE 'Created notifications table';
  ELSE
    RAISE NOTICE 'Notifications table already exists';
  END IF;
END $$;

-- Check and fix column names
DO $$ 
BEGIN
  -- Check if is_read column exists (old name) and read column doesn't exist
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'is_read'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'read'
  ) THEN
    -- Rename is_read to read
    ALTER TABLE notifications RENAME COLUMN is_read TO read;
    RAISE NOTICE 'Renamed is_read column to read';
  END IF;
  
  -- Add read column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'read'
  ) THEN
    ALTER TABLE notifications ADD COLUMN read BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'Added read column to notifications table';
  END IF;
  
  -- Add type column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'type'
  ) THEN
    ALTER TABLE notifications ADD COLUMN type TEXT DEFAULT 'info';
    RAISE NOTICE 'Added type column to notifications table';
  END IF;
END $$;

-- Add RLS policies if they don't exist
DO $$ 
BEGIN
  -- Check if RLS is enabled
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'notifications' AND rowsecurity = true
  ) THEN
    ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'Enabled RLS on notifications table';
  END IF;
  
  -- Add select policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'notifications' AND policyname = 'Users can view their own notifications'
  ) THEN
    CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);
    RAISE NOTICE 'Added select policy for notifications';
  END IF;
  
  -- Add update policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'notifications' AND policyname = 'Users can update their own notifications'
  ) THEN
    CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);
    RAISE NOTICE 'Added update policy for notifications';
  END IF;
  
  -- Add insert policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'notifications' AND policyname = 'System can insert notifications'
  ) THEN
    CREATE POLICY "System can insert notifications" ON notifications
    FOR INSERT WITH CHECK (true);
    RAISE NOTICE 'Added insert policy for notifications';
  END IF;
  
  -- Add delete policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'notifications' AND policyname = 'Users can delete their own notifications'
  ) THEN
    CREATE POLICY "Users can delete their own notifications" ON notifications
    FOR DELETE USING (auth.uid() = user_id);
    RAISE NOTICE 'Added delete policy for notifications';
  END IF;
END $$;

-- Add indexes for better performance
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'notifications' AND indexname = 'idx_notifications_user_id'
  ) THEN
    CREATE INDEX idx_notifications_user_id ON notifications(user_id);
    RAISE NOTICE 'Added user_id index for notifications';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'notifications' AND indexname = 'idx_notifications_read'
  ) THEN
    CREATE INDEX idx_notifications_read ON notifications(read);
    RAISE NOTICE 'Added read index for notifications';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'notifications' AND indexname = 'idx_notifications_created_at'
  ) THEN
    CREATE INDEX idx_notifications_created_at ON notifications(created_at);
    RAISE NOTICE 'Added created_at index for notifications';
  END IF;
END $$;

-- Verify the notifications table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM 
  information_schema.columns
WHERE 
  table_name = 'notifications'
ORDER BY 
  ordinal_position;

-- Verify RLS policies
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual
FROM 
  pg_policies
WHERE 
  tablename = 'notifications';

-- Verify indexes
SELECT 
  indexname, 
  indexdef
FROM 
  pg_indexes
WHERE 
  tablename = 'notifications';

-- Test notification insertion
INSERT INTO notifications (
  user_id, 
  title, 
  message, 
  type, 
  read
)
VALUES (
  (SELECT id FROM profiles LIMIT 1), -- Get a valid user ID
  'Test Notification',
  'This is a test notification to verify the notifications table is working correctly.',
  'info',
  false
)
RETURNING *;
