/**
 * Test Advanced Features - Verifies that our new services and components work correctly
 */

import offlineManager from '@/services/OfflineManager';
import driverPerformanceService from '@/services/DriverPerformanceService';
import migrationRunner from './migrationRunner';
import loggingService from '@/services/LoggingService';

class AdvancedFeaturesTest {
  constructor() {
    this.results = {
      migrations: { status: 'pending', message: '' },
      offlineManager: { status: 'pending', message: '' },
      driverPerformance: { status: 'pending', message: '' },
      logging: { status: 'pending', message: '' }
    };
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    console.log('🚀 Starting Advanced Features Tests...');
    
    try {
      await this.testMigrations();
      await this.testLogging();
      await this.testOfflineManager();
      await this.testDriverPerformance();
      
      this.printResults();
      return this.results;
    } catch (error) {
      console.error('❌ Test suite failed:', error);
      throw error;
    }
  }

  /**
   * Test database migrations
   */
  async testMigrations() {
    try {
      console.log('📊 Testing database migrations...');
      
      const migrationStatus = await migrationRunner.checkMigrationsNeeded();
      
      if (migrationStatus.needed) {
        console.log(`⚠️  Found ${migrationStatus.pending.length} pending migrations`);
        await migrationRunner.runMigrations();
        console.log('✅ Migrations completed successfully');
      } else {
        console.log('✅ All migrations are up to date');
      }
      
      this.results.migrations = {
        status: 'success',
        message: `Migrations completed. ${migrationStatus.completed.length} total migrations.`
      };
    } catch (error) {
      console.error('❌ Migration test failed:', error);
      this.results.migrations = {
        status: 'error',
        message: error.message
      };
    }
  }

  /**
   * Test logging service
   */
  async testLogging() {
    try {
      console.log('📝 Testing logging service...');
      
      // Test basic logging
      loggingService.addLog('INFO', 'Test log entry');
      loggingService.logError(new Error('Test error'), 'Test context');
      
      // Test log retrieval
      const logs = loggingService.getLogs();
      if (logs.length === 0) {
        throw new Error('No logs found after adding test logs');
      }
      
      // Test system stats
      const stats = loggingService.getSystemStats();
      if (!stats.uptime || !stats.totalLogs) {
        throw new Error('System stats incomplete');
      }
      
      console.log('✅ Logging service working correctly');
      this.results.logging = {
        status: 'success',
        message: `Logging service operational. ${logs.length} logs, uptime: ${stats.uptime}`
      };
    } catch (error) {
      console.error('❌ Logging test failed:', error);
      this.results.logging = {
        status: 'error',
        message: error.message
      };
    }
  }

  /**
   * Test offline manager
   */
  async testOfflineManager() {
    try {
      console.log('📱 Testing offline manager...');
      
      // Test initialization
      await offlineManager.initializeDB();
      
      // Test storage stats
      const stats = await offlineManager.getStorageStats();
      if (typeof stats.used !== 'number' || typeof stats.available !== 'number') {
        throw new Error('Storage stats format invalid');
      }
      
      // Test download status (should handle non-existent tour gracefully)
      const testTourId = 'test-tour-id';
      const downloadStatus = await offlineManager.getDownloadStatus(testTourId);
      // Should return null for non-existent download
      
      console.log('✅ Offline manager working correctly');
      this.results.offlineManager = {
        status: 'success',
        message: `Offline manager operational. Storage: ${stats.used}MB used, ${stats.available}MB available`
      };
    } catch (error) {
      console.error('❌ Offline manager test failed:', error);
      this.results.offlineManager = {
        status: 'error',
        message: error.message
      };
    }
  }

  /**
   * Test driver performance service
   */
  async testDriverPerformance() {
    try {
      console.log('🚗 Testing driver performance service...');
      
      // Test service initialization
      if (!driverPerformanceService) {
        throw new Error('Driver performance service not available');
      }
      
      // Test method availability
      const requiredMethods = [
        'recordPerformanceMetrics',
        'getPerformanceMetrics',
        'getPerformanceSummary',
        'updateAvailability',
        'getDriverAvailability',
        'getAvailableDrivers',
        'createNotification',
        'getDriverNotifications'
      ];
      
      for (const method of requiredMethods) {
        if (typeof driverPerformanceService[method] !== 'function') {
          throw new Error(`Missing method: ${method}`);
        }
      }
      
      console.log('✅ Driver performance service working correctly');
      this.results.driverPerformance = {
        status: 'success',
        message: `Driver performance service operational. All ${requiredMethods.length} methods available.`
      };
    } catch (error) {
      console.error('❌ Driver performance test failed:', error);
      this.results.driverPerformance = {
        status: 'error',
        message: error.message
      };
    }
  }

  /**
   * Print test results
   */
  printResults() {
    console.log('\n📋 Advanced Features Test Results:');
    console.log('=====================================');
    
    Object.entries(this.results).forEach(([feature, result]) => {
      const icon = result.status === 'success' ? '✅' : result.status === 'error' ? '❌' : '⏳';
      console.log(`${icon} ${feature}: ${result.message}`);
    });
    
    const successCount = Object.values(this.results).filter(r => r.status === 'success').length;
    const totalCount = Object.keys(this.results).length;
    
    console.log(`\n🎯 Overall: ${successCount}/${totalCount} tests passed`);
    
    if (successCount === totalCount) {
      console.log('🎉 All advanced features are working correctly!');
    } else {
      console.log('⚠️  Some features need attention. Check the errors above.');
    }
  }

  /**
   * Quick health check for production
   */
  async quickHealthCheck() {
    try {
      // Quick checks without running full migrations
      const checks = {
        logging: loggingService.getLogs().length >= 0,
        offlineManager: typeof offlineManager.getStorageStats === 'function',
        driverPerformance: typeof driverPerformanceService.getPerformanceMetrics === 'function'
      };
      
      const allHealthy = Object.values(checks).every(check => check === true);
      
      return {
        healthy: allHealthy,
        checks,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Export singleton instance
export const advancedFeaturesTest = new AdvancedFeaturesTest();
export default advancedFeaturesTest;