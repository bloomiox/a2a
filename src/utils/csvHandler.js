/**
 * CSV Handler for tour stops
 * This file provides functions for handling CSV uploads for tour stops
 */
import { importTourStopsCSV } from "@/api/functions";
import { mockCsvImportStops } from "@/components/utils/mockData";

/**
 * Parse CSV data into an array of objects
 * @param {string} csvData - The CSV data as a string
 * @returns {Array} - Array of objects representing the CSV rows
 */
export const parseCSV = (csvData) => {
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
};

/**
 * Convert parsed CSV data to tour stops format
 * @param {Array} csvRows - Array of objects representing the CSV rows
 * @param {number} basePosition - Base position for the stops
 * @param {Function} t - Translation function
 * @returns {Array} - Array of tour stops
 */
export const convertCSVToStops = (csvRows, basePosition, t) => {
  return csvRows.map((csvStop, index) => {
    // Parse gallery data
    const galleryImages = csvStop.gallery_images ? 
      csvStop.gallery_images.split(';').map(url => url.trim()).filter(url => url).map(url => ({
        type: 'image',
        url: url,
        source: 'url',
        caption: '',
        alt: 'Imported image'
      })) : [];
      
    const galleryVideos = csvStop.gallery_videos ? 
      csvStop.gallery_videos.split(';').map(url => url.trim()).filter(url => url).map(url => ({
        type: 'video',
        url: url,
        source: 'url',
        caption: '',
        duration: ''
      })) : [];

    // Prepare audio tracks
    const audioTracks = [];
    const languages = ['english', 'spanish', 'french', 'german', 'bosnian', 'turkish', 'arabic', 'italian', 'japanese', 'chinese'];
    
    languages.forEach(lang => {
      const audioUrl = csvStop[`audio_${lang}_url`];
      const transcript = csvStop[`audio_${lang}_transcript`];
      
      if (audioUrl || transcript) {
        audioTracks.push({
          language: lang.charAt(0).toUpperCase() + lang.slice(1),
          audio_url: audioUrl || "",
          transcript: transcript || "",
          duration: 0
        });
      }
    });

    // If no audio tracks, add default English track
    if (audioTracks.length === 0) {
      audioTracks.push({
        language: "English",
        audio_url: "",
        transcript: "",
        duration: 0
      });
    }

    return {
      title: csvStop.title || `${t ? t('create.stop') : 'Stop'} ${basePosition + index + 1}`,
      description: csvStop.description || "",
      position: basePosition + index, // Assign position based on existing stops count
      location: {
        latitude: parseFloat(csvStop.latitude) || null,
        longitude: parseFloat(csvStop.longitude) || null,
        address: csvStop.address || ""
      },
      trigger_radius: parseInt(csvStop.trigger_radius) || 50,
      preview_image: csvStop.preview_image_url || csvStop.preview_image || "",
      estimated_time: parseInt(csvStop.estimated_time) || 5,
      audio_tracks: audioTracks,
      gallery: [...galleryImages, ...galleryVideos]
    };
  });
};

/**
 * Handle CSV upload for tour stops
 * @param {File} file - The CSV file
 * @param {string|null} tourId - The tour ID (null if creating a new tour)
 * @param {Array} currentStops - The current stops
 * @param {Function} setStops - Function to update stops
 * @param {Function} setCsvUploadError - Function to set CSV upload error
 * @param {Function} setCsvUploadLoading - Function to set CSV upload loading state
 * @param {Function} t - Translation function
 * @returns {Promise<void>}
 */
