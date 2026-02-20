-- 1. Create tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    reward DECIMAL(10, 2) DEFAULT 0,
    instruction TEXT,
    task_type TEXT CHECK (task_type IN ('gmail', 'social', 'other')) DEFAULT 'other',
    required_email_format TEXT,
    required_password TEXT,
    recovery_email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create task_submissions table
CREATE TABLE IF NOT EXISTS public.task_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    proof_image_url TEXT,
    proof_text TEXT,
    status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    feedback TEXT
);

-- 3. Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_submissions ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for Tasks
DROP POLICY IF EXISTS "Tasks are viewable by everyone" ON public.tasks;
CREATE POLICY "Tasks are viewable by everyone" ON public.tasks FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage tasks" ON public.tasks;
CREATE POLICY "Admins can manage tasks" ON public.tasks 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- 5. RLS Policies for Submissions
DROP POLICY IF EXISTS "Users can view own submissions" ON public.task_submissions;
CREATE POLICY "Users can view own submissions" ON public.task_submissions 
FOR SELECT USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
));

DROP POLICY IF EXISTS "Users can submit tasks" ON public.task_submissions;
CREATE POLICY "Users can submit tasks" ON public.task_submissions 
FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can update submissions" ON public.task_submissions;
CREATE POLICY "Admins can update submissions" ON public.task_submissions 
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);
