import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://oyfegptwvajizixcyadi.supabase.co'
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95ZmVncHR3dmFqaXppeGN5YWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NTA5MDUsImV4cCI6MjA5MjUyNjkwNX0.RAbibtqUjEid0aBxeCXywQadUhl8cZkg5NspHyL13J4'

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
