-- 1. Create reels table
CREATE TABLE IF NOT EXISTS public.reels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    video_url TEXT NOT NULL,
    caption TEXT,
    music_name TEXT DEFAULT 'Original Audio',
    likes_count BIGINT DEFAULT 0,
    comments_count BIGINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create reel_likes table
CREATE TABLE IF NOT EXISTS public.reel_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reel_id UUID REFERENCES public.reels(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(reel_id, user_id)
);

-- 3. Create reel_comments table
CREATE TABLE IF NOT EXISTS public.reel_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reel_id UUID REFERENCES public.reels(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Enable RLS
ALTER TABLE public.reels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reel_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reel_comments ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for Reels
DROP POLICY IF EXISTS "Reels are public" ON public.reels;
CREATE POLICY "Reels are public" ON public.reels FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can upload reels" ON public.reels;
CREATE POLICY "Users can upload reels" ON public.reels FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own reels" ON public.reels;
CREATE POLICY "Users can delete own reels" ON public.reels FOR DELETE USING (auth.uid() = user_id);

-- 6. RLS Policies for Likes
DROP POLICY IF EXISTS "Reel likes are public" ON public.reel_likes;
CREATE POLICY "Reel likes are public" ON public.reel_likes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can like reels" ON public.reel_likes;
CREATE POLICY "Users can like reels" ON public.reel_likes FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unlike reels" ON public.reel_likes;
CREATE POLICY "Users can unlike reels" ON public.reel_likes FOR DELETE USING (auth.uid() = user_id);

-- 7. RLS Policies for Comments
DROP POLICY IF EXISTS "Reel comments are public" ON public.reel_comments;
CREATE POLICY "Reel comments are public" ON public.reel_comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can comment on reels" ON public.reel_comments;
CREATE POLICY "Users can comment on reels" ON public.reel_comments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 8. Trigger Function for Reel counts
CREATE OR REPLACE FUNCTION public.update_reel_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        IF (TG_TABLE_NAME = 'reel_likes') THEN
            UPDATE public.reels SET likes_count = likes_count + 1 WHERE id = NEW.reel_id;
        ELSIF (TG_TABLE_NAME = 'reel_comments') THEN
            UPDATE public.reels SET comments_count = comments_count + 1 WHERE id = NEW.reel_id;
        END IF;
    ELSIF (TG_OP = 'DELETE') THEN
        IF (TG_TABLE_NAME = 'reel_likes') THEN
            UPDATE public.reels SET likes_count = likes_count - 1 WHERE id = OLD.reel_id;
        ELSIF (TG_TABLE_NAME = 'reel_comments') THEN
            UPDATE public.reels SET comments_count = comments_count - 1 WHERE id = OLD.reel_id;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Add Triggers
DROP TRIGGER IF EXISTS on_reel_like_added_deleted ON public.reel_likes;
CREATE TRIGGER on_reel_like_added_deleted
    AFTER INSERT OR DELETE ON public.reel_likes
    FOR EACH ROW EXECUTE FUNCTION public.update_reel_counts();

DROP TRIGGER IF EXISTS on_reel_comment_added_deleted ON public.reel_comments;
CREATE TRIGGER on_reel_comment_added_deleted
    AFTER INSERT OR DELETE ON public.reel_comments
    FOR EACH ROW EXECUTE FUNCTION public.update_reel_counts();
