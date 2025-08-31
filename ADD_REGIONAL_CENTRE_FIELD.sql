-- ADD REGIONAL CENTRE FIELD TO REGISTRATION FORMS
-- This script adds the regional_centre column to student_details and staff_details tables
-- Run this in Supabase SQL Editor

SELECT '🔧 ADDING REGIONAL CENTRE FIELD...' as status;

-- =====================================================
-- 1. CHECK CURRENT TABLE STRUCTURES
-- =====================================================

SELECT 'Step 1: Checking current table structures...' as action;

-- Check student_details columns
SELECT 
  'Student Details Columns' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'student_details' 
ORDER BY ordinal_position;

-- Check staff_details columns
SELECT 
  'Staff Details Columns' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'staff_details' 
ORDER BY ordinal_position;

-- =====================================================
-- 2. ADD REGIONAL_CENTRE COLUMN TO STUDENT_DETAILS
-- =====================================================

SELECT 'Step 2: Adding regional_centre column to student_details...' as action;

-- Add regional_centre column to student_details if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'student_details' AND column_name = 'regional_centre'
  ) THEN
    ALTER TABLE student_details 
    ADD COLUMN regional_centre TEXT CHECK (
      regional_centre IN (
        'CRC', 'BRC', 'KRC', 'Jaffna', 'Matara', 
        'Anuradhapura', 'Hatton', 'Galle', 'Puttalam'
      )
    );
    RAISE NOTICE 'Added regional_centre column to student_details table';
  ELSE
    RAISE NOTICE 'regional_centre column already exists in student_details table';
  END IF;
END $$;

-- =====================================================
-- 3. ADD REGIONAL_CENTRE COLUMN TO STAFF_DETAILS
-- =====================================================

SELECT 'Step 3: Adding regional_centre column to staff_details...' as action;

-- Add regional_centre column to staff_details if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'staff_details' AND column_name = 'regional_centre'
  ) THEN
    ALTER TABLE staff_details 
    ADD COLUMN regional_centre TEXT CHECK (
      regional_centre IN (
        'CRC', 'BRC', 'KRC', 'Jaffna', 'Matara', 
        'Anuradhapura', 'Hatton', 'Galle', 'Puttalam'
      )
    );
    RAISE NOTICE 'Added regional_centre column to staff_details table';
  ELSE
    RAISE NOTICE 'regional_centre column already exists in staff_details table';
  END IF;
END $$;

-- =====================================================
-- 4. VERIFY THE ADDITIONS
-- =====================================================

SELECT 'Step 4: Verifying the additions...' as action;

-- Check that regional_centre column exists in student_details
SELECT 
  'Student Details - Regional Centre Check' as test,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'student_details' AND column_name = 'regional_centre'
    ) THEN '✅ REGIONAL_CENTRE COLUMN ADDED'
    ELSE '❌ REGIONAL_CENTRE COLUMN MISSING'
  END as status;

-- Check that regional_centre column exists in staff_details
SELECT 
  'Staff Details - Regional Centre Check' as test,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'staff_details' AND column_name = 'regional_centre'
    ) THEN '✅ REGIONAL_CENTRE COLUMN ADDED'
    ELSE '❌ REGIONAL_CENTRE COLUMN MISSING'
  END as status;

-- =====================================================
-- 5. CHECK CONSTRAINTS
-- =====================================================

SELECT 'Step 5: Checking constraints...' as action;

-- Check constraints for regional_centre columns
SELECT 
  'Regional Centre Constraints' as check_type,
  tc.table_name,
  tc.constraint_name,
  cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name IN ('student_details', 'staff_details')
  AND cc.check_clause LIKE '%regional_centre%';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

SELECT '🎉 REGIONAL CENTRE FIELD ADDITION COMPLETED!' as result;
SELECT 'Added regional_centre column to both student_details and staff_details tables' as modification;
SELECT 'Valid values: CRC, BRC, KRC, Jaffna, Matara, Anuradhapura, Hatton, Galle, Puttalam' as valid_values;
SELECT 'Now update the registration forms to include the Regional Centre dropdown!' as next_action;

-- =====================================================
-- FINAL TABLE STRUCTURES
-- =====================================================

SELECT 'FINAL STUDENT_DETAILS TABLE STRUCTURE' as info;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'student_details' 
ORDER BY ordinal_position;

SELECT 'FINAL STAFF_DETAILS TABLE STRUCTURE' as info;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'staff_details' 
ORDER BY ordinal_position;