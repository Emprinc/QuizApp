import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  onClick,
  type = 'button',
  ...props
}) {
  const variants = {
    primary: 'bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white shadow-lg shadow-primary/25',
    secondary: 'bg-surface-light border border-primary/50 text-white hover:bg-primary/10 hover:border-primary',
    ghost: 'bg-transparent text-slate-300 hover:bg-white/5',
    danger: 'bg-gradient-to-r from-danger to-red-600 hover:from-danger/90 hover:to-red-600/90 text-white shadow-lg shadow-danger/25',
    success: 'bg-gradient-to-r from-success to-emerald-600 hover:from-success/90 hover:to-emerald-600/90 text-white shadow-lg shadow-success/25'
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-base',
    lg: 'px-8 py-3.5 text-lg',
    xl: 'px-12 py-4 text-xl'
  }

  return (
    <motion.button
      type={type}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={`
        font-semibold rounded-xl transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        flex items-center justify-center gap-2
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && <Loader2 className="w-5 h-5 animate-spin" />}
      {children}
    </motion.button>
  )
}

export function Input({
  label,
  error,
  className = '',
  ...props
}) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-slate-300">
          {label}
        </label>
      )}
      <input
        className={`
          w-full px-4 py-3 rounded-lg
          bg-surface border border-surface-light
          text-white placeholder-slate-500
          focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
          transition-all duration-200
          ${error ? 'border-danger focus:ring-danger/50 focus:border-danger' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="text-sm text-danger">{error}</p>
      )}
    </div>
  )
}

export function Card({ children, className = '', hover = false, onClick }) {
  return (
    <motion.div
      whileHover={hover ? { y: -4, scale: 1.02 } : {}}
      className={`
        bg-surface rounded-2xl p-6
        border border-white/5
        ${hover ? 'cursor-pointer hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </motion.div>
  )
}

export function Avatar({ username, size = 'md', showStatus = false, status = 'offline' }) {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base',
    xl: 'w-20 h-20 text-xl'
  }

  const getInitials = (name) => {
    return name?.slice(0, 2).toUpperCase() || '??'
  }

  const getGradient = (name) => {
    const colors = [
      ['#6366F1', '#8B5CF6'],
      ['#EC4899', '#F472B6'],
      ['#10B981', '#34D399'],
      ['#F59E0B', '#FBBF24'],
      ['#06B6D4', '#22D3EE'],
      ['#8B5CF6', '#A78BFA']
    ]
    const index = name ? name.charCodeAt(0) % colors.length : 0
    return `linear-gradient(135deg, ${colors[index][0]}, ${colors[index][1]})`
  }

  const statusColors = {
    online: 'bg-success',
    offline: 'bg-slate-500',
    in_game: 'bg-secondary animate-pulse'
  }

  return (
    <div className="relative">
      <div
        className={`${sizes[size]} rounded-full flex items-center justify-center font-bold text-white`}
        style={{ background: getGradient(username) }}
      >
        {getInitials(username)}
      </div>
      {showStatus && (
        <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-surface ${statusColors[status]}`} />
      )}
    </div>
  )
}

export function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', damping: 25 }}
        className="relative bg-surface rounded-2xl p-6 w-full max-w-md border border-white/10"
        onClick={e => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        {children}
      </motion.div>
    </motion.div>
  )
}

export function Toast({ message, type = 'info', onClose }) {
  const types = {
    success: 'bg-success/20 border-success text-success',
    error: 'bg-danger/20 border-danger text-danger',
    info: 'bg-primary/20 border-primary text-primary',
    warning: 'bg-gold/20 border-gold text-gold'
  }

  return (
    <motion.div
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 100, opacity: 0 }}
      className={`fixed bottom-4 right-4 px-6 py-4 rounded-xl border ${types[type]} backdrop-blur-lg shadow-xl`}
    >
      <div className="flex items-center gap-3">
        <span>{message}</span>
        <button onClick={onClose} className="hover:opacity-70">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </motion.div>
  )
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-6">
        {Icon && <Icon className="w-12 h-12 text-primary" />}
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-slate-400 text-center mb-6 max-w-sm">{description}</p>
      {action}
    </div>
  )
}

export function LoadingSpinner({ size = 'md' }) {
  const sizes = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  }

  return (
    <div className="flex items-center justify-center">
      <Loader2 className={`${sizes[size]} animate-spin text-primary`} />
    </div>
  )
}
