
import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Tour } from "@/api/entities";
import { UserProgress } from "@/api/entities";
import { User } from "@/api/entities";
import { UploadFile } from "@/api/integrations";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User as UserIcon,
  Settings,
  History,
  BookmarkCheck,
  Download,
  Play,
  Clock,
  Edit,
  MapPin,
  UploadCloud,
  Camera,
  X,
  AlertCircle,
  CheckCircle // Added CheckCircle
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress"; // Added Progress

import TourCard from "../components/tours/TourCard";
import AccessibilityPicker from "../components/create/AccessibilityPicker";
import { useLanguage } from '@/components/i18n/LanguageContext';
import { format } from 'date-fns'; // Added format from date-fns

export default function Profile() {
  const { t } = useLanguage();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialTab = queryParams.get("tab") || "profile";
  
  const [activeTab, setActiveTab] = useState(initialTab);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [createdTours, setCreatedTours] = useState([]);
  const [savedTours, setSavedTours] = useState([]);
  const [inProgressTours, setInProgressTours] = useState([]);
  const [completedTours, setCompletedTours] = useState([]);
  const [downloadedTours, setDownloadedTours] = useState([]);
  
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    full_name: "",
    preferred_language: "English",
    preferred_transportation: "walking",
    auto_volume_adjust: true,
    accessibility_needs: []
  });
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const [achievements, setAchievements] = useState([]);
  const [stats, setStats] = useState({
    toursCreated: 0,
    toursCompleted: 0,
    totalDistance: 0,
    totalDuration: 0,
    streakDays: 0,
    favoriteTheme: 'cultural'
  });
  
  const navigate = useNavigate();
  
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true);
        
        // Load user data
        const userData = await User.me();
        setUser(userData);
        
        // Initialize profile form with user data
        setProfileForm({
          full_name: userData.full_name || "",
          preferred_language: userData.preferred_language || "English",
          preferred_transportation: userData.preferred_transportation || "walking",
          auto_volume_adjust: userData.auto_volume_adjust !== false,
          accessibility_needs: userData.accessibility_needs || []
        });
        
        // Set profile image if exists
        if (userData.profile_image) {
          setProfileImagePreview(userData.profile_image);
        }
        
        // Load user's tours
        const userTours = await Tour.filter({ created_by: userData.email });
        setCreatedTours(userTours);
        
        // Load saved tours
        if (userData.saved_tours && userData.saved_tours.length > 0) {
          const savedToursData = await Tour.filter({ id: { $in: userData.saved_tours } });
          setSavedTours(savedToursData);
        }
        
        // Load downloaded tours
        if (userData.downloaded_tours && userData.downloaded_tours.length > 0) {
          const downloadedToursData = await Tour.filter({ id: { $in: userData.downloaded_tours } });
          setDownloadedTours(downloadedToursData);
        }
        
        // Load progress tours
        const userProgress = await UserProgress.filter({ user_id: userData.id });
        
        const completedLocal = []; // Local array to hold completed tours for stat calculation
        const inProgressLocal = []; // Local array to hold in-progress tours for stat calculation

        if (userProgress.length > 0) {
          // Get tours for progress items
          const tourIds = userProgress.map(p => p.tour_id);
          const progressTours = await Tour.filter({ id: { $in: tourIds } });
          
          // Combine tour data with progress data
          const progressWithTours = progressTours.map(tour => {
            const progress = userProgress.find(p => p.tour_id === tour.id);
            return { ...tour, progress };
          });
          
          // Separate in-progress from completed
          for (const tourWithProgress of progressWithTours) {
            const completedStops = tourWithProgress.progress?.completed_stops?.length || 0;
            // Default fallback for total stops, as per outline
            // In a real app, you'd fetch stops for each tour or store total stops in tour entity
            const totalStops = 10; 
            
            if (completedStops > 0 && completedStops >= totalStops) {
              completedLocal.push(tourWithProgress);
            } else if (completedStops > 0) {
              inProgressLocal.push(tourWithProgress);
            }
          }
          
          setInProgressTours(inProgressLocal);
          setCompletedTours(completedLocal);
        }
        
        // Calculate user stats using the locally determined completed and created tours
        const totalCompleted = completedLocal.length;
        const totalDistance = completedLocal.reduce((acc, tour) => acc + (tour.distance || 0), 0);
        const totalDuration = completedLocal.reduce((acc, tour) => acc + (tour.duration || 0), 0);
        
        // Calculate theme preference
        const themeCount = {};
        userTours.forEach(tour => {
          if (tour.theme) {
            themeCount[tour.theme] = (themeCount[tour.theme] || 0) + 1;
          }
        });
        const favoriteTheme = Object.keys(themeCount).length > 0 ? 
          Object.keys(themeCount).reduce((a, b) => themeCount[a] > themeCount[b] ? a : b) : 
          'cultural';
        
        setStats({
          toursCreated: userTours.length,
          toursCompleted: totalCompleted,
          totalDistance: Math.round(totalDistance * 100) / 100, // Keep two decimal places
          totalDuration: Math.round(totalDuration / 3600), // Convert seconds to hours
          streakDays: Math.min(7, totalCompleted), // Mock streak calculation
          favoriteTheme
        });
        
        // Generate achievements
        const userAchievements = [];
        
        if (userTours.length >= 1) {
          userAchievements.push({
            id: 'first_tour',
            title: t('profile.achievements.firstTour'),
            description: t('profile.achievements.firstTourDesc'),
            icon: '🎉',
            unlocked: true,
            date: userTours[0]?.created_at // Assuming created_at is available
          });
        }
        
        if (userTours.length >= 5) {
          userAchievements.push({
            id: 'tour_creator',
            title: t('profile.achievements.tourCreator'),
            description: t('profile.achievements.tourCreatorDesc'),
            icon: '🏗️',
            unlocked: true
          });
        }
        
        if (totalCompleted >= 1) {
          userAchievements.push({
            id: 'explorer',
            title: t('profile.achievements.explorer'),
            description: t('profile.achievements.explorerDesc'),
            icon: '🗺️',
            unlocked: true
          });
        }
        
        if (totalDistance >= 10) {
          userAchievements.push({
            id: 'wanderer',
            title: t('profile.achievements.wanderer'),
            description: t('profile.achievements.wandererDesc'),
            icon: '🚶',
            unlocked: true
          });
        }
        
        // Locked achievements (future goals)
        if (userTours.length < 10) {
          userAchievements.push({
            id: 'prolific_creator',
            title: t('profile.achievements.prolificCreator'),
            description: t('profile.achievements.prolificCreatorDesc'),
            icon: '🏭',
            unlocked: false,
            progress: userTours.length,
            target: 10
          });
        }
        
        setAchievements(userAchievements);
        
      } catch (error) {
        console.error("Error loading user data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadUserData();
  }, [t]); // Added t to dependency array
  
  const handleProfileFormChange = (field, value) => {
    setProfileForm(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setProfileImageFile(file);
    setProfileImagePreview(URL.createObjectURL(file));
  };
  
  const handleSaveProfile = async () => {
    try {
      setIsUploadingImage(true);
      
      // Upload profile image if changed
      let profileImageUrl = user.profile_image;
      if (profileImageFile) {
        const { file_url } = await UploadFile({ file: profileImageFile });
        profileImageUrl = file_url;
      }
      
      // Update user profile
      await User.updateMyUserData({
        ...profileForm,
        profile_image: profileImageUrl
      });
      
      // Update local user state
      setUser(prev => ({
        ...prev,
        ...profileForm,
        profile_image: profileImageUrl
      }));
      
      setIsEditProfileOpen(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setIsUploadingImage(false);
    }
  };
  
    // Add a handler for tour deletion
    const handleTourDeleted = (tourId) => {
      // Update createdTours state to remove the deleted tour
      setCreatedTours(prev => prev.filter(tour => tour.id !== tourId));
      
      // Also update other lists that might contain this tour
      setSavedTours(prev => prev.filter(tour => tour.id !== tourId));
      setDownloadedTours(prev => prev.filter(tour => tour.id !== tourId));
      setInProgressTours(prev => prev.filter(tour => tour.id !== tourId));
      setCompletedTours(prev => prev.filter(tour => tour.id !== tourId));
    };

  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center mb-8">
          <Skeleton className="h-24 w-24 rounded-full" />
          <Skeleton className="h-6 w-40 mt-4" />
          <Skeleton className="h-4 w-32 mt-2" />
        </div>
        
        <Skeleton className="h-10 w-full max-w-md mx-auto rounded-lg mb-8" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-6">
      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8">
        <div className="relative">
          <Avatar className="h-24 w-24 border-2 border-white shadow-md">
            <AvatarImage src={user.profile_image} alt={user.full_name} />
            <AvatarFallback className="bg-indigo-100 text-indigo-600 text-xl">
              {user.full_name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <Button
            variant="outline"
            size="icon"
            className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-white shadow-md"
            onClick={() => setIsEditProfileOpen(true)}
          >
            <Edit size={14} />
          </Button>
        </div>
        
        <div className="text-center sm:text-left">
          <h1 className="text-2xl font-semibold">{user.full_name}</h1>
          <p className="text-gray-500">{user.email}</p>
          
          <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3">
            {user.preferred_transportation && (
              <Badge variant="outline" className="capitalize">
                {t(`transportation.${user.preferred_transportation}`)}
              </Badge>
            )}
            {user.preferred_language && (
              <Badge variant="outline">
                {user.preferred_language}
              </Badge>
            )}
            {user.accessibility_needs?.length > 0 && (
              <Badge variant="outline">
                {user.accessibility_needs.length} {t('profile.accessibilityNeeds')}
              </Badge>
            )}
          </div>
        </div>
        
        <div className="flex-1 flex justify-end items-start gap-2">
          <Button variant="outline" onClick={() => setIsEditProfileOpen(true)}>
            <Settings className="w-4 h-4 mr-2" />
            {t('profile.editProfile')}
          </Button>
        </div>
      </div>
      
      {/* User Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="text-center p-4">
          <div className="text-2xl font-bold text-indigo-600">{stats.toursCreated}</div>
          <div className="text-sm text-gray-500">{t('profile.stats.toursCreated')}</div>
        </Card>
        <Card className="text-center p-4">
          <div className="text-2xl font-bold text-green-600">{stats.toursCompleted}</div>
          <div className="text-sm text-gray-500">{t('profile.stats.toursCompleted')}</div>
        </Card>
        <Card className="text-center p-4">
          <div className="text-2xl font-bold text-purple-600">{stats.totalDistance}km</div>
          <div className="text-sm text-gray-500">{t('profile.stats.totalDistance')}</div>
        </Card>
        <Card className="text-center p-4">
          <div className="text-2xl font-bold text-amber-600">{stats.totalDuration}{t('profile.stats.hoursAbbr')}</div>
          <div className="text-sm text-gray-500">{t('profile.stats.totalDuration')}</div>
        </Card>
      </div>
      
      {/* Tabs Navigation */}
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="w-full max-w-2xl mx-auto grid grid-cols-5">
          <TabsTrigger value="profile">{t('profile.tabs.created')}</TabsTrigger>
          <TabsTrigger value="progress">{t('profile.tabs.inProgress')}</TabsTrigger>
          <TabsTrigger value="saved">{t('profile.tabs.saved')}</TabsTrigger>
          <TabsTrigger value="completed">{t('profile.tabs.completed')}</TabsTrigger>
          <TabsTrigger value="achievements">{t('profile.tabs.achievements')}</TabsTrigger>
        </TabsList>
        
        {/* Created Tours Tab */}
        <TabsContent value="profile" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">{t('profile.createdTours')}</h2>
            <Link to={createPageUrl("Create")}>
              <Button>{t('tours.createTour')}</Button>
            </Link>
          </div>
          
          {createdTours.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {createdTours.map(tour => (
                <TourCard 
                  key={tour.id} 
                  tour={tour} 
                  onTourDeleted={handleTourDeleted}
                />
              ))}
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <MapPin className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium mb-2">{t('profile.noToursCreated')}</h3>
                <p className="text-gray-500 max-w-md mx-auto mb-6">
                  {t('profile.noToursCreatedDesc')}
                </p>
                <Link to={createPageUrl("Create")}>
                  <Button>{t('profile.createFirstTour')}</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* In Progress Tab */}
        <TabsContent value="progress" className="space-y-6">
          <h2 className="text-xl font-semibold">{t('profile.inProgressTours')}</h2>
          
          {inProgressTours.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {inProgressTours.map(tour => (
                <TourCard 
                  key={tour.id} 
                  tour={tour} 
                  progress={tour.progress ? {
                    completed: tour.progress.completed_stops?.length || 0,
                    total: 10 // Using default fallback for total stops
                  } : null}
                />
              ))}
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <History className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium mb-2">{t('profile.noToursInProgress')}</h3>
                <p className="text-gray-500 max-w-md mx-auto mb-6">
                  {t('profile.noToursInProgressDesc')}
                </p>
                <Link to={createPageUrl("Explore")}>
                  <Button>{t('profile.exploreTours')}</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* Saved Tours Tab */}
        <TabsContent value="saved" className="space-y-6">
          <h2 className="text-xl font-semibold">{t('profile.savedTours')}</h2>
          
          {savedTours.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedTours.map(tour => (
                <TourCard key={tour.id} tour={tour} />
              ))}
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <BookmarkCheck className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium mb-2">{t('profile.noSavedTours')}</h3>
                <p className="text-gray-500 max-w-md mx-auto mb-6">
                  {t('profile.noSavedToursDesc')}
                </p>
                <Link to={createPageUrl("Explore")}>
                  <Button>{t('profile.discoverTours')}</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* Completed Tours Tab */}
        <TabsContent value="completed" className="space-y-6">
          <h2 className="text-xl font-semibold">{t('profile.completedTours')}</h2>
          
          {completedTours.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedTours.map(tour => (
                <TourCard key={tour.id} tour={tour} completed />
              ))}
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <Play className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium mb-2">{t('profile.noCompletedTours')}</h3>
                <p className="text-gray-500 max-w-md mx-auto mb-6">
                  {t('profile.noCompletedToursDesc')}
                </p>
                <Link to={createPageUrl("Explore")}>
                  <Button>{t('profile.findTours')}</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-6">
          <h2 className="text-xl font-semibold">{t('profile.achievements.title')}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievements.map(achievement => (
              <Card key={achievement.id} className={`p-4 ${achievement.unlocked ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-start gap-4">
                  <div className={`text-3xl ${achievement.unlocked ? '' : 'grayscale opacity-50'}`}>
                    {achievement.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-semibold ${achievement.unlocked ? 'text-gray-900' : 'text-gray-500'}`}>
                      {achievement.title}
                    </h3>
                    <p className={`text-sm ${achievement.unlocked ? 'text-gray-600' : 'text-gray-400'}`}>
                      {achievement.description}
                    </p>
                    {achievement.unlocked && achievement.date && (
                      <p className="text-xs text-indigo-600 mt-1">
                        {t('profile.achievements.unlockedOn')} {format(new Date(achievement.date), 'MMM d, yyyy')}
                      </p>
                    )}
                    {!achievement.unlocked && achievement.progress !== undefined && (
                      <div className="mt-2">
                        <div className="text-xs text-gray-500 mb-1">
                          {achievement.progress} / {achievement.target}
                        </div>
                        <Progress value={(achievement.progress / achievement.target) * 100} className="h-2" />
                      </div>
                    )}
                  </div>
                  {achievement.unlocked && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Edit Profile Dialog */}
      <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('profile.editProfile')}</DialogTitle>
            <DialogDescription>
              {t('profile.updateInfo')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Profile Picture */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <Avatar className="h-24 w-24 border-2 border-white shadow-md">
                  {profileImagePreview ? (
                    <AvatarImage src={profileImagePreview} alt={profileForm.full_name} />
                  ) : (
                    <AvatarFallback className="bg-indigo-100 text-indigo-600 text-xl">
                      {profileForm.full_name.charAt(0)}
                    </AvatarFallback>
                  )}
                </Avatar>
                
                <div className="absolute -bottom-2 -right-2 flex gap-1">
                  <Label
                    htmlFor="profile-image"
                    className="h-8 w-8 rounded-full bg-white shadow-md border flex items-center justify-center cursor-pointer"
                  >
                    <Camera size={14} className="text-gray-600" />
                    <Input
                      id="profile-image"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleProfileImageChange}
                    />
                  </Label>
                  
                  {profileImagePreview && (
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-full bg-white shadow-md border"
                      onClick={() => {
                        setProfileImageFile(null);
                        setProfileImagePreview(user.profile_image || "");
                      }}
                    >
                      <X size={14} className="text-gray-600" />
                    </Button>
                  )}
                </div>
              </div>
              
              <p className="text-xs text-gray-500">{t('profile.changePicture')}</p>
            </div>
            
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">{t('profile.fullName')}</Label>
              <Input
                id="name"
                value={profileForm.full_name}
                onChange={(e) => handleProfileFormChange("full_name", e.target.value)}
              />
            </div>
            
            {/* Preferences */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">{t('profile.preferences')}</h3>
              
              <div className="space-y-2">
                <Label htmlFor="language">{t('profile.preferredLanguage')}</Label>
                <Select
                  value={profileForm.preferred_language}
                  onValueChange={(value) => handleProfileFormChange("preferred_language", value)}
                >
                  <SelectTrigger id="language">
                    <SelectValue placeholder={t('profile.selectLanguage')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="English">English</SelectItem>
                    <SelectItem value="Spanish">Spanish</SelectItem>
                    <SelectItem value="French">French</SelectItem>
                    <SelectItem value="German">German</SelectItem>
                    <SelectItem value="Italian">Italian</SelectItem>
                    <SelectItem value="Japanese">Japanese</SelectItem>
                    <SelectItem value="Chinese">Chinese</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="transportation">{t('profile.preferredTransportation')}</Label>
                <Select
                  value={profileForm.preferred_transportation}
                  onValueChange={(value) => handleProfileFormChange("preferred_transportation", value)}
                >
                  <SelectTrigger id="transportation">
                    <SelectValue placeholder={t('profile.selectTransportation')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="walking">Walking</SelectItem>
                    <SelectItem value="driving">Driving</SelectItem>
                    <SelectItem value="cycling">Cycling</SelectItem>
                    <SelectItem value="public_transport">Public Transport</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>{t('profile.accessibilityNeeds')}</Label>
                <AccessibilityPicker
                  selected={profileForm.accessibility_needs}
                  onChange={(value) => handleProfileFormChange("accessibility_needs", value)}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="auto-volume"
                  checked={profileForm.auto_volume_adjust}
                  onCheckedChange={(checked) => handleProfileFormChange("auto_volume_adjust", checked)}
                />
                <Label htmlFor="auto-volume">{t('profile.autoAdjustVolume')}</Label>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditProfileOpen(false)}>
              {t('profile.cancel')}
            </Button>
            <Button 
              onClick={handleSaveProfile}
              disabled={isUploadingImage}
            >
              {isUploadingImage ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-2"></div>
                  {t('profile.saving')}
                </>
              ) : (
                t('profile.saveChanges')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
