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
        const { bucket = 'tour-images', path = '' } = options;
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = path ? `${path}/${fileName}` : fileName;

        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) throw error;

        // Get the public URL
        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);

        return {
            success: true,
            url: publicUrl,
            path: filePath
        };
    } catch (error) {
        console.error('Error uploading file:', error);
        return {
            success: false,
            error: error.message
        };
    }
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

    ExtractDataFromUploadedFile: async () => {
        console.warn('ExtractDataFromUploadedFile not implemented');
        return { success: false, error: 'Not implemented' };
    }
};

// Export individual functions from Core for backward compatibility
export const InvokeLLM = Core.InvokeLLM;
export const SendEmail = Core.SendEmail;
export const GenerateImage = Core.GenerateImage;
export const ExtractDataFromUploadedFile = Core.ExtractDataFromUploadedFile;