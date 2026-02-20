-- 1. Update verification_requests with rejection details
ALTER TABLE public.verification_requests ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE public.verification_requests ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP WITH TIME ZONE;

-- 2. Create verification_config for admin parameters
CREATE TABLE IF NOT EXISTS public.verification_config (
    id TEXT PRIMARY KEY DEFAULT 'global',
    min_followers INTEGER DEFAULT 100,
    monthly_fee DECIMAL(12, 2) DEFAULT 500.00,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Initialize global config if not exists
INSERT INTO public.verification_config (id, min_followers, monthly_fee)
VALUES ('global', 100, 500.00)
ON CONFLICT (id) DO NOTHING;

-- 3. Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL, -- 'verification_alert', 'system', etc.
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

-- 4. Trigger to notify user on verification status change
CREATE OR REPLACE FUNCTION public.notify_verification_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.status != OLD.status) THEN
        IF (NEW.status = 'approved') THEN
            INSERT INTO public.notifications (user_id, type, message, metadata)
            VALUES (NEW.user_id, 'verification_alert', 'Congratulations! Your account has been verified. A monthly fee of 500 RWF will be deducted from your balance.', jsonb_build_object('status', 'approved'));
        ELSIF (NEW.status = 'rejected') THEN
            INSERT INTO public.notifications (user_id, type, message, metadata)
            VALUES (NEW.user_id, 'verification_alert', 'Your verification request was rejected. Reason: ' || COALESCE(NEW.rejection_reason, 'Not met requirements') || '. You can try again later.', jsonb_build_object('status', 'rejected', 'reason', NEW.rejection_reason));
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_verification_status_change_notify ON public.verification_requests;
CREATE TRIGGER on_verification_status_change_notify
    AFTER UPDATE ON public.verification_requests
    FOR EACH ROW EXECUTE PROCEDURE public.notify_verification_status_change();

-- 5. RLS for verification_config (Admins only)
ALTER TABLE public.verification_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage config" ON public.verification_config;
CREATE POLICY "Admins can manage config"
ON public.verification_config FOR ALL
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Everyone can view config" ON public.verification_config;
CREATE POLICY "Everyone can view config"
ON public.verification_config FOR SELECT
USING (true);
