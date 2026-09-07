'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface Patient {
  id: string
  name: string
  phone: string
  age: number | null
  ageAtRegistration: number | null
  gender: string | null
  email: string | null
  verifiedEmail: string | null
  emailVerifiedAt: string | null
  address: string | null
  createdAt: string
  bookings: {
    id: string
    bookingId: string
    patientName: string
    status: string
    totalAmount: number
    collectionType: string
    isNightBooking: boolean
    createdAt: string
    items: { testName: string; testPrice: number }[]
  }[]
  reports: {
    id: string
    testName: string
    status: string
    reportDate: string
    fileName: string
  }[]
}

export default function AdminPatientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const patientId = params.id as string
  const [patient, setPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(true)
  const [showEmailCorrection, setShowEmailCorrection] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [emailMsg, setEmailMsg] = useState('')
  const [emailError, setEmailError] = useState('')

  useEffect(() => {
    if (!patientId) return
    fetchPatient()
  }, [patientId])

  const fetchPatient = async () => {
    try {
      const res = await fetch(`/api/admin/patients/${patientId}`)
      if (res.ok) {
        const data = await res.json()
        setPatient(data.patient)
      }
    } catch { /* ignore */ }
    setLoading(false)
  }

  const handleEmailCorrection = async () => {
    setEmailError('')
    setEmailMsg('')
    try {
      const res = await fetch(`/api/admin/patients/${patientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'correct_email', newEmail })
      })
      const data = await res.json()
      if (!res.ok) { setEmailError(data.error || 'Failed'); return }
      setShowEmailCorrection(false)
      setNewEmail('')
      fetchPatient()
    } catch { setEmailError('Network error') }
  }

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'requested': return 'bg-amber-50 text-amber-700'
      case 'confirmed': return 'bg-blue-50 text-blue-700'
      case 'sample_collected': return 'bg-purple-50 text-purple-700'
      case 'processing': return 'bg-indigo-50 text-indigo-700'
      case 'report_ready': case 'ready': return 'bg-green-50 text-green-700'
      case 'completed': return 'bg-green-50 text-green-700'
      default: return 'bg-gray-50 text-gray-700'
    }
  }

  const formatStatus = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-3 border-blue border-t-transparent rounded-full animate-spin" /></div>
  }

  if (!patient) {
    return <div className="text-center py-12"><p className="text-gray-500">Patient not found</p></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700 mb-2">&larr; Back</button>
          <h1 className="text-2xl font-bold text-gray-900">{patient.name}</h1>
          <p className="text-sm text-gray-500">{patient.phone}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h3 className="font-semibold text-gray-900">Patient Info</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-500">Name</p>
                <p className="font-medium">{patient.name}</p>
              </div>
              <div>
                <p className="text-gray-500">Phone</p>
                <p className="font-medium">{patient.phone}</p>
              </div>
              {(patient.age || patient.gender) && (
                <div className="flex gap-4">
                  {patient.age && (
                    <div>
                      <p className="text-gray-500">Age</p>
                      <p className="font-medium">{patient.age} yrs</p>
                    </div>
                  )}
                  {patient.gender && (
                    <div>
                      <p className="text-gray-500">Gender</p>
                      <p className="font-medium capitalize">{patient.gender}</p>
                    </div>
                  )}
                </div>
              )}
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-gray-500">Verified Email</p>
                  <button onClick={() => { setShowEmailCorrection(true); setNewEmail(patient.verifiedEmail || patient.email || ''); setEmailError(''); setEmailMsg('') }} className="text-xs text-blue font-medium hover:underline">Correct</button>
                </div>
                <p className="font-medium">{patient.verifiedEmail || patient.email || 'Not verified'}</p>
                {patient.emailVerifiedAt && <p className="text-xs text-gray-400">Verified: {new Date(patient.emailVerifiedAt).toLocaleDateString()}</p>}
              </div>
              {patient.address && (
                <div>
                  <p className="text-gray-500">Address</p>
                  <p className="font-medium">{patient.address}</p>
                </div>
              )}
              <div>
                <p className="text-gray-500">Registered</p>
                <p className="font-medium">{new Date(patient.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Bookings ({patient.bookings.length})</h3>
            {patient.bookings.length === 0 ? (
              <p className="text-sm text-gray-500">No bookings yet.</p>
            ) : (
              <div className="space-y-3">
                {patient.bookings.map((b) => (
                  <Link key={b.id} href={`/admin/bookings/${b.id}`} className="block p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-mono text-sm font-bold text-gray-900">{b.bookingId}</p>
                        <p className="text-xs text-gray-500">{b.items.map(i => i.testName).join(', ')}</p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${getStatusColor(b.status)}`}>{formatStatus(b.status)}</span>
                        <p className="text-sm font-bold text-gray-900 mt-1">₹{b.totalAmount}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Reports ({patient.reports.length})</h3>
            {patient.reports.length === 0 ? (
              <p className="text-sm text-gray-500">No reports yet.</p>
            ) : (
              <div className="space-y-3">
                {patient.reports.map((r) => (
                  <div key={r.id} className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
                    <div>
                      <p className="font-medium text-sm text-gray-900">{r.testName}</p>
                      <p className="text-xs text-gray-500">{new Date(r.reportDate).toLocaleDateString()}</p>
                    </div>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${getStatusColor(r.status)}`}>{formatStatus(r.status)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showEmailCorrection && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="font-semibold text-gray-900 mb-4">Correct Patient Email</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Email</label>
                <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue" />
              </div>
              {emailError && <p className="text-sm text-red-600">{emailError}</p>}
              {emailMsg && <p className="text-sm text-green-600">{emailMsg}</p>}
              <div className="flex gap-2">
                <button onClick={handleEmailCorrection} className="px-4 py-2 bg-blue text-white text-sm font-medium rounded-lg hover:bg-blue-dark">Update Email</button>
                <button onClick={() => setShowEmailCorrection(false)} className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
