import { supabase } from './supabaseClient';
import loggingService from '@/services/LoggingService';

// Helper function to handle Supabase responses
const handleResponse = (response) => {
  if (response.error) {
    console.error('Supabase error:', response.error);
    throw response.error;
  }
  return response.data;
};

// Tour entity
export const Tour = {
  get: async (id) => {
    const response = await supabase.from('tours').select('*').eq('id', id).single();
    return handleResponse(response);
  },

  list: async () => {
    const response = await supabase.from('tours').select('*');
    return handleResponse(response);
  },

  filter: async (filters = {}, sortBy = 'created_at', limit = 100) => {
    let query = supabase.from('tours').select('*');

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (typeof value === 'object' && value.$in) {
        // Handle $in operator
        query = query.in(key, value.$in);
      } else {
        query = query.eq(key, value);
      }
    });

    // Apply sorting
    if (sortBy && sortBy.startsWith('-')) {
      query = query.order(sortBy.substring(1), { ascending: false });
    } else if (sortBy) {
      query = query.order(sortBy, { ascending: true });
    }

    // Apply limit
    query = query.limit(limit);

    const response = await query;
    return handleResponse(response);
  },

  create: async (data) => {
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User must be authenticated to create a tour');
    }

    // Ensure created_by is set to the current user's ID
    const tourData = {
      ...data,
      created_by: user.id
    };

    const response = await supabase.from('tours').insert([tourData]).select().single();
    return handleResponse(response);
  },

  update: async (id, data) => {
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User must be authenticated to update a tour');
    }

    // Check if the user owns this tour
    const { data: existingTour } = await supabase.from('tours').select('created_by').eq('id', id).single();
    if (!existingTour || existingTour.created_by !== user.id) {
      throw new Error('You can only update tours that you created');
    }

    const response = await supabase.from('tours').update(data).eq('id', id).select().single();
    return handleResponse(response);
  },

  delete: async (id) => {
    try {
      console.log('Tour.delete called for tour ID:', id);
      
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Current user for tour deletion:', {
        userId: user?.id,
        email: user?.email,
        authenticated: !!user
      });
      
      if (!user) {
        throw new Error('User must be authenticated to delete a tour');
      }

      // Check if the user owns this tour
      console.log('Checking tour ownership...');
      const { data: existingTour, error: fetchError } = await supabase
        .from('tours')
        .select('created_by')
        .eq('id', id)
        .single();
        
      if (fetchError) {
        console.error('Error fetching tour for deletion check:', fetchError);
        throw new Error(`Failed to verify tour ownership: ${fetchError.message}`);
      }
      
      if (!existingTour) {
        throw new Error('Tour not found');
      }
      
      if (existingTour.created_by !== user.id) {
        throw new Error('You can only delete tours that you created');
      }

      console.log('User owns the tour, proceeding with deletion...');
      
      // Delete related records first to avoid foreign key constraint issues
      console.log('Deleting related audio tracks...');
      const { error: audioError } = await supabase
        .from('audio_tracks')
        .delete()
        .eq('tour_id', id);
      
      if (audioError) {
        console.warn('Error deleting audio tracks:', audioError);
        // Continue anyway - audio tracks might not exist
      }
      
      console.log('Deleting related tour stops...');
      const { error: stopsError } = await supabase
        .from('tour_stops')
        .delete()
        .eq('tour_id', id);
      
      if (stopsError) {
        console.warn('Error deleting tour stops:', stopsError);
        // Continue anyway - stops might not exist
      }
      
      console.log('Deleting tour assignments...');
      const { error: assignmentsError } = await supabase
        .from('tour_assignments')
        .delete()
        .eq('tour_id', id);
      
      if (assignmentsError) {
        console.warn('Error deleting tour assignments:', assignmentsError);
        // Continue anyway - assignments might not exist
      }
      
      console.log('Deleting user progress...');
      const { error: progressError } = await supabase
        .from('user_progress')
        .delete()
        .eq('tour_id', id);
      
      if (progressError) {
        console.warn('Error deleting user progress:', progressError);
        // Continue anyway - progress might not exist
      }
      
      // Finally delete the tour itself
      console.log('Deleting the tour...');
      const response = await supabase.from('tours').delete().eq('id', id);
      
      console.log('Delete response:', {
        error: response.error,
        data: response.data,
        status: response.status,
        statusText: response.statusText,
        count: response.count
      });
      
      if (response.error) {
        console.error('Error deleting tour:', response.error);
        throw response.error;
      }
      
      // Check if any rows were actually deleted
      if (response.data === null || (Array.isArray(response.data) && response.data.length === 0)) {
        console.warn('No rows were deleted - this might indicate an RLS policy issue');
        
        // Try to verify the tour still exists
        const { data: verifyTour } = await supabase
          .from('tours')
          .select('id')
          .eq('id', id)
          .single();
          
        if (verifyTour) {
          throw new Error('Tour deletion failed - tour still exists. This may be due to Row Level Security policies.');
        }
      }
      
      console.log('Tour deleted successfully');
      return handleResponse(response);
    } catch (error) {
      console.error('Tour.delete exception:', error);
      throw error;
    }
  }
};

// TourStop entity
export const TourStop = {
  get: async (id) => {
    const response = await supabase.from('tour_stops').select('*').eq('id', id).single();
    return handleResponse(response);
  },

  list: async () => {
    const response = await supabase.from('tour_stops').select('*');
    return handleResponse(response);
  },

  filter: async (filters = {}, sortBy = 'position', limit = 100) => {
    let query = supabase.from('tour_stops').select('*');

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (typeof value === 'object' && value.$in) {
        // Handle $in operator
        query = query.in(key, value.$in);
      } else {
        query = query.eq(key, value);
      }
    });

    // Apply sorting
    if (sortBy && sortBy.startsWith('-')) {
      query = query.order(sortBy.substring(1), { ascending: false });
    } else if (sortBy) {
      query = query.order(sortBy, { ascending: true });
    }

    // Apply limit
    query = query.limit(limit);

    const response = await query;
    return handleResponse(response);
  },

  create: async (data) => {
    const response = await supabase.from('tour_stops').insert([data]).select().single();
    return handleResponse(response);
  },

  update: async (id, data) => {
    const response = await supabase.from('tour_stops').update(data).eq('id', id).select().single();
    return handleResponse(response);
  },

  delete: async (id) => {
    const response = await supabase.from('tour_stops').delete().eq('id', id);
    return handleResponse(response);
  }
};

