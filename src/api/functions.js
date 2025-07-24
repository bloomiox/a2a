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
export const getCreatorAnalytics = async ({ userId }) => {
  try {
    // Try to use the RPC function first
    try {
      const { data, error } = await supabase.rpc('get_creator_analytics', { p_user_id: userId });
      if (!error && data) {
        return data;
      }
    } catch (rpcError) {
      console.warn('RPC function not available, using mock data:', rpcError);
    }

    // If RPC fails or doesn't exist, use mock data
    console.log('Using mock analytics data for user:', userId);

    // Get user's tours
    const { data: userTours } = await supabase
      .from('tours')
      .select('*')
      .eq('created_by', userId);

    const tours = userTours || [];

    // Generate mock data that matches what the CreatorDashboard component expects
    return {
      totalTours: tours.length,
      totalPlays: Math.floor(Math.random() * 500) + 100,
      totalDownloads: Math.floor(Math.random() * 200) + 50,
      averageRating: 4.5,
      totalReviews: Math.floor(Math.random() * 50) + 10,

      // Generate mock tour metrics
      tourMetrics: tours.map(tour => ({
        tourId: tour.id,
        tourTitle: tour.title,
        createdDate: tour.created_date || new Date().toISOString(),
        totalPlays: Math.floor(Math.random() * 100) + 10,
        totalDownloads: Math.floor(Math.random() * 50) + 5,
        completionRate: Math.floor(Math.random() * 60) + 40,
        averageRating: (Math.random() * 2) + 3,
        totalReviews: Math.floor(Math.random() * 20) + 1
      })),

      // Generate mock rating trends (last 6 months)
      ratingTrends: Array.from({ length: 6 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - 5 + i);
        return {
          month: date.toLocaleString('default', { month: 'short' }),
          averageRating: (Math.random() * 1.5) + 3.5
        };
      }),

      // Overall completion rate
      overallCompletionRate: Math.floor(Math.random() * 30) + 70,

      // Popular stops
      popularStops: Array.from({ length: 5 }, (_, i) => ({
        stopId: `stop-${i + 1}`,
        stopTitle: `Popular Stop ${i + 1}`,
        tourTitle: tours[i % tours.length]?.title || `Tour ${i + 1}`,
        visitCount: Math.floor(Math.random() * 100) + 50
      }))
    };
  } catch (error) {
    console.error('Error getting creator analytics:', error);
    throw error;
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

// Audio relay function with support for getActiveTours
export const audioRelay = async ({ action, message, tourId, driverId }) => {
  console.log('Audio relay:', { action, message, tourId, driverId });

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

  // Default response for other actions
  return { success: true };
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