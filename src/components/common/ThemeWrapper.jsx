import { useAppSettings } from '@/contexts/AppSettingsContext';

const AppWrapper = ({ children, className = '' }) => {
  const { settings, loading } = useAppSettings();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show maintenance mode if enabled
  if (settings?.enableMaintenance) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md mx-auto text-center p-8">
          <div className="mb-6">
            {settings.logoUrl ? (
              <img 
                src={settings.logoUrl} 
                alt={settings.companyName || 'Logo'}
                className="h-16 w-auto mx-auto mb-4"
              />
            ) : (
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                {settings.companyName || 'AudioGuide'}
              </h1>
            )}
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-yellow-600 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              System Maintenance
            </h2>
            <p className="text-gray-600">
              {settings.maintenanceMessage || 'System is under maintenance. Please try again later.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`app-wrapper ${className}`}>
      {children}
    </div>
  );
};

export default AppWrapper;