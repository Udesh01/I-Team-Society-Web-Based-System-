-- Sample Data Creation Script for I-Team Society Management System
-- This script creates sample data AFTER users are registered through the application
-- Run this ONLY after you have registered actual users through the app

-- =====================================================
-- IMPORTANT: PREREQUISITES
-- =====================================================
-- 1. First run the safe-database-setup.sql script
-- 2. Register actual users through your application's registration forms
-- 3. Get their user IDs from the auth.users table
-- 4. Update the user IDs in this script
-- 5. Then run this script to add sample data

-- =====================================================
-- 1. GET EXISTING USER IDs (Update these with real user IDs)
-- =====================================================

-- First, let's see what users exist in the system
SELECT 'Current users in the system:' as info;
SELECT 
    au.id,
    au.email,
    p.first_name,
    p.last_name,
    p.role
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
ORDER BY au.created_at;

-- =====================================================
-- 2. MANUAL USER ID CONFIGURATION
-- =====================================================
-- REPLACE THESE UUIDs WITH ACTUAL USER IDs FROM YOUR auth.users TABLE
-- You can get these by running: SELECT id, email FROM auth.users;

-- Example user IDs (REPLACE WITH YOUR ACTUAL USER IDs):
-- admin_id: REPLACE_WITH_ACTUAL_ADMIN_USER_ID
-- staff_id_1: REPLACE_WITH_ACTUAL_STAFF_USER_ID_1  
-- staff_id_2: REPLACE_WITH_ACTUAL_STAFF_USER_ID_2
-- student_id_1: REPLACE_WITH_ACTUAL_STUDENT_USER_ID_1
-- student_id_2: REPLACE_WITH_ACTUAL_STUDENT_USER_ID_2
-- student_id_3: REPLACE_WITH_ACTUAL_STUDENT_USER_ID_3

-- =====================================================
-- 3. ALTERNATIVE: CREATE SAMPLE DATA FOR EXISTING USERS
-- =====================================================

-- This approach uses any existing users and adds sample data to them
DO $$
DECLARE
    user_ids UUID[];
    admin_id UUID;
    staff_id UUID;
    student_ids UUID[];
    event_id_1 UUID;
    event_id_2 UUID;
    event_id_3 UUID;
