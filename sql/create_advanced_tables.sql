-- Advanced Features Tables Creation Script
-- Run this script manually in your Supabase SQL editor to create the advanced features tables

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Driver App Sessions Table
CREATE TABLE IF NOT EXISTS driver_app_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    device_info JSONB NOT NULL,
    app_version VARCHAR(20) NOT NULL,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    location_data JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Driver Availability Table
CREATE TABLE IF NOT EXISTS driver_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'offline' CHECK (status IN ('offline', 'available', 'busy', 'break')),
    current_location JSONB,
    availability_radius INTEGER DEFAULT 10000,
    shift_start TIMESTAMP WITH TIME ZONE,
    shift_end TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Driver Notifications Table
CREATE TABLE IF NOT EXISTS driver_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT false,
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Driver Performance Metrics Table
CREATE TABLE IF NOT EXISTS driver_performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    metric_date DATE NOT NULL,
    tours_completed INTEGER DEFAULT 0,
    total_distance_km DECIMAL(8,2) DEFAULT 0,
    total_time_hours DECIMAL(6,2) DEFAULT 0,
    average_rating DECIMAL(3,2),
    on_time_percentage DECIMAL(5,2),
    fuel_efficiency DECIMAL(6,2),
    customer_satisfaction_score DECIMAL(3,2),
    safety_incidents INTEGER DEFAULT 0,
    revenue_generated DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(driver_id, metric_date)
);

-- 5. Driver Earnings Table
CREATE TABLE IF NOT EXISTS driver_earnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    tour_id UUID REFERENCES tours(id) ON DELETE SET NULL,
    earning_type VARCHAR(50) NOT NULL CHECK (earning_type IN ('tour_fee', 'tip', 'bonus', 'incentive', 'penalty')),
    gross_amount DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    fee_amount DECIMAL(10,2) DEFAULT 0,
    net_amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'paid', 'failed')),
    payment_date DATE,
    payment_method VARCHAR(50),
    transaction_reference VARCHAR(100),
    tax_year INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Tour Downloads Table (for offline mode)
CREATE TABLE IF NOT EXISTS tour_downloads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tour_id UUID NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
    download_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (download_status IN ('pending', 'downloading', 'completed', 'failed', 'expired')),
    download_size_mb DECIMAL(10,2),
    download_progress INTEGER DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE,
    downloaded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Interactive Content Table
CREATE TABLE IF NOT EXISTS interactive_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stop_id UUID NOT NULL REFERENCES tour_stops(id) ON DELETE CASCADE,
    content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('quiz', 'poll', 'photo_challenge', 'scavenger_hunt')),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content_data JSONB NOT NULL,
    points_reward INTEGER DEFAULT 0,
    is_required BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_driver_app_sessions_driver_id ON driver_app_sessions(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_app_sessions_active ON driver_app_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_driver_availability_driver_id ON driver_availability(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_availability_status ON driver_availability(status);
CREATE INDEX IF NOT EXISTS idx_driver_notifications_driver_id ON driver_notifications(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_notifications_unread ON driver_notifications(driver_id, is_read);
CREATE INDEX IF NOT EXISTS idx_driver_performance_driver_date ON driver_performance_metrics(driver_id, metric_date);
CREATE INDEX IF NOT EXISTS idx_driver_earnings_driver_id ON driver_earnings(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_earnings_tour_id ON driver_earnings(tour_id);
CREATE INDEX IF NOT EXISTS idx_tour_downloads_user_id ON tour_downloads(user_id);
CREATE INDEX IF NOT EXISTS idx_tour_downloads_tour_id ON tour_downloads(tour_id);
CREATE INDEX IF NOT EXISTS idx_interactive_content_stop_id ON interactive_content(stop_id);

-- Enable Row Level Security
ALTER TABLE driver_app_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tour_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactive_content ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Driver Tables

-- Driver App Sessions
CREATE POLICY "Drivers can manage own sessions" ON driver_app_sessions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND id = driver_app_sessions.driver_id
            AND 'Driver' = ANY(user_group)
        )
    );

-- Driver Availability
CREATE POLICY "Drivers can manage own availability" ON driver_availability
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND id = driver_availability.driver_id
            AND 'Driver' = ANY(user_group)
        )
    );

-- Driver Notifications
CREATE POLICY "Drivers can view own notifications" ON driver_notifications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND id = driver_notifications.driver_id
            AND 'Driver' = ANY(user_group)
        )
    );

CREATE POLICY "Drivers can update own notifications" ON driver_notifications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND id = driver_notifications.driver_id
            AND 'Driver' = ANY(user_group)
        )
    );

