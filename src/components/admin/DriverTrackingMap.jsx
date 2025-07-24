import React, { useRef, useEffect, useState } from 'react';
import { MapPin, Navigation2 } from 'lucide-react';

const DriverTrackingMap = ({
  tour,
  driverLocation,
  stops = [],
  completedStops = [],
  currentStopIndex = 0,
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const driverMarkerRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState(null);

  // Validate coordinates helper
  const isValidCoordinate = (lat, lng) => {
    return typeof lat === 'number' && 
           typeof lng === 'number' && 
           !isNaN(lat) && 
           !isNaN(lng) && 
           lat >= -90 && lat <= 90 && 
           lng >= -180 && lng <= 180;
  };

  // Get safe center coordinates - always return valid coordinates
  const getSafeCenter = () => {
    // Try driver location first
    if (driverLocation && isValidCoordinate(driverLocation.latitude, driverLocation.longitude)) {
      return [driverLocation.longitude, driverLocation.latitude];
    }
    
    // Try first valid stop
    if (stops && stops.length > 0) {
      const validStop = stops.find(stop => 
        stop.location && 
        isValidCoordinate(stop.location.latitude, stop.location.longitude)
      );
      if (validStop) {
        return [validStop.location.longitude, validStop.location.latitude];
      }
    }
    
    // Try tour start point
    if (tour?.location?.start_point && 
        isValidCoordinate(tour.location.start_point.latitude, tour.location.start_point.longitude)) {
      return [tour.location.start_point.longitude, tour.location.start_point.latitude];
    }
    
    // Fallback to Berlin coordinates (always valid)
    return [13.404954, 52.520008];
  };

  // Initialize map once
  useEffect(() => {
    let isMounted = true;
    
    const initializeMap = async () => {
      if (!mapContainerRef.current || mapInstanceRef.current) return;

      try {
        // Load Mapbox if not already loaded
        if (!window.mapboxgl) {
          const link = document.createElement('link');
          link.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css';
          link.rel = 'stylesheet';
          document.head.appendChild(link);
          
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js';
            script.async = true;
            script.onload = resolve;
            script.onerror = () => reject(new Error('Failed to load Mapbox'));
            document.body.appendChild(script);
          });
          
          window.mapboxgl.accessToken = 'pk.eyJ1IjoiYmxvb21pb3giLCJhIjoiY204azN3eXB2MG1qNDJqc2VraWdjMjd3eSJ9.DNKq7_BV2DMOX1xA1G663A';
        }

        const safeCenter = getSafeCenter();
        console.log('[MAP] Initializing map with safe center:', safeCenter);

        // Validate center coordinates before creating map
        if (!isValidCoordinate(safeCenter[1], safeCenter[0])) {
          throw new Error('Invalid center coordinates');
        }

        const map = new window.mapboxgl.Map({
          container: mapContainerRef.current,
          style: 'mapbox://styles/mapbox/streets-v11',
          center: safeCenter,
          zoom: 13
        });

        map.on('load', () => {
          console.log('[MAP] Map loaded successfully');
          if (isMounted) {
            setMapLoaded(true);
            setError(null);
          }
        });

        map.on('error', (e) => {
          console.error('[MAP] Mapbox error:', e);
          if (isMounted) setError('Map failed to load');
        });

        mapInstanceRef.current = map;

      } catch (err) {
        console.error('[MAP] Failed to initialize map:', err);
        if (isMounted) setError(err.message || 'Failed to initialize map');
      }
    };

    initializeMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []); // Only run once

  // Update markers when data changes
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return;
    
    const map = mapInstanceRef.current;
    
    try {
      // Clear existing markers
      markersRef.current.forEach(marker => {
        try {
          marker.remove();
        } catch (e) {
          console.warn('[MAP] Error removing marker:', e);
        }
      });
      markersRef.current = [];

      if (driverMarkerRef.current) {
        try {
          driverMarkerRef.current.remove();
        } catch (e) {
          console.warn('[MAP] Error removing driver marker:', e);
        }
        driverMarkerRef.current = null;
      }

      // Add stop markers
      if (stops && stops.length > 0) {
        stops.forEach((stop, index) => {
          if (!stop.location || !isValidCoordinate(stop.location.latitude, stop.location.longitude)) {
            return; // Skip invalid stops
          }

          try {
            const isCompleted = completedStops.includes(stop.id);
            const isCurrent = index === currentStopIndex;
            
            const el = document.createElement('div');
            el.className = 'w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg border-2 border-white';
            
            if (isCompleted) {
              el.style.backgroundColor = '#22c55e';
              el.innerText = '✓';
            } else if (isCurrent) {
              el.style.backgroundColor = '#3b82f6';
              el.innerText = (index + 1).toString();
              el.style.transform = 'scale(1.25)';
            } else {
              el.style.backgroundColor = '#6b7280';
              el.innerText = (index + 1).toString();
            }

            const marker = new window.mapboxgl.Marker(el)
              .setLngLat([stop.location.longitude, stop.location.latitude])
              .addTo(map);
            
            markersRef.current.push(marker);
          } catch (markerError) {
            console.warn('[MAP] Error creating stop marker:', markerError);
          }
        });
      }

      // Add driver marker
      if (driverLocation && isValidCoordinate(driverLocation.latitude, driverLocation.longitude)) {
        try {
          const el = document.createElement('div');
          el.className = 'w-6 h-6 bg-red-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center';
          el.style.transform = 'scale(1.5)';
          el.innerHTML = '🚗';
          
          driverMarkerRef.current = new window.mapboxgl.Marker(el)
            .setLngLat([driverLocation.longitude, driverLocation.latitude])
            .addTo(map);

          // Center on driver location
          map.setCenter([driverLocation.longitude, driverLocation.latitude]);
        } catch (driverMarkerError) {
          console.warn('[MAP] Error creating driver marker:', driverMarkerError);
        }
      }

    } catch (updateError) {
      console.error('[MAP] Error updating markers:', updateError);
    }
    
  }, [mapLoaded, stops, completedStops, currentStopIndex, driverLocation]);

  if (error) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-gray-50 text-gray-500">
        <MapPin className="h-12 w-12 mb-2" />
        <p className="text-lg font-medium">Map Error</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (!tour && (!stops || stops.length === 0)) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-gray-50 text-gray-500">
        <Navigation2 className="h-12 w-12 mb-2" />
        <p className="text-lg font-medium">No tour selected</p>
        <p className="text-sm">Select a tour to view tracking information</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative">
      <div ref={mapContainerRef} className="h-full w-full" />
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverTrackingMap;