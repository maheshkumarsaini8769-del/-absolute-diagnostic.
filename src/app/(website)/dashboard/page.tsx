'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import HomepageAnimations from '@/components/HomepageAnimations'
import { ZenuxsAuth } from '@/components/ZenuxsAuth'

interface Booking {
  id: string
  bookingId: string
  patientName: string
  collectionType: string
  preferredDate: string | null
  status: string
  totalAmount: number
  isNightBooking: boolean
  createdAt: string
  items: { testName: string; testPrice: number }[]
}

interface Report {
  id: string
  testName: string
  reportDate: string
  status: string
  fileName: string
  bookingId: string | null
  collectionDate: string | null
}

interface HealthTrend {
  parameter: string
  value: string
  unit: string
  reference: string
  status: string
  date: string
  history: number[]
}

interface FamilyMember {
  id: string
  name: string
  relation: string
  age?: number
  gender?: string
  phone?: string
}

interface SavedAddress {
  id: string
  label: string
  address: string
  pincode?: string
}

export default function DashboardPage() {
  const authRef = useRef<any>(null)
  const [step, setStep] = useState<'choose' | 'loading' | 'dashboard'>('choose')
  const [patientName, setPatientName] = useState('')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [healthTrends, setHealthTrends] = useState<HealthTrend[]>([])
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([])
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [activeTab, setActiveTab] = useState<'bookings' | 'reports' | 'trends' | 'family' | 'addresses'>('bookings')

  // Family Modal
  const [isFamilyModalOpen, setIsFamilyModalOpen] = useState(false)
  const [fmName, setFmName] = useState('')
  const [fmRelation, setFmRelation] = useState('Spouse')
  const [fmAge, setFmAge] = useState('')
  const [fmGender, setFmGender] = useState('Female')

  // Address Modal
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)
  const [addrLabel, setAddrLabel] = useState('Home')
  const [addrText, setAddrText] = useState('')
  const [addrPincode, setAddrPincode] = useState('')

  useEffect(() => {
    checkSession()
  }, [])

  useEffect(() => {
    if (step !== 'choose') return
    import('zenuxs-oauth')
    const el = authRef.current
    if (!el) return

    const onSuccess = async (e: any) => {
      const detail = e.detail
      try {
        const res = await fetch('/api/auth/zenuxs/patient-session', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessToken: detail.access_token, redirectUrl: '/dashboard' }),
        })
        const data = await res.json()
        if (res.ok) window.location.href = data.redirectUrl || '/dashboard'
        else setErrorMsg(data.error || 'Authentication failed')
      } catch { setErrorMsg('Network error') }
    }

    const onError = (e: any) => {
      setErrorMsg(e.detail?.message || 'Authentication failed')
    }

    el.addEventListener('success', onSuccess)
    el.addEventListener('error', onError)
    return () => {
      el.removeEventListener('success', onSuccess)
      el.removeEventListener('error', onError)
    }
  }, [step])

  const checkSession = async () => {
    try {
      const res = await fetch('/api/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionCheck: true }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.bookings || data.reports) {
          setBookings(data.bookings || [])
          setReports(data.reports || [])
          setPatientName(data.patientName || '')
          setHealthTrends(data.healthTrends || [])
          setFamilyMembers(data.patient?.familyMembers || [])
          setSavedAddresses(data.patient?.savedAddresses || [])
          setStep('dashboard')
        }
      }
    } catch { /* no session */ }
  }

  const handleAddFamilyMember = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_family_member',
          name: fmName,
          relation: fmRelation,
          age: fmAge,
          gender: fmGender,
        })
      })
      const data = await res.json()
      if (res.ok) {
        setFamilyMembers(data.familyMembers || [])
        setIsFamilyModalOpen(false)
        setFmName('')
        setFmAge('')
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_address',
          label: addrLabel,
          address: addrText,
          pincode: addrPincode,
        })
      })
      const data = await res.json()
      if (res.ok) {
        setSavedAddresses(data.savedAddresses || [])
        setIsAddressModalOpen(false)
        setAddrText('')
        setAddrPincode('')
      }
    } catch (err) {
      console.error(err)
    }
  }

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'requested': return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'confirmed': return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'sample_collected': return 'bg-purple-50 text-purple-700 border-purple-200'
      case 'processing': return 'bg-indigo-50 text-indigo-700 border-indigo-200'
      case 'report_ready': case 'ready': return 'bg-green-50 text-green-700 border-green-200'
      case 'completed': return 'bg-green-50 text-green-700 border-green-200'
      default: return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const formatStatus = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

  const reset = () => {
    document.cookie = 'session_token=; Path=/; Max-Age=0'
    setStep('choose')
    setBookings([])
    setReports([])
    setPatientName('')
    setStatus('idle')
    setErrorMsg('')
  }

  return (
    <HomepageAnimations>
      <section className="relative bg-gradient-to-br from-[var(--navy)] via-[var(--navy-light)] to-[var(--navy)] overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-[var(--blue)] rounded-full blur-[160px] opacity-15" />
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-[var(--teal)] rounded-full blur-[180px] opacity-10" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <nav className="flex items-center gap-2 text-sm text-white/50 mb-6">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <span className="text-white/80">My Health Portal</span>
          </nav>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2" style={{ fontFamily: 'var(--font-jakarta)' }}>
            Patient <span className="gradient-text">Health Records</span>
          </h1>
          <p className="text-white/60 text-base max-w-xl">
            Access your diagnostic test reports, family records, upcoming sample collections, and historical health trends.
          </p>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {step === 'choose' && (
            <div className="max-w-md mx-auto">
              <div className="surface-elevated rounded-3xl p-8 border border-[var(--gray-200)] shadow-xl">
                <h2 className="text-xl font-bold text-[var(--navy)] mb-2" style={{ fontFamily: 'var(--font-jakarta)' }}>
                  Sign In to Patient Portal
                </h2>
                <p className="text-sm text-[var(--gray-500)] mb-6">
                  Sign in with Zenuxs SSO or use Walk-in OTP to access all your blood test records.
                </p>
                {errorMsg && <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-700 mb-4">{errorMsg}</div>}
                <ZenuxsAuth
                  innerRef={authRef}
                  clientId={process.env.NEXT_PUBLIC_ZENUXS_CLIENT_ID || '4874ff27aff3ed59'}
                  scope="openid profile email"
                  theme="light"
                  height="420px"
                  autoRedirect="false"
                />
                <div className="mt-6 pt-4 border-t border-[var(--gray-200)] text-center">
                  <Link href="/walk-in-reports" className="text-xs font-bold text-[var(--blue)] hover:underline">
                    Or Login with Mobile & Password (Walk-in Patients) →
                  </Link>
                </div>
              </div>
            </div>
          )}

          {step === 'dashboard' && (
            <div>
              {/* Profile Top Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 p-6 rounded-3xl bg-white border border-[var(--gray-200)] shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--navy)] to-[var(--blue)] text-white text-xl font-bold flex items-center justify-center shadow-md">
                    {patientName.charAt(0).toUpperCase() || 'P'}
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-[var(--navy)]" style={{ fontFamily: 'var(--font-jakarta)' }}>
                      {patientName ? `${patientName}` : 'My Account'}
                    </h2>
                    <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                      <span>✓ Verified Patient Account</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link href="/booking" className="px-4 py-2 rounded-xl bg-[var(--blue)] text-white text-xs font-bold hover:bg-[var(--navy)] transition-colors">
                    + Book New Test
                  </Link>
                  <button onClick={reset} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors">
                    Sign Out
                  </button>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
                {[
                  { id: 'bookings', label: `My Bookings (${bookings.length})` },
                  { id: 'reports', label: `Test Reports (${reports.length})` },
                  { id: 'trends', label: 'Health Trends & Metrics' },
                  { id: 'family', label: `Family Members (${familyMembers.length})` },
                  { id: 'addresses', label: `Saved Addresses (${savedAddresses.length})` },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id as any)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                      activeTab === t.id
                        ? 'bg-[var(--navy)] text-white shadow-sm'
                        : 'bg-white border border-[var(--gray-200)] text-[var(--gray-600)] hover:bg-[var(--gray-100)]'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* ═══ TAB: BOOKINGS ═══ */}
              {activeTab === 'bookings' && (
                <div className="space-y-3">
                  {bookings.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-3xl border border-[var(--gray-200)] shadow-sm">
                      <p className="text-sm text-[var(--gray-500)] mb-3">No active bookings found for this account.</p>
                      <Link href="/booking" className="px-5 py-2.5 rounded-xl bg-[var(--blue)] text-white text-xs font-bold hover:bg-[var(--navy)]">
                        Book Diagnostic Test
                      </Link>
                    </div>
                  ) : bookings.map((b) => (
                    <div key={b.id} className="p-5 rounded-2xl bg-white border border-[var(--gray-200)] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="font-bold text-[var(--navy)] font-mono text-sm">{b.bookingId}</span>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${getStatusColor(b.status)}`}>
                            {formatStatus(b.status)}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-800">{b.items.map(i => i.testName).join(', ')}</p>
                        <p className="text-xs text-[var(--gray-400)] mt-1">
                          Booked: {new Date(b.createdAt).toLocaleDateString()} {b.preferredDate && ` • Scheduled: ${b.preferredDate}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-[var(--navy)] text-base">₹{b.totalAmount}</span>
                        <Link href={`/booking/${b.bookingId}`} className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[var(--navy)] text-xs font-bold transition-colors">
                          Track Details
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ═══ TAB: REPORTS ═══ */}
              {activeTab === 'reports' && (
                <div className="space-y-3">
                  {reports.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-3xl border border-[var(--gray-200)] shadow-sm">
                      <p className="text-sm text-[var(--gray-500)]">No reports published yet. When test processing completes, your PDF report appears here.</p>
                    </div>
                  ) : reports.map((r) => (
                    <div key={r.id} className="p-5 rounded-2xl bg-white border border-[var(--gray-200)] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h4 className="font-bold text-sm text-[var(--navy)]">{r.testName}</h4>
                        <p className="text-xs text-[var(--gray-500)] mt-0.5">
                          {r.bookingId && `Ref: ${r.bookingId} • `}Released: {new Date(r.reportDate).toLocaleDateString()}
                        </p>
                        <span className="inline-block text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 mt-1.5">
                          ✓ Verified by Pathologist
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={`/api/reports/${r.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 rounded-xl bg-blue-50 text-[var(--blue)] hover:bg-blue-100 text-xs font-bold transition-colors"
                        >
                          View Report
                        </a>
                        <a
                          href={`/api/reports/${r.id}`}
                          download
                          className="px-4 py-2 rounded-xl bg-[var(--navy)] hover:bg-[var(--blue)] text-white text-xs font-bold transition-colors"
                        >
                          Download PDF
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ═══ TAB: HEALTH TRENDS ═══ */}
              {activeTab === 'trends' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 text-xs text-blue-800 flex items-center gap-2">
                    <span>📊</span>
                    <span>Tracking your key biomarker trends across consecutive tests to help evaluate physiological changes over time.</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {healthTrends.map((trend, idx) => (
                      <div key={idx} className="p-5 rounded-2xl bg-white border border-[var(--gray-200)] shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-[var(--navy)]">{trend.parameter}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {trend.status}
                          </span>
                        </div>
                        <div className="flex items-baseline gap-2 mb-2">
                          <span className="text-3xl font-bold font-mono text-[var(--navy)]">{trend.value}</span>
                          <span className="text-xs text-slate-500 font-medium">{trend.unit}</span>
                          <span className="text-xs text-slate-400 ml-auto">Normal: {trend.reference}</span>
                        </div>

                        {/* Mini visual trend graph */}
                        <div className="border-t border-slate-100 pt-3 mt-3">
                          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                            <span>Past Tests Trend</span>
                            <span className="text-emerald-600 font-bold">Stable Range</span>
                          </div>
                          <div className="flex items-end gap-2 h-10 pt-1">
                            {trend.history.map((val, hIdx) => {
                              const heightPct = Math.min(100, Math.max(30, (val / 250) * 100))
                              return (
                                <div key={hIdx} className="flex-1 flex flex-col items-center gap-1">
                                  <div
                                    className="w-full rounded-md bg-[var(--blue)]/80 hover:bg-[var(--blue)] transition-all"
                                    style={{ height: `${heightPct}%` }}
                                  />
                                  <span className="text-[9px] font-mono text-slate-500">{val}</span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ═══ TAB: FAMILY MEMBERS ═══ */}
              {activeTab === 'family' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-[var(--gray-500)]">Manage medical profiles for your family members under one account</p>
                    <button
                      onClick={() => setIsFamilyModalOpen(true)}
                      className="px-4 py-2 rounded-xl bg-[var(--blue)] text-white text-xs font-bold hover:bg-[var(--navy)]"
                    >
                      + Add Family Member
                    </button>
                  </div>

                  {familyMembers.length === 0 ? (
                    <div className="p-8 text-center bg-white rounded-2xl border border-[var(--gray-200)] text-xs text-slate-500">
                      No family members added yet. Add family members to easily book tests on their behalf.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {familyMembers.map((fm) => (
                        <div key={fm.id} className="p-4 rounded-2xl bg-white border border-[var(--gray-200)] flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 text-[var(--navy)] font-bold flex items-center justify-center text-sm">
                            {fm.name.charAt(0)}
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-[var(--navy)]">{fm.name}</h4>
                            <p className="text-xs text-slate-500">
                              {fm.relation} {fm.age ? `• ${fm.age} Y` : ''} {fm.gender ? `• ${fm.gender}` : ''}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ═══ TAB: SAVED ADDRESSES ═══ */}
              {activeTab === 'addresses' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-[var(--gray-500)]">Saved addresses for doorstep phlebotomist sample collection</p>
                    <button
                      onClick={() => setIsAddressModalOpen(true)}
                      className="px-4 py-2 rounded-xl bg-[var(--blue)] text-white text-xs font-bold hover:bg-[var(--navy)]"
                    >
                      + Add Address
                    </button>
                  </div>

                  {savedAddresses.length === 0 ? (
                    <div className="p-8 text-center bg-white rounded-2xl border border-[var(--gray-200)] text-xs text-slate-500">
                      No addresses saved yet. Add your home or office address for fast test booking.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {savedAddresses.map((addr) => (
                        <div key={addr.id} className="p-4 rounded-2xl bg-white border border-[var(--gray-200)]">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 uppercase">
                            {addr.label}
                          </span>
                          <p className="text-xs font-medium text-slate-800 mt-2">{addr.address}</p>
                          {addr.pincode && <p className="text-[11px] text-slate-500 font-mono mt-0.5">PIN: {addr.pincode}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          )}
        </div>
      </section>

      {/* ═══ MODAL: ADD FAMILY MEMBER ═══ */}
      {isFamilyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-[var(--navy)] mb-1">Add Family Member</h3>
            <p className="text-xs text-[var(--gray-500)] mb-4">Link dependent profile to your patient account</p>

            <form onSubmit={handleAddFamilyMember} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[var(--navy)] mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={fmName}
                  onChange={(e) => setFmName(e.target.value)}
                  placeholder="e.g. Priya Sharma"
                  className="w-full px-3 py-2 rounded-xl border border-[var(--gray-200)] text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-bold text-[var(--navy)] mb-1">Relationship</label>
                  <select
                    value={fmRelation}
                    onChange={(e) => setFmRelation(e.target.value)}
                    className="w-full px-2 py-2 rounded-xl border border-[var(--gray-200)] text-xs"
                  >
                    <option value="Spouse">Spouse</option>
                    <option value="Child">Child</option>
                    <option value="Mother">Mother</option>
                    <option value="Father">Father</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--navy)] mb-1">Age</label>
                  <input
                    type="number"
                    value={fmAge}
                    onChange={(e) => setFmAge(e.target.value)}
                    className="w-full px-2 py-2 rounded-xl border border-[var(--gray-200)] text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--navy)] mb-1">Gender</label>
                  <select
                    value={fmGender}
                    onChange={(e) => setFmGender(e.target.value)}
                    className="w-full px-2 py-2 rounded-xl border border-[var(--gray-200)] text-xs"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFamilyModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[var(--gray-600)] hover:bg-[var(--gray-100)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[var(--blue)] text-white text-xs font-bold hover:bg-[var(--navy)]"
                >
                  Save Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ MODAL: ADD ADDRESS ═══ */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-[var(--navy)] mb-1">Save New Address</h3>
            <p className="text-xs text-[var(--gray-500)] mb-4">Saved address for home blood sample collections</p>

            <form onSubmit={handleAddAddress} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[var(--navy)] mb-1">Address Label</label>
                <select
                  value={addrLabel}
                  onChange={(e) => setAddrLabel(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--gray-200)] text-xs"
                >
                  <option value="Home">Home</option>
                  <option value="Office / Work">Office / Work</option>
                  <option value="Parents House">Parents House</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--navy)] mb-1">Full Address *</label>
                <textarea
                  required
                  rows={3}
                  value={addrText}
                  onChange={(e) => setAddrText(e.target.value)}
                  placeholder="Flat / House #, Street, Landmark, City..."
                  className="w-full px-3 py-2 rounded-xl border border-[var(--gray-200)] text-xs resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--navy)] mb-1">Postal Pincode</label>
                <input
                  type="text"
                  value={addrPincode}
                  onChange={(e) => setAddrPincode(e.target.value)}
                  placeholder="e.g. 400001"
                  className="w-full px-3 py-2 rounded-xl border border-[var(--gray-200)] text-xs font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[var(--gray-600)] hover:bg-[var(--gray-100)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[var(--blue)] text-white text-xs font-bold hover:bg-[var(--navy)]"
                >
                  Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </HomepageAnimations>
  )
}
