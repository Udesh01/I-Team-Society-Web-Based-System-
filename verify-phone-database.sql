-- Database Verification Script for Phone Number Profile Updates
-- This script verifies that phone numbers are stored correctly in the database
-- without any validation or transformation.

-- =============================================================================
-- 1. Check Database Schema for Phone Number Field
-- =============================================================================

-- Check if phone_number column exists and its properties
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    character_maximum_length,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name = 'phone_number';

-- Expected results:
-- - data_type: text, varchar, or character varying
-- - is_nullable: YES (should allow NULL values)
-- - No constraints that would block arbitrary text

-- =============================================================================
-- 2. View Current Profile Data Structure  
-- =============================================================================

-- Check current profile table structure
\d profiles;

-- Alternative for non-PostgreSQL databases:
-- DESCRIBE profiles;
-- SHOW COLUMNS FROM profiles;

-- =============================================================================
-- 3. Test Data Insertion (Simulation)
-- =============================================================================

-- NOTE: These are test queries to verify database accepts arbitrary phone values
-- Do NOT run these on production data!

-- Test Case 1: Insert profile with "abc" phone number
-- INSERT INTO profiles (id, first_name, last_name, phone_number, role) 
-- VALUES ('test-user-1', 'Test', 'User', 'abc', 'student');

-- Test Case 2: Insert profile with "123-xyz" phone number  
-- INSERT INTO profiles (id, first_name, last_name, phone_number, role)
-- VALUES ('test-user-2', 'Test', 'User', '123-xyz', 'student');

-- Test Case 3: Insert profile with empty phone number
-- INSERT INTO profiles (id, first_name, last_name, phone_number, role)
-- VALUES ('test-user-3', 'Test', 'User', NULL, 'student');

-- Test Case 4: Insert profile with special characters
-- INSERT INTO profiles (id, first_name, last_name, phone_number, role)
-- VALUES ('test-user-4', 'Test', 'User', '!@#$%^&*()', 'student');

-- =============================================================================
-- 4. Verify Existing Phone Number Data
-- =============================================================================

-- Check all phone numbers in the system to see current data patterns
SELECT 
    id,
    first_name,
    last_name,
    phone_number,
    LENGTH(phone_number) as phone_length,
    updated_at
FROM profiles 
WHERE phone_number IS NOT NULL
ORDER BY updated_at DESC
LIMIT 20;

-- Count different phone number patterns
SELECT 
    CASE 
        WHEN phone_number IS NULL THEN 'NULL'
        WHEN phone_number = '' THEN 'EMPTY'
        WHEN phone_number ~ '^[0-9+\-\s()]+$' THEN 'NUMERIC_FORMAT'
        WHEN phone_number ~ '^[a-zA-Z\s]+$' THEN 'ALPHABETIC'
        WHEN phone_number ~ '^[a-zA-Z0-9\-\s]+$' THEN 'ALPHANUMERIC'
        ELSE 'OTHER_FORMAT'
    END as phone_pattern,
    COUNT(*) as count,
    array_agg(phone_number) FILTER (WHERE phone_number IS NOT NULL) as examples
FROM profiles 
GROUP BY 
    CASE 
        WHEN phone_number IS NULL THEN 'NULL'
        WHEN phone_number = '' THEN 'EMPTY'
        WHEN phone_number ~ '^[0-9+\-\s()]+$' THEN 'NUMERIC_FORMAT'
        WHEN phone_number ~ '^[a-zA-Z\s]+$' THEN 'ALPHABETIC'
        WHEN phone_number ~ '^[a-zA-Z0-9\-\s]+$' THEN 'ALPHANUMERIC'
        ELSE 'OTHER_FORMAT'
    END
ORDER BY count DESC;

-- =============================================================================
-- 5. Check for Phone Number Constraints
-- =============================================================================

-- Check if there are any constraints on the phone_number field that might block updates
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    consrc as constraint_source
FROM pg_constraint 
WHERE conrelid = (
    SELECT oid FROM pg_class WHERE relname = 'profiles'
)
AND consrc LIKE '%phone_number%';

