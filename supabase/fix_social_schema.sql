-- 0. Ensure UUID extension is available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Add count columns to the posts table if they don't exist
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS likes_count BIGINT DEFAULT 0;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS comments_count BIGINT DEFAULT 0;

-- 2. Create post_likes table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.post_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- 3. Create post_comments table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.post_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Enable RLS
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

-- 5. Set up RLS Policies
DROP POLICY IF EXISTS "Likes are public" ON public.post_likes;
CREATE POLICY "Likes are public" ON public.post_likes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can like posts" ON public.post_likes;
CREATE POLICY "Users can like posts" ON public.post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unlike posts" ON public.post_likes;
CREATE POLICY "Users can unlike posts" ON public.post_likes FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Comments are public" ON public.post_comments;
CREATE POLICY "Comments are public" ON public.post_comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can add comments" ON public.post_comments;
CREATE POLICY "Users can add comments" ON public.post_comments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 6. Trigger Function: Update counts in posts table
CREATE OR REPLACE FUNCTION public.update_post_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        IF (TG_TABLE_NAME = 'post_likes') THEN
            UPDATE public.posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
        ELSIF (TG_TABLE_NAME = 'post_comments') THEN
            UPDATE public.posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
        END IF;
    ELSIF (TG_OP = 'DELETE') THEN
        IF (TG_TABLE_NAME = 'post_likes') THEN
            UPDATE public.posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
        ELSIF (TG_TABLE_NAME = 'post_comments') THEN
            UPDATE public.posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Add Triggers
DROP TRIGGER IF EXISTS on_like_added_deleted ON public.post_likes;
CREATE TRIGGER on_like_added_deleted
    AFTER INSERT OR DELETE ON public.post_likes
    FOR EACH ROW EXECUTE FUNCTION public.update_post_counts();

DROP TRIGGER IF EXISTS on_comment_added_deleted ON public.post_comments;
CREATE TRIGGER on_comment_added_deleted
    AFTER INSERT OR DELETE ON public.post_comments
    FOR EACH ROW EXECUTE FUNCTION public.update_post_counts();

-- 8. Final: Backfill counts for existing data (optional but recommended)
UPDATE public.posts p
SET 
    likes_count = (SELECT COUNT(*) FROM public.post_likes l WHERE l.post_id = p.id),
    comments_count = (SELECT COUNT(*) FROM public.post_comments c WHERE c.post_id = p.id);
