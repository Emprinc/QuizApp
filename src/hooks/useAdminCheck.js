import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export function useAdminCheck() {
  const { user, profile, loading } = useAuth()
  const [roles, setRoles] = useState([])
  const [rolesLoading, setRolesLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setRoles([])
      setRolesLoading(false)
      return
    }

    const fetchRoles = async () => {
      setRolesLoading(true)
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)

        if (error) {
          console.error('Error fetching roles:', error)
          setRoles([])
        } else {
          setRoles(data?.map(r => r.role) || [])
        }
      } catch (err) {
        console.error('Unexpected error fetching roles:', err)
        setRoles([])
      } finally {
        setRolesLoading(false)
      }
    }

    fetchRoles()
  }, [user?.id])

  // Backward compat: check both new user_roles table and legacy is_admin column
  const isAdmin = roles.includes('admin') || profile?.is_admin === true
  const isTeacher = roles.includes('teacher')
  const isAdminLoading = loading || rolesLoading

  return {
    isAdmin,
    isTeacher,
    isAdminLoading,
    roles,
    profile
  }
}
