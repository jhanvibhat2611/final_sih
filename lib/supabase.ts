// lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

// These come from your Supabase project settings
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create a single supabase client for the whole app
export const supabase = createClient(supabaseUrl, supabaseKey);