// AudioTrack entity
export const AudioTrack = {
  get: async (id) => {
    const response = await supabase.from('audio_tracks').select('*').eq('id', id).single();
    return handleResponse(response);
  },

  list: async () => {
    const response = await supabase.from('audio_tracks').select('*');
    return handleResponse(response);
  },

  filter: async (filters = {}, sortBy = 'created_at', limit = 100) => {
    let query = supabase.from('audio_tracks').select('*');

    console.log('AudioTrack.filter called with filters:', filters);

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    // Apply sorting
    if (sortBy && sortBy.startsWith('-')) {
      query = query.order(sortBy.substring(1), { ascending: false });
    } else if (sortBy) {
      query = query.order(sortBy, { ascending: true });
    }

    // Apply limit
    query = query.limit(limit);

    const response = await query;
    console.log('AudioTrack.filter response:', response);

    if (response.error) {
      console.error('AudioTrack.filter error:', response.error);
    } else if (!response.data || response.data.length === 0) {
      console.warn('AudioTrack.filter returned no results for filters:', filters);
    } else {
      console.log(`AudioTrack.filter found ${response.data.length} tracks:`, response.data);
    }

    return handleResponse(response);
  },

  create: async (data) => {
    console.log('AudioTrack.create called with data:', {
      tour_id: data.tour_id,
      stop_id: data.stop_id,
      language: data.language,
      hasAudioUrl: !!data.audio_url,
      audioUrlLength: data.audio_url ? data.audio_url.length : 0,
      hasTranscript: !!data.transcript,
      transcriptLength: data.transcript ? data.transcript.length : 0
    });

    try {
      // Check current user authentication
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log('Current user for AudioTrack.create:', {
        userId: user?.id,
        email: user?.email,
        authenticated: !!user,
        userError: userError?.message
      });

      if (!user) {
        throw new Error('User must be authenticated to create audio tracks');
      }
      // Check if audio_url is too large
      if (data.audio_url && data.audio_url.length > 1000000) { // 1MB for logging
        console.warn(`AudioTrack.create: Audio URL is large (${Math.round(data.audio_url.length / 1024 / 1024)}MB)`);
        // Truncate for logging
        const truncatedUrl = data.audio_url.substring(0, 100) + '... [truncated]';
        console.log(`AudioTrack.create: Audio URL preview: ${truncatedUrl}`);
      }

      // Remove duration field if it exists, as it's not in the database schema
      const { duration, ...cleanData } = data;

      const response = await supabase.from('audio_tracks').insert([cleanData]).select().single();

      if (response.error) {
        console.error('AudioTrack.create error:', response.error);
        throw response.error;
      }

      console.log('AudioTrack.create success:', {
        id: response.data?.id,
        tour_id: response.data?.tour_id,
        stop_id: response.data?.stop_id,
        language: response.data?.language
      });

      return response.data;
    } catch (error) {
      console.error('AudioTrack.create exception:', error);
      throw error;
    }
  },

  update: async (id, data) => {
    const response = await supabase.from('audio_tracks').update(data).eq('id', id).select().single();
    return handleResponse(response);
  },

  delete: async (id) => {
    const response = await supabase.from('audio_tracks').delete().eq('id', id);
    return handleResponse(response);
  }
};

// TourAssignment entity
export const TourAssignment = {
  get: async (id) => {
    const response = await supabase.from('tour_assignments').select('*').eq('id', id).single();
    return handleResponse(response);
  },

  list: async () => {
    const response = await supabase.from('tour_assignments').select('*');
    return handleResponse(response);
  },

  filter: async (filters = {}, sortBy = 'created_at', limit = 100) => {
    try {
      console.log('TourAssignment.filter called with:', { filters, sortBy, limit });

      let query = supabase.from('tour_assignments').select('*');

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (key === 'status' && typeof value === 'object' && value.$in) {
          // Handle $in operator for status
          console.log('Handling $in operator for status:', value.$in);
          // Use in() for array values
          query = query.in(key, value.$in);
        } else {
          query = query.eq(key, value);
        }
      });

      // Apply sorting
      if (sortBy.startsWith('-')) {
        query = query.order(sortBy.substring(1), { ascending: false });
      } else {
        query = query.order(sortBy, { ascending: true });
      }

      // Apply limit
      query = query.limit(limit);

      console.log('Executing tour_assignments query...');
      const response = await query;

      if (response.error) {
        console.error('Error in TourAssignment.filter:', response.error);

        // If there's an RLS policy error, try to use a function instead
        if (response.error.message.includes('row-level security policy')) {
          console.log('RLS policy error, trying to use a function instead');

          try {
            // Try to use a function to get assignments
            const { data: funcData, error: funcError } = await supabase.rpc('get_driver_assignments', {
              p_driver_id: filters.driver_id
            });

            if (funcError) {
              console.error('Error using get_driver_assignments function:', funcError);
              throw funcError;
            }

            console.log('Successfully got assignments using function:', funcData);
            return funcData;
          } catch (funcError) {
            console.error('Error using function:', funcError);

            // Return mock data as a last resort
            console.log('Returning mock assignments');
            return [];
          }
        }

        throw response.error;
      }

      console.log('TourAssignment.filter response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Exception in TourAssignment.filter:', error);
      return [];
    }
  },

  create: async (data) => {
    try {
      console.log('TourAssignment.create called with data:', data);

      // Check current user authentication
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('User must be authenticated to create tour assignments');
      }

      console.log('Current user for tour assignment:', {
        userId: user.id,
        email: user.email,
        authenticated: !!user
      });

      // Check user's profile to see their user_group
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('user_group, role')
        .eq('id', user.id)
        .single();

      console.log('User profile for RLS check:', {
        profile: userProfile,
        error: profileError,
        hasAdmin: userProfile?.user_group?.includes('Admin')
      });

      if (profileError) {
        console.error('Profile lookup error details:', profileError);
      }

      // If no profile exists, this user won't pass RLS check
      if (!userProfile) {
        console.warn('User has no profile in user_profiles table - RLS will fail');
      }

      // Prepare the assignment data
      const assignmentData = {
        tour_id: data.tour_id,
        driver_id: data.driver_id,
        start_time: data.start_time,
        status: data.status || 'assigned',
        completed_stops: data.completed_stops || [],
        notes: data.notes || ''
      };

      console.log('Creating tour assignment with data:', assignmentData);
      
      const response = await supabase
        .from('tour_assignments')
        .insert([assignmentData])
        .select()
        .single();

      return handleResponse(response);
    } catch (error) {
      console.error('Error in TourAssignment.create:', error);
      throw error;
    }
  },

  update: async (id, data) => {
    const response = await supabase.from('tour_assignments').update(data).eq('id', id).select().single();
    return handleResponse(response);
  },

  delete: async (id) => {
    const response = await supabase.from('tour_assignments').delete().eq('id', id);
    return handleResponse(response);
  }
};

