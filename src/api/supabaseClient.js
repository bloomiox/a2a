import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ynreicljcvcpzckhojtx.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlucmVpY2xqY3ZjcHpja2hvanR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNzAyMjEsImV4cCI6MjA2ODk0NjIyMX0.BBXCgYSOxVpaHuQoBTSRpp9YBlLEqlmoXd4hDPNFwpc';

// Create Supabase client with additional options for better auth handling
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});