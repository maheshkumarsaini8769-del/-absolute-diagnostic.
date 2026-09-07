'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'

interface Booking {
  id: string
  bookingId: string
  patientName: string
  patientPhone: string
  status: string
  collectionType: string
  totalAmount: number
  isNightBooking: boolean
  createdAt: string
  items: { testName: string; testPrice: number }[]
}

interface Stats {
  total: number
  requested: number
  night: number
  homeCollection: number
  reportReady: number
  todayBookings: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ total: 0, requested: 0, night: 0, homeCollection: 0, reportReady: 0, todayBookings: 0 })
  const [recentBookings, setRecentBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [nightMode, setNightMode] = useState(false)
  const [pushRegistered, setPushRegistered] = useState(false)
  const [sendingTest, setSendingTest] = useState(false)

  const fetchStats = useCallback(async () => {
    try {
      const [allRes, requestedRes, nightRes, homeRes, reportRes, todayRes] = await Promise.all([
        fetch('/api/admin/bookings?limit=1'),
        fetch('/api/admin/bookings?status=requested&limit=1'),
        fetch('/api/admin/bookings?type=night_request&limit=1'),
        fetch('/api/admin/bookings?type=home_collection&limit=1'),
        fetch('/api/admin/bookings?status=report_ready&limit=1'),
        fetch('/api/admin/bookings?limit=50'),
      ])

      const [all, requested, night, home, report, today] = await Promise.all([
        allRes.ok ? allRes.json() : { total: 0 },
        requestedRes.ok ? requestedRes.json() : { total: 0 },
        nightRes.ok ? nightRes.json() : { total: 0 },
        homeRes.ok ? homeRes.json() : { total: 0 },
        reportRes.ok ? reportRes.json() : { total: 0 },
        todayRes.ok ? todayRes.json() : { bookings: [] },
      ])

      const todayStr = new Date().toISOString().split('T')[0]
      const todayCount = (today.bookings || []).filter((b: Booking) => b.createdAt.startsWith(todayStr)).length

      setStats({
        total: all.total || 0,
        requested: requested.total || 0,
        night: night.total || 0,
        homeCollection: home.total || 0,
        reportReady: report.total || 0,
        todayBookings: todayCount,
      })

      setRecentBookings((today.bookings || []).slice(0, 10))
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    const load = async () => {
      setLoading(false)
      await fetchStats()
    }
    load()
  }, [fetchStats])

  const registerPush = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('Push notifications are not supported on this device.')
      return
    }

    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        alert('Push notification permission denied.')
        return
      }

      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      })

      const sub = subscription.toJSON()
      await fetch('/api/admin/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceName: navigator.userAgent.includes('iPhone') ? 'iPhone' : 'Device',
          endpoint: sub.endpoint,
          p256dh: sub.keys?.p256dh || '',
          auth: sub.keys?.auth || '',
        })
      })

      setPushRegistered(true)
    } catch (err) {
      console.error('Push registration error:', err)
      alert('Failed to register push notifications.')
    }
  }

  const sendTestNotification = async () => {
    setSendingTest(true)
    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'GET'
      })
      if (res.ok) {
        alert('Test notification check complete. In production, this sends a push to registered devices.')
      }
    } catch { /* ignore */ }
    setSendingTest(false)
  }

  const toggleNightMode = async () => {
    const newValue = !nightMode
    setNightMode(newValue)
    try {
      await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: [{ key: 'night_mode_active', value: String(newValue), type: 'boolean' }]
        })
      })
    } catch { /* ignore */ }
  }

  const statCards = [
    { label: 'Total Bookings', value: stats.total, color: 'bg-blue/10 text-blue', href: '/admin/bookings' },
    { label: 'Pending', value: stats.requested, color: 'bg-yellow-50 text-yellow-600', href: '/admin/bookings?filter=pending' },
    { label: 'Night Requests', value: stats.night, color: 'bg-purple-50 text-purple-600', href: '/admin/bookings?filter=night' },
    { label: 'Home Collection', value: stats.homeCollection, color: 'bg-teal/10 text-teal', href: '/admin/bookings?filter=home' },
    { label: 'Reports Ready', value: stats.reportReady, color: 'bg-success/10 text-success', href: '/admin/reports' },
    { label: "Today's Bookings", value: stats.todayBookings, color: 'bg-navy/10 text-navy', href: '/admin/bookings?filter=today' },
  ]

  const statusColor = (status: string) => {
    const colors: Record<string, string> = {
      requested: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue/10 text-blue',
      sample_collected: 'bg-purple-100 text-purple-800',
      processing: 'bg-orange-100 text-orange-800',
      report_ready: 'bg-success/10 text-success',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-blue border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <div className="text-xs text-gray-500">{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {statCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className={`p-4 rounded-xl ${card.color} hover:opacity-90 transition-opacity`}
          >
            <p className="text-xs font-medium opacity-75">{card.label}</p>
            <p className="text-2xl font-bold mt-1">{card.value}</p>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Link
            href="/admin/bookings?filter=today"
            className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 text-sm font-medium text-gray-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            View Bookings
          </Link>
          <Link
            href="/admin/bookings?filter=night"
            className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 text-sm font-medium text-gray-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
            Night Requests
          </Link>
          <button
            onClick={sendTestNotification}
            disabled={sendingTest}
            className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 text-sm font-medium text-gray-700 transition-colors disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {sendingTest ? 'Sending...' : 'Test Notification'}
          </button>
          <button
            onClick={registerPush}
            className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 text-sm font-medium text-gray-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            {pushRegistered ? 'Push Enabled' : 'Enable Push'}
          </button>
        </div>
      </div>

      {/* Night Duty Toggle */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Night Duty Mode</h2>
            <p className="text-xs text-gray-500 mt-0.5">Accept night-time sample collection requests</p>
          </div>
          <button
            onClick={toggleNightMode}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              nightMode ? 'bg-success' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                nightMode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-900">Recent Bookings</h2>
          <Link href="/admin/bookings" className="text-xs text-blue font-medium hover:underline">
            View All
          </Link>
        </div>
        {recentBookings.length === 0 ? (
          <p className="text-sm text-gray-500 py-8 text-center">No recent bookings</p>
        ) : (
          <div className="space-y-2">
            {recentBookings.map((booking) => (
              <Link
                key={booking.id}
                href={`/admin/bookings/${booking.id}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 truncate">{booking.patientName}</span>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${statusColor(booking.status)}`}>
                      {booking.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {booking.bookingId} &middot; {booking.items.length} test(s) &middot; ₹{booking.totalAmount}
                  </p>
                </div>
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
