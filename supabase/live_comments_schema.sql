-- ── Live Stream Comments ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS live_stream_comments (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at      timestamptz NOT NULL DEFAULT now(),
    session_id      uuid REFERENCES live_sessions(id) ON DELETE CASCADE,
    user_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    content         text NOT NULL
);

ALTER TABLE live_stream_comments ENABLE ROW LEVEL SECURITY;

-- DROP AND RECREATE POLICIES
DROP POLICY IF EXISTS "Anyone can view comments" ON live_stream_comments;
DROP POLICY IF EXISTS "Authenticated users can post comments" ON live_stream_comments;
DROP POLICY IF EXISTS "Hosts can delete comments" ON live_stream_comments;

CREATE POLICY "Anyone can view comments" ON live_stream_comments
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can post comments" ON live_stream_comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Hosts can delete comments" ON live_stream_comments
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM live_sessions 
            WHERE live_sessions.id = live_stream_comments.session_id 
            AND live_sessions.host_id = auth.uid()
        )
    );

-- Enable Realtime
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'live_stream_comments'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE live_stream_comments;
    END IF;
END $$;
