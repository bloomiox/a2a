// Logging service for the application
class LoggingService {
  constructor() {
    this.isEnabled = true;
    this.logLevel = 'info'; // debug, info, warn, error
    this.logs = []; // Store logs in memory
    this.maxLogs = 1000; // Maximum number of logs to keep
    this.startTime = Date.now(); // For uptime calculation
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
      this.addLog('ERROR', `Database ${operation} failed on ${table}`, logData);
    } else {
      console.log(`[DB ${operation}] ${table}:`, logData);
      this.addLog('DATABASE', `Database ${operation} on ${table}`, logData);
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
      this.addLog('ERROR', `Auth ${action} failed`, logData);
    } else {
      console.log(`[AUTH] ${action}:`, logData);
      this.addLog('AUTH', `Auth ${action}`, logData);
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
      this.addLog('ERROR', `API ${method} ${endpoint} failed`, logData);
    } else {
      console.log(`[API ${method}] ${endpoint}:`, logData);
      this.addLog('API', `API ${method} ${endpoint}`, logData);
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
    this.addLog('INFO', `User ${action}`, logData);
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
    this.addLog('ERROR', `${context}: ${error.message || error}`, logData);
  }

  // Set log level
  setLogLevel(level) {
    this.logLevel = level;
  }

  // Enable/disable logging
  setEnabled(enabled) {
    this.isEnabled = enabled;
  }

  // Add a log entry to the internal storage
  addLog(level, message, details = {}) {
    if (!this.isEnabled) return;

    const log = {
      id: Date.now() + Math.random(), // Simple unique ID
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message,
      details: {
        sessionId: this.getSessionId(),
        url: typeof window !== 'undefined' ? window.location.href : '',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        ...details
      }
    };

    this.logs.unshift(log); // Add to beginning for newest first

    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    return log;
  }

  // Get all logs
  getLogs() {
    return [...this.logs]; // Return a copy
  }

  // Get system statistics
  getSystemStats() {
    const now = Date.now();
    const uptime = now - this.startTime;
    const recentErrors = this.logs.filter(log => 
      log.level === 'ERROR' && 
      (now - new Date(log.timestamp).getTime()) < 24 * 60 * 60 * 1000 // Last 24 hours
    ).length;

    return {
      uptime: this.formatUptime(uptime),
      totalLogs: this.logs.length,
      recentErrors,
      memoryUsage: this.getMemoryUsage()
    };
  }

  // Export logs in different formats
  exportLogs(format = 'json') {
    if (format === 'csv') {
      const headers = ['Timestamp', 'Level', 'Message', 'Details'];
      const rows = this.logs.map(log => [
        log.timestamp,
        log.level,
        log.message,
        JSON.stringify(log.details)
      ]);
      
      return [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');
    }
    
    return JSON.stringify(this.logs, null, 2);
  }

  // Clear all logs
  clearLogs() {
    this.logs = [];
  }

  // Helper methods
  getSessionId() {
    if (typeof window !== 'undefined') {
      let sessionId = sessionStorage.getItem('sessionId');
      if (!sessionId) {
        sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        sessionStorage.setItem('sessionId', sessionId);
      }
      return sessionId;
    }
    return 'server_session';
  }

  formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  getMemoryUsage() {
    if (typeof performance !== 'undefined' && performance.memory) {
      return {
        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024)
      };
    }
    return { used: 'N/A', total: 'N/A' };
  }
}

// Create and export a singleton instance
const loggingService = new LoggingService();

export default loggingService;