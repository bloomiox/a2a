import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Get the current site URL for redirects
const getSiteUrl = () => {
  // Use environment variable if available
  if (import.meta.env.VITE_SITE_URL) {
    return import.meta.env.VITE_SITE_URL;
  }
  
  // In production, use the production URL
  if (import.meta.env.PROD) {
    return 'https://app.bloom-travel.com';
  }
  
  // In development, use localhost with correct port
  return 'http://localhost:5173';
};

// Create Supabase client with additional options for better auth handling
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Set the redirect URL for email confirmations
    redirectTo: getSiteUrl()
  }
});