-- Fix Payments Table Schema
-- This script ensures the payments table has the correct columns

-- Check current payments table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'payments' 
ORDER BY ordinal_position;

-- Add missing columns if they don't exist
DO $$ 
BEGIN
  -- Check if payment_method column exists and add it if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE payments ADD COLUMN payment_method TEXT;
    RAISE NOTICE 'Added payment_method column to payments table';
  ELSE
    RAISE NOTICE 'payment_method column already exists';
  END IF;
  
  -- Check if receipt_url column exists and add it if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' AND column_name = 'receipt_url'
  ) THEN
    ALTER TABLE payments ADD COLUMN receipt_url TEXT;
    RAISE NOTICE 'Added receipt_url column to payments table';
  ELSE
    RAISE NOTICE 'receipt_url column already exists';
  END IF;
  
  -- Ensure notes column exists (it should based on types.ts)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' AND column_name = 'notes'
  ) THEN
    ALTER TABLE payments ADD COLUMN notes TEXT;
    RAISE NOTICE 'Added notes column to payments table';
  ELSE
    RAISE NOTICE 'notes column already exists';
  END IF;
  
  -- Ensure updated_at column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE payments ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    RAISE NOTICE 'Added updated_at column to payments table';
  ELSE
    RAISE NOTICE 'updated_at column already exists';
  END IF;
  
  -- Fix payment_date column to allow NULL (based on types.ts)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' 
    AND column_name = 'payment_date' 
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE payments ALTER COLUMN payment_date DROP NOT NULL;
    RAISE NOTICE 'Made payment_date column nullable';
  ELSE
    RAISE NOTICE 'payment_date column is already nullable or does not exist';
  END IF;
  
END $$;

-- Create or update the updated_at trigger for payments
CREATE OR REPLACE FUNCTION update_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_payments_updated_at_trigger ON payments;

-- Create the trigger
CREATE TRIGGER update_payments_updated_at_trigger
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_payments_updated_at();

-- Verify the final table structure
SELECT 
  'FINAL PAYMENTS TABLE STRUCTURE:' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'payments' 
ORDER BY ordinal_position;

-- Test basic functionality
DO $$
BEGIN
  RAISE NOTICE '=== PAYMENTS SCHEMA UPDATE COMPLETE ===';
  RAISE NOTICE 'The payments table now has the correct column structure';
  RAISE NOTICE 'You can now test membership applications';
  RAISE NOTICE '=== END ===';
END $$;
