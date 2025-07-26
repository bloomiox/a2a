import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { User, TourBooking, Tour } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  DollarSign,
  Play,
  X,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { format, isPast, parseISO } from 'date-fns';
import { useLanguage } from '@/components/i18n/LanguageContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function TouristDashboard() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [tours, setTours] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingBooking, setCancellingBooking] = useState(null);

  useEffect(() => {
    loadTouristData();
  }, []);

  const loadTouristData = async () => {
    setLoading(true);
    setError('');
    try {
      const currentUser = await User.me();
      if (!currentUser) {
        navigate(createPageUrl('Login'));
        return;
      }
      setUser(currentUser);

      // Get user's bookings
      const userBookings = await TourBooking.filter({
        user_id: currentUser.id
      }, '-created_at');

      setBookings(userBookings || []);

      // Load tour details for each booking
      const tourIds = [...new Set(userBookings.map(b => b.tour_id))];
      const tourDetails = await Promise.all(
        tourIds.map(async (tourId) => {
          try {
            return await Tour.get(tourId);
          } catch (error) {
            console.error(`Error loading tour ${tourId}:`, error);
            return { id: tourId, title: 'Unknown Tour', description: 'Tour details unavailable' };
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

    } catch (err) {
      console.error('Error loading tourist data:', err);
      setError('Failed to load your bookings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    setCancellingBooking(bookingId);
    try {
      await TourBooking.update(bookingId, { status: 'cancelled' });
      // Refresh bookings
      await loadTouristData();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert('Failed to cancel booking. Please try again.');
    } finally {
      setCancellingBooking(null);
    }
  };

  const groupedBookings = {
    upcoming: bookings.filter(b => 
      b.status === 'confirmed' && 
      !isPast(parseISO(`${b.tour_date}T${b.tour_time}`))
    ),
    past: bookings.filter(b => 
      (b.status === 'completed' || 
       (b.status === 'confirmed' && isPast(parseISO(`${b.tour_date}T${b.tour_time}`))))
    ),
    pending: bookings.filter(b => b.status === 'pending_payment'),
    cancelled: bookings.filter(b => b.status === 'cancelled')
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-8 w-64 mb-6" />
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
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Bookings</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <Button onClick={loadTouristData}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">My Bookings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your tour bookings and view your travel history
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{groupedBookings.upcoming.length}</div>
              <div className="text-sm text-muted-foreground">Upcoming Tours</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{groupedBookings.past.length}</div>
              <div className="text-sm text-muted-foreground">Completed Tours</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{groupedBookings.pending.length}</div>
              <div className="text-sm text-muted-foreground">Pending Payment</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{groupedBookings.cancelled.length}</div>
              <div className="text-sm text-muted-foreground">Cancelled</div>
            </CardContent>
          </Card>
        </div>

        {/* Bookings Tabs */}
        <Tabs defaultValue="upcoming" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upcoming">Upcoming ({groupedBookings.upcoming.length})</TabsTrigger>
            <TabsTrigger value="past">Past ({groupedBookings.past.length})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({groupedBookings.pending.length})</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled ({groupedBookings.cancelled.length})</TabsTrigger>
          </TabsList>

          {/* Upcoming Bookings */}
          <TabsContent value="upcoming" className="space-y-4">
            {groupedBookings.upcoming.length > 0 ? (
              groupedBookings.upcoming.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  tour={tours[booking.tour_id]}
                  onCancel={handleCancelBooking}
                  cancellingBooking={cancellingBooking}
                  showActions={true}
                />
              ))
            ) : (
              <EmptyState
                title="No Upcoming Tours"
                description="You don't have any upcoming tours. Explore our tours to book your next adventure!"
                actionLabel="Explore Tours"
                onAction={() => navigate(createPageUrl('Explore'))}
              />
            )}
          </TabsContent>

          {/* Past Bookings */}
          <TabsContent value="past" className="space-y-4">
            {groupedBookings.past.length > 0 ? (
              groupedBookings.past.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  tour={tours[booking.tour_id]}
                  showActions={false}
                />
              ))
            ) : (
              <EmptyState
                title="No Past Tours"
                description="You haven't completed any tours yet. Book a tour to start exploring!"
                actionLabel="Browse Tours"
                onAction={() => navigate(createPageUrl('Explore'))}
              />
            )}
          </TabsContent>

          {/* Pending Bookings */}
          <TabsContent value="pending" className="space-y-4">
            {groupedBookings.pending.length > 0 ? (
              groupedBookings.pending.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  tour={tours[booking.tour_id]}
                  onCancel={handleCancelBooking}
                  cancellingBooking={cancellingBooking}
                  showActions={true}
                  isPending={true}
                />
              ))
            ) : (
              <EmptyState
                title="No Pending Payments"
                description="All your bookings are up to date!"
              />
            )}
          </TabsContent>

          {/* Cancelled Bookings */}
          <TabsContent value="cancelled" className="space-y-4">
            {groupedBookings.cancelled.length > 0 ? (
              groupedBookings.cancelled.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  tour={tours[booking.tour_id]}
                  showActions={false}
                />
              ))
            ) : (
              <EmptyState
                title="No Cancelled Bookings"
                description="You haven't cancelled any bookings."
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Booking Card Component
function BookingCard({ booking, tour, onCancel, cancellingBooking, showActions = false, isPending = false }) {
  const navigate = useNavigate();
  
  const getStatusBadge = (status) => {
    const statusConfig = {
      pending_payment: { variant: 'secondary', icon: AlertCircle, color: 'text-yellow-600', label: 'Pending Payment' },
      confirmed: { variant: 'default', icon: CheckCircle, color: 'text-green-600', label: 'Confirmed' },
      completed: { variant: 'success', icon: CheckCircle, color: 'text-green-600', label: 'Completed' },
      cancelled: { variant: 'destructive', icon: X, color: 'text-red-600', label: 'Cancelled' }
    };
    
    const config = statusConfig[status] || statusConfig.confirmed;
    const IconComponent = config.icon;
    
    return (
      <div className="flex items-center gap-2">
        <IconComponent className={`h-4 w-4 ${config.color}`} />
        <Badge variant={config.variant}>
          {config.label}
        </Badge>
      </div>
    );
  };
  
  if (!tour) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Tour information unavailable
          </div>
        </CardContent>
      </Card>
    );
  }

  const tourDateTime = parseISO(`${booking.tour_date}T${booking.tour_time}`);
  const canCancel = !isPast(tourDateTime) && booking.status === 'confirmed';

  return (
    <Card className={`${isPending ? 'border-yellow-200 bg-yellow-50' : ''}`}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold">{tour.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{tour.description}</p>
          </div>
          {getStatusBadge(booking.status)}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{format(parseISO(booking.tour_date), 'MMM d, yyyy')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{booking.tour_time}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>{booking.number_of_tourists} {booking.number_of_tourists === 1 ? 'person' : 'people'}</span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span>{booking.total_price === 0 ? 'Free' : `$${booking.total_price}`}</span>
          </div>
        </div>

        {booking.special_requests && (
          <div className="mb-4 p-3 bg-muted rounded-lg">
            <p className="text-sm"><strong>Special Requests:</strong> {booking.special_requests}</p>
          </div>
        )}

        {showActions && (
          <div className="flex gap-2">
            <Button
              onClick={() => navigate(createPageUrl(`TourDetails?id=${tour.id}`))}
              variant="outline"
              size="sm"
            >
              View Tour
            </Button>
            {booking.status === 'confirmed' && (
              <Button
                onClick={() => navigate(createPageUrl(`Play?id=${tour.id}`))}
                size="sm"
              >
                <Play className="mr-2 h-4 w-4" />
                Start Tour
              </Button>
            )}
            {canCancel && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    Cancel Booking
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to cancel this booking? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep Booking</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onCancel(booking.id)}
                      disabled={cancellingBooking === booking.id}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      {cancellingBooking === booking.id && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Cancel Booking
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Empty State Component
function EmptyState({ title, description, actionLabel, onAction }) {
  return (
    <div className="text-center py-12">
      <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
        <Calendar size={40} className="text-muted-foreground" />
      </div>
      <h3 className="text-xl font-medium text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-md mx-auto mb-6">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
  );
}