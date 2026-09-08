'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'

interface BookingItem {
  id: string
  testName: string
  testPrice: number
}

interface Booking {
  id: string
  bookingId: string
  patientName: string
  patientPhone: string
  patientEmail: string | null
  patientAddress: string | null
  collectionType: string
  preferredDate: string | null
  preferredTime: string | null
  status: string
  totalAmount: number
  homeCharge: number
  nightCharge: number
  isNightBooking: boolean
  nightMessage: string | null
  notes: string | null
  createdAt: string
  items: BookingItem[]
}

const filters = [
  { key: 'all', label: 'All' },
  { key: 'today', label: 'Today' },
  { key: 'pending', label: 'Pending' },
  { key: 'night', label: 'Night' },
  { key: 'home', label: 'Home' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
]

const statusColors: Record<string, string> = {
  requested: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue/10 text-blue',
  sample_collected: 'bg-purple-100 text-purple-800',
  processing: 'bg-orange-100 text-orange-800',
  report_ready: 'bg-success/10 text-success',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

const statusActions: Record<string, string[]> = {
  requested: ['confirmed', 'cancelled'],
  confirmed: ['sample_collected', 'cancelled'],
  sample_collected: ['processing'],
  processing: ['report_ready'],
  report_ready: ['completed'],
}

const typeLabels: Record<string, string> = {
  lab_visit: 'Lab Visit',
  home_collection: 'Home Collection',
  night_request: 'Night Request',
}

export default function AdminBookingsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialFilter = searchParams.get('filter') || 'all'

  const [bookings, setBookings] = useState<Booking[]>([])
  const [total, setTotal] = useState(0)
  const [activeFilter, setActiveFilter] = useState(initialFilter)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const limit = 20

  const fetchBookings = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('limit', String(limit))
      params.set('offset', String(page * limit))

      if (activeFilter === 'pending') params.set('status', 'requested')
      else if (activeFilter === 'confirmed') params.set('status', 'confirmed')
      else if (activeFilter === 'completed') params.set('status', 'completed')
      else if (activeFilter === 'cancelled') params.set('status', 'cancelled')
      else if (activeFilter === 'night') params.set('type', 'night_request')
      else if (activeFilter === 'home') params.set('type', 'home_collection')

      const res = await fetch(`/api/admin/bookings?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        let fetched = data.bookings || []

        if (activeFilter === 'today') {
          const today = new Date().toISOString().split('T')[0]
          fetched = fetched.filter((b: Booking) => b.createdAt.startsWith(today))
        }

        setBookings(fetched)
        setTotal(data.total || 0)
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [activeFilter, page])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  const displayedBookings = search ? bookings.filter((b: Booking) => {
    const q = search.toLowerCase()
    return (
      b.bookingId.toLowerCase().includes(q) ||
      b.patientPhone.includes(q) ||
      b.patientName.toLowerCase().includes(q)
    )
  }) : bookings

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id)
    try {
      const res = await fetch('/api/admin/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      })
      if (res.ok) {
        await fetchBookings()
      }
    } catch { /* ignore */ }
    setUpdatingId(null)
  }

  const handleFilterChange = (key: string) => {
    setActiveFilter(key)
    setPage(0)
    setExpandedId(null)
    router.replace(`/admin/bookings${key !== 'all' ? `?filter=${key}` : ''}`, { scroll: false })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Bookings</h1>
        <span className="text-xs text-gray-500">{total} total</span>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => handleFilterChange(f.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
              activeFilter === f.key
                ? 'bg-blue text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search by ID, phone, or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent"
        />
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-6 h-6 border-3 border-blue border-t-transparent rounded-full animate-spin" />
        </div>
      ) : displayedBookings.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-gray-500">No bookings found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayedBookings.map((booking) => {
            const isExpanded = expandedId === booking.id
            const actions = statusActions[booking.status] || []

            return (
              <div key={booking.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : booking.id)}
                  className="w-full text-left p-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono text-gray-500">{booking.bookingId}</span>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${statusColors[booking.status] || 'bg-gray-100 text-gray-800'}`}>
                          {booking.status.replace('_', ' ')}
                        </span>
                        {booking.isNightBooking && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-800">Night</span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-gray-900 mt-1">{booking.patientName}</p>
                      <p className="text-xs text-gray-500">
                        {typeLabels[booking.collectionType] || booking.collectionType} &middot; {booking.items.length} test(s) &middot; ₹{booking.totalAmount}
                      </p>
                    </div>
                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-100 p-3 space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">Phone</span>
                        <p className="font-medium">{booking.patientPhone}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Date</span>
                        <p className="font-medium">{booking.preferredDate || 'Not set'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Time</span>
                        <p className="font-medium">{booking.preferredTime || 'Not set'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Amount</span>
                        <p className="font-medium">₹{booking.totalAmount}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <a
                        href={`tel:${booking.patientPhone}`}
                        className="flex items-center gap-1 px-3 py-1.5 bg-success/10 text-success text-xs font-medium rounded-lg"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        Call
                      </a>
                      <a
                        href={`https://wa.me/${booking.patientPhone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 text-xs font-medium rounded-lg"
                      >
                        WhatsApp
                      </a>
                      <Link
                        href={`/admin/bookings/${booking.id}`}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue/10 text-blue text-xs font-medium rounded-lg"
                      >
                        View Details
                      </Link>
                    </div>

                    {actions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {actions.map((action) => (
                          <button
                            key={action}
                            onClick={(e) => {
                              e.stopPropagation()
                              if (confirm(`Mark as ${action.replace('_', ' ')}?`)) {
                                updateStatus(booking.id, action)
                              }
                            }}
                            disabled={updatingId === booking.id}
                            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-xs font-medium text-gray-700 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {updatingId === booking.id ? '...' : action.replace('_', ' ')}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {total > limit && (
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-xs text-gray-500">
            Page {page + 1} of {Math.ceil(total / limit)}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={(page + 1) * limit >= total}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
