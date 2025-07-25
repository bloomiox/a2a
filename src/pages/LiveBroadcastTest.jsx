import React, { useState } from 'react';
import LiveBroadcastPanel from '../components/admin/LiveBroadcastPanel';
import LiveBroadcastReceiver from '../components/driver/LiveBroadcastReceiver';
import BroadcastDebugPanel from '../components/debug/BroadcastDebugPanel';

const LiveBroadcastTest = () => {
  const [testTourId, setTestTourId] = useState('test-tour-123');
  const [testDriverId, setTestDriverId] = useState('test-driver-456');
  const [testAdminId, setTestAdminId] = useState('test-admin-789');
  const [activeTab, setActiveTab] = useState('admin');

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Live Broadcast Test
          </h1>
          <p className="text-gray-600">
            Test the improved live broadcast functionality between admin and driver
          </p>
        </div>

        {/* Test Configuration */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Test Configuration</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tour ID
              </label>
              <input
                type="text"
                value={testTourId}
                onChange={(e) => setTestTourId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Driver ID
              </label>
              <input
                type="text"
                value={testDriverId}
                onChange={(e) => setTestDriverId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin ID
              </label>
              <input
                type="text"
                value={testAdminId}
                onChange={(e) => setTestAdminId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('admin')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'admin'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Admin Panel
              </button>
              <button
                onClick={() => setActiveTab('driver')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'driver'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Driver View
              </button>
              <button
                onClick={() => setActiveTab('both')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'both'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Side by Side
              </button>
              <button
                onClick={() => setActiveTab('debug')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'debug'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Debug
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'admin' && (
              <LiveBroadcastPanel
                tourId={testTourId}
                driverId={testDriverId}
                adminId={testAdminId}
              />
            )}

            {activeTab === 'driver' && (
              <LiveBroadcastReceiver
                tourId={testTourId}
                driverId={testDriverId}
              />
            )}

            {activeTab === 'both' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-4">Admin Panel</h3>
                  <LiveBroadcastPanel
                    tourId={testTourId}
                    driverId={testDriverId}
                    adminId={testAdminId}
                  />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-4">Driver View</h3>
                  <LiveBroadcastReceiver
                    tourId={testTourId}
                    driverId={testDriverId}
                  />
                </div>
              </div>
            )}

            {activeTab === 'debug' && (
              <BroadcastDebugPanel />
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-blue-800 mb-4">
            Testing Instructions
          </h2>
          <div className="text-blue-700 space-y-2">
            <p><strong>1. Setup:</strong> Configure the Tour ID, Driver ID, and Admin ID above</p>
            <p><strong>2. Admin Panel:</strong> Use the admin panel to start a broadcast and begin recording</p>
            <p><strong>3. Driver View:</strong> The driver view will automatically receive and play audio</p>
            <p><strong>4. Side by Side:</strong> Use the "Side by Side" tab to see both interfaces simultaneously</p>
          </div>
          
          <div className="mt-4 p-4 bg-blue-100 rounded-md">
            <h3 className="font-medium text-blue-800 mb-2">Key Improvements:</h3>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>✅ Reliable session management with automatic cleanup</li>
              <li>✅ Better error handling and status reporting</li>
              <li>✅ Automatic driver queue creation when joining active broadcasts</li>
              <li>✅ Real-time status monitoring and debugging information</li>
              <li>✅ Proper audio chunk streaming with memory management</li>
              <li>✅ Graceful broadcast stopping with final chunk delivery</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveBroadcastTest;