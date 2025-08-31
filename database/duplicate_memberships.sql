-- Identify duplicate memberships for the same user
WITH duplicates AS (
  SELECT user_id, COUNT(*) AS count
  FROM memberships
  WHERE status IN ('active', 'pending_approval')
  GROUP BY user_id
  HAVING COUNT(*) > 1
)
SELECT 
  m.id AS membership_id,
  m.user_id,
  m.status,
  m.tier,
  m.start_date,
  m.end_date
FROM memberships m
JOIN duplicates d ON m.user_id = d.user_id;
