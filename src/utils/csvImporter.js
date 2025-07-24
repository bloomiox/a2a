/**
 * CSV Importer utility for tour stops
 * This file provides functions for parsing and importing CSV data for tour stops
 */

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