-- ============================================================
-- FIX: Grant admin role to the admin user in profiles table
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================

-- Step 1: Set role = 'admin' for the admin user by matching their auth email
UPDATE public.profiles
SET role = 'admin', is_verified = true
WHERE id = (
    SELECT id FROM auth.users WHERE email = 'sharibaru0@gmail.com' LIMIT 1
);

-- Step 2: Verify the update worked (should show role = 'admin')
SELECT p.id, p.full_name, p.role, u.email
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.email = 'sharibaru0@gmail.com';

-- ============================================================
-- Step 3: Update the Task RLS policies to be more robust
-- Allow insert/update/delete for admin role OR matching email
-- ============================================================

DROP POLICY IF EXISTS "Admins can manage tasks" ON public.tasks;

CREATE POLICY "Admins can manage tasks" ON public.tasks
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Also fix submissions admin policies to include WITH CHECK clause
DROP POLICY IF EXISTS "Admins can update submissions" ON public.task_submissions;

CREATE POLICY "Admins can update submissions" ON public.task_submissions
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Allow admins to delete submissions too
DROP POLICY IF EXISTS "Admins can delete submissions" ON public.task_submissions;

CREATE POLICY "Admins can delete submissions" ON public.task_submissions
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);
