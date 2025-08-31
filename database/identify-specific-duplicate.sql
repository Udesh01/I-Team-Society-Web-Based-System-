-- IDENTIFY SPECIFIC DUPLICATE USER - Run this to see the problematic record
-- This targets the user_id from your error: b971cb1f-6217-4926-9292-d96e41a98244

SELECT 
    'SPECIFIC USER DUPLICATE ANALYSIS' as analysis_type,
    'User causing the unique constraint error' as description;

-- Show all memberships for the problematic user
SELECT 
    m.id as membership_id,
    m.user_id,
    m.status,
    m.tier,
    m.amount,
    m.created_at,
    m.updated_at,
    m.start_date,
    m.end_date,
    m.eid,
    p.first_name || ' ' || p.last_name as user_name,
    p.role
FROM memberships m
LEFT JOIN profiles p ON p.id = m.user_id
WHERE m.user_id = 'b971cb1f-6217-4926-9292-d96e41a98244'
ORDER BY m.created_at DESC;

-- Count active/pending memberships for this user
SELECT 
    'Active/Pending Count' as check_type,
    COUNT(*) as count,
    'Number of active or pending memberships for this user' as description
FROM memberships
WHERE user_id = 'b971cb1f-6217-4926-9292-d96e41a98244'
  AND status IN ('active', 'pending_approval');

-- Show which records should be kept vs superseded
WITH ranked_memberships AS (
    SELECT 
        id,
        user_id,
        status,
        tier,
        created_at,
        ROW_NUMBER() OVER (
            PARTITION BY user_id 
            ORDER BY 
                CASE WHEN status = 'active' THEN 1 
                     WHEN status = 'pending_approval' THEN 2 
                     ELSE 3 END,
                created_at DESC
        ) as priority_rank
    FROM memberships
    WHERE user_id = 'b971cb1f-6217-4926-9292-d96e41a98244'
      AND status IN ('active', 'pending_approval')
)
SELECT 
    id as membership_id,
    status,
    tier,
    created_at,
    CASE 
        WHEN priority_rank = 1 THEN '✅ KEEP (Most recent/active)'
        ELSE '❌ MARK AS SUPERSEDED'
    END as recommended_action,
    priority_rank
FROM ranked_memberships
ORDER BY priority_rank;

-- Recommended fix for this specific user
SELECT 
    'RECOMMENDED FIX' as section,
    'Run the UPDATE command below to fix this specific duplicate' as instruction;

-- This will mark the older membership as superseded
SELECT 
    'UPDATE memberships SET status = ''superseded'', updated_at = NOW() WHERE id = ''' || id || ''';' as sql_command
FROM (
    SELECT 
        id,
        ROW_NUMBER() OVER (
            PARTITION BY user_id 
            ORDER BY 
                CASE WHEN status = 'active' THEN 1 
                     WHEN status = 'pending_approval' THEN 2 
                     ELSE 3 END,
                created_at DESC
        ) as priority_rank
    FROM memberships
    WHERE user_id = 'b971cb1f-6217-4926-9292-d96e41a98244'
      AND status IN ('active', 'pending_approval')
) ranked
WHERE priority_rank > 1;
