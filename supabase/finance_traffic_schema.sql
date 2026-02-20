-- 1. Add balance column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS balance DECIMAL(12, 2) DEFAULT 0.00;

-- 2. Create transactions table for audit log
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL,
    type TEXT CHECK (type IN ('earned', 'withdrawn', 'bonus')) DEFAULT 'earned',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Trigger Function: Automatically credit balance when a task is approved
CREATE OR REPLACE FUNCTION public.credit_user_on_task_approval()
RETURNS TRIGGER AS $$
DECLARE
    task_reward DECIMAL(10, 2);
BEGIN
    -- Only trigger when status changes to 'approved'
    IF (NEW.status = 'approved' AND OLD.status != 'approved') THEN
        -- Get the reward amount from tasks table
        SELECT reward INTO task_reward FROM public.tasks WHERE id = NEW.task_id;
        
        -- Update user balance
        UPDATE public.profiles 
        SET balance = balance + task_reward 
        WHERE id = NEW.user_id;

        -- Log transaction
        INSERT INTO public.transactions (user_id, amount, type, description)
        VALUES (NEW.user_id, task_reward, 'earned', 'Task completion: ' || NEW.task_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Set up Trigger
DROP TRIGGER IF EXISTS on_task_approved ON public.task_submissions;
CREATE TRIGGER on_task_approved
    AFTER UPDATE ON public.task_submissions
    FOR EACH ROW
    WHEN (NEW.status = 'approved')
    EXECUTE FUNCTION public.credit_user_on_task_approval();

-- 5. Create traffic_stats table to track real page views
CREATE TABLE IF NOT EXISTS public.traffic_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_path TEXT NOT NULL,
    user_id UUID REFERENCES public.profiles(id),
    device_type TEXT,
    browser TEXT,
    country TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for traffic_stats
ALTER TABLE public.traffic_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can insert stats" ON public.traffic_stats FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view stats" ON public.traffic_stats FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
