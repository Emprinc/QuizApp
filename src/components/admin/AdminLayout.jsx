import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LogOut, Menu, X, LayoutDashboard, HelpCircle, Users, Zap, BarChart3 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { Avatar } from '../ui'

export function AdminLayout({ children }) {
  const { profile, signOut } = useAuth()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const adminNavItems = [
    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/questions', label: 'Questions', icon: HelpCircle },
    { path: '/admin/users', label: 'Users', icon: Users },
    { path: '/admin/rooms', label: 'Rooms', icon: Zap },
    { path: '/admin/analytics', label: 'Analytics', icon: BarChart3 }
  ]

  const isActive = (path) => location.pathname === path

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 280 : 80 }}
        transition={{ duration: 0.2 }}
        className="bg-background/40 backdrop-blur-xl border-r border-white/5 flex flex-col fixed h-screen z-30"
      >
        {/* Logo */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          {sidebarOpen && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <span className="text-lg font-black text-white">⚙</span>
              </div>
              <span className="text-sm font-bold text-white">Admin</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {adminNavItems.map(item => {
            const Icon = item.icon
            const active = isActive(item.path)
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                  ${active
                    ? 'bg-primary/20 text-primary'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }
                `}
                title={!sidebarOpen ? item.label : ''}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-white/5 space-y-3">
          {sidebarOpen && (
            <div className="flex items-center gap-3 px-2">
              <Avatar username={profile?.username} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white truncate">{profile?.username}</p>
                <p className="text-xs text-slate-500">Admin</p>
              </div>
            </div>
          )}
          <button
            onClick={signOut}
            className={`
              w-full flex items-center gap-3 px-4 py-2 rounded-lg
              text-slate-400 hover:text-white hover:bg-white/5
              transition-colors text-sm font-medium
            `}
            title="Sign out"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {sidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main
        className={`
          flex-1 transition-all duration-200 ml-80 md:ml-20
          ${sidebarOpen ? 'ml-[280px]' : 'ml-[80px]'}
        `}
      >
        <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-white/5 px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-white/5 text-slate-400"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
