import React, { useState, useEffect } from 'react';
import { audioRelay } from '../../api/functions';

const BroadcastDebugPanel = () => {
  const [debugInfo, setDebugInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [tourLookup, setTourLookup] = useState('');
  const [tourBroadcast, setTourBroadcast] = useState(null);

  const fetchDebugInfo = async () => {
    setLoading(true);
    try {
      const response = await audioRelay({ action: 'getDebugInfo' });
      if (response.data.success) {
        setDebugInfo(response.data.debugInfo);
      }
    } catch (error) {
      console.error('Error fetching debug info:', error);
    } finally {
      setLoading(false);
    }
  };

  const runServiceTest = async () => {
    setTestResult({ status: 'running', message: 'Testing service...' });
    
    try {
      // Test 1: Start broadcast
      const startResponse = await audioRelay({
        action: 'startBroadcast',
        tourId: 'test-tour-123',
        driverId: 'test-driver-456',
        adminId: 'test-admin-789'
      });

      if (!startResponse.data.success) {
        throw new Error(`Start broadcast failed: ${startResponse.data.error}`);
      }

      const sessionId = startResponse.data.sessionId;
      console.log('✅ Test broadcast started:', sessionId);

      // Test 2: Send audio chunk
      const testAudioData = new Array(1000).fill(0).map(() => Math.floor(Math.random() * 255));
      const sendResponse = await audioRelay({
        action: 'sendAudio',
        sessionId,
        audioData: testAudioData,
        mimeType: 'audio/webm'
      });

      if (!sendResponse.data.success) {
        throw new Error(`Send audio failed: ${sendResponse.data.error}`);
      }

      console.log('✅ Test audio chunk sent');

      // Test 3: Get audio (driver side)
      const getResponse = await audioRelay({
        action: 'getAudio',
        driverId: 'test-driver-456',
        tourId: 'test-tour-123'
      });

      if (!getResponse.data.success) {
        throw new Error(`Get audio failed: ${getResponse.data.error}`);
      }

      console.log('✅ Test audio retrieved:', getResponse.data.chunks.length, 'chunks');

      // Test 4: Stop broadcast
      const stopResponse = await audioRelay({
        action: 'stopBroadcast',
        sessionId,
        tourId: 'test-tour-123'
      });

      if (!stopResponse.data.success) {
        throw new Error(`Stop broadcast failed: ${stopResponse.data.error}`);
      }

      console.log('✅ Test broadcast stopped');

      setTestResult({
        status: 'success',
        message: `All tests passed! Session: ${sessionId}`,
        details: {
          sessionId,
          audioChunks: getResponse.data.chunks.length,
          startTime: Date.now()
        }
      });

      // Refresh debug info
      fetchDebugInfo();

    } catch (error) {
      console.error('❌ Service test failed:', error);
      setTestResult({
        status: 'error',
        message: error.message,
        error: error
      });
    }
  };

  const lookupTourBroadcast = async () => {
    if (!tourLookup.trim()) return;
    
    try {
      const response = await audioRelay({
        action: 'getActiveBroadcastForTour',
        tourId: tourLookup.trim()
      });
      
      if (response.data.success) {
        setTourBroadcast(response.data.broadcast);
      } else {
        setTourBroadcast(null);
      }
    } catch (error) {
      console.error('Error looking up tour broadcast:', error);
      setTourBroadcast(null);
    }
  };

  const forceConnectDriver = async (driverId, sessionId) => {
    try {
      const response = await audioRelay({
        action: 'forceDriverToBroadcast',
        driverId,
        sessionId
      });
      
      if (response.data.success) {
        alert(`Success! Driver ${driverId} is now connected to session ${sessionId}`);
        fetchDebugInfo();
      } else {
        alert('Failed to connect driver: ' + response.data.error);
      }
    } catch (error) {
      console.error('Error force-connecting driver:', error);
      alert('Failed to connect driver: ' + error.message);
    }
  };

  useEffect(() => {
    fetchDebugInfo();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchDebugInfo, 2000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50';
      case 'stopped': return 'text-orange-600 bg-orange-50';
      case 'error': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Broadcast Debug Panel</h2>
        <div className="flex items-center space-x-3">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-600">Auto-refresh</span>
          </label>
          <button
            onClick={runServiceTest}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Test Service
          </button>
          <button
            onClick={fetchDebugInfo}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {testResult && (
        <div className={`p-4 rounded-md border ${
          testResult.status === 'success' ? 'bg-green-50 border-green-200' :
          testResult.status === 'error' ? 'bg-red-50 border-red-200' :
          'bg-yellow-50 border-yellow-200'
        }`}>
          <div className={`font-medium ${
            testResult.status === 'success' ? 'text-green-800' :
            testResult.status === 'error' ? 'text-red-800' :
            'text-yellow-800'
          }`}>
            Service Test {testResult.status === 'success' ? '✅' : testResult.status === 'error' ? '❌' : '⏳'}
          </div>
          <div className={`text-sm mt-1 ${
            testResult.status === 'success' ? 'text-green-700' :
            testResult.status === 'error' ? 'text-red-700' :
            'text-yellow-700'
          }`}>
            {testResult.message}
          </div>
          {testResult.details && (
            <div className="text-xs mt-2 font-mono text-gray-600">
              Session: {testResult.details.sessionId}<br/>
              Audio chunks: {testResult.details.audioChunks}
            </div>
          )}
        </div>
      )}

      {/* Tour Lookup */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <h3 className="text-lg font-medium text-blue-800 mb-3">Tour Broadcast Lookup</h3>
        <div className="flex space-x-3">
          <input
            type="text"
            value={tourLookup}
            onChange={(e) => setTourLookup(e.target.value)}
            placeholder="Enter tour ID (e.g., 0be6191a-93e5-472b-9a2c-d0a1c7af1c5c)"
            className="flex-1 px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={lookupTourBroadcast}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Lookup
          </button>
        </div>
        
        {tourBroadcast ? (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
            <div className="text-green-800 font-medium">✅ Active Broadcast Found</div>
            <div className="text-sm text-green-700 mt-1">
              <div><strong>Session:</strong> {tourBroadcast.sessionId}</div>
              <div><strong>Driver:</strong> {tourBroadcast.driverId}</div>
              <div><strong>Admin:</strong> {tourBroadcast.adminId}</div>
              <div><strong>Started:</strong> {formatTimestamp(tourBroadcast.startTime)}</div>
              {tourBroadcast.session && (
                <>
                  <div><strong>Total Chunks:</strong> {tourBroadcast.session.totalChunks}</div>
                  <div><strong>Last Activity:</strong> {formatTimestamp(tourBroadcast.session.lastActivity)}</div>
                </>
              )}
            </div>
          </div>
        ) : tourLookup && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="text-red-800 font-medium">❌ No Active Broadcast</div>
            <div className="text-sm text-red-700 mt-1">
              No active broadcast found for tour: {tourLookup}
            </div>
          </div>
        )}
      </div>

      {debugInfo && (
        <div className="space-y-6">
          {/* Connection Status */}
          {debugInfo.tourBroadcasts.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <h3 className="text-yellow-800 font-medium mb-2">🔗 Active Broadcasts</h3>
              {debugInfo.tourBroadcasts.map((broadcast) => (
                <div key={broadcast.tourId} className="text-sm text-yellow-700">
                  <div><strong>Tour:</strong> {broadcast.tourId}</div>
                  <div><strong>Session:</strong> {broadcast.sessionId}</div>
                  <div><strong>Status:</strong> {broadcast.status}</div>
                </div>
              ))}
              <div className="mt-2 text-xs text-yellow-600">
                ℹ️ If a driver is not receiving audio, make sure they're polling for one of these tour IDs
              </div>
            </div>
          )}

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="text-blue-800 font-medium">Active Sessions</div>
              <div className="text-2xl font-bold text-blue-600">{debugInfo.stats.totalSessions}</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="text-green-800 font-medium">Driver Queues</div>
              <div className="text-2xl font-bold text-green-600">{debugInfo.stats.totalQueues}</div>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-md p-4">
              <div className="text-purple-800 font-medium">Tour Broadcasts</div>
              <div className="text-2xl font-bold text-purple-600">{debugInfo.stats.totalBroadcasts}</div>
            </div>
          </div>

          {/* Sessions */}
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-3">Active Sessions</h3>
            {debugInfo.sessions.length > 0 ? (
              <div className="space-y-2">
                {debugInfo.sessions.map((session) => (
                  <div key={session.id} className="border border-gray-200 rounded-md p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-mono text-sm text-gray-600">{session.id}</div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                          {session.status}
                        </span>
                        {session.status === 'active' && (
                          <button
                            onClick={() => {
                              const driverId = prompt('Enter driver ID to force-connect to this broadcast:');
                              if (driverId) {
                                forceConnectDriver(driverId, session.id);
                              }
                            }}
                            className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                          >
                            Force Connect Driver
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600">
                      <div><strong>Tour:</strong> {session.tourId}</div>
                      <div><strong>Driver:</strong> {session.driverId}</div>
                      <div><strong>Started:</strong> {formatTimestamp(session.startTime)}</div>
                      <div><strong>Chunks:</strong> {session.totalChunks}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 text-center py-4">No active sessions</div>
            )}
          </div>

          {/* Driver Queues */}
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-3">Driver Queues</h3>
            {debugInfo.driverQueues.length > 0 ? (
              <div className="space-y-2">
                {debugInfo.driverQueues.map((queue) => (
                  <div key={queue.driverId} className="border border-gray-200 rounded-md p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-mono text-sm text-gray-600">{queue.driverId}</div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(queue.status)}`}>
                        {queue.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600">
                      <div><strong>Session:</strong> {queue.sessionId}</div>
                      <div><strong>Queue Size:</strong> {queue.queueSize}</div>
                      <div><strong>Total Received:</strong> {queue.totalReceived}</div>
                      <div><strong>Last Poll:</strong> {formatTimestamp(queue.lastPoll)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 text-center py-4">No driver queues</div>
            )}
          </div>

          {/* Tour Broadcasts */}
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-3">Tour Broadcasts</h3>
            {debugInfo.tourBroadcasts.length > 0 ? (
              <div className="space-y-2">
                {debugInfo.tourBroadcasts.map((broadcast) => (
                  <div key={broadcast.tourId} className="border border-gray-200 rounded-md p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-mono text-sm text-gray-600">{broadcast.tourId}</div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(broadcast.status)}`}>
                        {broadcast.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-gray-600">
                      <div><strong>Session:</strong> {broadcast.sessionId}</div>
                      <div><strong>Started:</strong> {formatTimestamp(broadcast.startTime)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 text-center py-4">No tour broadcasts</div>
            )}
          </div>
        </div>
      )}

      <div className="mt-6 text-xs text-gray-500">
        <p><strong>Debug Information:</strong></p>
        <ul className="list-disc list-inside space-y-1 mt-1">
          <li>Sessions: Active broadcast sessions with audio streaming</li>
          <li>Driver Queues: Audio queues for each driver receiving broadcasts</li>
          <li>Tour Broadcasts: Mapping of tours to their active broadcast sessions</li>
          <li>Use auto-refresh to monitor real-time changes</li>
        </ul>
      </div>
    </div>
  );
};

export default BroadcastDebugPanel;