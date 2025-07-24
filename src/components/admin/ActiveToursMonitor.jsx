import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Activity, Battery, Navigation2, AlertTriangle, RefreshCw, Car, Users } from "lucide-react";
import { format } from "date-fns";
import { Tour } from "@/api/entities";
import { TourAssignment } from "@/api/entities";
import { TourStop } from "@/api/entities";
import { DriverLocation } from "@/api/entities";
import { User } from "@/api/entities";
import DriverTrackingMap from './DriverTrackingMap';
import { useLanguage } from '@/components/i18n/LanguageContext';

export default function ActiveToursMonitor() {
  const { t } = useLanguage();
  const [activeTours, setActiveTours] = useState([]);
  const [selectedTour, setSelectedTour] = useState(null);
  const [driversLocations, setDriversLocations] = useState({});
  const [drivers, setDrivers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    loadActiveTours();
    
    // Set up real-time updates every 10 seconds
    const interval = setInterval(() => {
      loadActiveTours();
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const loadActiveTours = async () => {
    // Keep the loading spinner only on the first load
    if (activeTours.length === 0) {
      setLoading(true);
    }
    setError(null);
    
    try {
      console.log('[ACTIVE_TOURS] Refreshing active tours...');
      
      const assignments = await TourAssignment.filter({ status: 'in_progress' }) || [];
      
      if (assignments.length === 0) {
        setActiveTours([]);
        setSelectedTour(null);
        setLoading(false);
        return;
      }
      
      const tourIds = [...new Set(assignments.map(a => a.tour_id).filter(Boolean))];
      const driverIds = [...new Set(assignments.map(a => a.driver_id).filter(Boolean))];
      
      if (tourIds.length === 0) {
        setActiveTours([]);
        setLoading(false);
        return;
      }

      console.log(`[ACTIVE_TOURS] Loading ${tourIds.length} tours and ${driverIds.length} drivers`);

      // Load tours, drivers, and tour stops in parallel
      const [toursData, driversData, allStopsData] = await Promise.all([
        Tour.filter({ id: { $in: tourIds } }) || [],
        driverIds.length > 0 ? User.filter({ id: { $in: driverIds } }) || [] : [],
        TourStop.filter({ tour_id: { $in: tourIds } }, 'position') || []
      ]);
      
      const toursMap = new Map(toursData.map(t => [t.id, t]));
      const driversMap = new Map(driversData.map(d => [d.id, d]));
      
      // Group stops by tour_id
      const stopsByTourId = {};
      allStopsData.forEach(stop => {
        if (!stopsByTourId[stop.tour_id]) {
          stopsByTourId[stop.tour_id] = [];
        }
        stopsByTourId[stop.tour_id].push(stop);
      });
      
      console.log(`[ACTIVE_TOURS] Loaded ${toursData.length} tours, ${driversData.length} drivers, and ${allStopsData.length} stops`);

      const toursWithDetails = [];
      const newDriversLocations = {};
      
      for (const assignment of assignments) {
        const tour = toursMap.get(assignment.tour_id);
        const driver = driversMap.get(assignment.driver_id);
        const tourStops = stopsByTourId[assignment.tour_id] || [];
        
        if (!tour) {
          console.warn(`[ACTIVE_TOURS] Tour ${assignment.tour_id} not found, skipping assignment ${assignment.id}`);
          continue;
        }
        
        let driverLocation = null;
        if (assignment.driver_id) {
          try {
            const driverLocationData = await DriverLocation.filter(
              { driver_id: assignment.driver_id }, 
              '-timestamp',
              1
            ) || [];
            
            if (driverLocationData.length > 0) {
              driverLocation = driverLocationData[0];
              newDriversLocations[assignment.driver_id] = driverLocation;
              console.log(`[ACTIVE_TOURS] Loaded location for driver ${assignment.driver_id}:`, {
                lat: driverLocation.latitude,
                lng: driverLocation.longitude,
                timestamp: driverLocation.timestamp
              });
            } else {
              console.warn(`[ACTIVE_TOURS] No location found for driver ${assignment.driver_id}`);
            }
          } catch (locationError) {
            console.error(`[ACTIVE_TOURS] Error loading location for driver ${assignment.driver_id}:`, locationError);
          }
        }
          
        toursWithDetails.push({
          ...tour,
          assignment,
          driverLocation,
          stops: tourStops.sort((a, b) => (a.position || 0) - (b.position || 0)), // Sort stops by position
          driver: driver || { id: assignment.driver_id, full_name: `Driver ${assignment.driver_id.slice(-4)}` }
        });
      }
      
      console.log(`[ACTIVE_TOURS] Processed ${toursWithDetails.length} active tours with stops`);

      setActiveTours(toursWithDetails);
      setDriversLocations(prev => ({ ...prev, ...newDriversLocations }));
      setDrivers(Object.fromEntries(driversMap));
      setLastUpdate(new Date());

      // *** KEY FIX: Refresh the selected tour with the latest data ***
      if (selectedTour) {
        const updatedSelectedTour = toursWithDetails.find(t => t.id === selectedTour.id);
        if (updatedSelectedTour) {
          setSelectedTour(updatedSelectedTour);
        } else {
          // The tour is no longer active, deselect it
          setSelectedTour(null);
        }
      }

    } catch (error) {
      console.error('[ACTIVE_TOURS] Error loading active tours:', error);
      setError("Failed to load active tours. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleTourSelect = (tour) => {
    console.log('[ACTIVE_TOURS] Tour selected:', tour.title, 'with', tour.stops?.length || 0, 'stops');
    setSelectedTour(tour);
  };

  const handleRefresh = () => {
    console.log('[ACTIVE_TOURS] Manual refresh triggered');
    loadActiveTours();
  };
  
  const currentStopIndexForMap = useMemo(() => {
    if (!selectedTour || !selectedTour.stops || !selectedTour.assignment) return 0;
    const firstUncompletedIndex = selectedTour.stops.findIndex(
      stop => !(selectedTour.assignment.completed_stops || []).includes(stop.id)
    );
    return firstUncompletedIndex === -1 ? selectedTour.stops.length - 1 : firstUncompletedIndex;
  }, [selectedTour]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Active Tours List */}
      <div className="lg:col-span-1 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">{t('admin.activeTours.ongoingTours')}</h3>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        
        <div className="text-xs text-muted-foreground">
          Last updated: {format(lastUpdate, 'HH:mm:ss')}
        </div>
        
        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-md text-red-600 text-sm">
            <AlertTriangle className="w-4 h-4 inline mr-2" />
            {error}
          </div>
        )}
        
        {loading && activeTours.length === 0 ? (
          <div className="space-y-2">
            {[1, 2].map(i => (
              <Card key={i}>
                <CardContent className="p-4 space-y-2">
                  <div className="h-5 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : activeTours.length > 0 ? (
          activeTours.map((tour) => (
            <Card 
              key={tour.id} 
              className={`cursor-pointer transition-all hover:shadow-md ${selectedTour?.id === tour.id ? 'border-indigo-500 shadow-md' : ''}`}
              onClick={() => handleTourSelect(tour)}
            >
              <CardContent className="p-4">
                <h4 className="font-medium">{tour.title}</h4>
                <div className="text-sm text-gray-500 mt-1">
                  {tour.location?.city && tour.location?.country ? 
                    `${tour.location.city}, ${tour.location.country}` : 
                    'Unknown location'}
                </div>
                
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="default" className="text-xs font-normal">
                    In Progress
                  </Badge>
                  <Badge variant="secondary" className="text-xs font-normal">
                    {tour.transportation || 'Unknown'}
                  </Badge>
                </div>
                
                {/* Driver & Vehicle Information */}
                {tour.driver && (
                  <div className="mt-3 pt-3 border-t border-gray-100 text-xs space-y-2">
                    <div className="text-blue-600 font-medium mb-1">👤 Driver: {tour.driver.full_name}</div>
                    {tour.assignment?.vehicle_details && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Car className="h-4 w-4"/>
                        <span>{tour.assignment.vehicle_details}</span>
                      </div>
                    )}
                    {tour.assignment?.group_size && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Users className="h-4 w-4"/>
                        <span>{tour.assignment.group_size} tourists</span>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Driver Location */}
                {tour.driverLocation ? (
                  <div className="mt-2 pt-2 border-t border-gray-100 text-xs space-y-1">
                    <div className="text-green-600 font-medium mb-1">📍 Live GPS Location</div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        Last Update:
                      </span>
                      <span className="font-medium">
                        {format(new Date(tour.driverLocation.timestamp), 'HH:mm:ss')}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">GPS:</span>
                      <span className="font-mono text-[10px]">
                        {tour.driverLocation.latitude.toFixed(4)}, {tour.driverLocation.longitude.toFixed(4)}
                      </span>
                    </div>

                    {tour.driverLocation.battery_level !== undefined && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 flex items-center">
                          <Battery className="w-3 h-3 mr-1" />
                          Battery:
                        </span>
                        <span className="font-medium">
                          {tour.driverLocation.battery_level}%
                        </span>
                      </div>
                    )}
                    
                    {tour.driverLocation.speed !== undefined && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 flex items-center">
                          <Activity className="w-3 h-3 mr-1" />
                          Speed:
                        </span>
                        <span className="font-medium">
                          {tour.driverLocation.speed} km/h
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-2 pt-2 border-t border-gray-100 text-xs">
                    <div className="text-yellow-600 font-medium">⚠️ No GPS signal</div>
                  </div>
                )}

                {/* Progress Information */}
                {tour.assignment && tour.stops?.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-100 text-xs">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-gray-500">Progress:</span>
                      <span className="font-medium">
                        {tour.assignment.completed_stops?.length || 0} / {tour.stops.length} stops
                      </span>
                    </div>
                    <Progress 
                      value={((tour.assignment.completed_stops?.length || 0) / tour.stops.length) * 100} 
                      className="h-1.5"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-gray-400 mb-2">
                <Navigation2 className="w-10 h-10 mx-auto" />
              </div>
              <p className="text-gray-500">
                {t('admin.activeTours.noActiveTours')}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Driver Tracking Map */}
      <div className="lg:col-span-2">
        <Card className="h-[calc(100vh-12rem)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {selectedTour ? (
                <>
                  <MapPin className="w-5 h-5 text-indigo-600" />
                  Live GPS: {selectedTour.title}
                </>
              ) : (
                t('admin.activeTours.selectTourToTrack')
              )}
            </CardTitle>
            {selectedTour?.driverLocation && (
              <div className="text-sm text-gray-500">
                Driver: {selectedTour.driver?.full_name || 'Unknown'} • GPS Updated: {format(new Date(selectedTour.driverLocation.timestamp), 'HH:mm:ss')}
                {selectedTour.stops && ` • ${selectedTour.stops.length} stops • Current: Stop ${currentStopIndexForMap + 1}`}
              </div>
            )}
          </CardHeader>
          <CardContent className="pb-20 h-full">
            <DriverTrackingMap 
              tour={selectedTour} 
              driverLocation={selectedTour?.driverLocation || driversLocations[selectedTour?.assignment?.driver_id]}
              stops={selectedTour?.stops || []}
              completedStops={selectedTour?.assignment?.completed_stops || []}
              currentStopIndex={currentStopIndexForMap}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}