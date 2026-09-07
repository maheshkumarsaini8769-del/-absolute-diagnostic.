'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import HomepageAnimations from '@/components/HomepageAnimations';
import { ZenuxsAuth } from '@/components/ZenuxsAuth';

interface Report {
  id: string;
  testName: string;
  reportDate: string;
  status: string;
  fileName: string;
  bookingId: string | null;
  collectionDate: string | null;
}

type AuthMode = 'chooser' | 'oauth' | 'otp-email' | 'otp-verify';

export default function ReportsPage() {
  const authRef = useRef<any>(null);
  const [step, setStep] = useState<'choose' | 'loading' | 'results'>('choose');
  const [reports, setReports] = useState<Report[]>([]);
  const [patientName, setPatientName] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [authMode, setAuthMode] = useState<AuthMode>('chooser');
  const [otpEmail, setOtpEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [otpLoading, setOtpLoading] = useState(false);

  useEffect(() => {
    checkSession();
  }, []);

  useEffect(() => {
    if (authMode !== 'oauth') return;
    import('zenuxs-oauth');
    const el = authRef.current;
    if (!el) return;

    const onSuccess = async (e: any) => {
      setStep('loading');
      const detail = e.detail;
      try {
        const res = await fetch('/api/auth/zenuxs/patient-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessToken: detail.access_token, redirectUrl: '/reports' }),
        });
        const data = await res.json();
        if (res.ok) window.location.href = data.redirectUrl || '/reports';
        else { setErrorMsg(data.error || 'Authentication failed'); setStep('choose'); setAuthMode('chooser'); }
      } catch { setErrorMsg('Network error'); setStep('choose'); setAuthMode('chooser'); }
    };

    const onError = (e: any) => {
      setErrorMsg(e.detail?.message || 'Authentication failed');
      setStep('choose');
      setAuthMode('chooser');
    };

    el.addEventListener('success', onSuccess);
    el.addEventListener('error', onError);
    return () => {
      el.removeEventListener('success', onSuccess);
      el.removeEventListener('error', onError);
    };
  }, [authMode]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const checkSession = async () => {
    try {
      const res = await fetch('/api/reports/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionCheck: true }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.reports) {
          setReports(data.reports);
          setPatientName(data.patientName || '');
          setStep('results');
        }
      }
    } catch { /* no session */ }
  };

  const handleSendOTP = async () => {
    if (!otpEmail.trim()) { setErrorMsg('Please enter your email'); return; }
    setOtpLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/auth/patient/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: otpEmail.trim(), type: 'report' }),
      });
      const data = await res.json();
      if (!res.ok) { setErrorMsg(data.error || 'Failed to send OTP'); setOtpLoading(false); return; }
      setOtpSent(true);
      setAuthMode('otp-verify');
      setCooldown(60);
      setOtpLoading(false);
    } catch { setErrorMsg('Network error'); setOtpLoading(false); }
  };

  const handleVerifyOTP = async () => {
    if (!otpCode.trim() || otpCode.length !== 6) { setErrorMsg('Please enter a valid 6-digit OTP'); return; }
    setStep('loading');
    setOtpLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/auth/patient/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: otpEmail.trim(), otp: otpCode.trim(), type: 'report' }),
      });
      const data = await res.json();
      if (!res.ok) { setErrorMsg(data.error || 'Invalid OTP'); setStep('choose'); setAuthMode('otp-verify'); setOtpLoading(false); return; }
      if (data.reports) {
        setReports(data.reports);
        setPatientName(data.patientName || '');
        setStep('results');
      } else {
        window.location.href = '/reports';
      }
    } catch { setErrorMsg('Network error'); setStep('choose'); setOtpLoading(false); }
  };

  const handleResendOTP = async () => {
    if (cooldown > 0) return;
    setOtpLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/auth/patient/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: otpEmail.trim(), type: 'report' }),
      });
      const data = await res.json();
      if (!res.ok) { setErrorMsg(data.error || 'Failed to resend OTP'); setOtpLoading(false); return; }
      setCooldown(60);
      setOtpLoading(false);
    } catch { setErrorMsg('Network error'); setOtpLoading(false); }
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'ready': case 'report_ready': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'uploaded': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'processing': case 'report_under_review': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'rejected': return 'bg-red-50 text-red-700 border-red-100';
      default: return 'bg-gray-50 text-gray-600 border-gray-100';
    }
  };

  const reset = () => {
    setStep('choose');
    setReports([]);
    setPatientName('');
    setStatus('idle');
    setErrorMsg('');
    setAuthMode('chooser');
    setOtpEmail('');
    setOtpCode('');
    setOtpSent(false);
  };

  return (
    <HomepageAnimations>
      <section className="relative bg-gradient-to-br from-[var(--navy)] via-[var(--navy-light)] to-[var(--navy)] overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-[var(--blue)] rounded-full blur-[160px] opacity-15 animate-morph" />
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-[var(--teal)] rounded-full blur-[180px] opacity-10 animate-morph" style={{ animationDelay: '4s' }} />
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <nav className="flex items-center gap-2 text-sm text-white/50 mb-8">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
            <span className="text-white/80">Reports</span>
          </nav>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4" style={{ fontFamily: 'var(--font-jakarta)' }}>
            View Your <span className="gradient-text">Reports</span>
          </h1>
          <p className="text-white/60 text-lg max-w-xl">
            Access your diagnostic reports securely. Sign in to view results.
          </p>
        </div>
      </section>

      <section className="py-20 lg:py-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {step === 'choose' && (
            <div className="reveal">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                {/* Online Booking Patient */}
                <div className="surface-elevated rounded-2xl p-8">
                  <div className="w-14 h-14 rounded-2xl bg-[var(--blue)]/10 flex items-center justify-center mb-5">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2" strokeLinecap="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-[var(--navy)] mb-2" style={{ fontFamily: 'var(--font-jakarta)' }}>Online Booking Patient</h3>
                  <p className="text-sm text-[var(--gray-500)] leading-relaxed mb-4">
                    Sign in with your email to access your reports.
                  </p>

                  {errorMsg && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-100 mb-4">
                      <p className="text-sm text-red-700">{errorMsg}</p>
                    </div>
                  )}

                  {/* Chooser */}
                  {authMode === 'chooser' && (
                    <div className="space-y-3">
                      <button
                        onClick={() => { setAuthMode('otp-email'); setErrorMsg(''); }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                          <polyline points="22,6 12,13 2,6" />
                        </svg>
                        Login with Email OTP
                      </button>
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
                        <div className="relative flex justify-center text-xs"><span className="bg-white px-2 text-gray-400">or</span></div>
                      </div>
                      <button
                        onClick={() => { setAuthMode('oauth'); setErrorMsg(''); }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue text-white rounded-lg text-sm font-medium hover:bg-blue-dark transition-colors"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Sign in with SSO
                      </button>
                    </div>
                  )}

                  {/* OTP Email Input */}
                  {authMode === 'otp-email' && (
                    <div className="space-y-3">
                      <input
                        type="email"
                        value={otpEmail}
                        onChange={(e) => setOtpEmail(e.target.value)}
                        placeholder="Enter your registered email"
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent"
                        onKeyDown={(e) => e.key === 'Enter' && handleSendOTP()}
                        autoFocus
                      />
                      <button
                        onClick={handleSendOTP}
                        disabled={otpLoading}
                        className="w-full px-4 py-2.5 bg-blue text-white text-sm font-medium rounded-lg hover:bg-blue-dark disabled:opacity-50 transition-colors"
                      >
                        {otpLoading ? 'Sending...' : 'Send OTP'}
                      </button>
                      <button
                        onClick={() => { setAuthMode('chooser'); setErrorMsg(''); setOtpEmail(''); }}
                        className="w-full text-sm text-gray-500 hover:text-gray-700"
                      >
                        &larr; Back
                      </button>
                    </div>
                  )}

                  {/* OTP Verify */}
                  {authMode === 'otp-verify' && (
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600">
                        OTP sent to <span className="font-medium">{otpEmail}</span>
                      </p>
                      <input
                        type="text"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000"
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-center tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent"
                        onKeyDown={(e) => e.key === 'Enter' && handleVerifyOTP()}
                        autoFocus
                        maxLength={6}
                      />
                      <button
                        onClick={handleVerifyOTP}
                        disabled={otpLoading}
                        className="w-full px-4 py-2.5 bg-blue text-white text-sm font-medium rounded-lg hover:bg-blue-dark disabled:opacity-50 transition-colors"
                      >
                        {otpLoading ? 'Verifying...' : 'Verify & View Reports'}
                      </button>
                      <div className="flex items-center justify-between text-sm">
                        <button
                          onClick={() => { setAuthMode('otp-email'); setOtpSent(false); setErrorMsg(''); setOtpCode(''); }}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          Change email
                        </button>
                        <button
                          onClick={handleResendOTP}
                          disabled={cooldown > 0 || otpLoading}
                          className="text-blue hover:text-blue-dark disabled:text-gray-400 disabled:cursor-not-allowed"
                        >
                          {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Zenuxs OAuth (hidden, triggered by button) */}
                  {authMode === 'oauth' && (
                    <div>
                      <button
                        onClick={() => { setAuthMode('chooser'); setErrorMsg(''); }}
                        className="mb-4 text-sm text-gray-500 hover:text-gray-700"
                      >
                        &larr; Back
                      </button>
                      <ZenuxsAuth
                        innerRef={authRef}
                        clientId={process.env.NEXT_PUBLIC_ZENUXS_CLIENT_ID || '4874ff27aff3ed59'}
                        scope="openid profile email"
                        theme="light"
                        height="420px"
                        autoRedirect="false"
                      />
                    </div>
                  )}
                </div>

                {/* Walk-in Patient */}
                <a
                  href="/walk-in-reports"
                  className="surface-elevated rounded-2xl p-8 text-left group hover:border-[var(--teal)]/30 hover:shadow-xl transition-all duration-300"
                >
                  <div className="w-14 h-14 rounded-2xl bg-[var(--teal)]/10 flex items-center justify-center mb-5 group-hover:bg-[var(--teal)]/20 transition-colors">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2" strokeLinecap="round">
                      <rect x="5" y="11" width="14" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-[var(--navy)] mb-2" style={{ fontFamily: 'var(--font-jakarta)' }}>Walk-in / Lab Patient</h3>
                  <p className="text-sm text-[var(--gray-500)] leading-relaxed">
                    Login with your mobile number and password (name + age).
                  </p>
                </a>
              </div>
            </div>
          )}

          {step === 'loading' && (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-3 border-blue border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {step === 'results' && (
            <div className="reveal">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-[var(--navy)]" style={{ fontFamily: 'var(--font-jakarta)' }}>
                    {patientName ? `${patientName}'s Reports` : 'Your Reports'} ({reports.length})
                  </h2>
                </div>
                <button
                  onClick={reset}
                  className="text-sm font-semibold text-[var(--blue)] hover:text-[var(--blue-light)] transition-colors flex items-center gap-1"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
                  New Search
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
                  <p className="text-sm text-[var(--gray-500)] mb-6">No reports are linked to this account.</p>
                  <button onClick={reset} className="btn-primary text-sm px-6 py-2.5 rounded-xl">
                    <span>Try Again</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4 stagger reveal">
                  {reports.map((report) => (
                    <div key={report.id} className="surface-elevated rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-[var(--blue)]/10 flex items-center justify-center shrink-0">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2" strokeLinecap="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-[var(--navy)] text-sm truncate">{report.testName}</h3>
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            {report.bookingId && (
                              <span className="text-xs text-[var(--gray-400)]">#{report.bookingId}</span>
                            )}
                            <span className="text-xs text-[var(--gray-400)]">
                              {new Date(report.reportDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${getStatusColor(report.status)}`}>
                              {report.status}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 sm:shrink-0">
                        {report.status === 'ready' || report.status === 'report_ready' || report.status === 'uploaded' ? (
                          <>
                            <button
                              onClick={async () => {
                                try {
                                  const res = await fetch(`/api/reports/secure/${report.id}`);
                                  const data = await res.json();
                                  if (data.report?.tempUrl) window.open(data.report.tempUrl, '_blank');
                                } catch { /* ignore */ }
                              }}
                              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--blue)]/8 text-[var(--blue)] text-xs font-semibold hover:bg-[var(--blue)]/15 transition-colors"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                              View
                            </button>
                            <button
                              onClick={async () => {
                                try {
                                  const res = await fetch(`/api/reports/secure/${report.id}`);
                                  const data = await res.json();
                                  if (data.report?.tempUrl) {
                                    const a = document.createElement('a');
                                    a.href = data.report.tempUrl;
                                    a.download = report.fileName;
                                    a.click();
                                  }
                                } catch { /* ignore */ }
                              }}
                              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--teal)]/8 text-[var(--teal)] text-xs font-semibold hover:bg-[var(--teal)]/15 transition-colors"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                              </svg>
                              Download
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-[var(--gray-400)] italic">Not ready</span>
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
  );
}
