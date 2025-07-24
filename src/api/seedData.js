import { supabase } from './supabaseClient';

// Function to seed the database with initial data
export const seedDatabase = async () => {
  console.log('Seeding database with initial data...');
  
  try {
    // Check if we already have users
    const { data: existingUsers, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
      
    if (checkError) {
      console.error('Error checking for existing users:', checkError);
      return;
    }
    
    // If we already have users, don't seed
    if (existingUsers && existingUsers.length > 0) {
      console.log('Database already has users, skipping seed');
      return;
    }
    
    console.log('No users found, seeding database...');
    
    // Create seed users with unique IDs
    const adminId = crypto.randomUUID();
    const driverId = crypto.randomUUID();
    const touristId = crypto.randomUUID();
    
    const seedUsers = [
      {
        id: adminId,
        full_name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin',
        user_group: ['Admin'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_active_at: new Date().toISOString(),
        status: 'active'
      },
      {
        id: driverId,
        full_name: 'Driver User',
        email: 'driver@example.com',
        role: 'driver',
        user_group: ['Driver'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_active_at: new Date().toISOString(),
        status: 'active'
      },
      {
        id: touristId,
        full_name: 'Tourist User',
        email: 'tourist@example.com',
        role: 'user',
        user_group: ['Tourist'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_active_at: new Date().toISOString(),
        status: 'active'
      }
    ];
    
    // Insert seed users
    const { data: createdUsers, error: createError } = await supabase
      .from('profiles')
      .insert(seedUsers)
      .select();
      
    if (createError) {
      console.error('Error creating seed users:', createError);
      
      // Try inserting one by one in case there's a conflict
      console.log('Trying to insert users one by one...');
      
      for (const user of seedUsers) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .insert([user])
            .select();
            
          if (error) {
            console.error(`Error inserting user ${user.email}:`, error);
          } else {
            console.log(`Successfully inserted user ${user.email}`);
          }
        } catch (err) {
          console.error(`Exception inserting user ${user.email}:`, err);
        }
      }
    } else {
      console.log(`Created ${createdUsers.length} seed users`);
    }
    
    // You can add more seed data here (tours, stops, etc.)
    
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};