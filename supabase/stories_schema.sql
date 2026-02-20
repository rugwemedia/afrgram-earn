-- Stories table for 24-hour disappearing stories
CREATE TABLE IF NOT EXISTS stories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    media_url TEXT NOT NULL,
    media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
    caption TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours')
);

-- Story views tracking
CREATE TABLE IF NOT EXISTS story_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    viewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    viewed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(story_id, viewer_id)
);

-- Enable RLS
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_views ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist
DROP POLICY IF EXISTS "stories_select" ON stories;
DROP POLICY IF EXISTS "stories_insert" ON stories;
DROP POLICY IF EXISTS "stories_delete" ON stories;
DROP POLICY IF EXISTS "story_views_select" ON story_views;
DROP POLICY IF EXISTS "story_views_insert" ON story_views;

-- Stories: anyone authenticated can read active stories
CREATE POLICY "stories_select" ON stories
    FOR SELECT TO authenticated
    USING (expires_at > NOW());

-- Stories: user can insert their own
CREATE POLICY "stories_insert" ON stories
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Stories: user can delete their own
CREATE POLICY "stories_delete" ON stories
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- Story views: authenticated users can read
CREATE POLICY "story_views_select" ON story_views
    FOR SELECT TO authenticated
    USING (true);

-- Story views: authenticated users can insert their own views
CREATE POLICY "story_views_insert" ON story_views
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = viewer_id);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_stories_user_id ON stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_expires_at ON stories(expires_at);
CREATE INDEX IF NOT EXISTS idx_story_views_story_id ON story_views(story_id);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE stories;
