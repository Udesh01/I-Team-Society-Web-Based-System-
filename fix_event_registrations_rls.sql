-- Fix Event Registrations RLS Policies

-- Enable RLS on event_registrations table
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for event_registrations
DROP POLICY IF EXISTS "Users can view own registrations" ON event_registrations;
DROP POLICY IF EXISTS "Users can register for events" ON event_registrations;
DROP POLICY IF EXISTS "Users can update own registrations" ON event_registrations;
DROP POLICY IF EXISTS "Users can delete own registrations" ON event_registrations;
DROP POLICY IF EXISTS "Event creators can view registrations" ON event_registrations;
DROP POLICY IF EXISTS "Event creators can update registrations" ON event_registrations;
DROP POLICY IF EXISTS "Admins can manage all registrations" ON event_registrations;
DROP POLICY IF EXISTS "Staff can manage all registrations" ON event_registrations;

-- Create new comprehensive policies for event_registrations

-- 1. Users can view their own registrations
CREATE POLICY "Users can view own registrations" ON event_registrations
FOR SELECT USING (auth.uid() = user_id);

-- 2. Users can register for events (INSERT)
CREATE POLICY "Users can register for events" ON event_registrations
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. Users can update their own registrations
CREATE POLICY "Users can update own registrations" ON event_registrations
FOR UPDATE USING (auth.uid() = user_id);

-- 4. Users can delete their own registrations (unregister)
CREATE POLICY "Users can delete own registrations" ON event_registrations
FOR DELETE USING (auth.uid() = user_id);

-- 5. Event creators can view registrations for their events
CREATE POLICY "Event creators can view registrations" ON event_registrations
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM events 
    WHERE events.id = event_registrations.event_id 
    AND events.created_by = auth.uid()
  )
);

-- 6. Event creators can update registrations for their events (mark attendance)
CREATE POLICY "Event creators can update registrations" ON event_registrations
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM events 
    WHERE events.id = event_registrations.event_id 
    AND events.created_by = auth.uid()
  )
);

-- 7. Admins can do everything with registrations
CREATE POLICY "Admins can manage all registrations" ON event_registrations
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- 8. Staff can do everything with registrations
CREATE POLICY "Staff can manage all registrations" ON event_registrations
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'staff')
  )
);

-- Verify the policies were created
SELECT 
  policyname, 
  cmd, 
  permissive,
  qual,
  with_check
FROM 
  pg_policies
WHERE 
  tablename = 'event_registrations'
ORDER BY 
  policyname;

-- Test the policies with a sample query (this should work for authenticated users)
-- Note: This will only work when run by an authenticated user
DO $$
BEGIN
  RAISE NOTICE 'Event registrations RLS policies have been updated';
  RAISE NOTICE 'Users should now be able to register for events';
  RAISE NOTICE 'Event creators and admins can manage registrations';
END $$;
