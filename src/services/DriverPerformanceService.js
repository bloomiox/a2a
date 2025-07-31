/**
 * DriverPerformanceService - Handles driver performance tracking and analytics
 */

import { supabase } from '@/api/supabaseClient';
import loggingService from './LoggingService';

class DriverPerformanceService {
  constructor() {
    this.metricsCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Record driver performance metrics for a specific date
   */
  async recordDailyMetrics(driverId, date, metrics) {
    try {
      const { error } = await supabase
        .from('driver_performance_metrics')
        .upsert({
          driver_id: driverId,
          metric_date: date,
          ...metrics,
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      // Clear cache for this driver
      this.clearDriverCache(driverId);

      loggingService.addLog('INFO', `Performance metrics recorded for driver ${driverId} on ${date}`);
      return true;
    } catch (error) {
      loggingService.logError(error, `Failed to record metrics for driver ${driverId}`);
      throw error;
    }
  }

  /**
   * Get driver performance metrics for a date range
   */
  async getDriverMetrics(driverId, startDate, endDate) {
    try {
      const cacheKey = `${driverId}_${startDate}_${endDate}`;
      
      // Check cache first
      if (this.metricsCache.has(cacheKey)) {
        const cached = this.metricsCache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          return cached.data;
        }
      }

      const { data, error } = await supabase
        .from('driver_performance_metrics')
        .select('*')
        .eq('driver_id', driverId)
        .gte('metric_date', startDate)
        .lte('metric_date', endDate)
        .order('metric_date', { ascending: true });

      if (error) throw error;

      // Cache the result
      this.metricsCache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      return data;
    } catch (error) {
      loggingService.logError(error, `Failed to get metrics for driver ${driverId}`);
      throw error;
    }
  }

  /**
   * Get driver performance summary
   */
  async getPerformanceSummary(driverId, period = 'month') {
    try {
      const endDate = new Date();
      const startDate = new Date();
      
      switch (period) {
        case 'week':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(endDate.getMonth() - 3);
          break;
        case 'year':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
      }

      const metrics = await this.getDriverMetrics(
        driverId,
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );

      if (!metrics || metrics.length === 0) {
        return this.getEmptySummary();
      }

      return this.calculateSummary(metrics);
    } catch (error) {
      loggingService.logError(error, `Failed to get performance summary for driver ${driverId}`);
      // Return empty summary instead of throwing
      return this.getEmptySummary();
    }
  }

  /**
   * Calculate performance summary from metrics
   */
  calculateSummary(metrics) {
    const summary = {
      totalTours: 0,
      totalDistance: 0,
      totalTime: 0,
      averageRating: 0,
      onTimePercentage: 0,
      fuelEfficiency: 0,
      customerSatisfaction: 0,
      safetyIncidents: 0,
      totalRevenue: 0,
      trends: {
        tours: [],
        rating: [],
        onTime: [],
        revenue: []
      }
    };

    let ratingSum = 0;
    let onTimeSum = 0;
    let fuelSum = 0;
    let satisfactionSum = 0;
    let validRatingDays = 0;
    let validOnTimeDays = 0;
    let validFuelDays = 0;
    let validSatisfactionDays = 0;

    metrics.forEach(metric => {
      summary.totalTours += metric.tours_completed || 0;
      summary.totalDistance += parseFloat(metric.total_distance_km || 0);
      summary.totalTime += parseFloat(metric.total_time_hours || 0);
      summary.safetyIncidents += metric.safety_incidents || 0;
      summary.totalRevenue += parseFloat(metric.revenue_generated || 0);

      // Calculate averages (only for non-null values)
      if (metric.average_rating !== null) {
        ratingSum += parseFloat(metric.average_rating);
        validRatingDays++;
      }
      
      if (metric.on_time_percentage !== null) {
        onTimeSum += parseFloat(metric.on_time_percentage);
        validOnTimeDays++;
      }
      
      if (metric.fuel_efficiency !== null) {
        fuelSum += parseFloat(metric.fuel_efficiency);
        validFuelDays++;
      }
      
      if (metric.customer_satisfaction_score !== null) {
        satisfactionSum += parseFloat(metric.customer_satisfaction_score);
        validSatisfactionDays++;
      }

      // Add to trends
      summary.trends.tours.push({
        date: metric.metric_date,
        value: metric.tours_completed || 0
      });
      
      summary.trends.rating.push({
        date: metric.metric_date,
        value: metric.average_rating || 0
      });
      
      summary.trends.onTime.push({
        date: metric.metric_date,
        value: metric.on_time_percentage || 0
      });
      
      summary.trends.revenue.push({
        date: metric.metric_date,
        value: parseFloat(metric.revenue_generated || 0)
      });
    });

    // Calculate averages
    summary.averageRating = validRatingDays > 0 ? ratingSum / validRatingDays : 0;
    summary.onTimePercentage = validOnTimeDays > 0 ? onTimeSum / validOnTimeDays : 0;
    summary.fuelEfficiency = validFuelDays > 0 ? fuelSum / validFuelDays : 0;
    summary.customerSatisfaction = validSatisfactionDays > 0 ? satisfactionSum / validSatisfactionDays : 0;

    // Round values
    summary.averageRating = Math.round(summary.averageRating * 100) / 100;
    summary.onTimePercentage = Math.round(summary.onTimePercentage * 100) / 100;
    summary.fuelEfficiency = Math.round(summary.fuelEfficiency * 100) / 100;
    summary.customerSatisfaction = Math.round(summary.customerSatisfaction * 100) / 100;
    summary.totalDistance = Math.round(summary.totalDistance * 100) / 100;
    summary.totalTime = Math.round(summary.totalTime * 100) / 100;
    summary.totalRevenue = Math.round(summary.totalRevenue * 100) / 100;

    return summary;
  }

  /**
   * Get empty summary structure
   */
  getEmptySummary() {
    return {
      totalTours: 0,
      totalDistance: 0,
      totalTime: 0,
      averageRating: 0,
      onTimePercentage: 0,
      fuelEfficiency: 0,
      customerSatisfaction: 0,
      safetyIncidents: 0,
      totalRevenue: 0,
      trends: {
        tours: [],
        rating: [],
        onTime: [],
        revenue: []
      }
    };
  }

  /**
   * Update driver availability status
   */
  async updateAvailability(driverId, status, location = null, notes = null) {
    try {
      const updateData = {
        driver_id: driverId,
        status,
        updated_at: new Date().toISOString()
      };

      if (location) {
        updateData.current_location = location;
      }

      if (notes) {
        updateData.notes = notes;
      }

      // Set shift times based on status
      if (status === 'available' || status === 'busy') {
        updateData.shift_start = new Date().toISOString();
      } else if (status === 'offline') {
        updateData.shift_end = new Date().toISOString();
      }

      const { error } = await supabase
        .from('driver_availability')
        .upsert(updateData);

      if (error) throw error;

      loggingService.addLog('INFO', `Driver ${driverId} availability updated to ${status}`);
      return true;
    } catch (error) {
      loggingService.logError(error, `Failed to update availability for driver ${driverId}`);
      throw error;
    }
  }

  /**
   * Get driver availability status
   */
  async getDriverAvailability(driverId) {
    try {
      const { data, error } = await supabase
        .from('driver_availability')
        .select('*')
        .eq('driver_id', driverId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      return data || {
        driver_id: driverId,
        status: 'offline',
        current_location: null,
        availability_radius: 10000,
        shift_start: null,
        shift_end: null,
        notes: null,
        updated_at: new Date().toISOString()
      };
    } catch (error) {
      loggingService.logError(error, `Failed to get availability for driver ${driverId}`);
      throw error;
    }
  }

  /**
   * Get available drivers in a location
   */
  async getAvailableDrivers(location, radius = 10000) {
    try {
      const { data, error } = await supabase
        .from('driver_availability')
        .select(`
          *,
          user_profiles (
            id,
            full_name,
            email,
            user_group
          )
        `)
        .eq('status', 'available')
        .not('current_location', 'is', null);

      if (error) throw error;

      // Filter by distance if location provided
      if (location && location.latitude && location.longitude) {
        return data.filter(driver => {
          if (!driver.current_location) return false;
          
          const distance = this.calculateDistance(
            location.latitude,
            location.longitude,
            driver.current_location.latitude,
            driver.current_location.longitude
          );
          
          return distance <= (driver.availability_radius || radius);
        });
      }

      return data;
    } catch (error) {
      loggingService.logError(error, 'Failed to get available drivers');
      throw error;
    }
  }

  /**
   * Calculate distance between two points (Haversine formula)
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  /**
   * Create driver notification
   */
  async createNotification(driverId, type, title, message, data = null, priority = 'normal') {
    try {
      const { error } = await supabase
        .from('driver_notifications')
        .insert({
          driver_id: driverId,
          notification_type: type,
          title,
          message,
          data,
          priority,
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      loggingService.addLog('INFO', `Notification created for driver ${driverId}: ${title}`);
      return true;
    } catch (error) {
      loggingService.logError(error, `Failed to create notification for driver ${driverId}`);
      throw error;
    }
  }

  /**
   * Get driver notifications
   */
  async getDriverNotifications(driverId, unreadOnly = false) {
    try {
      let query = supabase
        .from('driver_notifications')
        .select('*')
        .eq('driver_id', driverId)
        .order('created_at', { ascending: false });

      if (unreadOnly) {
        query = query.eq('is_read', false);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data;
    } catch (error) {
      loggingService.logError(error, `Failed to get notifications for driver ${driverId}`);
      // Return empty array instead of throwing
      return [];
    }
  }

  /**
   * Mark notification as read
   */
  async markNotificationRead(notificationId) {
    try {
      const { error } = await supabase
        .from('driver_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;
      return true;
    } catch (error) {
      loggingService.logError(error, `Failed to mark notification ${notificationId} as read`);
      throw error;
    }
  }

  /**
   * Get driver performance ranking
   */
  async getDriverRanking(driverId, period = 'month') {
    try {
      const endDate = new Date();
      const startDate = new Date();
      
      switch (period) {
        case 'week':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(endDate.getMonth() - 3);
          break;
      }

      // Get all drivers' performance for the period
      const { data, error } = await supabase
        .from('driver_performance_metrics')
        .select(`
          driver_id,
          AVG(average_rating) as avg_rating,
          AVG(on_time_percentage) as avg_on_time,
          AVG(customer_satisfaction_score) as avg_satisfaction,
          SUM(tours_completed) as total_tours,
          SUM(revenue_generated) as total_revenue
        `)
        .gte('metric_date', startDate.toISOString().split('T')[0])
        .lte('metric_date', endDate.toISOString().split('T')[0])
        .not('average_rating', 'is', null)
        .not('on_time_percentage', 'is', null)
        .not('customer_satisfaction_score', 'is', null);

      if (error) throw error;

      // Calculate composite score and rank
      const driversWithScores = data.map(driver => {
        const compositeScore = (
          (parseFloat(driver.avg_rating) || 0) * 0.3 +
          (parseFloat(driver.avg_on_time) || 0) * 0.3 +
          (parseFloat(driver.avg_satisfaction) || 0) * 0.2 +
          Math.min((parseInt(driver.total_tours) || 0) / 10, 10) * 0.2
        );

        return {
          ...driver,
          composite_score: compositeScore
        };
      });

      // Sort by composite score
      driversWithScores.sort((a, b) => b.composite_score - a.composite_score);

      // Find current driver's rank
      const driverRank = driversWithScores.findIndex(d => d.driver_id === driverId) + 1;
      const totalDrivers = driversWithScores.length;
      const driverData = driversWithScores.find(d => d.driver_id === driverId);

      return {
        rank: driverRank,
        totalDrivers,
        percentile: totalDrivers > 0 ? Math.round(((totalDrivers - driverRank + 1) / totalDrivers) * 100) : 0,
        compositeScore: driverData?.composite_score || 0,
        topPerformers: driversWithScores.slice(0, 5)
      };
    } catch (error) {
      loggingService.logError(error, `Failed to get ranking for driver ${driverId}`);
      throw error;
    }
  }

  /**
   * Clear cache for a specific driver
   */
  clearDriverCache(driverId) {
    const keysToDelete = [];
    for (const key of this.metricsCache.keys()) {
      if (key.startsWith(driverId)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.metricsCache.delete(key));
  }

  /**
   * Clear all cache
   */
  clearCache() {
    this.metricsCache.clear();
  }
}

// Export singleton instance
export const driverPerformanceService = new DriverPerformanceService();
export default driverPerformanceService;