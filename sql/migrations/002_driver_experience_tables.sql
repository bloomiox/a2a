-- Migration: Driver Experience Tables
-- Description: Creates tables for enhanced driver experience features

-- Driver app sessions and device management
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

-- Driver availability and status
CREATE TABLE IF NOT EXISTS driver_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'offline' CHECK (status IN ('offline', 'available', 'busy', 'break')),
    current_location JSONB,
    availability_radius INTEGER DEFAULT 10000, -- meters
    shift_start TIMESTAMP WITH TIME ZONE,
    shift_end TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Driver notifications
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

-- Driver performance metrics
CREATE TABLE IF NOT EXISTS driver_performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    metric_date DATE NOT NULL,
    tours_completed INTEGER DEFAULT 0,
    total_distance_km DECIMAL(8,2) DEFAULT 0,
    total_time_hours DECIMAL(6,2) DEFAULT 0,
    average_rating DECIMAL(3,2),
    on_time_percentage DECIMAL(5,2),
    fuel_efficiency DECIMAL(6,2), -- km per liter
    customer_satisfaction_score DECIMAL(3,2),
    safety_incidents INTEGER DEFAULT 0,
    revenue_generated DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(driver_id, metric_date)
);

-- Driver earnings and payments
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

-- Route optimization data
CREATE TABLE IF NOT EXISTS route_optimizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_id UUID NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    original_route JSONB NOT NULL,
    optimized_route JSONB NOT NULL,
    optimization_factors JSONB, -- traffic, fuel, time, etc.
    estimated_time INTEGER, -- minutes
    estimated_distance INTEGER, -- meters
    estimated_fuel_cost DECIMAL(8,2),
    actual_time INTEGER,
    actual_distance INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_driver_app_sessions_driver_id ON driver_app_sessions(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_app_sessions_active ON driver_app_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_driver_availability_driver_id ON driver_availability(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_availability_status ON driver_availability(status);
CREATE INDEX IF NOT EXISTS idx_driver_notifications_driver_id ON driver_notifications(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_notifications_unread ON driver_notifications(driver_id, is_read);
CREATE INDEX IF NOT EXISTS idx_driver_performance_driver_date ON driver_performance_metrics(driver_id, metric_date);
CREATE INDEX IF NOT EXISTS idx_driver_earnings_driver_id ON driver_earnings(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_earnings_tour_id ON driver_earnings(tour_id);
CREATE INDEX IF NOT EXISTS idx_driver_earnings_status ON driver_earnings(payment_status);
CREATE INDEX IF NOT EXISTS idx_route_optimizations_tour_id ON route_optimizations(tour_id);
CREATE INDEX IF NOT EXISTS idx_route_optimizations_driver_id ON route_optimizations(driver_id);

-- RLS Policies
ALTER TABLE driver_app_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_optimizations ENABLE ROW LEVEL SECURITY;

-- Drivers can manage their own sessions
CREATE POLICY "Drivers can manage own sessions" ON driver_app_sessions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND id = driver_app_sessions.driver_id
            AND 'Driver' = ANY(user_group)
        )
    );

-- Drivers can manage their own availability
CREATE POLICY "Drivers can manage own availability" ON driver_availability
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND id = driver_availability.driver_id
            AND 'Driver' = ANY(user_group)
        )
    );

-- Drivers can view their own notifications
CREATE POLICY "Drivers can view own notifications" ON driver_notifications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND id = driver_notifications.driver_id
            AND 'Driver' = ANY(user_group)
        )
    );

-- Drivers can update their notification read status
CREATE POLICY "Drivers can update own notifications" ON driver_notifications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND id = driver_notifications.driver_id
            AND 'Driver' = ANY(user_group)
        )
    );

-- Drivers can view their own performance metrics
CREATE POLICY "Drivers can view own performance" ON driver_performance_metrics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND id = driver_performance_metrics.driver_id
            AND 'Driver' = ANY(user_group)
        )
    );

-- Drivers can view their own earnings
CREATE POLICY "Drivers can view own earnings" ON driver_earnings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND id = driver_earnings.driver_id
            AND 'Driver' = ANY(user_group)
        )
    );

-- Drivers can view route optimizations for their tours
CREATE POLICY "Drivers can view own route optimizations" ON route_optimizations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND id = route_optimizations.driver_id
            AND 'Driver' = ANY(user_group)
        )
    );

-- Admins can view and manage all driver data
CREATE POLICY "Admins can manage all driver sessions" ON driver_app_sessions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND 'Admin' = ANY(user_group)
        )
    );

CREATE POLICY "Admins can manage all driver availability" ON driver_availability
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND 'Admin' = ANY(user_group)
        )
    );

CREATE POLICY "Admins can manage all driver notifications" ON driver_notifications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND 'Admin' = ANY(user_group)
        )
    );

CREATE POLICY "Admins can view all driver performance" ON driver_performance_metrics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND 'Admin' = ANY(user_group)
        )
    );

CREATE POLICY "Admins can manage all driver earnings" ON driver_earnings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND 'Admin' = ANY(user_group)
        )
    );

CREATE POLICY "Admins can view all route optimizations" ON route_optimizations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND 'Admin' = ANY(user_group)
        )
    );

-- System can create notifications and performance data
CREATE POLICY "System can create driver notifications" ON driver_notifications
    FOR INSERT WITH CHECK (true);

CREATE POLICY "System can create performance metrics" ON driver_performance_metrics
    FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update performance metrics" ON driver_performance_metrics
    FOR UPDATE USING (true);

CREATE POLICY "System can create earnings" ON driver_earnings
    FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update earnings" ON driver_earnings
    FOR UPDATE USING (true);

CREATE POLICY "System can create route optimizations" ON route_optimizations
    FOR INSERT WITH CHECK (true);

-- Triggers for updated_at
CREATE TRIGGER update_driver_availability_updated_at
    BEFORE UPDATE ON driver_availability
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();