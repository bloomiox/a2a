import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Tour } from '@/api/entities';
import { TourStop } from '@/api/entities';
import { TourAssignment } from '@/api/entities';
import { AudioTrack } from '@/api/entities';
import { DriverLocation } from '@/api/entities';
import { User } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertTriangle, MapPin, Flag, Play, Pause, Check, Speaker, ArrowLeft, ArrowRight, Home, SkipBack, SkipForward } from 'lucide-react';
import DriverTrackingMap from '@/components/admin/DriverTrackingMap';
import { useLanguage } from '@/components/i18n/LanguageContext';
import LiveAudioReceiver from '../components/driver/LiveAudioReceiver';
import { createPageUrl } from '@/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const DriverAudioController = ({ audioTrack, transcript }) => {
    const { t } = useLanguage();
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = React.useRef(null);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
        }
        if (audioTrack?.audio_url) {
            audioRef.current = new Audio(audioTrack.audio_url);
            audioRef.current.onended = () => setIsPlaying(false);
        }
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
            }
        };
    }, [audioTrack]);

    const togglePlayback = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    if (!audioTrack) {
        return <div className="text-sm text-muted-foreground py-4 text-center">{t('driver.navigation.noAudio')}</div>;
    }

    return (
        <div className="space-y-3 rounded-lg bg-muted/50 p-4">
            <div className="flex items-center gap-4">
                <Button onClick={togglePlayback} size="icon" className="h-12 w-12 rounded-full flex-shrink-0">
                    {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                </Button>
                <div>
                    <p className="font-semibold">{t('driver.navigation.audioFor')} "{audioTrack.title}"</p>
                    <p className="text-xs text-muted-foreground">{t('common.language')}: {audioTrack.language}</p>
                </div>
            </div>
            {transcript && (
                <ScrollArea className="h-24 p-2 border rounded-md bg-background text-sm">
                    {transcript}
                </ScrollArea>
            )}
        </div>
    );
};


