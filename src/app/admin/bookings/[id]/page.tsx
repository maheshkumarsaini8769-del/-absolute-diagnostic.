'use client'

import { useEffect, useState, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'

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

const statusSteps = ['requested', 'confirmed', 'sample_collected', 'processing', 'report_ready', 'completed']
const statusLabels: Record<string, string> = {
  requested: 'Requested',
  confirmed: 'Confirmed',
  sample_collected: 'Sample Collected',
  processing: 'Processing',
  report_ready: 'Report Ready',
  completed: 'Completed',
  cancelled: 'Cancelled',
}
const statusColors: Record<string, string> = {
  requested: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue/10 text-blue',
  sample_collected: 'bg-purple-100 text-purple-800',
  processing: 'bg-orange-100 text-orange-800',
  report_ready: 'bg-success/10 text-success',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

export default function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [notes, setNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)

  const fetchBooking = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/bookings/${id}`)
      if (res.ok) {
        const data = await res.json()
        setBooking(data.booking)
        setNotes(data.booking.notes || '')
      } else {
        router.push('/admin/bookings')
      }
    } catch {
      router.push('/admin/bookings')
    }
    setLoading(false)
  }, [id, router])

  useEffect(() => {
    fetchBooking()
  }, [fetchBooking])

  const updateStatus = async (status: string) => {
    setUpdating(true)
    try {
      const res = await fetch(`/api/admin/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      if (res.ok) {
        await fetchBooking()
      }
    } catch { /* ignore */ }
    setUpdating(false)
  }

  const saveNotes = async () => {
    setSavingNotes(true)
    try {
      const res = await fetch(`/api/admin/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes })
      })
      if (res.ok) {
        await fetchBooking()
      }
    } catch { /* ignore */ }
    setSavingNotes(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-3 border-blue border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!booking) return null

  const currentIndex = statusSteps.indexOf(booking.status)
  const nextActions = {
    requested: ['confirmed', 'cancelled'],
    confirmed: ['sample_collected', 'cancelled'],
    sample_collected: ['processing'],
    processing: ['report_ready'],
    report_ready: ['completed'],
  }[booking.status] || []

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-gray-900">{booking.bookingId}</h1>
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${statusColors[booking.status]}`}>
            {statusLabels[booking.status]}
          </span>
        </div>
      </div>

      {/* Status Timeline */}
      {booking.status !== 'cancelled' && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Status Timeline</h2>
          <div className="flex items-center gap-1 overflow-x-auto pb-2">
            {statusSteps.map((step, i) => {
              const isCompleted = i <= currentIndex
              const isCurrent = i === currentIndex
              return (
                <div key={step} className="flex items-center">
                  <div className={`flex flex-col items-center min-w-[60px]`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isCompleted ? 'bg-blue text-white' : 'bg-gray-200 text-gray-500'
                    } ${isCurrent ? 'ring-2 ring-blue ring-offset-2' : ''}`}>
                      {isCompleted ? '✓' : i + 1}
                    </div>
                    <span className="text-[9px] text-gray-500 mt-1 text-center leading-tight">
                      {statusLabels[step]}
                    </span>
                  </div>
                  {i < statusSteps.length - 1 && (
                    <div className={`w-6 h-0.5 ${i < currentIndex ? 'bg-blue' : 'bg-gray-200'}`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Patient Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Patient Details</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Name</span>
            <span className="font-medium">{booking.patientName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Phone</span>
            <div className="flex items-center gap-2">
              <span className="font-medium">{booking.patientPhone}</span>
              <a href={`tel:${booking.patientPhone}`} className="p-1 bg-success/10 rounded">
                <svg className="w-3.5 h-3.5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </a>
              <a
                href={`https://wa.me/${booking.patientPhone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 bg-green-50 rounded"
              >
                <svg className="w-3.5 h-3.5 text-green-700" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </a>
            </div>
          </div>
          {booking.patientEmail && (
            <div className="flex justify-between">
              <span className="text-gray-500">Email</span>
              <span className="font-medium">{booking.patientEmail}</span>
            </div>
          )}
          {booking.patientAddress && (
            <div className="flex justify-between">
              <span className="text-gray-500">Address</span>
              <span className="font-medium text-right max-w-[60%]">{booking.patientAddress}</span>
            </div>
          )}
        </div>
      </div>

      {/* Booking Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Booking Info</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Type</span>
            <span className="font-medium">{booking.collectionType.replace('_', ' ')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Date</span>
            <span className="font-medium">{booking.preferredDate || 'Not set'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Time</span>
            <span className="font-medium">{booking.preferredTime || 'Not set'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Created</span>
            <span className="font-medium">{new Date(booking.createdAt).toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Tests / Items</h2>
        <div className="space-y-2">
          {booking.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-gray-700">{item.testName}</span>
              <span className="font-medium">₹{item.testPrice}</span>
            </div>
          ))}
          <div className="border-t border-gray-200 pt-2 mt-2">
            {booking.homeCharge > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Home Charge</span>
                <span className="font-medium">₹{booking.homeCharge}</span>
              </div>
            )}
            {booking.nightCharge > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Night Charge</span>
                <span className="font-medium">₹{booking.nightCharge}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-semibold">
              <span>Total</span>
              <span>₹{booking.totalAmount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Night Message */}
      {booking.isNightBooking && booking.nightMessage && (
        <div className="bg-purple-50 rounded-xl border border-purple-200 p-4">
          <h2 className="text-sm font-semibold text-purple-900 mb-1">Night Request Message</h2>
          <p className="text-sm text-purple-800">{booking.nightMessage}</p>
        </div>
      )}

      {/* Notes */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Notes</h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add notes about this booking..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent"
          rows={3}
        />
        <button
          onClick={saveNotes}
          disabled={savingNotes}
          className="mt-2 px-4 py-1.5 bg-blue text-white text-xs font-medium rounded-lg hover:bg-blue-dark disabled:opacity-50 transition-colors"
        >
          {savingNotes ? 'Saving...' : 'Save Notes'}
        </button>
      </div>

      {/* Status Actions */}
      {nextActions.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Actions</h2>
          <div className="flex flex-wrap gap-2">
            {nextActions.map((action) => (
              <button
                key={action}
                onClick={() => {
                  if (confirm(`Mark as ${statusLabels[action]}?`)) {
                    updateStatus(action)
                  }
                }}
                disabled={updating}
                className="px-4 py-2 bg-blue text-white text-sm font-medium rounded-lg hover:bg-blue-dark disabled:opacity-50 transition-colors"
              >
                {updating ? 'Updating...' : statusLabels[action]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
