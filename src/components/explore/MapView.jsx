import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Map, Play, Footprints, Car, Bike, Train } from "lucide-react";

// Simulate a map with a basic placeholder
// In a real implementation, you would use a mapping library like Mapbox or Google Maps
export default function MapView({ tours, loading }) {
  const [selectedTour, setSelectedTour] = useState(null);
  const [userPosition, setUserPosition] = useState(null);
  
  useEffect(() => {
    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserPosition({ latitude, longitude });
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  }, []);
  
  const getTransportIcon = (type) => {
    switch (type) {
      case "driving":
        return <Car size={14} className="text-gray-500" />;
      case "cycling":
        return <Bike size={14} className="text-gray-500" />;
      case "public_transport":
        return <Train size={14} className="text-gray-500" />;
      case "mixed":
        return <Map size={14} className="text-gray-500" />;
      case "walking":
      default:
        return <Footprints size={14} className="text-gray-500" />;
    }
  };
  
  const renderTourMarkers = () => {
    return tours.map((tour, index) => {
      // Position markers in a grid pattern
      const row = Math.floor(index / 5);
      const col = index % 5;
      
      // Calculate position as percentage from top-left
      const left = 10 + (col * 20);
      const top = 20 + (row * 15);
      
      const markerColor = getMarkerColor(tour.theme);
      
      return (
        <div
          key={tour.id}
          className={`absolute cursor-pointer w-10 h-10 rounded-full ${markerColor} flex items-center justify-center shadow-md transition-all hover:scale-110`}
          style={{ left: `${left}%`, top: `${top}%` }}
          onClick={() => setSelectedTour(tour)}
        >
          <span className="font-semibold text-white">{index + 1}</span>
        </div>
      );
    });
  };
  
  const getMarkerColor = (theme) => {
    switch (theme) {
      case "cultural":
        return "bg-pink-500";
      case "historical":
        return "bg-amber-500";
      case "nature":
        return "bg-green-500";
      case "culinary":
        return "bg-orange-500";
      case "adventure":
        return "bg-blue-500";
      case "architectural":
        return "bg-indigo-500";
      case "art":
        return "bg-purple-500";
      default:
        return "bg-gray-500";
    }
  };
  
  // Handle click outside to close the selected tour popup
  const handleMapClick = useCallback((e) => {
    if (e.target.closest(".tour-popup")) return;
    setSelectedTour(null);
  }, []);
  
  if (loading) {
    return (
      <div className="h-[600px] rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Skeleton className="h-10 w-10 rounded-full mx-auto mb-2" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>
    );
  }
  
  return (
    <div 
      className="h-[600px] rounded-lg overflow-hidden relative bg-gray-100"
      onClick={handleMapClick}
    >
      {/* Map placeholder */}
      <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
        <div className="text-gray-400">
          <Map size={48} className="mx-auto mb-2" />
          <p>Interactive map would appear here</p>
          <p className="text-sm">Showing {tours.length} tours</p>
        </div>
      </div>
      
      {/* User location marker */}
      {userPosition && (
        <div 
          className="absolute w-6 h-6 rounded-full bg-blue-600 border-2 border-white shadow-lg"
          style={{ left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}
        >
          <div className="animate-ping absolute inset-0 rounded-full bg-blue-400 opacity-75"></div>
        </div>
      )}
      
      {/* Tour markers */}
      {renderTourMarkers()}
      
      {/* Selected tour popup */}
      {selectedTour && (
        <div 
          className="tour-popup absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-10"
        >
          <Card className="shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div 
                  className={`w-10 h-10 rounded-full ${getMarkerColor(selectedTour.theme)} flex items-center justify-center flex-shrink-0`}
                >
                  <span className="font-semibold text-white">
                    {tours.findIndex(t => t.id === selectedTour.id) + 1}
                  </span>
                </div>
                
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">{selectedTour.title}</h3>
                  
                  {selectedTour.description && (
                    <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                      {selectedTour.description}
                    </p>
                  )}
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    {selectedTour.theme && (
                      <Badge variant="secondary" className="text-xs">
                        {selectedTour.theme}
                      </Badge>
                    )}
                    
                    {selectedTour.difficulty && (
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${
                          selectedTour.difficulty === "challenging" 
                            ? "bg-red-100 text-red-800" 
                            : selectedTour.difficulty === "moderate"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-green-100 text-green-800"
                        }`}
                      >
                        {selectedTour.difficulty}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                    {selectedTour.transportation && (
                      <div className="flex items-center gap-1">
                        {getTransportIcon(selectedTour.transportation)}
                        <span className="capitalize">{selectedTour.transportation.replace("_", " ")}</span>
                      </div>
                    )}
                    
                    {selectedTour.duration && (
                      <div className="flex items-center gap-1">
                        <Clock size={14} className="text-gray-500" />
                        <span>{selectedTour.duration} min</span>
                      </div>
                    )}
                  </div>
                  
                  <Button 
                    className="w-full gap-1 bg-indigo-600 hover:bg-indigo-700"
                    asChild
                  >
                    <Link to={createPageUrl(`Play?id=${selectedTour.id}`)}>
                      <Play size={16} />
                      Start Tour
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}