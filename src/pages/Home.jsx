import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/api/entities";
import { Tour } from "@/api/entities";
import { UserProgress } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowRight
} from "lucide-react";

import TourCard from "../components/tours/TourCard";
import CategoryCarousel from "../components/home/CategoryCarousel";
import { useLanguage } from '@/components/i18n/LanguageContext';

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [recentTours, setRecentTours] = useState([]);
  const [popularTours, setPopularTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        try {
          const userData = await User.me();
          setUser(userData);
          setIsAuthenticated(true);
          sessionStorage.setItem('userData', JSON.stringify(userData));
          
          // Redirect admin users to AdminDashboard
          if (userData.user_group?.includes("Admin")) {
            navigate(createPageUrl("AdminDashboard"));
            return;
          }
          
          // Redirect driver users to Driver dashboard
          if (userData.user_group?.includes("Driver")) {
            navigate(createPageUrl("Driver"));
            return;
          }
          
        } catch (error) {
          console.log("User not authenticated");
          setIsAuthenticated(false);
          navigate(createPageUrl("Landing"));
          return;
        }
        
        const allTours = await Tour.filter({ is_public: true }, '-created_date', 10);
        
        setPopularTours(allTours);
        
        const recentToursData = [...allTours].sort(() => Math.random() - 0.5).slice(0, 5);
        setRecentTours(recentToursData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [navigate]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center space-x-4 mb-10">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        
        <Skeleton className="h-5 w-40 mb-4" />
        <div className="flex gap-4 mb-10">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 w-36 rounded-xl" />)}
        </div>
        
        <div className="flex justify-between items-end mb-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-20" />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-80 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-12">
      {/* User Welcome Section */}
      <div className="flex items-center gap-4">
         {user.profile_image ? (
            <img
              src={user.profile_image}
              alt={user.full_name}
              className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold">
              {user.full_name.charAt(0)}
            </div>
          )}
        <div>
          <p className="text-muted-foreground">{t('home.welcome')}</p>
          <h1 className="text-2xl font-bold text-foreground">
            {user.full_name.split(' ')[0]}
          </h1>
        </div>
      </div>

      {/* Categories Carousel */}
      <div>
        <h2 className="text-xl font-bold text-foreground mb-4">{t('home.browseByCategory')}</h2>
        <CategoryCarousel />
      </div>

      {/* Popular Tours */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">{t('home.popularTours')}</h2>
          <Link to={createPageUrl("Explore")}>
            <Button variant="ghost" className="text-primary hover:text-primary">
              {t('home.seeAll')} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {popularTours.slice(0, 3).map(tour => (
            <TourCard key={tour.id} tour={tour} />
          ))}
        </div>
      </div>

      {/* Recently Added */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">{t('home.recentlyAdded')}</h2>
          <Link to={createPageUrl("Explore?sort=newest")}>
            <Button variant="ghost" className="text-primary hover:text-primary">
              {t('home.seeAll')} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
        
        <ScrollArea className="w-full whitespace-nowrap -mx-4 px-4 pb-4">
          <div className="flex gap-4">
            {recentTours.map(tour => (
              <div key={tour.id} className="w-[280px] sm:w-[320px] flex-shrink-0">
                <TourCard tour={tour} />
              </div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </div>
  );
}