-- Driver Performance Metrics
CREATE POLICY "Drivers can view own performance" ON driver_performance_metrics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND id = driver_performance_metrics.driver_id
            AND 'Driver' = ANY(user_group)
        )
    );

-- Driver Earnings
CREATE POLICY "Drivers can view own earnings" ON driver_earnings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND id = driver_earnings.driver_id
            AND 'Driver' = ANY(user_group)
        )
    );

-- Tour Downloads
CREATE POLICY "Users can manage own downloads" ON tour_downloads
    FOR ALL USING (auth.uid() = user_id);

-- Interactive Content
CREATE POLICY "Users can view interactive content" ON interactive_content
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM tour_stops ts
            JOIN tours t ON ts.tour_id = t.id
            WHERE ts.id = interactive_content.stop_id 
            AND (t.is_public = true OR t.created_by = auth.uid())
        )
    );

-- Admin Policies (Admins can access all data)
CREATE POLICY "Admins can manage all driver data" ON driver_app_sessions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND 'Admin' = ANY(user_group)
        )
    );

CREATE POLICY "Admins can manage all availability" ON driver_availability
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND 'Admin' = ANY(user_group)
        )
    );

CREATE POLICY "Admins can manage all notifications" ON driver_notifications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND 'Admin' = ANY(user_group)
        )
    );

CREATE POLICY "Admins can view all performance" ON driver_performance_metrics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND 'Admin' = ANY(user_group)
        )
    );

CREATE POLICY "Admins can manage all earnings" ON driver_earnings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND 'Admin' = ANY(user_group)
        )
    );

CREATE POLICY "Admins can manage all downloads" ON tour_downloads
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND 'Admin' = ANY(user_group)
        )
    );

CREATE POLICY "Admins can manage interactive content" ON interactive_content
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND 'Admin' = ANY(user_group)
        )
    );

-- System Policies (Allow system to create data)
CREATE POLICY "System can create notifications" ON driver_notifications
    FOR INSERT WITH CHECK (true);

CREATE POLICY "System can create performance metrics" ON driver_performance_metrics
    FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update performance metrics" ON driver_performance_metrics
    FOR UPDATE USING (true);

CREATE POLICY "System can create earnings" ON driver_earnings
    FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update earnings" ON driver_earnings
    FOR UPDATE USING (true);

-- Create update trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add update triggers
CREATE TRIGGER update_driver_availability_updated_at
    BEFORE UPDATE ON driver_availability
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tour_downloads_updated_at
    BEFORE UPDATE ON tour_downloads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing (optional)
-- Uncomment the following lines if you want sample data

/*
-- Sample driver availability (replace with actual driver user ID)
INSERT INTO driver_availability (driver_id, status, current_location, availability_radius, updated_at)
VALUES (
    (SELECT id FROM user_profiles WHERE 'Driver' = ANY(user_group) LIMIT 1),
    'offline',
    '{"latitude": 40.7128, "longitude": -74.0060}',
    10000,
    NOW()
) ON CONFLICT (driver_id) DO NOTHING;

-- Sample performance metrics (replace with actual driver user ID)
INSERT INTO driver_performance_metrics (
    driver_id, 
    metric_date, 
    tours_completed, 
    total_distance_km, 
    total_time_hours, 
    average_rating, 
    on_time_percentage,
    revenue_generated
)
VALUES (
    (SELECT id FROM user_profiles WHERE 'Driver' = ANY(user_group) LIMIT 1),
    CURRENT_DATE,
    0,
    0.0,
    0.0,
    0.0,
    100.0,
    0.0
) ON CONFLICT (driver_id, metric_date) DO NOTHING;
*/

-- Verification queries (run these to check if tables were created successfully)
SELECT 'driver_app_sessions' as table_name, COUNT(*) as row_count FROM driver_app_sessions
UNION ALL
SELECT 'driver_availability', COUNT(*) FROM driver_availability
UNION ALL
SELECT 'driver_notifications', COUNT(*) FROM driver_notifications
UNION ALL
SELECT 'driver_performance_metrics', COUNT(*) FROM driver_performance_metrics
UNION ALL
SELECT 'driver_earnings', COUNT(*) FROM driver_earnings
UNION ALL
SELECT 'tour_downloads', COUNT(*) FROM tour_downloads
UNION ALL
SELECT 'interactive_content', COUNT(*) FROM interactive_content;

-- Success message
SELECT 'Advanced features tables created successfully!' as status;