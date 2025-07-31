# Multi-tenant Architecture Specification

## Overview
This specification outlines the implementation of a multi-tenant architecture supporting white-label solutions, multi-city operations, franchise management, and custom domain support.

## Feature 1: White-label Solution

### Requirements
- **Customizable branding per client**
- **Theme and styling customization**
- **Feature set configuration**
- **Custom content and messaging**
- **Isolated client environments**

### Technical Implementation

#### Database Schema Changes
```sql
-- Tenant management
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_code VARCHAR(50) UNIQUE NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(50),
    address JSONB,
    subscription_plan VARCHAR(50) NOT NULL DEFAULT 'basic',
    subscription_status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (subscription_status IN ('active', 'suspended', 'cancelled', 'trial')),
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tenant branding and customization
CREATE TABLE tenant_branding (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    logo_url VARCHAR(500),
    favicon_url VARCHAR(500),
    primary_color VARCHAR(7), -- hex color
    secondary_color VARCHAR(7),
    accent_color VARCHAR(7),
    font_family VARCHAR(100),
    custom_css TEXT,
    theme_settings JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id)
);

-- Tenant feature configuration
CREATE TABLE tenant_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    feature_name VARCHAR(100) NOT NULL,
    is_enabled BOOLEAN DEFAULT true,
    configuration JSONB,
    usage_limits JSONB, -- max users, tours, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, feature_name)
);

-- Tenant custom content
CREATE TABLE tenant_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    content_type VARCHAR(50) NOT NULL, -- 'terms', 'privacy', 'about', 'help'
    content_key VARCHAR(100) NOT NULL,
    content_value TEXT,
    language VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, content_type, content_key, language)
);

-- Add tenant_id to existing tables
ALTER TABLE user_profiles ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE tours ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE tour_bookings ADD COLUMN tenant_id UUID REFERENCES tenants(id);
-- Add indexes
CREATE INDEX idx_user_profiles_tenant_id ON user_profiles(tenant_id);
CREATE INDEX idx_tours_tenant_id ON tours(tenant_id);
CREATE INDEX idx_tour_bookings_tenant_id ON tour_bookings(tenant_id);
```

#### Services to Create
1. **TenantService** (`src/services/TenantService.js`)
2. **BrandingService** (`src/services/BrandingService.js`)
3. **FeatureToggleService** (`src/services/FeatureToggleService.js`)
4. **TenantContextService** (`src/services/TenantContextService.js`)

#### Components to Create
1. **TenantProvider** (`src/contexts/TenantContext.jsx`)
2. **BrandingCustomizer** (`src/components/tenant/BrandingCustomizer.jsx`)
3. **FeatureManager** (`src/components/tenant/FeatureManager.jsx`)
4. **TenantDashboard** (`src/components/tenant/TenantDashboard.jsx`)
5. **WhiteLabelPreview** (`src/components/tenant/WhiteLabelPreview.jsx`)

#### Implementation Steps
1. Create tenant context and provider
2. Implement branding customization system
3. Add feature toggle management
4. Create tenant-aware routing
5. Implement custom content management
6. Add tenant isolation middleware

### User Stories
- As a client, I want my branded version of the app with my colors and logo
- As a client, I want to enable/disable features based on my subscription
- As a client, I want custom terms of service and privacy policy

## Feature 2: Multi-city Support

### Requirements
- **Manage tours across different locations**
- **City-specific configurations**
- **Localized content and pricing**
- **Regional admin management**
- **Location-based services**

### Technical Implementation

#### Database Schema Changes
```sql
-- Cities and regions
CREATE TABLE cities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    country VARCHAR(100) NOT NULL,
    state_province VARCHAR(100),
    timezone VARCHAR(50) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    language VARCHAR(10) NOT NULL DEFAULT 'en',
    coordinates JSONB NOT NULL, -- lat, lng
    bounds JSONB, -- geographic boundaries
    is_active BOOLEAN DEFAULT true,
    settings JSONB, -- city-specific configurations
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- City-specific pricing
CREATE TABLE city_pricing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city_id UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
    pricing_type VARCHAR(50) NOT NULL, -- 'base_rate', 'per_km', 'per_hour'
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    effective_from DATE NOT NULL,
    effective_to DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- City administrators
CREATE TABLE city_administrators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    city_id UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'city_admin',
    permissions JSONB,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID REFERENCES user_profiles(id),
    is_active BOOLEAN DEFAULT true,
    UNIQUE(user_id, city_id)
);

-- Add city_id to relevant tables
ALTER TABLE tours ADD COLUMN city_id UUID REFERENCES cities(id);
ALTER TABLE user_profiles ADD COLUMN primary_city_id UUID REFERENCES cities(id);
ALTER TABLE driver_availability ADD COLUMN city_id UUID REFERENCES cities(id);

-- Add indexes
CREATE INDEX idx_tours_city_id ON tours(city_id);
CREATE INDEX idx_user_profiles_primary_city_id ON user_profiles(primary_city_id);
CREATE INDEX idx_driver_availability_city_id ON driver_availability(city_id);
```

