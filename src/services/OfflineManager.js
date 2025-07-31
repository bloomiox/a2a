/**
 * OfflineManager - Handles offline tour downloads and synchronization
 */

import { supabase } from '@/api/supabaseClient';
import loggingService from './LoggingService';

class OfflineManager {
  constructor() {
    this.dbName = 'AudioGuideOfflineDB';
    this.dbVersion = 1;
    this.db = null;
    this.downloadQueue = new Map();
    this.syncQueue = new Map();
    this.isOnline = navigator.onLine;
    
    // Initialize IndexedDB
    this.initDB();
    
    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
  }

  /**
   * Initialize IndexedDB for offline storage
   */
  async initDB() {
    try {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(this.dbName, this.dbVersion);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          this.db = request.result;
          resolve(this.db);
        };
        
        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          
          // Tours store
          if (!db.objectStoreNames.contains('tours')) {
            const toursStore = db.createObjectStore('tours', { keyPath: 'id' });
            toursStore.createIndex('downloadStatus', 'downloadStatus', { unique: false });
            toursStore.createIndex('lastAccessed', 'lastAccessed', { unique: false });
          }
          
          // Audio files store
          if (!db.objectStoreNames.contains('audioFiles')) {
            const audioStore = db.createObjectStore('audioFiles', { keyPath: 'id' });
            audioStore.createIndex('tourId', 'tourId', { unique: false });
            audioStore.createIndex('language', 'language', { unique: false });
          }
          
          // Images store
          if (!db.objectStoreNames.contains('images')) {
            const imagesStore = db.createObjectStore('images', { keyPath: 'id' });
            imagesStore.createIndex('tourId', 'tourId', { unique: false });
          }
          
          // User progress store (for offline sync)
          if (!db.objectStoreNames.contains('userProgress')) {
            const progressStore = db.createObjectStore('userProgress', { keyPath: 'id' });
            progressStore.createIndex('tourId', 'tourId', { unique: false });
            progressStore.createIndex('syncStatus', 'syncStatus', { unique: false });
          }
        };
      });
    } catch (error) {
      loggingService.logError(error, 'Failed to initialize offline database');
      throw error;
    }
  }

  /**
   * Download a tour for offline use
   */
  async downloadTour(tourId, progressCallback) {
    try {
      loggingService.addLog('INFO', `Starting download for tour ${tourId}`);
      
      // Check if already downloading
      if (this.downloadQueue.has(tourId)) {
        throw new Error('Tour is already being downloaded');
      }
      
      // Create download record
      const downloadRecord = {
        tourId,
        status: 'downloading',
        progress: 0,
        startTime: new Date(),
        totalSize: 0,
        downloadedSize: 0
      };
      
      this.downloadQueue.set(tourId, downloadRecord);
      
      // Update database record
      await this.updateDownloadStatus(tourId, 'downloading', 0);
      
      // Get tour data
      const tourData = await this.fetchTourData(tourId);
      if (!tourData) {
        throw new Error('Failed to fetch tour data');
      }
      
      // Calculate total download size
      const totalSize = this.calculateTotalSize(tourData);
      downloadRecord.totalSize = totalSize;
      
      // Download tour content
      await this.downloadTourContent(tourData, downloadRecord, progressCallback);
      
      // Mark as completed
      downloadRecord.status = 'completed';
      downloadRecord.progress = 100;
      downloadRecord.endTime = new Date();
      
      await this.updateDownloadStatus(tourId, 'completed', 100);
      
      loggingService.addLog('INFO', `Tour ${tourId} downloaded successfully`);
      this.downloadQueue.delete(tourId);
      
      return true;
    } catch (error) {
      loggingService.logError(error, `Failed to download tour ${tourId}`);
      await this.updateDownloadStatus(tourId, 'failed', 0);
      this.downloadQueue.delete(tourId);
      throw error;
    }
  }

  /**
   * Fetch tour data from server
   */
  async fetchTourData(tourId) {
    try {
      const { data: tour, error: tourError } = await supabase
        .from('tours')
        .select(`
          *,
          tour_stops (
            *,
            audio_tracks (*)
          )
        `)
        .eq('id', tourId)
        .single();
      
      if (tourError) throw tourError;
      return tour;
    } catch (error) {
      loggingService.logError(error, `Failed to fetch tour data for ${tourId}`);
      return null;
    }
  }

  /**
   * Calculate total download size
   */
  calculateTotalSize(tourData) {
    let totalSize = 0;
    
    // Estimate tour data size (JSON)
    totalSize += JSON.stringify(tourData).length;
    
    // Add audio files size (estimate 1MB per minute)
    tourData.tour_stops?.forEach(stop => {
      stop.audio_tracks?.forEach(track => {
        totalSize += (track.duration || 60) * 1024 * 16; // 16KB per second estimate
      });
    });
    
    // Add images size (estimate 500KB per image)
    if (tourData.preview_image) totalSize += 500 * 1024;
    tourData.tour_stops?.forEach(stop => {
      if (stop.preview_image) totalSize += 500 * 1024;
      if (stop.gallery?.length) totalSize += stop.gallery.length * 500 * 1024;
    });
    
    return totalSize;
  }

  /**
   * Download tour content (audio, images, data)
   */
  async downloadTourContent(tourData, downloadRecord, progressCallback) {
    const downloads = [];
    
    // Download tour data
    downloads.push(this.storeTourData(tourData));
    
    // Download audio files
    for (const stop of tourData.tour_stops || []) {
      for (const track of stop.audio_tracks || []) {
        if (track.audio_url) {
          downloads.push(this.downloadAudioFile(track, downloadRecord, progressCallback));
        }
      }
    }
    
    // Download images
    if (tourData.preview_image) {
      downloads.push(this.downloadImage(tourData.preview_image, tourData.id, 'tour_preview'));
    }
    
    for (const stop of tourData.tour_stops || []) {
      if (stop.preview_image) {
        downloads.push(this.downloadImage(stop.preview_image, tourData.id, `stop_${stop.id}`));
      }
      
      if (stop.gallery?.length) {
        stop.gallery.forEach((imageUrl, index) => {
          downloads.push(this.downloadImage(imageUrl, tourData.id, `stop_${stop.id}_gallery_${index}`));
        });
      }
    }
    
    // Wait for all downloads to complete
    await Promise.all(downloads);
  }

  /**
   * Store tour data in IndexedDB
   */
  async storeTourData(tourData) {
    try {
      const transaction = this.db.transaction(['tours'], 'readwrite');
      const store = transaction.objectStore('tours');
      
      const offlineTour = {
        ...tourData,
        downloadStatus: 'completed',
        downloadedAt: new Date(),
        lastAccessed: new Date()
      };
      
      await store.put(offlineTour);
      return true;
    } catch (error) {
      loggingService.logError(error, 'Failed to store tour data');
      throw error;
    }
  }

  /**
   * Download and store audio file
   */
  async downloadAudioFile(track, downloadRecord, progressCallback) {
    try {
      const response = await fetch(track.audio_url);
      if (!response.ok) throw new Error(`Failed to download audio: ${response.statusText}`);
      
      const blob = await response.blob();
      
      const transaction = this.db.transaction(['audioFiles'], 'readwrite');
      const store = transaction.objectStore('audioFiles');
      
      const audioFile = {
        id: track.id,
        tourId: track.stop_id, // Assuming stop_id relates to tour
        language: track.language,
        blob: blob,
        duration: track.duration,
        downloadedAt: new Date()
      };
      
      await store.put(audioFile);
      
      // Update progress
      downloadRecord.downloadedSize += blob.size;
      downloadRecord.progress = Math.round((downloadRecord.downloadedSize / downloadRecord.totalSize) * 100);
      
      if (progressCallback) {
        progressCallback(downloadRecord.progress, downloadRecord);
      }
      
      return true;
    } catch (error) {
      loggingService.logError(error, `Failed to download audio file ${track.id}`);
      throw error;
    }
  }

  /**
   * Download and store image
   */
  async downloadImage(imageUrl, tourId, imageId) {
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error(`Failed to download image: ${response.statusText}`);
      
      const blob = await response.blob();
      
      const transaction = this.db.transaction(['images'], 'readwrite');
      const store = transaction.objectStore('images');
      
      const imageFile = {
        id: imageId,
        tourId: tourId,
        url: imageUrl,
        blob: blob,
        downloadedAt: new Date()
      };
      
      await store.put(imageFile);
      return true;
    } catch (error) {
      loggingService.logError(error, `Failed to download image ${imageId}`);
      throw error;
    }
  }

  /**
   * Get offline tour data
   */
  async getOfflineTour(tourId) {
    try {
      const transaction = this.db.transaction(['tours'], 'readonly');
      const store = transaction.objectStore('tours');
      
      return new Promise((resolve, reject) => {
        const request = store.get(tourId);
        request.onsuccess = () => {
          const tour = request.result;
          if (tour) {
            // Update last accessed
            tour.lastAccessed = new Date();
            const updateTransaction = this.db.transaction(['tours'], 'readwrite');
            const updateStore = updateTransaction.objectStore('tours');
            updateStore.put(tour);
          }
          resolve(tour);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      loggingService.logError(error, `Failed to get offline tour ${tourId}`);
      return null;
    }
  }

  /**
   * Get offline audio file
   */
  async getOfflineAudio(trackId) {
    try {
      const transaction = this.db.transaction(['audioFiles'], 'readonly');
      const store = transaction.objectStore('audioFiles');
      
      return new Promise((resolve, reject) => {
        const request = store.get(trackId);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      loggingService.logError(error, `Failed to get offline audio ${trackId}`);
      return null;
    }
  }

  /**
   * Get offline image
   */
  async getOfflineImage(imageId) {
    try {
      const transaction = this.db.transaction(['images'], 'readonly');
      const store = transaction.objectStore('images');
      
      return new Promise((resolve, reject) => {
        const request = store.get(imageId);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      loggingService.logError(error, `Failed to get offline image ${imageId}`);
      return null;
    }
  }

  /**
   * Update download status in database
   */
  async updateDownloadStatus(tourId, status, progress) {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;
      
      const { error } = await supabase
        .from('tour_downloads')
        .upsert({
          user_id: user.user.id,
          tour_id: tourId,
          download_status: status,
          download_progress: progress,
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
    } catch (error) {
      loggingService.logError(error, 'Failed to update download status');
    }
  }

  /**
   * Get download status for a tour
   */
  async getDownloadStatus(tourId) {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return null;
      
      const { data, error } = await supabase
        .from('tour_downloads')
        .select('*')
        .eq('user_id', user.user.id)
        .eq('tour_id', tourId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      loggingService.logError(error, `Failed to get download status for ${tourId}`);
      return null;
    }
  }

  /**
   * Delete offline tour
   */
  async deleteOfflineTour(tourId) {
    try {
      // Delete from IndexedDB
      const transaction = this.db.transaction(['tours', 'audioFiles', 'images'], 'readwrite');
      
      // Delete tour data
      const toursStore = transaction.objectStore('tours');
      await toursStore.delete(tourId);
      
      // Delete audio files
      const audioStore = transaction.objectStore('audioFiles');
      const audioIndex = audioStore.index('tourId');
      const audioCursor = await audioIndex.openCursor(tourId);
      while (audioCursor) {
        await audioCursor.delete();
        audioCursor = await audioCursor.continue();
      }
      
      // Delete images
      const imagesStore = transaction.objectStore('images');
      const imagesIndex = imagesStore.index('tourId');
      const imagesCursor = await imagesIndex.openCursor(tourId);
      while (imagesCursor) {
        await imagesCursor.delete();
        imagesCursor = await imagesCursor.continue();
      }
      
      // Update database status
      await this.updateDownloadStatus(tourId, 'deleted', 0);
      
      loggingService.addLog('INFO', `Offline tour ${tourId} deleted successfully`);
      return true;
    } catch (error) {
      loggingService.logError(error, `Failed to delete offline tour ${tourId}`);
      throw error;
    }
  }

  /**
   * Handle online event
   */
  handleOnline() {
    this.isOnline = true;
    loggingService.addLog('INFO', 'Device is online - starting sync');
    this.syncOfflineData();
  }

  /**
   * Handle offline event
   */
  handleOffline() {
    this.isOnline = false;
    loggingService.addLog('INFO', 'Device is offline');
  }

  /**
   * Sync offline data when back online
   */
  async syncOfflineData() {
    if (!this.isOnline) return;
    
    try {
      // Sync user progress
      await this.syncUserProgress();
      
      loggingService.addLog('INFO', 'Offline data sync completed');
    } catch (error) {
      loggingService.logError(error, 'Failed to sync offline data');
    }
  }

  /**
   * Sync user progress data
   */
  async syncUserProgress() {
    try {
      const transaction = this.db.transaction(['userProgress'], 'readwrite');
      const store = transaction.objectStore('userProgress');
      const index = store.index('syncStatus');
      
      const cursor = await index.openCursor('pending');
      while (cursor) {
        const progress = cursor.value;
        
        try {
          // Sync to server
          const { error } = await supabase
            .from('user_progress')
            .upsert(progress);
          
          if (!error) {
            // Mark as synced
            progress.syncStatus = 'synced';
            await cursor.update(progress);
          }
        } catch (error) {
          loggingService.logError(error, `Failed to sync progress ${progress.id}`);
        }
        
        cursor = await cursor.continue();
      }
    } catch (error) {
      loggingService.logError(error, 'Failed to sync user progress');
    }
  }

  /**
   * Get storage usage statistics
   */
  async getStorageStats() {
    try {
      if (!navigator.storage || !navigator.storage.estimate) {
        return { used: 0, available: 0, percentage: 0 };
      }
      
      const estimate = await navigator.storage.estimate();
      const used = estimate.usage || 0;
      const available = estimate.quota || 0;
      const percentage = available > 0 ? Math.round((used / available) * 100) : 0;
      
      return {
        used: Math.round(used / (1024 * 1024)), // MB
        available: Math.round(available / (1024 * 1024)), // MB
        percentage
      };
    } catch (error) {
      loggingService.logError(error, 'Failed to get storage stats');
      return { used: 0, available: 0, percentage: 0 };
    }
  }

  /**
   * Clean up old offline data
   */
  async cleanupOldData(maxAge = 30) { // 30 days default
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - maxAge);
      
      const transaction = this.db.transaction(['tours'], 'readwrite');
      const store = transaction.objectStore('tours');
      const index = store.index('lastAccessed');
      
      const cursor = await index.openCursor(IDBKeyRange.upperBound(cutoffDate));
      while (cursor) {
        const tour = cursor.value;
        await this.deleteOfflineTour(tour.id);
        cursor = await cursor.continue();
      }
      
      loggingService.addLog('INFO', `Cleaned up offline data older than ${maxAge} days`);
    } catch (error) {
      loggingService.logError(error, 'Failed to cleanup old data');
    }
  }
}

// Export singleton instance
export const offlineManager = new OfflineManager();
export default offlineManager;