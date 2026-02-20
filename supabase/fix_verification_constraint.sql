-- 1. Drop the restrictive constraint first
ALTER TABLE public.verification_requests DROP CONSTRAINT IF EXISTS unique_pending_request;
ALTER TABLE public.verification_requests DROP CONSTRAINT IF EXISTS unique_user_verification;

-- 2. CRITICAL: Cleanup duplicates BEFORE adding the unique constraint
-- This keeps only the most recent request for each user
DELETE FROM public.verification_requests a
USING public.verification_requests b
WHERE a.user_id = b.user_id 
  AND a.created_at < b.created_at;

-- 3. Now add the simpler, non-conflicting constraint: One entry per user
ALTER TABLE public.verification_requests ADD CONSTRAINT unique_user_verification UNIQUE (user_id);
