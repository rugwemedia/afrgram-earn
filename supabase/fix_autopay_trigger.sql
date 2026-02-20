-- ============================================================
-- FIX: Auto-pay trigger + RLS for transactions & balance
-- Run AFTER fix_admin_role.sql and fix_tasks_columns.sql
-- Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. Add balance column to profiles (safe if already exists)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS balance DECIMAL(12, 2) DEFAULT 0.00;

-- 2. Create transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL,
    type TEXT CHECK (type IN ('earned', 'withdrawn', 'bonus')) DEFAULT 'earned',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable RLS on transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- 4. RLS: Users can read their own transactions; Admins can read all
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
CREATE POLICY "Users can view own transactions" ON public.transactions
    FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- 5. Only the trigger function (SECURITY DEFINER) inserts — no user INSERT needed

-- 6. Create/Replace the auto-pay trigger function
CREATE OR REPLACE FUNCTION public.credit_user_on_task_approval()
RETURNS TRIGGER AS $$
DECLARE
    task_reward DECIMAL(10, 2);
    task_title  TEXT;
BEGIN
    -- Only fire when status changes TO 'approved'
    IF (NEW.status = 'approved' AND OLD.status IS DISTINCT FROM 'approved') THEN
        -- Get reward and title from tasks
        SELECT reward, title INTO task_reward, task_title
        FROM public.tasks WHERE id = NEW.task_id;

        -- Credit user balance
        UPDATE public.profiles
        SET balance = balance + task_reward
        WHERE id = NEW.user_id;

        -- Log the transaction
        INSERT INTO public.transactions (user_id, amount, type, description)
        VALUES (NEW.user_id, task_reward, 'earned', 'Task reward: ' || COALESCE(task_title, NEW.task_id::text));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Recreate the trigger (drop first to avoid duplicates)
DROP TRIGGER IF EXISTS on_task_approved ON public.task_submissions;
CREATE TRIGGER on_task_approved
    AFTER UPDATE ON public.task_submissions
    FOR EACH ROW
    EXECUTE FUNCTION public.credit_user_on_task_approval();

-- 8. Verify trigger is active
SELECT trigger_name, event_manipulation, event_object_table, action_timing
FROM information_schema.triggers
WHERE trigger_name = 'on_task_approved';
