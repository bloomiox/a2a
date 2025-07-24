import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Play, Map } from "lucide-react";

export default function ContinueTourCard({ tour }) {
  const completedStops = tour.progress?.completed_stops?.length || 0;
  const totalStops = 10; // This should be the actual number of stops for this tour
  const progressPercentage = (completedStops / totalStops) * 100;
  
  return (
    <Card className="w-[300px] flex-shrink-0 overflow-hidden group hover:shadow-md transition-all">
      <div className="relative h-32">
        {tour.preview_image ? (
          <img
            src={tour.preview_image}
            alt={tour.title}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-indigo-100 flex items-center justify-center text-indigo-300">
            <Map size={32} />
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-4 py-2">
          <h3 className="text-white font-medium truncate">{tour.title}</h3>
        </div>
      </div>
      
      <CardContent className="p-4">
        <div className="flex justify-between items-center text-xs text-gray-500 mb-1">
          <span>Progress</span>
          <span>{completedStops} of {totalStops} stops</span>
        </div>
        <Progress value={progressPercentage} className="h-1 mb-3" />
        
        <Button 
          variant="default" 
          className="w-full gap-1 bg-indigo-600 hover:bg-indigo-700"
          asChild
        >
          <Link to={createPageUrl(`Play?id=${tour.id}`)}>
            <Play size={16} />
            Continue
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}