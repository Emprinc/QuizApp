import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AdminLayout } from '../components/admin/AdminLayout'
import { LoadingSpinner } from '../components/ui'

const AdminDashboard = lazy(() => import('../components/admin/AdminDashboard').then(module => ({ default: module.AdminDashboard })))
const QuestionManager = lazy(() => import('../components/admin/QuestionManager').then(module => ({ default: module.QuestionManager })))
const UserManager = lazy(() => import('../components/admin/UserManager').then(module => ({ default: module.UserManager })))
const RoomManager = lazy(() => import('../components/admin/RoomManager').then(module => ({ default: module.RoomManager })))
const Analytics = lazy(() => import('../components/admin/Analytics').then(module => ({ default: module.Analytics })))

export function Admin() {
  return (
    <AdminLayout>
      <Suspense fallback={
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      }>
        <Routes>
          <Route path="/" element={<AdminDashboard />} />
          <Route path="/questions" element={<QuestionManager />} />
          <Route path="/users" element={<UserManager />} />
          <Route path="/rooms" element={<RoomManager />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </Suspense>
    </AdminLayout>
  )
}
