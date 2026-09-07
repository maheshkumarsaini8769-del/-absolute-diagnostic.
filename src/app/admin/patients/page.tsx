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
  createdAt: string
  _count: { bookings: number; reports: number }
}

interface PatientDetail extends Patient {
  bookings: PatientBooking[]
  reports: PatientReport[]
}

export default function AdminPatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedPatient, setSelectedPatient] = useState<PatientDetail | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const params = search ? `?search=${encodeURIComponent(search)}` : ''
      const res = await fetch(`/api/admin/patients${params}`)
      if (res.ok) {
        const data = await res.json()
        setPatients(data.patients || [])
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [search])

  useEffect(() => { fetchData() }, [fetchData])

  const viewPatient = async (patient: Patient) => {
    setLoadingDetail(true)
    setSelectedPatient(null)
    try {
      const res = await fetch(`/api/admin/patients/${patient.id}`)
      if (res.ok) {
        const data = await res.json()
        setSelectedPatient(data.patient)
      }
    } catch { /* ignore */ }
    setLoadingDetail(false)
  }

  const statusColors: Record<string, string> = {
    requested: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue/10 text-blue',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    uploaded: 'bg-blue/10 text-blue',
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
      <h1 className="text-xl font-bold text-gray-900">Patients</h1>

      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {patients.length === 0 ? (
          <p className="p-8 text-center text-sm text-gray-500">No patients found</p>
        ) : (
          patients.map((patient) => (
            <button
              key={patient.id}
              onClick={() => viewPatient(patient)}
              className="w-full text-left p-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-900">{patient.name}</span>
                  <p className="text-xs text-gray-500">{patient.phone}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">{patient._count.bookings} bookings</p>
                  <p className="text-xs text-gray-400">{patient._count.reports} reports</p>
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Patient Detail Modal */}
      <Modal isOpen={!!selectedPatient || loadingDetail} onClose={() => setSelectedPatient(null)} title="Patient Details" maxWidth="max-w-xl">
        {loadingDetail && (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-3 border-blue border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {selectedPatient && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">Name</span>
                <p className="font-medium">{selectedPatient.name}</p>
              </div>
              <div>
                <span className="text-gray-500">Phone</span>
                <p className="font-medium">{selectedPatient.phone}</p>
              </div>
              {selectedPatient.email && (
                <div>
                  <span className="text-gray-500">Email</span>
                  <p className="font-medium">{selectedPatient.email}</p>
                </div>
              )}
              <div>
                <span className="text-gray-500">Joined</span>
                <p className="font-medium">{new Date(selectedPatient.createdAt).toLocaleDateString('en-IN')}</p>
              </div>
            </div>

            {selectedPatient.bookings.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Bookings</h3>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {selectedPatient.bookings.map(b => (
                    <div key={b.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-xs">
                      <div>
                        <span className="font-medium">{b.bookingId}</span>
                        <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] ${statusColors[b.status] || 'bg-gray-100 text-gray-800'}`}>
                          {b.status}
                        </span>
                      </div>
                      <span>₹{b.totalAmount}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedPatient.reports.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Reports</h3>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {selectedPatient.reports.map(r => (
                    <div key={r.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-xs">
                      <span className="font-medium">{r.testName}</span>
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
