-- 1. Function to notify followers when someone goes live
CREATE OR REPLACE FUNCTION public.notify_followers_on_live()
RETURNS TRIGGER AS $$
DECLARE
    host_name TEXT;
BEGIN
    -- Get host's full name
    SELECT full_name INTO host_name FROM public.profiles WHERE id = NEW.host_id;

    -- Insert notifications for all followers of the host (following_id is the host)
    INSERT INTO public.notifications (user_id, type, message, metadata)
    SELECT 
        follower_id, 
        'live_alert', 
        host_name || ' is now LIVE! Join the stream.', 
        jsonb_build_object(
            'host_id', NEW.host_id, 
            'session_id', NEW.id, 
            'host_name', host_name,
            'room_id', NEW.room_id
        )
    FROM public.follows
    WHERE following_id = NEW.host_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger on live_sessions
DROP TRIGGER IF EXISTS on_new_live_session_notify ON public.live_sessions;
CREATE TRIGGER on_new_live_session_notify
    AFTER INSERT ON public.live_sessions
    FOR EACH ROW EXECUTE PROCEDURE public.notify_followers_on_live();
