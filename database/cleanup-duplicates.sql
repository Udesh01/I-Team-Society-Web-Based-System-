-- CLEANUP DUPLICATE MEMBERSHIPS - Run this in Supabase SQL Editor
-- This script safely handles duplicate memberships before creating unique constraints

-- =====================================================
-- 1. IDENTIFY AND DISPLAY DUPLICATES (for review)
-- =====================================================

SELECT 
    'DUPLICATE ANALYSIS' as section,
    'Review these duplicates before cleanup' as message;

-- Show duplicate memberships
WITH duplicates AS (
  SELECT user_id, COUNT(*) AS membership_count
  FROM memberships
  WHERE status IN ('active', 'pending_approval')
  GROUP BY user_id
  HAVING COUNT(*) > 1
)
SELECT 
  'Duplicate Found' as issue_type,
  m.id as membership_id,
  m.user_id,
  m.status,
  m.tier,
  m.amount,
  m.created_at,
  m.start_date,
  m.end_date,
  p.first_name || ' ' || p.last_name as user_name
FROM memberships m
JOIN duplicates d ON m.user_id = d.user_id
JOIN profiles p ON p.id = m.user_id
ORDER BY m.user_id, m.created_at DESC;

-- =====================================================
-- 2. SAFE DUPLICATE CLEANUP STRATEGY
-- =====================================================

-- Option A: Keep the most recent membership for each user
-- This will keep the latest created membership and mark older ones as 'rejected' (valid enum value)

UPDATE memberships 
SET status = 'rejected', 
    updated_at = NOW()
WHERE id IN (
    SELECT m1.id 
    FROM memberships m1
    WHERE m1.status IN ('active', 'pending_approval')
    AND EXISTS (
        SELECT 1 
        FROM memberships m2 
        WHERE m2.user_id = m1.user_id 
        AND m2.status IN ('active', 'pending_approval')
        AND m2.created_at > m1.created_at
    )
);

-- =====================================================
-- 3. VERIFY CLEANUP RESULTS
-- =====================================================

-- Check if duplicates still exist
SELECT 
    'CLEANUP VERIFICATION' as section,
    'Check if duplicates are resolved' as message;

WITH remaining_duplicates AS (
  SELECT user_id, COUNT(*) AS membership_count
  FROM memberships
  WHERE status IN ('active', 'pending_approval')
  GROUP BY user_id
  HAVING COUNT(*) > 1
)
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ No duplicates found - safe to create unique index'
    ELSE '❌ ' || COUNT(*) || ' users still have duplicate memberships'
  END as cleanup_status
FROM remaining_duplicates;

-- Show any remaining duplicates
WITH remaining_duplicates AS (
  SELECT user_id, COUNT(*) AS membership_count
  FROM memberships
  WHERE status IN ('active', 'pending_approval')
  GROUP BY user_id
  HAVING COUNT(*) > 1
)
SELECT 
  'Remaining Duplicate' as issue_type,
  m.id as membership_id,
  m.user_id,
  m.status,
  m.tier,
  m.created_at,
  p.first_name || ' ' || p.last_name as user_name
FROM memberships m
JOIN remaining_duplicates rd ON m.user_id = rd.user_id
JOIN profiles p ON p.id = m.user_id
ORDER BY m.user_id, m.created_at DESC;

-- =====================================================
-- 4. CREATE UNIQUE INDEX (only if no duplicates remain)
-- =====================================================

-- This will only succeed if no duplicates exist
DO $$
BEGIN
    -- Check if duplicates exist
    IF EXISTS (
        SELECT 1
        FROM memberships
        WHERE status IN ('active', 'pending_approval')
        GROUP BY user_id
        HAVING COUNT(*) > 1
    ) THEN
        RAISE NOTICE '❌ Cannot create unique index - duplicates still exist';
        RAISE NOTICE 'Run the remaining duplicate queries above to identify issues';
    ELSE
        -- Create the unique index
        CREATE UNIQUE INDEX IF NOT EXISTS unique_active_membership 
        ON memberships (user_id) 
        WHERE status IN ('active', 'pending_approval');
        
        RAISE NOTICE '✅ Unique index created successfully';
    END IF;
EXCEPTION
    WHEN duplicate_table THEN
        RAISE NOTICE '✅ Unique index already exists';
END $$;

-- =====================================================
-- 5. SUMMARY REPORT
-- =====================================================

SELECT 
    'SUMMARY REPORT' as section,
    '' as message;

-- Count memberships by status
SELECT 
    status,
    COUNT(*) as count,
    'Total memberships with this status' as description
FROM memberships
GROUP BY status
ORDER BY status;

-- Check unique constraint
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE indexname = 'unique_active_membership'
        ) 
        THEN '✅ Unique constraint exists'
        ELSE '❌ Unique constraint missing'
    END as unique_constraint_status;

-- Final verification
SELECT 
    'FINAL VERIFICATION' as section,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ No active/pending duplicate memberships'
        ELSE '❌ ' || COUNT(*) || ' users still have duplicate active/pending memberships'
    END as final_status
FROM (
    SELECT user_id
    FROM memberships
    WHERE status IN ('active', 'pending_approval')
    GROUP BY user_id
    HAVING COUNT(*) > 1
) as duplicates;
