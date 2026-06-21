import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ewofyndnrnhgibbxzryd.supabase.co'
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3b2Z5bmRucm5oZ2liYnh6cnlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwNjQ1NTUsImV4cCI6MjA5NzY0MDU1NX0.lDnYSrBHSPjtiHYgJURoRC5ZhkwIE1rPWFOC_kk8QBc'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkData() {
  const { count: profileCount, error: profileError } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
  const { count: questionCount, error: questionError } = await supabase.from('questions').select('*', { count: 'exact', head: true })
  const { data: rooms, error: roomsError } = await supabase.from('rooms').select('*').limit(5)

  if (profileError) console.error('Profile error:', profileError)
  else console.log('Profile count:', profileCount)

  if (questionError) console.error('Question error:', questionError)
  else console.log('Question count:', questionCount)

  if (roomsError) console.error('Rooms error:', roomsError)
  else console.log('Rooms:', rooms)
}

checkData()
