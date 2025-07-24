import React from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Headphones,
  Map,
  Navigation,
  Globe,
  Users,
  PlayCircle,
  MapPin,
  ArrowRight,
  CheckCircle,
  Bookmark,
  Download,
  Volume2
} from "lucide-react";
import { useLanguage } from "@/components/i18n/LanguageContext";

export default function Landing() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate(createPageUrl("Login"));
  };

  const handleSignup = () => {
    navigate(createPageUrl("Register"));
  };

  const features = [
    {
      icon: <Globe className="h-6 w-6 text-indigo-600" />,
      title: "Global Audio Tours",
      description: "Explore cities and landmarks worldwide with expert audio guides"
    },
    {
      icon: <Navigation className="h-6 w-6 text-indigo-600" />,
      title: "GPS Navigation",
      description: "Real-time directions and location-based audio playback"
    },
    {
      icon: <Volume2 className="h-6 w-6 text-indigo-600" />,
      title: "High-Quality Audio",
      description: "Crystal clear narration and immersive sound effects"
    },
    {
      icon: <Download className="h-6 w-6 text-indigo-600" />,
      title: "Offline Access",
      description: "Download tours for offline use without internet connection"
    },
    {
      icon: <Users className="h-6 w-6 text-indigo-600" />,
      title: "Community Created",
      description: "Tours created by local experts and history enthusiasts"
    },
    {
      icon: <Bookmark className="h-6 w-6 text-indigo-600" />,
      title: "Personal Collections",
      description: "Save your favorite tours and track your progress"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-blue-500 opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Explore the World with
              <br />
              <span className="text-indigo-600">Audio Tours</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              Discover immersive audio experiences that bring cities, museums, and landmarks to life. Created by locals, enjoyed by travelers worldwide.
            </p>
            <div className="flex items-center gap-4 justify-center">
              <Button 
                variant="ghost"
                onClick={handleLogin}
              >
                {t('auth.login')}
              </Button>
              <Button 
                onClick={handleSignup}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {t('auth.signup')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything You Need for Perfect Audio Tours
            </h2>
            <p className="text-xl text-gray-600">
              Discover all the features that make exploring with AudioTour unique
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="h-12 w-12 rounded-lg bg-indigo-50 flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Statistics Section */}
      <div className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-indigo-600 mb-2">1000+</div>
              <div className="text-gray-600">Audio Tours</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-indigo-600 mb-2">50+</div>
              <div className="text-gray-600">Countries</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-indigo-600 mb-2">100K+</div>
              <div className="text-gray-600">Happy Users</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-indigo-600 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-8">
            Ready to Start Your Audio Journey?
          </h2>
          <Button 
            size="lg" 
            variant="secondary"
            onClick={handleSignup}
            className="text-lg bg-white text-indigo-600 hover:bg-gray-100"
          >
            Create Your Free Account
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}