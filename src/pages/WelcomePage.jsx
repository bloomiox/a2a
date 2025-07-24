import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Headphones } from "lucide-react";

export default function WelcomePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const userData = await User.me();
        setUser(userData);
        navigate(createPageUrl("Home"));
      } catch (error) {
        // No authenticated user - stay on welcome page
        setLoading(false);
      }
    };

    checkUser();
  }, [navigate]);

  const handleLogin = async () => {
    try {
      await User.login();
      navigate(createPageUrl("Home"));
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-indigo-50 to-blue-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
          <p className="text-indigo-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-tr from-indigo-50 to-blue-50">
      <div className="container mx-auto px-4 py-12 md:py-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="h-20 w-20 rounded-xl bg-indigo-600 text-white flex items-center justify-center mx-auto mb-6">
              <Headphones size={40} />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Discover the World with Immersive Audio Tours
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience guided tours with GPS-triggered audio, create and share your own tours, and explore new places like never before.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
                <Headphones className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Immersive Audio Experience</h3>
              <p className="text-gray-600">
                GPS-triggered audio guides that automatically play as you explore, with support for multiple languages.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-map"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" x2="9" y1="3" y2="18"/><line x1="15" x2="15" y1="6" y2="21"/></svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Interactive Maps</h3>
              <p className="text-gray-600">
                See your location and nearby points of interest with visual indicators for audio trigger zones.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus-circle"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Create & Share</h3>
              <p className="text-gray-600">
                Create your own custom audio tours with photos, descriptions, and share them with the world.
              </p>
            </div>
          </div>

          <div className="text-center">
            <Button onClick={handleLogin} className="bg-indigo-600 hover:bg-indigo-700 text-lg px-8 py-6 h-auto">
              Sign in to Start Exploring
            </Button>
            <p className="mt-4 text-gray-500 text-sm">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}