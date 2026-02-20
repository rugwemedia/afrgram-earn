-- ============================================================
-- MIGRATION: Add missing columns to the tasks table (v2)
-- Run in Supabase Dashboard → SQL Editor → New Query
-- Uses the REAL column names matching the existing table structure
-- ============================================================

-- Add 'instruction' column if it doesn't exist
ALTER TABLE public.tasks
    ADD COLUMN IF NOT EXISTS instruction TEXT;

-- The actual task type column is named 'type' (not 'task_type')
-- Add it only if it doesn't already exist
ALTER TABLE public.tasks
    ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'other';

-- Other optional columns
ALTER TABLE public.tasks
    ADD COLUMN IF NOT EXISTS required_email_format TEXT;

ALTER TABLE public.tasks
    ADD COLUMN IF NOT EXISTS required_password TEXT;

ALTER TABLE public.tasks
    ADD COLUMN IF NOT EXISTS recovery_email TEXT;

-- Verify final structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'tasks'
ORDER BY ordinal_position;
