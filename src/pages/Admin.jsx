import { Routes, Route, Navigate } from 'react-router-dom'
import { AdminLayout } from '../components/admin/AdminLayout'
import { AdminDashboard } from '../components/admin/AdminDashboard'
import { QuestionManager } from '../components/admin/QuestionManager'
import { UserManager } from '../components/admin/UserManager'
import { RoomManager } from '../components/admin/RoomManager'
import { Analytics } from '../components/admin/Analytics'

export function Admin() {
  return (
    <AdminLayout>
      <Routes>
        <Route path="/" element={<AdminDashboard />} />
        <Route path="/questions" element={<QuestionManager />} />
        <Route path="/users" element={<UserManager />} />
        <Route path="/rooms" element={<RoomManager />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </AdminLayout>
  )
}
