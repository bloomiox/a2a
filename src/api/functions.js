import { supabase } from './supabaseClient';

// Helper function to handle Supabase responses
const handleResponse = (response) => {
  if (response.error) {
    console.error('Supabase error:', response.error);
    throw response.error;
  }
  return response.data;
};

// Export tour stops as CSV
export const exportTourStopsCSV = async ({ tourId }) => {
  try {
    // First try to get the tour stops directly
    const { data: tourStops, error: stopsError } = await supabase
      .from('tour_stops')
      .select('*')
      .eq('tour_id', tourId)
      .order('position');

    if (stopsError) throw stopsError;

    // Generate CSV manually
    const headers = 'Stop ID,Title,Description,Position,Latitude,Longitude';
    const rows = tourStops.map(stop => {
      return `${stop.id},${stop.title},${stop.description || ''},${stop.position},${stop.latitude || ''},${stop.longitude || ''}`;
    });

    const csvData = [headers, ...rows].join('\n');

    return {
      status: 200,
      data: csvData
    };
  } catch (error) {
    console.error('Error exporting tour stops as CSV:', error);
    throw error;
  }
};

// Import tour stops from CSV
export const importTourStopsCSV = async ({ tourId, csvData }) => {
  try {
    // Parse CSV data
    const parsedData = parseCSV(csvData);

    if (!parsedData || parsedData.length === 0) {
      throw new Error('No valid data found in CSV');
    }

    // Process each row and create tour stops
    const createdStops = [];

    for (const row of parsedData) {
      // Create the tour stop
      const stopData = {
        tour_id: tourId,
        title: row.title || 'Untitled Stop',
        description: row.description || '',
        position: parseInt(row.position) || createdStops.length,
        latitude: parseFloat(row.latitude) || null,
        longitude: parseFloat(row.longitude) || null,
        address: row.address || '',
        trigger_radius: parseInt(row.trigger_radius) || 50,
        preview_image: row.preview_image_url || row['preview_image'] || '',
        estimated_time: parseInt(row.estimated_time) || parseInt(row['estimated_time']) || 5
      };

      // Insert the stop into the database
      const { data: stop, error: stopError } = await supabase
        .from('tour_stops')
        .insert([stopData])
        .select()
        .single();

      if (stopError) throw stopError;

      createdStops.push(stop);

      // Process audio tracks if they exist
      const languages = ['english', 'spanish', 'french', 'german', 'italian', 'japanese', 'chinese'];

      for (const lang of languages) {
        const audioUrl = row[`audio_${lang}_url`];
        const transcript = row[`audio_${lang}_transcript`];

        if (audioUrl || transcript) {
          const audioData = {
            tour_id: tourId,
            stop_id: stop.id,
            language: lang.charAt(0).toUpperCase() + lang.slice(1),
            audio_url: audioUrl || '',
            transcript: transcript || ''
          };

          const { error: audioError } = await supabase
            .from('audio_tracks')
            .insert([audioData]);

          if (audioError) {
            console.error(`Error creating audio track for ${lang}:`, audioError);
            // Continue with other languages even if one fails
          }
        }
      }
    }

    return {
      status: 200,
      data: createdStops
    };
  } catch (error) {
    console.error('Error importing tour stops from CSV:', error);
    throw error;
  }
};

// Helper function to parse CSV data
function parseCSV(csvData) {
  try {
    // Split by lines (using correct regex for line breaks)
    const lines = csvData.split(/\r?\n/);

    // Extract headers
    const headers = lines[0].split(',').map(header => {
      // Remove quotes if present
      let cleanHeader = header.trim();
      if (cleanHeader.startsWith('"') && cleanHeader.endsWith('"')) {
        cleanHeader = cleanHeader.substring(1, cleanHeader.length - 1);
      }
      return cleanHeader.toLowerCase();
    });

    // Parse rows
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Parse CSV line properly handling quoted values
      const values = [];
      let inQuotes = false;
      let currentValue = '';

      for (let j = 0; j < line.length; j++) {
        const char = line[j];

        if (char === '"') {
          // If we see a quote inside quotes (escaped quote), add it
          if (inQuotes && j + 1 < line.length && line[j + 1] === '"') {
            currentValue += '"';
            j++; // Skip the next quote
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          values.push(currentValue);
          currentValue = '';
        } else {
          currentValue += char;
        }
      }

      // Add the last value
      values.push(currentValue);

      // Create row object
      const row = {};
      headers.forEach((header, index) => {
        // Remove quotes from values if present
        let value = values[index] ? values[index].trim() : '';
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.substring(1, value.length - 1);
        }
        row[header] = value;
      });

      rows.push(row);
    }

    console.log('Parsed CSV rows:', rows);
    return rows;
  } catch (error) {
    console.error('Error parsing CSV:', error);
    return null;
  }
}

