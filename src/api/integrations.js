import { supabase } from './supabaseClient';

// Upload a tour image to Supabase Storage
export const uploadTourImage = async (file, tourId) => {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${tourId}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `${tourId}/${fileName}`;

        const { data, error } = await supabase.storage
            .from('tour-images')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) throw error;

        // Get the public URL
        const { data: { publicUrl } } = supabase.storage
            .from('tour-images')
            .getPublicUrl(filePath);

        return publicUrl;
    } catch (error) {
        console.error('Error uploading tour image:', error);
        throw error;
    }
};

// Upload an audio file to Supabase Storage
export const uploadAudioFile = async (file, tourId, stopId) => {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${stopId}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `${tourId}/${fileName}`;

        const { data, error } = await supabase.storage
            .from('audio-files')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) throw error;

        // Get the public URL
        const { data: { publicUrl } } = supabase.storage
            .from('audio-files')
            .getPublicUrl(filePath);

        return publicUrl;
    } catch (error) {
        console.error('Error uploading audio file:', error);
        throw error;
    }
};

// Delete a file from Supabase Storage
export const deleteFile = async (url, bucketName) => {
    try {
        // Extract the file path from the URL
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/');
        const filePath = pathParts.slice(pathParts.indexOf(bucketName) + 1).join('/');

        const { error } = await supabase.storage
            .from(bucketName)
            .remove([filePath]);

        if (error) throw error;

        return { success: true };
    } catch (error) {
        console.error('Error deleting file:', error);
        throw error;
    }
};

// Generic file upload function to match the previous API
export const UploadFile = async (file, options = {}) => {
    try {
        // Validate file parameter
        if (!file) {
            throw new Error('No file provided');
        }
        
        // Debug logging
        console.log('UploadFile received:', {
            file,
            hasName: !!file.name,
            name: file.name,
            type: file.type,
            size: file.size
        });
        
        if (!file.name) {
            console.error('File object:', file);
            throw new Error('File must have a name property');
        }

        // Auto-detect bucket based on file type if not specified
        let defaultBucket = 'tour-images';
        if (file.type && file.type.startsWith('audio/')) {
            defaultBucket = 'audio-files';
        }

        const { bucket = defaultBucket, path = '' } = options;
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = path ? `${path}/${fileName}` : fileName;

        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            // Provide more helpful error messages
            if (error.statusCode === '404' && error.message === 'Bucket not found') {
                throw new Error(`Storage bucket '${bucket}' not found. Please create the bucket in your Supabase dashboard under Storage.`);
            }
            if (error.statusCode === '403' || error.message.includes('row-level security policy')) {
                throw new Error(`Upload permission denied. Please check the storage bucket policies in your Supabase dashboard. The bucket '${bucket}' needs policies to allow authenticated users to upload files.`);
            }
            throw error;
        }

        // Get the public URL
        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);

        // Log successful upload
        if (typeof window !== 'undefined') {
            import('../services/LoggingService.js').then(({ default: loggingService }) => {
                loggingService.addLog('INFO', `File uploaded successfully: ${file.name}`, {
                    fileName: file.name,
                    fileSize: file.size,
                    bucket,
                    path: filePath,
                    url: publicUrl
                });
            });
        }

        return {
            success: true,
            url: publicUrl,
            path: filePath
        };
    } catch (error) {
        console.error('Error uploading file:', error);
        
        // Log upload error
        if (typeof window !== 'undefined') {
            import('../services/LoggingService.js').then(({ default: loggingService }) => {
                loggingService.addLog('ERROR', `File upload failed: ${error.message}`, {
                    fileName: file?.name || 'unknown',
                    error: error.message,
                    stack: error.stack
                });
            });
        }
        
        return {
            success: false,
            error: error.message
        };
    }
};

// Dedicated function for audio file uploads
export const UploadAudioFile = async (file, options = {}) => {
    // Validate that it's an audio file
    if (!file.type || !file.type.startsWith('audio/')) {
        throw new Error('File must be an audio file');
    }

    // Force audio-files bucket
    const audioOptions = {
        ...options,
        bucket: 'audio-files',
        path: options.path || 'tracks' // Default to 'tracks' subfolder
    };

    return await UploadFile(file, audioOptions);
};

// Dedicated function for image uploads
export const UploadImageFile = async (file, options = {}) => {
    // Validate that it's an image file
    if (!file.type || !file.type.startsWith('image/')) {
        throw new Error('File must be an image file');
    }

    // Force tour-images bucket
    const imageOptions = {
        ...options,
        bucket: 'tour-images',
        path: options.path || 'tours' // Default to 'tours' subfolder
    };

    return await UploadFile(file, imageOptions);
};

