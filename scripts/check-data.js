import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables are required.')
  process.exit(1)
}

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
