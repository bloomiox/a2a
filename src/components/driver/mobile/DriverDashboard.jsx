import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Car, 
  MapPin, 
  Clock, 
  DollarSign, 
  Star, 
  Users, 
  Navigation,
  Bell,
  Settings,
  TrendingUp,
  Battery,
  Wifi,
  WifiOff
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import driverPerformanceService from '@/services/DriverPerformanceService';

const DriverDashboard = ({ driverId }) => {
  const [availability, setAvailability] = useState(null);
  const [performanceSummary, setPerformanceSummary] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [location, setLocation] = useState(null);
  const [batteryLevel, setBatteryLevel] = useState(100);

  useEffect(() => {
    loadDriverData();
    startLocationTracking();
    checkBatteryStatus();

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Refresh data every 30 seconds
    const interval = setInterval(loadDriverData, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [driverId]);

  const loadDriverData = async () => {
    try {
      // Load availability status (with fallback)
      try {
        const availabilityData = await driverPerformanceService.getDriverAvailability(driverId);
        setAvailability(availabilityData);
      } catch (availErr) {
        console.warn('Availability data not available:', availErr);
        // Set default availability
        setAvailability({
          status: 'offline',
          updated_at: new Date().toISOString(),
          shift_start: null,
          shift_end: null
        });
      }

      // Load performance summary (with fallback)
      try {
        const summary = await driverPerformanceService.getPerformanceSummary(driverId, 'week');
        setPerformanceSummary(summary);
      } catch (perfErr) {
        console.warn('Performance data not available:', perfErr);
        // Set default performance summary
        setPerformanceSummary({
          totalTours: 0,
          totalRevenue: 0,
          averageRating: 0,
          onTimePercentage: 0,
          totalDistance: 0,
          totalTime: 0
        });
      }

      // Load notifications (with fallback)
      try {
        const notificationData = await driverPerformanceService.getDriverNotifications(driverId, true);
        setNotifications((notificationData || []).slice(0, 3)); // Show only 3 recent notifications
      } catch (notifErr) {
        console.warn('Notifications not available:', notifErr);
        setNotifications([]);
      }
    } catch (error) {
      console.error('Failed to load driver data:', error);
      // Set all fallback data
      setAvailability({
        status: 'offline',
        updated_at: new Date().toISOString(),
        shift_start: null,
        shift_end: null
      });
      setPerformanceSummary({
        totalTours: 0,
        totalRevenue: 0,
        averageRating: 0,
        onTimePercentage: 0,
        totalDistance: 0,
        totalTime: 0
      });
      setNotifications([]);
    }
  };

  const startLocationTracking = () => {
    if (!navigator.geolocation) {
      console.warn('Geolocation not supported');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date().toISOString()
        };
        setLocation(newLocation);
      },
      (error) => {
        console.error('Location error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  };

  const checkBatteryStatus = async () => {
    try {
      if ('getBattery' in navigator) {
        const battery = await navigator.getBattery();
        setBatteryLevel(Math.round(battery.level * 100));
        
        battery.addEventListener('levelchange', () => {
          setBatteryLevel(Math.round(battery.level * 100));
        });
      }
    } catch (error) {
      console.error('Battery API not supported:', error);
    }
  };

  const handleAvailabilityToggle = async (isAvailable) => {
    try {
      const newStatus = isAvailable ? 'available' : 'offline';
      
      await driverPerformanceService.updateAvailability(
        driverId, 
        newStatus, 
        location
      );

      setAvailability(prev => ({
        ...prev,
        status: newStatus,
        updated_at: new Date().toISOString()
      }));

      toast({
        title: "Status Updated",
        description: `You are now ${isAvailable ? 'available' : 'offline'} for tours.`,
      });
    } catch (error) {
      console.error('Failed to update availability:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update availability status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'busy': return 'bg-blue-500';
      case 'break': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'available': return 'Available';
      case 'busy': return 'On Tour';
      case 'break': return 'On Break';
      case 'offline': return 'Offline';
      default: return 'Unknown';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (!availability || !performanceSummary) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 max-w-md mx-auto">
      {/* Header with Status */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Driver Dashboard</CardTitle>
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
              <Battery className={`h-4 w-4 ${batteryLevel < 20 ? 'text-red-500' : 'text-green-500'}`} />
              <span className="text-xs">{batteryLevel}%</span>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Availability Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              <span className="font-medium">Available for Tours</span>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={availability.status === 'available'}
                onCheckedChange={handleAvailabilityToggle}
                disabled={!isOnline}
              />
              <Badge className={getStatusColor(availability.status)}>
                {getStatusText(availability.status)}
              </Badge>
            </div>
          </div>

          {/* Location Status */}
          {location && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4" />
              <span>Location: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}</span>
            </div>
          )}

          {/* Shift Time */}
          {availability.shift_start && availability.status !== 'offline' && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>
                Shift started: {new Date(availability.shift_start).toLocaleTimeString()}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            This Week's Performance
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {performanceSummary.totalTours}
              </div>
              <div className="text-xs text-gray-600">Tours Completed</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(performanceSummary.totalRevenue)}
              </div>
              <div className="text-xs text-gray-600">Revenue</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600 flex items-center justify-center gap-1">
                <Star className="h-4 w-4" />
                {performanceSummary.averageRating.toFixed(1)}
              </div>
              <div className="text-xs text-gray-600">Average Rating</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {performanceSummary.onTimePercentage.toFixed(0)}%
              </div>
              <div className="text-xs text-gray-600">On Time</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-2">
          <Button className="w-full justify-start" variant="outline">
            <Navigation className="h-4 w-4 mr-2" />
            Start Navigation
          </Button>
          
          <Button className="w-full justify-start" variant="outline">
            <Users className="h-4 w-4 mr-2" />
            View Current Tour
          </Button>
          
          <Button className="w-full justify-start" variant="outline">
            <DollarSign className="h-4 w-4 mr-2" />
            View Earnings
          </Button>
          
          <Button className="w-full justify-start" variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </CardContent>
      </Card>

      {/* Recent Notifications */}
      {notifications.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Recent Notifications
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-2">
            {notifications.map((notification) => (
              <div 
                key={notification.id}
                className="p-3 bg-gray-50 rounded-md"
              >
                <div className="font-medium text-sm">{notification.title}</div>
                <div className="text-xs text-gray-600 mt-1">
                  {notification.message}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(notification.created_at).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Offline Notice */}
      {!isOnline && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-yellow-800">
              <WifiOff className="h-4 w-4" />
              <span className="text-sm">
                You're offline. Some features may be limited.
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DriverDashboard;