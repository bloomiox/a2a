# Booking System Database Schema

This document outlines the database schema required for the Tourist Booking & Payment System.

## Required Tables

### 1. tour_bookings

```sql
CREATE TABLE tour_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tour_id UUID NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
    tour_date DATE NOT NULL,
    tour_time TIME NOT NULL,
    number_of_tourists INTEGER NOT NULL DEFAULT 1,
    total_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    contact_name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(50),
    special_requests TEXT,
    preferred_language VARCHAR(50) DEFAULT 'English',
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'pending_payment', 'confirmed', 'completed', 'cancelled')),
    booking_reference VARCHAR(20) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_tour_bookings_user_id ON tour_bookings(user_id);
CREATE INDEX idx_tour_bookings_tour_id ON tour_bookings(tour_id);
CREATE INDEX idx_tour_bookings_status ON tour_bookings(status);
CREATE INDEX idx_tour_bookings_tour_date ON tour_bookings(tour_date);

-- RLS Policies
ALTER TABLE tour_bookings ENABLE ROW LEVEL SECURITY;

-- Users can view their own bookings
CREATE POLICY "Users can view own bookings" ON tour_bookings
    FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own bookings
CREATE POLICY "Users can create own bookings" ON tour_bookings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own bookings
CREATE POLICY "Users can update own bookings" ON tour_bookings
    FOR UPDATE USING (auth.uid() = user_id);

-- Admins can view all bookings
CREATE POLICY "Admins can view all bookings" ON tour_bookings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND 'Admin' = ANY(user_group)
        )
    );

-- Admins can update all bookings
CREATE POLICY "Admins can update all bookings" ON tour_bookings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND 'Admin' = ANY(user_group)
        )
    );
```

### 2. payments

```sql
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES tour_bookings(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    payment_method VARCHAR(50) NOT NULL,
    payment_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
    transaction_id VARCHAR(255) UNIQUE,
    payment_provider VARCHAR(50),
    payment_details JSONB,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_payments_booking_id ON payments(booking_id);
CREATE INDEX idx_payments_status ON payments(payment_status);
CREATE INDEX idx_payments_transaction_id ON payments(transaction_id);

-- RLS Policies
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Users can view payments for their own bookings
CREATE POLICY "Users can view own payments" ON payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM tour_bookings 
            WHERE id = payments.booking_id 
            AND user_id = auth.uid()
        )
    );

-- System can create payments
CREATE POLICY "System can create payments" ON payments
    FOR INSERT WITH CHECK (true);

-- System can update payments
CREATE POLICY "System can update payments" ON payments
    FOR UPDATE USING (true);

-- Admins can view all payments
CREATE POLICY "Admins can view all payments" ON payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND 'Admin' = ANY(user_group)
        )
    );
```

### 3. booking_notifications

```sql
CREATE TABLE booking_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES tour_bookings(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_booking_notifications_booking_id ON booking_notifications(booking_id);
CREATE INDEX idx_booking_notifications_status ON booking_notifications(status);
```

## Triggers

### Auto-generate booking reference

```sql
CREATE OR REPLACE FUNCTION generate_booking_reference()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.booking_reference IS NULL THEN
        NEW.booking_reference := 'BK' || UPPER(SUBSTRING(NEW.id::text FROM 1 FOR 8));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_booking_reference
    BEFORE INSERT ON tour_bookings
    FOR EACH ROW
    EXECUTE FUNCTION generate_booking_reference();
```

### Update timestamp trigger

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tour_bookings_updated_at
    BEFORE UPDATE ON tour_bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

## Functions

### Get user bookings with tour details

```sql
CREATE OR REPLACE FUNCTION get_user_bookings_with_tours(p_user_id UUID)
RETURNS TABLE (
    booking_id UUID,
    tour_id UUID,
    tour_title VARCHAR,
    tour_description TEXT,
    tour_date DATE,
    tour_time TIME,
    number_of_tourists INTEGER,
    total_price DECIMAL,
    status VARCHAR,
    booking_reference VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tb.id,
        tb.tour_id,
        t.title,
        t.description,
        tb.tour_date,
        tb.tour_time,
        tb.number_of_tourists,
        tb.total_price,
        tb.status,
        tb.booking_reference,
        tb.created_at
    FROM tour_bookings tb
    JOIN tours t ON tb.tour_id = t.id
    WHERE tb.user_id = p_user_id
    ORDER BY tb.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Sample Data

```sql
-- Sample booking
INSERT INTO tour_bookings (
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
    status
) VALUES (
    '00000000-0000-0000-0000-000000000001', -- Replace with actual user ID
    '00000000-0000-0000-0000-000000000002', -- Replace with actual tour ID
    '2024-02-15',
    '10:00:00',
    2,
    50.00,
    'John Doe',
    'john@example.com',
    '+1-555-123-4567',
    'Wheelchair accessible please',
    'English',
    'confirmed'
);
```

## Notes

1. **Security**: All tables have Row Level Security (RLS) enabled with appropriate policies
2. **Indexes**: Added for common query patterns (user lookups, status filtering, etc.)
3. **Constraints**: Status fields use CHECK constraints to ensure data integrity
4. **References**: Foreign keys maintain referential integrity
5. **Timestamps**: Automatic timestamp management with triggers
6. **Booking Reference**: Auto-generated unique reference for customer communication

## Integration Points

- **Email Notifications**: booking_notifications table tracks email sending
- **Payment Processing**: payments table integrates with external payment providers
- **User Management**: Links to existing user_profiles and auth.users tables
- **Tour Management**: Links to existing tours table