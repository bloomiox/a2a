/**
 * Enhanced Live Broadcast Service
 * Provides reliable real-time audio streaming between admin and drivers
 */

class LiveBroadcastService {
  constructor() {
    // Core storage
    this.sessions = new Map(); // sessionId -> SessionData
    this.driverQueues = new Map(); // driverId -> QueueData
    this.tourBroadcasts = new Map(); // tourId -> BroadcastData
    
    // Configuration
    this.config = {
      maxChunksPerQueue: 30,
      cleanupInterval: 5 * 60 * 1000, // 5 minutes
      sessionTimeout: 10 * 60 * 1000, // 10 minutes
      chunkTimeout: 30 * 1000, // 30 seconds
      maxChunkSize: 1024 * 1024, // 1MB
    };

    // Start cleanup process
    this.startCleanupProcess();
  }

  /**
   * Start a new broadcast session
   */
  startBroadcast(tourId, driverId, adminId) {
    try {
      const sessionId = this.generateSessionId();
      const now = Date.now();

      // Create session
      const sessionData = {
        id: sessionId,
        tourId,
        driverId,
        adminId,
        status: 'active',
        startTime: now,
        lastActivity: now,
        chunks: [],
        totalChunks: 0
      };

      // Create driver queue
      const queueData = {
        driverId,
        sessionId,
        tourId,
        status: 'active',
        chunks: [],
        lastPoll: now,
        totalReceived: 0
      };

      // Create broadcast tracking
      const broadcastData = {
        tourId,
        sessionId,
        driverId,
        adminId,
        status: 'active',
        startTime: now
      };

      // Store data
      this.sessions.set(sessionId, sessionData);
      this.driverQueues.set(driverId, queueData);
      this.tourBroadcasts.set(tourId, broadcastData);

      console.log(`✅ Broadcast started: session=${sessionId}, tour=${tourId}, driver=${driverId}`);
      console.log(`📊 Service state: sessions=${this.sessions.size}, queues=${this.driverQueues.size}, broadcasts=${this.tourBroadcasts.size}`);
      console.log(`📋 Active tour broadcasts:`, Array.from(this.tourBroadcasts.keys()));

      return {
        success: true,
        sessionId,
        message: 'Broadcast started successfully'
      };
    } catch (error) {
      console.error('❌ Error starting broadcast:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send audio chunk to driver
   */
  sendAudioChunk(sessionId, audioData, mimeType = 'audio/webm') {
    try {
      if (!sessionId || !audioData) {
        throw new Error('Missing sessionId or audioData');
      }

      // Debug: Log current sessions
      console.log(`🔍 Looking for session ${sessionId}. Available sessions:`, Array.from(this.sessions.keys()));
      console.log(`🔍 Total sessions: ${this.sessions.size}, Total broadcasts: ${this.tourBroadcasts.size}`);

      // Validate session
      const session = this.sessions.get(sessionId);
      if (!session) {
        // Try to find session by looking through all sessions
        let foundSession = null;
        for (const [id, sess] of this.sessions.entries()) {
          if (id === sessionId) {
            foundSession = sess;
            break;
          }
        }
        
        if (!foundSession) {
          console.error(`❌ Session ${sessionId} not found. Available sessions:`, Array.from(this.sessions.keys()));
          throw new Error(`Session ${sessionId} not found`);
        }
      }

      if (session.status !== 'active') {
        throw new Error(`Session ${sessionId} is not active (status: ${session.status})`);
      }

      // Validate chunk size
      if (audioData.length > this.config.maxChunkSize) {
        throw new Error(`Audio chunk too large: ${audioData.length} bytes`);
      }

      // Create chunk
      const chunk = {
        id: this.generateChunkId(),
        sessionId,
        audioData,
        mimeType,
        timestamp: Date.now(),
        size: audioData.length
      };

      // Update session
      session.chunks.push(chunk);
      session.lastActivity = Date.now();
      session.totalChunks++;

      // Limit session chunks
      if (session.chunks.length > this.config.maxChunksPerQueue) {
        session.chunks = session.chunks.slice(-this.config.maxChunksPerQueue);
      }

      // Add to driver queue
      const driverQueue = this.driverQueues.get(session.driverId);
      if (driverQueue) {
        driverQueue.chunks.push(chunk);
        driverQueue.totalReceived++;

        // Limit queue chunks
        if (driverQueue.chunks.length > this.config.maxChunksPerQueue) {
          driverQueue.chunks = driverQueue.chunks.slice(-this.config.maxChunksPerQueue);
        }
      }

      console.log(`📡 Audio chunk sent: session=${sessionId}, size=${chunk.size}, queue=${driverQueue?.chunks.length || 0}`);

      return {
        success: true,
        chunkId: chunk.id,
        queueSize: driverQueue?.chunks.length || 0,
        message: 'Audio chunk sent successfully'
      };
    } catch (error) {
      console.error('❌ Error sending audio chunk:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get audio chunks for driver
   */
  getAudioChunks(driverId, tourId) {
    try {
      const now = Date.now();

      // Get or create driver queue
      let driverQueue = this.driverQueues.get(driverId);
      
      // Check for active broadcast if no queue exists
      if (!driverQueue) {
        console.log(`🔍 No queue for driver ${driverId}, checking for active broadcast on tour ${tourId}`);
        console.log(`📋 Available broadcasts:`, Array.from(this.tourBroadcasts.keys()));
        console.log(`📋 All broadcast details:`, Array.from(this.tourBroadcasts.entries()));
        
        const broadcast = this.tourBroadcasts.get(tourId);
        console.log(`🎯 Broadcast for tour ${tourId}:`, broadcast);
        
        if (broadcast && broadcast.status === 'active') {
          // Driver joining active broadcast
          driverQueue = {
            driverId,
            sessionId: broadcast.sessionId,
            tourId,
            status: 'active',
            chunks: [],
            lastPoll: now,
            totalReceived: 0
          };
          this.driverQueues.set(driverId, driverQueue);
          console.log(`👤 Driver ${driverId} joined active broadcast for tour ${tourId}`);
        } else {
          console.log(`❌ No active broadcast found for tour ${tourId}`);
        }
      }

      if (!driverQueue) {
        return {
          success: true,
          chunks: [],
          status: 'idle',
          message: 'No active broadcast',
          sessionId: null
        };
      }

      // Update last poll time
      driverQueue.lastPoll = now;

      // Get chunks to send
      const chunksToSend = [...driverQueue.chunks];
      
      // Clear queue (chunks sent once)
      driverQueue.chunks = [];

      console.log(`📱 Driver ${driverId} received ${chunksToSend.length} chunks`);

      return {
        success: true,
        chunks: chunksToSend,
        status: driverQueue.status,
        sessionId: driverQueue.sessionId,
        message: chunksToSend.length > 0 
          ? `${chunksToSend.length} audio chunks available` 
          : 'No new audio chunks'
      };
    } catch (error) {
      console.error('❌ Error getting audio chunks:', error);
      return {
        success: false,
        error: error.message,
        chunks: [],
        status: 'error'
      };
    }
  }

  /**
   * Stop broadcast
   */
  stopBroadcast(sessionId, tourId) {
    try {
      let session = null;
      let broadcast = null;

      // Find session by ID or tour ID
      if (sessionId) {
        session = this.sessions.get(sessionId);
      } else if (tourId) {
        broadcast = this.tourBroadcasts.get(tourId);
        if (broadcast) {
          session = this.sessions.get(broadcast.sessionId);
          sessionId = broadcast.sessionId;
        }
      }

      if (!session) {
        throw new Error('Session not found');
      }

      // Update session status
      session.status = 'stopped';
      session.lastActivity = Date.now();

      // Update driver queue status
      const driverQueue = this.driverQueues.get(session.driverId);
      if (driverQueue) {
        driverQueue.status = 'stopped';
      }

      // Update broadcast status
      if (session.tourId) {
        const tourBroadcast = this.tourBroadcasts.get(session.tourId);
        if (tourBroadcast) {
          tourBroadcast.status = 'stopped';
        }
      }

      console.log(`🛑 Broadcast stopped: session=${sessionId}, tour=${session.tourId}`);

      // Schedule cleanup
      setTimeout(() => {
        this.cleanupSession(sessionId);
      }, 30000); // 30 seconds delay

      return {
        success: true,
        sessionId,
        message: 'Broadcast stopped successfully'
      };
    } catch (error) {
      console.error('❌ Error stopping broadcast:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get broadcast status
   */
  getBroadcastStatus(tourId, sessionId, driverId) {
    try {
      const broadcast = tourId ? this.tourBroadcasts.get(tourId) : null;
      const session = sessionId ? this.sessions.get(sessionId) : null;
      const driverQueue = driverId ? this.driverQueues.get(driverId) : null;

      return {
        success: true,
        broadcast: broadcast ? {
          tourId: broadcast.tourId,
          sessionId: broadcast.sessionId,
          status: broadcast.status,
          startTime: broadcast.startTime
        } : null,
        session: session ? {
          id: session.id,
          status: session.status,
          startTime: session.startTime,
          lastActivity: session.lastActivity,
          totalChunks: session.totalChunks
        } : null,
        driverQueue: driverQueue ? {
          driverId: driverQueue.driverId,
          status: driverQueue.status,
          queueSize: driverQueue.chunks.length,
          lastPoll: driverQueue.lastPoll,
          totalReceived: driverQueue.totalReceived
        } : null,
        stats: {
          activeBroadcasts: this.tourBroadcasts.size,
          activeSessions: this.sessions.size,
          activeDriverQueues: this.driverQueues.size
        }
      };
    } catch (error) {
      console.error('❌ Error getting broadcast status:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get active tours with broadcasts
   */
  getActiveBroadcasts() {
    try {
      const activeBroadcasts = [];
      
      for (const [tourId, broadcast] of this.tourBroadcasts.entries()) {
        if (broadcast.status === 'active') {
          const session = this.sessions.get(broadcast.sessionId);
          activeBroadcasts.push({
            tourId,
            sessionId: broadcast.sessionId,
            driverId: broadcast.driverId,
            adminId: broadcast.adminId,
            startTime: broadcast.startTime,
            lastActivity: session?.lastActivity || broadcast.startTime,
            totalChunks: session?.totalChunks || 0
          });
        }
      }

      return {
        success: true,
        broadcasts: activeBroadcasts
      };
    } catch (error) {
      console.error('❌ Error getting active broadcasts:', error);
      return {
        success: false,
        error: error.message,
        broadcasts: []
      };
    }
  }

  /**
   * Cleanup old sessions and queues
   */
  startCleanupProcess() {
    setInterval(() => {
      this.performCleanup();
    }, this.config.cleanupInterval);
  }

  performCleanup() {
    const now = Date.now();
    let cleaned = 0;

    // Clean up old sessions
    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.lastActivity > this.config.sessionTimeout) {
        this.cleanupSession(sessionId);
        cleaned++;
      }
    }

    // Clean up old driver queues
    for (const [driverId, queue] of this.driverQueues.entries()) {
      if (now - queue.lastPoll > this.config.sessionTimeout) {
        this.driverQueues.delete(driverId);
        cleaned++;
      }
    }

    // Clean up old broadcasts
    for (const [tourId, broadcast] of this.tourBroadcasts.entries()) {
      if (broadcast.status === 'stopped' && now - broadcast.startTime > this.config.sessionTimeout) {
        this.tourBroadcasts.delete(tourId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Cleaned up ${cleaned} old broadcast items`);
    }
  }

  cleanupSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      this.sessions.delete(sessionId);
      this.driverQueues.delete(session.driverId);
      this.tourBroadcasts.delete(session.tourId);
      console.log(`🗑️ Cleaned up session ${sessionId}`);
    }
  }

  generateSessionId() {
    return 'session-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
  }

  generateChunkId() {
    return 'chunk-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
  }

  /**
   * Force a driver to join any active broadcast (for testing/troubleshooting)
   */
  forceDriverToBroadcast(driverId, sessionId) {
    try {
      const session = this.sessions.get(sessionId);
      if (!session || session.status !== 'active') {
        throw new Error(`Session ${sessionId} not found or not active`);
      }

      // Create or update driver queue
      const queueData = {
        driverId,
        sessionId,
        tourId: session.tourId,
        status: 'active',
        chunks: [],
        lastPoll: Date.now(),
        totalReceived: 0
      };

      this.driverQueues.set(driverId, queueData);
      console.log(`🔧 Force-connected driver ${driverId} to session ${sessionId} (tour: ${session.tourId})`);

      return {
        success: true,
        message: `Driver ${driverId} connected to broadcast`,
        sessionId,
        tourId: session.tourId
      };
    } catch (error) {
      console.error('❌ Error forcing driver to broadcast:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get active broadcast for a specific tour
   */
  getActiveBroadcastForTour(tourId) {
    const broadcast = this.tourBroadcasts.get(tourId);
    if (broadcast && broadcast.status === 'active') {
      const session = this.sessions.get(broadcast.sessionId);
      return {
        tourId,
        sessionId: broadcast.sessionId,
        driverId: broadcast.driverId,
        adminId: broadcast.adminId,
        status: broadcast.status,
        startTime: broadcast.startTime,
        session: session ? {
          totalChunks: session.totalChunks,
          lastActivity: session.lastActivity
        } : null
      };
    }
    return null;
  }

  /**
   * Debug method to get current service state
   */
  getDebugInfo() {
    return {
      sessions: Array.from(this.sessions.entries()).map(([id, session]) => ({
        id,
        status: session.status,
        tourId: session.tourId,
        driverId: session.driverId,
        startTime: session.startTime,
        lastActivity: session.lastActivity,
        totalChunks: session.totalChunks
      })),
      driverQueues: Array.from(this.driverQueues.entries()).map(([id, queue]) => ({
        driverId: id,
        sessionId: queue.sessionId,
        status: queue.status,
        queueSize: queue.chunks.length,
        lastPoll: queue.lastPoll,
        totalReceived: queue.totalReceived
      })),
      tourBroadcasts: Array.from(this.tourBroadcasts.entries()).map(([id, broadcast]) => ({
        tourId: id,
        sessionId: broadcast.sessionId,
        status: broadcast.status,
        startTime: broadcast.startTime
      })),
      stats: {
        totalSessions: this.sessions.size,
        totalQueues: this.driverQueues.size,
        totalBroadcasts: this.tourBroadcasts.size
      }
    };
  }
}

// Create singleton instance with proper singleton pattern
let liveBroadcastServiceInstance = null;

const getLiveBroadcastService = () => {
  if (!liveBroadcastServiceInstance) {
    liveBroadcastServiceInstance = new LiveBroadcastService();
    console.log('🔧 Created new LiveBroadcastService instance');
  }
  return liveBroadcastServiceInstance;
};

export default getLiveBroadcastService();