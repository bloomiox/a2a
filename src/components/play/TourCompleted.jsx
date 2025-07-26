import React, { useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/api/entities";
import Confetti from '@/components/ui/confetti';
import { Button } from '@/components/ui/button';
import { CheckCircle, Home } from 'lucide-react';

export default function TourCompleted({ isDriverView = false }) {
  const navigate = useNavigate();
  
  useEffect(() => {
    if (isDriverView) {
      // If driver, shorter timeout to return to assignments
      const timer = setTimeout(() => {
        navigate(createPageUrl("Driver"));
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isDriverView, navigate]);

  const handleDone = () => {
    if (isDriverView) {
      navigate(createPageUrl("Driver"));
    } else {
      navigate(createPageUrl("Home"));
    }
  };
  
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50 p-4">
      <Confetti />
      <div className="bg-white rounded-xl w-full max-w-md p-8 text-center shadow-xl relative">
        <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-12 w-12 text-green-600" />
        </div>
        
        <h2 className="text-2xl font-bold mb-2">Tour Completed!</h2>
        <p className="text-gray-600 mb-6">
          {isDriverView 
            ? "Great job! The tour has been successfully completed." 
            : "Thank you for exploring with AudioGuide!"}
        </p>
        
        <Button onClick={handleDone} size="lg" className="w-full">
          <Home className="mr-2 h-5 w-5" />
          {isDriverView ? "Return to Assignments" : "Return Home"}
        </Button>
      </div>
    </div>
  );
}