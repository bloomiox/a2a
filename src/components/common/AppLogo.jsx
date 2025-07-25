import React, { useState, useEffect } from 'react';
import { AppSettings } from '@/api/entities';

const AppLogo = ({ className = "text-xl font-bold text-gray-900" }) => {
  const [settings, setSettings] = useState({
    logoUrl: '',
    companyName: 'TurbaTours'
  });

  useEffect(() => {
    loadSettings();
    
    // Listen for settings changes
    const handleSettingsChange = (event) => {
      console.log('AppLogo: Settings changed', event.detail);
      setSettings({
        logoUrl: event.detail.logoUrl || '',
        companyName: event.detail.companyName || 'TurbaTours'
      });
    };
    
    window.addEventListener('appSettingsChanged', handleSettingsChange);
    
    return () => {
      window.removeEventListener('appSettingsChanged', handleSettingsChange);
    };
  }, []);

  const loadSettings = async () => {
    try {
      const appSettings = await AppSettings.get();
      console.log('AppLogo: Loaded settings', appSettings);
      if (appSettings) {
        setSettings({
          logoUrl: appSettings.logoUrl || '',
          companyName: appSettings.companyName || 'TurbaTours'
        });
      }
    } catch (error) {
      console.error('Error loading app settings for logo:', error);
    }
  };

  if (settings.logoUrl) {
    return (
      <img 
        src={settings.logoUrl} 
        alt={settings.companyName}
        className="h-8 w-auto object-contain"
      />
    );
  }

  return (
    <span className={className}>
      {settings.companyName}
    </span>
  );
};

export default AppLogo;