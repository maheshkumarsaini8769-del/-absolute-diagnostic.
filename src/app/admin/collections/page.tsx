'use client'

import { useState, useEffect } from 'react'

interface BookingItem {
  testName: string
  testPrice: number
}

interface CollectionBooking {
  _id: string
  bookingId: string
  patientName: string
  patientPhone: string
  patientAddress?: string
  preferredDate?: string
  preferredTime?: string
  status: string
  totalAmount: number
  homeCharge?: number
  items?: BookingItem[]
  notes?: string
  createdAt: string
}

export default function PhlebotomistCollectionsPage() {
  const [bookings, setBookings] = useState<CollectionBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [todayCount, setTodayCount] = useState(0)
  const [pendingCount, setPendingCount] = useState(0)

  // Actions
  const [selectedBooking, setSelectedBooking] = useState<CollectionBooking | null>(null)
  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [isFailModalOpen, setIsFailModalOpen] = useState(false)

  const [collectorName, setCollectorName] = useState('Anil Sharma (Phlebotomist)')
  const [barcodeInput, setBarcodeInput] = useState('')
  const [failureReason, setFailureReason] = useState('Patient unavailable at address')
  const [collectionNotes, setCollectionNotes] = useState('Sample drawn smoothly, EDTA tube inverted 8 times.')
  const [isProcessing, setIsProcessing] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    fetchCollections()
  }, [statusFilter])

  const fetchCollections = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/collections?status=${statusFilter}`)
      const data = await res.json()
      setBookings(data.bookings || [])
      setTodayCount(data.todayCount || 0)
      setPendingCount(data.pendingCount || 0)
    } catch (err) {
      console.error('Fetch collections error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (action: 'assign' | 'on_the_way' | 'collected' | 'failed') => {
    if (!selectedBooking) return
    setIsProcessing(true)
    setMsg('')

    try {
      const res = await fetch('/api/admin/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: selectedBooking._id,
          action,
          collectorName,
          barcode: barcodeInput,
          failureReason,
          notes: collectionNotes,
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Action failed')

      setMsg('✓ Status updated successfully!')
      setTimeout(() => {
        setIsCollectModalOpen(false)
        setIsAssignModalOpen(false)
        setIsFailModalOpen(false)
        setMsg('')
        fetchCollections()
      }, 1000)
    } catch (err: any) {
      setMsg(err.message || 'Operation error')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* ═══ HEADER ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--navy)]" style={{ fontFamily: 'var(--font-jakarta)' }}>
            Phlebotomist & Home Sample Collection Dispatch
          </h1>
          <p className="text-sm text-[var(--gray-500)] mt-1">
            Manage phlebotomist home visits, route navigation, sample collection confirmations, and doorstep barcode accessioning.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
            Pending Dispatch: {pendingCount}
          </div>
          <div className="px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
            Today's Visits: {todayCount}
          </div>
        </div>
      </div>

      {/* ═══ STATUS FILTER ═══ */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'all', label: 'All Home Visits' },
          { id: 'requested', label: 'Pending Assignment' },
          { id: 'confirmed', label: 'Assigned / In Progress' },
          { id: 'sample_collected', label: 'Collected / En Route' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors shrink-0 ${
              statusFilter === tab.id
                ? 'bg-[var(--navy)] text-white'
                : 'bg-white border border-[var(--gray-200)] text-[var(--gray-600)] hover:bg-[var(--gray-100)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══ CARDS / LIST ═══ */}
      {loading ? (
        <div className="p-12 text-center text-sm text-[var(--gray-500)] animate-pulse">
          Loading phlebotomy routes...
        </div>
      ) : bookings.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-[var(--gray-200)] shadow-sm">
          <p className="text-base font-bold text-[var(--navy)]">No home collection requests found</p>
          <p className="text-xs text-[var(--gray-500)] mt-1">When patients book home collection, visits appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {bookings.map((b) => (
            <div
              key={b._id}
              className="p-5 rounded-2xl bg-white border border-[var(--gray-200)] hover:border-[var(--blue)]/30 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Top Status & Booking ID */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="font-mono font-bold text-xs text-[var(--navy)]">{b.bookingId}</span>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border ${
                    b.status === 'sample_collected' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    b.status === 'confirmed' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    b.status === 'cancelled' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                    'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {b.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Patient Name & Phone */}
                <h3 className="font-bold text-base text-[var(--navy)]">{b.patientName}</h3>
                <div className="flex items-center gap-2 mt-1 mb-3">
                  <a
                    href={`tel:${b.patientPhone}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition-colors"
                  >
                    📞 {b.patientPhone}
                  </a>
                </div>

                {/* Address & Navigation */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 mb-3">
                  <p className="line-clamp-2">{b.patientAddress || 'Address not specified'}</p>
                  {b.patientAddress && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.patientAddress)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[var(--blue)] font-bold text-[11px] mt-1.5 hover:underline"
                    >
                      📍 Open Navigation in Google Maps ↗
                    </a>
                  )}
                </div>

                {/* Slot & Date */}
                <div className="text-xs text-[var(--gray-600)] space-y-1 mb-3">
                  <div>📅 Date: <span className="font-semibold text-[var(--navy)]">{b.preferredDate || 'Earliest available'}</span></div>
                  <div>⏰ Time Slot: <span className="font-semibold text-[var(--navy)]">{b.preferredTime || 'Morning Fasting (7-9 AM)'}</span></div>
                </div>

                {/* Tests summary */}
                <div className="border-t border-slate-100 pt-2 mb-3">
                  <span className="text-[10px] text-[var(--gray-400)] uppercase font-bold tracking-wider">Tests to Draw:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {b.items?.map((item, idx) => (
                      <span key={idx} className="text-xs px-2 py-0.5 rounded bg-[var(--gray-100)] text-[var(--navy)] font-medium">
                        {item.testName}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="border-t border-slate-100 pt-3 flex flex-wrap items-center gap-2 justify-end">
                {b.status === 'requested' && (
                  <button
                    onClick={() => {
                      setSelectedBooking(b)
                      setIsAssignModalOpen(true)
                    }}
                    className="w-full py-2 rounded-xl bg-[var(--blue)] hover:bg-[var(--navy)] text-white text-xs font-bold transition-colors"
                  >
                    Assign Phlebotomist
                  </button>
                )}

                {b.status === 'confirmed' && (
                  <>
                    <button
                      onClick={() => {
                        setSelectedBooking(b)
                        handleAction('on_the_way')
                      }}
                      className="px-3 py-1.5 rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50 text-xs font-bold"
                    >
                      On The Way
                    </button>
                    <button
                      onClick={() => {
                        setSelectedBooking(b)
                        setBarcodeInput(`BC-${b.bookingId.slice(-6)}`)
                        setIsCollectModalOpen(true)
                      }}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm"
                    >
                      ✓ Collected
                    </button>
                    <button
                      onClick={() => {
                        setSelectedBooking(b)
                        setIsFailModalOpen(true)
                      }}
                      className="px-2.5 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold"
                    >
                      Failed
                    </button>
                  </>
                )}

                {b.status === 'sample_collected' && (
                  <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                    ✓ Sample in Transit to Lab
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═══ MODAL: ASSIGN PHLEBOTOMIST ═══ */}
      {isAssignModalOpen && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-[var(--navy)] mb-1">Assign Phlebotomist for Home Visit</h3>
            <p className="text-xs text-[var(--gray-500)] mb-4">{selectedBooking.patientName} — {selectedBooking.bookingId}</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--navy)] mb-1.5">Select Phlebotomist *</label>
                <select
                  value={collectorName}
                  onChange={(e) => setCollectorName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--gray-200)] text-sm outline-none focus:border-[var(--blue)]"
                >
                  <option value="Anil Sharma (North Zone)">Anil Sharma (North Zone)</option>
                  <option value="Ravi Verma (South Zone)">Ravi Verma (South Zone)</option>
                  <option value="Suresh Kumar (Central / East)">Suresh Kumar (Central / East)</option>
                  <option value="Pooja Patel (West Zone)">Pooja Patel (West Zone)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[var(--gray-600)] hover:bg-[var(--gray-100)]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleAction('assign')}
                  className="px-5 py-2 rounded-xl bg-[var(--blue)] text-white text-xs font-bold hover:bg-[var(--navy)]"
                >
                  {isProcessing ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL: SAMPLE COLLECTED ═══ */}
      {isCollectModalOpen && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-[var(--navy)] mb-1">Confirm Doorstep Sample Collection</h3>
            <p className="text-xs text-[var(--gray-500)] mb-4">{selectedBooking.patientName} ({selectedBooking.bookingId})</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--navy)] mb-1.5">Scanned Tube Barcode *</label>
                <input
                  type="text"
                  required
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  placeholder="e.g. BC-984712"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--gray-200)] text-sm font-mono outline-none focus:border-[var(--blue)]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--navy)] mb-1.5">Collection Remarks</label>
                <textarea
                  rows={2}
                  value={collectionNotes}
                  onChange={(e) => setCollectionNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--gray-200)] text-xs outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCollectModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[var(--gray-600)] hover:bg-[var(--gray-100)]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleAction('collected')}
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
                >
                  {isProcessing ? 'Confirming...' : '✓ Confirm & Print Receipt'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL: FAILED / RESCHEDULE ═══ */}
      {isFailModalOpen && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 border-l-4 border-rose-500">
            <h3 className="text-lg font-bold text-rose-700 mb-1">Mark Collection Incomplete</h3>
            <p className="text-xs text-[var(--gray-500)] mb-4">{selectedBooking.patientName} ({selectedBooking.bookingId})</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--navy)] mb-1.5">Reason for Visit Failure *</label>
                <select
                  value={failureReason}
                  onChange={(e) => setFailureReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--gray-200)] text-sm outline-none"
                >
                  <option value="Patient unavailable at address">Patient unavailable at address</option>
                  <option value="Patient fasting broken">Patient fasting broken (cannot draw test)</option>
                  <option value="Patient refused / requested reschedule">Patient requested reschedule</option>
                  <option value="Address unreachable / phone switched off">Address unreachable</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFailModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[var(--gray-600)] hover:bg-[var(--gray-100)]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleAction('failed')}
                  className="px-5 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700"
                >
                  {isProcessing ? 'Saving...' : 'Confirm Incomplete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
