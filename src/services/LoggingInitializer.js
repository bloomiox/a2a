import loggingService from './LoggingService';

// Initialize logging system
const initializeLogging = () => {
  // Set up global error handler
  window.addEventListener('error', (event) => {
    loggingService.logError(event.error, 'Global Error Handler');
  });

  // Set up unhandled promise rejection handler
  window.addEventListener('unhandledrejection', (event) => {
    loggingService.logError(event.reason, 'Unhandled Promise Rejection');
  });

  // Log application startup
  loggingService.logUserAction('app_initialized', {
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString(),
    url: window.location.href
  });

  // Set logging level based on environment
  if (import.meta.env.DEV) {
    loggingService.setLogLevel('debug');
    console.log('🔧 Logging initialized in development mode');
  } else {
    loggingService.setLogLevel('error');
    console.log('📊 Logging initialized in production mode');
  }
};

export default initializeLogging;