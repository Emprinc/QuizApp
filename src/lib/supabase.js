import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ewofyndnrnhgibbxzryd.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3b2Z5bmRucm5oZ2liYnh6cnlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwNjQ1NTUsImV4cCI6MjA5NzY0MDU1NX0.lDnYSrBHSPjtiHYgJURoRC5ZhkwIE1rPWFOC_kk8QBc'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'quiz-battle-session',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    flowType: 'pkce'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

export default supabase
