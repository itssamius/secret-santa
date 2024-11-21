import { createClient } from '@supabase/supabase-js'

// Ensure the URL has proper protocol
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL.startsWith('http') 
  ? import.meta.env.VITE_SUPABASE_URL 
  : `https://${import.meta.env.VITE_SUPABASE_URL}`

const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Create client with validated URL
export const supabase = createClient(supabaseUrl, supabaseAnonKey) 