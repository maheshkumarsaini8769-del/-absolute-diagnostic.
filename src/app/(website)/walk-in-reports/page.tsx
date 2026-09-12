'use client'

import { useState } from 'react'
import Link from 'next/link'
import HomepageAnimations from '@/components/HomepageAnimations'

interface Report {
  id: string
  testName: string
  reportDate: string
  status: string
  fileName: string
  bookingId: string | null
  collectionDate: string | null
}

type Step = 'login' | 'results'

export default function WalkInReportsPage() {
  const [step, setStep] = useState<Step>('login')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [reports, setReports] = useState<Report[]>([])
  const [patientName, setPatientName] = useState('')
  const [token, setToken] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    if (!phone.trim() || !password.trim()) {
      setErrorMsg('Please enter both mobile number and password')
      setStatus('error')
      return
    }

    try {
      const res = await fetch('/api/auth/walkin-login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim(), password: password.trim() }),
      })
      const data = await res.json()

      if (!res.ok) {
        setErrorMsg(data.error || 'Login failed')
        setStatus('error')
        return
      }

      setReports(data.reports || [])
      setPatientName(data.patientName || '')
      setToken(data.token || '')
      setStep('results')
      setStatus('idle')
    } catch {
      setErrorMsg('Something went wrong. Please try again.')
      setStatus('error')
    }
  }

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'ready': case 'uploaded': return 'bg-purple-50 text-purple-700 border-purple-100'
      case 'processing': return 'bg-amber-50 text-amber-700 border-amber-100'
      case 'requested': return 'bg-blue-50 text-blue-700 border-blue-100'
      case 'confirmed': return 'bg-indigo-50 text-indigo-700 border-indigo-100'
      case 'sample_collected': return 'bg-purple-50 text-purple-700 border-purple-100'
      default: return 'bg-gray-50 text-gray-600 border-gray-100'
    }
  }

  const formatStatus = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

  const reset = () => {
    setStep('login')
    setPhone('')
    setPassword('')
    setReports([])
    setPatientName('')
    setToken('')
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
            <Link href="/reports" className="hover:text-white transition-colors">Reports</Link>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
            <span className="text-white/80">Walk-in Reports</span>
          </nav>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4" style={{ fontFamily: 'var(--font-jakarta)' }}>
            Check Your <span className="gradient-text">Report</span>
          </h1>
          <p className="text-white/60 text-lg max-w-xl">
            Access your diagnostic reports using your registered mobile number.
          </p>
        </div>
      </section>

      <section className="py-20 lg:py-28">
        <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8">
          {step === 'login' && (
            <div className="reveal">
              <div className="surface-elevated rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-[var(--blue)]/10 flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2" strokeLinecap="round">
                      <rect x="5" y="11" width="14" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[var(--navy)]" style={{ fontFamily: 'var(--font-jakarta)' }}>Check Your Report</h2>
                    <p className="text-xs text-[var(--gray-500)]">Enter your registered details</p>
                  </div>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--gray-600)] mb-2 uppercase tracking-wider">Mobile Number *</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      required
                      placeholder="Enter 10-digit mobile number"
                      maxLength={10}
                      className="w-full px-4 py-3.5 rounded-xl border border-[var(--gray-200)] bg-[var(--gray-50)] text-[var(--navy)] placeholder:text-[var(--gray-400)] focus:outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/10 transition-all text-base"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--gray-600)] mb-2 uppercase tracking-wider">Password *</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="Enter your password"
                      className="w-full px-4 py-3.5 rounded-xl border border-[var(--gray-200)] bg-[var(--gray-50)] text-[var(--navy)] placeholder:text-[var(--gray-400)] focus:outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/10 transition-all text-base"
                    />
                    <div className="mt-3 p-3 rounded-xl bg-blue-50 border border-blue-100">
                      <p className="text-xs text-blue-700 leading-relaxed">
                        <strong>Password = First 4 letters of your name + your age</strong>
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        Example: If name is <strong>MAHESH</strong> and age is <strong>18</strong>, password is: <strong>MAHE18</strong>
                      </p>
                    </div>
                  </div>

                  {errorMsg && (
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-100">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" className="shrink-0 mt-0.5">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="15" y1="9" x2="9" y2="15" />
                        <line x1="9" y1="9" x2="15" y2="15" />
                      </svg>
                      <p className="text-sm text-red-700">{errorMsg}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-[var(--blue)] to-[var(--blue-light)] text-white font-bold text-base hover:shadow-xl hover:shadow-[var(--blue)]/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="flex items-center justify-center gap-2">
                      {status === 'loading' ? (
                        <>
                          <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="32" /></svg>
                          Checking...
                        </>
                      ) : (
                        <>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                          VIEW REPORT
                        </>
                      )}
                    </span>
                  </button>
                </form>

                <div className="mt-6 pt-6 border-t border-[var(--gray-100)] text-center">
                  <p className="text-xs text-[var(--gray-500)]">
                    Online booking patient?{' '}
                    <Link href="/reports" className="text-[var(--blue)] font-semibold hover:underline">
                      Login with Email OTP
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 'results' && (
            <div className="reveal">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-[var(--navy)]" style={{ fontFamily: 'var(--font-jakarta)' }}>
                    {patientName ? `${patientName}'s Reports` : 'Your Reports'} ({reports.length})
                  </h2>
                  <p className="text-sm text-[var(--gray-500)]">Verified via mobile number</p>
                </div>
                <button
                  onClick={reset}
                  className="text-sm font-semibold text-[var(--blue)] hover:text-[var(--blue-light)] transition-colors"
                >
                  Sign Out
                </button>
              </div>

              {reports.length === 0 ? (
                <div className="text-center py-16 surface-elevated rounded-2xl">
                  <div className="w-16 h-16 rounded-full bg-[var(--gray-100)] flex items-center justify-center mx-auto mb-4">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--gray-400)" strokeWidth="1.5" strokeLinecap="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-[var(--navy)] mb-2">No Reports Found</h3>
                  <p className="text-sm text-[var(--gray-500)] mb-6">No reports are linked to your account yet.</p>
                  <button onClick={reset} className="px-6 py-2.5 rounded-xl bg-[var(--blue)] text-white text-sm font-semibold hover:bg-[var(--blue-light)] transition-colors">
                    Try Again
                  </button>
                </div>
              ) : (
                <div className="space-y-3 stagger reveal">
                  {reports.map((report) => (
                    <div key={report.id} className="surface-elevated rounded-2xl p-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[var(--blue)]/10 flex items-center justify-center shrink-0">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2" strokeLinecap="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-[var(--navy)] text-sm">{report.testName}</h3>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {report.bookingId && (
                              <span className="text-xs text-[var(--gray-400)]">#{report.bookingId}</span>
                            )}
                            <span className="text-xs text-[var(--gray-400)]">
                              {new Date(report.reportDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                          <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border mt-1.5 ${getStatusColor(report.status)}`}>
                            {formatStatus(report.status)}
                          </span>
                        </div>
                        {(report.status === 'ready' || report.status === 'uploaded') && token && (
                          <div className="flex gap-2 shrink-0">
                            <a
                              href={`/api/reports/secure/${report.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={async (e) => {
                                e.preventDefault()
                                try {
                                  const res = await fetch(`/api/reports/secure/${report.id}`, {
                                    headers: { Authorization: `Bearer ${token}` }
                                  })
                                  const data = await res.json()
                                  if (data.report?.tempUrl) window.open(data.report.tempUrl, '_blank')
                                } catch { /* ignore */ }
                              }}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--blue)]/8 text-[var(--blue)] text-xs font-semibold hover:bg-[var(--blue)]/15 transition-colors"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                              View
                            </a>
                            <a
                              href={`/api/reports/secure/${report.id}`}
                              download
                              onClick={async (e) => {
                                e.preventDefault()
                                try {
                                  const res = await fetch(`/api/reports/secure/${report.id}`, {
                                    headers: { Authorization: `Bearer ${token}` }
                                  })
                                  const data = await res.json()
                                  if (data.report?.tempUrl) {
                                    const a = document.createElement('a')
                                    a.href = data.report.tempUrl
                                    a.download = report.fileName
                                    a.click()
                                  }
                                } catch { /* ignore */ }
                              }}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--teal)]/8 text-[var(--teal)] text-xs font-semibold hover:bg-[var(--teal)]/15 transition-colors"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                              </svg>
                              Download
                            </a>
                          </div>
                        )}
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
