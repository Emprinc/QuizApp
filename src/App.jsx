import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import { GameProvider } from './context/GameContext'
import { Header, BottomNav } from './components/layout'
import { LoadingSpinner } from './components/ui'

// Pages
const Landing = lazy(() => import('./pages/Landing').then(module => ({ default: module.Landing })))
const Login = lazy(() => import('./pages/Login').then(module => ({ default: module.Login })))
const Register = lazy(() => import('./pages/Register').then(module => ({ default: module.Register })))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword').then(module => ({ default: module.ForgotPassword })))
const ResetPassword = lazy(() => import('./pages/ResetPassword').then(module => ({ default: module.ResetPassword })))
const Lobby = lazy(() => import('./pages/Lobby').then(module => ({ default: module.Lobby })))
const Room = lazy(() => import('./pages/Room').then(module => ({ default: module.Room })))
const Leaderboard = lazy(() => import('./pages/Leaderboard').then(module => ({ default: module.Leaderboard })))
const Friends = lazy(() => import('./pages/Friends').then(module => ({ default: module.Friends })))
const Profile = lazy(() => import('./pages/Profile').then(module => ({ default: module.Profile })))
const Admin = lazy(() => import('./pages/Admin').then(module => ({ default: module.Admin })))

// Components
import { ProtectedAdminRoute } from './components/ProtectedAdminRoute'

// Protected Route Component
function ProtectedRoute({ children }) {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Require both auth user and profile for protected routes
  if (!user || (user && !profile)) {
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
      <Suspense fallback={
        <div className="min-h-[80vh] flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      }>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/join/:code" element={
            <ProtectedRoute>
              <Room />
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
      </Suspense>
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
