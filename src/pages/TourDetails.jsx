import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Tour, TourStop, AudioTrack, User } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Clock, 
  MapPin, 
  Users, 
  Star, 
  Calendar,
  DollarSign,
  Play,
  ArrowLeft,
  Navigation,
  Headphones,
  Globe
} from 'lucide-react';
import { useLanguage } from '@/components/i18n/LanguageContext';
import BookingDialog from '@/components/booking/BookingDialog';
import DownloadManager from '@/components/offline/DownloadManager';
import OfflineIndicator from '@/components/offline/OfflineIndicator';

export default function TourDetails() {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tourId = searchParams.get('id');

  const [tour, setTour] = useState(null);
  const [stops, setStops] = useState([]);
  const [audioTracks, setAudioTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [showBookingDialog, setShowBookingDialog] = useState(false);

  useEffect(() => {
    if (!tourId) {
      setError('No tour ID provided');
      setLoading(false);
      return;
    }

    const fetchTourData = async () => {
      try {
        setLoading(true);
        
        // Get current user
        try {
          const currentUser = await User.me();
          setUser(currentUser);
        } catch (userError) {
          // User not logged in - that's okay for viewing tour details
          console.log('User not logged in');
        }

        // Fetch tour data
        const [tourData, stopsData, audioTracksData] = await Promise.all([
          Tour.get(tourId),
          TourStop.filter({ tour_id: tourId }, 'position'),
          AudioTrack.filter({ tour_id: tourId })
        ]);

        if (!tourData) {
          throw new Error('Tour not found');
        }

        setTour(tourData);
        setStops(stopsData || []);
        setAudioTracks(audioTracksData || []);
      } catch (err) {
        console.error('Error fetching tour data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTourData();
  }, [tourId]);

  const handleBookTour = () => {
    setShowBookingDialog(true);
  };

  const handleStartTour = () => {
    navigate(createPageUrl(`Play?id=${tourId}`));
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-8 w-32 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64 w-full rounded-2xl" />
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-20 w-full" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-48 w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !tour) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Tour Not Found</h1>
          <p className="text-muted-foreground mb-6">{error || 'The requested tour could not be found.'}</p>
          <Button onClick={() => navigate(createPageUrl('Explore'))}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tours
          </Button>
        </div>
      </div>
    );
  }

  const difficultyColors = {
    easy: "bg-green-100 text-green-800",
    moderate: "bg-yellow-100 text-yellow-800",
    challenging: "bg-red-100 text-red-800",
  };

  const price = tour.financials?.price_per_tourist || 0;
  const isFree = price === 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate(createPageUrl('Explore'))}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('common.back')}
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero Image */}
            <div className="relative">
              <img
                src={tour.preview_image || "https://images.unsplash.com/photo-1526772662000-3f88f10405ff?q=80&w=1974&auto=format&fit=crop"}
                alt={tour.title}
                className="w-full h-64 md:h-80 object-cover rounded-2xl"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-2xl" />
              <div className="absolute bottom-6 left-6">
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{tour.title}</h1>
                {tour.location?.city && (
                  <div className="flex items-center text-white/90">
                    <MapPin className="mr-2 h-5 w-5" />
                    <span className="text-lg">{tour.location.city}, {tour.location.country}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Tour Info */}
            <div className="flex flex-wrap gap-4 items-center">
              {tour.theme && (
                <Badge variant="secondary" className="capitalize">
                  {t(`themes.${tour.theme}`)}
                </Badge>
              )}
              {tour.difficulty && (
                <Badge className={`${difficultyColors[tour.difficulty]} capitalize`}>
                  {t(`difficulty.${tour.difficulty}`)}
                </Badge>
              )}
              {tour.duration && (
                <div className="flex items-center text-muted-foreground">
                  <Clock className="mr-1 h-4 w-4" />
                  <span>{Math.floor(tour.duration / 60)}h {tour.duration % 60}m</span>
                </div>
              )}
              <div className="flex items-center text-muted-foreground">
                <Navigation className="mr-1 h-4 w-4" />
                <span>{stops.length} {t('common.stops')}</span>
              </div>
            </div>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>About This Tour</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {tour.description || 'No description available for this tour.'}
                </p>
              </CardContent>
            </Card>

            {/* Tour Stops */}
            {stops.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Tour Stops ({stops.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stops.slice(0, 5).map((stop, index) => (
                      <div key={stop.id} className="flex items-start gap-4 p-4 rounded-lg border">
                        <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                          {index + 1}
                        </div>
                        <div className="flex-grow">
                          <h4 className="font-semibold">{stop.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{stop.description}</p>
                          {stop.estimated_time && (
                            <div className="flex items-center mt-2 text-xs text-muted-foreground">
                              <Clock className="mr-1 h-3 w-3" />
                              <span>{stop.estimated_time} min</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {stops.length > 5 && (
                      <p className="text-sm text-muted-foreground text-center py-2">
                        And {stops.length - 5} more stops...
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Languages Available */}
            {tour.languages && tour.languages.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Globe className="mr-2 h-5 w-5" />
                    Available Languages
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {tour.languages.map(language => (
                      <Badge key={language} variant="outline">
                        {language}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Booking Sidebar */}
          <div className="space-y-6">
            <Card className="sticky top-8">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    {isFree ? (
                      <div className="text-2xl font-bold text-green-600">Free</div>
                    ) : (
                      <div className="flex items-center">
                        <DollarSign className="h-6 w-6 text-muted-foreground" />
                        <span className="text-3xl font-bold">{price}</span>
                        <span className="text-muted-foreground ml-1">per person</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Star className="mr-1 h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span>4.8 (24 reviews)</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Quick Info */}
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Duration</span>
                    <span className="font-medium">
                      {tour.duration ? `${Math.floor(tour.duration / 60)}h ${tour.duration % 60}m` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Group Size</span>
                    <span className="font-medium">
                      {tour.financials?.min_tourists || 1}-{tour.financials?.max_tourists || 20} people
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Transportation</span>
                    <span className="font-medium capitalize">
                      {tour.transportation ? t(`transport.${tour.transportation}`) : 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-3">
                  {user ? (
                    <>
                      <Button 
                        onClick={handleStartTour}
                        variant="outline"
                        className="w-full mb-3"
                        size="lg"
                      >
                        <Play className="mr-2 h-5 w-5" />
                        {t('booking.startTourNow')}
                      </Button>
                      
                      <Button 
                        onClick={handleBookTour}
                        className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                        size="lg"
                      >
                        <Calendar className="mr-2 h-5 w-5" />
                        {t('booking.bookTour')}
                      </Button>
                    </>
                  ) : (
                    <Button 
                      onClick={handleBookTour}
                      className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                      size="lg"
                    >
                      <Calendar className="mr-2 h-5 w-5" />
                      {t('booking.bookTour')}
                    </Button>
                  )}
                </div>

                {user && (
                  <Button 
                    onClick={() => navigate(createPageUrl('TouristDashboard'))}
                    variant="ghost"
                    className="w-full mt-2"
                    size="sm"
                  >
                    {t('booking.viewMyBookings')}
                  </Button>
                )}
                
                <div className="text-xs text-muted-foreground text-center pt-2">
                  <p>Free cancellation up to 24 hours before the tour</p>
                </div>
              </CardContent>
            </Card>

            {/* Offline Download */}
            {user && (
              <DownloadManager 
                tourId={tourId}
                tourTitle={tour.title}
                onDownloadComplete={() => {
                  // Refresh tour data or show success message
                }}
              />
            )}

            {/* Offline Status Indicator */}
            <OfflineIndicator />

            {/* Additional Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What's Included</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <Headphones className="mr-2 h-4 w-4 text-green-600" />
                    <span>Professional audio guide</span>
                  </div>
                  <div className="flex items-center">
                    <Navigation className="mr-2 h-4 w-4 text-green-600" />
                    <span>GPS navigation</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="mr-2 h-4 w-4 text-green-600" />
                    <span>Detailed route map</span>
                  </div>
                  <div className="flex items-center">
                    <Globe className="mr-2 h-4 w-4 text-green-600" />
                    <span>Multiple language options</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Booking Dialog */}
      {showBookingDialog && (
        <BookingDialog
          tour={tour}
          user={user}
          isOpen={showBookingDialog}
          onClose={() => setShowBookingDialog(false)}
        />
      )}
    </div>
  );
}