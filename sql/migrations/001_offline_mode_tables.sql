-- Migration: Offline Mode Tables
-- Description: Creates tables for offline tour downloads and content caching

-- Offline downloads tracking
CREATE TABLE IF NOT EXISTS tour_downloads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tour_id UUID NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
    download_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (download_status IN ('pending', 'downloading', 'completed', 'failed', 'expired')),
    download_size_mb DECIMAL(10,2),
    download_progress INTEGER DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE,
    downloaded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Offline content cache
CREATE TABLE IF NOT EXISTS offline_content_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_id UUID NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
    content_type VARCHAR(50) NOT NULL, -- 'audio', 'image', 'data'
    file_path VARCHAR(500) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    checksum VARCHAR(64) NOT NULL,
    cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Interactive content for tours
CREATE TABLE IF NOT EXISTS interactive_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stop_id UUID NOT NULL REFERENCES tour_stops(id) ON DELETE CASCADE,
    content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('quiz', 'poll', 'photo_challenge', 'scavenger_hunt')),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content_data JSONB NOT NULL, -- Questions, options, challenges
    points_reward INTEGER DEFAULT 0,
    is_required BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User interactions and responses
CREATE TABLE IF NOT EXISTS user_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    interactive_content_id UUID NOT NULL REFERENCES interactive_content(id) ON DELETE CASCADE,
    response_data JSONB NOT NULL,
    points_earned INTEGER DEFAULT 0,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tour_downloads_user_id ON tour_downloads(user_id);
CREATE INDEX IF NOT EXISTS idx_tour_downloads_tour_id ON tour_downloads(tour_id);
CREATE INDEX IF NOT EXISTS idx_tour_downloads_status ON tour_downloads(download_status);
CREATE INDEX IF NOT EXISTS idx_offline_content_cache_tour_id ON offline_content_cache(tour_id);
CREATE INDEX IF NOT EXISTS idx_offline_content_cache_type ON offline_content_cache(content_type);
CREATE INDEX IF NOT EXISTS idx_interactive_content_stop_id ON interactive_content(stop_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_user_id ON user_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_content_id ON user_interactions(interactive_content_id);

-- RLS Policies
ALTER TABLE tour_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE offline_content_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactive_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own downloads
CREATE POLICY "Users can view own downloads" ON tour_downloads
    FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own downloads
CREATE POLICY "Users can create own downloads" ON tour_downloads
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own downloads
CREATE POLICY "Users can update own downloads" ON tour_downloads
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can view cached content for tours they have access to
CREATE POLICY "Users can view cached content" ON offline_content_cache
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM tours 
            WHERE id = offline_content_cache.tour_id 
            AND (is_public = true OR created_by = auth.uid())
        )
    );

-- Users can view interactive content for accessible tours
CREATE POLICY "Users can view interactive content" ON interactive_content
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM tour_stops ts
            JOIN tours t ON ts.tour_id = t.id
            WHERE ts.id = interactive_content.stop_id 
            AND (t.is_public = true OR t.created_by = auth.uid())
        )
    );

-- Users can view their own interactions
CREATE POLICY "Users can view own interactions" ON user_interactions
    FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own interactions
CREATE POLICY "Users can create own interactions" ON user_interactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can view all data
CREATE POLICY "Admins can view all downloads" ON tour_downloads
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND 'Admin' = ANY(user_group)
        )
    );

CREATE POLICY "Admins can view all cached content" ON offline_content_cache
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND 'Admin' = ANY(user_group)
        )
    );

CREATE POLICY "Admins can manage interactive content" ON interactive_content
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND 'Admin' = ANY(user_group)
        )
    );

CREATE POLICY "Admins can view all interactions" ON user_interactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND 'Admin' = ANY(user_group)
        )
    );

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tour_downloads_updated_at
    BEFORE UPDATE ON tour_downloads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();