import React, { useState, useEffect } from 'react';
import { useLiveBroadcast } from '../../hooks/useLiveBroadcast';

const LiveBroadcastReceiver = ({ tourId, driverId }) => {
  const {
    isActive,
    sessionId,
    status,
    error,
    audioChunks,
    getBroadcastStatus,
    clearError
  } = useLiveBroadcast('driver', tourId, driverId);

  const [broadcastStatus, setBroadcastStatus] = useState(null);
  const [audioEnabled, setAudioEnabled] = useState(true);

  // Get status periodically
  useEffect(() => {
    const interval = setInterval(async () => {
      const status = await getBroadcastStatus();
      setBroadcastStatus(status);
    }, 2000);

    return () => clearInterval(interval);
  }, [getBroadcastStatus]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600';
      case 'idle': return 'text-gray-600';
      case 'stopped': return 'text-orange-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return '🟢';
      case 'idle': return '⚪';
      case 'stopped': return '🟠';
      case 'error': return '🔴';
      default: return '⚫';
    }
  };

  const getStatusMessage = (status) => {
    switch (status) {
      case 'active': return 'Receiving live broadcast';
      case 'idle': return 'Waiting for broadcast';
      case 'stopped': return 'Broadcast ended';
      case 'error': return 'Connection error';
      default: return 'Connecting...';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Live Broadcast</h2>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            className={`p-2 rounded-md transition-colors ${
              audioEnabled 
                ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title={audioEnabled ? 'Mute audio' : 'Unmute audio'}
          >
            {audioEnabled ? '🔊' : '🔇'}
          </button>
          <div className="flex items-center space-x-2">
            <span className="text-sm">{getStatusIcon(status)}</span>
            <span className={`text-sm font-medium ${getStatusColor(status)}`}>
              {getStatusMessage(status)}
            </span>
          </div>
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

      <div className="space-y-4">
        <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
          <div className="text-sm text-gray-700">
            <div><strong>Tour ID:</strong> {tourId}</div>
            <div><strong>Driver ID:</strong> {driverId}</div>
            {sessionId && <div><strong>Session:</strong> {sessionId}</div>}
          </div>
        </div>

        {isActive && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-700 font-medium">Live Audio Active</span>
              </div>
              <div className="text-green-600 text-sm">
                Chunks received: {audioChunks}
              </div>
            </div>
          </div>
        )}

        {status === 'idle' && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 text-center">
            <div className="text-blue-700">
              <div className="text-lg mb-2">📡</div>
              <div className="font-medium">Waiting for broadcast to start</div>
              <div className="text-sm mt-1">You'll automatically receive audio when the admin starts broadcasting</div>
            </div>
          </div>
        )}

        {status === 'stopped' && (
          <div className="bg-orange-50 border border-orange-200 rounded-md p-4 text-center">
            <div className="text-orange-700">
              <div className="text-lg mb-2">⏹️</div>
              <div className="font-medium">Broadcast has ended</div>
              <div className="text-sm mt-1">The live broadcast session has been stopped</div>
            </div>
          </div>
        )}

        {broadcastStatus && (
          <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Connection Status</h3>
            <div className="text-xs text-gray-600 space-y-1">
              {broadcastStatus.broadcast && (
                <div>
                  <strong>Broadcast Status:</strong> {broadcastStatus.broadcast.status}
                </div>
              )}
              {broadcastStatus.driverQueue && (
                <>
                  <div><strong>Queue Status:</strong> {broadcastStatus.driverQueue.status}</div>
                  <div><strong>Queue Size:</strong> {broadcastStatus.driverQueue.queueSize}</div>
                  <div><strong>Total Received:</strong> {broadcastStatus.driverQueue.totalReceived}</div>
                </>
              )}
              {broadcastStatus.stats && (
                <div><strong>Active Broadcasts:</strong> {broadcastStatus.stats.activeBroadcasts}</div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 text-xs text-gray-500">
        <p><strong>How it works:</strong></p>
        <ul className="list-disc list-inside space-y-1 mt-1">
          <li>This component automatically listens for live broadcasts</li>
          <li>Audio will play automatically when received (if unmuted)</li>
          <li>The connection status shows real-time broadcast information</li>
          <li>Use the speaker icon to mute/unmute audio</li>
        </ul>
      </div>
    </div>
  );
};

export default LiveBroadcastReceiver;