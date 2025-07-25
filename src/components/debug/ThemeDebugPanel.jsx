import React, { useState, useEffect } from 'react';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ThemeDebugPanel = () => {
  const { settings, updateSettings } = useAppSettings();
  const [domInfo, setDomInfo] = useState({});

  useEffect(() => {
    const updateDomInfo = () => {
      const root = document.documentElement;
      const computedStyle = getComputedStyle(root);
      
      setDomInfo({
        htmlClasses: root.className,
        background: computedStyle.getPropertyValue('--background').trim(),
        foreground: computedStyle.getPropertyValue('--foreground').trim(),
        primary: computedStyle.getPropertyValue('--primary').trim(),
        secondary: computedStyle.getPropertyValue('--secondary').trim(),
        card: computedStyle.getPropertyValue('--card').trim(),
        cardForeground: computedStyle.getPropertyValue('--card-foreground').trim(),
      });
    };

    updateDomInfo();
    
    // Update when settings change
    const interval = setInterval(updateDomInfo, 1000);
    return () => clearInterval(interval);
  }, [settings]);

  const testThemeChange = async (theme) => {
    if (settings) {
      console.log(`Changing theme to: ${theme}`);
      const updatedSettings = { ...settings, themeMode: theme };
      await updateSettings(updatedSettings);
      
      // Force immediate DOM update for testing
      setTimeout(() => {
        const root = document.documentElement;
        root.classList.remove('light', 'dark');
        if (theme === 'auto') {
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          root.classList.add(prefersDark ? 'dark' : 'light');
        } else {
          root.classList.add(theme);
        }
      }, 100);
    }
  };

  if (!settings) return <div>Loading...</div>;

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Theme Debug Panel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold mb-2">Settings</h3>
            <div className="text-sm space-y-1">
              <div>Theme Mode: <code>{settings.themeMode || 'undefined'}</code></div>
              <div>Primary: <code>{settings.primaryColor}</code></div>
              <div>Secondary: <code>{settings.secondaryColor}</code></div>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">DOM State</h3>
            <div className="text-sm space-y-1">
              <div>HTML Classes: <code>{domInfo.htmlClasses || 'none'}</code></div>
              <div>System Prefers: <code>{window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'}</code></div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2">CSS Variables</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>--background: <code>{domInfo.background}</code></div>
            <div>--foreground: <code>{domInfo.foreground}</code></div>
            <div>--primary: <code>{domInfo.primary}</code></div>
            <div>--secondary: <code>{domInfo.secondary}</code></div>
            <div>--card: <code>{domInfo.card}</code></div>
            <div>--card-foreground: <code>{domInfo.cardForeground}</code></div>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Test Theme Changes</h3>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant={settings.themeMode === 'light' ? 'default' : 'outline'}
              onClick={() => testThemeChange('light')}
            >
              Light
            </Button>
            <Button 
              size="sm" 
              variant={settings.themeMode === 'dark' ? 'default' : 'outline'}
              onClick={() => testThemeChange('dark')}
            >
              Dark
            </Button>
            <Button 
              size="sm" 
              variant={settings.themeMode === 'auto' ? 'default' : 'outline'}
              onClick={() => testThemeChange('auto')}
            >
              Auto
            </Button>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Visual Test</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-background border rounded">
              <div className="text-foreground">Background/Foreground</div>
            </div>
            <div className="p-4 bg-card border rounded">
              <div className="text-card-foreground">Card/Card Foreground</div>
            </div>
            <div className="p-4 bg-primary text-primary-foreground rounded">
              Primary Color
            </div>
            <div className="p-4 bg-secondary text-secondary-foreground rounded">
              Secondary Color
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ThemeDebugPanel;