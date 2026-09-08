'use client'

import { useState, useEffect } from 'react'

interface CorporateAccount {
  _id: string
  companyName: string
  contactPerson: string
  email: string
  phone: string
  address?: string
  gstNumber?: string
  employeeCount?: number
  contractStatus: string
  packages: string[]
}

export default function AdminCorporatePage() {
  const [accounts, setAccounts] = useState<CorporateAccount[]>([])
  const [loading, setLoading] = useState(true)

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [personInput, setPersonInput] = useState('')
  const [emailInput, setEmailInput] = useState('')
  const [phoneInput, setPhoneInput] = useState('')
  const [addressInput, setAddressInput] = useState('')
  const [gstInput, setGstInput] = useState('')
  const [countInput, setCountInput] = useState('150')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchAccounts()
  }, [])

  const fetchAccounts = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/corporate')
      const data = await res.json()
      setAccounts(data.accounts || [])
    } catch (err) {
      console.error('Fetch corporate accounts error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const res = await fetch('/api/admin/corporate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: nameInput,
          contactPerson: personInput,
          email: emailInput,
          phone: phoneInput,
          address: addressInput,
          gstNumber: gstInput,
          employeeCount: countInput,
        })
      })

      if (!res.ok) throw new Error('Failed to register account')
      setIsModalOpen(false)
      setNameInput('')
      setPersonInput('')
      setPhoneInput('')
      fetchAccounts()
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
            Corporate & B2B Client Accounts
          </h1>
          <p className="text-sm text-[var(--gray-500)] mt-1">
            Manage corporate wellness contracts, on-site employee health checkup camps, and bulk diagnostic billing.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--blue)] hover:bg-[var(--navy)] text-white text-xs sm:text-sm font-bold shadow-md transition-all"
        >
          <span>+ Register Corporate Client</span>
        </button>
      </div>

      {/* ═══ CARDS ═══ */}
      {loading ? (
        <div className="p-12 text-center text-sm text-[var(--gray-500)] animate-pulse">
          Loading corporate accounts...
        </div>
      ) : accounts.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-[var(--gray-200)] shadow-sm">
          <p className="text-base font-bold text-[var(--navy)]">No corporate clients registered</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((acc) => (
            <div
              key={acc._id}
              className="p-6 rounded-3xl bg-white border border-[var(--gray-200)] shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="font-bold text-base text-[var(--navy)]">{acc.companyName}</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                    {acc.contractStatus}
                  </span>
                </div>

                <div className="text-xs text-slate-600 space-y-1.5 mb-4">
                  <div>👤 Contact: <span className="font-semibold text-[var(--navy)]">{acc.contactPerson}</span></div>
                  <div>📞 Phone: <span className="font-semibold text-slate-800">{acc.phone}</span></div>
                  <div>✉️ Email: <span className="text-slate-500">{acc.email}</span></div>
                  <div>👥 Workforce: <span className="font-bold text-[var(--navy)]">{acc.employeeCount || 0} Employees</span></div>
                  {acc.gstNumber && <div className="font-mono text-[11px] text-slate-500">GST: {acc.gstNumber}</div>}
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Assigned Wellness Panels:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {acc.packages?.map((pkg, idx) => (
                      <span key={idx} className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-medium">
                        {pkg}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 mt-4 flex items-center justify-between text-xs">
                <span className="text-[var(--gray-500)]">Pre-negotiated Corporate Tariff</span>
                <button
                  onClick={() => alert(`Bulk booking initiated for ${acc.companyName}`)}
                  className="px-3 py-1 rounded-lg bg-[var(--navy)] text-white font-bold hover:bg-[var(--blue)] transition-colors"
                >
                  Schedule Camp
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═══ MODAL: REGISTER CORPORATE ═══ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-[var(--navy)] mb-1">Register Corporate Client</h3>
            <p className="text-xs text-[var(--gray-500)] mb-4">Onboard organization for annual employee wellness checkups</p>

            <form onSubmit={handleAddAccount} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[var(--navy)] mb-1">Company / Organization Name *</label>
                <input
                  type="text"
                  required
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="e.g. Tata Consultancy Services"
                  className="w-full px-3 py-2 rounded-xl border border-[var(--gray-200)] text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[var(--navy)] mb-1">Contact Person *</label>
                  <input
                    type="text"
                    required
                    value={personInput}
                    onChange={(e) => setPersonInput(e.target.value)}
                    placeholder="HR / Medical Lead"
                    className="w-full px-3 py-2 rounded-xl border border-[var(--gray-200)] text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--navy)] mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--gray-200)] text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[var(--navy)] mb-1">Official Email</label>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--gray-200)] text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--navy)] mb-1">Employee Count</label>
                  <input
                    type="number"
                    value={countInput}
                    onChange={(e) => setCountInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--gray-200)] text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--navy)] mb-1">GST Number</label>
                <input
                  type="text"
                  value={gstInput}
                  onChange={(e) => setGstInput(e.target.value)}
                  placeholder="29AAAAA0000A1Z5"
                  className="w-full px-3 py-2 rounded-xl border border-[var(--gray-200)] text-xs font-mono"
                />
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
                  {isSubmitting ? 'Registering...' : 'Register Corporate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
