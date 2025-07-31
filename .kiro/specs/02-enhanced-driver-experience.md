# Enhanced Driver Experience Specification

## Overview
This specification outlines the implementation of enhanced driver experience features including a dedicated mobile app, route optimization, training modules, performance dashboard, and earnings tracking.

## Feature 1: Driver Mobile App

### Requirements
- **Dedicated mobile-optimized interface**
- **Real-time tour management**
- **GPS navigation integration**
- **Communication tools**
- **Offline capability**

### Technical Implementation

#### Database Schema Changes
```sql
-- Driver app sessions and device management
CREATE TABLE driver_app_sessions (
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
CREATE TABLE driver_availability (
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
CREATE TABLE driver_notifications (
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
```

#### Components to Create
1. **DriverMobileApp** (`src/pages/DriverMobileApp.jsx`)
2. **DriverDashboard** (`src/components/driver/mobile/DriverDashboard.jsx`)
3. **TourManagement** (`src/components/driver/mobile/TourManagement.jsx`)
4. **NavigationPanel** (`src/components/driver/mobile/NavigationPanel.jsx`)
5. **DriverChat** (`src/components/driver/mobile/DriverChat.jsx`)
6. **AvailabilityToggle** (`src/components/driver/mobile/AvailabilityToggle.jsx`)

#### Implementation Steps
1. Create mobile-responsive driver interface
2. Implement real-time location tracking
3. Add tour assignment and management
4. Integrate GPS navigation
5. Create driver-tourist communication
6. Add offline mode for essential functions

### User Stories
- As a driver, I want a mobile app optimized for use while driving
- As a driver, I want to receive tour assignments and navigate efficiently
- As a driver, I want to communicate with tourists during tours

## Feature 2: Route Optimization

### Requirements
- **AI-powered route planning**
- **Real-time traffic integration**
- **Multi-stop optimization**
- **Dynamic re-routing**
- **Fuel efficiency optimization**

### Technical Implementation

#### Database Schema Changes
```sql
-- Route optimization data
CREATE TABLE route_optimizations (
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

-- Traffic and road conditions
CREATE TABLE traffic_conditions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_segment JSONB NOT NULL, -- start/end coordinates
    traffic_level VARCHAR(20) NOT NULL CHECK (traffic_level IN ('light', 'moderate', 'heavy', 'severe')),
    average_speed INTEGER, -- km/h
    incidents JSONB, -- accidents, construction, etc.
    weather_impact JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Route performance analytics
CREATE TABLE route_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_optimization_id UUID NOT NULL REFERENCES route_optimizations(id) ON DELETE CASCADE,
    performance_metrics JSONB NOT NULL,
    driver_feedback JSONB,
    tourist_feedback JSONB,
    efficiency_score DECIMAL(3,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Services to Create
1. **RouteOptimizationService** (`src/services/RouteOptimizationService.js`)
2. **TrafficService** (`src/services/TrafficService.js`)
3. **NavigationService** (`src/services/NavigationService.js`)
4. **RouteAnalyticsService** (`src/services/RouteAnalyticsService.js`)

#### Components to Create
1. **RouteOptimizer** (`src/components/driver/RouteOptimizer.jsx`)
2. **TrafficMonitor** (`src/components/driver/TrafficMonitor.jsx`)
3. **RouteComparison** (`src/components/driver/RouteComparison.jsx`)
4. **NavigationInstructions** (`src/components/driver/NavigationInstructions.jsx`)

#### Implementation Steps
1. Integrate with mapping APIs (Google Maps, Mapbox)
2. Implement route optimization algorithms
3. Add real-time traffic data integration
4. Create dynamic re-routing logic
5. Build route performance analytics
6. Add fuel efficiency calculations

### User Stories
- As a driver, I want optimized routes that save time and fuel
- As a driver, I want real-time traffic updates and alternative routes
- As a tour operator, I want to analyze route efficiency and costs

## Feature 3: Driver Training Module

### Requirements
- **Onboarding and certification system**
- **Interactive training content**
- **Progress tracking and assessments**
- **Continuing education**
- **Certification management**

### Technical Implementation

#### Database Schema Changes
```sql
-- Training modules and content
CREATE TABLE training_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    module_type VARCHAR(50) NOT NULL CHECK (module_type IN ('onboarding', 'safety', 'customer_service', 'technical', 'compliance')),
    content_data JSONB NOT NULL,
    duration_minutes INTEGER,
    passing_score INTEGER DEFAULT 80,
    is_required BOOLEAN DEFAULT false,
    prerequisites JSONB, -- array of required module IDs
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Driver training progress
CREATE TABLE driver_training_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES training_modules(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'failed')),
    progress_percentage INTEGER DEFAULT 0,
    score INTEGER,
    attempts INTEGER DEFAULT 0,
    time_spent_minutes INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(driver_id, module_id)
);

