# Driver Mobile App Implementation Guide

## Overview

The AudioGuide app now includes a dedicated mobile-optimized interface for drivers, providing real-time tour management, performance tracking, and earnings monitoring on mobile devices.

## Features

### 1. Mobile Dashboard
- **Real-time Status**: Online/offline status with availability toggle
- **Performance Metrics**: Weekly performance summary with key KPIs
- **Quick Actions**: Easy access to navigation, earnings, and settings
- **Battery Monitoring**: Battery level indicator for device management

### 2. Tour Management
- **Active Tours**: View and manage current tour assignments
- **Tour Controls**: Start, pause, and complete tours with one tap
- **Navigation Integration**: Quick access to GPS navigation
- **Group Management**: Track group size and vehicle details

### 3. Performance Tracking
- **Real-time Metrics**: Tours completed, distance, time, ratings
- **Trend Analysis**: Performance trends over time
- **Goal Tracking**: Set and monitor performance goals
- **Peer Comparison**: Compare performance with other drivers

### 4. Earnings Management
- **Live Earnings**: Real-time earnings tracking
- **Payment History**: Detailed payment records
- **Tax Reporting**: Automated tax calculation and reporting
- **Expense Tracking**: Track business expenses

## Implementation Details

### Database Schema

#### driver_app_sessions
```sql
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
```

