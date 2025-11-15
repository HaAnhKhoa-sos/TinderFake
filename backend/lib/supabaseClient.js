// backend/lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load .env ngay khi file này được import
dotenv.config()

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)
