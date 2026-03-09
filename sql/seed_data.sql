-- Seed Data for CRM Pro
-- Run this in the Supabase SQL Editor to populate your application with default options and sample data.

-- 1. Populate Form Options
-- These categories match the application state: 'events', 'sources', 'reasons', 'actions'
INSERT INTO public.form_options (category, value, is_active) VALUES
('sources', 'Google Search', true),
('sources', 'Facebook Ad', true),
('sources', 'Referral', true),
('sources', 'Direct Website', true),
('sources', 'LinkedIn', true),
('sources', 'Cold Call', true),

('events', 'Everest Base Camp Trek', true),
('events', 'Annapurna Circuit', true),
('events', 'Bali Retreat 2024', true),
('events', 'Iceland Northern Lights', true),
('events', 'Ladakh Bike Expedition', true),

('reasons', 'Pricing Inquiry', true),
('reasons', 'Itinerary Details', true),
('reasons', 'Group Discount', true),
('reasons', 'Customization Request', true),
('reasons', 'Booking Process', true),

('actions', 'Send Brochure', true),
('actions', 'Callback Requested', true),
('actions', 'Schedule Zoom Meeting', true),
('actions', 'Send Payment Link', true),
('actions', 'Internal Follow-up', true)
ON CONFLICT (category, value) DO NOTHING;

-- 1.5 Set Superadmin Role for Jaypal
UPDATE public.profiles SET role = 'Admin' WHERE email = 'jaypalsingh@invinciblengo.org';


-- 2. Create sample leads (Optional)
-- NOTE: The 'assigned_to' and 'created_by' MUST match a valid User ID from your 'auth.users' / 'profiles' table.
-- Replacing 'cee88a68-4f2b-4006-b8b8-d828c6b63526' with the ID found during verification.

INSERT INTO public.leads (full_name, phone, source, primary_event, travel_date, status, assigned_to, created_by) VALUES
('John Doe', '9876543210', 'Google Search', 'Everest Base Camp Trek', '2024-10-15', 'New Inquiry', 'cee88a68-4f2b-4006-b8b8-d828c6b63526', 'cee88a68-4f2b-4006-b8b8-d828c6b63526'),
('Jane Smith', '1234567890', 'Referral', 'Bali Retreat 2024', '2024-11-20', 'Interested', 'cee88a68-4f2b-4006-b8b8-d828c6b63526', 'cee88a68-4f2b-4006-b8b8-d828c6b63526');


-- 3. Set Event Assignments (Mapping events to in-charges)
-- This determines who gets auto-assigned when a specific event is selected.
INSERT INTO public.event_assignments (event_value, user_id) VALUES
('Everest Base Camp Trek', 'cee88a68-4f2b-4006-b8b8-d828c6b63526'),
('Bali Retreat 2024', 'cee88a68-4f2b-4006-b8b8-d828c6b63526')
ON CONFLICT (event_value) DO UPDATE SET user_id = EXCLUDED.user_id;
