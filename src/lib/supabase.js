import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://oyfegptwvajizixcyadi.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95ZmVncHR3dmFqaXppeGN5YWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NTA5MDUsImV4cCI6MjA5MjUyNjkwNX0.RAbibtqUjEid0aBxeCXywQadUhl8cZkg5NspHyL13J4'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'quiz-battle-session',
    storage: window.localStorage,
    flowType: 'pkce'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

export default supabase