-- Driver certifications
CREATE TABLE driver_certifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    certification_type VARCHAR(100) NOT NULL,
    certification_data JSONB,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    renewal_required BOOLEAN DEFAULT false
);

-- Training assessments
CREATE TABLE training_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES training_modules(id) ON DELETE CASCADE,
    assessment_data JSONB NOT NULL, -- questions, answers, scoring
    time_limit_minutes INTEGER,
    max_attempts INTEGER DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Components to Create
1. **TrainingDashboard** (`src/components/driver/training/TrainingDashboard.jsx`)
2. **ModuleViewer** (`src/components/driver/training/ModuleViewer.jsx`)
3. **AssessmentComponent** (`src/components/driver/training/AssessmentComponent.jsx`)
4. **CertificationTracker** (`src/components/driver/training/CertificationTracker.jsx`)
5. **ProgressTracker** (`src/components/driver/training/ProgressTracker.jsx`)

#### Implementation Steps
1. Create training content management system
2. Implement interactive learning modules
3. Add assessment and scoring system
4. Create certification tracking
5. Build progress analytics
6. Add reminder and notification system

### User Stories
- As a new driver, I want comprehensive onboarding training
- As a driver, I want to track my certification status and renewals
- As an admin, I want to ensure all drivers meet training requirements

## Feature 4: Performance Dashboard

### Requirements
- **Personal metrics and KPIs**
- **Performance trends and analytics**
- **Goal setting and tracking**
- **Peer comparisons**
- **Feedback and improvement suggestions**

### Technical Implementation

