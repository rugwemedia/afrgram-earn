-- 1. Add is_verified column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- 2. Create verification_requests table
CREATE TABLE IF NOT EXISTS public.verification_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Prevent multiple pending requests from same user
    CONSTRAINT unique_pending_request UNIQUE (user_id, status)
);

-- 3. Enable RLS
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

-- 4. Policies for verification_requests
DROP POLICY IF EXISTS "Users can view their own requests" ON public.verification_requests;
CREATE POLICY "Users can view their own requests" 
ON public.verification_requests FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can submit requests" ON public.verification_requests;
CREATE POLICY "Users can submit requests" 
ON public.verification_requests FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage requests" ON public.verification_requests;
CREATE POLICY "Admins can manage requests" 
ON public.verification_requests FOR ALL 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- 5. Trigger to update profile is_verified when request is approved
CREATE OR REPLACE FUNCTION public.handle_verification_approval()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.status = 'approved' AND OLD.status != 'approved') THEN
        UPDATE public.profiles SET is_verified = true WHERE id = NEW.user_id;
    ELSIF (NEW.status = 'rejected' AND OLD.status = 'approved') THEN
        UPDATE public.profiles SET is_verified = false WHERE id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_verification_approved ON public.verification_requests;
CREATE TRIGGER on_verification_approved
    AFTER UPDATE ON public.verification_requests
    FOR EACH ROW EXECUTE PROCEDURE public.handle_verification_approval();