#### Components to Create
1. **CityManager** (`src/components/admin/CityManager.jsx`)
2. **CitySelector** (`src/components/common/CitySelector.jsx`)
3. **CityDashboard** (`src/components/city/CityDashboard.jsx`)
4. **LocationBasedServices** (`src/components/city/LocationBasedServices.jsx`)
5. **CityPricingManager** (`src/components/city/CityPricingManager.jsx`)

#### Implementation Steps
1. Create city management system
2. Implement location-based filtering
3. Add city-specific pricing
4. Create regional admin roles
5. Implement localized content
6. Add city-based analytics

### User Stories
- As a tenant, I want to manage tours in multiple cities
- As a city admin, I want to oversee operations in my region
- As a tourist, I want to see tours available in my current city

## Feature 3: Franchise Management

### Requirements
- **Sub-admin roles and permissions**
- **Franchise-specific branding**
- **Revenue sharing and reporting**
- **Franchise performance tracking**
- **Hierarchical management structure**

### Technical Implementation

#### Database Schema Changes
```sql
-- Franchise management
CREATE TABLE franchises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    parent_franchise_id UUID REFERENCES franchises(id),
    franchise_code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    owner_id UUID NOT NULL REFERENCES user_profiles(id),
    contact_info JSONB NOT NULL,
    territory JSONB, -- geographic boundaries
    commission_rate DECIMAL(5,4) NOT NULL DEFAULT 0.1000, -- 10%
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'terminated')),
    contract_start_date DATE NOT NULL,
    contract_end_date DATE,
    settings JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, franchise_code)
);

-- Franchise permissions and roles
CREATE TABLE franchise_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    franchise_id UUID NOT NULL REFERENCES franchises(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,
    permissions JSONB NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID REFERENCES user_profiles(id),
    is_active BOOLEAN DEFAULT true,
    UNIQUE(franchise_id, user_id)
);

-- Franchise revenue tracking
CREATE TABLE franchise_revenue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    franchise_id UUID NOT NULL REFERENCES franchises(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES tour_bookings(id) ON DELETE SET NULL,
    revenue_type VARCHAR(50) NOT NULL, -- 'booking', 'commission', 'fee'
    gross_amount DECIMAL(10,2) NOT NULL,
    commission_amount DECIMAL(10,2) NOT NULL,
    net_amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    revenue_date DATE NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Franchise performance metrics
CREATE TABLE franchise_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    franchise_id UUID NOT NULL REFERENCES franchises(id) ON DELETE CASCADE,
    metric_date DATE NOT NULL,
    tours_completed INTEGER DEFAULT 0,
    total_revenue DECIMAL(10,2) DEFAULT 0,
    commission_earned DECIMAL(10,2) DEFAULT 0,
    customer_satisfaction DECIMAL(3,2),
    active_drivers INTEGER DEFAULT 0,
    bookings_count INTEGER DEFAULT 0,
    cancellation_rate DECIMAL(5,4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(franchise_id, metric_date)
);

-- Add franchise_id to relevant tables
ALTER TABLE tours ADD COLUMN franchise_id UUID REFERENCES franchises(id);
ALTER TABLE user_profiles ADD COLUMN franchise_id UUID REFERENCES franchises(id);
ALTER TABLE tour_bookings ADD COLUMN franchise_id UUID REFERENCES franchises(id);
```

#### Components to Create
1. **FranchiseManager** (`src/components/admin/FranchiseManager.jsx`)
2. **FranchiseDashboard** (`src/components/franchise/FranchiseDashboard.jsx`)
3. **RevenueSharing** (`src/components/franchise/RevenueSharing.jsx`)
4. **FranchisePerformance** (`src/components/franchise/FranchisePerformance.jsx`)
5. **PermissionManager** (`src/components/franchise/PermissionManager.jsx`)

#### Implementation Steps
1. Create franchise management system
2. Implement hierarchical permissions
3. Add revenue sharing calculations
4. Create franchise performance tracking
5. Implement territory management
6. Add franchise-specific reporting

### User Stories
- As a tenant, I want to manage multiple franchise locations
- As a franchise owner, I want to track my performance and earnings
- As a franchise manager, I want appropriate permissions for my territory

## Feature 4: Custom Domains

