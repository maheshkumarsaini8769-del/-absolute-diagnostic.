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

export default function DashboardPage() {
  const authRef = useRef<any>(null)
  const [step, setStep] = useState<'choose' | 'loading' | 'dashboard'>('choose')
  const [patientName, setPatientName] = useState('')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [activeTab, setActiveTab] = useState<'bookings' | 'reports'>('bookings')

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
          setStep('dashboard')
        }
      }
    } catch { /* no session */ }
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
          <div className="absolute top-20 left-10 w-72 h-72 bg-[var(--blue)] rounded-full blur-[160px] opacity-15 animate-morph" />
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-[var(--teal)] rounded-full blur-[180px] opacity-10 animate-morph" style={{ animationDelay: '4s' }} />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <nav className="flex items-center gap-2 text-sm text-white/50 mb-8">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
            <span className="text-white/80">My Dashboard</span>
          </nav>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4" style={{ fontFamily: 'var(--font-jakarta)' }}>
            My Health <span className="gradient-text">Records</span>
          </h1>
          <p className="text-white/60 text-lg max-w-xl">
            View your bookings, reports, and health history.
          </p>
        </div>
      </section>

      <section className="py-20 lg:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {step === 'choose' && (
            <div className="max-w-md mx-auto reveal">
              <div className="surface-elevated rounded-2xl p-8">
                <h2 className="text-xl font-bold text-[var(--navy)] mb-6" style={{ fontFamily: 'var(--font-jakarta)' }}>Sign In to Dashboard</h2>
                <p className="text-sm text-[var(--gray-500)] mb-4">Use your email to access your health records.</p>
                {errorMsg && <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-700 mb-4">{errorMsg}</div>}
                <ZenuxsAuth
                  innerRef={authRef}
                  clientId={process.env.NEXT_PUBLIC_ZENUXS_CLIENT_ID || '4874ff27aff3ed59'}
                  scope="openid profile email"
                  theme="light"
                  height="420px"
                  autoRedirect="false"
                />
              </div>
            </div>
          )}

          {step === 'dashboard' && (
            <div className="reveal">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-[var(--navy)]" style={{ fontFamily: 'var(--font-jakarta)' }}>
                    {patientName ? `${patientName}'s Dashboard` : 'My Dashboard'}
                  </h2>
                </div>
                <button onClick={reset} className="text-sm font-semibold text-[var(--blue)] hover:text-[var(--blue-light)]">Sign Out</button>
              </div>

              <div className="flex gap-2 mb-6">
                <button onClick={() => setActiveTab('bookings')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'bookings' ? 'bg-[var(--blue)] text-white' : 'bg-[var(--gray-100)] text-[var(--gray-600)] hover:bg-[var(--gray-200)]'}`}>
                  Bookings ({bookings.length})
                </button>
                <button onClick={() => setActiveTab('reports')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'reports' ? 'bg-[var(--blue)] text-white' : 'bg-[var(--gray-100)] text-[var(--gray-600)] hover:bg-[var(--gray-200)]'}`}>
                  Reports ({reports.length})
                </button>
              </div>

              {activeTab === 'bookings' && (
                <div className="space-y-3">
                  {bookings.length === 0 ? (
                    <div className="text-center py-12 surface-elevated rounded-2xl">
                      <p className="text-[var(--gray-500)]">No bookings found for this account.</p>
                      <Link href="/booking" className="btn-primary inline-flex mt-4"><span>Book a Test</span></Link>
                    </div>
                  ) : bookings.map((b) => (
                    <div key={b.id} className="surface-elevated rounded-2xl p-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-[var(--navy)] font-mono text-sm">{b.bookingId}</span>
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getStatusColor(b.status)}`}>
                              {formatStatus(b.status)}
                            </span>
                          </div>
                          <p className="text-xs text-[var(--gray-500)]">{b.items.map(i => i.testName).join(', ')}</p>
                          <p className="text-xs text-[var(--gray-400)] mt-1">
                            {new Date(b.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            {b.preferredDate && ` • ${b.preferredDate}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-[var(--blue)]">₹{b.totalAmount}</p>
                          <Link href={`/booking/${b.bookingId}`} className="text-xs text-[var(--blue)] font-semibold hover:underline mt-1 block">View</Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'reports' && (
                <div className="space-y-3">
                  {reports.length === 0 ? (
                    <div className="text-center py-12 surface-elevated rounded-2xl">
                      <p className="text-[var(--gray-500)]">No reports found for this account.</p>
                    </div>
                  ) : reports.map((r) => (
                    <div key={r.id} className="surface-elevated rounded-2xl p-5 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-[var(--navy)] text-sm">{r.testName}</p>
                        <p className="text-xs text-[var(--gray-500)]">
                          {r.bookingId && `#${r.bookingId} • `}
                          {new Date(r.reportDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                        <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border mt-1 ${getStatusColor(r.status)}`}>
                          {formatStatus(r.status)}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <a href={`/api/reports/${r.id}`} target="_blank" rel="noopener noreferrer"
                          className="px-3 py-2 rounded-lg bg-[var(--blue)]/8 text-[var(--blue)] text-xs font-semibold hover:bg-[var(--blue)]/15 transition-colors">View</a>
                        <a href={`/api/reports/${r.id}`} download
                          className="px-3 py-2 rounded-lg bg-[var(--teal)]/8 text-[var(--teal)] text-xs font-semibold hover:bg-[var(--teal)]/15 transition-colors">Download</a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </HomepageAnimations>
  )
}