// Get creator analytics
export const getCreatorAnalytics = async ({ userId, dateRange = 'all' }) => {
  try {
    console.log('Getting creator analytics for user:', userId, 'Type:', typeof userId);

    // Validate userId parameter
    if (!userId || userId === 'undefined' || userId === 'null') {
      console.error('Invalid userId provided:', userId);
      throw new Error('Valid userId is required for analytics');
    }

    // Check if userId is a valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      console.error('Invalid UUID format for userId:', userId);
      throw new Error('userId must be a valid UUID');
    }

    // Get user's tours with related data
    const { data: userTours, error: toursError } = await supabase
      .from('tours')
      .select('*')
      .eq('created_by', userId);

    if (toursError) {
      console.error('Error fetching user tours:', toursError);
      throw toursError;
    }

    const tours = userTours || [];
    console.log(`Found ${tours.length} tours for user`);

    // Get user progress data for all user's tours
    const tourIds = tours.map(tour => tour.id);
    let userProgressData = [];
    let tourAssignments = [];
    let tourReviews = [];

    if (tourIds.length > 0) {
      // Get user progress for analytics
      const { data: progressData } = await supabase
        .from('user_progress')
        .select('*')
        .in('tour_id', tourIds);

      userProgressData = progressData || [];

      // Get tour assignments for play count
      const { data: assignmentData } = await supabase
        .from('tour_assignments')
        .select('*')
        .in('tour_id', tourIds);

      tourAssignments = assignmentData || [];

      // Get tour reviews for ratings
      const { data: reviewData } = await supabase
        .from('tour_reviews')
        .select('*')
        .in('tour_id', tourIds);

      tourReviews = reviewData || [];
    }

    // Calculate real analytics from database data
    const totalPlays = userProgressData.length;
    const totalAssignments = tourAssignments.length;
    const completedTours = userProgressData.filter(progress =>
      progress.completed_stops && progress.completed_stops.length > 0
    ).length;

    // Calculate average rating from reviews
    const totalReviews = tourReviews.length;
    const averageRating = totalReviews > 0
      ? tourReviews.reduce((sum, review) => sum + (review.rating || 0), 0) / totalReviews
      : 0;

    // Calculate completion rate
    const overallCompletionRate = totalPlays > 0
      ? Math.round((completedTours / totalPlays) * 100)
      : 0;

    return {
      totalTours: tours.length,
      totalPlays: totalPlays,
      totalDownloads: totalAssignments, // Using assignments as downloads
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      totalReviews: totalReviews,

      // Calculate real tour metrics
      tourMetrics: tours.map(tour => {
        const tourProgress = userProgressData.filter(p => p.tour_id === tour.id);
        const tourAssignmentCount = tourAssignments.filter(a => a.tour_id === tour.id).length;
        const tourReviewsForTour = tourReviews.filter(r => r.tour_id === tour.id);
        const tourCompletions = tourProgress.filter(p =>
          p.completed_stops && p.completed_stops.length > 0
        ).length;

        const tourAvgRating = tourReviewsForTour.length > 0
          ? tourReviewsForTour.reduce((sum, review) => sum + (review.rating || 0), 0) / tourReviewsForTour.length
          : 0;

        const tourCompletionRate = tourProgress.length > 0
          ? Math.round((tourCompletions / tourProgress.length) * 100)
          : 0;

        return {
          tourId: tour.id,
          tourTitle: tour.title,
          createdDate: tour.created_at || new Date().toISOString(),
          totalPlays: tourProgress.length,
          totalDownloads: tourAssignmentCount,
          completionRate: tourCompletionRate,
          averageRating: Math.round(tourAvgRating * 10) / 10,
          totalReviews: tourReviewsForTour.length
        };
      }),

      // Calculate rating trends from reviews (last 6 months)
      ratingTrends: (() => {
        const trends = [];
        for (let i = 5; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
          const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

          const monthReviews = tourReviews.filter(review => {
            const reviewDate = new Date(review.created_at);
            return reviewDate >= monthStart && reviewDate <= monthEnd;
          });

          const monthAvgRating = monthReviews.length > 0
            ? monthReviews.reduce((sum, review) => sum + (review.rating || 0), 0) / monthReviews.length
            : 0;

          trends.push({
            month: date.toLocaleString('default', { month: 'short' }),
            averageRating: Math.round(monthAvgRating * 10) / 10
          });
        }
        return trends;
      })(),

      // Overall completion rate
      overallCompletionRate: overallCompletionRate,

      // Popular stops (placeholder - would need more complex query to determine actual popularity)
      popularStops: tours.slice(0, 5).map((tour, i) => ({
        stopId: `tour-${tour.id}`,
        stopTitle: tour.title || `Tour ${i + 1}`,
        tourTitle: tours[i % tours.length]?.title || `Tour ${i + 1}`,
        visitCount: Math.floor(Math.random() * 100) + 50
      }))
    };
  } catch (error) {
    console.error('Error getting creator analytics:', error);

    // Return minimal data structure on error
    return {
      totalTours: 0,
      totalPlays: 0,
      totalDownloads: 0,
      averageRating: 0,
      totalReviews: 0,
      tourMetrics: [],
      ratingTrends: Array.from({ length: 6 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - 5 + i);
        return {
          month: date.toLocaleString('default', { month: 'short' }),
          averageRating: 0
        };
      }),
      overallCompletionRate: 0,
      popularStops: []
    };
  }
};

