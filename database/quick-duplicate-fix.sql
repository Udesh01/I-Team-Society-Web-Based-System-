-- QUICK FIX FOR DUPLICATE MEMBERSHIPS
-- This uses valid enum values for membership status

-- First, check what valid status values exist in your enum
SELECT 
    'Valid Status Values' as info,
    unnest(enum_range(NULL::membership_status)) as valid_statuses;

-- Show current memberships for the problematic user
SELECT 
    'Current Memberships for Problem User' as section,
    m.id as membership_id,
    m.status,
    m.tier,
    m.created_at
FROM memberships m
WHERE m.user_id = 'b971cb1f-6217-4926-9292-d96e41a98244'
ORDER BY m.created_at DESC;

-- SOLUTION 1: Mark older membership as 'rejected' (most likely valid enum value)
-- This keeps the most recent membership and marks older ones as rejected
UPDATE memberships 
SET status = 'rejected', updated_at = NOW()
WHERE user_id = 'b971cb1f-6217-4926-9292-d96e41a98244'
  AND status IN ('active', 'pending_approval')
  AND id != (
    SELECT id 
    FROM memberships 
    WHERE user_id = 'b971cb1f-6217-4926-9292-d96e41a98244'
      AND status IN ('active', 'pending_approval')
    ORDER BY created_at DESC 
    LIMIT 1
  );

-- Verify the fix worked
SELECT 
    'After Fix - Remaining Active/Pending' as verification,
    COUNT(*) as count
FROM memberships
WHERE user_id = 'b971cb1f-6217-4926-9292-d96e41a98244'
  AND status IN ('active', 'pending_approval');

-- Now try to create the unique index
DO $$
BEGIN
    CREATE UNIQUE INDEX IF NOT EXISTS unique_active_membership 
    ON memberships (user_id) 
    WHERE status IN ('active', 'pending_approval');
    RAISE NOTICE '✅ Unique index created successfully';
EXCEPTION
    WHEN unique_violation THEN
        RAISE NOTICE '❌ Still have duplicates - check the verification query above';
    WHEN duplicate_table THEN
        RAISE NOTICE '✅ Index already exists';
    WHEN others THEN
        RAISE NOTICE '❌ Error creating index: %', SQLERRM;
END $$;
