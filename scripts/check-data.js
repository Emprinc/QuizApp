import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://oyfegptwvajizixcyadi.supabase.co'
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95ZmVncHR3dmFqaXppeGN5YWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NTA5MDUsImV4cCI6MjA5MjUyNjkwNX0.RAbibtqUjEid0aBxeCXywQadUhl8cZkg5NspHyL13J4'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkData() {
  const { count: profileCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
  const { count: questionCount } = await supabase.from('questions').select('*', { count: 'exact', head: true })
  const { data: rooms } = await supabase.from('rooms').select('*').limit(5)

  console.log('Profile count:', profileCount)
  console.log('Question count:', questionCount)
  console.log('Rooms:', rooms)
}

checkData()