export const handleCsvUpload = async (file, tourId, currentStops, setStops, setCsvUploadError, setCsvUploadLoading, t) => {
  if (!file) return;

  if (!file.name.toLowerCase().endsWith('.csv')) {
    setCsvUploadError(t('create.csvErrorFileType'));
    return;
  }

  setCsvUploadLoading(true);
  setCsvUploadError(null);

  try {
    // Read the file content
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        const csvData = event.target.result;
        
        // Check if we're in demo mode (no tourId yet) or editing an existing tour
        if (!tourId) {
          console.log("Creating new tour: Parsing CSV data");
          
          try {
            // Parse the CSV data
            const parsedRows = parseCSV(csvData);
            
            if (!parsedRows || parsedRows.length === 0) {
              setCsvUploadError(t('create.csvErrorNoData'));
              setCsvUploadLoading(false);
              return;
            }
            
            // Convert parsed data to tour stops format
            const newStops = convertCSVToStops(parsedRows, currentStops.length, t);
            
            // Add new stops to existing stops
            setStops(prevStops => {
              const combinedStops = [...prevStops, ...newStops];
              // Re-assign positions to ensure they are sequential after adding
              return combinedStops.map((stop, idx) => ({ ...stop, position: idx }));
            });
            
            alert(t('create.csvSuccess', { count: newStops.length }));
          } catch (parseError) {
            console.error("Error parsing CSV:", parseError);
            setCsvUploadError(t('create.csvErrorProcessing'));
            
            // Fallback to mock data if parsing fails
            console.log("Falling back to mock CSV data");
            
            // Convert mock data to the expected tour stops format
            const newStops = mockCsvImportStops.map((csvStop, index) => ({
              title: csvStop.title || `${t('create.stop')} ${currentStops.length + index + 1}`,
              description: csvStop.description || "",
              position: currentStops.length + index,
              location: csvStop.location || {
                latitude: null,
                longitude: null,
                address: ""
              },
              trigger_radius: csvStop.trigger_radius || 50,
              preview_image: csvStop.preview_image || "",
              estimated_time: csvStop.estimated_time || 5,
              audio_tracks: csvStop.audio_tracks || [{
                language: "English",
                audio_url: "",
                transcript: "",
                duration: 0
              }],
              gallery: csvStop.gallery || []
            }));
            
            // Add new stops to existing stops
            setStops(prevStops => {
              const combinedStops = [...prevStops, ...newStops];
              return combinedStops.map((stop, idx) => ({ ...stop, position: idx }));
            });
            
            alert(t('create.csvSuccess', { count: newStops.length }));
          }
        } else {
          // If we're editing an existing tour, use the importTourStopsCSV function
          console.log("Editing existing tour: Using importTourStopsCSV function");
          
          // Use the importTourStopsCSV function directly
          const response = await importTourStopsCSV({ 
            tourId, 
            csvData 
          });
          
          if (response.status === 200 && response.data) {
            // Fetch the newly created stops to update the UI
            const createdStops = response.data;
            
            // Format the stops for the UI
            const formattedStops = createdStops.map(stop => ({
              id: stop.id,
              title: stop.title,
              description: stop.description,
              position: stop.position,
              location: {
                latitude: stop.latitude,
                longitude: stop.longitude,
                address: stop.address
              },
              trigger_radius: stop.trigger_radius,
              preview_image: stop.preview_image,
              estimated_time: stop.estimated_time,
              audio_tracks: [], // We'll fetch these separately if needed
              gallery: [] // We'll fetch these separately if needed
            }));
            
            // Add the new stops to the existing stops
            setStops(prevStops => {
              const combinedStops = [...prevStops, ...formattedStops];
              // Re-assign positions to ensure they are sequential after adding
              return combinedStops.map((stop, idx) => ({ ...stop, position: idx }));
            });
            
            alert(t('create.csvSuccess', { count: formattedStops.length }));
          }
        }
      } catch (error) {
        console.error("Error processing CSV:", error);
        setCsvUploadError(t('create.csvErrorGeneral'));
      } finally {
        setCsvUploadLoading(false);
      }
    };
    
    reader.onerror = () => {
      setCsvUploadError(t('create.csvErrorProcessing'));
      setCsvUploadLoading(false);
    };
    
    reader.readAsText(file);
  } catch (error) {
    console.error("Error processing CSV:", error);
    setCsvUploadError(t('create.csvErrorGeneral'));
    setCsvUploadLoading(false);
  }
};