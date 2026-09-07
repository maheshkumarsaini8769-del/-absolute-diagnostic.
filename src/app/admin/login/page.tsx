'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { ZenuxsAuth } from '@/components/ZenuxsAuth'

type LoginMode = 'chooser' | 'oauth' | 'otp-email' | 'otp-verify'

function AdminLoginInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const authRef = useRef<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState<LoginMode>('chooser')
  const [otpEmail, setOtpEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  const errorParam = searchParams.get('error')

  useEffect(() => {
    if (errorParam) {
      const messages: Record<string, string> = {
        unauthorized: 'Your email is not authorized for admin access.',
        disabled: 'This admin account is disabled.',
        no_code: 'Authentication failed. No code received.',
        no_email: 'Authentication failed. No email provided.',
        callback_failed: 'Authentication callback failed. Please try again.',
      }
      setError(messages[errorParam] || `Authentication error: ${errorParam}`)
    }
  }, [errorParam])

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  // Zenuxs OAuth setup
  useEffect(() => {
    if (mode !== 'oauth') return
    import('zenuxs-oauth')
    const el = authRef.current
    if (!el) return

    const onSuccess = async (e: any) => {
      setLoading(true)
      setError('')
      try {
        const detail = e.detail
        const res = await fetch('/api/auth/zenuxs/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessToken: detail.access_token, redirectUrl: '/admin/dashboard' }),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error || 'Authentication failed')
          setLoading(false)
          return
        }
        window.location.href = data.redirectUrl || '/admin/dashboard'
      } catch {
        setError('Network error')
        setLoading(false)
      }
    }

    const onError = (e: any) => {
      setError(e.detail?.message || 'Authentication failed')
    }

    el.addEventListener('success', onSuccess)
    el.addEventListener('error', onError)
    return () => {
      el.removeEventListener('success', onSuccess)
      el.removeEventListener('error', onError)
    }
  }, [mode])

  const handleSendOTP = async () => {
    if (!otpEmail.trim()) {
      setError('Please enter your email')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: otpEmail.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to send OTP')
        setLoading(false)
        return
      }
      setOtpSent(true)
      setMode('otp-verify')
      setCooldown(60)
      setLoading(false)
    } catch {
      setError('Network error')
      setLoading(false)
    }
  }

  const handleVerifyOTP = async () => {
    if (!otpCode.trim() || otpCode.length !== 6) {
      setError('Please enter a valid 6-digit OTP')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: otpEmail.trim(), otp: otpCode.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Invalid OTP')
        setLoading(false)
        return
      }
      window.location.href = '/admin/dashboard'
    } catch {
      setError('Network error')
      setLoading(false)
    }
  }

  const handleResendOTP = async () => {
    if (cooldown > 0) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: otpEmail.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to resend OTP')
        setLoading(false)
        return
      }
      setCooldown(60)
      setLoading(false)
    } catch {
      setError('Network error')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Lab Admin</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to manage your lab</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>
          )}

          {loading && (
            <div className="flex items-center justify-center gap-2 py-4 text-sm text-gray-500">
              <span className="w-4 h-4 border-2 border-blue border-t-transparent rounded-full animate-spin" />
              {mode === 'otp-verify' ? 'Verifying...' : 'Signing in...'}
            </div>
          )}

          {/* Chooser Mode */}
          {mode === 'chooser' && !loading && (
            <div className="space-y-3">
              <button
                onClick={() => setMode('otp-email')}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Login with Email OTP
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-2 text-gray-400">or</span>
                </div>
              </div>

              <button
                onClick={() => setMode('oauth')}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-blue text-white rounded-lg text-sm font-medium hover:bg-blue-dark transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Sign in with SSO
              </button>
            </div>
          )}

          {/* OTP Email Input */}
          {mode === 'otp-email' && !loading && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Email address</label>
                <input
                  type="email"
                  value={otpEmail}
                  onChange={(e) => setOtpEmail(e.target.value)}
                  placeholder="admin@absolutediagnostic.com"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent"
                  onKeyDown={(e) => e.key === 'Enter' && handleSendOTP()}
                  autoFocus
                />
              </div>
              <button
                onClick={handleSendOTP}
                className="w-full px-4 py-2.5 bg-blue text-white text-sm font-medium rounded-lg hover:bg-blue-dark transition-colors"
              >
                Send OTP
              </button>
              <button
                onClick={() => { setMode('chooser'); setError(''); setOtpEmail('') }}
                className="w-full px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                Back
              </button>
            </div>
          )}

          {/* OTP Verify */}
          {mode === 'otp-verify' && !loading && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                OTP sent to <span className="font-medium">{otpEmail}</span>
              </p>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Enter 6-digit OTP</label>
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
              </div>
              <button
                onClick={handleVerifyOTP}
                className="w-full px-4 py-2.5 bg-blue text-white text-sm font-medium rounded-lg hover:bg-blue-dark transition-colors"
              >
                Verify & Sign In
              </button>
              <div className="flex items-center justify-between text-sm">
                <button
                  onClick={() => { setMode('otp-email'); setOtpSent(false); setError(''); setOtpCode('') }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Change email
                </button>
                <button
                  onClick={handleResendOTP}
                  disabled={cooldown > 0}
                  className="text-blue hover:text-blue-dark disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
                </button>
              </div>
            </div>
          )}

          {/* Zenuxs OAuth (hidden, triggered by button) */}
          {mode === 'oauth' && (
            <div>
              <button
                onClick={() => { setMode('chooser'); setError('') }}
                className="mb-4 text-sm text-gray-500 hover:text-gray-700"
              >
                &larr; Back
              </button>
              <ZenuxsAuth
                innerRef={authRef}
                clientId={process.env.NEXT_PUBLIC_ZENUXS_CLIENT_ID || '4874ff27aff3ed59'}
                scope="openid profile email"
                theme="light"
                height="480px"
                autoRedirect="false"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <span className="w-6 h-6 border-2 border-blue border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <AdminLoginInner />
    </Suspense>
  )
}