#### Database Schema Changes
```sql
-- Driver performance metrics
CREATE TABLE driver_performance_metrics (
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

-- Performance goals and targets
CREATE TABLE driver_performance_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    goal_type VARCHAR(50) NOT NULL,
    target_value DECIMAL(10,2) NOT NULL,
    current_value DECIMAL(10,2) DEFAULT 0,
    target_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'achieved', 'missed', 'cancelled')),
    reward_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance feedback and coaching
CREATE TABLE driver_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    feedback_type VARCHAR(50) NOT NULL,
    feedback_source VARCHAR(50) NOT NULL, -- 'system', 'admin', 'customer'
    message TEXT NOT NULL,
    action_items JSONB,
    priority VARCHAR(20) DEFAULT 'normal',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Components to Create
1. **PerformanceDashboard** (`src/components/driver/performance/PerformanceDashboard.jsx`)
2. **MetricsOverview** (`src/components/driver/performance/MetricsOverview.jsx`)
3. **GoalTracker** (`src/components/driver/performance/GoalTracker.jsx`)
4. **PerformanceTrends** (`src/components/driver/performance/PerformanceTrends.jsx`)
5. **FeedbackPanel** (`src/components/driver/performance/FeedbackPanel.jsx`)
6. **PeerComparison** (`src/components/driver/performance/PeerComparison.jsx`)

#### Implementation Steps
1. Create performance metrics collection system
2. Implement dashboard with key KPIs
3. Add goal setting and tracking
4. Create performance trend analysis
5. Build peer comparison features
6. Add automated feedback system

### User Stories
- As a driver, I want to see my performance metrics and trends
- As a driver, I want to set goals and track my progress
- As a driver, I want to compare my performance with peers

## Feature 5: Earnings Tracking

### Requirements
- **Detailed financial reporting**
- **Real-time earnings tracking**
- **Tax reporting assistance**
- **Payment history and forecasting**
- **Expense tracking and management**

### Technical Implementation

#### Database Schema Changes
```sql
-- Driver earnings and payments
CREATE TABLE driver_earnings (
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

-- Driver expenses
CREATE TABLE driver_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    expense_type VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    description TEXT,
    receipt_url VARCHAR(500),
    expense_date DATE NOT NULL,
    is_business_expense BOOLEAN DEFAULT true,
    tax_deductible BOOLEAN DEFAULT false,
    category VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Financial summaries
CREATE TABLE driver_financial_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    summary_period VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly', 'yearly'
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_earnings DECIMAL(10,2) DEFAULT 0,
    total_expenses DECIMAL(10,2) DEFAULT 0,
    net_income DECIMAL(10,2) DEFAULT 0,
    tax_liability DECIMAL(10,2) DEFAULT 0,
    tours_completed INTEGER DEFAULT 0,
    hours_worked DECIMAL(6,2) DEFAULT 0,
    average_hourly_rate DECIMAL(8,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(driver_id, summary_period, period_start)
);
```

#### Components to Create
1. **EarningsTracker** (`src/components/driver/earnings/EarningsTracker.jsx`)
2. **PaymentHistory** (`src/components/driver/earnings/PaymentHistory.jsx`)
3. **ExpenseManager** (`src/components/driver/earnings/ExpenseManager.jsx`)
4. **TaxReporting** (`src/components/driver/earnings/TaxReporting.jsx`)
5. **FinancialSummary** (`src/components/driver/earnings/FinancialSummary.jsx`)
6. **EarningsForecast** (`src/components/driver/earnings/EarningsForecast.jsx`)

#### Implementation Steps
1. Create earnings tracking system
2. Implement expense management
3. Add payment processing integration
4. Create financial reporting tools
5. Build tax assistance features
6. Add forecasting and analytics

### User Stories
- As a driver, I want to track my earnings in real-time
- As a driver, I want to manage my expenses and receipts
- As a driver, I want tax reports and financial summaries

## Implementation Priority

### Phase 1 (Weeks 1-2)
1. Driver Mobile App - Core interface
2. Performance Dashboard - Basic metrics

### Phase 2 (Weeks 3-4)
1. Route Optimization - Basic functionality
2. Earnings Tracking - Core features

### Phase 3 (Weeks 5-6)
1. Driver Training Module - Complete system
2. Advanced features for all components

## Testing Strategy

### Unit Tests
- Route optimization algorithms
- Earnings calculations
- Training progress tracking
- Performance metrics computation

### Integration Tests
- Mobile app navigation flows
- Payment processing integration
- Training assessment system
- Performance data collection

### User Acceptance Tests
- Driver mobile app usability
- Route optimization effectiveness
- Training module completion
- Earnings accuracy verification

## Security Considerations

### Data Protection
- Driver location data encryption
- Financial information security
- Training record confidentiality
- Performance data privacy

### Access Control
- Role-based permissions
- Driver data isolation
- Secure API endpoints
- Audit logging

## Success Metrics

### Driver Satisfaction
- App usage rates
- Training completion rates
- Performance improvement trends
- Earnings growth

### Operational Efficiency
- Route optimization savings
- Training effectiveness
- Performance metric improvements
- System adoption rates

---

**Next Steps**: Review this specification and confirm implementation approach before proceeding to detailed development.