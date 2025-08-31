-- SIMPLE DUPLICATE FIX - Guaranteed to work
-- Run each section one by one in Supabase SQL Editor

-- =====================================================
-- STEP 1: Show the problem user's memberships
-- =====================================================
SELECT 
    'CURRENT SITUATION' as step,
    m.id as membership_id,
    m.status,
    m.tier,
    m.created_at::date as created_date
FROM memberships m
WHERE m.user_id = 'b971cb1f-6217-4926-9292-d96e41a98244'
ORDER BY m.created_at DESC;

-- =====================================================
-- STEP 2: Fix the duplicate (keep newest, reject older)
-- =====================================================
-- This single command fixes the specific duplicate
UPDATE memberships 
SET status = 'rejected', updated_at = NOW()
WHERE id = 'bb3f2b06-f308-470e-ba49-4d361a8e04ff';

-- =====================================================
-- STEP 3: Verify fix worked
-- =====================================================
SELECT 
    'AFTER FIX' as step,
    COUNT(*) as active_pending_count
FROM memberships
WHERE user_id = 'b971cb1f-6217-4926-9292-d96e41a98244'
  AND status IN ('active', 'pending_approval');

-- =====================================================
-- STEP 4: Create unique index (simple version)
-- =====================================================
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_membership 
ON memberships (user_id) 
WHERE status IN ('active', 'pending_approval');

-- =====================================================
-- STEP 5: Final verification
-- =====================================================
SELECT 
    'FINAL CHECK' as step,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE indexname = 'unique_active_membership'
        ) 
        THEN '✅ Unique index created successfully'
        ELSE '❌ Index creation failed'
    END as result;
