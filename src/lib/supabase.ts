import { createClient } from '@supabase/supabase-js';

// Use dummy values to prevent crash if .env is missing
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-url.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

const isConfigured = !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('Supabase Configuration:', {
    url: !!import.meta.env.VITE_SUPABASE_URL ? 'Loaded' : 'Missing (Using Placeholder)',
    key: !!import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Loaded' : 'Missing (Using Placeholder)'
});

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export { isConfigured };
