
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Tour } from "@/api/entities";
import { TourStop } from "@/api/entities";
import { User } from "@/api/entities";
import { AudioTrack } from "@/api/entities"; // New import for AudioTrack
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  Map as MapIcon, // Changed Map to MapIcon to avoid conflict
  Clock,
  ArrowLeft,
  Edit,
  Footprints,
  Car,
  Bike,
  Train,
  MapPin,
  Volume2,
  Trash2,
  AlertTriangle,
  DownloadCloud,
  PlayCircle,
  Users, // New import
  Languages, // New import
  MountainSnow, // New import
  CheckCircle, // New import
  Share2, // New import
  Star, // New import
  Copy // New import
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { downloadTourAsPlaylist } from "@/api/functions";

// New Imports for enhanced display
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import StopMiniMap from "@/components/details/StopMiniMap";
import { useLanguage } from '@/components/i18n/LanguageContext';

export default function TourDetails() {
  const navigate = useNavigate();
  const [tour, setTour] = useState(null);
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteInProgress, setDeleteInProgress] = useState(false);
  const [downloadingPlaylist, setDownloadingPlaylist] = useState(false);
  const [stopsLoading, setStopsLoading] = useState(false); // New state for stops loading
  const [isCloning, setIsCloning] = useState(false); // Add cloning state

  const { t } = useLanguage();

  const urlParams = new URLSearchParams(window.location.search);
  const tourId = urlParams.get("id");

  // Memoize stops to prevent unnecessary re-renders of the list
  const memoizedStops = useMemo(() => stops, [stops]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true); // Initial loading for the tour itself
        setStopsLoading(true); // Indicate that stops are loading
        setStops([]); // Clear previous stops data

        if (!tourId) {
          setError('No tour ID provided');
          setLoading(false);
          setStopsLoading(false);
          return;
        }

        // Load tour data first (fast)
        try {
          const tourData = await Tour.get(tourId);
          if (!tourData) {
            setError('Tour not found');
            setLoading(false);
            setStopsLoading(false);
            return;
          }
          setTour(tourData);
          setLoading(false); // Allow UI to render tour details while stops load asynchronously
        } catch (err) {
          console.error("Error loading tour:", err);
          setError('Tour not found or has been deleted');
          setLoading(false);
          setStopsLoading(false);
          return;
        }

        // Load user data in parallel (optional, don't block UI)
        try {
          const userData = await User.me();
          setCurrentUser(userData);
        } catch (err) {
          console.error("Error loading user:", err);
          // Continue even if user can't be loaded
        }

        // Load all stops for the tour, with an increased limit
        try {
          const stopsData = await TourStop.filter({ tour_id: tourId }, "position", 500); // Increased limit to 500
          setStops(stopsData || []);
        } catch (err) {
          console.error("Error loading stops:", err);
          setStops([]); // Set empty array on error
        } finally {
          setStopsLoading(false); // Stops loading complete
        }

      } catch (err) {
        setError('Failed to load tour details');
        console.error("Error:", err);
        // setLoading(false) and setStopsLoading(false) are handled within the specific try-catch blocks
      }
    };

    loadData();
  }, [tourId]); // Depend on tourId

  const getTransportIcon = (type) => {
    switch (type) {
      case "driving":
        return <Car size={18} />;
      case "cycling":
        return <Bike size={18} />;
      case "public_transport":
        return <Train size={18} />;
      case "mixed":
        return <MapIcon size={18} />; // Changed from Map to MapIcon
      case "walking":
      default:
        return <Footprints size={18} />;
    }
  };

  const isOwnerOrAdmin = useMemo(() => {
    if (!currentUser || !tour) return false;
    // Assuming `user_group` is an array of strings like ['Admin', 'Editor']
    const isAdmin = currentUser.user_group && currentUser.user_group.includes('Admin');
    return currentUser.email === tour.created_by || isAdmin;
  }, [currentUser, tour]);

  const handleCloneTour = async () => {
    if (!tour || !window.confirm("Are you sure you want to clone this tour? A new private copy will be created under your account.")) {
      return;
    }
    setIsCloning(true);
    try {
      // 1. Fetch all related data
      const originalTourStops = await TourStop.filter({ tour_id: tour.id }, "position");
      const originalAudioTracks = await AudioTrack.filter({ tour_id: tour.id });

      // 2. Create the new tour, removing identifying fields and setting new owner
      const newTourData = { ...tour };
      delete newTourData.id;
      delete newTourData.created_date;
      delete newTourData.updated_date;

      newTourData.title = `[CLONE] ${tour.title}`;
      newTourData.is_public = false; // Clones are private by default
      // Optionally, set the current user as the new creator if needed by your backend (assuming backend handles this based on auth)
      // newTourData.created_by = currentUser.email; 

      const newTour = await Tour.create(newTourData);

      // 3. Create stops and map old IDs to new IDs
      const stopIdMap = new Map();
      for (const stop of originalTourStops) {
        const oldStopId = stop.id;
        const newStopData = { ...stop, tour_id: newTour.id };
        delete newStopData.id;
        delete newStopData.created_date;
        delete newStopData.updated_date;

        const newStop = await TourStop.create(newStopData);
        stopIdMap.set(oldStopId, newStop.id);
      }

      // 4. Create audio tracks using the new IDs
      for (const track of originalAudioTracks) {
        const newStopId = stopIdMap.get(track.stop_id);
        if (newStopId) {
          const newTrackData = { ...track, tour_id: newTour.id, stop_id: newStopId };
          delete newTrackData.id;
          delete newTrackData.created_date;
          delete newTrackData.updated_date;
          await AudioTrack.create(newTrackData);
        }
      }

      alert("Tour cloned successfully! You will now be redirected to edit the new tour.");
      navigate(createPageUrl(`Create?edit=true&id=${newTour.id}`));

    } catch (error) {
      console.error("Failed to clone tour:", error);
      alert(`An error occurred while cloning the tour: ${error.message || 'Unknown error'}`);
    } finally {
      setIsCloning(false);
    }
  };

  const handleDeleteTour = async () => {
    try {
      setDeleteInProgress(true);

      const tourStops = await TourStop.filter({ tour_id: tourId });
      for (const stop of tourStops) {
        await TourStop.delete(stop.id);
      }

      await Tour.delete(tourId);

      setShowDeleteDialog(false);
      navigate(createPageUrl("Profile"));
    } catch (error) {
      console.error("Error deleting tour:", error);
      alert('Failed to delete tour. Please try again.');
    } finally {
      setDeleteInProgress(false);
    }
  };

  const handleDownloadPlaylist = async () => {
    if (!tour || !tour.id) return;
    setDownloadingPlaylist(true);
    try {
      const response = await downloadTourAsPlaylist({ tourId: tour.id });

      const blob = new Blob([response.data], { type: 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${tour.title}_playlist.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();

    } catch (error) {
      console.error("Error downloading tour playlist:", error);
      alert('Failed to download playlist. Please try again.');
    } finally {
      setDownloadingPlaylist(false);
    }
  };

  if (loading) {
    // This loading state is for the tour main data (header, description), not the stops yet
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-4">
          <div className="h-72 bg-gray-200 rounded-lg animate-pulse"></div>
          <div className="h-8 w-3/4 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-12 w-1/4 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (error || !tour) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
        <h2 className="mt-4 text-xl font-semibold">Error</h2>
        <p className="text-gray-600">{error || 'Tour not found'}</p>
        <Button onClick={() => navigate(createPageUrl("Explore"))} className="mt-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Explore
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-0 sm:px-4 py-4 pb-24">
      <Card className="overflow-hidden shadow-none sm:shadow-lg sm:rounded-xl">
        {tour.preview_image ? (
          <div className="h-60 sm:h-80 md:h-96 w-full relative">
            <img
              src={tour.preview_image}
              alt={tour.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-4 sm:p-8 text-white">
              <h1 className="text-3xl sm:text-4xl font-bold mb-2">{tour.title}</h1>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-indigo-500 hover:bg-indigo-600">
                  {tour.theme}
                </Badge>
                <Badge className="bg-indigo-500 hover:bg-indigo-600 flex items-center gap-1">
                  {getTransportIcon(tour.transportation)}
                  <span className="capitalize">{tour.transportation}</span>
                </Badge>
                <Badge className="bg-indigo-500 hover:bg-indigo-600">
                  {tour.difficulty}
                </Badge>
                <div className="flex items-center gap-1 text-sm bg-indigo-500 text-white px-2.5 py-0.5 rounded-full">
                  <Clock size={16} />
                  <span>{tour.duration} minutes</span>
                </div>
                {tour.location?.city && tour.location?.country && (
                  <div className="flex items-center gap-1 text-sm bg-indigo-500 text-white px-2.5 py-0.5 rounded-full">
                    <MapPin size={16} />
                    <span>{tour.location.city}, {tour.location.country}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <CardHeader className="p-4 sm:p-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">{tour.title}</h1>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">
                {tour.theme}
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-1">
                {getTransportIcon(tour.transportation)}
                <span className="capitalize">{tour.transportation}</span>
              </Badge>
              <Badge variant="secondary">
                {tour.difficulty}
              </Badge>
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Clock size={16} />
                <span>{tour.duration} minutes</span>
              </div>
              {tour.location?.city && tour.location?.country && (
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <MapPin size={16} />
                  <span>{tour.location.city}, {tour.location.country}</span>
                </div>
              )}
            </div>
          </CardHeader>
        )}

        <CardContent className="p-4 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <h2 className="text-2xl font-semibold mb-3 text-gray-800">About this Tour</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap mb-6">
                {tour.description || 'No description provided'}
              </p>

              {tour.location && (tour.location.city || tour.location.country || tour.location.start_point?.address) && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
                  <h3 className="font-semibold text-gray-700 mb-2">Location Information</h3>
                  <p className="text-sm text-gray-600">
                    City: {tour.location.city || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600">
                    Country: {tour.location.country || 'N/A'}
                  </p>
                  {tour.location.start_point?.address && (
                    <p className="text-sm text-gray-600 mt-1">
                      Starting Address: {tour.location.start_point.address}
                    </p>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold text-gray-800">Tour Stops</h2>
                {stopsLoading && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <div className="h-4 w-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                    Loading stops...
                  </div>
                )}
              </div>

              {memoizedStops && memoizedStops.length > 0 ? (
                <div className="space-y-8">
                  {memoizedStops.map((stop, index) => (
                    <OptimizedStopCard
                      key={stop.id || `stop-${index}`}
                      stop={stop}
                      index={index}
                    />
                  ))}
                </div>
              ) : stopsLoading ? ( // Show skeleton while stops are loading and list is empty
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="border rounded-lg p-4">
                      <div className="h-6 w-1/3 bg-gray-200 rounded animate-pulse mb-2"></div>
                      <div className="h-4 w-full bg-gray-200 rounded animate-pulse mb-2"></div>
                      <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              ) : ( // No stops found
                <p className="text-gray-500">No stops available for this tour</p>
              )}
            </div>

            <div className="md:col-span-1 space-y-6">
              <Card className="shadow-sm border">
                <CardHeader>
                  <CardTitle className="text-lg">Tour Highlights</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-600 space-y-2">
                  <p><strong>Languages:</strong> {tour.languages?.join(", ") || 'N/A'}</p>
                  <p><strong>Duration:</strong> {tour.duration || 'N/A'} minutes</p>
                  <p className="flex items-center gap-1">
                    <strong>Transportation:</strong>
                    {getTransportIcon(tour.transportation)}
                    <span className="capitalize">{tour.transportation || 'N/A'}</span>
                  </p>
                  {tour.accessibility && tour.accessibility.length > 0 && (
                    <p>
                      <strong>Accessibility:</strong>
                      {tour.accessibility.join(', ')}
                    </p>
                  )}
                  <p><strong>Created by:</strong> {tour.created_by ? tour.created_by.split('@')[0] : 'Unknown'}</p>
                  <p><strong>Created on:</strong> {new Date(tour.created_date).toLocaleDateString()}</p>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <Button
                asChild
                size="lg"
                className="w-full bg-indigo-600 hover:bg-indigo-700 gap-2"
              >
                <Link to={createPageUrl(`Play?id=${tour.id}`)}>
                  <PlayCircle className="h-5 w-5" />
                  Play Tour
                </Link>
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="w-full gap-2"
                onClick={handleDownloadPlaylist}
                disabled={downloadingPlaylist}
              >
                {downloadingPlaylist ? (
                  <>
                    <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin mr-2"></div>
                    Downloading...
                  </>
                ) : (
                  <>
                    <DownloadCloud className="h-5 w-5" />
                    Download Playlist
                  </>
                )}
              </Button>

              {isOwnerOrAdmin && (
                <>
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full gap-2"
                    onClick={() => navigate(createPageUrl(`Create?edit=true&id=${tour.id}`))}
                  >
                    <Edit className="h-5 w-5" />
                    Edit Tour
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full gap-2"
                    onClick={handleCloneTour}
                    disabled={isCloning}
                  >
                    <Copy className="h-5 w-5" />
                    {isCloning ? t('details.cloning') : t('details.cloneTour')}
                  </Button>
                  <Button
                    variant="destructive"
                    size="lg"
                    className="w-full gap-2"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="h-5 w-5" />
                    Delete Tour
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Delete Tour
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this tour? This action cannot be undone and will remove all stops and associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteInProgress}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTour}
              className="bg-red-500 hover:bg-red-600 focus:ring-red-500"
              disabled={deleteInProgress}
            >
              {deleteInProgress ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-2"></div>
                  Deleting...
                </>
              ) : (
                'Delete Tour'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Optimized Stop Card component with React.memo
const OptimizedStopCard = React.memo(({ stop, index }) => {
  const [imageLoaded, setImageLoaded] = useState(false); // Declared but not used for visible effect

  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    let videoId;
    if (url.includes("youtube.com/watch?v=")) {
      videoId = url.split("watch?v=")[1].split("&")[0];
    } else if (url.includes("youtu.be/")) {
      videoId = url.split("youtu.be/")[1].split("?")[0];
    } else {
      return url; // If not a recognized YouTube URL, return as is
    }
    return `https://www.youtube.com/embed/${videoId}`;
  };

  return (
    <Card className="overflow-hidden border shadow-sm">
      <CardHeader className="bg-slate-50/50 p-4">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-medium">
            {index + 1}
          </div>
          <CardTitle className="text-xl">{stop.title || `Stop ${index + 1}`}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
          {stop.description || 'No description provided for this stop'}
        </p>

        {stop.location?.latitude && stop.location?.longitude && (
          <div className="mt-4">
            <h4 className="font-medium text-sm text-gray-700 mb-2">Stop Location</h4>
            <StopMiniMap
              location={{ latitude: stop.location.latitude, longitude: stop.location.longitude }}
              stopTitle={stop.title}
            />
          </div>
        )}

        {stop.gallery_images && stop.gallery_images.length > 0 && (
          <div className="mt-4">
            <h4 className="font-medium text-sm text-gray-700 mb-2">Gallery</h4>
            <div className="relative">
              <ScrollArea className="w-full whitespace-nowrap rounded-md border">
                <div className="flex space-x-3 p-3">
                  {/* Limit images displayed to first 5 and add a "+X more" indicator */}
                  {stop.gallery_images.slice(0, 5).map((imgUrl, imgIdx) => (
                    <div key={imgIdx} className="flex-shrink-0 w-40 h-32 sm:w-48 sm:h-36 md:w-56 md:h-40 rounded-lg overflow-hidden">
                      <img
                        src={imgUrl}
                        alt={`${stop.title} Gallery Image ${imgIdx + 1}`}
                        className="w-full h-full object-cover"
                        loading="lazy" // Add lazy loading
                        onLoad={() => setImageLoaded(true)}
                      />
                    </div>
                  ))}
                  {stop.gallery_images.length > 5 && (
                    <div className="flex-shrink-0 w-40 h-32 sm:w-48 sm:h-36 md:w-56 md:h-40 rounded-lg bg-gray-100 flex items-center justify-center">
                      <span className="text-gray-500 text-sm">+{stop.gallery_images.length - 5} more</span>
                    </div>
                  )}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>
          </div>
        )}

        {stop.video_url && (
          <div className="mt-4">
            <h4 className="font-medium text-sm text-gray-700 mb-2">Video</h4>
            <AspectRatio ratio={16 / 9} className="bg-slate-100 rounded-lg overflow-hidden">
              <iframe
                src={getYouTubeEmbedUrl(stop.video_url)}
                title={`${stop.title} Video`}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
                loading="lazy" // Add lazy loading
              ></iframe>
            </AspectRatio>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mt-2">
          {stop.estimated_time && (
            <div className="flex items-center gap-1">
              <Clock size={14} />
              <span>Estimated Time: {stop.estimated_time} minutes</span>
            </div>
          )}
          {stop.audio_tracks && stop.audio_tracks.length > 0 && (
            <div className="flex items-center gap-1">
              <Volume2 size={14} />
              <span>{stop.audio_tracks.length} audio track{stop.audio_tracks.length !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});
