import React from 'react';
import { useAppSettings } from '@/contexts/AppSettingsContext';

const ThemeDebug = () => {
  const { settings } = useAppSettings();
  
  if (!settings) return null;
  
  return (
    <div className="fixed bottom-4 right-4 bg-card border rounded-lg p-3 text-xs shadow-lg z-50">
      <div><strong>Theme:</strong> {settings.themeMode || 'light'}</div>
      <div><strong>Primary:</strong> {settings.primaryColor}</div>
      <div><strong>Secondary:</strong> {settings.secondaryColor}</div>
      <div><strong>HTML Class:</strong> {document.documentElement.className}</div>
    </div>
  );
};

export default ThemeDebug;