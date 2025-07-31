import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Home, 
  Navigation, 
  BarChart3, 
  DollarSign, 
  Bell,
  Menu,
  ArrowLeft,
  Car,
  MapPin,
  Clock,
  Users
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/api/supabaseClient';
import DriverDashboard from '@/components/driver/mobile/DriverDashboard';
import driverPerformanceService from '@/services/DriverPerformanceService';
import AppWrapper from '@/components/common/ThemeWrapper';
import advancedFeaturesInitializer from '@/utils/initializeAdvancedFeatures';

const DriverMobileApp = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentTour, setCurrentTour] = useState(null);
  const [earnings, setEarnings] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Initialize advanced features first
      await advancedFeaturesInitializer.initialize();
      
      // Then check auth and load data
      await checkAuth();
      await loadDriverData();
    } catch (error) {
      console.error('App initialization failed:', error);
      // Continue with auth check anyway
      checkAuth();
    }
  };

  const checkAuth = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        navigate('/login');
        return;
      }

      // Check if user is a driver
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError || !profile || !profile.user_group?.includes('Driver')) {
        toast({
          title: "Access Denied",
          description: "This page is only accessible to drivers.",
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      setUser(user);
    } catch (error) {
      console.error('Auth check failed:', error);
      navigate('/login');
    }
  };

  const loadDriverData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Load current tour assignment (gracefully handle missing table)
      try {
        const { data: tourData, error: tourError } = await supabase
          .from('tour_assignments')
          .select(`
            *,
            tours (
              id,
              title,
              description,
              location
            )
          `)
          .eq('driver_id', user.id)
          .eq('status', 'assigned')
          .order('start_time', { ascending: true })
          .limit(1);

        if (!tourError && tourData?.length > 0) {
          setCurrentTour(tourData[0]);
        }
      } catch (tourErr) {
        console.warn('Tour assignments table not available:', tourErr);
        // Continue without tour data
      }

      // Load recent earnings (gracefully handle missing table)
      try {
        const { data: earningsData, error: earningsError } = await supabase
          .from('driver_earnings')
          .select('*')
          .eq('driver_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (!earningsError && earningsData) {
          const totalEarnings = earningsData.reduce((sum, earning) => sum + parseFloat(earning.net_amount || 0), 0);
          setEarnings({
            recent: earningsData,
            total: totalEarnings
          });
        }
      } catch (earningsErr) {
        console.warn('Driver earnings table not available:', earningsErr);
        // Set default earnings
        setEarnings({
          recent: [],
          total: 0
        });
      }

      // Load notifications (gracefully handle service errors)
      try {
        const notificationData = await driverPerformanceService.getDriverNotifications(user.id);
        setNotifications(notificationData || []);
      } catch (notificationErr) {
        console.warn('Driver notifications not available:', notificationErr);
        setNotifications([]);
      }

    } catch (error) {
      console.error('Failed to load driver data:', error);
      // Set default values so the app can still work
      setEarnings({ recent: [], total: 0 });
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTour = async () => {
    if (!currentTour) return;

    try {
      // Update tour status to active
      const { error } = await supabase
        .from('tour_assignments')
        .update({ 
          status: 'active',
          start_time: new Date().toISOString()
        })
        .eq('id', currentTour.id);

      if (error) throw error;

      // Update driver availability to busy
      await driverPerformanceService.updateAvailability(user.id, 'busy');

      toast({
        title: "Tour Started",
        description: "Your tour has been started successfully.",
      });

      // Refresh data
      loadDriverData();
    } catch (error) {
      console.error('Failed to start tour:', error);
      toast({
        title: "Error",
        description: "Failed to start tour. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCompleteTour = async () => {
    if (!currentTour) return;

    try {
      // Update tour status to completed
      const { error } = await supabase
        .from('tour_assignments')
        .update({ 
          status: 'completed',
          end_time: new Date().toISOString()
        })
        .eq('id', currentTour.id);

      if (error) throw error;

      // Update driver availability to available
      await driverPerformanceService.updateAvailability(user.id, 'available');

      toast({
        title: "Tour Completed",
        description: "Your tour has been completed successfully.",
      });

      // Clear current tour and refresh data
      setCurrentTour(null);
      loadDriverData();
    } catch (error) {
      console.error('Failed to complete tour:', error);
      toast({
        title: "Error",
        description: "Failed to complete tour. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <AppWrapper>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-lg">Loading driver app...</p>
          </div>
        </div>
      </AppWrapper>
    );
  }

  return (
    <AppWrapper>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b sticky top-0 z-10">
          <div className="flex items-center justify-between p-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/driver')}
              className="p-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            
            <h1 className="text-lg font-semibold">Driver App</h1>
            
            <div className="relative">
              <Button variant="ghost" size="sm" className="p-2">
                <Bell className="h-5 w-5" />
                {notifications.filter(n => !n.is_read).length > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs">
                    {notifications.filter(n => !n.is_read).length}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Current Tour Alert */}
        {currentTour && (
          <div className="bg-blue-50 border-b border-blue-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Car className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="font-medium text-blue-900">
                    {currentTour.tours?.title}
                  </div>
                  <div className="text-sm text-blue-700">
                    {currentTour.status === 'assigned' ? 'Ready to start' : 'In progress'}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                {currentTour.status === 'assigned' && (
                  <Button size="sm" onClick={handleStartTour}>
                    Start Tour
                  </Button>
                )}
                {currentTour.status === 'active' && (
                  <Button size="sm" variant="outline" onClick={handleCompleteTour}>
                    Complete
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="pb-20">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsContent value="dashboard" className="mt-0">
              <DriverDashboard driverId={user?.id} />
            </TabsContent>

            <TabsContent value="navigation" className="mt-0 p-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Navigation className="h-5 w-5" />
                    Navigation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {currentTour ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span className="text-sm">
                          {currentTour.tours?.location?.start_point?.address || 'Location not set'}
                        </span>
                      </div>
                      
                      <Button className="w-full">
                        Open in Maps
                      </Button>
                      
                      <div className="text-sm text-gray-600">
                        <div>Group Size: {currentTour.group_size || 'Not specified'}</div>
                        <div>Vehicle: {currentTour.vehicle_details || 'Not specified'}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No active tour. Navigation will be available when you have an assigned tour.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="performance" className="mt-0 p-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-500">
                    Performance analytics coming soon...
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="earnings" className="mt-0 p-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Earnings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {earnings ? (
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-600">
                          {formatCurrency(earnings.total)}
                        </div>
                        <div className="text-sm text-gray-600">Total Earnings</div>
                      </div>
                      
                      <div className="space-y-2">
                        <h3 className="font-medium">Recent Earnings</h3>
                        {earnings.recent.slice(0, 5).map((earning) => (
                          <div key={earning.id} className="flex justify-between items-center py-2 border-b">
                            <div>
                              <div className="text-sm font-medium">
                                {earning.earning_type.replace('_', ' ').toUpperCase()}
                              </div>
                              <div className="text-xs text-gray-600">
                                {new Date(earning.created_at).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">
                                {formatCurrency(earning.net_amount)}
                              </div>
                              <Badge variant={earning.payment_status === 'paid' ? 'default' : 'outline'}>
                                {earning.payment_status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No earnings data available.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
          <div className="flex">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex-1 flex flex-col items-center py-3 px-2 ${
                activeTab === 'dashboard' ? 'text-blue-600' : 'text-gray-600'
              }`}
            >
              <Home className="h-5 w-5" />
              <span className="text-xs mt-1">Dashboard</span>
            </button>
            
            <button
              onClick={() => setActiveTab('navigation')}
              className={`flex-1 flex flex-col items-center py-3 px-2 ${
                activeTab === 'navigation' ? 'text-blue-600' : 'text-gray-600'
              }`}
            >
              <Navigation className="h-5 w-5" />
              <span className="text-xs mt-1">Navigation</span>
            </button>
            
            <button
              onClick={() => setActiveTab('performance')}
              className={`flex-1 flex flex-col items-center py-3 px-2 ${
                activeTab === 'performance' ? 'text-blue-600' : 'text-gray-600'
              }`}
            >
              <BarChart3 className="h-5 w-5" />
              <span className="text-xs mt-1">Performance</span>
            </button>
            
            <button
              onClick={() => setActiveTab('earnings')}
              className={`flex-1 flex flex-col items-center py-3 px-2 ${
                activeTab === 'earnings' ? 'text-blue-600' : 'text-gray-600'
              }`}
            >
              <DollarSign className="h-5 w-5" />
              <span className="text-xs mt-1">Earnings</span>
            </button>
          </div>
        </div>
      </div>
    </AppWrapper>
  );
};

export default DriverMobileApp;