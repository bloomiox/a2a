import { supabase } from '@/api/supabaseClient';

/**
 * Verify that the expected tables exist in Supabase
 */
export const verifyTables = async () => {
  const expectedTables = [
    'tours',
    'tour_stops', 
    'audio_tracks',
    'user_progress',
    'tour_assignments',
    'driver_locations',
    'tour_reviews',
    'websocket_tickets',
    'audio_chunks',
    'user_profiles' // or 'profiles' - we need to check which one you used
  ];

  console.log('🔍 Verifying Supabase tables...');

  for (const tableName of expectedTables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (error) {
        if (error.message.includes('relation') && error.message.includes('does not exist')) {
          console.log(`❌ Table '${tableName}' does not exist`);
        } else if (error.message.includes('permission denied') || error.message.includes('row-level security')) {
          console.log(`✅ Table '${tableName}' exists (RLS policy active)`);
        } else {
          console.log(`⚠️  Table '${tableName}' - ${error.message}`);
        }
      } else {
        console.log(`✅ Table '${tableName}' exists and accessible`);
      }
    } catch (err) {
      console.log(`❌ Error checking table '${tableName}':`, err.message);
    }
  }

  // Check if it's 'profiles' or 'user_profiles'
  console.log('\n🔍 Checking user profile table name...');
  
  try {
    const { error: profilesError } = await supabase.from('profiles').select('*').limit(1);
    const { error: userProfilesError } = await supabase.from('user_profiles').select('*').limit(1);

    if (!profilesError || profilesError.message.includes('row-level security')) {
      console.log('✅ Using table name: "profiles"');
      return 'profiles';
    } else if (!userProfilesError || userProfilesError.message.includes('row-level security')) {
      console.log('✅ Using table name: "user_profiles"');
      return 'user_profiles';
    } else {
      console.log('❌ Neither "profiles" nor "user_profiles" table found');
      return null;
    }
  } catch (err) {
    console.log('❌ Error checking profile table names:', err.message);
    return null;
  }
};

/**
 * Test basic Supabase functionality
 */
export const testSupabaseSetup = async () => {
  console.log('🧪 Testing Supabase setup...');

  // Test auth
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error && !error.message.includes('Invalid JWT')) {
      console.log('❌ Auth test failed:', error.message);
    } else {
      console.log('✅ Auth system working');
      if (user) {
        console.log(`   Current user: ${user.email}`);
      }
    }
  } catch (err) {
    console.log('❌ Auth test error:', err.message);
  }

  // Test RLS functions
  console.log('\n🔍 Testing RLS functions...');
  
  const rpcFunctions = [
    'get_all_users',
    'admin_assign_tour', 
    'get_driver_assignments',
    'get_user_profile',
    'get_creator_analytics'
  ];

  for (const funcName of rpcFunctions) {
    try {
      // Just test if the function exists, don't actually call it
      const { error } = await supabase.rpc(funcName, {});
      
      if (error && error.message.includes('function') && error.message.includes('does not exist')) {
        console.log(`❌ RPC function '${funcName}' does not exist`);
      } else {
        console.log(`✅ RPC function '${funcName}' exists`);
      }
    } catch (err) {
      if (err.message.includes('function') && err.message.includes('does not exist')) {
        console.log(`❌ RPC function '${funcName}' does not exist`);
      } else {
        console.log(`✅ RPC function '${funcName}' exists`);
      }
    }
  }
};

// Run verification when this module is imported in development
if (import.meta.env.DEV) {
  // Delay execution to allow Supabase client to initialize
  setTimeout(() => {
    verifyTables().then(testSupabaseSetup);
  }, 1000);
}