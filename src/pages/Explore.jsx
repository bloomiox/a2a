import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Tour } from "@/api/entities";
import { User } from "@/api/entities";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Map as MapIcon,
  Filter,
  ArrowUpDown,
  Check,
  X,
  LayoutGrid
} from "lucide-react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

import TourCard from "../components/tours/TourCard";
import MapView from "../components/explore/MapView";
import { useLanguage } from '@/components/i18n/LanguageContext';

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
};

export default function Explore() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid");
  const [user, setUser] = useState(null);
  
  const [filters, setFilters] = useState({
    theme: [],
    transportation: [],
    duration: [0, 360],
    difficulty: [],
    accessibility: [],
    languages: []
  });
  
  const [sort, setSort] = useState("popularity");
  
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const theme = params.get('theme');
    const sortParam = params.get('sort');

    if (theme) {
      setFilters(prev => ({ ...prev, theme: [theme] }));
    }
    if(sortParam) {
      setSort(sortParam);
    }
  }, [location.search]);
  
  useEffect(() => {
    const loadTourData = async () => {
      setLoading(true);
      try {
        const toursData = await Tour.filter({ is_public: true });
        
        let filteredTours = toursData;
        
        if (filters.theme.length > 0) {
          filteredTours = filteredTours.filter(tour => filters.theme.includes(tour.theme));
        }
        if (filters.transportation.length > 0) {
          filteredTours = filteredTours.filter(tour => filters.transportation.includes(tour.transportation));
        }
        filteredTours = filteredTours.filter(tour => tour.duration >= filters.duration[0] && tour.duration <= filters.duration[1]);
        if (filters.difficulty.length > 0) {
          filteredTours = filteredTours.filter(tour => filters.difficulty.includes(tour.difficulty));
        }
        if (filters.accessibility.length > 0) {
          filteredTours = filteredTours.filter(tour => tour.accessibility && filters.accessibility.some(access => tour.accessibility.includes(access)));
        }
        if (filters.languages.length > 0) {
          filteredTours = filteredTours.filter(tour => tour.languages && filters.languages.some(lang => tour.languages.includes(lang)));
        }
        if (debouncedSearchQuery) {
          const query = debouncedSearchQuery.toLowerCase();
          filteredTours = filteredTours.filter(tour => tour.title.toLowerCase().includes(query) || (tour.description && tour.description.toLowerCase().includes(query)));
        }
        
        switch (sort) {
          case "newest":
            filteredTours.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
            break;
          case "oldest":
            filteredTours.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
            break;
          case "duration_asc":
            filteredTours.sort((a, b) => a.duration - b.duration);
            break;
          case "duration_desc":
            filteredTours.sort((a, b) => b.duration - a.duration);
            break;
          default:
            break;
        }

        setTours(filteredTours);
      } catch (error) {
        console.error("Error loading tours:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadTourData();
  }, [debouncedSearchQuery, filters, sort]);
  
  const handleTourDeleted = (tourId) => {
    setTours(prev => prev.filter(tour => tour.id !== tourId));
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.theme.length) count++;
    if (filters.transportation.length) count++;
    if (filters.duration[0] > 0 || filters.duration[1] < 360) count++;
    if (filters.difficulty.length) count++;
    if (filters.accessibility.length) count++;
    if (filters.languages.length) count++;
    return count;
  };

  const clearAllFilters = () => {
    setFilters({
      theme: [],
      transportation: [],
      duration: [0, 360],
      difficulty: [],
      accessibility: [],
      languages: []
    });
    setSearchQuery("");
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-foreground tracking-tight">{t('tours.exploreTours')}</h1>
        <p className="text-lg text-muted-foreground mt-2 max-w-2xl mx-auto">{t('tours.discoverAudioTours')}</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6 sticky top-16 bg-background/80 backdrop-blur-md py-4 z-30">
        <form onSubmit={(e) => e.preventDefault()} className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
            <Input
              type="search"
              placeholder={t('common.searchPlaceholder')}
              className="pl-11 h-12 text-base rounded-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>
        
        <div className="flex gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="h-12 px-4 gap-2 rounded-xl">
                <Filter size={18} />
                <span className="font-semibold">{t('common.filters')}</span>
                {getActiveFilterCount() > 0 && (
                  <Badge className="ml-1 bg-accent hover:bg-accent/90 h-6 w-6 p-0 flex items-center justify-center rounded-full text-accent-foreground">
                    {getActiveFilterCount()}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[90vw] sm:w-[450px]">
              <FiltersPanel 
                filters={filters}
                applyFilters={setFilters}
                clearAllFilters={clearAllFilters}
              />
            </SheetContent>
          </Sheet>
          
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-[180px] h-12 rounded-xl">
              <SelectValue placeholder={t('common.sortBy')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popularity">{t('tours.sortPopularity')}</SelectItem>
              <SelectItem value="newest">{t('tours.sortNewest')}</SelectItem>
              <SelectItem value="oldest">{t('tours.sortOldest')}</SelectItem>
              <SelectItem value="duration_asc">{t('tours.sortDurationAsc')}</SelectItem>
              <SelectItem value="duration_desc">{t('tours.sortDurationDesc')}</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12 rounded-xl"
            onClick={() => setViewMode(viewMode === "grid" ? "map" : "grid")}
          >
            {viewMode === "grid" ? <MapIcon size={20} /> : <LayoutGrid size={20} />}
          </Button>
        </div>
      </div>

      {getActiveFilterCount() > 0 && (
        <div className="flex flex-wrap gap-2 mb-6 items-center">
          <span className="text-sm font-medium text-muted-foreground">Active Filters:</span>
          {filters.theme.length > 0 && filters.theme.map(item => (
            <Badge key={item} variant="secondary" className="px-2 py-1 gap-1.5">
              {t(`themes.${item}`)}
              <X size={14} className="cursor-pointer" onClick={() => setFilters(f => ({...f, theme: f.theme.filter(i => i !== item)}))} />
            </Badge>
          ))}
          <Button variant="ghost" size="sm" className="h-8 text-xs text-accent hover:text-accent" onClick={clearAllFilters}>
            {t('common.clearAll')}
          </Button>
        </div>
      )}

      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
          {loading ? (
            Array(6).fill(0).map((_, i) => (
              <Card key={i} className="rounded-2xl border-none overflow-hidden bg-transparent">
                <Skeleton className="h-48 w-full" />
                <CardContent className="p-0 pt-4">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-4" />
                  <div className="flex gap-2 mb-3">
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : tours.length > 0 ? (
            tours.map(tour => (
              <TourCard 
                key={tour.id} 
                tour={tour} 
                onTourDeleted={handleTourDeleted} 
              />
            ))
          ) : (
            <div className="col-span-full py-20 text-center">
              <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                <Search size={40} className="text-muted-foreground" />
              </div>
              <h3 className="text-xl font-medium text-foreground mb-2">{t('tours.noToursFound')}</h3>
              <p className="text-muted-foreground max-w-md mx-auto mb-6">
                {t('tours.noToursFoundDesc')}
              </p>
              <Button onClick={clearAllFilters} variant="outline">{t('common.clearAll')}</Button>
            </div>
          )}
        </div>
      ) : (
        <MapView tours={tours} loading={loading} />
      )}
    </div>
  );
}

function FiltersPanel({ filters, applyFilters, clearAllFilters }) {
  const { t } = useLanguage();
  const [localFilters, setLocalFilters] = useState(filters);
  
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);
  
  const handleApply = () => {
    applyFilters(localFilters);
  };
  
  const toggleArrayFilter = (key, value) => {
    setLocalFilters(prev => {
      const current = [...prev[key]];
      const index = current.indexOf(value);
      if (index >= 0) {
        current.splice(index, 1);
      } else {
        current.push(value);
      }
      return { ...prev, [key]: current };
    });
  };

  const updateFilter = (key, value) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };
  
  return (
    <ScrollArea className="h-full pr-4">
      <SheetHeader className="mb-6">
        <SheetTitle>{t('common.filters')}</SheetTitle>
        <SheetDescription>{t('tours.refineSearch')}</SheetDescription>
      </SheetHeader>
      
      <div className="space-y-8">
        <div>
          <h3 className="text-sm font-semibold mb-3">{t('tours.filterTheme')}</h3>
          <div className="flex flex-wrap gap-2">
            {["cultural", "historical", "nature", "culinary", "adventure", "architectural", "art"].map(theme => (
              <Badge
                key={theme}
                variant={localFilters.theme.includes(theme) ? "default" : "outline"}
                className={`px-3 py-1.5 cursor-pointer transition-colors text-sm font-medium ${
                  localFilters.theme.includes(theme) ? "bg-primary text-primary-foreground border-transparent" : "border-border hover:bg-muted"
                }`}
                onClick={() => toggleArrayFilter("theme", theme)}
              >
                {t(`themes.${theme}`)}
              </Badge>
            ))}
          </div>
        </div>
        
        <div>
          <h3 className="text-sm font-semibold mb-3">{t('tours.filterTransport')}</h3>
          <div className="grid grid-cols-2 gap-3">
            {["walking", "driving", "cycling", "public_transport", "mixed"].map(transport => (
              <Label
                key={transport}
                className={`px-3 py-2 border rounded-lg flex items-center gap-3 cursor-pointer transition-colors ${
                  localFilters.transportation.includes(transport) 
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:bg-muted"
                }`}
              >
                <div className={`w-5 h-5 rounded-md flex items-center justify-center border-2 ${
                  localFilters.transportation.includes(transport)
                    ? "bg-primary border-primary"
                    : "border-muted-foreground/50"
                }`}>
                  {localFilters.transportation.includes(transport) && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
                </div>
                <span className="font-medium">{t(`transport.${transport}`)}</span>
              </Label>
            ))}
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold">{t('tours.filterDuration')}</h3>
            <p className="text-sm text-foreground font-medium">
              {Math.floor(localFilters.duration[0] / 60)}h - {Math.floor(localFilters.duration[1] / 60)}h
            </p>
          </div>
          <Slider value={localFilters.duration} onValueChange={(v) => updateFilter('duration', v)} max={360} step={30} className="mb-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0h</span><span>6h</span>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-3">{t('tours.filterDifficulty')}</h3>
          <div className="flex flex-wrap gap-2">
            {["easy", "moderate", "challenging"].map(difficulty => (
              <Badge
                key={difficulty}
                variant={localFilters.difficulty.includes(difficulty) ? "default" : "outline"}
                className={`px-3 py-1.5 cursor-pointer transition-colors text-sm font-medium ${
                  localFilters.difficulty.includes(difficulty) ? "bg-primary text-primary-foreground border-transparent" : "border-border hover:bg-muted"
                }`}
                onClick={() => toggleArrayFilter("difficulty", difficulty)}
              >
                {t(`difficulty.${difficulty}`)}
              </Badge>
            ))}
          </div>
        </div>
        
      </div>
      
      <SheetFooter className="mt-8 pt-4 border-t gap-2 sm:space-x-0">
        <Button variant="outline" onClick={clearAllFilters} className="w-full sm:w-auto">
          {t('common.resetAll')}
        </Button>
        <SheetClose asChild>
          <Button onClick={handleApply} className="w-full sm:w-auto bg-primary hover:bg-primary/90">
            {t('common.applyFilters')}
          </Button>
        </SheetClose>
      </SheetFooter>
    </ScrollArea>
  );
}