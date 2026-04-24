import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import { GameProvider } from './context/GameContext'
import { Header, BottomNav } from './components/layout'
import { LoadingSpinner } from './components/ui'

// Pages
import { Landing } from './pages/Landing'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { Lobby } from './pages/Lobby'
import { Room } from './pages/Room'
import { Leaderboard } from './pages/Leaderboard'
import { Friends } from './pages/Friends'
import { Profile } from './pages/Profile'
import { Admin } from './pages/Admin'

// Components
import { ProtectedAdminRoute } from './components/ProtectedAdminRoute'

// Protected Route Component
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

// App Content with Auth-aware layout
function AppContent() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-background">
      {user && <Header />}
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/join/:code" element={
          <ProtectedRoute>
            <Lobby />
          </ProtectedRoute>
        } />

        {/* Protected Routes */}
        <Route path="/lobby" element={
          <ProtectedRoute>
            <Lobby />
          </ProtectedRoute>
        } />
        <Route path="/room/:code" element={
          <ProtectedRoute>
            <Room />
          </ProtectedRoute>
        } />
        <Route path="/leaderboard" element={
          <ProtectedRoute>
            <Leaderboard />
          </ProtectedRoute>
        } />
        <Route path="/friends" element={
          <ProtectedRoute>
            <Friends />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />

        {/* Admin Routes */}
        <Route path="/admin/*" element={
          <ProtectedRoute>
            <ProtectedAdminRoute>
              <Admin />
            </ProtectedAdminRoute>
          </ProtectedRoute>
        } />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {user && <BottomNav />}
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <GameProvider>
          <AppContent />
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#1E293B',
                color: '#F8FAFC',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                padding: '12px 16px',
              },
              success: {
                iconTheme: {
                  primary: '#10B981',
                  secondary: '#F8FAFC',
                },
              },
              error: {
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#F8FAFC',
                },
              },
            }}
          />
        </GameProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
