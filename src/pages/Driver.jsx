import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import ThemeWrapper from '@/components/common/ThemeWrapper';
import FeatureGate, { useFeature } from '@/components/common/FeatureGate';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { User } from '@/api/entities';
import { TourAssignment } from '@/api/entities';
import { Tour } from '@/api/entities';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, User as UserIcon, LogOut, Play, MapPin, Calendar, AlertTriangle, ChevronsRight } from 'lucide-react';
import { useLanguage } from '@/components/i18n/LanguageContext';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function DriverDashboard() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [driver, setDriver] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [tours, setTours] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isStartTourDialogOpen, setIsStartTourDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [startTourDetails, setStartTourDetails] = useState({
    vehicle_details: '',
    group_size: ''
  });
  const [isStartingTour, setIsStartingTour] = useState(false);

  useEffect(() => {
    loadDriverData();
  }, []);

  const loadDriverData = async () => {
    setLoading(true);
    setError('');
    try {
      const currentUser = await User.me();
      if (!currentUser || !currentUser.user_group?.includes('Driver')) {
        navigate(createPageUrl('Home'));
        return;
      }
      setDriver(currentUser);

      const driverAssignments = await TourAssignment.filter({
        driver_id: currentUser.id,
        status: { $in: ['assigned', 'in_progress'] }
      }, 'start_time');

      setAssignments(driverAssignments || []);

      const tourIds = [...new Set(driverAssignments.map(a => a.tour_id))];
      const tourDetails = await Promise.all(
        tourIds.map(id => Tour.get(id).catch(e => {
          console.warn(`Could not load tour ${id}`, e);
          return { id, title: 'Unknown Tour', description: 'Tour details could not be loaded.' };
        }))
      );

      setTours(tourDetails.reduce((acc, tour) => {
        acc[tour.id] = tour;
        return acc;
      }, {}));

    } catch (err) {
      console.error("Error loading driver data:", err);
      setError(t('driver.errorLoadingData'));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await User.logout();
    navigate(createPageUrl("Landing"));
  };

  const openStartTourDialog = (assignment) => {
    setSelectedAssignment(assignment);
    setStartTourDetails({ vehicle_details: '', group_size: '' });
    setIsStartTourDialogOpen(true);
  };

  const handleStartTour = async () => {
    console.log('handleStartTour called');
    console.log('selectedAssignment:', selectedAssignment);
    console.log('startTourDetails:', startTourDetails);

    if (!selectedAssignment || !startTourDetails.vehicle_details || !startTourDetails.group_size) {
      console.log('Missing required details, showing alert');
      alert("Please fill in all details.");
      return;
    }

    console.log('Starting tour process...');
    setIsStartingTour(true);
    try {
      console.log('Starting tour with assignment:', selectedAssignment);
      console.log('Update data:', {
        status: 'in_progress',
        start_time: new Date().toISOString(),
        vehicle_details: startTourDetails.vehicle_details,
        group_size: parseInt(startTourDetails.group_size, 10),
      });

      const updateData = {
        status: 'in_progress',
        start_time: new Date().toISOString(),
        vehicle_details: startTourDetails.vehicle_details,
        group_size: parseInt(startTourDetails.group_size, 10),
      };

      console.log('Updating assignment with ID:', selectedAssignment.id);
      console.log('Update data:', updateData);

      let updatedAssignment;
      try {
        updatedAssignment = await TourAssignment.update(selectedAssignment.id, updateData);
        console.log('Assignment updated successfully:', updatedAssignment);
      } catch (updateError) {
        console.error('Error updating assignment:', updateError);
        throw updateError;
      }
      
      // Add a small delay to ensure the update is processed
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const navigationUrl = `${createPageUrl('DriverNavigation')}?tourId=${selectedAssignment.tour_id}`;
      console.log('Navigating to URL:', navigationUrl);

      setIsStartTourDialogOpen(false);
      navigate(navigationUrl);
    } catch (err) {
      console.error(t('driver.errorStartingTour'), err);
      alert(t('driver.errorStartingTour'));
    } finally {
      setIsStartingTour(false);
    }
  };

  const activeAssignments = assignments.filter(a => a.status === 'in_progress');
  const upcomingAssignments = assignments.filter(a => a.status === 'assigned');

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <ThemeWrapper>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t('driver.welcome')}, {driver?.full_name?.split(' ')[0]}!</h1>
              <p className="text-gray-600 mt-1">{t('driver.dashboardSubtitle')}</p>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(createPageUrl('Profile'))}>
                <UserIcon className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="h-5 w-5 text-destructive" />
              </Button>
            </div>
          </div>
        </div>
        
        {error && (
            <Card className="bg-red-50 border-red-200">
                <CardContent className="pt-6 flex items-center gap-4">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                    <div>
                        <h4 className="font-semibold text-red-800">An Error Occurred</h4>
                        <p className="text-red-700">{error}</p>
                    </div>
                </CardContent>
            </Card>
        )}

        {/* Active Tour Section */}
        {activeAssignments.length > 0 ? (
          <Card className="border-primary shadow-lg">
            <CardHeader>
              <CardTitle className="text-primary">{t('driver.tourInProgress')}</CardTitle>
              <CardDescription>Your current active tour. Click to continue.</CardDescription>
            </CardHeader>
            <CardContent>
              {activeAssignments.map(assignment => {
                const tour = tours[assignment.tour_id];
                return (
                  <FeatureGate 
                    key={assignment.id}
                    feature="enableLiveTracking"
                    fallback={
                      <div className="p-4 rounded-lg bg-gray-100 border-2 border-dashed border-gray-300">
                        <h3 className="text-lg font-semibold text-gray-600">{tour?.title || 'Loading...'}</h3>
                        <p className="text-gray-500 text-sm mt-1">{tour?.description}</p>
                        <div className="flex justify-end mt-4">
                          <Button disabled variant="outline">
                            Navigation Disabled
                          </Button>
                        </div>
                      </div>
                    }
                  >
                    <div className="p-4 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer"
                         onClick={() => navigate(`${createPageUrl('DriverNavigation')}?tourId=${tour.id}`)}>
                      <h3 className="text-lg font-semibold">{tour?.title || 'Loading...'}</h3>
                      <p className="text-muted-foreground text-sm mt-1">{tour?.description}</p>
                      <div className="flex justify-end mt-4">
                        <Button>
                          Continue Navigation <ChevronsRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  </FeatureGate>
                );
              })}
            </CardContent>
          </Card>
        ) : upcomingAssignments.length === 0 && (
            <Card>
                <CardContent className="p-12 text-center">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('driver.noActiveTourTitle')}</h3>
                    <p className="text-gray-600">{t('driver.noActiveTourDescription')}</p>
                </CardContent>
            </Card>
        )}

        {/* Upcoming Tours Section */}
        {upcomingAssignments.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">{t('driver.tourAssigned')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingAssignments.map(assignment => {
                const tour = tours[assignment.tour_id];
                return (
                  <Card key={assignment.id}>
                    <CardHeader>
                      <CardTitle>{tour?.title || 'Loading...'}</CardTitle>
                      <Badge variant="secondary" className="w-fit mt-2">Assigned</Badge>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>{tour?.location?.city}, {tour?.location?.country}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{format(new Date(assignment.start_time), 'PPP p')}</span>
                        </div>
                      </div>
                      <Button className="w-full mt-4" onClick={() => openStartTourDialog(assignment)}>
                        <Play className="mr-2 h-4 w-4" /> {t('driver.startTour')}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
      
      {/* Start Tour Dialog */}
      <Dialog open={isStartTourDialogOpen} onOpenChange={setIsStartTourDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start Tour: {tours[selectedAssignment?.tour_id]?.title}</DialogTitle>
            <DialogDescription>
              Please confirm the details for this tour before starting.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="vehicle-details">Vehicle Details</Label>
              <Input
                id="vehicle-details"
                placeholder="e.g., White Ford Transit, ABC-123"
                value={startTourDetails.vehicle_details}
                onChange={(e) => setStartTourDetails({ ...startTourDetails, vehicle_details: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="group-size">Number of Tourists</Label>
              <Input
                id="group-size"
                type="number"
                placeholder="e.g., 8"
                value={startTourDetails.group_size}
                onChange={(e) => setStartTourDetails({ ...startTourDetails, group_size: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStartTourDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleStartTour}
              disabled={isStartingTour || !startTourDetails.vehicle_details || !startTourDetails.group_size}
            >
              {isStartingTour && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm & Start Tour
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </ThemeWrapper>
  );
}