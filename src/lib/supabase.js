import { createClient } from '@supabase/supabase-js'

// Замени на свои данные из Supabase Dashboard → Settings → API
const SUPABASE_URL = 'https://oeuskmkmbrdqodreypuk.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable__KXR9etMdRLn8wplffIHQw_YlgbbnPY'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
