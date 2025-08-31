-- FIX PAYMENT AND NOTIFICATION ERRORS
-- This script fixes the payment status constraint and notifications column issues
-- Run this in Supabase SQL Editor

SELECT '🔧 FIXING PAYMENT AND NOTIFICATION ERRORS...' as status;

-- =====================================================
-- 1. INVESTIGATE CURRENT PAYMENT CONSTRAINTS
-- =====================================================

SELECT 'Step 1: Investigating payment table constraints...' as action;

-- Check current payment table structure and constraints
SELECT 
  'Current Payment Constraints' as check_type,
  tc.constraint_name,
  tc.constraint_type,
  cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc 
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'payments' 
  AND tc.constraint_type = 'CHECK';

-- Check payment table columns
SELECT 
  'Payment Table Columns' as check_type,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'payments' 
ORDER BY ordinal_position;

-- =====================================================
-- 2. FIX PAYMENT STATUS CONSTRAINT
-- =====================================================

SELECT 'Step 2: Fixing payment status constraint...' as action;

-- Drop existing status check constraint if it exists
DO $$ 
BEGIN
  -- Find and drop existing check constraint on status
  IF EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name LIKE '%payments_status_check%'
  ) THEN
    -- Get the exact constraint name
    DECLARE
      constraint_name_var TEXT;
    BEGIN
      SELECT constraint_name INTO constraint_name_var
      FROM information_schema.check_constraints 
      WHERE constraint_name LIKE '%payments_status_check%'
      LIMIT 1;
      
      IF constraint_name_var IS NOT NULL THEN
        EXECUTE 'ALTER TABLE payments DROP CONSTRAINT ' || constraint_name_var;
        RAISE NOTICE 'Dropped existing payment status constraint: %', constraint_name_var;
      END IF;
    END;
  END IF;
END $$;

-- Create proper payment status check constraint
-- Based on code analysis, valid statuses are: "pending", "verified", "rejected", "approved"
ALTER TABLE payments 
ADD CONSTRAINT payments_status_check 
CHECK (status IN ('pending', 'verified', 'rejected', 'approved'));

-- Ensure status column exists and has proper default
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' AND column_name = 'status'
  ) THEN
    ALTER TABLE payments ADD COLUMN status TEXT DEFAULT 'pending';
    RAISE NOTICE 'Added status column to payments table';
  END IF;
END $$;

-- =====================================================
-- 3. FIX NOTIFICATIONS COLUMN ISSUE
-- =====================================================

SELECT 'Step 3: Fixing notifications column issue...' as action;

-- Check current notifications table structure
SELECT 
  'Notifications Table Columns' as check_type,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'notifications' 
ORDER BY ordinal_position;

-- Fix notifications table column names
DO $$ 
BEGIN
  -- If table has is_read column but not read column, rename it
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'is_read'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'read'
  ) THEN
    ALTER TABLE notifications RENAME COLUMN is_read TO read;
    RAISE NOTICE 'Renamed is_read column to read in notifications table';
  END IF;

  -- If table doesn't have read column at all, add it
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'read'
  ) THEN
    ALTER TABLE notifications ADD COLUMN read BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'Added read column to notifications table';
  END IF;

  -- Ensure type column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'type'
  ) THEN
    ALTER TABLE notifications ADD COLUMN type TEXT DEFAULT 'info';
    RAISE NOTICE 'Added type column to notifications table';
  END IF;
END $$;

-- =====================================================
-- 4. ADD MISSING PAYMENT COLUMNS IF NEEDED
-- =====================================================

SELECT 'Step 4: Ensuring payment table has all required columns...' as action;

DO $$ 
BEGIN
  -- Add verified_by column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' AND column_name = 'verified_by'
  ) THEN
    ALTER TABLE payments ADD COLUMN verified_by UUID REFERENCES profiles(id);
    RAISE NOTICE 'Added verified_by column to payments table';
  END IF;

  -- Add verified_at column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' AND column_name = 'verified_at'
  ) THEN
    ALTER TABLE payments ADD COLUMN verified_at TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE 'Added verified_at column to payments table';
  END IF;

  -- Add verification_notes column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' AND column_name = 'verification_notes'
  ) THEN
    ALTER TABLE payments ADD COLUMN verification_notes TEXT;
    RAISE NOTICE 'Added verification_notes column to payments table';
  END IF;

  -- Add payment_method column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE payments ADD COLUMN payment_method TEXT;
    RAISE NOTICE 'Added payment_method column to payments table';
  END IF;

  -- Add payment_date column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' AND column_name = 'payment_date'
  ) THEN
    ALTER TABLE payments ADD COLUMN payment_date TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE 'Added payment_date column to payments table';
  END IF;
END $$;

-- =====================================================
-- 5. UPDATE ANY INVALID PAYMENT STATUSES
-- =====================================================

SELECT 'Step 5: Fixing invalid payment statuses...' as action;

-- Update any invalid statuses to 'pending'
UPDATE payments 
SET status = 'pending' 
WHERE status NOT IN ('pending', 'verified', 'rejected', 'approved') 
   OR status IS NULL;

-- =====================================================
-- 6. VERIFY THE FIXES
-- =====================================================

SELECT 'Step 6: Verifying the fixes...' as action;

-- Check payment constraint is working
SELECT 
  'Payment Constraint Check' as test,
  tc.constraint_name,
  cc.check_clause,
  '✅ CONSTRAINT CREATED' as status
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'payments' 
  AND tc.constraint_type = 'CHECK'
  AND tc.constraint_name = 'payments_status_check';

-- Check notifications table has correct columns
SELECT 
  'Notifications Columns Check' as test,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'notifications' AND column_name = 'read'
    ) THEN '✅ READ COLUMN EXISTS'
    ELSE '❌ READ COLUMN MISSING'
  END as read_column_status,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'notifications' AND column_name = 'type'
    ) THEN '✅ TYPE COLUMN EXISTS'
    ELSE '❌ TYPE COLUMN MISSING'
  END as type_column_status;

-- =====================================================
-- 7. TEST THE FIXES
-- =====================================================

SELECT 'Step 7: Testing the fixes...' as action;

-- Test payment status constraint
DO $$
DECLARE
  test_result TEXT;
BEGIN
  -- Try to insert an invalid status (should fail)
  BEGIN
    INSERT INTO payments (user_id, amount, status) 
    VALUES (
      (SELECT id FROM profiles LIMIT 1), 
      100.00, 
      'invalid_status'
    );
    test_result := '❌ CONSTRAINT NOT WORKING - Invalid status was accepted';
  EXCEPTION
    WHEN check_violation THEN
      test_result := '✅ CONSTRAINT WORKING - Invalid status rejected correctly';
    WHEN OTHERS THEN
      test_result := '⚠️ OTHER ERROR: ' || SQLERRM;
  END;
  
  RAISE NOTICE 'Payment Status Constraint Test: %', test_result;
END $$;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

SELECT '🎉 PAYMENT AND NOTIFICATION FIXES COMPLETED!' as result;
SELECT 'Payment status constraint fixed with valid values: pending, verified, rejected, approved' as payment_fix;
SELECT 'Notifications table now uses read column instead of is_read' as notification_fix;
SELECT 'Try updating payments and checking notifications now - errors should be resolved!' as next_action;

-- =====================================================
-- FINAL STATUS CHECK
-- =====================================================

-- Show final table structures
SELECT 'FINAL PAYMENT TABLE STRUCTURE' as info;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'payments' 
ORDER BY ordinal_position;

SELECT 'FINAL NOTIFICATIONS TABLE STRUCTURE' as info;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'notifications' 
ORDER BY ordinal_position;