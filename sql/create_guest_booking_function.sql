-- Function to create guest bookings without authentication
-- This bypasses RLS policies for guest users

CREATE OR REPLACE FUNCTION create_guest_booking(
    p_tour_id UUID,
    p_user_id UUID DEFAULT NULL,
    p_tour_date DATE,
    p_tour_time TIME,
    p_number_of_tourists INTEGER,
    p_total_price DECIMAL(10,2),
    p_contact_name VARCHAR(255),
    p_contact_email VARCHAR(255),
    p_contact_phone VARCHAR(50) DEFAULT NULL,
    p_special_requests TEXT DEFAULT NULL,
    p_preferred_language VARCHAR(50) DEFAULT 'English',
    p_status VARCHAR(50) DEFAULT 'pending'
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    tour_id UUID,
    tour_date DATE,
    tour_time TIME,
    number_of_tourists INTEGER,
    total_price DECIMAL(10,2),
    contact_name VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    special_requests TEXT,
    preferred_language VARCHAR(50),
    status VARCHAR(50),
    booking_reference VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_booking_id UUID;
    booking_ref VARCHAR(20);
BEGIN
    -- Generate new booking ID
    new_booking_id := gen_random_uuid();
    
    -- Generate booking reference
    booking_ref := 'BK' || UPPER(SUBSTRING(new_booking_id::text FROM 1 FOR 8));
    
    -- Insert the booking (bypassing RLS)
    INSERT INTO tour_bookings (
        id,
        user_id,
        tour_id,
        tour_date,
        tour_time,
        number_of_tourists,
        total_price,
        contact_name,
        contact_email,
        contact_phone,
        special_requests,
        preferred_language,
        status,
        booking_reference,
        created_at,
        updated_at
    ) VALUES (
        new_booking_id,
        p_user_id,
        p_tour_id,
        p_tour_date,
        p_tour_time,
        p_number_of_tourists,
        p_total_price,
        p_contact_name,
        p_contact_email,
        p_contact_phone,
        p_special_requests,
        p_preferred_language,
        p_status,
        booking_ref,
        NOW(),
        NOW()
    );
    
    -- Return the created booking
    RETURN QUERY
    SELECT 
        tb.id,
        tb.user_id,
        tb.tour_id,
        tb.tour_date,
        tb.tour_time,
        tb.number_of_tourists,
        tb.total_price,
        tb.contact_name,
        tb.contact_email,
        tb.contact_phone,
        tb.special_requests,
        tb.preferred_language,
        tb.status,
        tb.booking_reference,
        tb.created_at,
        tb.updated_at
    FROM tour_bookings tb
    WHERE tb.id = new_booking_id;
END;
$$;

-- Grant execute permission to authenticated and anonymous users
GRANT EXECUTE ON FUNCTION create_guest_booking TO authenticated, anon;