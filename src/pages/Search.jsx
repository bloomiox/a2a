
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Tour } from "@/api/entities";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Search as SearchIcon, 
  MapPin, 
  Compass, 
  UserCheck 
} from "lucide-react";

import TourCard from "../components/tours/TourCard";
import { useLanguage } from '@/components/i18n/LanguageContext';

export default function Search() {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState("all");

  const performSearch = async (term) => {
    if (!term.trim()) return;
    
    setLoading(true);
    try {
      // Search for tours
      const tours = await Tour.filter({
        $or: [
          { title: { $regex: term, $options: 'i' } },
          { description: { $regex: term, $options: 'i' } },
          { "location.city": { $regex: term, $options: 'i' } },
          { "location.country": { $regex: term, $options: 'i' } }
        ]
      });

      // Filter by category if selected
      const filteredTours = category === "all" 
        ? tours 
        : tours.filter(tour => tour.theme === category);

      setSearchResults(filteredTours);
      
      // Update recent searches
      const updatedSearches = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5);
      setRecentSearches(updatedSearches);
      localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load recent searches from localStorage
    const savedSearches = localStorage.getItem('recentSearches');
    if (savedSearches) {
      setRecentSearches(JSON.parse(savedSearches));
    }
  }, []);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">{t('search.title')}</h1>
        <p className="text-gray-500 mb-6">{t('search.description')}</p>

        <div className="relative mb-6">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <Input
            type="search"
            placeholder={t('search.inputPlaceholder')}
            className="pl-10 pr-4 h-12"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                performSearch(searchTerm);
              }
            }}
          />
        </div>

        <Tabs defaultValue="all" className="mb-8" onValueChange={setCategory}>
          <TabsList>
            <TabsTrigger value="all">{t('common.all')}</TabsTrigger>
            <TabsTrigger value="cultural">{t('tours.cultural')}</TabsTrigger>
            <TabsTrigger value="historical">{t('tours.historical')}</TabsTrigger>
            <TabsTrigger value="nature">{t('tours.nature')}</TabsTrigger>
            <TabsTrigger value="adventure">{t('tours.adventure')}</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Recent Searches */}
        {!searchTerm && recentSearches.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-medium text-gray-500 mb-3">{t('search.recentSearches')}</h2>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((term, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm(term);
                    performSearch(term);
                  }}
                >
                  {term}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Search Results */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-0">
                  <Skeleton className="h-48 rounded-t-lg" />
                  <div className="p-4">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-4" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : searchResults.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {searchResults.map((tour) => (
              <TourCard key={tour.id} tour={tour} />
            ))}
          </div>
        ) : searchTerm ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Compass className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium mb-2">{t('search.noResults')}</h3>
            <p className="text-gray-500 mb-4">{t('search.tryAdjusting')}</p>
            <Button variant="outline" onClick={() => setSearchTerm('')}>
              {t('search.clearSearch')}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 text-center">
              <MapPin className="w-8 h-8 text-indigo-600 mx-auto mb-3" />
              <h3 className="font-medium mb-2">{t('search.byLocation')}</h3>
              <p className="text-sm text-gray-500">{t('search.byLocationDesc')}</p>
            </Card>
            <Card className="p-6 text-center">
              <Compass className="w-8 h-8 text-indigo-600 mx-auto mb-3" />
              <h3 className="font-medium mb-2">{t('search.byCategory')}</h3>
              <p className="text-sm text-gray-500">{t('search.byCategoryDesc')}</p>
            </Card>
            <Card className="p-6 text-center">
              <UserCheck className="w-8 h-8 text-indigo-600 mx-auto mb-3" />
              <h3 className="font-medium mb-2">{t('search.topRated')}</h3>
              <p className="text-sm text-gray-500">{t('search.topRatedDesc')}</p>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
