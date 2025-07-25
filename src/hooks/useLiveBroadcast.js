import { useState, useEffect, useCallback, useRef } from 'react';
import { audioRelay } from '../api/functions';

/**
 * Custom hook for managing live broadcast functionality
 * Supports both admin (sending) and driver (receiving) modes
 */
export const useLiveBroadcast = (mode = 'driver', tourId, driverId, adminId) => {
  const [isActive, setIsActive] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [isRecording, setIsRecording] = useState(false);

  // Refs for audio handling
  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const pollingIntervalRef = useRef(null);

  /**
   * Start a new broadcast session (admin only)
   */
  const startBroadcast = useCallback(async () => {
    if (mode !== 'admin') {
      setError('Only admin can start broadcasts');
      return false;
    }

    try {
      setError(null);
      setStatus('starting');

      const response = await audioRelay({
        action: 'startBroadcast',
        tourId,
        driverId,
        adminId
      });

      if (response.data.success) {
        setSessionId(response.data.sessionId);
        setIsActive(true);
        setStatus('active');
        console.log('✅ Broadcast started:', response.data.sessionId);
        return true;
      } else {
        throw new Error(response.data.error);
      }
    } catch (err) {
      console.error('❌ Failed to start broadcast:', err);
      setError(err.message);
      setStatus('error');
      return false;
    }
  }, [mode, tourId, driverId, adminId]);

  /**
   * Stop the current broadcast session
   */
  const stopBroadcast = useCallback(async () => {
    try {
      setError(null);
      setStatus('stopping');

      // Stop recording if active
      if (isRecording && mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
      }

      // Stop polling if active
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }

      const response = await audioRelay({
        action: 'stopBroadcast',
        sessionId,
        tourId
      });

      if (response.data.success) {
        setIsActive(false);
        setSessionId(null);
        setStatus('idle');
        setAudioChunks([]);
        console.log('🛑 Broadcast stopped');
        return true;
      } else {
        throw new Error(response.data.error);
      }
    } catch (err) {
      console.error('❌ Failed to stop broadcast:', err);
      setError(err.message);
      setStatus('error');
      return false;
    }
  }, [sessionId, tourId, isRecording]);

  /**
   * Start recording audio (admin only)
   */
  const startRecording = useCallback(async () => {
    if (mode !== 'admin' || !sessionId) {
      setError('Cannot start recording: not in admin mode or no active session');
      return false;
    }

    try {
      setError(null);

      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });

      // Create media recorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current = mediaRecorder;

      // Handle data available
      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0 && sessionId) {
          try {
            // Convert blob to array buffer
            const arrayBuffer = await event.data.arrayBuffer();
            const audioData = new Uint8Array(arrayBuffer);

            // Send audio chunk
            const response = await audioRelay({
              action: 'sendAudio',
              sessionId,
              audioData: Array.from(audioData),
              mimeType: event.data.type
            });

            if (!response.data.success) {
              console.error('Failed to send audio chunk:', response.data.error);
            }
          } catch (err) {
            console.error('Error processing audio chunk:', err);
          }
        }
      };

      // Start recording with small chunks for real-time streaming
      mediaRecorder.start(250); // 250ms chunks
      setIsRecording(true);
      console.log('🎤 Recording started');
      return true;

    } catch (err) {
      console.error('❌ Failed to start recording:', err);
      setError(err.message);
      return false;
    }
  }, [mode, sessionId]);

  /**
   * Stop recording audio
   */
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      
      // Stop all tracks
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
      
      setIsRecording(false);
      console.log('🎤 Recording stopped');
    }
  }, [isRecording]);

  /**
   * Start polling for audio chunks (driver only)
   */
  const startPolling = useCallback(() => {
    if (mode !== 'driver' || pollingIntervalRef.current) {
      return;
    }

    const pollForAudio = async () => {
      try {
        const response = await audioRelay({
          action: 'getAudio',
          driverId,
          tourId
        });

        if (response.data.success) {
          const { chunks, status: broadcastStatus, sessionId: currentSessionId } = response.data;

          // Update status
          setStatus(broadcastStatus);
          setSessionId(currentSessionId);
          setIsActive(broadcastStatus === 'active');

          // Process new audio chunks
          if (chunks && chunks.length > 0) {
            setAudioChunks(prev => [...prev, ...chunks]);
            console.log(`📱 Received ${chunks.length} audio chunks`);
          }

          // Stop polling if broadcast ended
          if (broadcastStatus === 'stopped' || broadcastStatus === 'idle') {
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
          }
        }
      } catch (err) {
        console.error('Error polling for audio:', err);
        setError(err.message);
      }
    };

    // Start polling every 500ms
    pollingIntervalRef.current = setInterval(pollForAudio, 500);
    console.log('📡 Started polling for audio');
  }, [mode, driverId, tourId]);

  /**
   * Stop polling for audio chunks
   */
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
      console.log('📡 Stopped polling for audio');
    }
  }, []);

  /**
   * Play received audio chunks (driver only)
   */
  const playAudioChunks = useCallback(async (chunks) => {
    if (!chunks || chunks.length === 0) return;

    try {
      // Create audio context if needed
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }

      const audioContext = audioContextRef.current;

      // Process each chunk
      for (const chunk of chunks) {
        try {
          // Convert array back to Uint8Array
          const audioData = new Uint8Array(chunk.audioData);
          
          // Create blob and URL
          const blob = new Blob([audioData], { type: chunk.mimeType });
          const audioUrl = URL.createObjectURL(blob);
          
          // Create and play audio element
          const audio = new Audio(audioUrl);
          audio.volume = 1.0;
          
          await new Promise((resolve, reject) => {
            audio.onended = resolve;
            audio.onerror = reject;
            audio.play().catch(reject);
          });

          // Clean up
          URL.revokeObjectURL(audioUrl);
          
        } catch (err) {
          console.error('Error playing audio chunk:', err);
        }
      }
    } catch (err) {
      console.error('Error setting up audio playback:', err);
      setError(err.message);
    }
  }, []);

  /**
   * Get broadcast status
   */
  const getBroadcastStatus = useCallback(async () => {
    try {
      const response = await audioRelay({
        action: 'getBroadcastStatus',
        tourId,
        sessionId,
        driverId
      });

      return response.data;
    } catch (err) {
      console.error('Error getting broadcast status:', err);
      return { success: false, error: err.message };
    }
  }, [tourId, sessionId, driverId]);

  // Auto-start polling for drivers
  useEffect(() => {
    if (mode === 'driver' && tourId && driverId) {
      startPolling();
    }

    return () => {
      stopPolling();
    };
  }, [mode, tourId, driverId, startPolling, stopPolling]);

  // Auto-play received audio chunks
  useEffect(() => {
    if (mode === 'driver' && audioChunks.length > 0) {
      const newChunks = audioChunks.slice(-10); // Play last 10 chunks
      playAudioChunks(newChunks);
      
      // Clear old chunks to prevent memory buildup
      if (audioChunks.length > 50) {
        setAudioChunks(prev => prev.slice(-25));
      }
    }
  }, [mode, audioChunks, playAudioChunks]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
      stopPolling();
      
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stopRecording, stopPolling]);

  return {
    // State
    isActive,
    sessionId,
    status,
    error,
    isRecording,
    audioChunks: audioChunks.length,

    // Actions
    startBroadcast,
    stopBroadcast,
    startRecording,
    stopRecording,
    getBroadcastStatus,

    // Utils
    clearError: () => setError(null)
  };
};