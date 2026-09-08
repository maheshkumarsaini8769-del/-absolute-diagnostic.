'use client'

import { useState, useEffect } from 'react'

interface Sample {
  _id: string
  sampleId: string
  bookingId?: string
  patientId?: string
  patientName: string
  patientPhone: string
  status: string
  barcode?: string
  tests: string[]
  source?: string
  collectedAt?: string
  receivedAt?: string
  processedAt?: string
  createdAt: string
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  booked: { label: 'Booked', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  collection_assigned: { label: 'Phlebotomist Assigned', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  collected: { label: 'Sample Collected', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  received: { label: 'Received in Lab', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  processing: { label: 'Testing / Processing', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  report_under_review: { label: 'Pathologist Review', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  report_ready: { label: 'Report Ready', color: 'bg-teal-50 text-teal-700 border-teal-200' },
  completed: { label: 'Completed', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rejected: { label: 'Sample Rejected', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  recollection_requested: { label: 'Recollection Required', color: 'bg-red-50 text-red-700 border-red-200' },
}

export default function AdminSamplesPage() {
  const [samples, setSamples] = useState<Sample[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedSample, setSelectedSample] = useState<Sample | null>(null)
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false)
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false)
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false)
  
  // Status update form
  const [newStatus, setNewStatus] = useState('')
  const [updateNotes, setUpdateNotes] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [actionMessage, setActionMessage] = useState('')
  const [rejectReason, setRejectReason] = useState('Hemolyzed sample')

  useEffect(() => {
    fetchSamples()
  }, [statusFilter])

  const fetchSamples = async () => {
    setLoading(true)
    try {
      const url = statusFilter === 'all' 
        ? `/api/admin/samples` 
        : `/api/admin/samples?status=${statusFilter}`
      const res = await fetch(url)
      const data = await res.json()
      setSamples(data.samples || [])
    } catch (err) {
      console.error('Fetch samples error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (statusToSet?: string, customNotes?: string) => {
    if (!selectedSample) return
    const status = statusToSet || newStatus
    if (!status) return

    setIsUpdating(true)
    setActionMessage('')
    try {
      const res = await fetch(`/api/admin/samples/${selectedSample._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          notes: customNotes || updateNotes || `Status updated to ${status}`
        })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update sample status')
      }

      setActionMessage('Status updated successfully!')
      setTimeout(() => {
        setIsUpdateModalOpen(false)
        setIsRejectModalOpen(false)
        setActionMessage('')
        fetchSamples()
      }, 900)
    } catch (err: any) {
      setActionMessage(err.message || 'Error updating status')
    } finally {
      setIsUpdating(false)
    }
  }

  const filteredSamples = samples.filter((s) => {
    const q = search.toLowerCase()
    return (
      s.sampleId.toLowerCase().includes(q) ||
      s.patientName.toLowerCase().includes(q) ||
      s.patientPhone.includes(q) ||
      (s.barcode && s.barcode.toLowerCase().includes(q))
    )
  })

  // Counts
  const stats = {
    total: samples.length,
    received: samples.filter(s => s.status === 'received').length,
    processing: samples.filter(s => s.status === 'processing').length,
    collected: samples.filter(s => s.status === 'collected').length,
    rejected: samples.filter(s => s.status === 'rejected' || s.status === 'recollection_requested').length,
    completed: samples.filter(s => s.status === 'completed' || s.status === 'report_ready').length,
  }

  return (
    <div className="space-y-6">
      {/* ═══ HEADER ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--navy)]" style={{ fontFamily: 'var(--font-jakarta)' }}>
            Sample Accession & Lifecycle Tracking
          </h1>
          <p className="text-sm text-[var(--gray-500)] mt-1">
            Track test tube barcodes, accession laboratory receiving, manage sample rejection and recollection workflows.
          </p>
        </div>
      </div>

      {/* ═══ STATS CARDS ═══ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white border border-[var(--gray-200)] shadow-sm">
          <p className="text-xs font-semibold text-[var(--gray-500)]">Total Tracked</p>
          <p className="text-2xl font-bold text-[var(--navy)] mt-1">{stats.total}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-indigo-100 shadow-sm">
          <p className="text-xs font-semibold text-indigo-600">Collected</p>
          <p className="text-2xl font-bold text-indigo-700 mt-1">{stats.collected}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-blue-100 shadow-sm">
          <p className="text-xs font-semibold text-blue-600">Received at Lab</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">{stats.received}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-purple-100 shadow-sm">
          <p className="text-xs font-semibold text-purple-600">In Processing</p>
          <p className="text-2xl font-bold text-purple-700 mt-1">{stats.processing}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-rose-100 shadow-sm">
          <p className="text-xs font-semibold text-rose-600">Rejected / Redo</p>
          <p className="text-2xl font-bold text-rose-700 mt-1">{stats.rejected}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-emerald-100 shadow-sm">
          <p className="text-xs font-semibold text-emerald-600">Ready / Done</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{stats.completed}</p>
        </div>
      </div>

      {/* ═══ FILTERS & SEARCH ═══ */}
      <div className="p-4 rounded-2xl bg-white border border-[var(--gray-200)] flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="w-full sm:w-80">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Sample ID, Barcode, Patient, Phone..."
            className="w-full px-4 py-2.5 rounded-xl border border-[var(--gray-200)] text-sm focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/20 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <span className="text-xs font-bold text-[var(--gray-500)] shrink-0">Status:</span>
          {['all', 'received', 'processing', 'collected', 'rejected', 'completed'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors shrink-0 ${
                statusFilter === st
                  ? 'bg-[var(--navy)] text-white'
                  : 'bg-[var(--gray-100)] text-[var(--gray-600)] hover:bg-[var(--gray-200)]'
              }`}
            >
              {st === 'all' ? 'All Samples' : st}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ SAMPLES TABLE ═══ */}
      <div className="bg-white rounded-2xl border border-[var(--gray-200)] overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-sm text-[var(--gray-500)] animate-pulse">
            Loading accession worklist...
          </div>
        ) : filteredSamples.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="w-12 h-12 text-[var(--gray-300)] mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            <p className="text-base font-bold text-[var(--navy)]">No samples found</p>
            <p className="text-xs text-[var(--gray-500)] mt-1">Samples are automatically generated when bookings are created.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--gray-50)] text-xs uppercase text-[var(--gray-500)] tracking-wider border-b border-[var(--gray-200)]">
                <tr>
                  <th className="px-5 py-3.5">Sample ID / Barcode</th>
                  <th className="px-5 py-3.5">Patient Details</th>
                  <th className="px-5 py-3.5">Test Parameters</th>
                  <th className="px-5 py-3.5">Lifecycle Status</th>
                  <th className="px-5 py-3.5">Timestamps</th>
                  <th className="px-5 py-3.5 text-right">Accession Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--gray-100)]">
                {filteredSamples.map((s) => {
                  const statusInfo = STATUS_LABELS[s.status] || { label: s.status, color: 'bg-gray-100 text-gray-700' }
                  return (
                    <tr key={s._id} className="hover:bg-[var(--gray-50)]/50 transition-colors">
                      <td className="px-5 py-4 font-mono">
                        <div className="font-bold text-[var(--navy)]">{s.sampleId}</div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                            {s.barcode || `BC-${s.sampleId.slice(-6)}`}
                          </span>
                          <button
                            onClick={() => {
                              setSelectedSample(s)
                              setIsBarcodeModalOpen(true)
                            }}
                            title="View / Print Barcode Label"
                            className="text-xs text-[var(--blue)] hover:underline"
                          >
                            Barcode
                          </button>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-bold text-[var(--navy)]">{s.patientName}</div>
                        <div className="text-xs text-[var(--gray-500)]">{s.patientPhone}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {s.tests && s.tests.length > 0 ? (
                            s.tests.map((t, i) => (
                              <span key={i} className="text-xs px-2 py-0.5 rounded bg-[var(--gray-100)] text-[var(--navy)] font-medium">
                                {t}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-[var(--gray-400)]">Standard Diagnostic Panel</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full border ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-[var(--gray-500)] space-y-0.5">
                        {s.collectedAt && <div>Collected: {new Date(s.collectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>}
                        {s.receivedAt && <div className="text-blue-600">Lab Recv: {new Date(s.receivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>}
                        {!s.collectedAt && !s.receivedAt && <div>Created: {new Date(s.createdAt).toLocaleDateString()}</div>}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {s.status === 'collected' && (
                            <button
                              onClick={() => {
                                setSelectedSample(s)
                                handleUpdateStatus('received', 'Accessioned at laboratory reception')
                              }}
                              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-sm"
                            >
                              Receive
                            </button>
                          )}
                          {s.status === 'received' && (
                            <button
                              onClick={() => {
                                setSelectedSample(s)
                                handleUpdateStatus('processing', 'Passed sample checks, loaded onto analyzer')
                              }}
                              className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-colors shadow-sm"
                            >
                              Process
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setSelectedSample(s)
                              setNewStatus(s.status)
                              setIsUpdateModalOpen(true)
                            }}
                            className="px-3 py-1.5 rounded-lg border border-[var(--gray-200)] text-[var(--navy)] hover:bg-[var(--gray-100)] text-xs font-bold transition-colors"
                          >
                            Update
                          </button>
                          <button
                            onClick={() => {
                              setSelectedSample(s)
                              setIsRejectModalOpen(true)
                            }}
                            className="px-2.5 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors"
                            title="Reject Sample"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ═══ MODAL: UPDATE STATUS ═══ */}
      {isUpdateModalOpen && selectedSample && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-[var(--navy)] mb-1">Update Lifecycle Status</h3>
            <p className="text-xs text-[var(--gray-500)] mb-4">Sample {selectedSample.sampleId} ({selectedSample.patientName})</p>

            {actionMessage && (
              <div className="mb-4 p-3 rounded-xl bg-blue-50 text-blue-700 text-xs font-semibold">
                {actionMessage}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--navy)] mb-1.5">New Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--gray-200)] text-sm outline-none focus:border-[var(--blue)]"
                >
                  <option value="booked">Booked</option>
                  <option value="collection_assigned">Phlebotomist Assigned</option>
                  <option value="collected">Collected</option>
                  <option value="received">Received in Lab</option>
                  <option value="processing">Processing / Testing</option>
                  <option value="report_under_review">Report Under Review</option>
                  <option value="report_ready">Report Ready</option>
                  <option value="completed">Completed</option>
                  <option value="recollection_requested">Recollection Requested</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--navy)] mb-1.5">Accession Notes / Remarks</label>
                <textarea
                  rows={3}
                  value={updateNotes}
                  onChange={(e) => setUpdateNotes(e.target.value)}
                  placeholder="e.g., EDTA tube received in good condition, 3ml volume..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--gray-200)] text-sm outline-none focus:border-[var(--blue)] resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUpdateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[var(--gray-600)] hover:bg-[var(--gray-100)]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => handleUpdateStatus()}
                  className="px-5 py-2 rounded-xl bg-[var(--blue)] text-white text-xs font-bold hover:bg-[var(--navy)] disabled:opacity-60"
                >
                  {isUpdating ? 'Updating...' : 'Confirm Update'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL: REJECT SAMPLE ═══ */}
      {isRejectModalOpen && selectedSample && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 border-l-4 border-rose-500">
            <h3 className="text-lg font-bold text-rose-700 mb-1">Reject Sample & Trigger Recollection</h3>
            <p className="text-xs text-[var(--gray-500)] mb-4">
              Rejecting will mark sample {selectedSample.sampleId} and alert collection team for recollection.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--navy)] mb-1.5">Reason for Rejection *</label>
                <select
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--gray-200)] text-sm outline-none focus:border-rose-500"
                >
                  <option value="Hemolyzed sample (RBC rupture)">Hemolyzed sample (RBC rupture)</option>
                  <option value="Clotted blood sample">Clotted blood sample</option>
                  <option value="Quantity Not Sufficient (QNS)">Quantity Not Sufficient (QNS)</option>
                  <option value="Inappropriate collection tube / anticoagulant">Inappropriate collection tube</option>
                  <option value="Sample container leaked / broken in transit">Container leaked or broken</option>
                  <option value="Cold chain / temperature compromised">Temperature compromised</option>
                  <option value="Mislabeled or barcode damaged">Mislabeled or damaged label</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRejectModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[var(--gray-600)] hover:bg-[var(--gray-100)]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => handleUpdateStatus('rejected', `Sample rejected: ${rejectReason}`)}
                  className="px-5 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 disabled:opacity-60"
                >
                  {isUpdating ? 'Processing...' : 'Confirm Rejection'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL: BARCODE / QR PRINT VIEW ═══ */}
      {isBarcodeModalOpen && selectedSample && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <h3 className="text-base font-bold text-[var(--navy)] mb-1">Laboratory Sample Label</h3>
            <p className="text-xs text-[var(--gray-500)] mb-4">Printable tube specimen barcode</p>

            <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 inline-block w-full mb-4">
              <div className="font-bold text-xs text-[var(--navy)] uppercase tracking-wider mb-1">
                ABSOLUTE DIAGNOSTIC LAB
              </div>
              <div className="font-mono text-sm font-bold tracking-widest text-[var(--navy)]">
                {selectedSample.sampleId}
              </div>
              {/* Simulated Barcode Stripes */}
              <div className="h-10 my-2 flex items-center justify-center gap-0.5 px-4 bg-white border border-slate-200">
                {[4, 2, 6, 1, 3, 5, 2, 4, 1, 6, 3, 2, 5, 1, 4, 2, 5, 3, 1, 4, 2, 6].map((w, i) => (
                  <div key={i} className="h-7 bg-black" style={{ width: `${w}px` }} />
                ))}
              </div>
              <div className="text-xs font-semibold text-[var(--navy)]">{selectedSample.patientName}</div>
              <div className="text-[10px] text-[var(--gray-500)]">{selectedSample.tests.join(', ') || 'Diagnostic Panel'}</div>
            </div>

            <div className="flex justify-center gap-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-[var(--blue)] text-white text-xs font-bold hover:bg-[var(--navy)]"
              >
                Print Label
              </button>
              <button
                onClick={() => setIsBarcodeModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-[var(--gray-200)] text-xs font-bold text-[var(--gray-600)] hover:bg-[var(--gray-100)]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
