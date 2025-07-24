// Logging service for the application
class LoggingService {
  constructor() {
    this.isEnabled = true;
    this.logLevel = 'info'; // debug, info, warn, error
  }

  // Log database operations
  logDatabaseOperation(operation, table, data, error = null, duration = 0) {
    if (!this.isEnabled) return;

    const logData = {
      type: 'database',
      operation,
      table,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      success: !error
    };

    if (error) {
      logData.error = error.message || error;
      console.error(`[DB ${operation}] ${table}:`, logData);
    } else {
      console.log(`[DB ${operation}] ${table}:`, logData);
    }
  }

  // Log authentication events
  logAuth(action, userId = null, success = true, error = null) {
    if (!this.isEnabled) return;

    const logData = {
      type: 'auth',
      action,
      userId,
      success,
      timestamp: new Date().toISOString()
    };

    if (error) {
      logData.error = error.message || error;
      console.error(`[AUTH] ${action}:`, logData);
    } else {
      console.log(`[AUTH] ${action}:`, logData);
    }
  }

  // Log API calls
  logApiCall(endpoint, method, success = true, duration = 0, error = null) {
    if (!this.isEnabled) return;

    const logData = {
      type: 'api',
      endpoint,
      method,
      duration: `${duration}ms`,
      success,
      timestamp: new Date().toISOString()
    };

    if (error) {
      logData.error = error.message || error;
      console.error(`[API ${method}] ${endpoint}:`, logData);
    } else {
      console.log(`[API ${method}] ${endpoint}:`, logData);
    }
  }

  // Log user actions
  logUserAction(action, details = {}) {
    if (!this.isEnabled) return;

    const logData = {
      type: 'user_action',
      action,
      details,
      timestamp: new Date().toISOString()
    };

    console.log(`[USER] ${action}:`, logData);
  }

  // Log errors
  logError(error, context = '') {
    if (!this.isEnabled) return;

    const logData = {
      type: 'error',
      context,
      error: error.message || error,
      stack: error.stack,
      timestamp: new Date().toISOString()
    };

    console.error(`[ERROR] ${context}:`, logData);
  }

  // Set log level
  setLogLevel(level) {
    this.logLevel = level;
  }

  // Enable/disable logging
  setEnabled(enabled) {
    this.isEnabled = enabled;
  }
}

// Create and export a singleton instance
const loggingService = new LoggingService();
export default loggingService;