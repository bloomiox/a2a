import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import offlineManager from '@/services/OfflineManager';

const OfflineIndicator = ({ className = "" }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      handleSync();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check for pending sync data on mount
    checkPendingSync();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const checkPendingSync = async () => {
    try {
      // This would check IndexedDB for pending sync items
      // For now, we'll simulate this
      const pendingCount = 0; // await offlineManager.getPendingSyncCount();
      setPendingSyncCount(pendingCount);
    } catch (error) {
      console.error('Failed to check pending sync:', error);
    }
  };

  const handleSync = async () => {
    if (!isOnline || isSyncing) return;

    setIsSyncing(true);
    
    try {
      await offlineManager.syncOfflineData();
      setLastSyncTime(new Date());
      setPendingSyncCount(0);
      
      toast({
        title: "Sync Complete",
        description: "Your offline data has been synchronized.",
      });
    } catch (error) {
      console.error('Sync failed:', error);
      toast({
        title: "Sync Failed",
        description: "Failed to sync offline data. Will retry automatically.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const formatLastSync = () => {
    if (!lastSyncTime) return 'Never';
    
    const now = new Date();
    const diff = now - lastSyncTime;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  // Simple indicator for header/navbar
  if (className.includes('simple')) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {isOnline ? (
          <Wifi className="h-4 w-4 text-green-500" />
        ) : (
          <WifiOff className="h-4 w-4 text-red-500" />
        )}
        {pendingSyncCount > 0 && (
          <Badge variant="outline" className="text-xs">
            {pendingSyncCount} pending
          </Badge>
        )}
      </div>
    );
  }

  // Full card component
  return (
    <Card className={`${className} ${!isOnline ? 'border-yellow-200 bg-yellow-50' : ''}`}>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isOnline ? (
              <div className="flex items-center gap-2 text-green-700">
                <Wifi className="h-5 w-5" />
                <div>
                  <div className="font-medium">Online</div>
                  <div className="text-xs text-green-600">
                    Last sync: {formatLastSync()}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-yellow-700">
                <WifiOff className="h-5 w-5" />
                <div>
                  <div className="font-medium">Offline</div>
                  <div className="text-xs text-yellow-600">
                    Working offline
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {pendingSyncCount > 0 && (
              <div className="flex items-center gap-1 text-orange-600">
                <AlertCircle className="h-4 w-4" />
                <span className="text-xs">{pendingSyncCount} pending</span>
              </div>
            )}
            
            {isOnline && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleSync}
                disabled={isSyncing}
                className="h-8"
              >
                {isSyncing ? (
                  <RefreshCw className="h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3" />
                )}
                <span className="ml-1 text-xs">Sync</span>
              </Button>
            )}
          </div>
        </div>

        {!isOnline && (
          <div className="mt-3 text-xs text-yellow-700">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <div>
                You're working offline. Changes will be synchronized when you're back online.
                {pendingSyncCount > 0 && (
                  <span className="block mt-1 font-medium">
                    {pendingSyncCount} items waiting to sync.
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {isOnline && pendingSyncCount > 0 && (
          <div className="mt-3 text-xs text-orange-700">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <div>
                You have {pendingSyncCount} items that need to be synchronized.
                <Button
                  size="sm"
                  variant="link"
                  onClick={handleSync}
                  disabled={isSyncing}
                  className="h-auto p-0 ml-1 text-orange-700 underline"
                >
                  Sync now
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OfflineIndicator;