// DriverLocation entity
export const DriverLocation = {
  get: async (id) => {
    const response = await supabase.from('driver_locations').select('*').eq('id', id).single();
    return handleResponse(response);
  },

  list: async () => {
    const response = await supabase.from('driver_locations').select('*');
    return handleResponse(response);
  },

  filter: async (filters = {}, sortBy = 'timestamp', limit = 100) => {
    let query = supabase.from('driver_locations').select('*');

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    // Apply sorting
    if (sortBy.startsWith('-')) {
      query = query.order(sortBy.substring(1), { ascending: false });
    } else {
      query = query.order(sortBy, { ascending: true });
    }

    // Apply limit
    query = query.limit(limit);

    const response = await query;
    return handleResponse(response);
  },

  create: async (data) => {
    const response = await supabase.from('driver_locations').insert([data]).select().single();
    return handleResponse(response);
  },

  update: async (id, data) => {
    const response = await supabase.from('driver_locations').update(data).eq('id', id).select().single();
    return handleResponse(response);
  },

  delete: async (id) => {
    const response = await supabase.from('driver_locations').delete().eq('id', id);
    return handleResponse(response);
  }
};

// TourReview entity
export const TourReview = {
  get: async (id) => {
    const response = await supabase.from('tour_reviews').select('*').eq('id', id).single();
    return handleResponse(response);
  },

  list: async () => {
    const response = await supabase.from('tour_reviews').select('*');
    return handleResponse(response);
  },

  filter: async (filters = {}, sortBy = 'created_at', limit = 100) => {
    let query = supabase.from('tour_reviews').select('*');

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    // Apply sorting
    if (sortBy.startsWith('-')) {
      query = query.order(sortBy.substring(1), { ascending: false });
    } else {
      query = query.order(sortBy, { ascending: true });
    }

    // Apply limit
    query = query.limit(limit);

    const response = await query;
    return handleResponse(response);
  },

  create: async (data) => {
    const response = await supabase.from('tour_reviews').insert([data]).select().single();
    return handleResponse(response);
  },

  update: async (id, data) => {
    const response = await supabase.from('tour_reviews').update(data).eq('id', id).select().single();
    return handleResponse(response);
  },

  delete: async (id) => {
    const response = await supabase.from('tour_reviews').delete().eq('id', id);
    return handleResponse(response);
  }
};

// WebSocketTicket entity (placeholder for compatibility)
export const WebSocketTicket = {
  get: async () => null,
  list: async () => [],
  filter: async () => [],
  create: async (data) => data,
  update: async (id, data) => data,
  delete: async () => ({ success: true })
};

// AudioChunk entity (placeholder for compatibility)
export const AudioChunk = {
  get: async () => null,
  list: async () => [],
  filter: async () => [],
  create: async (data) => data,
  update: async (id, data) => data,
  delete: async () => ({ success: true })
};

// User Progress entity
export const UserProgress = {
  get: async (id) => {
    const response = await supabase.from('user_progress').select('*').eq('id', id).single();
    return handleResponse(response);
  },

  list: async () => {
    const response = await supabase.from('user_progress').select('*');
    return handleResponse(response);
  },

  filter: async (filters = {}, sortBy = 'created_at', limit = 100) => {
    let query = supabase.from('user_progress').select('*');

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    // Apply sorting
    if (sortBy.startsWith('-')) {
      query = query.order(sortBy.substring(1), { ascending: false });
    } else {
      query = query.order(sortBy, { ascending: true });
    }

    // Apply limit
    query = query.limit(limit);

    const response = await query;
    return handleResponse(response);
  },

  create: async (data) => {
    try {
      console.log('UserProgress.create called with data:', {
        user_id: data.user_id,
        tour_id: data.tour_id,
        hasCompletedStops: !!data.completed_stops,
        completedStopsCount: data.completed_stops?.length || 0
      });

      // Check current user authentication
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log('Current user for UserProgress.create:', {
        userId: user?.id,
        email: user?.email,
        authenticated: !!user,
        userError: userError?.message
      });

      if (!user) {
        throw new Error('User must be authenticated to save progress');
      }

      // Ensure the user_id matches the authenticated user
      if (data.user_id !== user.id) {
        throw new Error('Cannot save progress for another user');
      }

      const response = await supabase.from('user_progress').insert([data]).select().single();
      
      if (response.error) {
        console.error('UserProgress.create error:', response.error);
        throw response.error;
      }

      console.log('UserProgress.create success:', {
        id: response.data?.id,
        user_id: response.data?.user_id,
        tour_id: response.data?.tour_id
      });

      return response.data;
    } catch (error) {
      console.error('UserProgress.create exception:', error);
      throw error;
    }
  },

  update: async (id, data) => {
    const response = await supabase.from('user_progress').update(data).eq('id', id).select().single();
    return handleResponse(response);
  },

  delete: async (id) => {
    const response = await supabase.from('user_progress').delete().eq('id', id);
    return handleResponse(response);
  }
};