-- Alternative query for constraints:
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'profiles'
  AND (tc.constraint_type = 'CHECK' OR cc.check_clause LIKE '%phone_number%');

-- =============================================================================
-- 6. Test Phone Number Updates (Use with Caution)
-- =============================================================================

-- Find a test user to update (replace with actual user ID)
-- SELECT id, first_name, last_name, phone_number 
-- FROM profiles 
-- WHERE email = 'test@example.com' 
-- LIMIT 1;

-- Test update with arbitrary phone values:
-- UPDATE profiles 
-- SET phone_number = 'abc', updated_at = NOW() 
-- WHERE id = 'your-test-user-id-here';

-- Verify the update worked:
-- SELECT id, phone_number, updated_at 
-- FROM profiles 
-- WHERE id = 'your-test-user-id-here';

-- =============================================================================
-- 7. Performance Check for Phone Number Field
-- =============================================================================

-- Check if there are indexes on phone_number (could affect update performance)
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'profiles' 
  AND indexdef LIKE '%phone_number%';

-- =============================================================================
-- 8. Data Type Verification
-- =============================================================================

-- Verify that phone_number can store the test values
SELECT 
    'abc'::text as test_abc,
    '123-xyz'::text as test_mixed,
    ''::text as test_empty,
    '!@#$%^&*()'::text as test_special,
    '📞 call me'::text as test_emoji;

-- =============================================================================
-- 9. Storage Size Analysis
-- =============================================================================

-- Check storage usage of phone numbers
SELECT 
    AVG(LENGTH(phone_number)) as avg_length,
    MIN(LENGTH(phone_number)) as min_length,
    MAX(LENGTH(phone_number)) as max_length,
    COUNT(*) FILTER (WHERE phone_number IS NOT NULL) as non_null_count,
    COUNT(*) FILTER (WHERE phone_number IS NULL) as null_count
FROM profiles;

-- =============================================================================
-- 10. Final Verification Query
-- =============================================================================

-- This query should return data showing that arbitrary phone formats are accepted
SELECT 
    id,
    phone_number,
    CASE 
        WHEN phone_number IS NULL THEN '✅ NULL value accepted'
        WHEN phone_number = '' THEN '✅ Empty string accepted'  
        WHEN phone_number ~ '^[a-zA-Z]+$' THEN '✅ Alphabetic text accepted'
        WHEN phone_number ~ '^[0-9\-xyz]+$' THEN '✅ Mixed alphanumeric accepted'
        WHEN phone_number ~ '[!@#$%^&*()]' THEN '✅ Special characters accepted'
        ELSE '✅ Other format accepted'
    END as validation_status,
    updated_at
FROM profiles 
WHERE id IN (
    -- Replace with actual user IDs that were updated during testing
    'test-user-id-1',
    'test-user-id-2', 
    'test-user-id-3'
)
ORDER BY updated_at DESC;

-- =============================================================================
-- EXPECTED RESULTS SUMMARY
-- =============================================================================

/*
Expected Database Behavior for Phone Numbers:

1. ✅ Column Type: TEXT or VARCHAR (allows any string)
2. ✅ Nullable: YES (allows NULL values)
3. ✅ No Constraints: No CHECK constraints blocking arbitrary text
4. ✅ Storage: Values stored exactly as entered
5. ✅ Updates: All formats update successfully
6. ✅ Performance: Updates complete without errors

Test Values That Should Work:
- "abc" → Stored as "abc"
- "123-xyz" → Stored as "123-xyz" 
- "" → Stored as NULL or empty string
- "!@#$%^&*()" → Stored as "!@#$%^&*()"
- "📞 call me" → Stored as "📞 call me"
- NULL → Stored as NULL

If any of these fail, there may be:
- CHECK constraints blocking text values
- Triggers performing validation
- Application-level validation not disabled
- Data type issues preventing string storage
*/
