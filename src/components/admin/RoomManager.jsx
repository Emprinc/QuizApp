import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Trash2, ChevronLeft, ChevronRight, Clock, Users } from 'lucide-react'
import { adminRoomUtils } from '../../lib/adminUtils'
import { Card, LoadingSpinner } from '../ui'
import toast from 'react-hot-toast'

export function RoomManager() {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  const itemsPerPage = 10

  useEffect(() => {
    loadRooms()
  }, [])

  const loadRooms = async () => {
    try {
      setLoading(true)
      const data = await adminRoomUtils.getAllRooms(1000)
      setRooms(data)
    } catch (err) {
      toast.error('Failed to load rooms')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteRoom = async (roomId) => {
    if (!window.confirm('Are you sure you want to delete this room?')) return

    try {
      await adminRoomUtils.deleteRoom(roomId)
      setRooms(rooms.filter(r => r.id !== roomId))
      toast.success('Room deleted successfully')
    } catch (err) {
      toast.error('Failed to delete room')
    }
  }

  const handleCloseRoom = async (roomId) => {
    try {
      const updated = await adminRoomUtils.closeRoom(roomId)
      setRooms(rooms.map(r => r.id === roomId ? updated : r))
      toast.success('Room closed successfully')
    } catch (err) {
      toast.error('Failed to close room')
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'waiting':
        return 'bg-blue-500/20 text-blue-400'
      case 'playing':
        return 'bg-green-500/20 text-green-400'
      case 'finished':
        return 'bg-slate-500/20 text-slate-400'
      default:
        return 'bg-slate-500/20 text-slate-400'
    }
  }

  const paginatedRooms = rooms.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  )
  const totalPages = Math.ceil(rooms.length / itemsPerPage)

  if (loading && rooms.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white">Room Manager</h2>
        <p className="text-slate-400 mt-1">Manage active and inactive game rooms</p>
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginatedRooms.length === 0 ? (
          <Card className="col-span-full p-6 text-center">
            <p className="text-slate-400">No rooms found</p>
          </Card>
        ) : (
          paginatedRooms.map(room => (
            <motion.div
              key={room.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="p-4 hover:border-white/20 transition-colors flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-mono text-primary font-bold">{room.code}</p>
                    <p className="text-xs text-slate-400 mt-1">{room.category}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(room.status)}`}>
                    {room.status}
                  </span>
                </div>

                <div className="space-y-2 mb-4 flex-1">
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <Users className="w-4 h-4" />
                    <span>{room.room_players?.[0]?.count || 0} players</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <Clock className="w-4 h-4" />
                    <span>{room.time_per_question}s per question</span>
                  </div>
                  <div className="text-xs text-slate-400">
                    {room.question_count} questions
                  </div>
                </div>

                <div className="text-xs text-slate-500 mb-4">
                  Host: {room.host?.username || 'Unknown'}
                </div>

                <div className="h-px bg-white/5 mb-4" />

                <div className="flex gap-2">
                  {room.status !== 'finished' && (
                    <button
                      onClick={() => handleCloseRoom(room.id)}
                      className="flex-1 px-2 py-1 rounded text-xs font-medium
                        bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30
                        transition-colors"
                    >
                      Close
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteRoom(room.id)}
                    className="flex-1 px-2 py-1 rounded text-xs font-medium
                      bg-red-500/20 text-red-400 hover:bg-red-500/30
                      transition-colors flex items-center justify-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </button>
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Card className="p-4 flex items-center justify-between">
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
        </Card>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">
          Showing {paginatedRooms.length} of {rooms.length} rooms
        </p>
        <div className="flex gap-4 text-xs text-slate-400">
          <span>Active: {rooms.filter(r => r.status === 'playing').length}</span>
          <span>Waiting: {rooms.filter(r => r.status === 'waiting').length}</span>
          <span>Finished: {rooms.filter(r => r.status === 'finished').length}</span>
        </div>
      </div>
    </div>
  )
}
