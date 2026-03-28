import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseConfigError =
  supabaseAnonKey?.startsWith('sb_secret_')
    ? 'VITE_SUPABASE_ANON_KEY is using a Supabase secret key. Replace it with the project anon or publishable browser key.'
    : null;

export const hasSupabaseEnv = Boolean(supabaseUrl && supabaseAnonKey) && !supabaseConfigError;

export const supabase = hasSupabaseEnv ? createClient(supabaseUrl!, supabaseAnonKey!) : null;
