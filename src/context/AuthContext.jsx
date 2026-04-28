import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check session and verify user still exists
    const initAuth = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (authUser) {
          setUser(authUser)
          await fetchProfile(authUser.id)
        } else {
          setUser(null)
          setProfile(null)
          setLoading(false)
        }
      } catch (err) {
        console.error('Auth initialization error:', err)
        setUser(null)
        setProfile(null)
        setLoading(false)
      }
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user)
          await fetchProfile(session.user.id)
        } else {
          setUser(null)
          setProfile(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Idle Logout Logic (5 minutes)
  const idleTimerRef = useRef(null)
  const IDLE_TIMEOUT = 5 * 60 * 1000 // 5 minutes

  const resetIdleTimer = () => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
    if (user) {
      idleTimerRef.current = setTimeout(() => {
        toast('Session expired due to inactivity', { icon: '⏰' })
        signOut()
      }, IDLE_TIMEOUT)
    }
  }

  useEffect(() => {
    if (user) {
      const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart']

      const handleActivity = () => resetIdleTimer()

      events.forEach(event => {
        window.addEventListener(event, handleActivity)
      })

      resetIdleTimer()

      return () => {
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
        events.forEach(event => {
          window.removeEventListener(event, handleActivity)
        })
      }
    } else {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
    }
  }, [user])

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // Profile doesn't exist, try to create one (fallback if trigger fails)
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert([{ id: userId, username: userId.slice(0, 8) }])
            .select()
            .single()

          if (!createError) {
            setProfile(newProfile)
          } else {
            console.error('Error creating profile fallback:', createError)
            // If we can't fetch or create a profile, the user might be deleted from DB
            await signOut()
          }
        } else {
          console.error('Error fetching profile:', error)
          // For other errors (like permission denied if user was deleted/banned in a way that blocks read)
          if (error.status === 403 || error.status === 401) {
            await signOut()
          }
        }
      } else {
        // Check for ban status
        if (data.is_banned) {
          console.warn('User is banned, signing out...')
          await signOut()
          return
        }
        setProfile(data)
      }
    } catch (err) {
      console.error('Unexpected error in fetchProfile:', err)
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email, password, username) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username || email.split('@')[0]
        }
      }
    })

    if (error) throw error

    // Note: Database trigger 'handle_new_user' creates the profile automatically.
    // We don't need to manually insert it here anymore, which avoids RLS/conflict issues.

    return data
  }

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    return data
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut({ scope: 'global' })
      if (error) throw error
      toast.success('Signed out successfully')
    } catch (error) {
      console.error('Logout error:', error)
      toast.error(error.message || 'Failed to sign out')
    } finally {
      setUser(null)
      setProfile(null)
    }
  }

  const updateProfile = async (updates) => {
    if (!user) return

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()

    if (error) throw error
    setProfile(data)
    return data
  }

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      signUp,
      signIn,
      signOut,
      updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
