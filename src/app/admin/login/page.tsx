'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { ZenuxsAuth } from '@/components/ZenuxsAuth'

type LoginMode = 'password' | 'otp-email' | 'otp-verify' | 'set-password' | 'oauth'

function AdminLoginInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const authRef = useRef<any>(null)

  const [mode, setMode] = useState<LoginMode>('password')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Password Login State
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // OTP Login State
  const [otpEmail, setOtpEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [tempToken, setTempToken] = useState<string | null>(null)

  // Set Password State
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)

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
        setError('Network error during SSO login')
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

  // ══════════════════════════════════════════════════════════
  // 1. PASSWORD LOGIN
  // ══════════════════════════════════════════════════════════
  const handlePasswordLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setError('Please enter both your email and password.')
      return
    }

    setLoading(true)
    setError('')
    setSuccessMsg('')

    try {
      const res = await fetch('/api/auth/admin/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail.trim(),
          password: loginPassword.trim()
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        if (data.needsOtp) {
          setOtpEmail(loginEmail.trim())
          setMode('otp-email')
          setError(data.error || 'Please login with OTP to setup your password first.')
        } else {
          setError(data.error || 'Invalid email or password.')
        }
        setLoading(false)
        return
      }

      window.location.href = data.redirectUrl || '/admin/dashboard'
    } catch {
      setError('Network error while signing in. Please check your connection.')
      setLoading(false)
    }
  }

  // ══════════════════════════════════════════════════════════
  // 2. SEND OTP
  // ══════════════════════════════════════════════════════════
  const handleSendOTP = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const targetEmail = otpEmail.trim() || loginEmail.trim()
    if (!targetEmail) {
      setError('Please enter your authorized admin email address.')
      return
    }

    setLoading(true)
    setError('')
    setSuccessMsg('')

    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to send OTP. Please verify your email is authorized.')
        setLoading(false)
        return
      }

      setOtpEmail(targetEmail)
      setOtpSent(true)
      setMode('otp-verify')
      setCooldown(60)
      setSuccessMsg('A 6-digit OTP has been sent to your email.')

      if (data.devOtp) {
        setOtpCode(data.devOtp)
      }
      setLoading(false)
    } catch {
      setError('Network error while sending OTP. Please try again.')
      setLoading(false)
    }
  }

  // ══════════════════════════════════════════════════════════
  // 3. VERIFY OTP
  // ══════════════════════════════════════════════════════════
  const handleVerifyOTP = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      setError('Please enter the valid 6-digit OTP.')
      return
    }

    setLoading(true)
    setError('')
    setSuccessMsg('')

    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: otpEmail.trim(), otp: otpCode.trim() }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Invalid or expired OTP. Please try again.')
        setLoading(false)
        return
      }

      if (data.tempToken) {
        setTempToken(data.tempToken)
      }

      // If password setup is needed or first-time
      if (data.needsPasswordSetup) {
        setMode('set-password')
        setSuccessMsg('OTP verified successfully! Please create your new Admin Password below.')
        setLoading(false)
        return
      }

      // If already has password, direct to dashboard or offer password reset
      window.location.href = data.redirectUrl || '/admin/dashboard'
    } catch {
      setError('Network error while verifying OTP.')
      setLoading(false)
    }
  }

  const handleResendOTP = async () => {
    if (cooldown > 0) return
    await handleSendOTP()
  }

  // ══════════════════════════════════════════════════════════
  // 4. SET / CREATE PASSWORD
  // ══════════════════════════════════════════════════════════
  const handleSetPassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!newPassword.trim() || !confirmPassword.trim()) {
      setError('Please fill in both password fields.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    if (!/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      setError('Password must contain both letters and numbers.')
      return
    }

    setLoading(true)
    setError('')
    setSuccessMsg('')

    try {
      const res = await fetch('/api/auth/admin/set-password', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: otpEmail.trim() || loginEmail.trim(),
          password: newPassword.trim(),
          confirmPassword: confirmPassword.trim(),
          tempToken: tempToken || undefined
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to set password.')
        setLoading(false)
        return
      }

      setSuccessMsg('✓ Password created successfully! Redirecting to dashboard...')
      setTimeout(() => {
        window.location.href = data.redirectUrl || '/admin/dashboard'
      }, 1000)
    } catch {
      setError('Network error while saving password.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue/10 text-blue mb-3 shadow-inner">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Absolute Diagnostic</h1>
          <p className="text-xs font-semibold text-blue uppercase tracking-widest mt-0.5">Admin Management Portal</p>
        </div>

        {/* Card Container */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-7">
          {/* Alerts */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3 rounded-xl mb-5 flex items-start gap-2 animate-shake">
              <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-3 rounded-xl mb-5 flex items-start gap-2">
              <svg className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>{successMsg}</span>
            </div>
          )}

          {/* Loading Indicator */}
          {loading && (
            <div className="flex items-center justify-center gap-2 py-4 mb-3 text-xs font-medium text-gray-600">
              <span className="w-4 h-4 border-2 border-blue border-t-transparent rounded-full animate-spin" />
              Processing...
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════ */}
          {/* MODE 1: PASSWORD LOGIN (DEFAULT)                       */}
          {/* ═══════════════════════════════════════════════════════ */}
          {mode === 'password' && (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Admin Email</label>
                <div className="relative">
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="admin@absolutediagnostic.com"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue/30 focus:border-blue transition-all"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-gray-700">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpEmail(loginEmail.trim())
                      setMode('otp-email')
                      setError('')
                      setSuccessMsg('')
                    }}
                    className="text-xs font-medium text-blue hover:text-blue-dark hover:underline"
                  >
                    Forgot or Set Password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue/30 focus:border-blue transition-all pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                    tabIndex={-1}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue hover:bg-blue-dark text-white rounded-xl text-sm font-semibold shadow-md shadow-blue/20 transition-all hover:shadow-lg disabled:opacity-50"
              >
                Sign In with Password
              </button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-3 text-gray-400 font-medium">Alternative Options</span>
                </div>
              </div>

              {/* First Time / OTP Login Trigger */}
              <button
                type="button"
                onClick={() => {
                  setOtpEmail(loginEmail.trim())
                  setMode('otp-email')
                  setError('')
                  setSuccessMsg('')
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 border border-gray-200 hover:border-gray-300 rounded-xl text-xs font-medium text-gray-700 bg-gray-50/50 hover:bg-gray-100 transition-colors"
              >
                <svg className="w-4 h-4 text-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                First Time Owner / Login with OTP
              </button>

              {/* SSO Option */}
              <button
                type="button"
                onClick={() => { setMode('oauth'); setError(''); setSuccessMsg('') }}
                className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-medium text-gray-500 hover:text-gray-700 hover:underline"
              >
                Sign in with Zenuxs SSO
              </button>
            </form>
          )}

          {/* ═══════════════════════════════════════════════════════ */}
          {/* MODE 2: OTP EMAIL INPUT                                */}
          {/* ═══════════════════════════════════════════════════════ */}
          {mode === 'otp-email' && (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div className="text-left mb-2">
                <h2 className="text-sm font-bold text-gray-900">Sign in with Email OTP</h2>
                <p className="text-xs text-gray-500 mt-0.5">Enter your authorized email to receive a 6-digit login code.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Authorized Email</label>
                <input
                  type="email"
                  value={otpEmail}
                  onChange={(e) => setOtpEmail(e.target.value)}
                  placeholder="admin@absolutediagnostic.com"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue/30 focus:border-blue transition-all"
                  required
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue hover:bg-blue-dark text-white rounded-xl text-sm font-semibold shadow-md shadow-blue/20 transition-all hover:shadow-lg disabled:opacity-50"
              >
                Send Verification OTP
              </button>

              <button
                type="button"
                onClick={() => { setMode('password'); setError(''); setSuccessMsg('') }}
                className="w-full py-2 text-xs font-medium text-gray-500 hover:text-gray-700"
              >
                &larr; Back to Password Login
              </button>
            </form>
          )}

          {/* ═══════════════════════════════════════════════════════ */}
          {/* MODE 3: OTP VERIFY                                     */}
          {/* ═══════════════════════════════════════════════════════ */}
          {mode === 'otp-verify' && (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div className="text-left mb-2">
                <h2 className="text-sm font-bold text-gray-900">Enter Verification Code</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Code sent to <span className="font-semibold text-gray-800">{otpEmail}</span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">6-Digit Code</label>
                <input
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl text-lg text-center tracking-[0.6em] font-mono font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue/30 focus:border-blue transition-all"
                  maxLength={6}
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={loading || otpCode.length !== 6}
                className="w-full py-3 bg-blue hover:bg-blue-dark text-white rounded-xl text-sm font-semibold shadow-md shadow-blue/20 transition-all hover:shadow-lg disabled:opacity-50"
              >
                Verify & Continue
              </button>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => { setMode('otp-email'); setError(''); setOtpCode('') }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Change Email
                </button>
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={cooldown > 0 || loading}
                  className="font-medium text-blue hover:text-blue-dark disabled:text-gray-400"
                >
                  {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend OTP'}
                </button>
              </div>
            </form>
          )}

          {/* ═══════════════════════════════════════════════════════ */}
          {/* MODE 4: CREATE / SET ADMIN PASSWORD                    */}
          {/* ═══════════════════════════════════════════════════════ */}
          {mode === 'set-password' && (
            <form onSubmit={handleSetPassword} className="space-y-4">
              <div className="text-left mb-2">
                <h2 className="text-sm font-bold text-gray-900">Create Your Admin Password</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Set a secure password so you can sign in directly next time without waiting for an OTP.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue/30 focus:border-blue transition-all pr-10"
                    required
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                    tabIndex={-1}
                  >
                    {showNewPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Confirm Password</label>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue/30 focus:border-blue transition-all"
                  required
                />
              </div>

              <div className="bg-gray-50 border border-gray-100 p-3 rounded-xl space-y-1">
                <p className="text-[11px] font-medium text-gray-600">Password Requirements:</p>
                <div className="flex items-center gap-1.5 text-[11px]">
                  <span className={newPassword.length >= 8 ? 'text-emerald-600 font-bold' : 'text-gray-400'}>
                    {newPassword.length >= 8 ? '✓' : '•'}
                  </span>
                  <span className={newPassword.length >= 8 ? 'text-emerald-700' : 'text-gray-500'}>At least 8 characters</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px]">
                  <span className={/[A-Za-z]/.test(newPassword) && /\d/.test(newPassword) ? 'text-emerald-600 font-bold' : 'text-gray-400'}>
                    {/[A-Za-z]/.test(newPassword) && /\d/.test(newPassword) ? 'text-emerald-700' : '•'}
                  </span>
                  <span className={/[A-Za-z]/.test(newPassword) && /\d/.test(newPassword) ? 'text-emerald-700' : 'text-gray-500'}>Contains both letters & numbers</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue hover:bg-blue-dark text-white rounded-xl text-sm font-semibold shadow-md shadow-blue/20 transition-all hover:shadow-lg disabled:opacity-50"
              >
                Save Password & Enter Dashboard
              </button>

              <button
                type="button"
                onClick={() => { window.location.href = '/admin/dashboard' }}
                className="w-full py-1.5 text-xs font-medium text-gray-400 hover:text-gray-600 text-center"
              >
                Skip for now &rarr;
              </button>
            </form>
          )}

          {/* ═══════════════════════════════════════════════════════ */}
          {/* MODE 5: ZENUXS SSO                                      */}
          {/* ═══════════════════════════════════════════════════════ */}
          {mode === 'oauth' && (
            <div>
              <button
                onClick={() => { setMode('password'); setError('') }}
                className="mb-4 text-xs font-medium text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                &larr; Back to Password Login
              </button>
              <ZenuxsAuth
                innerRef={authRef}
                clientId={process.env.NEXT_PUBLIC_ZENUXS_CLIENT_ID || '4874ff27aff3ed59'}
                scope="openid profile email"
                theme="light"
                height="460px"
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
