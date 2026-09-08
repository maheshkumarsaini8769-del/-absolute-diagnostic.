'use client'

import { useEffect, useState, useCallback } from 'react'
import Modal from '@/components/Modal'

interface PatientBooking {
  id: string
  bookingId: string
  status: string
  totalAmount: number
  createdAt: string
}

interface PatientReport {
  id: string
  testName: string
  status: string
  createdAt: string
}

interface Patient {
  id: string
  name: string
  phone: string
  email: string | null
  patientIdUHID?: string
  passwordStatus?: 'not_created' | 'active' | 'temporary' | 'reset_required' | 'disabled'
  isAccountDisabled?: boolean
  createdAt: string
  _count: { bookings: number; reports: number }
}

interface PatientDetail extends Patient {
  patientIdUHID?: string
  passwordStatus: 'not_created' | 'active' | 'temporary' | 'reset_required' | 'disabled'
  isPasswordTemporary?: boolean
  passwordResetRequired?: boolean
  isAccountDisabled?: boolean
  temporaryPasswordExpiresAt?: string
  bookings: PatientBooking[]
  reports: PatientReport[]
}

const passwordStatusBadges: Record<string, { label: string; color: string }> = {
  not_created: { label: 'Password Not Created', color: 'bg-gray-100 text-gray-700' },
  active: { label: 'Password Active', color: 'bg-green-100 text-green-800' },
  temporary: { label: 'Temporary Password Active', color: 'bg-amber-100 text-amber-800' },
  reset_required: { label: 'Reset Required', color: 'bg-purple-100 text-purple-800' },
  disabled: { label: 'Account Disabled', color: 'bg-red-100 text-red-800' },
}

