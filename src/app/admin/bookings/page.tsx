'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'

interface BookingItem {
  id?: string
  testName: string
  testPrice: number
}

interface TimelineEvent {
  stage: string
  timestamp: string
  performedBy?: string
  note?: string
}

interface ExtractedParameter {
  parameter: string
  value: string
  unit: string
  referenceRange: string
  isAbnormal: boolean
  indicator: 'normal' | 'high' | 'low' | 'critical'
}

interface ReportInfo {
  id: string
  fileName: string
  testName: string
  status: string
  fileUrl: string
  reportDate: string
  uploadedAt?: string
  verifiedBy?: string
  verifiedAt?: string
  publishedAt?: string
  analysisData?: {
    parameters?: ExtractedParameter[]
    criticalFlags?: string[]
    summary?: string
    pathologistNotes?: string
    pathologist?: string
    hasAbnormal?: boolean
  }
}

interface Booking {
  id: string
  bookingId: string
  patientId: string
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
  patient?: { id: string; name: string; phone: string; age?: number; gender?: string } | null
  report?: ReportInfo | null
  timeline?: TimelineEvent[]
}

const filters = [
  { key: 'all', label: 'All' },
  { key: 'new', label: 'New' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'collection', label: 'Sample Collection' },
  { key: 'received', label: 'Sample Received' },
  { key: 'processing', label: 'Processing' },
  { key: 'report_pending', label: 'Report Pending' },
  { key: 'verification_pending', label: 'Verification Pending' },
  { key: 'ready', label: 'Ready / Published' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
]

const statusColors: Record<string, string> = {
  requested: 'bg-amber-100 text-amber-900 border-amber-200',
  confirmed: 'bg-blue/10 text-blue border-blue/20',
  sample_collected: 'bg-purple-100 text-purple-900 border-purple-200',
  sample_received: 'bg-indigo-100 text-indigo-900 border-indigo-200',
  processing: 'bg-orange-100 text-orange-900 border-orange-200',
  under_review: 'bg-amber-100 text-amber-900 border-amber-300',
  verified: 'bg-teal-100 text-teal-900 border-teal-300',
  report_ready: 'bg-green-100 text-green-900 border-green-300',
  ready: 'bg-green-100 text-green-900 border-green-300',
  patient_notified: 'bg-sky-100 text-sky-900 border-sky-300',
  completed: 'bg-emerald-100 text-emerald-900 border-emerald-300',
  cancelled: 'bg-red-100 text-red-900 border-red-200',
}

const TIMELINE_STAGES = [
  { key: 'requested', label: 'Booking' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'sample_collected', label: 'Collected' },
  { key: 'sample_received', label: 'Received' },
  { key: 'processing', label: 'Processing' },
  { key: 'under_review', label: 'Report & Analysis' },
  { key: 'verified', label: 'Verified' },
  { key: 'report_ready', label: 'Published' },
  { key: 'patient_notified', label: 'Notified' },
  { key: 'completed', label: 'Done' },
]

function getStageIndex(status: string): number {
  switch (status) {
    case 'requested': return 0
    case 'confirmed': return 1
    case 'sample_collected': return 2
    case 'sample_received': return 3
    case 'processing': return 4
    case 'under_review': case 'report_uploaded': return 5
    case 'verified': return 6
    case 'report_ready': case 'ready': return 7
    case 'patient_notified': return 8
    case 'completed': return 9
    default: return -1
  }
}

function getNextAction(b: Booking): { label: string; action: string; color: string } {
  const s = b.status
  const rep = b.report

  if (s === 'requested') return { label: 'Confirm Booking', action: 'confirmed', color: 'bg-blue text-white hover:bg-blue-dark' }
  if (s === 'confirmed') return { label: 'Mark Sample Collected', action: 'sample_collected', color: 'bg-purple-600 text-white hover:bg-purple-700' }
  if (s === 'sample_collected') return { label: 'Mark Sample Received', action: 'sample_received', color: 'bg-indigo-600 text-white hover:bg-indigo-700' }
  if (s === 'sample_received') return { label: 'Start Processing', action: 'processing', color: 'bg-orange-600 text-white hover:bg-orange-700' }
  if (s === 'processing') {
    if (!rep) return { label: 'Upload Report', action: 'inline_upload', color: 'bg-teal-600 text-white hover:bg-teal-700' }
    return { label: 'Verify Report', action: 'verify_report', color: 'bg-teal-700 text-white hover:bg-teal-800' }
  }
  if (s === 'under_review' || (rep && rep.status === 'under_review')) {
    return { label: 'Verify Report', action: 'verify_report', color: 'bg-teal-700 text-white hover:bg-teal-800' }
  }
  if (s === 'verified' || (rep && rep.status === 'verified')) {
    return { label: 'Publish Report', action: 'publish_report', color: 'bg-green-600 text-white hover:bg-green-700' }
  }
  if (s === 'report_ready' || s === 'ready' || (rep && rep.status === 'ready')) {
    return { label: 'Notify Patient', action: 'patient_notified', color: 'bg-sky-600 text-white hover:bg-sky-700' }
  }
  if (s === 'patient_notified') {
    return { label: 'Mark Completed', action: 'completed', color: 'bg-emerald-700 text-white hover:bg-emerald-800' }
  }
  if (s === 'completed') {
    return { label: 'Completed', action: 'none', color: 'bg-gray-200 text-gray-700' }
  }
  return { label: 'Manage Booking', action: 'none', color: 'bg-gray-100 text-gray-700' }
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
  const [uploadingBookingId, setUploadingBookingId] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const limit = 20

  const fetchBookings = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('limit', String(limit))
      params.set('offset', String(page * limit))
      if (activeFilter !== 'all') params.set('status', activeFilter)

      const res = await fetch(`/api/admin/bookings?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setBookings(data.bookings || [])
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
      b.patientName.toLowerCase().includes(q) ||
      b.items?.some(i => i.testName.toLowerCase().includes(q))
    )
  }) : bookings

  const updateStatus = async (id: string, status: string, note?: string) => {
    setUpdatingId(id)
    try {
      const res = await fetch('/api/admin/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, note })
      })
      if (res.ok) {
        await fetchBookings()
      }
    } catch { /* ignore */ }
    setUpdatingId(null)
  }

  const handleInlineUpload = async (booking: Booking, file: File) => {
    setUploadingBookingId(booking.id)
    setUploadError(null)

    try {
      const formData = new FormData()
      formData.append('report', file)
      formData.append('bookingId', booking.id)
      if (booking.patientId) formData.append('patientId', booking.patientId)
      formData.append('patientName', booking.patientName)
      formData.append('mobile', booking.patientPhone)

      const res = await fetch('/api/admin/reports/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) {
        setUploadError(data.error || 'Upload failed')
      } else {
        await fetchBookings()
      }
    } catch {
      setUploadError('Network error during upload')
    }
    setUploadingBookingId(null)
  }

  const verifyOrPublishReport = async (reportId: string, action: 'verify' | 'publish') => {
    setUpdatingId(reportId)
    try {
      const res = await fetch('/api/admin/reports/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId, action })
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
    router.replace(`/admin/bookings${key !== 'all' ? `?filter=${key}` : ''}`, { scroll: false })
  }

  return (
    <div className="space-y-4 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Bookings & Reports Workflow</h1>
          <p className="text-xs text-gray-500">Manage complete patient lifecycle in-place with expandable rows</p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full">{total} Bookings</span>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => handleFilterChange(f.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
              activeFilter === f.key
                ? 'bg-blue text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search by Patient Name, Phone (e.g. 7742735762), Booking ID, or Test Name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent bg-white shadow-sm"
        />
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="flex items-center justify-center h-48 bg-white rounded-xl border border-gray-100">
          <div className="w-8 h-8 border-3 border-blue border-t-transparent rounded-full animate-spin" />
        </div>
      ) : displayedBookings.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <p className="text-sm font-medium text-gray-600">No bookings match the current filter</p>
          <p className="text-xs text-gray-400 mt-1">Try selecting another filter or clearing the search</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedBookings.map((booking) => {
            const isExpanded = expandedId === booking.id
            const currentStageIdx = getStageIndex(booking.status)
            const nextAction = getNextAction(booking)
            const report = booking.report
            const patientAge = booking.patient?.age || (report?.analysisData?.parameters ? 18 : null)

            return (
              <div
                key={booking.id}
                className={`bg-white rounded-xl border transition-all duration-200 overflow-hidden shadow-sm ${
                  isExpanded ? 'border-blue shadow-md ring-1 ring-blue/20' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* Main Row Header (Clickable) */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : booking.id)}
                  className="p-3.5 sm:p-4 cursor-pointer select-none hover:bg-gray-50/50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Left Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
                          #{booking.bookingId}
                        </span>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${statusColors[booking.status] || 'bg-gray-100 text-gray-800'}`}>
                          {booking.status.replace(/_/g, ' ').toUpperCase()}
                        </span>
                        {booking.isNightBooking && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                            Night Urgent
                          </span>
                        )}
                        {/* Prominent Next Action Badge */}
                        {nextAction.action !== 'none' && (
                          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                            <span className="text-amber-500 font-bold">⚡ Next:</span> {nextAction.label}
                          </span>
                        )}
                      </div>

                      {/* Patient & Test Overview */}
                      <div className="mt-1.5 flex items-baseline gap-2 flex-wrap">
                        <span className="text-base font-bold text-gray-900">{booking.patientName}</span>
                        {patientAge && <span className="text-xs text-gray-500">({patientAge} yrs)</span>}
                        <span className="text-xs text-gray-500 font-mono">{booking.patientPhone}</span>
                      </div>

                      <div className="text-xs text-gray-600 mt-1 flex items-center gap-3 flex-wrap">
                        <span className="font-medium text-gray-800">
                          {booking.items.map(i => i.testName).join(', ') || 'Diagnostic Test'}
                        </span>
                        <span>&middot;</span>
                        <span>{booking.collectionType === 'home_collection' ? '🏠 Home Collection' : '🏥 Lab Visit'}</span>
                        <span>&middot;</span>
                        <span className="font-semibold text-gray-900">₹{booking.totalAmount}</span>
                        {booking.preferredDate && (
                          <>
                            <span>&middot;</span>
                            <span>Scheduled: {booking.preferredDate} {booking.preferredTime || ''}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Right Toggle & Quick Action */}
                    <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                      {nextAction.action !== 'none' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (nextAction.action === 'inline_upload') {
                              setExpandedId(booking.id)
                            } else if (nextAction.action === 'verify_report' && report) {
                              verifyOrPublishReport(report.id, 'verify')
                            } else if (nextAction.action === 'publish_report' && report) {
                              verifyOrPublishReport(report.id, 'publish')
                            } else {
                              updateStatus(booking.id, nextAction.action)
                            }
                          }}
                          disabled={updatingId === booking.id}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${nextAction.color} disabled:opacity-50`}
                        >
                          {updatingId === booking.id ? 'Updating...' : nextAction.label}
                        </button>
                      )}

                      <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition-transform ${isExpanded ? 'rotate-180 bg-blue/10 text-blue' : 'text-gray-500'}`}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* EXPANDED SECTION */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50/50 p-4 sm:p-6 space-y-6">
                    {/* 1. VISUAL WORKFLOW TIMELINE */}
                    <div>
                      <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Workflow Lifecycle Timeline
                      </h4>

                      <div className="overflow-x-auto pb-2">
                        <div className="flex items-center min-w-[700px]">
                          {TIMELINE_STAGES.map((st, idx) => {
                            const isPast = idx < currentStageIdx
                            const isCurrent = idx === currentStageIdx
                            return (
                              <div key={st.key} className="flex-1 flex items-center">
                                <div className="flex flex-col items-center flex-1">
                                  <div
                                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                      isCurrent
                                        ? 'bg-blue text-white ring-4 ring-blue/20 scale-110 shadow-sm'
                                        : isPast
                                        ? 'bg-green-600 text-white'
                                        : 'bg-gray-200 text-gray-500'
                                    }`}
                                  >
                                    {isPast ? '✓' : isCurrent ? '●' : String(idx + 1)}
                                  </div>
                                  <span className={`text-[11px] mt-1 text-center font-medium ${isCurrent ? 'text-blue font-bold' : isPast ? 'text-gray-800' : 'text-gray-400'}`}>
                                    {st.label}
                                  </span>
                                </div>
                                {idx < TIMELINE_STAGES.length - 1 && (
                                  <div className={`h-1 flex-1 -mt-4 transition-colors ${idx < currentStageIdx ? 'bg-green-500' : 'bg-gray-200'}`} />
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {/* Timeline Audit Logs if present */}
                      {booking.timeline && booking.timeline.length > 0 && (
                        <div className="mt-3 p-2.5 bg-white rounded-lg border border-gray-200 text-xs text-gray-600 space-y-1 max-h-32 overflow-y-auto">
                          <span className="font-semibold text-gray-700">Audit History:</span>
                          {booking.timeline.map((item, i) => (
                            <div key={i} className="flex items-center justify-between text-[11px] border-b border-gray-50 pb-0.5">
                              <span><strong>{item.stage.replace(/_/g, ' ')}</strong> - {item.note || 'No notes'} ({item.performedBy || 'Admin'})</span>
                              <span className="text-gray-400 font-mono">{new Date(item.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 2. ONE-CLICK STAGE TRANSITIONS */}
                    <div className="p-3.5 bg-white rounded-xl border border-gray-200">
                      <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Stage Action Controls</h4>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => updateStatus(booking.id, 'confirmed')}
                          disabled={updatingId === booking.id}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-medium rounded-lg transition-colors"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => updateStatus(booking.id, 'sample_collected')}
                          disabled={updatingId === booking.id}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-medium rounded-lg transition-colors"
                        >
                          Collect Sample
                        </button>
                        <button
                          onClick={() => updateStatus(booking.id, 'sample_received')}
                          disabled={updatingId === booking.id}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-medium rounded-lg transition-colors"
                        >
                          Receive Sample
                        </button>
                        <button
                          onClick={() => updateStatus(booking.id, 'processing')}
                          disabled={updatingId === booking.id}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-medium rounded-lg transition-colors"
                        >
                          Processing
                        </button>
                        {report && report.status !== 'verified' && (
                          <button
                            onClick={() => verifyOrPublishReport(report.id, 'verify')}
                            disabled={updatingId === report.id}
                            className="px-3 py-1.5 bg-teal-50 text-teal-700 hover:bg-teal-100 text-xs font-semibold rounded-lg transition-colors"
                          >
                            Verify Report
                          </button>
                        )}
                        {report && report.status !== 'ready' && report.status !== 'published' && (
                          <button
                            onClick={() => verifyOrPublishReport(report.id, 'publish')}
                            disabled={updatingId === report.id}
                            className="px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 text-xs font-semibold rounded-lg transition-colors"
                          >
                            Publish / Ready
                          </button>
                        )}
                        <button
                          onClick={() => updateStatus(booking.id, 'patient_notified')}
                          disabled={updatingId === booking.id}
                          className="px-3 py-1.5 bg-sky-50 text-sky-700 hover:bg-sky-100 text-xs font-semibold rounded-lg transition-colors"
                        >
                          Notify Patient
                        </button>
                        <button
                          onClick={() => updateStatus(booking.id, 'completed')}
                          disabled={updatingId === booking.id}
                          className="px-3 py-1.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-semibold rounded-lg transition-colors"
                        >
                          Mark Completed
                        </button>
                      </div>
                    </div>

                    {/* 3. INLINE REPORT UPLOAD & ANALYSIS PREVIEW */}
                    <div className="p-4 bg-white rounded-xl border border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                          <svg className="w-4 h-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Diagnostic Report & Automatic Analysis
                        </h4>
                        {report && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColors[report.status] || 'bg-gray-100'}`}>
                            Report: {report.status.toUpperCase()}
                          </span>
                        )}
                      </div>

                      {uploadError && (
                        <div className="mb-3 p-2.5 bg-red-50 text-red-700 border border-red-100 rounded-lg text-xs">
                          {uploadError}
                        </div>
                      )}

                      {/* If Report already exists */}
                      {report ? (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-3 bg-blue/5 rounded-xl border border-blue/10 flex-wrap gap-2">
                            <div>
                              <p className="text-sm font-bold text-gray-900">{report.testName}</p>
                              <p className="text-xs text-gray-500 font-mono mt-0.5">{report.fileName}</p>
                              {report.verifiedBy && (
                                <p className="text-[11px] text-teal-700 mt-1">
                                  Verified by <strong>{report.verifiedBy}</strong> on {report.verifiedAt ? new Date(report.verifiedAt).toLocaleDateString('en-IN') : ''}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <a
                                href={report.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 bg-blue text-white text-xs font-medium rounded-lg hover:bg-blue-dark transition-colors flex items-center gap-1"
                              >
                                View File
                              </a>
                              <a
                                href={report.fileUrl}
                                download={report.fileName}
                                className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors"
                              >
                                Download
                              </a>
                              {report.status !== 'verified' && (
                                <button
                                  onClick={() => verifyOrPublishReport(report.id, 'verify')}
                                  disabled={updatingId === report.id}
                                  className="px-3 py-1.5 bg-teal-600 text-white text-xs font-medium rounded-lg hover:bg-teal-700 transition-colors"
                                >
                                  Verify
                                </button>
                              )}
                              {report.status !== 'ready' && report.status !== 'published' && (
                                <button
                                  onClick={() => verifyOrPublishReport(report.id, 'publish')}
                                  disabled={updatingId === report.id}
                                  className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors"
                                >
                                  Publish
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Extracted Parameters Table */}
                          {report.analysisData?.parameters && report.analysisData.parameters.length > 0 ? (
                            <div>
                              <p className="text-xs font-semibold text-gray-700 mb-2">
                                Extracted Test Values & Reference Ranges ({report.analysisData.parameters.length} parameters):
                              </p>
                              {report.analysisData.summary && (
                                <p className="text-xs text-gray-600 italic bg-gray-50 p-2 rounded mb-2 border border-gray-100">
                                  {report.analysisData.summary}
                                </p>
                              )}
                              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                                <table className="w-full text-left text-xs">
                                  <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                                    <tr>
                                      <th className="p-2">Parameter</th>
                                      <th className="p-2">Observed Value</th>
                                      <th className="p-2">Reference Range</th>
                                      <th className="p-2">Flag</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100">
                                    {report.analysisData.parameters.map((p, idx) => (
                                      <tr key={idx} className={p.indicator === 'critical' ? 'bg-red-50/50' : p.isAbnormal ? 'bg-amber-50/40' : ''}>
                                        <td className="p-2 font-medium text-gray-900">{p.parameter}</td>
                                        <td className="p-2 font-mono font-bold text-gray-800">
                                          {p.value} <span className="text-[10px] text-gray-500 font-normal">{p.unit}</span>
                                        </td>
                                        <td className="p-2 text-gray-600 font-mono">{p.referenceRange}</td>
                                        <td className="p-2">
                                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                                            p.indicator === 'critical'
                                              ? 'bg-red-600 text-white'
                                              : p.indicator === 'high' || p.indicator === 'low'
                                              ? 'bg-amber-100 text-amber-800'
                                              : 'bg-green-100 text-green-800'
                                          }`}>
                                            {p.indicator}
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-gray-500 italic">Report file attached. Ready for review.</p>
                          )}
                        </div>
                      ) : (
                        /* Inline Report Upload Box */
                        <div className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center bg-gray-50/50 hover:bg-gray-50 transition-colors">
                          <input
                            type="file"
                            accept=".pdf,.png,.jpg,.jpeg"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleInlineUpload(booking, file)
                            }}
                            disabled={uploadingBookingId === booking.id}
                            className="hidden"
                            id={`file-upload-${booking.id}`}
                          />
                          <label
                            htmlFor={`file-upload-${booking.id}`}
                            className="cursor-pointer flex flex-col items-center justify-center space-y-2"
                          >
                            <div className="w-10 h-10 rounded-full bg-blue/10 flex items-center justify-center text-blue">
                              {uploadingBookingId === booking.id ? (
                                <div className="w-5 h-5 border-2 border-blue border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                              )}
                            </div>
                            <p className="text-sm font-semibold text-gray-800">
                              {uploadingBookingId === booking.id ? 'Uploading & Analyzing...' : 'Click to Upload Report for this Booking'}
                            </p>
                            <p className="text-xs text-gray-400">PDF, PNG, JPG supported (up to 25MB). Auto-extracts test values & metadata.</p>
                          </label>
                        </div>
                      )}
                    </div>

                    {/* 4. PATIENT CONTACT & DETAILS */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs border-t border-gray-200">
                      <div className="flex items-center gap-3">
                        <a
                          href={`tel:${booking.patientPhone}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 font-semibold rounded-lg transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          Call {booking.patientPhone}
                        </a>
                        <a
                          href={`https://wa.me/${booking.patientPhone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold rounded-lg transition-colors"
                        >
                          WhatsApp
                        </a>
                        {booking.patientAddress && (
                          <span className="text-gray-500">📍 {booking.patientAddress}</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/bookings/${booking.id}`}
                          className="text-blue hover:underline font-semibold"
                        >
                          Full Details Page &rarr;
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {total > limit && (
        <div className="flex items-center justify-between pt-4">
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
