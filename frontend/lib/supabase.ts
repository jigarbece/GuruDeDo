import { createClient } from "@supabase/supabase-js";

// Optional direct Supabase client. Phase 1 routes everything through the backend
// API (see lib/api.ts), but this is available for direct reads of public data
// (approved coaches, categories) if you want to skip the API for some screens.

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export const isSupabaseConfigured = Boolean(supabase);
