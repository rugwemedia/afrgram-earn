-- ============================================================
-- AFGgram MEGA FIX: Reward Payouts & Withdrawals
-- Run this in Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. Ensure Profiles has balance
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS balance DECIMAL(12, 2) DEFAULT 0.00;

-- 2. Ensure Tasks has reward (check if column exists first or just add)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'reward') THEN
        ALTER TABLE public.tasks ADD COLUMN reward DECIMAL(10, 2) DEFAULT 0.00;
    END IF;
END $$;

-- 3. Create Transactions table (Audit Log)
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL,
    type TEXT CHECK (type IN ('earned', 'withdrawn', 'bonus')) DEFAULT 'earned',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create Withdrawals table
CREATE TABLE IF NOT EXISTS public.withdrawals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL,
    method TEXT CHECK (method IN ('MTN', 'AIRTEL')) NOT NULL,
    phone TEXT NOT NULL,
    status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    fee DECIMAL(12, 2) DEFAULT 0.00,
    total_deduction DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. RLS for Transactions & Withdrawals
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Users can view own withdrawals" ON public.withdrawals;
CREATE POLICY "Users can view own withdrawals" ON public.withdrawals FOR SELECT USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Users can insert own withdrawals" ON public.withdrawals;
CREATE POLICY "Users can insert own withdrawals" ON public.withdrawals FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage withdrawals" ON public.withdrawals;
CREATE POLICY "Admins can manage withdrawals" ON public.withdrawals FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- 6. Trigger: Auto-Pay User on Task Approval
CREATE OR REPLACE FUNCTION public.credit_user_on_task_approval()
RETURNS TRIGGER AS $$
DECLARE
    task_reward DECIMAL(10, 2);
    task_title  TEXT;
BEGIN
    -- Only trigger when status changes to 'approved'
    IF (NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved')) THEN
        -- Get the reward amount
        SELECT reward, title INTO task_reward, task_title FROM public.tasks WHERE id = NEW.task_id;
        
        -- Update user balance
        UPDATE public.profiles 
        SET balance = COALESCE(balance, 0) + COALESCE(task_reward, 0) 
        WHERE id = NEW.user_id;

        -- Log transaction
        INSERT INTO public.transactions (user_id, amount, type, description)
        VALUES (NEW.user_id, task_reward, 'earned', 'Task Reward: ' || COALESCE(task_title, 'Task ' || NEW.task_id));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_task_approved ON public.task_submissions;
CREATE TRIGGER on_task_approved
    AFTER UPDATE ON public.task_submissions
    FOR EACH ROW
    WHEN (NEW.status = 'approved')
    EXECUTE FUNCTION public.credit_user_on_task_approval();

-- 7. Trigger: Deduct Balance on Withdrawal Approval
CREATE OR REPLACE FUNCTION public.process_withdrawal_approval()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved')) THEN
        -- Deduct from balance
        UPDATE public.profiles 
        SET balance = balance - NEW.total_deduction 
        WHERE id = NEW.user_id;

        -- Log transaction
        INSERT INTO public.transactions (user_id, amount, type, description)
        VALUES (NEW.user_id, -NEW.total_deduction, 'withdrawn', 'Withdrawal: ' || NEW.method || ' to ' || NEW.phone);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_withdrawal_approved ON public.withdrawals;
CREATE TRIGGER on_withdrawal_approved
    AFTER UPDATE ON public.withdrawals
    FOR EACH ROW
    WHEN (NEW.status = 'approved')
    EXECUTE FUNCTION public.process_withdrawal_approval();

-- 8. Promotion Check (Ensure you are admin)
UPDATE public.profiles SET role = 'admin' WHERE id = (SELECT id FROM auth.users WHERE email = 'sharibaru0@gmail.com');
