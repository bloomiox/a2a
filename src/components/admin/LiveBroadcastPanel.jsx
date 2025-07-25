import React, { useState, useEffect } from 'react';
import { useLiveBroadcast } from '../../hooks/useLiveBroadcast';

const LiveBroadcastPanel = ({ tourId, driverId, adminId }) => {
  const [selectedTour, setSelectedTour] = useState(tourId || '');
  const [selectedDriver, setSelectedDriver] = useState(driverId || '');

  const {
    isActive,
    sessionId,
    status,
    error,
    isRecording,
    startBroadcast,
    stopBroadcast,
    startRecording,
    stopRecording,
    getBroadcastStatus,
    clearError
  } = useLiveBroadcast('admin', selectedTour, selectedDriver, adminId);

  const [broadcastStatus, setBroadcastStatus] = useState(null);

  // Get status periodically
  useEffect(() => {
    if (isActive) {
      const interval = setInterval(async () => {
        const status = await getBroadcastStatus();
        setBroadcastStatus(status);
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [isActive, getBroadcastStatus]);

  const handleStartBroadcast = async () => {
    if (!selectedTour || !selectedDriver) {
      alert('Please select both tour and driver');
      return;
    }

    const success = await startBroadcast();
    if (success) {
      // Auto-start recording after broadcast starts
      setTimeout(() => {
        startRecording();
      }, 500);
    }
  };

  const handleStopBroadcast = async () => {
    await stopBroadcast();
    setBroadcastStatus(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600';
      case 'starting': return 'text-yellow-600';
      case 'stopping': return 'text-orange-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return '🟢';
      case 'starting': return '🟡';
      case 'stopping': return '🟠';
      case 'error': return '🔴';
      default: return '⚪';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Live Broadcast Control</h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm">{getStatusIcon(status)}</span>
          <span className={`text-sm font-medium ${getStatusColor(status)}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-red-500 mr-2">⚠️</span>
              <span className="text-red-700 text-sm">{error}</span>
            </div>
            <button
              onClick={clearError}
              className="text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {!isActive ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tour ID
              </label>
              <input
                type="text"
                value={selectedTour}
                onChange={(e) => setSelectedTour(e.target.value)}
                placeholder="Enter tour ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Driver ID
              </label>
              <input
                type="text"
                value={selectedDriver}
                onChange={(e) => setSelectedDriver(e.target.value)}
                placeholder="Enter driver ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            onClick={handleStartBroadcast}
            disabled={!selectedTour || !selectedDriver || status === 'starting'}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-md transition-colors"
          >
            {status === 'starting' ? 'Starting Broadcast...' : 'Start Live Broadcast'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="text-sm text-green-700">
              <div><strong>Session ID:</strong> {sessionId}</div>
              <div><strong>Tour:</strong> {selectedTour}</div>
              <div><strong>Driver:</strong> {selectedDriver}</div>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`flex-1 font-medium py-3 px-4 rounded-md transition-colors ${
                isRecording
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isRecording ? '🎤 Stop Recording' : '🎤 Start Recording'}
            </button>

            <button
              onClick={handleStopBroadcast}
              disabled={status === 'stopping'}
              className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-md transition-colors"
            >
              {status === 'stopping' ? 'Stopping...' : 'End Broadcast'}
            </button>
          </div>

          {broadcastStatus && (
            <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Broadcast Status</h3>
              <div className="text-xs text-gray-600 space-y-1">
                {broadcastStatus.session && (
                  <div>
                    <strong>Total Chunks:</strong> {broadcastStatus.session.totalChunks}
                  </div>
                )}
                {broadcastStatus.stats && (
                  <>
                    <div><strong>Active Broadcasts:</strong> {broadcastStatus.stats.activeBroadcasts}</div>
                    <div><strong>Active Sessions:</strong> {broadcastStatus.stats.activeSessions}</div>
                    <div><strong>Driver Queues:</strong> {broadcastStatus.stats.activeDriverQueues}</div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 text-xs text-gray-500">
        <p><strong>Instructions:</strong></p>
        <ul className="list-disc list-inside space-y-1 mt-1">
          <li>Enter the tour ID and driver ID to start a broadcast</li>
          <li>Click "Start Live Broadcast" to begin the session</li>
          <li>Use "Start Recording" to begin transmitting audio</li>
          <li>The driver will automatically receive audio chunks</li>
          <li>Click "End Broadcast" to stop the session</li>
        </ul>
      </div>
    </div>
  );
};

export default LiveBroadcastPanel;