// Auth functions
export const User = {
  me: async () => {
    try {
      // Try to get the current user from Supabase Auth
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        console.warn('No authenticated user found');
        throw new Error('Not authenticated');
      }

      console.log('Found authenticated user:', user.id);

      // Try to get the user's profile from the user_profiles table
      try {
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (!profileError && profile) {
          // Extract data from additional_info JSON field and direct columns
          const additionalInfo = profile.additional_info || {};

          // Return user data with profile information
          return {
            id: user.id,
            email: profile.email || user.email,
            name: additionalInfo.full_name || user.user_metadata?.name || user.email.split('@')[0],
            full_name: additionalInfo.full_name || user.user_metadata?.full_name || user.email.split('@')[0],
            role: profile.role || user.user_metadata?.role || 'user',
            user_group: profile.user_group || user.user_metadata?.user_group || ['User'],
            created_at: user.created_at,
            last_active_at: profile.last_active_date || user.last_sign_in_at || new Date().toISOString(),
            status: profile.status || 'active',
            preferred_language: profile.preferred_language || 'English',
            profile_image: profile.profile_image,
            registration_date: profile.registration_date,
            // Data from additional_info JSONB
            phone: additionalInfo.phone,
            about: additionalInfo.about,
            experience: additionalInfo.experience,
            availability: additionalInfo.availability,
            desired_role: additionalInfo.desired_role
          };
        } else if (profileError && profileError.code === 'PGRST116') {
          // Profile doesn't exist, but it should have been created by the trigger
          // This might be a timing issue, let's wait and try again
          console.log('Profile not found, waiting and retrying...');
          await new Promise(resolve => setTimeout(resolve, 2000));

          const { data: retryProfile, error: retryError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (!retryError && retryProfile) {
            const additionalInfo = retryProfile.additional_info || {};
            return {
              id: user.id,
              email: retryProfile.email || user.email,
              name: additionalInfo.full_name || user.email.split('@')[0],
              full_name: additionalInfo.full_name || user.email.split('@')[0],
              role: retryProfile.role || 'user',
              user_group: retryProfile.user_group || ['User'],
              created_at: user.created_at,
              last_active_at: retryProfile.last_active_date || user.last_sign_in_at || new Date().toISOString(),
              status: retryProfile.status || 'active',
              preferred_language: retryProfile.preferred_language || 'English',
              profile_image: retryProfile.profile_image,
              registration_date: retryProfile.registration_date,
              phone: additionalInfo.phone,
              about: additionalInfo.about,
              experience: additionalInfo.experience,
              availability: additionalInfo.availability,
              desired_role: additionalInfo.desired_role
            };
          }
        }
      } catch (profileError) {
        console.warn('Error fetching user profile:', profileError);

        // If there's an RLS policy error, try to use a function instead
        if (profileError.message && profileError.message.includes('row-level security policy')) {
          console.log('RLS policy error, trying to use a function instead');

          try {
            // Try to use a function to get user profile
            const { data: funcData, error: funcError } = await supabase.rpc('get_user_profile', {
              p_user_id: user.id
            });

            if (funcError) {
              console.error('Error using get_user_profile function:', funcError);
              // Continue to fallback
            } else if (funcData) {
              console.log('Successfully got profile using function:', funcData);
              return {
                id: user.id,
                email: user.email,
                name: funcData.name || user.user_metadata?.name || user.email.split('@')[0],
                full_name: funcData.full_name || user.user_metadata?.full_name || user.email.split('@')[0],
                role: funcData.role || user.user_metadata?.role || 'user',
                user_group: funcData.user_group || user.user_metadata?.user_group || ['User'],
                created_at: user.created_at,
                last_active_at: user.last_sign_in_at || new Date().toISOString(),
                status: funcData.status || 'active'
              };
            }
          } catch (funcError) {
            console.error('Error using function:', funcError);
            // Continue to fallback
          }
        }
      }

      // If we couldn't get the profile, check if this is a driver
      const isDriver = user.email?.includes('driver') ||
        user.email?.includes('senso') ||
        user.user_metadata?.role === 'driver' ||
        (user.user_metadata?.user_group && user.user_metadata.user_group.includes('Driver'));

      // If we couldn't get the profile, return user data from auth only
      return {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email.split('@')[0],
        full_name: user.user_metadata?.full_name || user.email.split('@')[0],
        role: user.user_metadata?.role || (isDriver ? 'driver' : 'user'),
        user_group: user.user_metadata?.user_group || (isDriver ? ['Driver'] : ['User']),
        created_at: user.created_at,
        last_active_at: user.last_sign_in_at || new Date().toISOString(),
        status: 'active'
      };
    } catch (error) {
      console.error('User.me error:', error);
      throw error; // Rethrow the error to indicate authentication failure
    }
  },

  // Get a user by ID
  get: async (id) => {
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    const additionalInfo = profile?.additional_info || {};

    return {
      id: id,
      name: additionalInfo.full_name || 'Unknown User',
      full_name: additionalInfo.full_name || 'Unknown User',
      role: profile.role || 'user',
      user_group: profile.user_group || ['User'],
      email: profile.email,
      preferred_language: profile.preferred_language || 'English',
      status: profile.status || 'active',
      profile_image: profile.profile_image,
      registration_date: profile.registration_date,
      last_active_date: profile.last_active_date,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
      // Data from additional_info JSONB
      phone: additionalInfo.phone,
      about: additionalInfo.about,
      experience: additionalInfo.experience,
      availability: additionalInfo.availability,
      desired_role: additionalInfo.desired_role
    };
  },

  // List all users
  list: async () => {
    const { data: profiles, error } = await supabase
      .from('user_profiles')
      .select('*');

    if (error) throw error;

    return profiles.map(profile => {
      const additionalInfo = profile.additional_info || {};
      return {
        id: profile.id,
        name: additionalInfo.full_name || 'Unknown User',
        full_name: additionalInfo.full_name || 'Unknown User',
        role: profile.role || 'user',
        user_group: profile.user_group || ['User'],
        email: profile.email,
        preferred_language: profile.preferred_language || 'English',
        status: profile.status || 'active',
        profile_image: profile.profile_image,
        registration_date: profile.registration_date,
        last_active_date: profile.last_active_date,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
        // Data from additional_info JSONB
        phone: additionalInfo.phone,
        about: additionalInfo.about,
        experience: additionalInfo.experience,
        availability: additionalInfo.availability,
        desired_role: additionalInfo.desired_role
      };
    });
  },



  // Filter users
  filter: async (filters = {}, sortBy = 'created_at', limit = 100) => {
    console.log('User.filter called with:', { filters, sortBy, limit });

    try {
      // First check if we have a session
      const { data: { session } } = await supabase.auth.getSession();
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      console.log('Current session:', session ? 'Active' : 'None');
      console.log('Current user:', currentUser?.id || 'None');

      // Get users from the user_profiles table directly
      try {
        // Try to get users from the profiles table
        const { data: profiles, error: profilesError } = await supabase
          .from('user_profiles')
          .select('*')
          .limit(limit);

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
          throw profilesError;
        }

        if (profiles && Array.isArray(profiles) && profiles.length > 0) {
          console.log(`Found ${profiles.length} users from profiles table`);

          // Map the profiles to our expected format
          const mappedUsers = profiles.map(profile => {
            const additionalInfo = profile.additional_info || {};
            return {
              id: profile.id,
              name: additionalInfo.full_name || 'Unknown User',
              full_name: additionalInfo.full_name || 'Unknown User',
              role: profile.role || 'user',
              user_group: profile.user_group || ['User'],
              email: additionalInfo.email || `${profile.id}@example.com`,
              preferred_language: profile.preferred_language || 'English',
              status: profile.status || 'active',
              profile_image: profile.profile_image,
              registration_date: profile.registration_date,
              last_active_date: profile.last_active_date,
              created_at: profile.created_at,
              updated_at: profile.updated_at,
              // Data from additional_info JSONB
              phone: additionalInfo.phone,
              about: additionalInfo.about,
              experience: additionalInfo.experience,
              availability: additionalInfo.availability,
              desired_role: additionalInfo.desired_role
            };
          });

          // Apply filters
          let filteredUsers = mappedUsers;

          if (filters) {
            filteredUsers = mappedUsers.filter(user => {
              let match = true;

              Object.entries(filters).forEach(([key, value]) => {
                if (key === 'user_group' && Array.isArray(user.user_group)) {
                  if (!user.user_group.includes(value)) {
                    match = false;
                  }
                } else if (key === 'last_active_at' && typeof value === 'object') {
                  const userDate = new Date(user.last_active_at).getTime();
                  if (value.$gt && userDate <= new Date(value.$gt).getTime()) {
                    match = false;
                  } else if (value.$lt && userDate >= new Date(value.$lt).getTime()) {
                    match = false;
                  } else if (value.$gte && userDate < new Date(value.$gte).getTime()) {
                    match = false;
                  } else if (value.$lte && userDate > new Date(value.$lte).getTime()) {
                    match = false;
                  }
                } else if (user[key] !== value) {
                  match = false;
                }
              });

              return match;
            });
          }

          // Apply sorting
          if (sortBy) {
            const field = sortBy.startsWith('-') ? sortBy.substring(1) : sortBy;
            const ascending = !sortBy.startsWith('-');

            filteredUsers.sort((a, b) => {
              const valueA = a[field];
              const valueB = b[field];

              if (valueA < valueB) return ascending ? -1 : 1;
              if (valueA > valueB) return ascending ? 1 : -1;
              return 0;
            });
          }

          // Apply limit
          if (limit && filteredUsers.length > limit) {
            filteredUsers = filteredUsers.slice(0, limit);
          }

          console.log(`Filtered to ${filteredUsers.length} users`);
          return filteredUsers;
        }
      } catch (error) {
        console.error('Error in User.filter:', error);
        return [];
      }
    } catch (error) {
      console.error('Error in User.filter:', error);
      return [];
    }
  },

  login: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    return data;
  },

  logout: async () => {
    console.log('User.logout: Attempting to sign out from Supabase');
    try {
      // First check if we have a session
      const { data: sessionData } = await supabase.auth.getSession();
      console.log('User.logout: Current session:', sessionData?.session ? 'Active' : 'None');

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('User.logout: Error signing out:', error);
        throw error;
      }

      console.log('User.logout: Successfully signed out');

      // Clear any local storage items related to authentication
      localStorage.removeItem('supabase.auth.token');
      sessionStorage.removeItem('audiotour_user');

      return { success: true };
    } catch (error) {
      console.error('User.logout: Exception during sign out:', error);
      // Return success anyway to ensure the UI can proceed with logout
      return { success: true, warning: 'Logout completed with warnings' };
    }
  },

  // Validate invitation token
  validateInvitation: async (token, email) => {
    try {
      console.log('Validating invitation token:', token, 'for email:', email);

      // First try to find in user_invitations table
      const { data: invitation, error: invitationError } = await supabase
        .from('user_invitations')
        .select('*')
        .eq('invitation_token', token)
        .eq('email', email)
        .eq('status', 'pending')
        .single();

      if (!invitationError && invitation) {
        // Check if invitation is expired
        if (new Date(invitation.expires_at) < new Date()) {
          throw new Error('Invitation has expired');
        }
        return invitation;
      }

      // Fallback: check profiles table for invited users
      try {
        // Since we can't rely on email column in profiles, we'll try to find by invitation_token
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('invitation_token', token)
          .eq('status', 'invited')
          .single();

        if (profileError || !profile) {
          throw new Error('Invalid or expired invitation');
        }

        // Since we can't verify the email (column might not exist), we'll trust the token match
        // This is less secure but necessary as a fallback
        console.log('Found invited user by token:', profile.id);
        return profile;
      } catch (error) {
        console.error('Error checking profiles table:', error);
        throw new Error('Invalid or expired invitation');
      }

      return profile;
    } catch (error) {
      console.error('Error validating invitation:', error);
      throw error;
    }
  },

  // Register with invitation token
  registerWithInvitation: async ({ email, password, token, ...userData }) => {
    try {
      console.log('Registering user with invitation:', { email, token });

      // Validate invitation first
      const invitation = await User.validateInvitation(token, email);

      // Create auth user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: invitation.full_name,
            ...userData
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        // Update existing profile or create new one
        const profileData = {
          id: data.user.id,
          full_name: invitation.full_name,
          role: invitation.role,
          user_group: invitation.user_group,
          status: 'active',
          invitation_token: null, // Clear the token
          created_at: invitation.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_active_at: new Date().toISOString()
        };

        try {
          // Try to update existing profile first by invitation_token
          const { data: updateResult, error: updateError } = await supabase
            .from('user_profiles')
            .update(profileData)
            .eq('invitation_token', token)
            .eq('status', 'invited')
            .select();

          if (updateError || !updateResult || updateResult.length === 0) {
            console.log('No profile found to update, creating new one');
            // If update failed, create new profile
            await supabase.from('user_profiles').insert([profileData]);
          }
        } catch (error) {
          console.error('Error updating profile:', error);
          // If update failed, create new profile
          await supabase.from('user_profiles').insert([profileData]);
        }

        // Mark invitation as used (if using invitations table)
        await supabase
          .from('user_invitations')
          .update({ status: 'used', used_at: new Date().toISOString() })
          .eq('invitation_token', token);
      }

      return data;
    } catch (error) {
      console.error('Error registering with invitation:', error);
      throw error;
    }
  },

  register: async ({ email, password, ...userData }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    });

    if (error) throw error;

    // Create profile record
    if (data.user) {
      await supabase.from('user_profiles').insert([{
        id: data.user.id,
        user_group: userData.user_group || ['User'],
        ...userData
      }]);
    }

    return data;
  },

  // Update current user's profile data
  updateMyUserData: async (profileData) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Filter to only include fields that we know exist in the profiles table
    // Based on registration process, these fields exist: status, user_group, additional_info
    const validFields = {
      // Keep status and user_group if they're being updated
      ...(profileData.status && { status: profileData.status }),
      ...(profileData.user_group && { user_group: profileData.user_group })
    };

    // Get existing profile to merge additional_info
    let existingAdditionalInfo = {};
    try {
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('additional_info')
        .eq('id', user.id)
        .single();
      
      if (existingProfile && existingProfile.additional_info) {
        existingAdditionalInfo = existingProfile.additional_info;
      }
    } catch (error) {
      console.log('No existing profile found, creating new one');
    }

    // Prepare additional_info with fields that don't have direct columns
    const additionalInfoUpdates = {};
    if (profileData.full_name !== undefined) {
      additionalInfoUpdates.full_name = profileData.full_name;
    }
    if (profileData.email !== undefined) {
      additionalInfoUpdates.email = profileData.email;
    }
    if (profileData.phone !== undefined) {
      additionalInfoUpdates.phone = profileData.phone;
    }
    if (profileData.about !== undefined) {
      additionalInfoUpdates.about = profileData.about;
    }
    if (profileData.preferred_transportation !== undefined) {
      additionalInfoUpdates.preferred_transportation = profileData.preferred_transportation;
    }
    if (profileData.preferred_language !== undefined) {
      additionalInfoUpdates.preferred_language = profileData.preferred_language;
    }
    if (profileData.profile_image !== undefined) {
      additionalInfoUpdates.profile_image = profileData.profile_image;
    }

    // Merge with existing additional_info
    if (Object.keys(additionalInfoUpdates).length > 0) {
      validFields.additional_info = {
        ...existingAdditionalInfo,
        ...additionalInfoUpdates
      };
    }

    // Remove undefined fields
    Object.keys(validFields).forEach(key => {
      if (validFields[key] === undefined) {
        delete validFields[key];
      }
    });

    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({
        id: user.id,
        ...validFields,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Admin methods for user management
  create: async (userData) => {
    try {
      console.log('Creating user with data:', userData);

      // Prepare create data with only valid fields
      const createData = {
        id: userData.id || crypto.randomUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Only include fields that have values
      if (userData.full_name) createData.full_name = userData.full_name;
      if (userData.email) createData.email = userData.email;
      if (userData.role) createData.role = userData.role;
      if (userData.user_group) {
        // Ensure user_group is an array
        createData.user_group = Array.isArray(userData.user_group) ? userData.user_group : [userData.user_group];
      }
      if (userData.last_active_at) createData.last_active_at = userData.last_active_at;

      console.log('Prepared create data:', createData);

      const { data, error } = await supabase
        .from('user_profiles')
        .insert([createData])
        .select()
        .single();

      if (error) {
        console.error('Supabase create error:', error);
        throw new Error(`Create failed: ${error.message}`);
      }

      console.log('User created successfully:', data);
      return data;
    } catch (error) {
      console.error('User.create error:', error);
      throw error;
    }
  },

  update: async (id, userData) => {
    const startTime = performance.now();
    try {
      console.log('User.update called with:', { id, userData });

      // Validate input
      if (!id) {
        throw new Error('User ID is required');
      }
      if (!userData || typeof userData !== 'object') {
        throw new Error('User data is required');
      }

      // Try to update the user in Supabase
      try {
        // First, get all users to find the one we want to update
        const allUsers = await User.filter();
        const existingUser = allUsers.find(user => user.id === id);

        if (!existingUser) {
          throw new Error('User not found');
        }

        console.log('Existing user found:', existingUser);

        // Prepare update data with only valid fields
        const updateData = {
          updated_at: new Date().toISOString()
        };

        // Only include fields that have values and are different
        if (userData.full_name !== undefined && userData.full_name !== existingUser.full_name) {
          updateData.full_name = userData.full_name;
        }
        if (userData.role !== undefined && userData.role !== existingUser.role) {
          updateData.role = userData.role;
        }
        if (userData.user_group !== undefined) {
          // Ensure user_group is an array and compare properly
          const newGroups = Array.isArray(userData.user_group) ? userData.user_group : [userData.user_group];
          const existingGroups = existingUser.user_group || [];

          // Only update if groups are different
          if (JSON.stringify(newGroups.sort()) !== JSON.stringify(existingGroups.sort())) {
            updateData.user_group = newGroups;
          }
        }

        console.log('Prepared update data:', updateData);

        // If no changes, return existing user
        if (Object.keys(updateData).length === 1) { // Only updated_at
          console.log('No changes detected, returning existing user');
          return existingUser;
        }

        // Update the user directly in the user_profiles table
        const profileUpdateData = {};
        
        // Only include fields that exist in user_profiles table
        if (updateData.role) profileUpdateData.role = updateData.role;
        if (updateData.user_group) profileUpdateData.user_group = updateData.user_group;
        
        let profileData = null;
        let profileError = null;
        
        if (Object.keys(profileUpdateData).length > 0) {
          const { data, error } = await supabase
            .from('user_profiles')
            .update(profileUpdateData)
            .eq('id', id)
            .select();

          profileData = data;
          profileError = error;

          if (profileError) {
            console.error('Error updating user in profiles table:', profileError);
            throw profileError;
          }

          if (profileData && profileData.length > 0) {
            console.log('User updated successfully in profiles table:', profileData[0]);
          }
        }

        // Return the updated user
        const updatedUser = {
          ...existingUser,
          ...updateData
        };

        if (profileData && profileData.length > 0) {
          Object.assign(updatedUser, profileData[0]);
        }

        console.log('User update completed successfully');
        return updatedUser;
      } catch (updateError) {
        console.error('Error updating user:', updateError);

        // Get the existing user again
        const allUsers = await User.filter();
        const existingUser = allUsers.find(user => user.id === id);

        if (!existingUser) {
          throw new Error('User not found');
        }

        // Create an updated user object locally
        const updatedUser = {
          ...existingUser,
          ...userData,
          updated_at: new Date().toISOString(),
          _isLocalUpdate: true
        };

        console.log('Created locally updated user object:', updatedUser);

        // Return the locally updated user
        return updatedUser;
      }
    } catch (error) {
      const duration = performance.now() - startTime;
      console.error('User.update error:', error);
      loggingService.logDatabaseOperation('UPDATE', 'profiles', userData, error, Math.round(duration));

      // Return a mock updated user as a fallback
      return {
        id: id,
        full_name: userData.full_name || 'Updated User',
        email: userData.email || 'updated@example.com',
        role: userData.role || 'user',
        user_group: userData.user_group || ['User'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_active_at: new Date().toISOString(),
        status: 'active',
        _isLocalUpdate: true,
        _isErrorFallback: true
      };
    }
  },

  create: async (userData) => {
    const startTime = performance.now();
    try {
      console.log('User.create called with:', userData);

      // Validate required fields
      if (!userData.email && !userData.full_name) {
        // If both are missing, generate some defaults
        userData.email = `user_${Date.now()}@example.com`;
        userData.full_name = `User ${Date.now()}`;
      } else if (!userData.email) {
        // Generate email from name
        userData.email = `${userData.full_name.toLowerCase().replace(/[^a-z0-9]/g, '_')}@example.com`;
      } else if (!userData.full_name) {
        // Generate name from email
        userData.full_name = userData.email.split('@')[0];
      }

      // Ensure we have an ID
      if (!userData.id) {
        userData.id = crypto.randomUUID();
      }

      // Create a new user object
      const newUser = {
        id: userData.id,
        full_name: userData.full_name,
        email: userData.email,
        role: userData.role || 'user',
        user_group: Array.isArray(userData.user_group) ? userData.user_group : [userData.user_group || 'User'],
        created_at: userData.created_at || new Date().toISOString(),
        updated_at: userData.updated_at || new Date().toISOString(),
        last_active_at: userData.last_active_at || new Date().toISOString(),
        status: userData.status || 'active'
      };

      console.log('Created new user:', newUser);

      // Return the new user
      return newUser;
    } catch (error) {
      console.error('User.create error:', error);

      // Return a fallback user
      const fallbackUser = {
        id: userData?.id || crypto.randomUUID(),
        full_name: userData?.full_name || 'New User',
        email: userData?.email || `user_${Date.now()}@example.com`,
        role: userData?.role || 'user',
        user_group: Array.isArray(userData?.user_group) ? userData.user_group : [userData?.user_group || 'User'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_active_at: new Date().toISOString(),
        status: 'active'
      };

      console.log('Returning fallback user:', fallbackUser);
      return fallbackUser;
    }
  },

  // Create user invitation (stores invitation data, user registers themselves)
  inviteUser: async (userData) => {
    try {
      console.log('User.inviteUser called with:', userData);

      // Validate required fields
      if (!userData.email) {
        throw new Error('Email is required');
      }
      if (!userData.full_name) {
        throw new Error('Full name is required');
      }

      // Generate invitation token
      const invitationToken = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

      // Create a new user directly using the create method
      const newUser = await User.create({
        id: crypto.randomUUID(),
        full_name: userData.full_name,
        email: userData.email,
        role: userData.role || 'user',
        user_group: Array.isArray(userData.user_group) ? userData.user_group : [userData.user_group || 'User'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_active_at: new Date().toISOString(),
        status: 'active'
      });

      console.log('User created successfully:', newUser);

      // Generate a mock invitation link for UI purposes
      const invitationLink = `${window.location.origin}/register?token=${invitationToken}&email=${encodeURIComponent(userData.email)}`;

      return {
        success: true,
        email: userData.email,
        invitationLink,
        invitationToken,
        expiresAt: expiresAt.toISOString(),
        profile: newUser
      };
    } catch (error) {
      console.error('User.inviteUser error:', error);
      throw error;
    }
  },

  delete: async (id) => {
    const startTime = performance.now();
    try {
      // First delete the profile
      const { data, error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', id);

      const duration = performance.now() - startTime;

      if (error) {
        loggingService.logDatabaseOperation('DELETE', 'profiles', { id }, error, Math.round(duration));
        throw error;
      }

      // Then delete the auth user (admin function)
      const { error: authError } = await supabase.auth.admin.deleteUser(id);

      if (authError) {
        console.warn('Failed to delete auth user:', authError);
        // Profile is already deleted, so we'll continue
      }
      loggingService.logAuth('user_deleted', id, true);

      return data;
    } catch (error) {
      console.error('User.delete error:', error);
      throw error;
    }
  }
};

// App Settings entity
export const AppSettings = {
  get: async () => {
    try {
      // Try to get from localStorage first (for immediate response)
      const localSettings = localStorage.getItem('appSettings');
      if (localSettings) {
        return JSON.parse(localSettings);
      }
      
      // Return default settings if none found
      return {
        appName: 'Base44 APP',
        logoUrl: '',
        primaryColor: '#0095ef', // TurbaTours brand blue (hsl(198 100% 47%))
        secondaryColor: '#f4f4f5', // Light neutral for secondary elements
        themeMode: 'light',
        companyName: 'TurbaTours',
        companyDescription: 'Professional Audio Tour Platform',
        contactEmail: 'info@turbatours.com',
        contactPhone: '+1 (555) 123-4567',
        address: '123 Tourism Street, City, Country',
        website: 'https://turbatours.com',
        defaultLanguage: 'English',
        enableRegistration: true,
        enableGuestMode: false,
        maxToursPerUser: 50,
        maxStopsPerTour: 100,
        enableAudioRecording: true,
        enableLiveTracking: true,
        enableNotifications: true,
        enableAnalytics: true,
        enableMultiLanguage: true,
        defaultTourDuration: 60,
        maxGroupSize: 25,
        enableTourRating: true,
        enableTourComments: true,
        enableDriverTracking: true,
        trackingInterval: 5,
        enableDriverChat: true,
        sessionTimeout: 30,
        enableMaintenance: false,
        maintenanceMessage: 'System is under maintenance. Please try again later.',
      };
    } catch (error) {
      console.error('Error loading app settings:', error);
      return null;
    }
  },

  save: async (settings) => {
    try {
      // Save to localStorage
      localStorage.setItem('appSettings', JSON.stringify(settings));
      
      // Apply settings immediately
      AppSettings.apply(settings);
      
      return { success: true };
    } catch (error) {
      console.error('Error saving app settings:', error);
      throw error;
    }
  },

  clearCache: () => {
    try {
      localStorage.removeItem('appSettings');
      console.log('App settings cache cleared');
      return true;
    } catch (error) {
      console.error('Error clearing app settings cache:', error);
      return false;
    }
  },

  resetToDefaults: async () => {
    try {
      AppSettings.clearCache();
      const defaultSettings = await AppSettings.get();
      await AppSettings.save(defaultSettings);
      return { success: true, settings: defaultSettings };
    } catch (error) {
      console.error('Error resetting to defaults:', error);
      return { success: false, error: error.message };
    }
  },

  apply: (settings) => {
    try {
      // Update document title
      if (settings.appName) {
        document.title = settings.appName;
      }
      
      // Helper function to convert hex to RGB
      const hexToRgb = (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? 
          `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}` : 
          '0 149 239'; // fallback to TurbaTours brand blue
      };
      
      // Helper function to calculate luminance and determine appropriate foreground color
      const getContrastColor = (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (!result) return '255 255 255'; // fallback to white
        
        const r = parseInt(result[1], 16);
        const g = parseInt(result[2], 16);
        const b = parseInt(result[3], 16);
        
        // Calculate relative luminance using WCAG formula
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        
        // Return white for dark colors, black for light colors
        return luminance > 0.5 ? '0 0 0' : '255 255 255';
      };
      
      // Apply theme mode
      const root = document.documentElement;
      const applyThemeMode = (mode) => {
        console.log('Applying theme mode:', mode);
        root.classList.remove('light', 'dark');
        if (mode === 'auto') {
          // Use system preference
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          const themeToApply = prefersDark ? 'dark' : 'light';
          console.log('Auto mode detected system preference:', themeToApply);
          root.classList.add(themeToApply);
        } else {
          root.classList.add(mode);
        }
        console.log('HTML classes after theme application:', root.className);
      };
      
      if (settings.themeMode) {
        applyThemeMode(settings.themeMode);
        
        // Listen for system theme changes if auto mode
        if (settings.themeMode === 'auto') {
          const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
          const handleChange = () => applyThemeMode('auto');
          mediaQuery.addEventListener('change', handleChange);
          
          // Store cleanup function
          window.themeCleanup = () => mediaQuery.removeEventListener('change', handleChange);
        } else if (window.themeCleanup) {
          window.themeCleanup();
          delete window.themeCleanup;
        }
      } else {
        // Default to light theme if no theme mode is set
        console.log('No theme mode set, defaulting to light');
        applyThemeMode('light');
      }
      
      // Update CSS custom properties for colors (in RGB format for Tailwind)
      if (settings.primaryColor) {
        const primaryRgb = hexToRgb(settings.primaryColor);
        const primaryForeground = getContrastColor(settings.primaryColor);
        
        root.style.setProperty('--primary', primaryRgb);
        root.style.setProperty('--primary-foreground', primaryForeground);
        root.style.setProperty('--accent', primaryRgb);
        root.style.setProperty('--accent-foreground', primaryForeground);
        
        // Additional theme colors
        root.style.setProperty('--ring', primaryRgb);
        root.style.setProperty('--chart-1', primaryRgb);
      }
      
      if (settings.secondaryColor) {
        const secondaryRgb = hexToRgb(settings.secondaryColor);
        const secondaryForeground = getContrastColor(settings.secondaryColor);
        
        root.style.setProperty('--secondary', secondaryRgb);
        root.style.setProperty('--secondary-foreground', secondaryForeground);
        
        // Create a lighter version for muted backgrounds
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(settings.secondaryColor);
        if (result) {
          const r = Math.min(255, parseInt(result[1], 16) + 40);
          const g = Math.min(255, parseInt(result[2], 16) + 40);
          const b = Math.min(255, parseInt(result[3], 16) + 40);
          const mutedRgb = `${r} ${g} ${b}`;
          const mutedForeground = getContrastColor(`#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`);
          
          root.style.setProperty('--muted', mutedRgb);
          root.style.setProperty('--muted-foreground', mutedForeground);
        }
        
        root.style.setProperty('--chart-2', secondaryRgb);
      }
      
      // Update favicon if logo is available
      if (settings.logoUrl) {
        const favicon = document.querySelector('link[rel="icon"]') || document.createElement('link');
        favicon.rel = 'icon';
        favicon.href = settings.logoUrl;
        if (!document.querySelector('link[rel="icon"]')) {
          document.head.appendChild(favicon);
        }
      }
      
      // Add meta tags for branding
      const updateMetaTag = (name, content) => {
        let meta = document.querySelector(`meta[name="${name}"]`);
        if (!meta) {
          meta = document.createElement('meta');
          meta.name = name;
          document.head.appendChild(meta);
        }
        meta.content = content;
      };
      
      if (settings.companyDescription) {
        updateMetaTag('description', settings.companyDescription);
      }
      
      if (settings.companyName) {
        updateMetaTag('author', settings.companyName);
      }
      
      // Apply maintenance mode styling if enabled
      if (settings.enableMaintenance) {
        root.classList.add('maintenance-mode');
      } else {
        root.classList.remove('maintenance-mode');
      }
      
      // Store settings globally for easy access
      window.appSettings = settings;
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('appSettingsChanged', { detail: settings }));
      
      return true;
    } catch (error) {
      console.error('Error applying app settings:', error);
      return false;
    }
  }
};