BEGIN
    -- Get existing user IDs
    SELECT ARRAY_AGG(au.id) INTO user_ids 
    FROM auth.users au 
    LIMIT 10;
    
    -- Check if we have any users
    IF array_length(user_ids, 1) IS NULL THEN
        RAISE NOTICE 'No users found in auth.users table.';
        RAISE NOTICE 'Please register users through the application first, then run this script.';
        RETURN;
    END IF;
    
    -- Use the first user as admin (you should update their role manually)
    admin_id := user_ids[1];
    
    -- Create some sample events (these don't require specific user IDs)
    INSERT INTO events (name, description, event_date, location, max_participants, event_type, requirements) VALUES
    ('Welcome Orientation', 'Orientation session for new members', CURRENT_DATE + INTERVAL '7 days', 'Main Hall', 100, 'Orientation', 'None'),
    ('Tech Workshop', 'Introduction to modern web development', CURRENT_DATE + INTERVAL '14 days', 'Computer Lab', 25, 'Workshop', 'Laptop required'),
    ('Annual Conference', 'Annual society conference', CURRENT_DATE + INTERVAL '30 days', 'Conference Center', 200, 'Conference', 'Registration required'),
    ('Study Session', 'Group study session', CURRENT_DATE + INTERVAL '3 days', 'Library', 15, 'Study', 'Textbooks'),
    ('Networking Event', 'Professional networking event', CURRENT_DATE + INTERVAL '21 days', 'Community Center', 50, 'Networking', 'Business cards recommended')
    RETURNING id INTO event_id_1; -- We'll use this for the first event
    
    -- Get the event IDs for sample registrations
    SELECT id INTO event_id_1 FROM events WHERE name = 'Welcome Orientation' LIMIT 1;
    SELECT id INTO event_id_2 FROM events WHERE name = 'Tech Workshop' LIMIT 1;
    SELECT id INTO event_id_3 FROM events WHERE name = 'Annual Conference' LIMIT 1;
    
    -- Create sample notifications for existing users
    INSERT INTO notifications (user_id, title, message, is_read)
    SELECT 
        au.id,
        'Welcome to I-Team Society!',
        'Thank you for joining our community. Explore the dashboard to get started.',
        false
    FROM auth.users au
    LIMIT 5;
    
    -- Add some variation in notifications
    INSERT INTO notifications (user_id, title, message, is_read)
    SELECT 
        au.id,
        'Upcoming Events',
        'Check out our upcoming events and register for those that interest you.',
        false
    FROM auth.users au
    LIMIT 3;
    
    RAISE NOTICE 'Sample events and notifications created successfully!';
    RAISE NOTICE 'Total users in system: %', array_length(user_ids, 1);
    RAISE NOTICE 'Sample events created: 5';
    RAISE NOTICE 'Sample notifications created for existing users';
    
END $$;

-- =====================================================
-- 2. CREATE SAMPLE DATA SUMMARY VIEW
-- =====================================================

-- Create a view to easily see all sample data
CREATE OR REPLACE VIEW sample_users_summary AS
SELECT 
    p.id,
    p.first_name || ' ' || p.last_name as full_name,
    p.role,
    p.phone_number,
    CASE 
        WHEN p.role = 'student' THEN sd.student_id
        WHEN p.role = 'staff' THEN st.staff_id
        ELSE 'N/A'
    END as identifier,
    CASE 
        WHEN p.role = 'student' THEN sd.faculty || ' - ' || sd.department
        WHEN p.role = 'staff' THEN st.department || ' - ' || st.position
        ELSE 'Administration'
    END as details,
    m.status as membership_status,
    m.tier as membership_tier
FROM profiles p
LEFT JOIN student_details sd ON p.id = sd.id
LEFT JOIN staff_details st ON p.id = st.id
LEFT JOIN memberships m ON p.id = m.user_id
ORDER BY p.role, p.first_name;

-- =====================================================
-- 3. DISPLAY SAMPLE DATA
-- =====================================================

-- Show summary of created users
SELECT 'SAMPLE USERS SUMMARY' as info;
SELECT * FROM sample_users_summary;

-- Show events and registrations
SELECT 'SAMPLE EVENTS' as info;
SELECT 
    e.name,
    e.event_type,
    e.event_date,
    e.location,
    e.max_participants,
    COUNT(er.id) as registered_count
FROM events e
LEFT JOIN event_registrations er ON e.id = er.event_id
GROUP BY e.id, e.name, e.event_type, e.event_date, e.location, e.max_participants
ORDER BY e.event_date;

-- Show membership summary
SELECT 'MEMBERSHIP SUMMARY' as info;
SELECT 
    status,
    tier,
    COUNT(*) as count,
    SUM(amount) as total_amount
FROM memberships
GROUP BY status, tier
ORDER BY status, tier;

-- =====================================================
-- 4. HELPFUL QUERIES FOR TESTING
-- =====================================================

-- Query to see all users by role
-- SELECT * FROM profiles WHERE role = 'admin';
-- SELECT * FROM profiles WHERE role = 'staff';
-- SELECT * FROM profiles WHERE role = 'student';

-- Query to see membership details
-- SELECT p.first_name, p.last_name, m.status, m.tier, m.eid 
-- FROM profiles p JOIN memberships m ON p.id = m.user_id;

-- Query to see event registrations
-- SELECT p.first_name, p.last_name, e.name, er.attended 
-- FROM profiles p 
-- JOIN event_registrations er ON p.id = er.user_id 
-- JOIN events e ON er.event_id = e.id;

-- Query to check notifications
-- SELECT p.first_name, p.last_name, n.title, n.is_read 
-- FROM profiles p JOIN notifications n ON p.id = n.user_id;

SELECT 'Sample data creation completed successfully!' as status;