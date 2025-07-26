-- Temporarily modify tour_bookings to allow guest bookings
-- This allows user_id to be NULL for guest bookings

-- First, drop the existing NOT NULL constraint on user_id
ALTER TABLE tour_bookings ALTER COLUMN user_id DROP NOT NULL;

-- Add a check constraint to ensure either user_id is provided OR it's a guest booking with contact info
ALTER TABLE tour_bookings ADD CONSTRAINT check_user_or_guest 
CHECK (
    user_id IS NOT NULL OR 
    (user_id IS NULL AND contact_email IS NOT NULL AND contact_name IS NOT NULL)
);

-- Update RLS policies to allow guest bookings

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own bookings" ON tour_bookings;
DROP POLICY IF EXISTS "Users can create own bookings" ON tour_bookings;
DROP POLICY IF EXISTS "Users can update own bookings" ON tour_bookings;

-- Create new policies that handle both authenticated and guest bookings

-- Users can view their own bookings (authenticated) or bookings with their email (guest)
CREATE POLICY "Users can view own bookings" ON tour_bookings
    FOR SELECT USING (
        auth.uid() = user_id OR 
        (user_id IS NULL AND contact_email = current_setting('request.jwt.claims', true)::json->>'email')
    );

-- Allow creating bookings for authenticated users or guest bookings
CREATE POLICY "Users can create bookings" ON tour_bookings
    FOR INSERT WITH CHECK (
        auth.uid() = user_id OR 
        (user_id IS NULL AND contact_email IS NOT NULL)
    );

-- Users can update their own bookings
CREATE POLICY "Users can update own bookings" ON tour_bookings
    FOR UPDATE USING (
        auth.uid() = user_id OR 
        (user_id IS NULL AND contact_email = current_setting('request.jwt.claims', true)::json->>'email')
    );

-- Allow anonymous users to create guest bookings
CREATE POLICY "Allow guest bookings" ON tour_bookings
    FOR INSERT WITH CHECK (user_id IS NULL AND contact_email IS NOT NULL);

-- Allow anonymous users to view guest bookings (this might be too permissive, but needed for the booking flow)
CREATE POLICY "Allow guest booking access" ON tour_bookings
    FOR SELECT USING (user_id IS NULL);