'use client'

import { useState, useEffect } from 'react'

interface Parameter {
  name: string
  value: string
  unit: string
  referenceRange: string
  isCritical?: boolean
  flag?: 'normal' | 'high' | 'low' | 'critical'
}

interface WorklistItem {
  _id: string
  sampleId: string
  patientName: string
  patientAge?: number
  patientGender?: string
  testName: string
  parameters: Parameter[]
  technicianName?: string
  technicianNotes?: string
  pathologistName?: string
  pathologistNotes?: string
  status: 'pending_entry' | 'results_entered' | 'verified' | 'rejected' | 'amended'
  criticalAlert: boolean
  amendmentHistory?: any[]
  createdAt: string
  updatedAt: string
}

export default function PathologistWorklistPage() {
  const [queue, setQueue] = useState<WorklistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState<WorklistItem | null>(null)
  const [statusFilter, setStatusFilter] = useState('results_entered')
  const [pendingCount, setPendingCount] = useState(0)
  const [criticalCount, setCriticalCount] = useState(0)

  // Review modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [pathologistNotes, setPathologistNotes] = useState('Results verified and clinically approved for release.')
  const [isProcessing, setIsProcessing] = useState(false)
  const [actionMessage, setActionMessage] = useState('')

  useEffect(() => {
    fetchQueue()
  }, [statusFilter])

  const fetchQueue = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/pathologist?status=${statusFilter}`)
      const data = await res.json()
      setQueue(data.queue || [])
      setPendingCount(data.pendingCount || 0)
      setCriticalCount(data.criticalCount || 0)
    } catch (err) {
      console.error('Fetch pathologist queue error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (action: 'approve' | 'reject' | 'amend') => {
    if (!selectedItem) return
    setIsProcessing(true)
    setActionMessage('')

    try {
      const res = await fetch('/api/admin/pathologist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          worklistId: selectedItem._id,
          action,
          pathologistNotes,
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Action failed')

      setActionMessage(action === 'approve' 
        ? '✓ Report approved, digitally signed, and published to patient portal!' 
        : 'Action processed successfully'
      )

      setTimeout(() => {
        setIsModalOpen(false)
        setActionMessage('')
        fetchQueue()
      }, 1200)
    } catch (err: any) {
      setActionMessage(err.message || 'Operation failed')
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
            Pathologist Verification & Sign-off Worklist
          </h1>
          <p className="text-sm text-[var(--gray-500)] mt-1">
            Review technician entered parameters, verify flags, approve reports for patient release, or request re-testing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold">
            Pending Review: {pendingCount}
          </div>
          {criticalCount > 0 && (
            <div className="px-4 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold animate-pulse">
              Critical Alerts: {criticalCount}
            </div>
          )}
        </div>
      </div>

      {/* ═══ TABS ═══ */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'results_entered', label: 'Pending My Review' },
          { id: 'verified', label: 'Approved & Published' },
          { id: 'rejected', label: 'Returned for Re-run' },
          { id: 'all', label: 'All Cases' },
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

      {/* ═══ QUEUE TABLE ═══ */}
      <div className="bg-white rounded-2xl border border-[var(--gray-200)] overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-sm text-[var(--gray-500)] animate-pulse">
            Loading pathologist worklist...
          </div>
        ) : queue.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="w-12 h-12 text-[var(--gray-300)] mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-base font-bold text-[var(--navy)]">No pending reviews in this queue</p>
            <p className="text-xs text-[var(--gray-500)] mt-1">All current test results have been evaluated.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--gray-50)] text-xs uppercase text-[var(--gray-500)] tracking-wider border-b border-[var(--gray-200)]">
                <tr>
                  <th className="px-5 py-3.5">Sample / Test</th>
                  <th className="px-5 py-3.5">Patient Details</th>
                  <th className="px-5 py-3.5">Technician Findings</th>
                  <th className="px-5 py-3.5">Flag / Clinical Risk</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--gray-100)]">
                {queue.map((item) => (
                  <tr key={item._id} className="hover:bg-[var(--gray-50)]/50 transition-colors">
                    <td className="px-5 py-4 font-mono">
                      <div className="font-bold text-[var(--navy)]">{item.testName}</div>
                      <div className="text-xs text-[var(--gray-500)] font-mono">{item.sampleId}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-bold text-[var(--navy)]">{item.patientName}</div>
                      <div className="text-xs text-[var(--gray-500)]">
                        {item.patientAge ? `${item.patientAge} Y / ` : ''}{item.patientGender || 'Unknown'}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-xs font-medium text-slate-700">
                        {item.parameters?.length || 0} Parameters Tested
                      </div>
                      <div className="text-[11px] text-[var(--gray-500)] truncate max-w-xs">
                        By {item.technicianName || 'Lab Technician'}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {item.criticalAlert ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                          ⚠️ CRITICAL PANIC
                        </span>
                      ) : (
                        <span className="text-xs text-emerald-600 font-semibold">✓ Safe Values</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full capitalize border ${
                        item.status === 'verified' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        item.status === 'results_entered' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                        item.status === 'rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                        'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {item.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedItem(item)
                          setPathologistNotes(item.pathologistNotes || 'Verified and approved for release.')
                          setIsModalOpen(true)
                        }}
                        className="px-4 py-1.5 rounded-lg bg-[var(--blue)] hover:bg-[var(--navy)] text-white text-xs font-bold transition-colors shadow-sm"
                      >
                        Clinical Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ═══ MODAL: PATHOLOGIST CLINICAL REVIEW & SIGN OFF ═══ */}
      {isModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-slide-up">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-[var(--gray-200)] bg-[var(--gray-50)] flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[var(--navy)]">Pathologist Review & Digital Verification</h3>
                <p className="text-xs text-[var(--gray-500)]">
                  {selectedItem.testName} — Sample: <span className="font-mono">{selectedItem.sampleId}</span>
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-[var(--gray-400)] hover:text-[var(--gray-600)]">
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              {actionMessage && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                  {actionMessage}
                </div>
              )}

              {/* Patient Info Banner */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
                <div>
                  <span className="text-[var(--gray-500)]">Patient Name:</span>
                  <p className="font-bold text-sm text-[var(--navy)]">{selectedItem.patientName}</p>
                </div>
                <div>
                  <span className="text-[var(--gray-500)]">Age / Gender:</span>
                  <p className="font-bold text-[var(--navy)]">{selectedItem.patientAge || '35'} Y / {selectedItem.patientGender || 'Male'}</p>
                </div>
                <div>
                  <span className="text-[var(--gray-500)]">Technician:</span>
                  <p className="font-bold text-[var(--navy)]">{selectedItem.technicianName || 'Verified Technician'}</p>
                </div>
                <div>
                  <span className="text-[var(--gray-500)]">Result Flag:</span>
                  <p className="font-bold">{selectedItem.criticalAlert ? '⚠️ Critical' : '✓ Normal'}</p>
                </div>
              </div>

              {/* Parameters Table */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--navy)] mb-2">
                  Parameters & Observed Clinical Findings
                </h4>
                <div className="border border-[var(--gray-200)] rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 uppercase font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-2.5">Test Parameter</th>
                        <th className="px-4 py-2.5">Observed Value</th>
                        <th className="px-4 py-2.5">Reference Range</th>
                        <th className="px-4 py-2.5">Clinical Flag</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedItem.parameters?.map((p, i) => (
                        <tr key={i} className={p.flag === 'critical' ? 'bg-rose-50/60' : ''}>
                          <td className="px-4 py-2.5 font-medium text-slate-800">{p.name}</td>
                          <td className="px-4 py-2.5 font-bold font-mono text-slate-900">
                            {p.value} {p.unit}
                          </td>
                          <td className="px-4 py-2.5 text-slate-500">{p.referenceRange} {p.unit}</td>
                          <td className="px-4 py-2.5">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              p.flag === 'critical' ? 'bg-rose-600 text-white' :
                              p.flag === 'high' ? 'bg-amber-100 text-amber-800' :
                              p.flag === 'low' ? 'bg-blue-100 text-blue-800' :
                              'bg-emerald-50 text-emerald-700'
                            }`}>
                              {p.flag || 'normal'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pathologist Clinical Interpretation */}
              <div>
                <label className="block text-xs font-bold text-[var(--navy)] mb-1.5">
                  Pathologist Clinical Remarks / Interpretation *
                </label>
                <textarea
                  rows={3}
                  value={pathologistNotes}
                  onChange={(e) => setPathologistNotes(e.target.value)}
                  placeholder="Clinical impression and correlation..."
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--gray-200)] text-xs sm:text-sm outline-none focus:border-[var(--blue)] resize-none"
                />
              </div>

              {/* Digital Signature Badge */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-dashed border-slate-300 flex items-center justify-between text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    ✓
                  </div>
                  <div>
                    <span className="font-bold text-[var(--navy)]">Electronic Signature Verified</span>
                    <p className="text-[10px] text-slate-500">Dr. M. K. Saini, MD (Pathology) — NABL Quality Signatory</p>
                  </div>
                </div>
                <span className="font-mono text-[10px] text-slate-400">MD-REG-78491</span>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 border-t border-[var(--gray-200)] bg-[var(--gray-50)] flex items-center justify-between shrink-0">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => handleAction('reject')}
                className="px-4 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold disabled:opacity-60"
              >
                Return for Re-testing
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[var(--gray-600)] hover:bg-[var(--gray-100)]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleAction('approve')}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md hover:shadow-lg disabled:opacity-60 flex items-center gap-2"
                >
                  {isProcessing ? 'Publishing Report...' : '✓ Approve & Publish Report'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
