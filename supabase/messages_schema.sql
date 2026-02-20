-- Create the messages table with all features for AFGgram
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID REFERENCES public.profiles(id) NOT NULL,
    receiver_id UUID REFERENCES public.profiles(id) NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    media_url TEXT,
    media_type TEXT CHECK (media_type IN ('image', 'video', 'file', 'voice')),
    reactions JSONB DEFAULT '{}'::jsonb,
    expires_at TIMESTAMP WITH TIME ZONE,
    view_once BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 1. Users can view messages they sent or received
DROP POLICY IF EXISTS "Users can view their own messages" ON public.messages;
CREATE POLICY "Users can view their own messages"
ON public.messages FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- 2. Users can send messages as themselves
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "Users can send messages"
ON public.messages FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- 3. Users can update messages (mark as read or react)
-- We allow both sender and receiver to update for reactions, 
-- but only receiver should mark as read in theory. 
-- For simplicity and reactions, we allow update if you are part of the chat.
DROP POLICY IF EXISTS "Users can update messages they are part of" ON public.messages;
CREATE POLICY "Users can update messages they are part of"
ON public.messages FOR UPDATE
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Enable Realtime for messages
-- In Supabase dashboard: Database -> Replication -> supabase_realtime -> Edit -> toggle messages
