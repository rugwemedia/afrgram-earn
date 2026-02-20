-- ── Add reply support to post_comments ─────────────────────────────────────

-- 1. Add reply columns (safe: only if they don't exist)
ALTER TABLE post_comments
    ADD COLUMN IF NOT EXISTS reply_to_id  uuid REFERENCES post_comments(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS reply_to_name text;

-- 2. Make sure user_id is tracked on all comments (should already exist)
-- ALTER TABLE post_comments ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- 3. Enable RLS if not already
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

-- 4. Allow anyone (authenticated) to read comments
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='post_comments' AND policyname='comments_read'
    ) THEN
        CREATE POLICY "comments_read" ON post_comments
            FOR SELECT TO authenticated USING (true);
    END IF;
END $$;

-- 5. Allow authenticated users to insert their own comments
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='post_comments' AND policyname='comments_insert'
    ) THEN
        CREATE POLICY "comments_insert" ON post_comments
            FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- 6. Allow users to delete ONLY their own comments
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='post_comments' AND policyname='comments_delete_own'
    ) THEN
        CREATE POLICY "comments_delete_own" ON post_comments
            FOR DELETE TO authenticated USING (auth.uid() = user_id);
    END IF;
END $$;
