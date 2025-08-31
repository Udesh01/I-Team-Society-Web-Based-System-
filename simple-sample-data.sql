-- Simple Sample Data Creation Script
-- This creates basic sample data that doesn't require user registration
-- Run this to test your application with sample events and basic data

-- =====================================================
-- 1. CREATE SAMPLE EVENTS (No user dependencies)
-- =====================================================

-- Clear existing sample events if they exist
DELETE FROM event_registrations WHERE event_id IN (
    SELECT id FROM events WHERE name LIKE '%Sample%' OR name LIKE '%Demo%'
);
DELETE FROM events WHERE name LIKE '%Sample%' OR name LIKE '%Demo%';

-- Create sample events
INSERT INTO events (name, description, event_date, location, max_participants, event_type, requirements) VALUES
('Demo Tech Workshop', 'Introduction to web development technologies', CURRENT_DATE + INTERVAL '7 days', 'Computer Lab 1', 30, 'Workshop', 'Laptop recommended'),
('Sample Networking Event', 'Professional networking and career development', CURRENT_DATE + INTERVAL '14 days', 'Main Hall', 50, 'Networking', 'Business attire'),
('Demo Study Session', 'Group study session for exam preparation', CURRENT_DATE + INTERVAL '3 days', 'Library Study Room', 20, 'Study', 'Course materials'),
('Sample Conference 2024', 'Annual technology and innovation conference', CURRENT_DATE + INTERVAL '30 days', 'Conference Center', 200, 'Conference', 'Registration required'),
('Demo Welcome Event', 'Welcome event for new society members', CURRENT_DATE + INTERVAL '21 days', 'Student Center', 100, 'Social', 'None');

-- =====================================================
-- 2. CREATE SAMPLE MEMBERSHIP TIERS REFERENCE
-- =====================================================

-- Create a reference table for membership information (for display purposes)
CREATE TABLE IF NOT EXISTS membership_info (
    tier membership_tier PRIMARY KEY,
    price DECIMAL(10,2) NOT NULL,
    description TEXT,
    benefits TEXT[]
);

-- Clear and insert membership tier information
DELETE FROM membership_info;
INSERT INTO membership_info (tier, price, description, benefits) VALUES
('bronze', 50.00, 'Basic membership with essential access', ARRAY['Access to events', 'Basic member directory', 'Newsletter subscription']),
('silver', 100.00, 'Standard membership with additional benefits', ARRAY['All Bronze benefits', 'Priority event registration', 'Networking events access', 'Career resources']),
('gold', 150.00, 'Premium membership with full access', ARRAY['All Silver benefits', 'Exclusive workshops', 'Mentorship program', 'Premium member badge', 'Annual conference access']);

-- =====================================================
-- 3. CREATE SAMPLE ANNOUNCEMENTS/NOTIFICATIONS
-- =====================================================

-- Create a general announcements table for public notices
CREATE TABLE IF NOT EXISTS public_announcements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
    published_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);

-- Clear and insert sample announcements
DELETE FROM public_announcements;
INSERT INTO public_announcements (title, content, priority, expires_date) VALUES
('Welcome to I-Team Society!', 'We are excited to have you join our community. Explore upcoming events and connect with fellow members.', 'high', CURRENT_DATE + INTERVAL '30 days'),
('New Workshop Series Available', 'We are launching a new series of technical workshops. Check the events section for upcoming sessions.', 'medium', CURRENT_DATE + INTERVAL '14 days'),
('Membership Registration Open', 'Membership registration for the new academic year is now open. Choose from Bronze, Silver, or Gold tiers.', 'high', CURRENT_DATE + INTERVAL '60 days'),
('System Maintenance Notice', 'Scheduled maintenance will occur this weekend. Some features may be temporarily unavailable.', 'low', CURRENT_DATE + INTERVAL '7 days');

-- =====================================================
-- 4. CREATE SAMPLE FAQ DATA
-- =====================================================

CREATE TABLE IF NOT EXISTS faqs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clear and insert sample FAQs
DELETE FROM faqs;
INSERT INTO faqs (question, answer, category, order_index) VALUES
('How do I register for membership?', 'You can register for membership by clicking the "Join Now" button and selecting your preferred membership tier. Follow the registration process and submit your payment.', 'Membership', 1),
('What are the different membership tiers?', 'We offer three membership tiers: Bronze ($50), Silver ($100), and Gold ($150). Each tier offers different benefits and access levels.', 'Membership', 2),
('How do I register for events?', 'Once you are logged in, navigate to the Events section and click "Register" on any event you want to attend. Some events may require active membership.', 'Events', 3),
('Can I cancel my event registration?', 'Yes, you can cancel your event registration up to 24 hours before the event starts. Go to your profile and manage your registrations.', 'Events', 4),
('How do I reset my password?', 'Click on "Forgot Password" on the login page and enter your email address. You will receive a password reset link via email.', 'Account', 5),
('Who can I contact for support?', 'For technical support, email us at support@iteam-society.com. For general inquiries, use contact@iteam-society.com.', 'Support', 6);

-- =====================================================
-- 5. CREATE SAMPLE STATISTICS VIEW
-- =====================================================

-- Create a view for dashboard statistics
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT 
    'events' as metric,
    COUNT(*)::text as value,
    'Total Events' as label
FROM events
WHERE event_date >= CURRENT_DATE
UNION ALL
SELECT 
    'upcoming_events' as metric,
    COUNT(*)::text as value,
    'Upcoming Events'
FROM events 
WHERE event_date >= CURRENT_DATE AND event_date <= CURRENT_DATE + INTERVAL '30 days'
UNION ALL
SELECT 
    'total_users' as metric,
    COUNT(*)::text as value,
    'Registered Users'
FROM auth.users
UNION ALL
SELECT 
    'announcements' as metric,
    COUNT(*)::text as value,
    'Active Announcements'
FROM public_announcements
WHERE is_active = true AND (expires_date IS NULL OR expires_date >= CURRENT_DATE);

-- =====================================================
-- 6. DISPLAY SUMMARY OF CREATED DATA
-- =====================================================

SELECT 'SAMPLE DATA CREATION SUMMARY' as info;

SELECT 'Sample Events Created:' as category, COUNT(*) as count 
FROM events 
WHERE name LIKE '%Demo%' OR name LIKE '%Sample%';

SELECT 'Membership Tiers Available:' as category, COUNT(*) as count 
FROM membership_info;

SELECT 'Public Announcements:' as category, COUNT(*) as count 
FROM public_announcements 
WHERE is_active = true;

SELECT 'FAQ Entries:' as category, COUNT(*) as count 
FROM faqs;

-- Show the events that were created
SELECT 'CREATED EVENTS:' as info;
SELECT name, event_type, event_date, location, max_participants 
FROM events 
WHERE name LIKE '%Demo%' OR name LIKE '%Sample%'
ORDER BY event_date;

-- Show membership tiers
SELECT 'MEMBERSHIP TIERS:' as info;
SELECT tier, price, description 
FROM membership_info 
ORDER BY price;

-- Show dashboard stats
SELECT 'DASHBOARD STATISTICS:' as info;
SELECT * FROM dashboard_stats;

SELECT 'Sample data created successfully! You can now test the application.' as status;