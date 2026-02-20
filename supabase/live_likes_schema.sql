-- ── Live Stream Likes ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS live_stream_likes (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at      timestamptz NOT NULL DEFAULT now(),
    session_id      uuid REFERENCES live_sessions(id) ON DELETE CASCADE,
    user_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    UNIQUE(session_id, user_id)
);

ALTER TABLE live_stream_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view likes" ON live_stream_likes;
CREATE POLICY "Anyone can view likes" ON live_stream_likes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can like" ON live_stream_likes;
CREATE POLICY "Authenticated users can like" ON live_stream_likes FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unlike" ON live_stream_likes;
CREATE POLICY "Users can unlike" ON live_stream_likes FOR DELETE USING (auth.uid() = user_id);

-- Enable Realtime for likes
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'live_stream_likes'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE live_stream_likes;
    END IF;
END $$;
