'use client'

import { useState, useEffect } from 'react'

interface DoctorItem {
  _id: string
  name: string
  specialization?: string
  clinicHospital?: string
  phone: string
  email?: string
  referralCode: string
  commissionPercent?: number
  totalReferrals: number
  status: string
}

export default function AdminDoctorsPage() {
  const [doctors, setDoctors] = useState<DoctorItem[]>([])
  const [loading, setLoading] = useState(true)

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [specInput, setSpecInput] = useState('General Physician')
  const [clinicInput, setClinicInput] = useState('')
  const [phoneInput, setPhoneInput] = useState('')
  const [emailInput, setEmailInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchDoctors()
  }, [])

  const fetchDoctors = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/doctors')
      const data = await res.json()
      setDoctors(data.doctors || [])
    } catch (err) {
      console.error('Fetch doctors error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const res = await fetch('/api/admin/doctors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nameInput,
          specialization: specInput,
          clinicHospital: clinicInput,
          phone: phoneInput,
          email: emailInput,
        })
      })

      if (!res.ok) throw new Error('Failed to register doctor')
      setIsModalOpen(false)
      setNameInput('')
      setPhoneInput('')
      fetchDoctors()
    } catch (err) {
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* ═══ HEADER ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--navy)]" style={{ fontFamily: 'var(--font-jakarta)' }}>
            Referring Doctors & Medical Network
          </h1>
          <p className="text-sm text-[var(--gray-500)] mt-1">
            Manage referring physicians, unique referral codes, clinical communications, and patient referrals.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--blue)] hover:bg-[var(--navy)] text-white text-xs sm:text-sm font-bold shadow-md transition-all"
        >
          <span>+ Register Referring Doctor</span>
        </button>
      </div>

      {/* ═══ TABLE ═══ */}
      <div className="bg-white rounded-2xl border border-[var(--gray-200)] overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-sm text-[var(--gray-500)] animate-pulse">
            Loading referring doctors...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--gray-50)] text-xs uppercase text-[var(--gray-500)] tracking-wider border-b border-[var(--gray-200)]">
                <tr>
                  <th className="px-5 py-3.5">Doctor Name</th>
                  <th className="px-5 py-3.5">Specialization / Clinic</th>
                  <th className="px-5 py-3.5">Contact Details</th>
                  <th className="px-5 py-3.5">Referral Code</th>
                  <th className="px-5 py-3.5">Total Referrals</th>
                  <th className="px-5 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--gray-100)]">
                {doctors.map((doc) => (
                  <tr key={doc._id} className="hover:bg-[var(--gray-50)]/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-bold text-[var(--navy)]">{doc.name}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-medium text-slate-800">{doc.specialization}</div>
                      <div className="text-xs text-slate-500">{doc.clinicHospital || 'Private Practice'}</div>
                    </td>
                    <td className="px-5 py-4 text-xs">
                      <div className="font-semibold text-slate-800">{doc.phone}</div>
                      <div className="text-slate-500">{doc.email || 'N/A'}</div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200">
                        {doc.referralCode}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-bold text-sm text-[var(--navy)]">{doc.totalReferrals || 0} patients</div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {doc.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ═══ MODAL: REGISTER DOCTOR ═══ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-[var(--navy)] mb-1">Register Referring Doctor</h3>
            <p className="text-xs text-[var(--gray-500)] mb-4">Issue referral tracking code for clinical partners</p>

            <form onSubmit={handleAddDoctor} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[var(--navy)] mb-1">Doctor Name *</label>
                <input
                  type="text"
                  required
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="e.g. Dr. K. K. Agarwal, MD"
                  className="w-full px-3 py-2 rounded-xl border border-[var(--gray-200)] text-xs outline-none focus:border-[var(--blue)]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--navy)] mb-1">Specialization</label>
                <input
                  type="text"
                  value={specInput}
                  onChange={(e) => setSpecInput(e.target.value)}
                  placeholder="e.g. Cardiologist, Diabetologist..."
                  className="w-full px-3 py-2 rounded-xl border border-[var(--gray-200)] text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--navy)] mb-1">Clinic / Hospital Attachment</label>
                <input
                  type="text"
                  value={clinicInput}
                  onChange={(e) => setClinicInput(e.target.value)}
                  placeholder="e.g. City Multi-Speciality Hospital"
                  className="w-full px-3 py-2 rounded-xl border border-[var(--gray-200)] text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[var(--navy)] mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="+91 98..."
                    className="w-full px-3 py-2 rounded-xl border border-[var(--gray-200)] text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--navy)] mb-1">Email</label>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--gray-200)] text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[var(--gray-600)] hover:bg-[var(--gray-100)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[var(--blue)] text-white text-xs font-bold hover:bg-[var(--navy)]"
                >
                  {isSubmitting ? 'Registering...' : 'Register Doctor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
