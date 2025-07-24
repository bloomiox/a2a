import React from "react";
import { MapPin, Clock } from "lucide-react";

export default function DistanceDisplay({ distance, estimatedTime, triggerRadius }) {
  if (distance === null || distance === undefined) return null;
  
  const distanceInMeters = distance * 1000;
  const isNearby = distanceInMeters <= triggerRadius;
  
  const formatDistance = () => {
    if (distanceInMeters < 1000) {
      return `${Math.round(distanceInMeters)} m`;
    } else {
      return `${distance.toFixed(2)} km`;
    }
  };
  
  return (
    <div className="flex items-center bg-gray-50 rounded-lg p-3 text-sm">
      <div className="flex items-center gap-1 mr-4">
        <MapPin size={16} className={isNearby ? "text-green-500" : "text-gray-400"} />
        <span className={isNearby ? "text-green-600 font-medium" : "text-gray-600"}>
          {isNearby ? "You've arrived!" : formatDistance()}
        </span>
      </div>
      
      {!isNearby && estimatedTime && (
        <div className="flex items-center gap-1">
          <Clock size={16} className="text-gray-400" />
          <span className="text-gray-600">
            {estimatedTime < 2 ? "About a minute" : `~${estimatedTime} min`} away
          </span>
        </div>
      )}
    </div>
  );
}