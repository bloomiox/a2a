# Database Schema Updates

## Tour Signups Table

To support the new tour signup functionality on the Landing page, you need to create the `tour_signups` table in your Supabase database.

### SQL to create the table:

```sql
-- Create tour_signups table
CREATE TABLE tour_signups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tour_id UUID REFERENCES tours(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    message TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_tour_signups_tour_id ON tour_signups(tour_id);
CREATE INDEX idx_tour_signups_email ON tour_signups(email);
CREATE INDEX idx_tour_signups_status ON tour_signups(status);
CREATE INDEX idx_tour_signups_created_at ON tour_signups(created_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tour_signups_updated_at 
    BEFORE UPDATE ON tour_signups 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE tour_signups ENABLE ROW LEVEL SECURITY;

-- Create policies for tour_signups
-- Allow anyone to create signups (for public landing page)
CREATE POLICY "Anyone can create tour signups" ON tour_signups
    FOR INSERT WITH CHECK (true);

-- Allow users to read their own signups
CREATE POLICY "Users can read their own signups" ON tour_signups
    FOR SELECT USING (auth.email() = email);

-- Allow admins to read all signups
CREATE POLICY "Admins can read all signups" ON tour_signups
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND user_group @> ARRAY['Admin']
        )
    );

-- Allow admins to update signups
CREATE POLICY "Admins can update signups" ON tour_signups
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND user_group @> ARRAY['Admin']
        )
    );

-- Allow admins to delete signups
CREATE POLICY "Admins can delete signups" ON tour_signups
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND user_group @> ARRAY['Admin']
        )
    );
```

### Update Tours Table

You may also want to add an `is_public` field to the tours table to mark which tours should appear on the public landing page:

```sql
-- Add is_public column to tours table
ALTER TABLE tours ADD COLUMN is_public BOOLEAN DEFAULT false;

-- Create index for better performance
CREATE INDEX idx_tours_is_public ON tours(is_public);
```

## How to Apply These Changes

1. **Via Supabase Dashboard:**
   - Go to your Supabase project dashboard
   - Navigate to the SQL Editor
   - Copy and paste the SQL above
   - Execute the queries

2. **Via Supabase CLI:**
   ```bash
   supabase db reset
   # or create a new migration
   supabase migration new add_tour_signups_table
   # Add the SQL to the migration file
   supabase db push
   ```

## Testing the Schema

After applying the schema changes, you can test the functionality:

1. **Landing Page:** Visit the landing page and try signing up for a tour
2. **Admin Dashboard:** Go to Admin Dashboard > CRM & Signups tab to view signups
3. **Database:** Check the `tour_signups` table in Supabase to see the data

## Notes

- The `tour_signups` table is designed to be publicly writable for the landing page signup form
- Row Level Security (RLS) policies ensure that only admins can view all signups
- Users can only view their own signups if they're logged in
- The `status` field allows tracking signup states: pending, confirmed, cancelled