### Requirements
- **Client-specific URLs and branding**
- **SSL certificate management**
- **Domain verification and setup**
- **Subdomain support**
- **CDN integration**

### Technical Implementation

#### Database Schema Changes
```sql
-- Custom domains
CREATE TABLE tenant_domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    domain VARCHAR(255) NOT NULL UNIQUE,
    domain_type VARCHAR(20) NOT NULL DEFAULT 'custom' CHECK (domain_type IN ('subdomain', 'custom', 'apex')),
    is_primary BOOLEAN DEFAULT false,
    ssl_status VARCHAR(20) DEFAULT 'pending' CHECK (ssl_status IN ('pending', 'active', 'failed', 'expired')),
    ssl_certificate_data JSONB,
    verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'failed')),
    verification_token VARCHAR(255),
    dns_records JSONB,
    cdn_settings JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Domain analytics
CREATE TABLE domain_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain_id UUID NOT NULL REFERENCES tenant_domains(id) ON DELETE CASCADE,
    analytics_date DATE NOT NULL,
    page_views INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    bounce_rate DECIMAL(5,4),
    average_session_duration INTEGER, -- seconds
    conversion_rate DECIMAL(5,4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(domain_id, analytics_date)
);

-- Domain redirects and routing
CREATE TABLE domain_routing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain_id UUID NOT NULL REFERENCES tenant_domains(id) ON DELETE CASCADE,
    path_pattern VARCHAR(500) NOT NULL,
    redirect_to VARCHAR(500),
    route_type VARCHAR(20) NOT NULL DEFAULT 'direct' CHECK (route_type IN ('direct', 'redirect', 'proxy')),
    status_code INTEGER DEFAULT 200,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Services to Create
1. **DomainService** (`src/services/DomainService.js`)
2. **SSLService** (`src/services/SSLService.js`)
3. **DNSService** (`src/services/DNSService.js`)
4. **CDNService** (`src/services/CDNService.js`)

#### Components to Create
1. **DomainManager** (`src/components/admin/DomainManager.jsx`)
2. **DomainSetup** (`src/components/tenant/DomainSetup.jsx`)
3. **SSLManager** (`src/components/tenant/SSLManager.jsx`)
4. **DomainAnalytics** (`src/components/tenant/DomainAnalytics.jsx`)

#### Implementation Steps
1. Create domain management system
2. Implement domain verification process
3. Add SSL certificate automation
4. Create DNS management tools
5. Implement CDN integration
6. Add domain analytics tracking

### User Stories
- As a client, I want my app accessible via my custom domain
- As a client, I want automatic SSL certificate management
- As a client, I want analytics for my custom domain

## Tenant Isolation Strategy

### Data Isolation
```sql
-- Row Level Security policies for tenant isolation
CREATE POLICY "Tenant isolation for tours" ON tours
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY "Tenant isolation for users" ON user_profiles
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY "Tenant isolation for bookings" ON tour_bookings
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
```

### Application-Level Isolation
```javascript
// Middleware for tenant context
export const tenantMiddleware = (req, res, next) => {
  const tenantId = getTenantFromRequest(req);
  req.tenantId = tenantId;
  // Set tenant context for database queries
  supabase.rpc('set_tenant_context', { tenant_id: tenantId });
  next();
};
```

## Implementation Priority

### Phase 1 (Weeks 1-3)
1. White-label Solution - Core branding system
2. Multi-city Support - Basic city management

### Phase 2 (Weeks 4-6)
1. Franchise Management - Core functionality
2. Custom Domains - Basic domain support

### Phase 3 (Weeks 7-8)
1. Advanced features for all components
2. Performance optimization and testing

## Testing Strategy

### Unit Tests
- Tenant isolation logic
- Branding customization
- Permission management
- Domain verification

### Integration Tests
- Multi-tenant data isolation
- Cross-city functionality
- Franchise revenue calculations
- Domain routing and SSL

### User Acceptance Tests
- White-label customization flow
- Multi-city tour management
- Franchise dashboard usability
- Custom domain setup process

## Security Considerations

### Tenant Isolation
- Strict data separation
- Cross-tenant access prevention
- Secure tenant context management
- Audit logging for tenant actions

### Domain Security
- SSL certificate validation
- Domain ownership verification
- DNS security measures
- CDN security configuration

## Success Metrics

### Business Metrics
- Number of active tenants
- Revenue per tenant
- Tenant retention rate
- Feature adoption rates

### Technical Metrics
- System performance under multi-tenancy
- Data isolation effectiveness
- Domain setup success rate
- SSL certificate automation success

---

**Next Steps**: Review this specification and confirm implementation approach before proceeding to detailed development.