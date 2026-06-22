import React, { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import { GameProvider } from './context/GameContext'
import { Header, BottomNav } from './components/layout'
import { LoadingSpinner } from './components/ui'

// Pages
const Landing = lazy(() => import('./pages/Landing'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const Lobby = lazy(() => import('./pages/Lobby'))
const Room = lazy(() => import('./pages/Room'))
const Leaderboard = lazy(() => import('./pages/Leaderboard'))
const Friends = lazy(() => import('./pages/Friends'))
const Profile = lazy(() => import('./pages/Profile'))
const Admin = lazy(() => import('./pages/Admin'))

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

// Error Boundary
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    console.error('[v0] Error caught by boundary:', error)
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md">
            <h1 className="text-2xl font-bold text-danger mb-4">Something went wrong</h1>
            <p className="text-slate-400 mb-4">{this.state.error?.message}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-white rounded"
            >
              Reload Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// App Content with Auth-aware layout
function AppContent() {
  const { user } = useAuth()
  
  // Memoize header/footer to prevent unnecessary re-renders
  const headerElement = user ? <Header /> : null
  const bottomNavElement = user ? <BottomNav /> : null

  return (
    <div className="min-h-screen bg-background">
      {headerElement}
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
      {bottomNavElement}
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  )
}
