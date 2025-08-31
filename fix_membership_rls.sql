-- Fix Membership and Payments RLS Policies

-- Enable RLS on memberships and payments tables
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for memberships
DROP POLICY IF EXISTS "Users can view own memberships" ON memberships;
DROP POLICY IF EXISTS "Users can insert own memberships" ON memberships;
DROP POLICY IF EXISTS "Users can update own memberships" ON memberships;
DROP POLICY IF EXISTS "Admins can view all memberships" ON memberships;
DROP POLICY IF EXISTS "Admins can update all memberships" ON memberships;
DROP POLICY IF EXISTS "Staff can manage all memberships" ON memberships;
DROP POLICY IF EXISTS "Enable read access for users to own memberships" ON memberships;
DROP POLICY IF EXISTS "Enable insert access for users to create memberships" ON memberships;
DROP POLICY IF EXISTS "Enable update access for users to own memberships" ON memberships;
DROP POLICY IF EXISTS "Enable read access for admins to all memberships" ON memberships;
DROP POLICY IF EXISTS "Enable update access for admins to all memberships" ON memberships;
DROP POLICY IF EXISTS "Enable all access for staff to memberships" ON memberships;

-- Drop existing policies for payments
DROP POLICY IF EXISTS "Users can view own payments" ON payments;
DROP POLICY IF EXISTS "Users can insert own payments" ON payments;
DROP POLICY IF EXISTS "Users can update own payments" ON payments;
DROP POLICY IF EXISTS "Admins can view all payments" ON payments;
DROP POLICY IF EXISTS "Admins can update all payments" ON payments;
DROP POLICY IF EXISTS "Staff can manage all payments" ON payments;
DROP POLICY IF EXISTS "Enable read access for users to own payments" ON payments;
DROP POLICY IF EXISTS "Enable insert access for users to create payments" ON payments;
DROP POLICY IF EXISTS "Enable read access for admins to all payments" ON payments;
DROP POLICY IF EXISTS "Enable update access for admins to all payments" ON payments;
DROP POLICY IF EXISTS "Enable all access for staff to payments" ON payments;

-- Create comprehensive memberships policies

-- 1. Users can view their own memberships
CREATE POLICY "Users can view own memberships" ON memberships
FOR SELECT USING (auth.uid() = user_id);

-- 2. Users can create their own memberships (apply for membership)
CREATE POLICY "Users can create own memberships" ON memberships
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. Users can update their own memberships (limited updates)
CREATE POLICY "Users can update own memberships" ON memberships
FOR UPDATE USING (auth.uid() = user_id);

-- 4. Admins can view all memberships
CREATE POLICY "Admins can view all memberships" ON memberships
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- 5. Admins can update all memberships (approve/reject)
CREATE POLICY "Admins can update all memberships" ON memberships
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- 6. Staff can view and update all memberships
CREATE POLICY "Staff can view all memberships" ON memberships
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'staff')
  )
);

CREATE POLICY "Staff can update all memberships" ON memberships
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'staff')
  )
);

-- Create comprehensive payments policies

-- 1. Users can view their own payments
CREATE POLICY "Users can view own payments" ON payments
FOR SELECT USING (auth.uid() = user_id);

-- 2. Users can create their own payments
CREATE POLICY "Users can create own payments" ON payments
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. Users can update their own payments (limited updates)
CREATE POLICY "Users can update own payments" ON payments
FOR UPDATE USING (auth.uid() = user_id);

-- 4. Admins can view all payments
CREATE POLICY "Admins can view all payments" ON payments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- 5. Admins can update all payments (verify/approve)
CREATE POLICY "Admins can update all payments" ON payments
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- 6. Staff can view and update all payments
CREATE POLICY "Staff can view all payments" ON payments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'staff')
  )
);

CREATE POLICY "Staff can update all payments" ON payments
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'staff')
  )
);

-- Verify the policies were created
SELECT 
  'MEMBERSHIPS POLICIES:' as table_info,
  policyname, 
  cmd as operation,
  permissive,
  qual as using_condition,
  with_check as check_condition
FROM pg_policies
WHERE tablename = 'memberships'
ORDER BY policyname;

SELECT 
  'PAYMENTS POLICIES:' as table_info,
  policyname, 
  cmd as operation,
  permissive,
  qual as using_condition,
  with_check as check_condition
FROM pg_policies
WHERE tablename = 'payments'
ORDER BY policyname;

-- Test basic functionality
DO $$
BEGIN
  RAISE NOTICE 'Membership and Payment RLS policies have been updated';
  RAISE NOTICE 'Users should now be able to apply for memberships';
  RAISE NOTICE 'Admins and staff can manage membership applications';
  RAISE NOTICE 'Please test the membership application functionality';
END $$;
