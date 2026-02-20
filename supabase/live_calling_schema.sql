-- ── Live Streaming & Calls ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS live_sessions (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at      timestamptz NOT NULL DEFAULT now(),
    host_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    title           text NOT NULL,
    description     text,
    status          text NOT NULL DEFAULT 'live',
    room_id         text NOT NULL,
    viewer_count    int DEFAULT 0,
    cover_url       text
);

ALTER TABLE live_sessions ENABLE ROW LEVEL SECURITY;

-- DROP AND RECREATE POLICIES TO AVOID ERRORS
DROP POLICY IF EXISTS "Anyone can view live sessions" ON live_sessions;
DROP POLICY IF EXISTS "Authenticated users can create sessions" ON live_sessions;
DROP POLICY IF EXISTS "Hosts can update their own sessions" ON live_sessions;

CREATE POLICY "Anyone can view live sessions" ON live_sessions
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create sessions" ON live_sessions
    FOR INSERT WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Hosts can update their own sessions" ON live_sessions
    FOR UPDATE USING (auth.uid() = host_id);

CREATE POLICY "Hosts can delete their own sessions" ON live_sessions
    FOR DELETE USING (auth.uid() = host_id);


-- ── Call Logs ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS calls (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at      timestamptz NOT NULL DEFAULT now(),
    caller_id       uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    receiver_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    call_type       text NOT NULL DEFAULT 'video',
    status          text NOT NULL DEFAULT 'ringing',
    duration        int DEFAULT 0,
    room_id         text NOT NULL
);

ALTER TABLE calls ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants can view their calls" ON calls;
DROP POLICY IF EXISTS "Callers can create calls" ON calls;
DROP POLICY IF EXISTS "Participants can update (end) calls" ON calls;

CREATE POLICY "Participants can view their calls" ON calls
    FOR SELECT USING (auth.uid() = caller_id OR auth.uid() = receiver_id);

CREATE POLICY "Callers can create calls" ON calls
    FOR INSERT WITH CHECK (auth.uid() = caller_id);

CREATE POLICY "Participants can update (end) calls" ON calls
    FOR UPDATE USING (auth.uid() = caller_id OR auth.uid() = receiver_id);

-- Enable Realtime (Safely handles duplicates in modern Supabase)
ALTER TABLE calls REPLICA IDENTITY FULL;
ALTER TABLE live_sessions REPLICA IDENTITY FULL;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'live_sessions'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE live_sessions;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'calls'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE calls;
    END IF;
END $$;
