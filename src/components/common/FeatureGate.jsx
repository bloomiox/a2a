import React from 'react';
import { useAppSettings } from '@/contexts/AppSettingsContext';

/**
 * FeatureGate component - conditionally renders children based on feature flags
 * 
 * @param {string} feature - The feature flag name (e.g., 'enableAudioRecording')
 * @param {React.ReactNode} children - Content to render if feature is enabled
 * @param {React.ReactNode} fallback - Content to render if feature is disabled
 * @param {boolean} invert - If true, renders children when feature is disabled
 */
const FeatureGate = ({ feature, children, fallback = null, invert = false }) => {
  const { isFeatureEnabled } = useAppSettings();
  
  const shouldRender = invert ? !isFeatureEnabled(feature) : isFeatureEnabled(feature);
  
  return shouldRender ? children : fallback;
};

/**
 * Hook to check if a feature is enabled
 */
export const useFeature = (feature) => {
  const { isFeatureEnabled } = useAppSettings();
  return isFeatureEnabled(feature);
};

/**
 * Higher-order component to wrap components with feature gating
 */
export const withFeatureGate = (feature, fallback = null) => (Component) => {
  return (props) => (
    <FeatureGate feature={feature} fallback={fallback}>
      <Component {...props} />
    </FeatureGate>
  );
};

export default FeatureGate;