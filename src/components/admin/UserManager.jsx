import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, Shield, ChevronLeft, ChevronRight } from 'lucide-react'
import { adminUserUtils } from '../../lib/adminUtils'
import { Card, Avatar, LoadingSpinner } from '../ui'
import toast from 'react-hot-toast'

export function UserManager() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(0)
  const itemsPerPage = 10

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const data = await adminUserUtils.getAllUsers(1000)
      setUsers(data)
    } catch (err) {
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (query) => {
    setSearchQuery(query)
    setCurrentPage(0)
    
    if (!query.trim()) {
      loadUsers()
      return
    }

    try {
      const results = await adminUserUtils.searchUsers(query)
      setUsers(results)
    } catch (err) {
      toast.error('Search failed')
    }
  }

  const handleToggleAdmin = async (user) => {
    try {
      await adminUserUtils.updateUserAdmin(user.id, !user.is_admin)
      setUsers(users.map(u =>
        u.id === user.id ? { ...u, is_admin: !u.is_admin } : u
      ))
      toast.success(user.is_admin ? 'Admin privileges removed' : 'Admin privileges granted')
    } catch (err) {
      toast.error('Failed to update user')
    }
  }

  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const paginatedUsers = filteredUsers.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  )
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white">User Manager</h2>
        <p className="text-slate-400 mt-1">Manage user accounts and permissions</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search by username or email..."
          className="w-full pl-10 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500"
        />
      </div>

      {/* Users Grid */}
      <Card className="overflow-hidden">
        {paginatedUsers.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-slate-400">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-4 py-3 text-sm font-semibold text-slate-300">User</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-slate-300">Email</th>
                  <th className="text-right px-4 py-3 text-sm font-semibold text-slate-300">Games</th>
                  <th className="text-right px-4 py-3 text-sm font-semibold text-slate-300">Score</th>
                  <th className="text-center px-4 py-3 text-sm font-semibold text-slate-300">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {paginatedUsers.map(user => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar username={user.username} size="sm" />
                        <span className="font-medium text-white">{user.username}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400">
                      {user.email || '-'}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-white">
                      {user.total_games}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-primary">
                      {user.total_score}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleToggleAdmin(user)}
                        className={`
                          inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium
                          transition-colors
                          ${user.is_admin
                            ? 'bg-primary/20 text-primary hover:bg-primary/30'
                            : 'bg-white/5 text-slate-400 hover:bg-white/10'
                          }
                        `}
                        title={user.is_admin ? 'Remove admin' : 'Make admin'}
                      >
                        <Shield className="w-3 h-3" />
                        {user.is_admin ? 'Admin' : 'User'}
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-white/5">
            <button
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              className="p-2 rounded-lg hover:bg-white/5 text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-slate-400">
              Page {currentPage + 1} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage === totalPages - 1}
              className="p-2 rounded-lg hover:bg-white/5 text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">
          Showing {paginatedUsers.length} of {filteredUsers.length} users
        </p>
        <p className="text-sm text-slate-400">
          Total users: {users.length}
        </p>
      </div>
    </div>
  )
}