#### driver_availability
```sql
CREATE TABLE driver_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'offline',
    current_location JSONB,
    availability_radius INTEGER DEFAULT 10000,
    shift_start TIMESTAMP WITH TIME ZONE,
    shift_end TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### driver_performance_metrics
```sql
CREATE TABLE driver_performance_metrics (
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
```

### Core Components

#### DriverPerformanceService
Location: `src/services/DriverPerformanceService.js`

Main service for driver functionality:
- Performance metrics calculation
- Availability management
- Notification handling
- Earnings tracking

Key methods:
- `recordDailyMetrics(driverId, date, metrics)` - Record performance data
- `getPerformanceSummary(driverId, period)` - Get performance summary
- `updateAvailability(driverId, status, location)` - Update driver status
- `getAvailableDrivers(location, radius)` - Find available drivers
- `createNotification(driverId, type, title, message)` - Send notifications

#### DriverDashboard Component
Location: `src/components/driver/mobile/DriverDashboard.jsx`

Mobile dashboard interface:
- Status toggle and location tracking
- Performance metrics display
- Quick action buttons
- Notification center

#### DriverMobileApp Page
Location: `src/pages/DriverMobileApp.jsx`

Main mobile app interface:
- Tab-based navigation
- Tour management
- Earnings tracking
- Performance analytics

## Usage Guide

### For Drivers

#### Accessing Mobile App
1. Log in to the driver dashboard
2. Click "📱 Mobile App" button in the header
3. Bookmark the mobile app URL for quick access
4. Use on mobile device for best experience

#### Managing Availability
1. Toggle availability switch on dashboard
2. App tracks location when available
3. Receive notifications for tour assignments
4. Update status (available, busy, break, offline)

#### Tour Management
1. View assigned tours in dashboard
2. Start tours with vehicle and group details
3. Use navigation for route guidance
4. Complete tours and update status

#### Performance Monitoring
1. View weekly performance summary
2. Track key metrics (tours, rating, revenue)
3. Compare with previous periods
4. Set performance goals

### For Administrators

#### Driver Monitoring
- View all driver availability statuses
- Track driver performance metrics
- Send notifications to drivers
- Monitor tour assignments

#### Performance Analytics
- Generate driver performance reports
- Analyze trends and patterns
- Identify top performers
- Track operational efficiency

## Mobile Optimization

### Responsive Design
- Mobile-first approach
- Touch-friendly interface
- Optimized for small screens
- Fast loading times

### Performance Features
- Offline capability for core functions
- Efficient data usage
- Battery optimization
- Background sync

### User Experience
- Intuitive navigation
- Quick actions
- Real-time updates
- Minimal data entry

## API Integration

### Real-time Updates
```javascript
// Update driver availability
await driverPerformanceService.updateAvailability(
  driverId, 
  'available', 
  { latitude: 40.7128, longitude: -74.0060 }
);

// Get performance summary
const summary = await driverPerformanceService.getPerformanceSummary(
  driverId, 
  'week'
);
```

### Location Tracking
```javascript
// Start location tracking
navigator.geolocation.watchPosition(
  (position) => {
    const location = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy
    };
    // Update driver location
  },
  { enableHighAccuracy: true, timeout: 10000 }
);
```

### Notification Handling
```javascript
// Create driver notification
await driverPerformanceService.createNotification(
  driverId,
  'tour_assignment',
  'New Tour Assignment',
  'You have been assigned a new tour starting at 2:00 PM',
  { tourId: 'tour-123' },
  'high'
);
```

## Security Considerations

### Authentication
- Secure session management
- Token-based authentication
- Role-based access control
- Session timeout handling

### Data Protection
- Location data encryption
- Secure API endpoints
- Privacy controls
- Audit logging

### Device Security
- Device registration
- Session validation
- Secure storage
- Remote logout capability

## Performance Metrics

### Key Performance Indicators (KPIs)
- **Tours Completed**: Number of tours finished
- **Average Rating**: Customer satisfaction rating
- **On-time Percentage**: Punctuality metric
- **Revenue Generated**: Earnings per period
- **Fuel Efficiency**: Distance per fuel unit
- **Safety Incidents**: Safety record tracking

### Calculation Methods
```javascript
// Performance summary calculation
const summary = {
  totalTours: metrics.reduce((sum, m) => sum + m.tours_completed, 0),
  averageRating: metrics.reduce((sum, m) => sum + m.average_rating, 0) / metrics.length,
  onTimePercentage: metrics.reduce((sum, m) => sum + m.on_time_percentage, 0) / metrics.length,
  totalRevenue: metrics.reduce((sum, m) => sum + m.revenue_generated, 0)
};
```

### Ranking System
- Composite score calculation
- Peer comparison
- Performance percentiles
- Achievement tracking

## Offline Capabilities

### Core Offline Features
- View current tour information
- Update tour status
- Track basic metrics
- Access emergency contacts

### Sync When Online
- Upload performance data
- Sync tour updates
- Receive notifications
- Update availability status

## Testing

### Mobile Testing
- Cross-device compatibility
- Touch interaction testing
- Performance on slow networks
- Battery usage optimization

### Unit Tests
```javascript
// Test performance calculation
test('should calculate performance summary correctly', () => {
  const metrics = [/* test data */];
  const summary = calculateSummary(metrics);
  expect(summary.totalTours).toBe(expectedValue);
});
```

### Integration Tests
- API endpoint testing
- Real-time update testing
- Location tracking accuracy
- Notification delivery

## Deployment

### Mobile-Specific Configuration
- Viewport meta tags
- Touch event handling
- Offline service worker
- App manifest for PWA

### Performance Optimization
- Code splitting for mobile
- Image optimization
- Lazy loading
- Caching strategies

## Troubleshooting

### Common Issues

#### Location Not Working
- Check browser permissions
- Verify GPS is enabled
- Test location accuracy
- Clear browser cache

#### Performance Data Missing
- Check internet connectivity
- Verify authentication
- Refresh app data
- Contact support

#### App Not Loading
- Clear browser cache
- Check device compatibility
- Verify network connection
- Try different browser

### Debug Tools
```javascript
// Debug driver performance
console.log('Driver metrics:', await getDriverMetrics(driverId));
console.log('Availability:', await getDriverAvailability(driverId));
console.log('Notifications:', await getDriverNotifications(driverId));
```

## Future Enhancements

### Planned Features
- Voice commands for hands-free operation
- Advanced route optimization
- Predictive analytics
- Integration with vehicle systems
- Augmented reality navigation

### Technical Improvements
- Progressive Web App (PWA) features
- Push notification support
- Advanced offline capabilities
- Machine learning insights
- Real-time collaboration tools

## Support

For technical support:
- Check troubleshooting section
- Review API documentation
- Contact development team
- Submit bug reports through app

---

**Note**: The mobile app requires modern browser features including geolocation, local storage, and service workers. Ensure target devices support these capabilities.