import React, { useRef, useEffect, useState, memo, useCallback } from "react";

const PlayMap = ({ 
  stops = [], 
  currentStopIndex = 0, 
  userLocation = null, 
  onStopClick = null
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const userMarkerRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState(null);
  const initialAnimationDone = useRef(false);

  const memoizedStops = React.useMemo(() => stops, [stops]);

  // Load Mapbox library and initialize map
  useEffect(() => {
    let isMounted = true;
    
    const loadMapbox = async () => {
      try {
        if (!window.mapboxgl) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css';
          document.head.appendChild(link);
          
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js';
            script.async = true;
            script.onload = resolve;
            script.onerror = () => reject(new Error('Mapbox script failed to load.'));
            document.body.appendChild(script);
          });
          window.mapboxgl.accessToken = 'pk.eyJ1IjoiYmxvb21pb3giLCJhIjoiY204azN3eXB2MG1qNDJqc2VraWdjMjd3eSJ9.DNKq7_BV2DMOX1xA1G663A';
        }
      } catch (err) {
        if (isMounted) setError(err.message);
        console.error(err);
      }
    };
    
    const initializeMap = () => {
      if (!window.mapboxgl || !mapContainerRef.current || mapInstanceRef.current) return;

      const center = [-74.5, 40]; // Default center

      try {
        const map = new window.mapboxgl.Map({
          container: mapContainerRef.current,
          style: 'mapbox://styles/mapbox/streets-v11',
          center: center,
          zoom: 12
        });

        map.on('load', () => {
          if (isMounted) setMapLoaded(true);
        });

        map.on('error', (e) => {
          console.error('Map error:', e);
          if (e.error?.message?.includes('styleimagemissing')) {
            console.warn('Map style image missing, continuing with default style');
          }
        });

        mapInstanceRef.current = map;
      } catch (err) {
        if (isMounted) setError("Failed to create map.");
        console.error(err);
      }
    };

    loadMapbox().then(() => {
      if (isMounted) initializeMap();
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Effect to draw and update markers
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return;

    // Clear old markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add stop markers
    memoizedStops.forEach((stop, index) => {
      if (!stop.location?.latitude || !stop.location?.longitude) return;

      const isCurrent = index === currentStopIndex;
      const el = document.createElement('div');
      el.className = `w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm cursor-pointer shadow-lg border-2 border-white transition-all ${
        isCurrent ? 'bg-indigo-600 scale-125' : 'bg-gray-500'
      }`;
      el.innerText = index + 1;
      el.onclick = () => onStopClick && onStopClick(index);

      const marker = new window.mapboxgl.Marker(el)
        .setLngLat([stop.location.longitude, stop.location.latitude])
        .addTo(mapInstanceRef.current);
      
      markersRef.current.push(marker);
    });

  }, [mapLoaded, memoizedStops, currentStopIndex, onStopClick]);

  // Effect for initial zoom animation and subsequent navigation
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || memoizedStops.length === 0) return;

    const allPoints = memoizedStops
      .filter(s => s.location?.latitude && s.location?.longitude)
      .map(s => [s.location.longitude, s.location.latitude]);
    
    if (allPoints.length === 0) return;

    const currentStop = memoizedStops[currentStopIndex];
    const currentStopCoords = [currentStop.location.longitude, currentStop.location.latitude];

    if (!initialAnimationDone.current) {
      // This is the initial load animation
      initialAnimationDone.current = true;

      if (allPoints.length > 1) {
        const bounds = new window.mapboxgl.LngLatBounds(allPoints[0], allPoints[0]);
        allPoints.forEach(point => bounds.extend(point));
        
        // 1. Instantly fit all stops in view
        mapInstanceRef.current.fitBounds(bounds, { padding: 80, duration: 0 });

        // 2. After a delay, animate to the current stop
        const timer = setTimeout(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.flyTo({
              center: currentStopCoords,
              zoom: 15,
              duration: 2500, // Slow, smooth flight
              essential: true,
            });
          }
        }, 1500); // 1.5-second delay

        return () => clearTimeout(timer);
      } else {
        // If only one stop, just fly to it
        mapInstanceRef.current.flyTo({ center: allPoints[0], zoom: 15, duration: 1500 });
      }
    } else {
      // This handles navigation to a new stop after the initial animation
      mapInstanceRef.current.flyTo({
        center: currentStopCoords,
        zoom: 15,
        duration: 1500,
        essential: true,
      });
    }
  }, [mapLoaded, memoizedStops, currentStopIndex]);


  // Update user location marker
  useEffect(() => {
      if (!mapLoaded || !mapInstanceRef.current || !userLocation) return;

      const userLngLat = [userLocation.longitude, userLocation.latitude];
      
      if(userMarkerRef.current){
          userMarkerRef.current.setLngLat(userLngLat);
      } else {
          const el = document.createElement('div');
          el.className = 'w-4 h-4 bg-blue-500 border-2 border-white rounded-full shadow';
          userMarkerRef.current = new window.mapboxgl.Marker(el)
              .setLngLat(userLngLat)
              .addTo(mapInstanceRef.current);
      }
  }, [mapLoaded, userLocation]);

  return (
    <div className="relative w-full h-full">
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-100 text-red-700 z-10 p-4">
          Error: {error}
        </div>
      )}
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
};

export default memo(PlayMap);