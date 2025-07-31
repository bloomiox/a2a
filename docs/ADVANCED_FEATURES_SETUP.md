# Advanced Features Setup Guide

This guide explains how to set up the advanced features for the AudioGuide app.

## Quick Setup

### Step 1: Create Database Tables

1. **Open Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to the SQL Editor

2. **Run the Setup Script**
   - Copy the contents of `sql/create_advanced_tables.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute the script

3. **Verify Tables Created**
   - The script will show a verification query at the end
   - You should see all 7 tables listed with row counts

### Step 2: Test the Mobile App

1. **Access Driver Mobile App**
   - Login as a user with 'Driver' role
   - Go to `/driver/mobile` or click "📱 Mobile App" from driver dashboard
   - The app should now load successfully

2. **Verify Functionality**
   - Toggle availability status
   - View performance metrics (will show zeros initially)
   - Check earnings tab
   - Test navigation between tabs

## What Gets Created

### Database Tables

1. **driver_app_sessions** - Mobile app session tracking
2. **driver_availability** - Driver online/offline status
3. **driver_notifications** - Driver notifications
4. **driver_performance_metrics** - Performance tracking
5. **driver_earnings** - Earnings and payments
6. **tour_downloads** - Offline tour downloads
7. **interactive_content** - Quizzes, polls, challenges

### Features Enabled

- ✅ **Driver Mobile App** - Mobile-optimized interface
- ✅ **Performance Tracking** - Metrics and analytics
- ✅ **Earnings Management** - Payment tracking
- ✅ **Offline Mode** - Download tours for offline use
- ✅ **Interactive Elements** - Quizzes and challenges (foundation)

## Troubleshooting

### Mobile App Still Shows "Loading"

**Possible Issues:**
1. Database tables not created
2. User doesn't have 'Driver' role
3. Browser cache issues

**Solutions:**
1. **Check Tables**: Run this query in Supabase SQL Editor:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name LIKE 'driver_%';
   ```

2. **Check User Role**: Ensure user has 'Driver' in their user_group array:
   ```sql
   SELECT id, full_name, user_group 
   FROM user_profiles 
   WHERE 'Driver' = ANY(user_group);
   ```

3. **Clear Cache**: Hard refresh browser (Ctrl+F5 or Cmd+Shift+R)

### Tables Already Exist Error

If you see "table already exists" errors, that's normal. The script uses `CREATE TABLE IF NOT EXISTS` so it's safe to run multiple times.

### Permission Errors

If you get permission errors:
1. Make sure you're running the script as the database owner
2. Check that RLS policies are properly configured
3. Verify user roles are set correctly

## Manual Verification

### Check Table Creation
```sql
-- List all advanced feature tables
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'driver_app_sessions',
    'driver_availability', 
    'driver_notifications',
    'driver_performance_metrics',
    'driver_earnings',
    'tour_downloads',
    'interactive_content'
);
```

### Check RLS Policies
```sql
-- List RLS policies for driver tables
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename LIKE 'driver_%';
```

### Test Data Access
```sql
-- Test if you can insert sample data
INSERT INTO driver_availability (driver_id, status, updated_at)
VALUES (
    (SELECT id FROM user_profiles WHERE 'Driver' = ANY(user_group) LIMIT 1),
    'offline',
    NOW()
) ON CONFLICT (driver_id) DO NOTHING;
```

## Advanced Configuration

### Custom Settings

You can customize the advanced features by modifying:

1. **Performance Metrics**: Add custom KPIs in `driver_performance_metrics`
2. **Notification Types**: Extend notification categories
3. **Earning Types**: Add new earning/deduction types
4. **Interactive Content**: Create custom quiz/poll types

### Integration Points

The advanced features integrate with:
- **User Management**: Uses existing user_profiles table
- **Tour System**: Links to tours and tour_stops tables
- **Authentication**: Uses Supabase auth system
- **Logging**: Integrates with LoggingService

## Next Steps

Once the basic setup is complete, you can:

1. **Add Sample Data**: Create test drivers and tours
2. **Configure Notifications**: Set up automated notifications
3. **Customize UI**: Modify mobile app appearance
4. **Add Analytics**: Implement advanced reporting
5. **Enable Social Features**: Add photo sharing and reviews

## Support

If you encounter issues:

1. **Check Logs**: Look at browser console for errors
2. **Verify Setup**: Run verification queries
3. **Test Permissions**: Ensure proper user roles
4. **Review Documentation**: Check component-specific guides

The advanced features are designed to work gracefully even if some tables are missing, so the app should remain functional during setup.

---

**Note**: This setup creates the foundation for all advanced features. Individual features may require additional configuration as they're developed further.