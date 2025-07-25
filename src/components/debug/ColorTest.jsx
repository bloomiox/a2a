import React, { useEffect, useState } from 'react';
import { useAppSettings } from '@/contexts/AppSettingsContext';

const ColorTest = () => {
  const { settings } = useAppSettings();
  const [cssVars, setCssVars] = useState({});

  useEffect(() => {
    const root = document.documentElement;
    const computedStyle = getComputedStyle(root);
    
    setCssVars({
      primary: computedStyle.getPropertyValue('--primary').trim(),
      secondary: computedStyle.getPropertyValue('--secondary').trim(),
      primaryForeground: computedStyle.getPropertyValue('--primary-foreground').trim(),
      secondaryForeground: computedStyle.getPropertyValue('--secondary-foreground').trim(),
    });
  }, [settings]);

  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? 
      `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}` : 
      '249 115 22';
  };

  if (!settings) return <div>Loading settings...</div>;

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold">Color Debug Panel</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Settings Values</h3>
          <div>Primary Color: {settings.primaryColor}</div>
          <div>Secondary Color: {settings.secondaryColor}</div>
          <div>Primary RGB: {hexToRgb(settings.primaryColor)}</div>
          <div>Secondary RGB: {hexToRgb(settings.secondaryColor)}</div>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">CSS Variables</h3>
          <div>--primary: {cssVars.primary}</div>
          <div>--secondary: {cssVars.secondary}</div>
          <div>--primary-foreground: {cssVars.primaryForeground}</div>
          <div>--secondary-foreground: {cssVars.secondaryForeground}</div>
        </div>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Color Swatches</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div 
              className="w-full h-20 rounded border flex items-center justify-center text-white font-semibold"
              style={{ backgroundColor: settings.primaryColor }}
            >
              Primary (Hex)
            </div>
            <div className="text-sm text-center mt-1">{settings.primaryColor}</div>
          </div>
          
          <div>
            <div 
              className="w-full h-20 rounded border flex items-center justify-center text-white font-semibold"
              style={{ backgroundColor: settings.secondaryColor }}
            >
              Secondary (Hex)
            </div>
            <div className="text-sm text-center mt-1">{settings.secondaryColor}</div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div 
              className="w-full h-20 rounded border flex items-center justify-center text-white font-semibold"
              style={{ backgroundColor: `rgb(${hexToRgb(settings.primaryColor)})` }}
            >
              Primary (RGB)
            </div>
            <div className="text-sm text-center mt-1">rgb({hexToRgb(settings.primaryColor)})</div>
          </div>
          
          <div>
            <div 
              className="w-full h-20 rounded border flex items-center justify-center text-white font-semibold"
              style={{ backgroundColor: `rgb(${hexToRgb(settings.secondaryColor)})` }}
            >
              Secondary (RGB)
            </div>
            <div className="text-sm text-center mt-1">rgb({hexToRgb(settings.secondaryColor)})</div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="w-full h-20 rounded border flex items-center justify-center text-white font-semibold bg-primary">
              Primary (CSS Var)
            </div>
            <div className="text-sm text-center mt-1">bg-primary</div>
          </div>
          
          <div>
            <div className="w-full h-20 rounded border flex items-center justify-center text-white font-semibold bg-secondary">
              Secondary (CSS Var)
            </div>
            <div className="text-sm text-center mt-1">bg-secondary</div>
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Test Buttons</h3>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded">
            Primary Button
          </button>
          <button className="px-4 py-2 bg-secondary text-secondary-foreground rounded">
            Secondary Button
          </button>
        </div>
      </div>
    </div>
  );
};

export default ColorTest;