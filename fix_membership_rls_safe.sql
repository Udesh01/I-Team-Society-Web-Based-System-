-- Safe Membership and Payments RLS Policies Fix
-- This version handles existing policies gracefully

-- Enable RLS on memberships and payments tables
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Function to safely create policies (drop if exists, then create)
DO $$ 
DECLARE
    policy_names TEXT[] := ARRAY[
        'Users can view own memberships',
        'Users can create own memberships', 
        'Users can update own memberships',
        'Admins can view all memberships',
        'Admins can update all memberships',
        'Staff can view all memberships',
        'Staff can update all memberships'
    ];
    policy_name TEXT;
BEGIN
    -- Drop existing membership policies
    FOREACH policy_name IN ARRAY policy_names
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON memberships', policy_name);
    END LOOP;
    
    -- Drop existing payment policies
    policy_names := ARRAY[
        'Users can view own payments',
        'Users can create own payments',
        'Users can update own payments', 
        'Admins can view all payments',
        'Admins can update all payments',
        'Staff can view all payments',
        'Staff can update all payments'
    ];
    
    FOREACH policy_name IN ARRAY policy_names
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON payments', policy_name);
    END LOOP;
    
    RAISE NOTICE 'Existing policies dropped successfully';
END $$;

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
  permissive
FROM pg_policies
WHERE tablename = 'memberships'
ORDER BY policyname;

SELECT 
  'PAYMENTS POLICIES:' as table_info,
  policyname, 
  cmd as operation,
  permissive
FROM pg_policies
WHERE tablename = 'payments'
ORDER BY policyname;

-- Test basic functionality
DO $$
DECLARE
  membership_policies_count INTEGER;
  payments_policies_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO membership_policies_count FROM pg_policies WHERE tablename = 'memberships';
  SELECT COUNT(*) INTO payments_policies_count FROM pg_policies WHERE tablename = 'payments';
  
  RAISE NOTICE '=== RLS POLICY SETUP COMPLETE ===';
  RAISE NOTICE 'Memberships policies created: %', membership_policies_count;
  RAISE NOTICE 'Payments policies created: %', payments_policies_count;
  RAISE NOTICE 'Users should now be able to apply for memberships';
  RAISE NOTICE 'Admins and staff can manage membership applications';
  RAISE NOTICE 'Please test the membership application functionality';
  RAISE NOTICE '=== END ===';
END $$;
