-- Reel comments table
CREATE TABLE IF NOT EXISTS reel_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reel_id UUID NOT NULL REFERENCES reels(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE reel_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reel_comments_select" ON reel_comments;
DROP POLICY IF EXISTS "reel_comments_insert" ON reel_comments;
DROP POLICY IF EXISTS "reel_comments_delete" ON reel_comments;

-- Anyone authenticated can read comments
CREATE POLICY "reel_comments_select" ON reel_comments
    FOR SELECT TO authenticated USING (true);

-- Users can insert their own comments
CREATE POLICY "reel_comments_insert" ON reel_comments
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "reel_comments_delete" ON reel_comments
    FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Add comments_count column to reels if not there yet
ALTER TABLE reels ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0;

-- Auto-increment comments_count on the reel
CREATE OR REPLACE FUNCTION increment_reel_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE reels SET comments_count = comments_count + 1 WHERE id = NEW.reel_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_reel_comment_insert ON reel_comments;
CREATE TRIGGER on_reel_comment_insert
    AFTER INSERT ON reel_comments
    FOR EACH ROW EXECUTE FUNCTION increment_reel_comments_count();

-- Auto-decrement
CREATE OR REPLACE FUNCTION decrement_reel_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE reels SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.reel_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_reel_comment_delete ON reel_comments;
CREATE TRIGGER on_reel_comment_delete
    AFTER DELETE ON reel_comments
    FOR EACH ROW EXECUTE FUNCTION decrement_reel_comments_count();

-- Index
CREATE INDEX IF NOT EXISTS idx_reel_comments_reel_id ON reel_comments(reel_id);
