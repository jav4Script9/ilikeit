import { createClient } from '@supabase/supabase-js'

// Замени на свои данные из Supabase Dashboard → Settings → API
const SUPABASE_URL = 'https://oeuskmkmbrdqodreypuk.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ldXNrbWttYnJkcW9kcmV5cHVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyMzQzNDMsImV4cCI6MjA4OTgxMDM0M30.2SLGFzWXuTdGi-Q56iBRVIC9TK4aTtwYshqgSFKEkE4'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
