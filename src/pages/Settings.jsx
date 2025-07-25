import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/api/entities";
import AppWrapper from '@/components/common/ThemeWrapper';
import AppSettings from '@/components/admin/AppSettings';
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
    <AppWrapper>
      <div className="container mx-auto px-4 py-6 pb-20">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">App Settings</h1>
            <p className="text-gray-500">Configure your app preferences and appearance</p>
          </div>
          <Button variant="outline" onClick={async () => {
            await User.logout();
            navigate(createPageUrl('Landing'));
          }}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
        
        <AppSettings />
      </div>
    </AppWrapper>
  );
}