export default function AdminPatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedPatient, setSelectedPatient] = useState<PatientDetail | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [tempPasswordResult, setTempPasswordResult] = useState<string | null>(null)
  const [actionFeedback, setActionFeedback] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/patients`)
      if (res.ok) {
        const data = await res.json()
        setPatients(data.patients || [])
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const displayedPatients = search ? patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.phone.includes(search) ||
    (p.patientIdUHID && p.patientIdUHID.toLowerCase().includes(search.toLowerCase())) ||
    (p.email && p.email.toLowerCase().includes(search.toLowerCase()))
  ) : patients

  const viewPatient = async (patient: Patient) => {
    setLoadingDetail(true)
    setSelectedPatient(null)
    setTempPasswordResult(null)
    setActionFeedback(null)
    try {
      const res = await fetch(`/api/admin/patients/${patient.id}`)
      if (res.ok) {
        const data = await res.json()
        setSelectedPatient(data.patient)
      }
    } catch { /* ignore */ }
    setLoadingDetail(false)
  }

  const handleGenerateTempPassword = async () => {
    if (!selectedPatient) return
    setActionLoading(true)
    setActionFeedback(null)
    try {
      const res = await fetch(`/api/admin/patients/${selectedPatient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate_temporary_password' }),
      })
      const data = await res.json()
      if (res.ok && data.temporaryPassword) {
        setTempPasswordResult(data.temporaryPassword)
        setSelectedPatient(prev => prev ? { ...prev, passwordStatus: 'temporary', isPasswordTemporary: true } : null)
      } else {
        setActionFeedback(data.error || 'Failed to generate temporary password')
      }
    } catch {
      setActionFeedback('Network error')
    }
    setActionLoading(false)
  }

  const handleForceReset = async () => {
    if (!selectedPatient) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/admin/patients/${selectedPatient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'force_password_reset' }),
      })
      if (res.ok) {
        setActionFeedback('Password reset forced. Patient must change password upon next login.')
        setSelectedPatient(prev => prev ? { ...prev, passwordStatus: 'reset_required', passwordResetRequired: true } : null)
      }
    } catch { /* ignore */ }
    setActionLoading(false)
  }

  const handleToggleDisabled = async () => {
    if (!selectedPatient) return
    const willDisable = !selectedPatient.isAccountDisabled
    if (!confirm(`Are you sure you want to ${willDisable ? 'DISABLE' : 'ENABLE'} this patient account?`)) return

    setActionLoading(true)
    try {
      const res = await fetch(`/api/admin/patients/${selectedPatient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_disabled' }),
      })
      const data = await res.json()
      if (res.ok) {
        setSelectedPatient(prev => prev ? {
          ...prev,
          isAccountDisabled: data.isAccountDisabled,
          passwordStatus: data.isAccountDisabled ? 'disabled' : (prev.isPasswordTemporary ? 'temporary' : 'active')
        } : null)
        setActionFeedback(`Account ${data.isAccountDisabled ? 'disabled' : 'enabled'} successfully.`)
        await fetchData()
      }
    } catch { /* ignore */ }
    setActionLoading(false)
  }

  const statusColors: Record<string, string> = {
    requested: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue/10 text-blue',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    uploaded: 'bg-blue/10 text-blue',
    under_review: 'bg-purple-100 text-purple-800',
    verified: 'bg-teal-100 text-teal-800',
    ready: 'bg-success/10 text-success',
    delivered: 'bg-green-100 text-green-800',
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
        <div>
          <h1 className="text-xl font-bold text-gray-900">Patients</h1>
          <p className="text-xs text-gray-500">Manage patient records, bookings, reports, and password authentication</p>
        </div>
      </div>

      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search by name, phone, UHID, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent bg-white shadow-sm"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 shadow-sm overflow-hidden">
        {displayedPatients.length === 0 ? (
          <p className="p-8 text-center text-sm text-gray-500">No patients found</p>
        ) : (
          displayedPatients.map((patient) => (
            <button
              key={patient.id}
              onClick={() => viewPatient(patient)}
              className="w-full text-left p-3.5 hover:bg-gray-50 transition-colors flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900">{patient.name}</span>
                  {patient.isAccountDisabled && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded-full font-bold">
                      Disabled
                    </span>
                  )}
                  {patient.patientIdUHID && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded font-mono">
                      {patient.patientIdUHID}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{patient.phone} {patient.email ? `• ${patient.email}` : ''}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium text-gray-700">{patient._count.bookings} bookings</p>
                <p className="text-xs text-gray-400">{patient._count.reports} reports</p>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Patient Detail Modal */}
      <Modal isOpen={!!selectedPatient || loadingDetail} onClose={() => { setSelectedPatient(null); setTempPasswordResult(null) }} title="Patient Details & Security" maxWidth="max-w-xl">
        {loadingDetail && (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-3 border-blue border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {selectedPatient && (
          <div className="space-y-4">
            {/* Demographics */}
            <div className="grid grid-cols-2 gap-3 text-sm bg-gray-50 p-3 rounded-xl">
              <div>
                <span className="text-xs text-gray-500">Patient Name</span>
                <p className="font-semibold text-gray-900">{selectedPatient.name}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">Registered Phone</span>
                <p className="font-semibold text-gray-900">{selectedPatient.phone}</p>
              </div>
              {selectedPatient.patientIdUHID && (
                <div>
                  <span className="text-xs text-gray-500">UHID / Patient ID</span>
                  <p className="font-mono text-xs font-semibold text-blue">{selectedPatient.patientIdUHID}</p>
                </div>
              )}
              <div>
                <span className="text-xs text-gray-500">Registered Date</span>
                <p className="font-medium text-gray-700">{new Date(selectedPatient.createdAt).toLocaleDateString('en-IN')}</p>
              </div>
            </div>

            {/* Password & Security Management (opencode/new1.md Section 8) */}
            <div className="border border-gray-200 rounded-xl p-3.5 space-y-3 bg-white">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Account Password Status</h4>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${passwordStatusBadges[selectedPatient.passwordStatus]?.color || 'bg-gray-100 text-gray-700'}`}>
                  {passwordStatusBadges[selectedPatient.passwordStatus]?.label || selectedPatient.passwordStatus}
                </span>
              </div>

              {actionFeedback && (
                <div className="p-2 bg-blue/10 text-blue text-xs rounded-lg font-medium">
                  {actionFeedback}
                </div>
              )}

              {/* Temporary Password Box */}
              {tempPasswordResult && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900">Generated Temporary Password:</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(tempPasswordResult)}
                      className="text-[11px] px-2 py-0.5 bg-white border border-amber-300 rounded text-amber-800 hover:bg-amber-100 font-medium"
                    >
                      Copy Password
                    </button>
                  </div>
                  <div className="font-mono text-base font-bold text-amber-900 tracking-wider">
                    {tempPasswordResult}
                  </div>
                  <p className="text-[11px] text-amber-700">
                    Expires in 24 hours. The patient will be required to create a new strong password on next login.
                  </p>
                </div>
              )}

              {/* Security Action Buttons */}
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <button
                  onClick={handleGenerateTempPassword}
                  disabled={actionLoading}
                  className="text-xs px-3 py-1.5 bg-blue text-white rounded-lg font-medium hover:bg-blue-dark disabled:opacity-50 transition-colors shadow-sm"
                >
                  Generate Temporary Password
                </button>

                <button
                  onClick={handleForceReset}
                  disabled={actionLoading}
                  className="text-xs px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg font-medium hover:bg-purple-100 disabled:opacity-50 transition-colors"
                >
                  Force Password Reset
                </button>

                <button
                  onClick={handleToggleDisabled}
                  disabled={actionLoading}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    selectedPatient.isAccountDisabled
                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                  }`}
                >
                  {selectedPatient.isAccountDisabled ? 'Enable Account' : 'Disable Account'}
                </button>
              </div>
            </div>

            {/* Bookings */}
            {selectedPatient.bookings.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Bookings ({selectedPatient.bookings.length})</h3>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {selectedPatient.bookings.map(b => (
                    <div key={b.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-xs">
                      <div>
                        <span className="font-medium">{b.bookingId}</span>
                        <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] ${statusColors[b.status] || 'bg-gray-100 text-gray-800'}`}>
                          {b.status}
                        </span>
                      </div>
                      <span className="font-medium">₹{b.totalAmount}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reports */}
            {selectedPatient.reports.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Diagnostic Reports ({selectedPatient.reports.length})</h3>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {selectedPatient.reports.map(r => (
                    <div key={r.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-xs">
                      <span className="font-medium text-gray-800">{r.testName}</span>
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${statusColors[r.status] || 'bg-gray-100 text-gray-800'}`}>
                        {r.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
