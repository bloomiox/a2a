import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { User } from '@/api/entities';
import { TourAssignment } from '@/api/entities';
import { Tour } from '@/api/entities';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, MapPin, Clock, RotateCcw, Play, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useLanguage } from '@/components/i18n/LanguageContext';
import { format } from 'date-fns';

export default function DriverHistory() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [driver, setDriver] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [tours, setTours] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isRestarting, setIsRestarting] = useState(null);

  useEffect(() => {
    loadDriverHistory();
  }, []);

  const loadDriverHistory = async () => {
    setLoading(true);
    setError('');
    try {
      const currentUser = await User.me();
      if (!currentUser || !currentUser.user_group?.includes('Driver')) {
        navigate(createPageUrl('Home'));
        return;
      }
      setDriver(currentUser);

      // Get all assignments for this driver (including completed and cancelled)
      const driverAssignments = await TourAssignment.filter({
        driver_id: currentUser.id
      }, '-created_at');

      setAssignments(driverAssignments || []);

      // Load tour details
      const tourIds = [...new Set(driverAssignments.map(a => a.tour_id))];
      const tourDetails = await Promise.all(
        tourIds.map(async (tourId) => {
          try {
            return await Tour.get(tourId);
          } catch (error) {
            console.error(`Error loading tour ${tourId}:`, error);
            return null;
          }
        })
      );

      const toursMap = {};
      tourDetails.forEach((tour, index) => {
        if (tour) {
          toursMap[tourIds[index]] = tour;
        }
      });
      setTours(toursMap);

    } catch (error) {
      console.error('Error loading driver history:', error);
      setError(t('driver.errorLoadingData'));
    } finally {
      setLoading(false);
    }
  };

  const handleRestartTour = async (assignment) => {
    if (!assignment || !tours[assignment.tour_id]) return;
    
    setIsRestarting(assignment.id);
    try {
      // Create a new assignment for the same tour
      const newAssignment = await TourAssignment.create({
        tour_id: assignment.tour_id,
        driver_id: assignment.driver_id,
        start_time: new Date().toISOString(),
        status: 'assigned',
        completed_stops: [],
        notes: `Restarted from previous tour on ${new Date().toLocaleString()}`
      });

      // Navigate to the driver navigation page with the new tour
      navigate(`${createPageUrl('DriverNavigation')}?tourId=${assignment.tour_id}`);
    } catch (error) {
      console.error('Error restarting tour:', error);
      alert(t('driver.errorStartingTour'));
    } finally {
      setIsRestarting(null);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      assigned: { variant: 'secondary', icon: Clock, color: 'text-blue-600' },
      in_progress: { variant: 'default', icon: Play, color: 'text-green-600' },
      completed: { variant: 'success', icon: CheckCircle, color: 'text-green-600' },
      cancelled: { variant: 'destructive', icon: XCircle, color: 'text-red-600' }
    };
    
    const config = statusConfig[status] || statusConfig.assigned;
    const IconComponent = config.icon;
    
    return (
      <div className="flex items-center gap-2">
        <IconComponent className={`h-4 w-4 ${config.color}`} />
        <Badge variant={config.variant}>
          {t(`assignment_status.${status}`)}
        </Badge>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-8 w-24" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-36" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('common.error')}</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <Button onClick={loadDriverHistory}>{t('common.tryAgain')}</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const groupedAssignments = {
    active: assignments.filter(a => ['assigned', 'in_progress'].includes(a.status)),
    completed: assignments.filter(a => a.status === 'completed'),
    cancelled: assignments.filter(a => a.status === 'cancelled')
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">{t('driver.navigation.history')}</h1>
        <p className="text-muted-foreground">{t('driver.navigation.reviewPreviousTours')}</p>
      </div>

      <div className="space-y-8">
        {/* Active Tours */}
        {groupedAssignments.active.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Play className="h-5 w-5 text-green-600" />
              {t('driver.navigation.activeTours')}
            </h2>
            <div className="space-y-4">
              {groupedAssignments.active.map((assignment) => {
                const tour = tours[assignment.tour_id];
                if (!tour) return null;

                return (
                  <Card key={assignment.id} className="border-l-4 border-l-green-500">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold">{tour.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{tour.description}</p>
                        </div>
                        {getStatusBadge(assignment.status)}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        {tour.location && (
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>{tour.location.city}, {tour.location.country}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{format(new Date(assignment.start_time), 'MMM d, yyyy HH:mm')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{assignment.completed_stops?.length || 0} {t('driver.navigation.stopsCompleted')}</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          onClick={() => navigate(`${createPageUrl('DriverNavigation')}?tourId=${tour.id}`)}
                          className="gap-2"
                        >
                          <Play className="h-4 w-4" />
                          {assignment.status === 'assigned' ? t('driver.startTour') : t('driver.continueTour')}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Completed Tours */}
        {groupedAssignments.completed.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              {t('driver.navigation.completedTours')}
            </h2>
            <ScrollArea className="h-96">
              <div className="space-y-4 pr-4">
                {groupedAssignments.completed.map((assignment) => {
                  const tour = tours[assignment.tour_id];
                  if (!tour) return null;

                  return (
                    <Card key={assignment.id} className="border-l-4 border-l-green-400">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-semibold">{tour.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{tour.description}</p>
                          </div>
                          {getStatusBadge(assignment.status)}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          {tour.location && (
                            <div className="flex items-center gap-2 text-sm">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span>{tour.location.city}, {tour.location.country}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>{format(new Date(assignment.start_time), 'MMM d, yyyy')}</span>
                          </div>
                          {assignment.end_time && (
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span>{t('driver.navigation.completedAt')}: {format(new Date(assignment.end_time), 'HH:mm')}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Button 
                            variant="outline"
                            onClick={() => handleRestartTour(assignment)}
                            disabled={isRestarting === assignment.id}
                            className="gap-2"
                          >
                            {isRestarting === assignment.id ? (
                              <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                            ) : (
                              <RotateCcw className="h-4 w-4" />
                            )}
                            {t('driver.navigation.restartTour')}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Cancelled Tours */}
        {groupedAssignments.cancelled.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              {t('driver.navigation.cancelledTours')}
            </h2>
            <div className="space-y-4">
              {groupedAssignments.cancelled.map((assignment) => {
                const tour = tours[assignment.tour_id];
                if (!tour) return null;

                return (
                  <Card key={assignment.id} className="border-l-4 border-l-red-400">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold">{tour.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{tour.description}</p>
                        </div>
                        {getStatusBadge(assignment.status)}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {tour.location && (
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>{tour.location.city}, {tour.location.country}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{format(new Date(assignment.start_time), 'MMM d, yyyy HH:mm')}</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          variant="outline"
                          onClick={() => handleRestartTour(assignment)}
                          disabled={isRestarting === assignment.id}
                          className="gap-2"
                        >
                          {isRestarting === assignment.id ? (
                            <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                          ) : (
                            <RotateCcw className="h-4 w-4" />
                          )}
                          {t('driver.navigation.restartTour')}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {assignments.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">{t('driver.navigation.noHistoryTitle')}</h3>
              <p className="text-muted-foreground">{t('driver.navigation.noHistoryDesc')}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}