// Helper function to parse CSV content
const parseCSV = (csvContent) => {
    try {
        const lines = csvContent.trim().split('\n');
        if (lines.length < 2) {
            throw new Error('CSV must have at least a header row and one data row');
        }

        // Parse header row
        const headers = parseCSVRow(lines[0]);
        console.log('CSV headers:', headers);

        // Parse data rows
        const data = [];
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line) { // Skip empty lines
                const values = parseCSVRow(line);
                const row = {};
                
                // Map values to headers
                headers.forEach((header, index) => {
                    const value = values[index] || '';
                    // Try to convert numeric values
                    if (value && !isNaN(value) && !isNaN(parseFloat(value))) {
                        row[header] = parseFloat(value);
                    } else {
                        row[header] = value;
                    }
                });
                
                data.push(row);
            }
        }

        return data;
    } catch (error) {
        console.error('CSV parsing error:', error);
        throw error;
    }
};

// Helper function to parse a single CSV row (handles quoted values)
const parseCSVRow = (row) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < row.length; i++) {
        const char = row[i];
        
        if (char === '"') {
            if (inQuotes && row[i + 1] === '"') {
                // Escaped quote
                current += '"';
                i++; // Skip next quote
            } else {
                // Toggle quote state
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            // End of field
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    
    // Add the last field
    result.push(current.trim());
    
    return result;
};

// Add other Core integrations that might be used in the app
export const Core = {
    UploadFile,

    // Add placeholder functions for other Core integrations
    InvokeLLM: async () => {
        console.warn('InvokeLLM not implemented');
        return { success: false, error: 'Not implemented' };
    },

    SendEmail: async (options) => {
        console.warn('SendEmail not implemented');
        return { success: false, error: 'Not implemented' };
    },

    GenerateImage: async () => {
        console.warn('GenerateImage not implemented');
        return { success: false, error: 'Not implemented' };
    },

    ExtractDataFromUploadedFile: async ({ file_url, json_schema }) => {
        try {
            console.log('ExtractDataFromUploadedFile called with:', { file_url, json_schema });
            
            if (!file_url) {
                throw new Error('file_url is required');
            }

            // Fetch the CSV file content
            const response = await fetch(file_url);
            if (!response.ok) {
                throw new Error(`Failed to fetch file: ${response.statusText}`);
            }

            const csvContent = await response.text();
            console.log('CSV content length:', csvContent.length);

            // Parse CSV content
            const parsedData = parseCSV(csvContent);
            console.log('Parsed CSV data:', parsedData);

            if (!parsedData || parsedData.length === 0) {
                return {
                    status: 'error',
                    details: 'No data found in CSV file'
                };
            }

            // Transform data to handle field name compatibility
            const transformedData = parsedData.map(row => {
                const transformedRow = { ...row };
                
                // Handle backward compatibility: title -> name
                if (row.title && !row.name) {
                    transformedRow.name = row.title;
                }
                
                // Handle backward compatibility: estimated_time -> duration_minutes
                if (row.estimated_time && !row.duration_minutes) {
                    transformedRow.duration_minutes = row.estimated_time;
                }
                
                // Add order_in_tour if not present (use index + 1)
                if (!row.order_in_tour) {
                    transformedRow.order_in_tour = parsedData.indexOf(row) + 1;
                }
                
                return transformedRow;
            });

            // Validate against schema if provided
            if (json_schema && json_schema.items && json_schema.items.required) {
                const requiredFields = json_schema.items.required;
                const missingFields = [];

                // Check if all required fields are present in the first transformed row
                const firstRow = transformedData[0];
                requiredFields.forEach(field => {
                    if (!firstRow.hasOwnProperty(field) || firstRow[field] === '') {
                        missingFields.push(field);
                    }
                });

                if (missingFields.length > 0) {
                    return {
                        status: 'error',
                        details: `Missing required fields: ${missingFields.join(', ')}`
                    };
                }
            }

            return {
                status: 'success',
                output: transformedData
            };

        } catch (error) {
            console.error('ExtractDataFromUploadedFile error:', error);
            return {
                status: 'error',
                details: error.message
            };
        }
    }
};

// Export individual functions from Core for backward compatibility
export const InvokeLLM = Core.InvokeLLM;
export const SendEmail = Core.SendEmail;
export const GenerateImage = Core.GenerateImage;
export const ExtractDataFromUploadedFile = Core.ExtractDataFromUploadedFile;