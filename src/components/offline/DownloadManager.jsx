import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, Trash2, HardDrive, Wifi, WifiOff } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import offlineManager from '@/services/OfflineManager';

const DownloadManager = ({ tourId, tourTitle, onDownloadComplete }) => {
  const [downloadStatus, setDownloadStatus] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [storageStats, setStorageStats] = useState({ used: 0, available: 0, percentage: 0 });
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    loadDownloadStatus();
    loadStorageStats();

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [tourId]);

  const loadDownloadStatus = async () => {
    try {
      const status = await offlineManager.getDownloadStatus(tourId);
      setDownloadStatus(status);
      
      if (status?.download_progress) {
        setProgress(status.download_progress);
      }
    } catch (error) {
      console.error('Failed to load download status:', error);
    }
  };

  const loadStorageStats = async () => {
    try {
      const stats = await offlineManager.getStorageStats();
      setStorageStats(stats);
    } catch (error) {
      console.error('Failed to load storage stats:', error);
    }
  };

  const handleDownload = async () => {
    if (!isOnline) {
      toast({
        title: "No Internet Connection",
        description: "Please connect to the internet to download tours.",
        variant: "destructive",
      });
      return;
    }

    setIsDownloading(true);
    setProgress(0);

    try {
      await offlineManager.downloadTour(tourId, (progressValue, downloadRecord) => {
        setProgress(progressValue);
        
        // Update UI with download info
        if (downloadRecord) {
          const sizeMB = Math.round(downloadRecord.downloadedSize / (1024 * 1024));
          const totalMB = Math.round(downloadRecord.totalSize / (1024 * 1024));
          
          toast({
            title: "Downloading...",
            description: `${sizeMB}MB / ${totalMB}MB (${progressValue}%)`,
          });
        }
      });

      setDownloadStatus({
        download_status: 'completed',
        download_progress: 100,
        downloaded_at: new Date().toISOString()
      });

      toast({
        title: "Download Complete",
        description: `${tourTitle} is now available offline.`,
      });

      if (onDownloadComplete) {
        onDownloadComplete();
      }

      // Refresh storage stats
      await loadStorageStats();
    } catch (error) {
      console.error('Download failed:', error);
      toast({
        title: "Download Failed",
        description: error.message || "Failed to download tour. Please try again.",
        variant: "destructive",
      });
      
      setDownloadStatus({
        download_status: 'failed',
        download_progress: 0
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await offlineManager.deleteOfflineTour(tourId);
      
      setDownloadStatus(null);
      setProgress(0);
      
      toast({
        title: "Tour Deleted",
        description: `${tourTitle} has been removed from offline storage.`,
      });

      // Refresh storage stats
      await loadStorageStats();
    } catch (error) {
      console.error('Delete failed:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete offline tour. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = () => {
    if (!downloadStatus) {
      return <Badge variant="outline">Not Downloaded</Badge>;
    }

    switch (downloadStatus.download_status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500">Downloaded</Badge>;
      case 'downloading':
        return <Badge variant="default" className="bg-blue-500">Downloading</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'expired':
        return <Badge variant="outline">Expired</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getStorageColor = () => {
    if (storageStats.percentage < 70) return 'bg-green-500';
    if (storageStats.percentage < 90) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const isDownloaded = downloadStatus?.download_status === 'completed';
  const canDownload = !isDownloading && !isDownloaded && isOnline;
  const canDelete = isDownloaded && !isDownloading;

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <span className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
            Offline Download
          </span>
          {getStatusBadge()}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Download Progress */}
        {(isDownloading || downloadStatus?.download_status === 'downloading') && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Downloading...</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}

        {/* Download Actions */}
        <div className="flex gap-2">
          {canDownload && (
            <Button 
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              Download for Offline
            </Button>
          )}
          
          {canDelete && (
            <Button 
              onClick={handleDelete}
              variant="outline"
              className="flex-1"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remove Download
            </Button>
          )}
        </div>

        {/* Download Info */}
        {isDownloaded && downloadStatus?.downloaded_at && (
          <div className="text-sm text-muted-foreground">
            Downloaded on {new Date(downloadStatus.downloaded_at).toLocaleDateString()}
          </div>
        )}

        {/* Storage Stats */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <HardDrive className="h-4 w-4" />
              Storage Used
            </span>
            <span>{storageStats.used}MB / {storageStats.available}MB</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${getStorageColor()}`}
              style={{ width: `${storageStats.percentage}%` }}
            />
          </div>
          {storageStats.percentage > 90 && (
            <div className="text-sm text-red-600">
              Storage is almost full. Consider removing some offline tours.
            </div>
          )}
        </div>

        {/* Offline Notice */}
        {!isOnline && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <div className="flex items-center gap-2 text-yellow-800">
              <WifiOff className="h-4 w-4" />
              <span className="text-sm">
                You're offline. {isDownloaded ? 'This tour is available offline.' : 'Connect to internet to download tours.'}
              </span>
            </div>
          </div>
        )}

        {/* Download Benefits */}
        {!isDownloaded && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <div className="text-sm text-blue-800">
              <div className="font-medium mb-1">Benefits of offline download:</div>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Access tours without internet connection</li>
                <li>Save mobile data usage</li>
                <li>Faster loading and smoother playback</li>
                <li>Works in areas with poor connectivity</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DownloadManager;