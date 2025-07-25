import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppSettings } from '@/api/entities';

const AppSettingsContext = createContext();

export const useAppSettings = () => {
  const context = useContext(AppSettingsContext);
  if (!context) {
    throw new Error('useAppSettings must be used within an AppSettingsProvider');
  }
  return context;
};

export const AppSettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  // Listen for settings changes
  useEffect(() => {
    const handleSettingsChange = (event) => {
      setSettings(event.detail);
    };

    window.addEventListener('appSettingsChanged', handleSettingsChange);
    return () => window.removeEventListener('appSettingsChanged', handleSettingsChange);
  }, []);

  const loadSettings = async () => {
    try {
      const loadedSettings = await AppSettings.get();
      if (loadedSettings) {
        setSettings(loadedSettings);
        AppSettings.apply(loadedSettings);
      }
    } catch (error) {
      console.error('Error loading app settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings) => {
    try {
      console.log('Updating settings:', newSettings);
      await AppSettings.save(newSettings);
      setSettings(newSettings);
      
      // Dispatch custom event for other components to listen to
      window.dispatchEvent(new CustomEvent('appSettingsChanged', { detail: newSettings }));
      
      return { success: true };
    } catch (error) {
      console.error('Error updating settings:', error);
      return { success: false, error: error.message };
    }
  };



  const isFeatureEnabled = (featureName) => {
    return settings?.[featureName] ?? true; // Default to enabled if not set
  };

  const getAppColors = () => {
    if (!settings) return {};
    
    return {
      primary: settings.primaryColor || '#3b82f6', // Clean blue default
      secondary: settings.secondaryColor || '#64748b',
      primaryRgb: hexToRgb(settings.primaryColor || '#3b82f6'),
      secondaryRgb: hexToRgb(settings.secondaryColor || '#64748b'),
    };
  };

  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? 
      `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}` : 
      '59 130 246'; // Clean blue fallback
  };

  const value = {
    settings,
    loading,
    updateSettings,
    isFeatureEnabled,
    getAppColors,
    loadSettings
  };

  return (
    <AppSettingsContext.Provider value={value}>
      {children}
    </AppSettingsContext.Provider>
  );
};

export default AppSettingsProvider;