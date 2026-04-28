import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://oyfegptwvajizixcyadi.supabase.co'
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95ZmVncHR3dmFqaXppeGN5YWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NTA5MDUsImV4cCI6MjA5MjUyNjkwNX0.RAbibtqUjEid0aBxeCXywQadUhl8cZkg5NspHyL13J4'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function seedUsers() {
  const users = [
    { email: 'testuser@example.com', password: 'password123', username: 'testuser', isAdmin: false },
    { email: 'adminuser@example.com', password: 'password123', username: 'adminuser', isAdmin: true }
  ]

  for (const userData of users) {
    console.log(`Creating user: ${userData.email}...`)
    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          username: userData.username
        }
      }
    })

    if (error) {
      if (error.message.includes('User already registered')) {
        console.log(`User ${userData.email} already exists.`)
        // Try to get the user ID if they exist (though we can't easily without admin privileges or knowing it)
      } else {
        console.error(`Error creating user ${userData.email}:`, error.message)
        continue
      }
    } else {
      console.log(`User ${userData.email} created successfully.`)
    }

    // If it's an admin user, we need to set the is_admin flag in the profiles table
    // Note: This relies on the profile being created by the trigger
    if (userData.isAdmin) {
        // We'll try to update the profile. This might fail if the trigger hasn't finished or if RLS prevents it.
        // In a real scenario, this would be done via a service role or a SQL migration.
        // Since we are using the anon key, we can only update our OWN profile if we are signed in.

        console.log(`Attempting to set admin flag for ${userData.email}...`)
        // Sign in to get a session
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: userData.email,
            password: userData.password
        })

        if (signInError) {
            console.error(`Error signing in as ${userData.email}:`, signInError.message)
        } else {
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ is_admin: true })
                .eq('id', signInData.user.id)

            if (updateError) {
                console.error(`Error updating admin flag for ${userData.email}:`, updateError.message)
            } else {
                console.log(`Admin flag set for ${userData.email}.`)
            }

            await supabase.auth.signOut()
        }
    }
  }
}

seedUsers()
