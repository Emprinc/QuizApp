import { Navigate } from 'react-router-dom'
import { useAdminCheck } from '../hooks/useAdminCheck'
import { LoadingSpinner } from './ui'

export function ProtectedAdminRoute({ children }) {
  const { isAdmin, isAdminLoading } = useAdminCheck()

  if (isAdminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!isAdmin) {
    return <Navigate to="/lobby" replace />
  }

  return children
}
