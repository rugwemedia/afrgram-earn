-- Add phone numbers and withdrawal numbers to the profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS withdrawal_number TEXT;
