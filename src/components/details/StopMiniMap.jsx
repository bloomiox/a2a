import React, { useEffect, useRef, useState } from "react";

export default function StopMiniMap({ location, stopTitle }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [mapboxLoaded, setMapboxLoaded] = useState(!!window.mapboxgl);
  const [mapError, setMapError] = useState(false);

  useEffect(() => {
    if (mapboxLoaded) return;

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
            script.onerror = reject;
            document.body.appendChild(script);
          });
          window.mapboxgl.accessToken = 'pk.eyJ1IjoiYmxvb21pb3giLCJhIjoiY204azN3eXB2MG1qNDJqc2VraWdjMjd3eSJ9.DNKq7_BV2DMOX1xA1G663A'; // Replace with your Mapbox token if necessary
        }
        setMapboxLoaded(true);
      } catch (error) {
        console.error("Error loading Mapbox for StopMiniMap:", error);
        setMapError(true);
      }
    };
    loadMapbox();
  }, [mapboxLoaded]);

  useEffect(() => {
    if (!mapboxLoaded || !mapContainerRef.current || !location || !location.latitude || !location.longitude) {
      if (location && (!location.latitude || !location.longitude)) {
          setMapError(true); // Mark as error if location is invalid
      }
      return;
    }
    setMapError(false);

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }
    
    try {
      const map = new window.mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [location.longitude, location.latitude],
        zoom: 15,
        interactive: false, // Make map non-interactive for a "mini" display
        attributionControl: false
      });
      mapInstanceRef.current = map;

      new window.mapboxgl.Marker()
        .setLngLat([location.longitude, location.latitude])
        .addTo(map);
      
      map.on('error', () => setMapError(true));

    } catch (error) {
        console.error("Error initializing StopMiniMap:", error);
        setMapError(true);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [mapboxLoaded, location]);

  if (mapError || !location || !location.latitude || !location.longitude) {
    return (
      <div className="h-48 w-full bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-sm text-gray-500">Map preview unavailable for {stopTitle || 'this stop'}.</p>
      </div>
    );
  }

  return <div ref={mapContainerRef} className="h-48 w-full rounded-lg overflow-hidden" />;
}