// Download tour as playlist (placeholder for compatibility)
export const downloadTourAsPlaylist = async ({ tourId }) => {
  console.log('Downloading tour as playlist:', tourId);

  // This would typically generate a ZIP file with audio files
  // For now, we'll return a mock response
  return {
    status: 200,
    url: `https://example.com/tours/${tourId}/playlist.zip`
  };
};

import liveBroadcastService from '../services/LiveBroadcastService.js';

// Audio relay function with enhanced live broadcast support
export const audioRelay = async ({ action, tourId, driverId, sessionId, audioData, mimeType, adminId }) => {
  console.log('Audio relay called:', { action, tourId, driverId, sessionId, audioDataSize: audioData?.length || 0 });

  // Handle different actions
  if (action === 'getActiveTours') {
    try {
      // Get active tour assignments
      const { data: assignments, error } = await supabase
        .from('tour_assignments')
        .select('*')
        .eq('status', 'in_progress');

      if (error) throw error;

      // Get tours and drivers separately
      const tours = [];
      const drivers = [];

      if (assignments && assignments.length > 0) {
        // Get tour IDs and driver IDs
        const tourIds = assignments.map(a => a.tour_id).filter(Boolean);
        const driverIds = assignments.map(a => a.driver_id).filter(Boolean);

        // Fetch tours
        if (tourIds.length > 0) {
          const { data: toursData } = await supabase
            .from('tours')
            .select('*')
            .in('id', tourIds);

          if (toursData) {
            tours.push(...toursData);
          }
        }

        // Fetch drivers
        if (driverIds.length > 0) {
          const { data: driversData } = await supabase
            .from('user_profiles')
            .select('*')
            .in('id', driverIds);

          if (driversData) {
            drivers.push(...driversData);
          }
        }
      }

      // Format the response
      const activeTours = assignments.map(assignment => {
        const tour = tours.find(t => t.id === assignment.tour_id) || {};
        const driver = drivers.find(d => d.id === assignment.driver_id) || {};

        return {
          id: tour.id,
          title: tour.title || 'Unknown Tour',
          driver: {
            id: driver.id,
            name: driver.name || 'Unknown Driver'
          },
          assignment_id: assignment.id,
          start_time: assignment.start_time
        };
      }).filter(tour => tour.id); // Filter out any tours with undefined id

      return {
        success: true,
        data: { tours: activeTours }
      };
    } catch (error) {
      console.error('Error getting active tours:', error);
      return {
        success: false,
        error: error.message,
        data: { tours: [] }
      };
    }
  }

  // Handle startBroadcast action
  if (action === 'startBroadcast') {
    try {
      console.log('Starting broadcast for tour:', tourId, 'driver:', driverId);

      if (!tourId || !driverId) {
        return {
          status: 400,
          data: {
            success: false,
            error: 'Missing required parameters: tourId or driverId'
          }
        };
      }

      const result = liveBroadcastService.startBroadcast(tourId, driverId, adminId);

      return {
        status: result.success ? 200 : 400,
        data: result
      };
    } catch (error) {
      console.error('Error starting broadcast:', error);
      return {
        status: 500,
        data: {
          success: false,
          error: error.message
        }
      };
    }
  }

  // Handle sendAudio action
  if (action === 'sendAudio') {
    try {
      console.log('Processing sendAudio request for session:', sessionId);

      if (!sessionId || !audioData) {
        return {
          status: 400,
          data: {
            success: false,
            error: 'Missing required parameters: sessionId or audioData'
          }
        };
      }

      const result = liveBroadcastService.sendAudioChunk(sessionId, audioData, mimeType);

      return {
        status: result.success ? 200 : 400,
        data: result
      };
    } catch (error) {
      console.error('Error sending audio:', error);
      return {
        status: 500,
        data: {
          success: false,
          error: error.message
        }
      };
    }
  }

  // Handle getAudio action (for driver to receive audio)
  if (action === 'getAudio') {
    try {
      console.log('Processing getAudio request for driver:', driverId, 'tour:', tourId);

      if (!driverId || !tourId) {
        return {
          status: 400,
          data: {
            success: false,
            error: 'Missing required parameters: driverId or tourId'
          }
        };
      }

      const result = liveBroadcastService.getAudioChunks(driverId, tourId);

      return {
        status: 200,
        data: {
          ...result,
          driverId,
          tourId
        }
      };
    } catch (error) {
      console.error('Error getting audio:', error);
      return {
        status: 500,
        data: {
          success: false,
          error: error.message,
          chunks: [],
          sessionId: null,
          status: 'error'
        }
      };
    }
  }

  // Handle getBroadcastStatus action
  if (action === 'getBroadcastStatus') {
    try {
      const result = liveBroadcastService.getBroadcastStatus(tourId, sessionId, driverId);

      return {
        status: result.success ? 200 : 500,
        data: result
      };
    } catch (error) {
      console.error('Error getting broadcast status:', error);
      return {
        status: 500,
        data: {
          success: false,
          error: error.message
        }
      };
    }
  }

  // Handle getActiveBroadcasts action
  if (action === 'getActiveBroadcasts') {
    try {
      const result = liveBroadcastService.getActiveBroadcasts();

      return {
        status: result.success ? 200 : 500,
        data: result
      };
    } catch (error) {
      console.error('Error getting active broadcasts:', error);
      return {
        status: 500,
        data: {
          success: false,
          error: error.message,
          broadcasts: []
        }
      };
    }
  }

  // Handle getDebugInfo action
  if (action === 'getDebugInfo') {
    try {
      const debugInfo = liveBroadcastService.getDebugInfo();

      return {
        status: 200,
        data: {
          success: true,
          debugInfo
        }
      };
    } catch (error) {
      console.error('Error getting debug info:', error);
      return {
        status: 500,
        data: {
          success: false,
          error: error.message
        }
      };
    }
  }

  // Handle getActiveBroadcastForTour action
  if (action === 'getActiveBroadcastForTour') {
    try {
      const broadcast = liveBroadcastService.getActiveBroadcastForTour(tourId);

      return {
        status: 200,
        data: {
          success: true,
          broadcast
        }
      };
    } catch (error) {
      console.error('Error getting active broadcast for tour:', error);
      return {
        status: 500,
        data: {
          success: false,
          error: error.message
        }
      };
    }
  }

  // Handle forceDriverToBroadcast action
  if (action === 'forceDriverToBroadcast') {
    try {
      const result = liveBroadcastService.forceDriverToBroadcast(driverId, sessionId);

      return {
        status: result.success ? 200 : 400,
        data: result
      };
    } catch (error) {
      console.error('Error forcing driver to broadcast:', error);
      return {
        status: 500,
        data: {
          success: false,
          error: error.message
        }
      };
    }
  }

  // Handle other actions
  if (action === 'startSession') {
    return {
      status: 200,
      data: {
        success: true,
        sessionId: 'session-' + Date.now(),
        message: 'Audio session started'
      }
    };
  }

  if (action === 'endSession' || action === 'stopBroadcast') {
    try {
      console.log('Processing stopBroadcast for session:', sessionId, 'tour:', tourId);

      const result = liveBroadcastService.stopBroadcast(sessionId, tourId);

      return {
        status: result.success ? 200 : 400,
        data: result
      };
    } catch (error) {
      console.error('Error stopping broadcast:', error);
      return {
        status: 500,
        data: {
          success: false,
          error: error.message
        }
      };
    }
  }

  // Default response for unknown actions
  return {
    status: 400,
    data: {
      success: false,
      error: `Unknown action: ${action}`
    }
  };
};

// Audio WebSocket function (placeholder for compatibility)
export const audioWebSocket = async ({ tourId }) => {
  console.log('Audio WebSocket for tour:', tourId);

  // This would typically return WebSocket connection details
  // For now, we'll return a mock response
  return {
    url: `wss://example.com/ws/tours/${tourId}`,
    token: 'mock-ws-token-' + Math.random().toString(36).substring(2, 15)
  };
};