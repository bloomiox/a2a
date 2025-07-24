import { supabase } from './supabaseClient';
import fs from 'fs';
import path from 'path';

/**
 * Updates the database schema to match the application's data model
 */
export const updateSchema = async () => {
  try {
    console.log('Updating database schema...');
    
    // Instead of using a single SQL script, we'll update the schema directly
    // using the Supabase client
    
    // 1. Update the tours table
    await updateToursTable();
    
    // 2. Update the tour_stops table
    await updateTourStopsTable();
    
    // 3. Update the audio_tracks table
    await updateAudioTracksTable();
    
    // 4. Update the user_progress table
    await updateUserProgressTable();
    
    // 5. Update the tour_assignments table
    await updateTourAssignmentsTable();
    
    // 6. Update the driver_locations table
    await updateDriverLocationsTable();
    
    // 7. Update the tour_reviews table
    await updateTourReviewsTable();
    
    // Refresh the schema cache
    await refreshSchemaCache();
    
    console.log('Schema updated successfully');
    return true;
  } catch (error) {
    console.error('Error updating schema:', error);
    return false;
  }
};

// Helper function to update the tours table
const updateToursTable = async () => {
  try {
    // Check if the table exists
    const { data: tableExists } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'tours')
      .eq('table_schema', 'public');
    
    if (!tableExists || tableExists.length === 0) {
      // Create the table if it doesn't exist
      await supabase.rpc('create_tours_table');
    }
    
    // Add columns if they don't exist
    const columnsToAdd = [
      { name: 'theme', type: 'text' },
      { name: 'difficulty', type: 'text' },
      { name: 'accessibility', type: 'text[]', default: "'{}'" },
      { name: 'transportation', type: 'text' },
      { name: 'duration', type: 'integer' },
      { name: 'distance', type: 'numeric' },
      { name: 'languages', type: 'text[]', default: "'{}'" },
      { name: 'preview_image', type: 'text' },
      { name: 'is_public', type: 'boolean', default: 'false' },
      { name: 'location', type: 'jsonb', default: "'{\"city\": \"\", \"country\": \"\", \"start_point\": {\"latitude\": null, \"longitude\": null, \"address\": \"\"}}'" },
      { name: 'financials', type: 'jsonb', default: "'{\"price_per_tourist\": 0, \"costs\": {\"driver_fee\": 0, \"fuel_cost\": 0, \"food_cost_per_tourist\": 0, \"other_costs\": 0}, \"min_tourists\": 1, \"max_tourists\": 10}'" }
    ];
    
    for (const column of columnsToAdd) {
      try {
        await supabase.rpc('add_column_if_not_exists', {
          p_table_name: 'tours',
          p_column_name: column.name,
          p_data_type: column.type,
          p_default_value: column.default || null
        });
      } catch (error) {
        console.warn(`Error adding column ${column.name} to tours table:`, error);
        // Continue with other columns even if one fails
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error updating tours table:', error);
    return false;
  }
};

// Helper function to update the tour_stops table
const updateTourStopsTable = async () => {
  try {
    // Check if the table exists
    const { data: tableExists } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'tour_stops')
      .eq('table_schema', 'public');
    
    if (!tableExists || tableExists.length === 0) {
      // Create the table if it doesn't exist
      await supabase.rpc('create_tour_stops_table');
    }
    
    // Add columns if they don't exist
    const columnsToAdd = [
      { name: 'trigger_radius', type: 'integer', default: '50' },
      { name: 'preview_image', type: 'text' },
      { name: 'estimated_time', type: 'integer', default: '5' },
      { name: 'location', type: 'jsonb', default: "'{\"latitude\": null, \"longitude\": null, \"address\": \"\"}'" },
      { name: 'gallery', type: 'jsonb', default: "'[]'" },
      { name: 'interactive_elements', type: 'jsonb', default: "'[]'" }
    ];
    
    for (const column of columnsToAdd) {
      try {
        await supabase.rpc('add_column_if_not_exists', {
          p_table_name: 'tour_stops',
          p_column_name: column.name,
          p_data_type: column.type,
          p_default_value: column.default || null
        });
      } catch (error) {
        console.warn(`Error adding column ${column.name} to tour_stops table:`, error);
        // Continue with other columns even if one fails
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error updating tour_stops table:', error);
    return false;
  }
};

// Helper function to update the audio_tracks table
const updateAudioTracksTable = async () => {
  try {
    // Check if the table exists
    const { data: tableExists } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'audio_tracks')
      .eq('table_schema', 'public');
    
    if (!tableExists || tableExists.length === 0) {
      // Create the table if it doesn't exist
      await supabase.rpc('create_audio_tracks_table');
    }
    
    // Add columns if they don't exist
    const columnsToAdd = [
      { name: 'language', type: 'text' },
      { name: 'audio_url', type: 'text' },
      { name: 'transcript', type: 'text' },
      { name: 'duration', type: 'integer', default: '0' }
    ];
    
    for (const column of columnsToAdd) {
      try {
        await supabase.rpc('add_column_if_not_exists', {
          p_table_name: 'audio_tracks',
          p_column_name: column.name,
          p_data_type: column.type,
          p_default_value: column.default || null
        });
      } catch (error) {
        console.warn(`Error adding column ${column.name} to audio_tracks table:`, error);
        // Continue with other columns even if one fails
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error updating audio_tracks table:', error);
    return false;
  }
};

// Helper function to update the user_progress table
const updateUserProgressTable = async () => {
  try {
    // Check if the table exists
    const { data: tableExists } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'user_progress')
      .eq('table_schema', 'public');
    
    if (!tableExists || tableExists.length === 0) {
      // Create the table if it doesn't exist
      await supabase.rpc('create_user_progress_table');
    }
    
    // Add columns if they don't exist
    const columnsToAdd = [
      { name: 'user_id', type: 'uuid' },
      { name: 'tour_id', type: 'uuid' },
      { name: 'completed_stops', type: 'uuid[]', default: "'{}'" },
      { name: 'last_stop_id', type: 'uuid' },
      { name: 'downloaded', type: 'boolean', default: 'false' },
      { name: 'preferred_language', type: 'text', default: "'English'" },
      { name: 'last_updated', type: 'timestamp with time zone', default: 'now()' }
    ];
    
    for (const column of columnsToAdd) {
      try {
        await supabase.rpc('add_column_if_not_exists', {
          p_table_name: 'user_progress',
          p_column_name: column.name,
          p_data_type: column.type,
          p_default_value: column.default || null
        });
      } catch (error) {
        console.warn(`Error adding column ${column.name} to user_progress table:`, error);
        // Continue with other columns even if one fails
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error updating user_progress table:', error);
    return false;
  }
};

// Helper function to update the tour_assignments table
const updateTourAssignmentsTable = async () => {
  try {
    // Check if the table exists
    const { data: tableExists } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'tour_assignments')
      .eq('table_schema', 'public');
    
    if (!tableExists || tableExists.length === 0) {
      // Create the table if it doesn't exist
      await supabase.rpc('create_tour_assignments_table');
    }
    
    // Add columns if they don't exist
    const columnsToAdd = [
      { name: 'tour_id', type: 'uuid' },
      { name: 'driver_id', type: 'uuid' },
      { name: 'status', type: 'text', default: "'assigned'" },
      { name: 'start_time', type: 'timestamp with time zone' },
      { name: 'end_time', type: 'timestamp with time zone' },
      { name: 'completed_stops', type: 'uuid[]', default: "'{}'" },
      { name: 'group_size', type: 'integer' },
      { name: 'vehicle_details', type: 'text' },
      { name: 'notes', type: 'text' }
    ];
    
    for (const column of columnsToAdd) {
      try {
        await supabase.rpc('add_column_if_not_exists', {
          p_table_name: 'tour_assignments',
          p_column_name: column.name,
          p_data_type: column.type,
          p_default_value: column.default || null
        });
      } catch (error) {
        console.warn(`Error adding column ${column.name} to tour_assignments table:`, error);
        // Continue with other columns even if one fails
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error updating tour_assignments table:', error);
    return false;
  }
};

// Helper function to update the driver_locations table
const updateDriverLocationsTable = async () => {
  try {
    // Check if the table exists
    const { data: tableExists } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'driver_locations')
      .eq('table_schema', 'public');
    
    if (!tableExists || tableExists.length === 0) {
      // Create the table if it doesn't exist
      await supabase.rpc('create_driver_locations_table');
    }
    
    // Add columns if they don't exist
    const columnsToAdd = [
      { name: 'driver_id', type: 'uuid' },
      { name: 'latitude', type: 'numeric' },
      { name: 'longitude', type: 'numeric' },
      { name: 'timestamp', type: 'timestamp with time zone' },
      { name: 'speed', type: 'numeric' },
      { name: 'battery_level', type: 'numeric' },
      { name: 'accuracy', type: 'numeric' }
    ];
    
    for (const column of columnsToAdd) {
      try {
        await supabase.rpc('add_column_if_not_exists', {
          p_table_name: 'driver_locations',
          p_column_name: column.name,
          p_data_type: column.type,
          p_default_value: column.default || null
        });
      } catch (error) {
        console.warn(`Error adding column ${column.name} to driver_locations table:`, error);
        // Continue with other columns even if one fails
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error updating driver_locations table:', error);
    return false;
  }
};

// Helper function to update the tour_reviews table
const updateTourReviewsTable = async () => {
  try {
    // Check if the table exists
    const { data: tableExists } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'tour_reviews')
      .eq('table_schema', 'public');
    
    if (!tableExists || tableExists.length === 0) {
      // Create the table if it doesn't exist
      await supabase.rpc('create_tour_reviews_table');
    }
    
    // Add columns if they don't exist
    const columnsToAdd = [
      { name: 'tour_id', type: 'uuid' },
      { name: 'user_id', type: 'uuid' },
      { name: 'rating', type: 'integer' },
      { name: 'comment', type: 'text' },
      { name: 'tour_completed', type: 'boolean', default: 'false' }
    ];
    
    for (const column of columnsToAdd) {
      try {
        await supabase.rpc('add_column_if_not_exists', {
          p_table_name: 'tour_reviews',
          p_column_name: column.name,
          p_data_type: column.type,
          p_default_value: column.default || null
        });
      } catch (error) {
        console.warn(`Error adding column ${column.name} to tour_reviews table:`, error);
        // Continue with other columns even if one fails
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error updating tour_reviews table:', error);
    return false;
  }
};

/**
 * Refreshes the schema cache to ensure all columns are recognized
 */
export const refreshSchemaCache = async () => {
  try {
    console.log('Refreshing schema cache...');
    
    // Perform simple operations to refresh the schema cache
    await supabase.from('tours').select('count').limit(1);
    await supabase.from('tour_stops').select('count').limit(1);
    await supabase.from('audio_tracks').select('count').limit(1);
    
    // Specifically ensure the is_public column is recognized
    await supabase.from('tours').select('is_public').limit(1);
    
    console.log('Schema cache refreshed');
    return true;
  } catch (error) {
    console.error('Error refreshing schema cache:', error);
    return false;
  }
};

// Function to check if the schema is up to date
export const checkSchema = async () => {
  try {
    // Check if all required tables exist
    const requiredTables = [
      'tours',
      'tour_stops',
      'audio_tracks',
      'user_progress',
      'tour_assignments',
      'driver_locations',
      'tour_reviews',
      'websocket_tickets',
      'audio_chunks'
    ];
    
    // Check if tables exist
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .in('table_name', requiredTables)
      .eq('table_schema', 'public');
    
    if (tablesError) {
      console.error('Error checking tables:', tablesError);
      return false;
    }
    
    // If not all tables exist, schema is not up to date
    if (!tables || tables.length !== requiredTables.length) {
      console.log(`Missing tables. Found ${tables ? tables.length : 0} of ${requiredTables.length} required tables.`);
      return false;
    }
    
    // Check if the required columns exist in the tours table
    const { data: toursColumns, error: toursError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'tours')
      .in('column_name', ['difficulty', 'accessibility', 'theme', 'transportation', 'financials', 'languages']);
    
    if (toursError) {
      console.error('Error checking tours schema:', toursError);
      return false;
    }
    
    if (!toursColumns || toursColumns.length !== 6) {
      console.log(`Missing columns in tours table. Found ${toursColumns ? toursColumns.length : 0} of 6 required columns.`);
      return false;
    }
    
    // Check if the tour_stops table exists with required columns
    const { data: stopsColumns, error: stopsError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'tour_stops')
      .in('column_name', ['location', 'gallery', 'interactive_elements', 'trigger_radius', 'estimated_time']);
    
    if (stopsError) {
      console.error('Error checking tour_stops schema:', stopsError);
      return false;
    }
    
    if (!stopsColumns || stopsColumns.length !== 5) {
      console.log(`Missing columns in tour_stops table. Found ${stopsColumns ? stopsColumns.length : 0} of 5 required columns.`);
      return false;
    }
    
    // Check if the audio_tracks table exists with required columns
    const { data: audioColumns, error: audioError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'audio_tracks')
      .in('column_name', ['language', 'audio_url', 'transcript', 'duration']);
    
    if (audioError) {
      console.error('Error checking audio_tracks schema:', audioError);
      return false;
    }
    
    if (!audioColumns || audioColumns.length !== 4) {
      console.log(`Missing columns in audio_tracks table. Found ${audioColumns ? audioColumns.length : 0} of 4 required columns.`);
      return false;
    }
    
    // Check if the user_progress table exists with required columns
    const { data: progressColumns, error: progressError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'user_progress')
      .in('column_name', ['user_id', 'tour_id', 'completed_stops', 'last_stop_id', 'preferred_language']);
    
    if (progressError) {
      console.error('Error checking user_progress schema:', progressError);
      return false;
    }
    
    if (!progressColumns || progressColumns.length !== 5) {
      console.log(`Missing columns in user_progress table. Found ${progressColumns ? progressColumns.length : 0} of 5 required columns.`);
      return false;
    }
    
    // If all required tables and columns exist, the schema is up to date
    console.log('All required tables and columns exist. Schema is up to date.');
    return true;
  } catch (error) {
    console.error('Error checking schema:', error);
    return false;
  }
};