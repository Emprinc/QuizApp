import { useAuth } from '../context/AuthContext'

export function useAdminCheck() {
  const { profile, loading } = useAuth()

  const isAdmin = profile?.is_admin === true
  const isAdminLoading = loading

  return {
    isAdmin,
    isAdminLoading,
    profile
  }
}