export default function DriverNavigation() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const tourId = searchParams.get('tourId');
    const { t } = useLanguage();

    const [tour, setTour] = useState(null);
    const [stops, setStops] = useState([]);
    const [audioTracks, setAudioTracks] = useState([]);
    const [assignment, setAssignment] = useState(null);
    const [driver, setDriver] = useState(null);
    const [driverLocation, setDriverLocation] = useState(null);
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEndingTour, setIsEndingTour] = useState(false);
    const [viewedStopIndex, setViewedStopIndex] = useState(null);

    useEffect(() => {
        if (!tourId) {
            setError(t('driver.navigation.noTourId'));
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            try {
                setLoading(true);
                const currentUser = await User.me();
                setDriver(currentUser);

                console.log('Fetching data for tourId:', tourId, 'and driver:', currentUser.id);

                // First, let's see all assignments for this tour and driver
                const allAssignments = await TourAssignment.filter({ tour_id: tourId, driver_id: currentUser.id });
                console.log('All assignments for this tour and driver:', allAssignments);

                const [tourData, stopsData, assignmentData, audioTracksData] = await Promise.all([
                    Tour.get(tourId),
                    TourStop.filter({ tour_id: tourId }, 'position'),
                    TourAssignment.filter({ tour_id: tourId, driver_id: currentUser.id, status: { $in: ['assigned', 'in_progress'] } }, '-created_at', 1),
                    AudioTrack.filter({ tour_id: tourId })
                ]);

                console.log('Fetched data:', {
                    tourData,
                    stopsData: stopsData?.length || 0,
                    assignmentData: assignmentData?.length || 0,
                    audioTracksData: audioTracksData?.length || 0
                });

                if (!tourData) throw new Error(t('driver.navigation.tourNotFound'));
                if (!assignmentData || assignmentData.length === 0) {
                    console.error('No assignment found with status assigned or in_progress for tour:', tourId, 'and driver:', currentUser.id);
                    throw new Error(t('driver.navigation.assignmentNotFound'));
                }

                setTour(tourData);
                setStops(stopsData || []);
                
                // If the assignment is still in 'assigned' status, automatically start it
                let currentAssignment = assignmentData[0];
                if (currentAssignment.status === 'assigned') {
                    try {
                        console.log('Auto-starting assigned tour...');
                        const updatedAssignment = await TourAssignment.update(currentAssignment.id, {
                            status: 'in_progress',
                            start_time: new Date().toISOString()
                        });
                        currentAssignment = updatedAssignment;
                        console.log('Tour auto-started successfully');
                    } catch (updateError) {
                        console.error('Error auto-starting tour:', updateError);
                        // Continue with the assigned status if update fails
                    }
                }
                
                setAssignment(currentAssignment);
                setAudioTracks(audioTracksData || []);

            } catch (err) {
                console.error("Error fetching tour data:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [tourId, t]);

    useEffect(() => {
        const locationInterval = setInterval(() => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(async (position) => {
                    const { latitude, longitude, speed, accuracy } = position.coords;
                    const newLocation = { 
                        latitude, 
                        longitude, 
                        speed: speed ? (speed * 3.6).toFixed(2) : 0, // m/s to km/h
                        accuracy,
                        timestamp: new Date().toISOString()
                    };
                    setDriverLocation(newLocation);

                    // Send location to backend
                    if (driver) {
                        try {
                           await DriverLocation.create({
                                driver_id: driver.id,
                                ...newLocation,
                           });
                        } catch(e) {
                           console.error("Failed to update driver location", e);
                        }
                    }
                }, 
                (err) => console.warn(`ERROR(${err.code}): ${err.message}`),
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 });
            }
        }, 5000); // Update every 5 seconds

        return () => clearInterval(locationInterval);
    }, [driver]);

    const firstUncompletedIndex = useMemo(() => {
        if (!assignment || !stops.length) return -1;
        return stops.findIndex(stop => !(assignment.completed_stops || []).includes(stop.id));
    }, [assignment, stops]);

    useEffect(() => {
        if (stops.length > 0 && assignment) {
             const initialIndex = firstUncompletedIndex === -1 ? stops.length - 1 : firstUncompletedIndex;
             setViewedStopIndex(initialIndex);
        }
    }, [stops, assignment, firstUncompletedIndex]);

    const viewedStop = useMemo(() => {
        if (viewedStopIndex === null || !stops.length) return null;
        return stops[viewedStopIndex];
    }, [stops, viewedStopIndex]);

    const currentAudioTrack = useMemo(() => {
        if (!viewedStop || !audioTracks.length) return null;
        const track = audioTracks.find(t => t.stop_id === viewedStop.id);
        if (track) {
            return { ...track, title: viewedStop.title };
        }
        return null;
    }, [viewedStop, audioTracks]);

    const handleNextStop = async () => {
        const stopToComplete = stops[viewedStopIndex];

        if (stopToComplete && !(assignment.completed_stops || []).includes(stopToComplete.id)) {
            try {
                const updatedCompletedStops = [...(assignment.completed_stops || []), stopToComplete.id];
                const updatedAssignment = await TourAssignment.update(assignment.id, {
                    completed_stops: updatedCompletedStops
                });
                setAssignment(updatedAssignment); // This will trigger the tourCompleted view if it was the last stop
            } catch (err) {
                console.error("Error completing stop:", err);
                setError(t('driver.navigation.errorCompletingStop'));
            }
        }

        if (viewedStopIndex < stops.length - 1) {
            setViewedStopIndex(prev => prev + 1);
        }
    };
    
    const handlePreviousStop = () => {
        if (viewedStopIndex > 0) {
            setViewedStopIndex(prev => prev - 1);
        }
    };
    
    const handleEndTour = async () => {
        if (!assignment) return;
        setIsEndingTour(true);
        try {
            await TourAssignment.update(assignment.id, {
                status: 'completed',
                end_time: new Date().toISOString()
            });
            navigate(createPageUrl('Driver'));
        } catch (err) {
            console.error("Error ending tour:", err);
            setError(t('driver.navigation.errorEndingTour'));
        } finally {
            setIsEndingTour(false);
        }
    };


    if (loading || viewedStopIndex === null) {
        return (
            <div className="w-full h-screen flex flex-col items-center justify-center gap-4 bg-background">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-muted-foreground">{t('common.loadingTourData')}</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full h-screen flex flex-col items-center justify-center gap-4 p-4 text-center">
                <AlertTriangle className="h-10 w-10 text-destructive" />
                <h2 className="text-xl font-bold">{t('common.errorOccurred')}</h2>
                <p className="text-destructive">{error}</p>
                <Button onClick={() => navigate(createPageUrl('Driver'))}>
                    <ArrowLeft className="mr-2 h-4 w-4" />{t('driver.backToDashboard')}
                </Button>
            </div>
        );
    }
    
    const tourCompleted = firstUncompletedIndex === -1;

    return (
        <div className="w-full h-screen grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
            {/* Map Column */}
            <div className="h-full w-full">
                <DriverTrackingMap tour={tour} driverLocation={driverLocation} stops={stops} />
            </div>

            {/* Controls Column */}
            <ScrollArea className="h-full bg-background">
                <div className="p-4 md:p-6 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>{tour.title}</CardTitle>
                            <CardDescription>{tour.location?.city}, {tour.location?.country}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>{t('driver.navigation.tourProgress')}</span>
                                    <span>{assignment.completed_stops?.length || 0} / {stops.length} {t('common.stops')}</span>
                                </div>
                                <Progress value={((assignment.completed_stops?.length || 0) / stops.length) * 100} />
                            </div>
                        </CardContent>
                    </Card>

                    {tourCompleted ? (
                        <Card className="bg-green-50 border-green-200 text-center p-8">
                             <CardHeader>
                                <Flag className="mx-auto h-12 w-12 text-green-600 mb-4" />
                                <CardTitle className="text-2xl text-green-800">{t('driver.navigation.tourComplete')}</CardTitle>
                                <CardDescription className="text-green-700">{t('driver.navigation.allStopsCompleted')}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button size="lg" className="bg-primary hover:bg-primary/90">
                                            <Home className="mr-2 h-5 w-5"/>{t('driver.navigation.endTour')}
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>{t('driver.navigation.confirmEndTourTitle')}</DialogTitle>
                                            <DialogDescription>{t('driver.navigation.confirmEndTourDesc')}</DialogDescription>
                                        </DialogHeader>
                                        <DialogFooter>
                                            <Button variant="ghost" onClick={(e) => e.currentTarget.closest('[role="dialog"]')?.querySelector('[aria-label="Close"]')?.click()}>{t('common.cancel')}</Button>
                                            <Button onClick={handleEndTour} disabled={isEndingTour}>
                                                {isEndingTour && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                                {t('driver.navigation.endTour')}
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </CardContent>
                        </Card>
                    ) : (
                        <>
                            {/* Navigation Controls - Moved to top for easier access */}
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between gap-4">
                                        <Button onClick={handlePreviousStop} size="lg" variant="outline" className="flex-1" disabled={viewedStopIndex === 0}>
                                            <SkipBack className="mr-2 h-5 w-5" /> {t('driver.navigation.previousStop')}
                                        </Button>
                                        {viewedStopIndex === stops.length - 1 ? (
                                            <Button onClick={handleNextStop} size="lg" className="flex-1 bg-green-600 hover:bg-green-700">
                                                {t('driver.navigation.finishTour')} <Flag className="ml-2 h-5 w-5" />
                                            </Button>
                                        ) : (
                                            <Button onClick={handleNextStop} size="lg" className="flex-1">
                                                {t('driver.navigation.nextStop')} <SkipForward className="ml-2 h-5 w-5" />
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Current Stop Information */}
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-5 w-5 text-primary" />
                                        <CardTitle>{t('driver.navigation.currentStop')}: {viewedStop?.title}</CardTitle>
                                    </div>
                                    <CardDescription>{viewedStop?.description}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <DriverAudioController audioTrack={currentAudioTrack} transcript={currentAudioTrack?.transcript} />
                                </CardContent>
                            </Card>

                            {/* Live Broadcast Audio - Moved below Current Stop */}
                            {driver && <LiveAudioReceiver driverId={driver.id} tourId={tourId} isVisible={true} />}
                        </>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}