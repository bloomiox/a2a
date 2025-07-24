import React, { useState, useEffect, useRef } from "react";
import { MapPin, AlertTriangle, Loader, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function TourMap({ 
  stops = [], 
  onLocationChange, 
  startLocation = null,
  currentPosition = null 
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const initializationRef = useRef(false);

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
          const timeout = setTimeout(() => reject(new Error('Mapbox script loading timeout')), 10000);
          script.onload = () => {
            clearTimeout(timeout);
            resolve();
          };
          script.onerror = reject;
          document.body.appendChild(script);
        });
        window.mapboxgl.accessToken = 'pk.eyJ1IjoiYmxvb21pb3giLCJhIjoiY204azN3eXB2MG1qNDJqc2VraWdjMjd3eSJ9.DNKq7_BV2DMOX1xA1G663A';
      }
    } catch (err) {
      console.error("Failed to load Mapbox GL:", err);
      setError("Could not load the map library. Please refresh the page.");
      setLoading(false);
    }
  };

  const initializeMap = () => {
    if (!window.mapboxgl || !mapContainerRef.current || mapInstanceRef.current) {
      return;
    }

    setLoading(true);
    try {
      let initialCenter = [-74.5, 40]; // Default
      if (startLocation?.longitude && startLocation?.latitude) {
        initialCenter = [startLocation.longitude, startLocation.latitude];
      } else if (stops.length > 0 && stops[0].location?.longitude) {
        initialCenter = [stops[0].location.longitude, stops[0].location.latitude];
      }

      const map = new window.mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: initialCenter,
        zoom: 12
      });

      map.on('load', () => {
        setLoading(false);
        mapInstanceRef.current = map;
        updateMarkers();
      });

      map.on('click', (e) => {
        if (onLocationChange) {
          onLocationChange(e.lngLat.lat, e.lngLat.lng, -1);
        }
      });
      
      const geolocate = new window.mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserHeading: true
      });

      map.addControl(geolocate);
      map.addControl(new window.mapboxgl.NavigationControl());
      
      geolocate.on('geolocate', (e) => {
          if (onLocationChange) {
              onLocationChange(e.coords.latitude, e.coords.longitude, -1);
          }
      });

    } catch (err) {
      console.error("Map initialization failed:", err);
      setError("Failed to initialize the map.");
      setLoading(false);
    }
  };
  
  const updateMarkers = () => {
    if (!mapInstanceRef.current) return;
    
    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    const allPoints = [];

    // Add/update start location marker
    if (startLocation?.latitude && startLocation?.longitude) {
      const el = document.createElement('div');
      el.className = 'w-6 h-6 bg-green-600 border-2 border-white rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg';
      el.innerText = 'S';
      
      const marker = new window.mapboxgl.Marker(el)
        .setLngLat([startLocation.longitude, startLocation.latitude])
        .addTo(mapInstanceRef.current);
      markersRef.current.push(marker);
      allPoints.push([startLocation.longitude, startLocation.latitude]);
    }

    // Add/update stop markers
    stops.forEach((stop, index) => {
      if (stop.location?.latitude && stop.location?.longitude) {
        const el = document.createElement('div');
        el.className = 'w-8 h-8 bg-indigo-600 border-2 border-white rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg';
        el.innerText = index + 1;

        const marker = new window.mapboxgl.Marker(el)
          .setLngLat([stop.location.longitude, stop.location.latitude])
          .addTo(mapInstanceRef.current);
        markersRef.current.push(marker);
        allPoints.push([stop.location.longitude, stop.location.latitude]);
      }
    });

    if (allPoints.length > 0) {
        const bounds = new window.mapboxgl.LngLatBounds(
            allPoints[0],
            allPoints[0]
        );
        for (const point of allPoints) {
            bounds.extend(point);
        }
        mapInstanceRef.current.fitBounds(bounds, { padding: 80, maxZoom: 15 });
    }
  };

  useEffect(() => {
    if (initializationRef.current) {
        updateMarkers();
    }
  }, [stops, startLocation]);

  useEffect(() => {
    if (!initializationRef.current) {
      loadMapbox().then(() => {
        if (mapContainerRef.current) {
          initializeMap();
          initializationRef.current = true;
        }
      });
    }
    
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        initializationRef.current = false;
      }
    };
  }, []);

  return (
    <div>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="relative w-full h-[500px] rounded-lg bg-gray-200">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
            <Loader className="animate-spin text-indigo-600" size={32} />
          </div>
        )}
        <div ref={mapContainerRef} className="w-full h-full rounded-lg" />
      </div>
      <Alert className="mt-4">
        <MapPin className="h-4 w-4" />
        <AlertDescription>
          Click on the map to set the tour's starting location, or use the location icon on the map to find your position. Stop locations can be set in the 'Stops' section.
        </AlertDescription>
      </Alert>
    </div>
  );
}