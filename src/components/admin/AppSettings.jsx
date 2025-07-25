import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  Palette, 
  Globe, 
  Settings, 
  Save, 
  RefreshCw,
  Image as ImageIcon,
  Type,
  Mail,
  Phone,
  MapPin,
  Clock,
  Users,
  Shield,
  Bell
} from 'lucide-react';
import { useLanguage } from '@/components/i18n/LanguageContext';
import { UploadFile } from '@/api/integrations';
import { AppSettings as AppSettingsEntity } from '@/api/entities';
import { useAppSettings } from '@/contexts/AppSettingsContext';

const AppSettings = () => {
  const { t } = useLanguage();
  const { settings: contextSettings, updateSettings } = useAppSettings();
  const [settings, setSettings] = useState({
    // Branding
    appName: 'Base44 APP',
    logoUrl: '',
    primaryColor: '#f97316', // Orange
    secondaryColor: '#64748b', // Slate
    themeMode: 'light', // light, dark, auto
    
    // Company Information
    companyName: 'TurbaTours',
    companyDescription: 'Professional Audio Tour Platform',
    contactEmail: 'info@turbatours.com',
    contactPhone: '+1 (555) 123-4567',
    address: '123 Tourism Street, City, Country',
    website: 'https://turbatours.com',
    
    // App Configuration
    defaultLanguage: 'English',
    enableRegistration: true,
    enableGuestMode: false,
    maxToursPerUser: 50,
    maxStopsPerTour: 100,
    
    // Features
    enableAudioRecording: true,
    enableLiveTracking: true,
    enableNotifications: true,
    enableAnalytics: true,
    enableMultiLanguage: true,
    
    // Tour Settings
    defaultTourDuration: 60, // minutes
    maxGroupSize: 25,
    enableTourRating: true,
    enableTourComments: true,
    
    // Driver Settings
    enableDriverTracking: true,
    trackingInterval: 5, // seconds
    enableDriverChat: true,
    
    // System Settings
    sessionTimeout: 30, // minutes
    enableMaintenance: false,
    maintenanceMessage: 'System is under maintenance. Please try again later.',
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [logoFile, setLogoFile] = useState(null);

  // Load settings on component mount and when context changes
  useEffect(() => {
    if (contextSettings) {
      setSettings(contextSettings);
    } else {
      loadSettings();
    }
  }, [contextSettings]);

  const loadSettings = async () => {
    try {
      const savedSettings = await AppSettingsEntity.get();
      if (savedSettings) {
        setSettings(savedSettings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      const result = await updateSettings(settings);
      if (result.success) {
        console.log('Settings saved and applied:', settings);
        setMessage({ type: 'success', text: 'Settings saved successfully! Changes applied across all pages.' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        throw new Error(result.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
    } finally {
      setLoading(false);
    }
  };



  const handleLogoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select a valid image file.' });
      return;
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      setMessage({ type: 'error', text: 'Image size must be less than 2MB.' });
      return;
    }

    try {
      setLoading(true);
      const uploadedFile = await UploadFile(file, 'logos');
      setSettings({ ...settings, logoUrl: uploadedFile.url });
      setMessage({ type: 'success', text: 'Logo uploaded successfully!' });
    } catch (error) {
      console.error('Error uploading logo:', error);
      setMessage({ type: 'error', text: 'Failed to upload logo. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const resetToDefaults = () => {
    if (confirm('Are you sure you want to reset all settings to default values?')) {
      setSettings({
        appName: 'Base44 APP',
        logoUrl: '',
        primaryColor: '#3b82f6', // Blue for primary actions
        secondaryColor: '#6b7280', // Neutral gray for secondary elements
        themeMode: 'light',
        companyName: 'TurbaTours',
        companyDescription: 'Professional Audio Tour Platform',
        contactEmail: 'info@turbatours.com',
        contactPhone: '+1 (555) 123-4567',
        address: '123 Tourism Street, City, Country',
        website: 'https://turbatours.com',
        defaultLanguage: 'English',
        enableRegistration: true,
        enableGuestMode: false,
        maxToursPerUser: 50,
        maxStopsPerTour: 100,
        enableAudioRecording: true,
        enableLiveTracking: true,
        enableNotifications: true,
        enableAnalytics: true,
        enableMultiLanguage: true,
        defaultTourDuration: 60,
        maxGroupSize: 25,
        enableTourRating: true,
        enableTourComments: true,
        enableDriverTracking: true,
        trackingInterval: 5,
        enableDriverChat: true,
        sessionTimeout: 30,
        enableMaintenance: false,
        maintenanceMessage: 'System is under maintenance. Please try again later.',
      });
    }
  };

  const testThemeChange = (theme) => {
    console.log('Testing theme change to:', theme);
    const newSettings = { ...settings, themeMode: theme };
    setSettings(newSettings);
    
    // Force immediate application
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    if (theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.add(prefersDark ? 'dark' : 'light');
    } else {
      root.classList.add(theme);
    }
    
    console.log('HTML classes after manual change:', root.className);
  };

  return (
    <div className="space-y-6">
      {message.text && (
        <Alert className={message.type === 'error' ? 'border-red-500 bg-red-50' : 'border-green-500 bg-green-50'}>
          <AlertDescription className={message.type === 'error' ? 'text-red-700' : 'text-green-700'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {/* Branding Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Branding & Appearance
          </CardTitle>
          <CardDescription>
            Customize your app's visual identity and branding
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="appName">App Name</Label>
              <Input
                id="appName"
                value={settings.appName}
                onChange={(e) => setSettings({ ...settings, appName: e.target.value })}
                placeholder="Enter app name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={settings.companyName}
                onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                placeholder="Enter company name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyDescription">Company Description</Label>
            <Textarea
              id="companyDescription"
              value={settings.companyDescription}
              onChange={(e) => setSettings({ ...settings, companyDescription: e.target.value })}
              placeholder="Brief description of your company"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="logo">Logo Upload</Label>
            <div className="flex items-center gap-4">
              {settings.logoUrl && (
                <img 
                  src={settings.logoUrl} 
                  alt="Current logo" 
                  className="h-12 w-12 object-contain border rounded"
                />
              )}
              <div className="flex-1">
                <Input
                  id="logo"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="cursor-pointer"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Upload a logo image (max 2MB, recommended: 200x50px)
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primaryColor">Primary Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="primaryColor"
                  type="color"
                  value={settings.primaryColor}
                  onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                  className="w-16 h-10 p-1 border rounded cursor-pointer"
                />
                <Input
                  value={settings.primaryColor}
                  onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                  placeholder="#f97316"
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="secondaryColor">Secondary Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="secondaryColor"
                  type="color"
                  value={settings.secondaryColor}
                  onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                  className="w-16 h-10 p-1 border rounded cursor-pointer"
                />
                <Input
                  value={settings.secondaryColor}
                  onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                  placeholder="#64748b"
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          {/* Color Preview */}
          <div className="space-y-2">
            <Label>Color Preview</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-center h-12 bg-primary text-primary-foreground rounded font-medium">
                  Primary Color
                </div>
                <div className="text-xs text-center text-muted-foreground">
                  {settings.primaryColor}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-center h-12 bg-secondary text-secondary-foreground rounded font-medium">
                  Secondary Color
                </div>
                <div className="text-xs text-center text-muted-foreground">
                  {settings.secondaryColor}
                </div>
              </div>
            </div>
          </div>

          {/* Theme Test */}
          <div className="space-y-2">
            <Label>Theme Test</Label>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 bg-background border rounded text-center">
                <div className="text-foreground text-sm">Background</div>
              </div>
              <div className="p-3 bg-card border rounded text-center">
                <div className="text-card-foreground text-sm">Card</div>
              </div>
              <div className="p-3 bg-muted border rounded text-center">
                <div className="text-muted-foreground text-sm">Muted</div>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              Current HTML classes: <code>{typeof document !== 'undefined' ? document.documentElement.className : 'N/A'}</code>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="themeMode">Theme Mode</Label>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="light"
                  name="themeMode"
                  value="light"
                  checked={settings.themeMode === 'light'}
                  onChange={(e) => setSettings({ ...settings, themeMode: e.target.value })}
                  className="w-4 h-4 text-primary"
                />
                <Label htmlFor="light" className="text-sm">☀️ Light</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="dark"
                  name="themeMode"
                  value="dark"
                  checked={settings.themeMode === 'dark'}
                  onChange={(e) => setSettings({ ...settings, themeMode: e.target.value })}
                  className="w-4 h-4 text-primary"
                />
                <Label htmlFor="dark" className="text-sm">🌙 Dark</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="auto"
                  name="themeMode"
                  value="auto"
                  checked={settings.themeMode === 'auto'}
                  onChange={(e) => setSettings({ ...settings, themeMode: e.target.value })}
                  className="w-4 h-4 text-primary"
                />
                <Label htmlFor="auto" className="text-sm">🔄 Auto</Label>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              Auto mode follows your system preference
            </p>
            
            {/* Test buttons for immediate theme switching */}
            <div className="flex gap-2 mt-2">
              <Button 
                type="button" 
                size="sm" 
                variant="outline" 
                onClick={() => testThemeChange('light')}
              >
                Test Light
              </Button>
              <Button 
                type="button" 
                size="sm" 
                variant="outline" 
                onClick={() => testThemeChange('dark')}
              >
                Test Dark
              </Button>
              <Button 
                type="button" 
                size="sm" 
                variant="outline" 
                onClick={() => testThemeChange('auto')}
              >
                Test Auto
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>      {
/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Contact Information
          </CardTitle>
          <CardDescription>
            Configure your company's contact details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contactEmail">Contact Email</Label>
              <Input
                id="contactEmail"
                type="email"
                value={settings.contactEmail}
                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                placeholder="info@company.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactPhone">Contact Phone</Label>
              <Input
                id="contactPhone"
                value={settings.contactPhone}
                onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={settings.address}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              placeholder="123 Business Street, City, Country"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="url"
              value={settings.website}
              onChange={(e) => setSettings({ ...settings, website: e.target.value })}
              placeholder="https://company.com"
            />
          </div>
        </CardContent>
      </Card>

      {/* App Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            App Configuration
          </CardTitle>
          <CardDescription>
            Configure general app settings and limits
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxToursPerUser">Max Tours per User</Label>
              <Input
                id="maxToursPerUser"
                type="number"
                value={settings.maxToursPerUser}
                onChange={(e) => setSettings({ ...settings, maxToursPerUser: parseInt(e.target.value) })}
                min="1"
                max="1000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxStopsPerTour">Max Stops per Tour</Label>
              <Input
                id="maxStopsPerTour"
                type="number"
                value={settings.maxStopsPerTour}
                onChange={(e) => setSettings({ ...settings, maxStopsPerTour: parseInt(e.target.value) })}
                min="1"
                max="500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
              <Input
                id="sessionTimeout"
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) })}
                min="5"
                max="480"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable User Registration</Label>
                <p className="text-sm text-gray-500">Allow new users to register accounts</p>
              </div>
              <Switch
                checked={settings.enableRegistration}
                onCheckedChange={(checked) => setSettings({ ...settings, enableRegistration: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Guest Mode</Label>
                <p className="text-sm text-gray-500">Allow users to browse without registration</p>
              </div>
              <Switch
                checked={settings.enableGuestMode}
                onCheckedChange={(checked) => setSettings({ ...settings, enableGuestMode: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Multi-language Support</Label>
                <p className="text-sm text-gray-500">Enable multiple language options</p>
              </div>
              <Switch
                checked={settings.enableMultiLanguage}
                onCheckedChange={(checked) => setSettings({ ...settings, enableMultiLanguage: checked })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Feature Settings
          </CardTitle>
          <CardDescription>
            Enable or disable specific app features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Audio Recording</Label>
                  <p className="text-sm text-gray-500">Allow users to record audio</p>
                </div>
                <Switch
                  checked={settings.enableAudioRecording}
                  onCheckedChange={(checked) => setSettings({ ...settings, enableAudioRecording: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Live Tracking</Label>
                  <p className="text-sm text-gray-500">Real-time location tracking</p>
                </div>
                <Switch
                  checked={settings.enableLiveTracking}
                  onCheckedChange={(checked) => setSettings({ ...settings, enableLiveTracking: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Push Notifications</Label>
                  <p className="text-sm text-gray-500">Send notifications to users</p>
                </div>
                <Switch
                  checked={settings.enableNotifications}
                  onCheckedChange={(checked) => setSettings({ ...settings, enableNotifications: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Analytics</Label>
                  <p className="text-sm text-gray-500">Collect usage analytics</p>
                </div>
                <Switch
                  checked={settings.enableAnalytics}
                  onCheckedChange={(checked) => setSettings({ ...settings, enableAnalytics: checked })}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Tour Ratings</Label>
                  <p className="text-sm text-gray-500">Allow users to rate tours</p>
                </div>
                <Switch
                  checked={settings.enableTourRating}
                  onCheckedChange={(checked) => setSettings({ ...settings, enableTourRating: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Tour Comments</Label>
                  <p className="text-sm text-gray-500">Allow comments on tours</p>
                </div>
                <Switch
                  checked={settings.enableTourComments}
                  onCheckedChange={(checked) => setSettings({ ...settings, enableTourComments: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Driver Tracking</Label>
                  <p className="text-sm text-gray-500">Track driver locations</p>
                </div>
                <Switch
                  checked={settings.enableDriverTracking}
                  onCheckedChange={(checked) => setSettings({ ...settings, enableDriverTracking: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Driver Chat</Label>
                  <p className="text-sm text-gray-500">Enable driver communication</p>
                </div>
                <Switch
                  checked={settings.enableDriverChat}
                  onCheckedChange={(checked) => setSettings({ ...settings, enableDriverChat: checked })}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tour Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Tour Settings
          </CardTitle>
          <CardDescription>
            Configure default tour parameters
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="defaultTourDuration">Default Duration (minutes)</Label>
              <Input
                id="defaultTourDuration"
                type="number"
                value={settings.defaultTourDuration}
                onChange={(e) => setSettings({ ...settings, defaultTourDuration: parseInt(e.target.value) })}
                min="15"
                max="480"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxGroupSize">Max Group Size</Label>
              <Input
                id="maxGroupSize"
                type="number"
                value={settings.maxGroupSize}
                onChange={(e) => setSettings({ ...settings, maxGroupSize: parseInt(e.target.value) })}
                min="1"
                max="100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="trackingInterval">Tracking Interval (seconds)</Label>
              <Input
                id="trackingInterval"
                type="number"
                value={settings.trackingInterval}
                onChange={(e) => setSettings({ ...settings, trackingInterval: parseInt(e.target.value) })}
                min="1"
                max="60"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Maintenance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            System Maintenance
          </CardTitle>
          <CardDescription>
            Configure maintenance mode and system messages
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Maintenance Mode</Label>
              <p className="text-sm text-gray-500">Enable to show maintenance message to users</p>
            </div>
            <Switch
              checked={settings.enableMaintenance}
              onCheckedChange={(checked) => setSettings({ ...settings, enableMaintenance: checked })}
            />
          </div>

          {settings.enableMaintenance && (
            <div className="space-y-2">
              <Label htmlFor="maintenanceMessage">Maintenance Message</Label>
              <Textarea
                id="maintenanceMessage"
                value={settings.maintenanceMessage}
                onChange={(e) => setSettings({ ...settings, maintenanceMessage: e.target.value })}
                placeholder="System is under maintenance. Please try again later."
                rows={3}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-6 border-t">
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={resetToDefaults}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Reset to Defaults
          </Button>
          
          <Button
            variant="outline"
            onClick={async () => {
              if (confirm('Reset colors to neutral theme? This will clear cached settings.')) {
                try {
                  const { AppSettings: AppSettingsEntity } = await import('@/api/entities');
                  const result = await AppSettingsEntity.resetToDefaults();
                  if (result.success) {
                    setSettings(result.settings);
                    setMessage({ type: 'success', text: 'Colors reset to neutral theme!' });
                    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
                  }
                } catch (error) {
                  console.error('Error resetting colors:', error);
                  setMessage({ type: 'error', text: 'Failed to reset colors.' });
                }
              }
            }}
            className="flex items-center gap-2"
          >
            <Palette className="h-4 w-4" />
            Reset Colors
          </Button>
        </div>

        <Button
          onClick={handleSaveSettings}
          disabled={loading}
          className="flex items-center gap-2"
        >
          {loading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {loading ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
};

export default AppSettings;