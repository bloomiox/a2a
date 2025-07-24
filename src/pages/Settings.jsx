import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/api/entities";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Bell,
  Volume2,
  Download,
  Wifi,
  Moon,
  Sun,
  LogOut,
  Settings2,
  AlertTriangle,
  Info,
  HelpCircle,
  LifeBuoy,
  FileText,
  ExternalLink
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from "@/components/ui/dialog";

export default function Settings() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState({
    notifications: true,
    autoDownloadOnWifi: true,
    darkMode: false,
    highQualityAudio: false,
    autoAdjustVolume: true,
    autoPlayNextStop: true,
    distanceUnits: "metric",
    dataUsage: "balanced"
  });
  const [loading, setLoading] = useState(true);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userData = await User.me();
        setUser(userData);
        
        // Load user settings
        setSettings(prev => ({
          ...prev,
          autoAdjustVolume: userData.auto_volume_adjust !== false,
          // In a full app, we would load more settings from the user entity
        }));
      } catch (error) {
        console.error("Error loading user data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadUserData();
  }, []);
  
  const handleSettingChange = async (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    
    // For auto volume adjustment, update the user record
    if (key === "autoAdjustVolume") {
      try {
        await User.updateMyUserData({
          auto_volume_adjust: value
        });
      } catch (error) {
        console.error("Error updating user settings:", error);
      }
    }
    
    // Other settings could be saved to the user record in a similar way
  };
  
  const handleLogout = async () => {
    try {
      await User.logout();
      navigate(createPageUrl("Login"));
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Skeleton className="h-8 w-40 mb-2" />
        <Skeleton className="h-4 w-64 mb-8" />
        
        <div className="space-y-6">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-6 pb-20">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500">Configure your app preferences</p>
      </div>
      
      <div className="space-y-6 max-w-3xl mx-auto">
        {/* Audio Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Volume2 className="h-5 w-5 text-indigo-600" />
              Audio Settings
            </CardTitle>
            <CardDescription>
              Configure how audio is played during tours
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto-adjust-volume" className="font-medium">
                  Auto-adjust volume
                </Label>
                <p className="text-sm text-gray-500">
                  Automatically adjust volume based on ambient noise
                </p>
              </div>
              <Switch
                id="auto-adjust-volume"
                checked={settings.autoAdjustVolume}
                onCheckedChange={(checked) => handleSettingChange("autoAdjustVolume", checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="high-quality" className="font-medium">
                  High-quality audio
                </Label>
                <p className="text-sm text-gray-500">
                  Stream higher quality audio (uses more data)
                </p>
              </div>
              <Switch
                id="high-quality"
                checked={settings.highQualityAudio}
                onCheckedChange={(checked) => handleSettingChange("highQualityAudio", checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto-play-next" className="font-medium">
                  Auto-play next stop
                </Label>
                <p className="text-sm text-gray-500">
                  Automatically play the next stop's audio when arriving
                </p>
              </div>
              <Switch
                id="auto-play-next"
                checked={settings.autoPlayNextStop}
                onCheckedChange={(checked) => handleSettingChange("autoPlayNextStop", checked)}
              />
            </div>
          </CardContent>
        </Card>
        
        {/* Data & Offline Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-indigo-600" />
              Data & Offline Access
            </CardTitle>
            <CardDescription>
              Manage how the app uses your data connection
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto-download" className="font-medium">
                  Auto-download on Wi-Fi
                </Label>
                <p className="text-sm text-gray-500">
                  Automatically download saved tours when connected to Wi-Fi
                </p>
              </div>
              <Switch
                id="auto-download"
                checked={settings.autoDownloadOnWifi}
                onCheckedChange={(checked) => handleSettingChange("autoDownloadOnWifi", checked)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="data-usage" className="font-medium">
                Data Usage
              </Label>
              <Select
                value={settings.dataUsage}
                onValueChange={(value) => handleSettingChange("dataUsage", value)}
              >
                <SelectTrigger id="data-usage">
                  <SelectValue placeholder="Select data usage preference" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low (Reduced quality, saves data)</SelectItem>
                  <SelectItem value="balanced">Balanced (Recommended)</SelectItem>
                  <SelectItem value="high">High (Best quality, uses more data)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
        
        {/* Display Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-indigo-600" />
              Display Settings
            </CardTitle>
            <CardDescription>
              Customize the app appearance and behavior
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="dark-mode" className="font-medium">
                  Dark Mode
                </Label>
                <p className="text-sm text-gray-500">
                  Use dark theme for the application
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Sun size={16} className="text-gray-400" />
                <Switch
                  id="dark-mode"
                  checked={settings.darkMode}
                  onCheckedChange={(checked) => handleSettingChange("darkMode", checked)}
                />
                <Moon size={16} className="text-gray-400" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="distance-units" className="font-medium">
                Distance Units
              </Label>
              <Select
                value={settings.distanceUnits}
                onValueChange={(value) => handleSettingChange("distanceUnits", value)}
              >
                <SelectTrigger id="distance-units">
                  <SelectValue placeholder="Select units" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="metric">Metric (kilometers/meters)</SelectItem>
                  <SelectItem value="imperial">Imperial (miles/feet)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
        
        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-indigo-600" />
              Notifications
            </CardTitle>
            <CardDescription>
              Manage notification preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notifications" className="font-medium">
                  Enable Notifications
                </Label>
                <p className="text-sm text-gray-500">
                  Get notified about tour updates and nearby attractions
                </p>
              </div>
              <Switch
                id="notifications"
                checked={settings.notifications}
                onCheckedChange={(checked) => handleSettingChange("notifications", checked)}
              />
            </div>
          </CardContent>
        </Card>
        
        {/* Help & Support */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-indigo-600" />
              Help & Support
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              <Button variant="ghost" className="w-full justify-start p-4 h-auto text-left">
                <LifeBuoy className="h-5 w-5 mr-3 text-gray-500" />
                <div>
                  <p className="font-medium">Contact Support</p>
                  <p className="text-sm text-gray-500">Get help with any issues</p>
                </div>
              </Button>
              
              <Button variant="ghost" className="w-full justify-start p-4 h-auto text-left">
                <Info className="h-5 w-5 mr-3 text-gray-500" />
                <div>
                  <p className="font-medium">About AudioTour</p>
                  <p className="text-sm text-gray-500">Version 1.0.0</p>
                </div>
              </Button>
              
              <Button variant="ghost" className="w-full justify-start p-4 h-auto text-left">
                <FileText className="h-5 w-5 mr-3 text-gray-500" />
                <div className="flex items-center gap-1">
                  <div>
                    <p className="font-medium">Terms & Privacy Policy</p>
                    <p className="text-sm text-gray-500">Our terms of service and privacy policy</p>
                  </div>
                  <ExternalLink size={14} className="ml-1 text-gray-400" />
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Account Actions */}
        <Card className="border-red-100">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Account Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              variant="destructive" 
              className="w-full"
              onClick={() => setLogoutDialogOpen(true)}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log Out
            </Button>
          </CardContent>
        </Card>
      </div>
      
      {/* Logout Confirmation Dialog */}
      <Dialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Out</DialogTitle>
            <DialogDescription>
              Are you sure you want to log out of your account?
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setLogoutDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleLogout}>
              Log Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}