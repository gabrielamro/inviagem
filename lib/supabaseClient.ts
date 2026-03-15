import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

/** True se o Supabase está configurado (evita requests que travam em loading). */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
