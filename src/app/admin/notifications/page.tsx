'use client'

import { useEffect, useState, useCallback } from 'react'

interface Notification {
  id: string
  title: string
  message: string
  type: string
  isRead: boolean
  bookingId: string | null
  createdAt: string
}

const typeLabels: Record<string, string> = {
  new_booking: 'New Booking',
  night_request: 'Night Request',
  home_collection: 'Home Collection',
  report_ready: 'Report Ready',
  system: 'System',
}

const typeColors: Record<string, string> = {
  new_booking: 'bg-blue/10 text-blue',
  night_request: 'bg-purple-100 text-purple-800',
  home_collection: 'bg-teal/10 text-teal',
  report_ready: 'bg-success/10 text-success',
  system: 'bg-gray-100 text-gray-700',
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const fetchNotifications = useCallback(async () => {
    try {
      const params = filter === 'unread' ? '?unread=true' : ''
      const res = await fetch(`/api/admin/notifications${params}`)
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [filter])

  useEffect(() => { fetchNotifications() }, [fetchNotifications])

  const toggleRead = async (notif: Notification) => {
    setUpdatingId(notif.id)
    try {
      await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: notif.id, isRead: !notif.isRead })
      })
      await fetchNotifications()
    } catch { /* ignore */ }
    setUpdatingId(null)
  }

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.isRead)
    for (const n of unread) {
      await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: n.id, isRead: true })
      })
    }
    await fetchNotifications()
  }

  const timeAgo = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
    if (seconds < 60) return 'Just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-3 border-blue border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
        <button
          onClick={markAllRead}
          className="text-xs text-blue font-medium hover:underline"
        >
          Mark all read
        </button>
      </div>

      <div className="flex gap-1.5">
        {(['all', 'unread'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
              filter === f ? 'bg-blue text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {notifications.length === 0 ? (
          <p className="p-8 text-center text-sm text-gray-500">No notifications</p>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-3 flex items-start gap-3 ${!notif.isRead ? 'bg-blue/5' : ''}`}
            >
              <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${typeColors[notif.type] || 'bg-gray-100 text-gray-600'}`}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">{notif.title}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${typeColors[notif.type] || 'bg-gray-100 text-gray-600'}`}>
                    {typeLabels[notif.type] || notif.type}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{notif.message}</p>
                <p className="text-[10px] text-gray-400 mt-1">{timeAgo(notif.createdAt)}</p>
              </div>
              <button
                onClick={() => toggleRead(notif)}
                disabled={updatingId === notif.id}
                className="p-1.5 rounded-lg hover:bg-gray-100 flex-shrink-0"
              >
                {notif.isRead ? (
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                ) : (
                  <svg className="w-4 h-4 text-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                )}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
