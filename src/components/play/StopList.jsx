import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle2, 
  MapPin, 
  Clock, 
  ChevronRight
} from "lucide-react";

export default function StopList({ stops, currentStopIndex, onStopSelect, completedStops = [] }) {
  return (
    <ScrollArea className="h-[60vh] rounded-lg border overflow-hidden">
      <div className="p-4">
        <div className="space-y-2">
          {stops.map((stop, index) => {
            const isCompleted = completedStops.includes(stop.id);
            const isActive = index === currentStopIndex;
            
            return (
              <Button
                key={stop.id || index}
                variant={isActive ? "default" : "ghost"}
                className={`w-full justify-start h-auto py-3 px-4 ${
                  isActive ? "bg-indigo-600" : isCompleted ? "bg-gray-50" : ""
                }`}
                onClick={() => onStopSelect(index)}
              >
                <div className="flex items-center gap-3 w-full">
                  <div 
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isCompleted 
                        ? "bg-green-100 text-green-600" 
                        : isActive 
                          ? "bg-white text-indigo-600" 
                          : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 size={16} />
                    ) : (
                      <span className="text-sm font-medium">{index + 1}</span>
                    )}
                  </div>
                  
                  <div className={`text-left flex-1 ${isActive ? "text-white" : ""}`}>
                    <div className="font-medium">
                      {stop.title || `Stop ${index + 1}`}
                    </div>
                    
                    {stop.estimated_time && (
                      <div className={`text-xs flex items-center gap-1 ${
                        isActive ? "text-indigo-100" : "text-gray-500"
                      }`}>
                        <Clock size={12} />
                        {stop.estimated_time} min
                      </div>
                    )}
                  </div>
                  
                  <ChevronRight size={16} className={isActive ? "text-white" : "text-gray-400"} />
                </div>
              </Button>
            );
          })}
        </div>
      </div>
    </ScrollArea>
  );
}