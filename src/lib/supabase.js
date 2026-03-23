import { createClient } from '@supabase/supabase-js'

// Замени на свои данные из Supabase Dashboard → Settings → API
const SUPABASE_URL = 'https://ТВОЙ_ПРОЕКТ.supabase.co'
const SUPABASE_ANON_KEY = 'ТВОЙ_ANON_KEY'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
