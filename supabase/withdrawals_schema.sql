-- ============================================================
-- 1. Create withdrawals table
-- ============================================================
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

-- ============================================================
-- 2. Enable RLS
-- ============================================================
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

-- Users can view their own withdrawals
CREATE POLICY "Users can view own withdrawals" ON public.withdrawals
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own withdrawal requests
CREATE POLICY "Users can insert own withdrawals" ON public.withdrawals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can view and update all withdrawals
CREATE POLICY "Admins can manage withdrawals" ON public.withdrawals
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================================
-- 3. Trigger: Deduct balance on approval
-- ============================================================
CREATE OR REPLACE FUNCTION public.process_withdrawal_approval()
RETURNS TRIGGER AS $$
BEGIN
    -- Only trigger when status changes to 'approved'
    IF (NEW.status = 'approved' AND OLD.status != 'approved') THEN
        -- Check if user has enough balance
        IF (SELECT balance FROM public.profiles WHERE id = NEW.user_id) < NEW.total_deduction THEN
            RAISE EXCEPTION 'Insufficient balance for this withdrawal.';
        END IF;

        -- Update user balance
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
