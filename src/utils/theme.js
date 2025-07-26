/**
 * App utilities for consistent styling across the app
 */

// Get current app settings from global window object
export const getAppSettings = () => {
  return window.appSettings || {};
};

// Get app colors
export const getAppColors = () => {
  const settings = getAppSettings();
  return {
    primary: settings.primaryColor || '#3b82f6',
    secondary: settings.secondaryColor || '#64748b',
    primaryRgb: hexToRgb(settings.primaryColor || '#3b82f6'),
    secondaryRgb: hexToRgb(settings.secondaryColor || '#64748b'),
  };
};

// Convert hex to RGB
export const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? 
    `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}` : 
    '59 130 246';
};

// Get CSS custom property value
export const getCSSVariable = (property) => {
  return getComputedStyle(document.documentElement).getPropertyValue(property).trim();
};

// Set CSS custom property
export const setCSSVariable = (property, value) => {
  document.documentElement.style.setProperty(property, value);
};

// Generate app-aware button classes
export const getButtonClasses = (variant = 'primary', size = 'md') => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background';
  
  const sizeClasses = {
    sm: 'h-9 px-3 text-sm',
    md: 'h-10 py-2 px-4',
    lg: 'h-11 px-8',
    icon: 'h-10 w-10'
  };
  
  const variantClasses = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
  };
  
  return `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]}`;
};

// Generate app-aware card classes
export const getCardClasses = (variant = 'default') => {
  const baseClasses = 'rounded-lg border bg-card text-card-foreground shadow-sm';
  
  const variantClasses = {
    default: '',
    elevated: 'shadow-md',
    outlined: 'border-2',
    filled: 'bg-muted'
  };
  
  return `${baseClasses} ${variantClasses[variant]}`;
};

// Check if feature is enabled
export const isFeatureEnabled = (feature) => {
  const settings = getAppSettings();
  return settings[feature] ?? true; // Default to enabled
};

// Get company branding info
export const getBrandingInfo = () => {
  const settings = getAppSettings();
  return {
    appName: settings.appName || 'AudioGuide',
    companyName: settings.companyName || 'AudioGuide',
    logoUrl: settings.logoUrl || '',
    description: settings.companyDescription || 'Professional Audio Tour Platform',
    contactEmail: settings.contactEmail || 'info@audioguide.com',
    contactPhone: settings.contactPhone || '+1 (555) 123-4567',
    website: settings.website || 'https://audioguide.com',
    address: settings.address || '123 Tourism Street, City, Country'
  };
};

// Apply dynamic styles to an element
export const applyAppStyles = (element, styles) => {
  if (!element) return;
  
  const colors = getAppColors();
  
  Object.entries(styles).forEach(([property, value]) => {
    // Replace app variables in the value
    let processedValue = value
      .replace(/\$primary/g, colors.primary)
      .replace(/\$secondary/g, colors.secondary)
      .replace(/\$primary-rgb/g, colors.primaryRgb)
      .replace(/\$secondary-rgb/g, colors.secondaryRgb);
    
    element.style[property] = processedValue;
  });
};

// Generate responsive classes based on settings
export const getResponsiveClasses = () => {
  const settings = getAppSettings();
  
  return {
    container: 'container mx-auto px-4 sm:px-6 lg:px-8',
    grid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
    flexCenter: 'flex items-center justify-center',
    textPrimary: 'text-primary',
    textSecondary: 'text-secondary',
    bgPrimary: 'bg-primary',
    bgSecondary: 'bg-secondary',
    borderPrimary: 'border-primary',
    borderSecondary: 'border-secondary'
  };
};

export default {
  getAppSettings,
  getAppColors,
  hexToRgb,
  getCSSVariable,
  setCSSVariable,
  getButtonClasses,
  getCardClasses,
  isFeatureEnabled,
  getBrandingInfo,
  applyAppStyles,
  getResponsiveClasses
};