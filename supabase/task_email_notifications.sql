-- 1. Ensure profiles has an email column
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Backfill email from auth.users (if possible)
-- Note: This requires relevant permissions in Supabase SQL editor.
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;

-- 3. In-App Notifications Broadcast (for Dashboard Feed)
CREATE OR REPLACE FUNCTION public.trigger_new_task_broadcast()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.notifications (user_id, type, message, metadata)
    SELECT 
        id as user_id, 
        'new_task_broadcast', 
        'New Task Alert: ' || NEW.title || '. Earn ' || NEW.reward || ' RWF!', 
        jsonb_build_object(
            'task_id', NEW.id, 
            'title', NEW.title,
            'reward', NEW.reward
        )
    FROM public.profiles;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Trigger for In-App Broadcast
DROP TRIGGER IF EXISTS on_task_created_broadcast ON public.tasks;
CREATE TRIGGER on_task_created_broadcast
    AFTER INSERT ON public.tasks
    FOR EACH ROW EXECUTE PROCEDURE public.trigger_new_task_broadcast();

-- 5. GUIDE: WEBHOOK CREATION (Supabase Dashboard Settings)
-- Go to Database -> Webhooks -> Create new webhook.
-- NAME: notify_new_task_emails
-- TABLE: public.tasks
-- EVENT: INSERT
-- TYPE: HTTP POST
-- URL: [YOUR_EDGE_FUNCTION_URL]
-- HEADERS: Authorization: Bearer [YOUR_SERVICE_ROLE_KEY]
-- TIMEOUT: 10000 (10s)
