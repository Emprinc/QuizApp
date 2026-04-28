import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables are required.')
  process.exit(1)
}

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
        console.log(`
--- BOOTSTRAP INSTRUCTION ---
To enable admin privileges for ${userData.email}, run the following SQL in your Supabase SQL Editor:

UPDATE public.profiles SET is_admin = true WHERE email = '${userData.email}';
-----------------------------
        `)

        console.log(`Attempting to set admin flag for ${userData.email} via client (requires existing admin or open RLS)...`)
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
                console.warn(`Note: Could not set admin flag via client for ${userData.email} (this is normal if RLS is enabled). Please use the SQL instruction above.`)
            } else {
                console.log(`Admin flag successfully set for ${userData.email} via client.`)
            }

            await supabase.auth.signOut()
        }
    }
  }
}

seedUsers()
