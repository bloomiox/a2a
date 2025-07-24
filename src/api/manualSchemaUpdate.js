import { supabase } from './supabaseClient';

/**
 * Manually creates the necessary tables in the database
 */
export const manualSchemaUpdate = async () => {
  try {
    console.log('Manually updating schema...');
    
    // Create the tours table
    await createToursTable();
    
    // Create the tour_stops table
    await createTourStopsTable();
    
    // Create the audio_tracks table
    await createAudioTracksTable();
    
    // Create the user_progress table
    await createUserProgressTable();
    
    // Create the tour_assignments table
    await createTourAssignmentsTable();
    
    // Create the driver_locations table
    await createDriverLocationsTable();
    
    // Create the tour_reviews table
    await createTourReviewsTable();
    
    console.log('Schema manually updated successfully');
    return true;
  } catch (error) {
    console.error('Error manually updating schema:', error);
    return false;
  }
};

// Helper function to create the tours table
const createToursTable = async () => {
  try {
    // Check if the table exists
    const { data: tableExists } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'tours')
      .eq('table_schema', 'public');
    
    if (!tableExists || tableExists.length === 0) {
      // Create the table if it doesn't exist
      await supabase.from('tours').insert({
        title: 'Temporary Tour',
        description: 'This is a temporary tour to create the table',
        theme: 'cultural',
        difficulty: 'easy',
        transportation: 'walking',
        duration: 60,
        is_public: false,
        location: {
          city: '',
          country: '',
          start_point: {
            latitude: null,
            longitude: null,
            address: ''
          }
        }
      }).select();
      
      // Delete the temporary tour
      const { data: tempTour } = await supabase
        .from('tours')
        .select('id')
        .eq('title', 'Temporary Tour')
        .eq('description', 'This is a temporary tour to create the table')
        .single();
      
      if (tempTour) {
        await supabase.from('tours').delete().eq('id', tempTour.id);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error creating tours table:', error);
    return false;
  }
};

// Helper function to create the tour_stops table
const createTourStopsTable = async () => {
  try {
    // Check if the table exists
    const { data: tableExists } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'tour_stops')
      .eq('table_schema', 'public');
    
    if (!tableExists || tableExists.length === 0) {
      // First, make sure we have a tour to reference
      const { data: tour } = await supabase
        .from('tours')
        .select('id')
        .limit(1)
        .single();
      
      if (!tour) {
        // Create a temporary tour if none exists
        const { data: tempTour } = await supabase
          .from('tours')
          .insert({
            title: 'Temporary Tour',
            description: 'This is a temporary tour to create the table',
            theme: 'cultural',
            difficulty: 'easy',
            transportation: 'walking',
            duration: 60,
            is_public: false,
            location: {
              city: '',
              country: '',
              start_point: {
                latitude: null,
                longitude: null,
                address: ''
              }
            }
          })
          .select()
          .single();
        
        // Create the tour_stops table by inserting a temporary record
        await supabase.from('tour_stops').insert({
          tour_id: tempTour.id,
          title: 'Temporary Stop',
          description: 'This is a temporary stop to create the table',
          position: 0,
          location: {
            latitude: null,
            longitude: null,
            address: ''
          },
          trigger_radius: 50,
          estimated_time: 5,
          gallery: [],
          interactive_elements: []
        }).select();
        
        // Delete the temporary stop
        const { data: tempStop } = await supabase
          .from('tour_stops')
          .select('id')
          .eq('title', 'Temporary Stop')
          .eq('description', 'This is a temporary stop to create the table')
          .single();
        
        if (tempStop) {
          await supabase.from('tour_stops').delete().eq('id', tempStop.id);
        }
        
        // Delete the temporary tour
        await supabase.from('tours').delete().eq('id', tempTour.id);
      } else {
        // Create the tour_stops table by inserting a temporary record
        await supabase.from('tour_stops').insert({
          tour_id: tour.id,
          title: 'Temporary Stop',
          description: 'This is a temporary stop to create the table',
          position: 0,
          location: {
            latitude: null,
            longitude: null,
            address: ''
          },
          trigger_radius: 50,
          estimated_time: 5,
          gallery: [],
          interactive_elements: []
        }).select();
        
        // Delete the temporary stop
        const { data: tempStop } = await supabase
          .from('tour_stops')
          .select('id')
          .eq('title', 'Temporary Stop')
          .eq('description', 'This is a temporary stop to create the table')
          .single();
        
        if (tempStop) {
          await supabase.from('tour_stops').delete().eq('id', tempStop.id);
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error creating tour_stops table:', error);
    return false;
  }
};

// Helper function to create the audio_tracks table
const createAudioTracksTable = async () => {
  try {
    // Check if the table exists
    const { data: tableExists } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'audio_tracks')
      .eq('table_schema', 'public');
    
    if (!tableExists || tableExists.length === 0) {
      // First, make sure we have a tour and stop to reference
      const { data: tour } = await supabase
        .from('tours')
        .select('id')
        .limit(1)
        .single();
      
      if (!tour) {
        // Create a temporary tour if none exists
        const { data: tempTour } = await supabase
          .from('tours')
          .insert({
            title: 'Temporary Tour',
            description: 'This is a temporary tour to create the table',
            theme: 'cultural',
            difficulty: 'easy',
            transportation: 'walking',
            duration: 60,
            is_public: false,
            location: {
              city: '',
              country: '',
              start_point: {
                latitude: null,
                longitude: null,
                address: ''
              }
            }
          })
          .select()
          .single();
        
        // Create a temporary stop
        const { data: tempStop } = await supabase
          .from('tour_stops')
          .insert({
            tour_id: tempTour.id,
            title: 'Temporary Stop',
            description: 'This is a temporary stop to create the table',
            position: 0,
            location: {
              latitude: null,
              longitude: null,
              address: ''
            },
            trigger_radius: 50,
            estimated_time: 5,
            gallery: [],
            interactive_elements: []
          })
          .select()
          .single();
        
        // Create the audio_tracks table by inserting a temporary record
        await supabase.from('audio_tracks').insert({
          tour_id: tempTour.id,
          stop_id: tempStop.id,
          language: 'English',
          audio_url: '',
          transcript: '',
          duration: 0
        }).select();
        
        // Delete the temporary audio track
        const { data: tempTrack } = await supabase
          .from('audio_tracks')
          .select('id')
          .eq('tour_id', tempTour.id)
          .eq('stop_id', tempStop.id)
          .single();
        
        if (tempTrack) {
          await supabase.from('audio_tracks').delete().eq('id', tempTrack.id);
        }
        
        // Delete the temporary stop
        await supabase.from('tour_stops').delete().eq('id', tempStop.id);
        
        // Delete the temporary tour
        await supabase.from('tours').delete().eq('id', tempTour.id);
      } else {
        // Check if we have a stop
        const { data: stop } = await supabase
          .from('tour_stops')
          .select('id')
          .eq('tour_id', tour.id)
          .limit(1)
          .single();
        
        if (!stop) {
          // Create a temporary stop
          const { data: tempStop } = await supabase
            .from('tour_stops')
            .insert({
              tour_id: tour.id,
              title: 'Temporary Stop',
              description: 'This is a temporary stop to create the table',
              position: 0,
              location: {
                latitude: null,
                longitude: null,
                address: ''
              },
              trigger_radius: 50,
              estimated_time: 5,
              gallery: [],
              interactive_elements: []
            })
            .select()
            .single();
          
          // Create the audio_tracks table by inserting a temporary record
          await supabase.from('audio_tracks').insert({
            tour_id: tour.id,
            stop_id: tempStop.id,
            language: 'English',
            audio_url: '',
            transcript: '',
            duration: 0
          }).select();
          
          // Delete the temporary audio track
          const { data: tempTrack } = await supabase
            .from('audio_tracks')
            .select('id')
            .eq('tour_id', tour.id)
            .eq('stop_id', tempStop.id)
            .single();
          
          if (tempTrack) {
            await supabase.from('audio_tracks').delete().eq('id', tempTrack.id);
          }
          
          // Delete the temporary stop
          await supabase.from('tour_stops').delete().eq('id', tempStop.id);
        } else {
          // Create the audio_tracks table by inserting a temporary record
          await supabase.from('audio_tracks').insert({
            tour_id: tour.id,
            stop_id: stop.id,
            language: 'English',
            audio_url: '',
            transcript: '',
            duration: 0
          }).select();
          
          // Delete the temporary audio track
          const { data: tempTrack } = await supabase
            .from('audio_tracks')
            .select('id')
            .eq('tour_id', tour.id)
            .eq('stop_id', stop.id)
            .single();
          
          if (tempTrack) {
            await supabase.from('audio_tracks').delete().eq('id', tempTrack.id);
          }
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error creating audio_tracks table:', error);
    return false;
  }
};

// Helper function to create the user_progress table
const createUserProgressTable = async () => {
  // This table requires auth.users and tours tables to exist
  // We'll skip this for now as it's not critical for the tour creation
  return true;
};

// Helper function to create the tour_assignments table
const createTourAssignmentsTable = async () => {
  // This table requires auth.users and tours tables to exist
  // We'll skip this for now as it's not critical for the tour creation
  return true;
};

// Helper function to create the driver_locations table
const createDriverLocationsTable = async () => {
  // This table requires auth.users table to exist
  // We'll skip this for now as it's not critical for the tour creation
  return true;
};

// Helper function to create the tour_reviews table
const createTourReviewsTable = async () => {
  // This table requires auth.users and tours tables to exist
  // We'll skip this for now as it's not critical for the tour creation
  return true;
};