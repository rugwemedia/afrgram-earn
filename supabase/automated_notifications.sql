-- 1. Trigger for Follow Notifications
CREATE OR REPLACE FUNCTION public.notify_on_new_follow()
RETURNS TRIGGER AS $$
DECLARE
    follower_name TEXT;
BEGIN
    -- Get the follower's full name
    SELECT full_name INTO follower_name FROM public.profiles WHERE id = NEW.follower_id;

    -- Insert notification for the person being followed (following_id)
    INSERT INTO public.notifications (user_id, type, message, metadata)
    VALUES (
        NEW.following_id, 
        'follow_alert', 
        follower_name || ' started following you!', 
        jsonb_build_object('follower_id', NEW.follower_id, 'follower_name', follower_name)
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_follow_notify ON public.follows;
CREATE TRIGGER on_new_follow_notify
    AFTER INSERT ON public.follows
    FOR EACH ROW EXECUTE PROCEDURE public.notify_on_new_follow();

-- 2. Trigger for Withdrawal Status Notifications
CREATE OR REPLACE FUNCTION public.notify_on_withdrawal_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.status != OLD.status) THEN
        IF (NEW.status = 'approved') THEN
            INSERT INTO public.notifications (user_id, type, message, metadata)
            VALUES (
                NEW.user_id, 
                'withdrawal_alert', 
                'Your withdrawal request for ' || NEW.amount || ' RWF has been approved.', 
                jsonb_build_object('status', 'approved', 'amount', NEW.amount, 'withdrawal_id', NEW.id)
            );
        ELSIF (NEW.status = 'rejected') THEN
            INSERT INTO public.notifications (user_id, type, message, metadata)
            VALUES (
                NEW.user_id, 
                'withdrawal_alert', 
                'Your withdrawal request for ' || NEW.amount || ' RWF was rejected.', 
                jsonb_build_object('status', 'rejected', 'amount', NEW.amount, 'withdrawal_id', NEW.id)
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_withdrawal_status_change_notify ON public.withdrawals;
CREATE TRIGGER on_withdrawal_status_change_notify
    AFTER UPDATE ON public.withdrawals
    FOR EACH ROW EXECUTE PROCEDURE public.notify_on_withdrawal_status_change();
