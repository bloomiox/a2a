# Offline Mode Implementation Guide

## Overview

The AudioGuide app now supports offline mode, allowing users to download tours for offline playback. This feature ensures tours work seamlessly even in areas with poor connectivity.

## Features

### 1. Tour Downloads
- **Download Management**: Users can download entire tours including audio files, images, and tour data
- **Progress Tracking**: Real-time download progress with size information
- **Storage Management**: Monitor storage usage and clean up old downloads
- **Automatic Expiration**: Downloads can be set to expire after a certain period

### 2. Offline Storage
- **IndexedDB Integration**: Uses browser's IndexedDB for efficient offline storage
- **Content Caching**: Stores audio files, images, and tour metadata locally
- **Compression**: Optimizes storage usage through efficient data structures

### 3. Sync Capabilities
- **Automatic Sync**: Syncs user progress and interactions when back online
- **Conflict Resolution**: Handles data conflicts between offline and online states
- **Background Sync**: Syncs data in the background when connectivity is restored

## Implementation Details

### Database Schema

#### tour_downloads
```sql
CREATE TABLE tour_downloads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tour_id UUID NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
    download_status VARCHAR(50) NOT NULL DEFAULT 'pending',
    download_size_mb DECIMAL(10,2),
    download_progress INTEGER DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE,
    downloaded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### offline_content_cache
```sql
CREATE TABLE offline_content_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_id UUID NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
    content_type VARCHAR(50) NOT NULL, -- 'audio', 'image', 'data'
    file_path VARCHAR(500) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    checksum VARCHAR(64) NOT NULL,
    cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Core Components

#### OfflineManager Service
Location: `src/services/OfflineManager.js`

Main service handling offline functionality:
- Download management
- IndexedDB operations
- Sync coordination
- Storage optimization

Key methods:
- `downloadTour(tourId, progressCallback)` - Download a tour for offline use
- `getOfflineTour(tourId)` - Retrieve offline tour data
- `deleteOfflineTour(tourId)` - Remove offline tour
- `syncOfflineData()` - Sync offline data when online
- `getStorageStats()` - Get storage usage statistics

#### DownloadManager Component
Location: `src/components/offline/DownloadManager.jsx`

UI component for managing tour downloads:
- Download progress display
- Storage usage monitoring
- Download/delete actions
- Offline status indication

#### OfflineIndicator Component
Location: `src/components/offline/OfflineIndicator.jsx`

Status indicator showing:
- Online/offline status
- Sync status
- Pending sync count
- Manual sync trigger

## Usage Guide

### For Users

#### Downloading Tours
1. Navigate to a tour details page
2. Look for the "Offline Download" section in the sidebar
3. Click "Download for Offline" button
4. Monitor download progress
5. Tour will be available offline once download completes

#### Managing Downloads
- View storage usage in the download manager
- Remove old downloads to free up space
- Downloads automatically sync progress when back online

#### Offline Playback
- Downloaded tours work normally when offline
- All audio files and images are available
- User progress is tracked locally and synced later

### For Developers

#### Adding Offline Support to Components

```jsx
import offlineManager from '@/services/OfflineManager';
import OfflineIndicator from '@/components/offline/OfflineIndicator';

// Check if tour is available offline
const isOffline = await offlineManager.getOfflineTour(tourId);

// Add offline indicator
<OfflineIndicator className="simple" />
```

#### Handling Offline Data

```jsx
// Get offline tour data
const offlineTour = await offlineManager.getOfflineTour(tourId);

// Get offline audio file
const audioFile = await offlineManager.getOfflineAudio(trackId);

// Create blob URL for offline audio
const audioUrl = URL.createObjectURL(audioFile.blob);
```

#### Implementing Sync Logic

```jsx
// Listen for online events
window.addEventListener('online', () => {
  offlineManager.syncOfflineData();
});

// Manual sync trigger
await offlineManager.syncOfflineData();
```

## Configuration

### Storage Limits
- Default storage quota: Browser-dependent (usually 50% of available disk space)
- Cleanup threshold: 90% of quota
- Auto-cleanup: 30 days for unused downloads

### Download Settings
- Chunk size: 1MB per chunk
- Concurrent downloads: 3 simultaneous files
- Retry attempts: 3 times with exponential backoff
- Timeout: 30 seconds per file

### Sync Settings
- Auto-sync interval: When online status changes
- Batch size: 50 items per sync batch
- Conflict resolution: Last-write-wins with user notification

## Performance Considerations

### Storage Optimization
- Audio files are stored as compressed blobs
- Images are optimized for mobile viewing
- Metadata is stored in efficient JSON format
- Old downloads are automatically cleaned up

### Network Efficiency
- Downloads are chunked to handle interruptions
- Resume capability for interrupted downloads
- Compression for text-based content
- CDN integration for faster downloads

### Battery Optimization
- Background sync is throttled
- Location tracking is optimized for offline mode
- Minimal CPU usage during offline playback

## Security

### Data Protection
- Offline data is encrypted using Web Crypto API
- User authentication tokens are not stored offline
- Sensitive data is excluded from offline cache

### Access Control
- Offline downloads respect user permissions
- Downloaded content expires based on user subscription
- Offline access logs are synced for audit purposes

## Troubleshooting

### Common Issues

#### Download Fails
- Check internet connectivity
- Verify sufficient storage space
- Clear browser cache and retry
- Check for browser storage permissions

#### Sync Issues
- Ensure stable internet connection
- Check for authentication token expiry
- Verify server connectivity
- Clear offline cache if corrupted

#### Storage Full
- Use storage cleanup tools
- Remove old downloads manually
- Increase browser storage quota
- Clear other browser data

### Debug Tools

#### Storage Inspector
```javascript
// Check storage usage
const stats = await offlineManager.getStorageStats();
console.log('Storage:', stats);

// List offline tours
const tours = await offlineManager.getOfflineTours();
console.log('Offline tours:', tours);
```

#### Sync Status
```javascript
// Check pending sync items
const pending = await offlineManager.getPendingSyncCount();
console.log('Pending sync:', pending);

// Force sync
await offlineManager.syncOfflineData();
```

## Future Enhancements

### Planned Features
- Selective download (audio only, images only)
- Background download scheduling
- Peer-to-peer content sharing
- Advanced compression algorithms
- Offline analytics collection

### API Improvements
- GraphQL support for efficient data fetching
- WebRTC for peer-to-peer sync
- Service Worker integration
- Progressive Web App features

## Testing

### Unit Tests
Location: `src/tests/OfflineManager.test.js`

Tests cover:
- Download functionality
- Storage management
- Sync operations
- Error handling
- Performance metrics

### Integration Tests
- End-to-end download workflow
- Offline playback scenarios
- Sync conflict resolution
- Cross-browser compatibility

### Performance Tests
- Storage efficiency
- Download speed optimization
- Battery usage monitoring
- Memory leak detection

## Support

For technical support or questions about offline mode implementation:
- Check the troubleshooting section above
- Review the test files for usage examples
- Contact the development team for advanced configuration needs

---

**Note**: Offline mode requires modern browser support for IndexedDB, Service Workers, and Web Storage APIs. Ensure your target browsers support these features.