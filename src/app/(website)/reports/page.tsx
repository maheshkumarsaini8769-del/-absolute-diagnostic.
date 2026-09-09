'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import HomepageAnimations from '@/components/HomepageAnimations';
import { ZenuxsAuth } from '@/components/ZenuxsAuth';
import { validatePasswordPolicy, PasswordValidationResult } from '@/lib/password-policy';

interface Report {
  id: string;
  testName: string;
  reportDate: string;
  status: string;
  fileName: string;
  bookingId?: string | null;
  analysisData?: any;
}

type AuthMode = 'login' | 'activate' | 'forgot' | 'truecaller_reset' | 'admin_help' | 'otp' | 'oauth';

export default function ReportsPage() {
  const [step, setStep] = useState<'auth' | 'loading' | 'results'>('auth');
  const [authMode, setAuthMode] = useState<AuthMode>('login');

  // Normal Login state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // First-Time Activation state
  const [activatePhone, setActivatePhone] = useState('');
  const [activateRecord, setActivateRecord] = useState<{ patientId: string; patientName: string; phoneMasked: string } | null>(null);
  const [isTruecallerVerified, setIsTruecallerVerified] = useState(false);
  const [activatePassword, setActivatePassword] = useState('');
  const [activateConfirmPassword, setActivateConfirmPassword] = useState('');
  const [activateLoading, setActivateLoading] = useState(false);

  // Forgot Password / Truecaller Recovery state
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [recoveryPatient, setRecoveryPatient] = useState<{ patientId: string; patientName: string; maskedPhone: string } | null>(null);
  const [truecallerLoading, setTruecallerLoading] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [adminHelpSuccess, setAdminHelpSuccess] = useState(false);

  // OTP Email State (preserved)
  const [otpEmail, setOtpEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Results & Session state
  const [reports, setReports] = useState<Report[]>([]);
  const [patientName, setPatientName] = useState('');
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const authRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkSession();
  }, []);

  // Zenuxs OAuth listener
  useEffect(() => {
    if (authMode !== 'oauth') return;
    import('zenuxs-oauth');
    const el = authRef.current;
    if (!el) return;

    const onSuccess = async (e: any) => {
      setLoginLoading(true);
      setErrorMsg('');
      try {
        const detail = e.detail;
        const res = await fetch('/api/auth/zenuxs/patient-session', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessToken: detail.access_token, redirectUrl: '/reports' }),
        });
        const data = await res.json();
        if (!res.ok) {
          setErrorMsg(data.error || 'SSO Authentication failed');
          setLoginLoading(false);
          return;
        }
        if (data.reports) {
          setReports(data.reports);
          setPatientName(data.patientName || data.patient?.name || '');
          setSessionToken(data.token || null);
          setStep('results');
        } else {
          await checkSession();
        }
      } catch {
        setErrorMsg('Network error during SSO authentication');
      }
      setLoginLoading(false);
    };

    const onError = (e: any) => {
      setErrorMsg(e.detail?.message || 'SSO Authentication cancelled or failed');
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
        credentials: 'include',
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
    } catch { /* no active session */ }
  };

  // ══════════════════════════════════════════════════════════
  // 1. NORMAL LOGIN (Mobile/Email + Password)
  // ══════════════════════════════════════════════════════════
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier.trim() || !loginPassword.trim()) {
      setErrorMsg('Please enter both your mobile number / email and password.');
      return;
    }
    setLoginLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/auth/patient/password-login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: loginIdentifier.trim(),
          password: loginPassword.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.needsActivation) {
          setErrorMsg('');
          const clean = data.phone || loginIdentifier.replace(/\D/g, '').slice(-10);
          setActivatePhone(clean);
          setAuthMode('activate');
          setSuccessMsg('This mobile number has not set a password yet. Please verify with Truecaller below to generate your password.');
          setLoginLoading(false);
          return;
        }
        setErrorMsg(data.error || 'Invalid credentials. Please verify your details.');
        setLoginLoading(false);
        return;
      }

      setReports(data.reports || []);
      setPatientName(data.patientName || '');
      setSessionToken(data.token || null);
      setStep('results');
    } catch {
      setErrorMsg('Network error. Please try again.');
    }
    setLoginLoading(false);
  };

  // ══════════════════════════════════════════════════════════
  // 2. FIRST-TIME ACTIVATION (Mobile -> Truecaller -> Password -> Direct Dashboard)
  // ══════════════════════════════════════════════════════════
  const handleInitiateActivation = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = activatePhone.replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length !== 10) {
      setErrorMsg('Please enter a valid 10-digit registered mobile number.');
      return;
    }

    setActivateLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // 1. Verify patient record exists in database by registered phone number
      const res = await fetch('/api/auth/patient/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify_record',
          phone: cleanPhone,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.alreadyActivated) {
          setErrorMsg('This account is already activated. Please login using your Mobile Number and Password.');
          setLoginIdentifier(cleanPhone);
          setAuthMode('login');
          setActivateLoading(false);
          return;
        }
        setErrorMsg(data.error || `No patient record found for mobile number "${cleanPhone}". Please check your registered number or contact the laboratory.`);
        setActivateLoading(false);
        return;
      }

      // 2. Trigger Truecaller Verification for confirmed mobile ownership
      const tcRes = await fetch('/api/auth/patient/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'truecaller_verify',
          patientId: data.patientId,
          phone: cleanPhone,
          payload: {
            phoneNumber: cleanPhone,
            name: data.patientName,
          },
        }),
      });

      const tcData = await tcRes.json();
      if (!tcRes.ok) {
        setErrorMsg(tcData.error || 'Truecaller verification failed. Please try again.');
        setActivateLoading(false);
        return;
      }

      setActivateRecord({
        patientId: data.patientId,
        patientName: data.patientName,
        phoneMasked: data.phoneMasked || cleanPhone.replace(/(\d{2})\d{6}(\d{2})/, '$1******$2'),
      });
      setIsTruecallerVerified(true);
      setSuccessMsg(`✓ Truecaller Verified: ${data.patientName}. Please generate your new password below.`);
    } catch {
      setErrorMsg('Network error during patient verification.');
    }
    setActivateLoading(false);
  };

  const handleCreatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activateRecord) return;

    if (activatePassword !== activateConfirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    const policy = validatePasswordPolicy(activatePassword);
    if (!policy.valid) {
      setErrorMsg(policy.errors[0] || 'Password does not meet requirements.');
      return;
    }

    setActivateLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/patient/activate', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_password',
          patientId: activateRecord.patientId,
          phone: activatePhone,
          password: activatePassword,
          confirmPassword: activateConfirmPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to create password.');
        setActivateLoading(false);
        return;
      }

      // DIRECT REPORT OPEN!
      setReports(data.reports || []);
      setPatientName(data.patientName || activateRecord.patientName);
      setSessionToken(data.token || null);
      setStep('results');
      setSuccessMsg(`Welcome, ${data.patientName || activateRecord.patientName}! Your diagnostic reports are now open.`);
    } catch {
      setErrorMsg('Network error while creating password.');
    }
    setActivateLoading(false);
  };

  // ══════════════════════════════════════════════════════════
  // 3. FORGOT PASSWORD & TRUECALLER RECOVERY
  // ══════════════════════════════════════════════════════════
  const handleInitiateRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotIdentifier.trim()) {
      setErrorMsg('Please enter your registered mobile number or email.');
      return;
    }

    setTruecallerLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/patient/recovery/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: forgotIdentifier.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Account not found.');
        setTruecallerLoading(false);
        return;
      }

      setRecoveryPatient({
        patientId: data.patientId,
        patientName: data.patientName,
        maskedPhone: data.maskedPhone,
      });
    } catch {
      setErrorMsg('Network error.');
    }
    setTruecallerLoading(false);
  };

  const handleTruecallerVerify = async () => {
    if (!recoveryPatient) return;
    setTruecallerLoading(true);
    setErrorMsg('');

    // Trigger Truecaller verification
    // Prompt patient to confirm their Truecaller phone number or integrate Truecaller Web SDK callback
    const inputPhone = prompt(
      `Verify with Truecaller:\nPlease enter your 10-digit mobile number linked to Truecaller for ${recoveryPatient.patientName}:`,
      forgotIdentifier.replace(/\D/g, '').slice(-10)
    );

    if (!inputPhone) {
      setTruecallerLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/patient/recovery/truecaller-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: recoveryPatient.patientId,
          payload: {
            phoneNumber: inputPhone,
            name: recoveryPatient.patientName,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Truecaller verification failed.');
        setTruecallerLoading(false);
        return;
      }

      setResetToken(data.resetToken);
      setAuthMode('truecaller_reset');
      setSuccessMsg('Identity Verified ✓ Please create your new strong password.');
    } catch {
      setErrorMsg('Verification failed due to a network error.');
    }
    setTruecallerLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetToken) return;

    if (newPassword !== confirmNewPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    const policy = validatePasswordPolicy(newPassword);
    if (!policy.valid) {
      setErrorMsg(policy.errors[0] || 'Password does not meet requirements.');
      return;
    }

    setResetLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/patient/recovery/reset-password', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resetToken,
          password: newPassword,
          confirmPassword: confirmNewPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Password reset failed.');
        setResetLoading(false);
        return;
      }

      setReports(data.reports || []);
      setPatientName(data.patientName || '');
      setSessionToken(data.token || null);
      setStep('results');
    } catch {
      setErrorMsg('Network error.');
    }
    setResetLoading(false);
  };

  const handleRequestAdminHelp = async () => {
    if (!recoveryPatient && !forgotIdentifier) return;
    setTruecallerLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/patient/recovery/request-admin-help', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: recoveryPatient?.patientId,
          phone: forgotIdentifier,
          name: recoveryPatient?.patientName,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setAdminHelpSuccess(true);
        setSuccessMsg(data.message || 'Help request submitted. Our team will contact you.');
      } else {
        setErrorMsg(data.error || 'Failed to submit help request.');
      }
    } catch {
      setErrorMsg('Network error.');
    }
    setTruecallerLoading(false);
  };

  // ══════════════════════════════════════════════════════════
  // 4. EMAIL OTP FLOW (Preserved)
  // ══════════════════════════════════════════════════════════
  const handleSendOTP = async () => {
    if (!otpEmail.trim()) { setErrorMsg('Please enter your email'); return; }
    setOtpLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/auth/patient/otp/send', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: otpEmail.trim(), type: 'report' }),
      });
      const data = await res.json();
      if (!res.ok) { setErrorMsg(data.error || 'Failed to send OTP'); setOtpLoading(false); return; }
      setOtpSent(true);
      setCooldown(60);
    } catch { setErrorMsg('Network error'); }
    setOtpLoading(false);
  };

  const handleVerifyOTP = async () => {
    if (!otpCode.trim()) { setErrorMsg('Please enter the OTP'); return; }
    setOtpLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/auth/patient/otp/verify', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: otpEmail.trim(), code: otpCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setErrorMsg(data.error || 'Invalid OTP'); setOtpLoading(false); return; }
      setReports(data.reports || []);
      setPatientName(data.patientName || '');
      setStep('results');
    } catch { setErrorMsg('Network error'); }
    setOtpLoading(false);
  };

  const reset = () => {
    document.cookie = 'session_token=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT;';
    setReports([]);
    setPatientName('');
    setSessionToken(null);
    setAuthMode('login');
    setErrorMsg('');
    setSuccessMsg('');
    setActivateRecord(null);
    setIsTruecallerVerified(false);
    setActivatePassword('');
    setActivateConfirmPassword('');
    setRecoveryPatient(null);
    setResetToken(null);
    setStep('auth');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
      case 'published':
      case 'report_ready':
      case 'uploaded':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'processing':
      case 'under_review':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  // Helper component for live password strength indication
  const renderPasswordMeter = (pwd: string) => {
    const p = validatePasswordPolicy(pwd);
    return (
      <div className="space-y-1.5 pt-1 text-[11px]">
        <div className="flex items-center justify-between text-gray-500 font-medium">
          <span>Password Strength:</span>
          <span className={`font-bold ${
            p.score >= 4 ? 'text-green-600' : p.score >= 3 ? 'text-amber-600' : 'text-red-500'
          }`}>
            {p.strengthLabel}
          </span>
        </div>
        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden flex gap-1">
          <div className={`h-full flex-1 rounded-full ${p.score >= 1 ? (p.score >= 3 ? 'bg-green-500' : 'bg-amber-500') : 'bg-gray-200'}`} />
          <div className={`h-full flex-1 rounded-full ${p.score >= 2 ? (p.score >= 3 ? 'bg-green-500' : 'bg-amber-500') : 'bg-gray-200'}`} />
          <div className={`h-full flex-1 rounded-full ${p.score >= 3 ? 'bg-green-500' : 'bg-gray-200'}`} />
          <div className={`h-full flex-1 rounded-full ${p.score >= 4 ? 'bg-green-600' : 'bg-gray-200'}`} />
        </div>
        <div className="grid grid-cols-2 gap-1 text-[10px] text-gray-500 mt-1">
          <span className={pwd.length >= 10 ? 'text-green-600 font-medium' : 'text-gray-400'}>✓ Min 10 characters</span>
          <span className={/[A-Z]/.test(pwd) ? 'text-green-600 font-medium' : 'text-gray-400'}>✓ Uppercase (A-Z)</span>
          <span className={/[a-z]/.test(pwd) ? 'text-green-600 font-medium' : 'text-gray-400'}>✓ Lowercase (a-z)</span>
          <span className={/[0-9]/.test(pwd) && /[!@#$%^&*(),.?":{}|<>\-_+=\[\]\\~`']/.test(pwd) ? 'text-green-600 font-medium' : 'text-gray-400'}>✓ Number & Symbol</span>
        </div>
      </div>
    );
  };

  return (
    <HomepageAnimations>
      <section className="relative bg-gradient-to-br from-[var(--navy)] via-[var(--navy-light)] to-[var(--navy)] overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-[var(--blue)] rounded-full blur-[160px] opacity-15 animate-morph" />
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-[var(--teal)] rounded-full blur-[180px] opacity-10 animate-morph" style={{ animationDelay: '4s' }} />
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
          <nav className="flex items-center gap-2 text-sm text-white/50 mb-6">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
            <span className="text-white/80">Diagnostic Reports</span>
          </nav>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3" style={{ fontFamily: 'var(--font-jakarta)' }}>
            Patient Portal & <span className="gradient-text">Reports</span>
          </h1>
          <p className="text-white/60 text-base max-w-xl">
            Secure, encrypted access to your clinical pathology and diagnostic reports.
          </p>
        </div>
      </section>

      <section className="py-16 lg:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Feedback messages */}
          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center justify-between">
              <span>{errorMsg}</span>
              <button onClick={() => setErrorMsg('')} className="text-red-500 font-bold ml-2">&times;</button>
            </div>
          )}
          {successMsg && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-800 flex items-center justify-between">
              <span>{successMsg}</span>
              <button onClick={() => setSuccessMsg('')} className="text-emerald-500 font-bold ml-2">&times;</button>
            </div>
          )}

          {step === 'auth' && (
            <div>
              {/* Top Navigation Tabs */}
              <div className="flex border-b border-gray-200 mb-8 overflow-x-auto">
                <button
                  onClick={() => { setAuthMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
                  className={`pb-3 px-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
                    authMode === 'login' ? 'border-blue text-blue' : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}
                >
                  Patient Login
                </button>
                <button
                  onClick={() => { setAuthMode('activate'); setErrorMsg(''); setSuccessMsg(''); }}
                  className={`pb-3 px-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                    authMode === 'activate' ? 'border-blue text-blue' : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <span>First-Time Activation</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue/10 text-blue font-bold uppercase">Truecaller</span>
                </button>
                <button
                  onClick={() => { setAuthMode('forgot'); setErrorMsg(''); setSuccessMsg(''); }}
                  className={`pb-3 px-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
                    authMode === 'forgot' || authMode === 'truecaller_reset' ? 'border-blue text-blue' : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}
                >
                  Forgot Password
                </button>
                <button
                  onClick={() => { setAuthMode('otp'); setErrorMsg(''); setSuccessMsg(''); }}
                  className={`pb-3 px-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
                    authMode === 'otp' ? 'border-blue text-blue' : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}
                >
                  Email OTP
                </button>
              </div>

              {/* ══════════════════════════════════════════════════════ */}
              {/* TAB 1: NORMAL LOGIN (Mobile / Email + Password) */}
              {/* ══════════════════════════════════════════════════════ */}
              {authMode === 'login' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="surface-elevated rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-sm">
                    <div className="w-12 h-12 rounded-xl bg-blue/10 flex items-center justify-center mb-4">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2" strokeLinecap="round">
                        <rect x="5" y="11" width="14" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1" style={{ fontFamily: 'var(--font-jakarta)' }}>Patient Sign In</h3>
                    <p className="text-xs text-gray-500 mb-5">Enter your registered mobile number or email and password.</p>

                    <form onSubmit={handlePasswordLogin} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wider">Mobile Number / Email</label>
                        <input
                          type="text"
                          value={loginIdentifier}
                          onChange={(e) => setLoginIdentifier(e.target.value)}
                          placeholder="e.g. 7742735762 or name@example.com"
                          required
                          className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">Password</label>
                          <button
                            type="button"
                            onClick={() => { setAuthMode('forgot'); setErrorMsg(''); }}
                            className="text-xs text-blue hover:underline font-medium"
                          >
                            Forgot Password?
                          </button>
                        </div>
                        <input
                          type="password"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder="Enter your password"
                          required
                          className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loginLoading}
                        className="w-full py-2.5 px-4 bg-blue hover:bg-blue-dark text-white font-semibold rounded-lg text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                      >
                        {loginLoading ? 'Authenticating...' : 'Sign In & View Reports →'}
                      </button>

                      <div className="text-center pt-2">
                        <button
                          type="button"
                          onClick={() => { setAuthMode('activate'); setErrorMsg(''); setSuccessMsg(''); }}
                          className="inline-flex items-center gap-1.5 text-xs text-blue hover:text-blue-dark font-semibold py-2 px-3 rounded-lg bg-blue/5 hover:bg-blue/10 transition-colors"
                        >
                          <span>⚡ First time accessing reports?</span>
                          <span className="underline">Verify with Truecaller & Set Password</span>
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* SSO Card */}
                  <div className="surface-elevated rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center mb-4">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round">
                          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                          <circle cx="8.5" cy="7" r="4" />
                          <polyline points="17 11 19 13 23 9" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-1" style={{ fontFamily: 'var(--font-jakarta)' }}>Continue with SSO</h3>
                      <p className="text-xs text-gray-500 mb-6">Access your reports seamlessly using Zenuxs Single Sign-On or verified Email OTP.</p>

                      <div className="space-y-3">
                        <button
                          onClick={() => setAuthMode('oauth')}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-black transition-colors shadow-sm"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 8v8m-4-4h8" />
                          </svg>
                          Sign in with Zenuxs SSO
                        </button>

                        <button
                          onClick={() => setAuthMode('otp')}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                            <polyline points="22,6 12,13 2,6" />
                          </svg>
                          Sign in with Email OTP
                        </button>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-100 text-xs text-gray-400">
                      Protected by 256-bit SSL encryption. Only authorized medical records for your verified account will be displayed.
                    </div>
                  </div>
                </div>
              )}

              {/* ══════════════════════════════════════════════════════ */}
              {/* TAB 2: FIRST-TIME PATIENT ACTIVATION (TRUECALLER)     */}
              {/* ══════════════════════════════════════════════════════ */}
              {authMode === 'activate' && (
                <div className="max-w-xl mx-auto surface-elevated rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-sm">
                  {!isTruecallerVerified || !activateRecord ? (
                    <div>
                      <div className="w-12 h-12 rounded-xl bg-blue/10 flex items-center justify-center mb-4">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2" strokeLinecap="round">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-jakarta)' }}>First-Time Patient Activation</h3>
                        <span className="text-[10px] px-2 py-0.5 bg-blue text-white rounded-full font-bold uppercase tracking-wider">Truecaller</span>
                      </div>
                      <p className="text-xs text-gray-500 mb-6">
                        Enter your registered 10-digit mobile number. We will verify your identity with Truecaller and help you create your new password to view your reports directly.
                      </p>

                      <form onSubmit={handleInitiateActivation} className="space-y-5">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
                            Registered Mobile Number *
                          </label>
                          <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-sm">
                              🇮🇳 +91
                            </span>
                            <input
                              type="tel"
                              value={activatePhone}
                              onChange={(e) => setActivatePhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                              placeholder="Enter 10-digit number (e.g. 7742735762)"
                              maxLength={10}
                              required
                              className="w-full pl-20 pr-4 py-3 rounded-xl border border-gray-300 text-base tracking-wide font-medium focus:outline-none focus:ring-2 focus:ring-blue"
                            />
                          </div>
                          <p className="text-[11px] text-gray-400 mt-1">
                            Use the mobile number provided during your lab test registration. No Patient ID needed.
                          </p>
                        </div>

                        <button
                          type="submit"
                          disabled={activateLoading || activatePhone.length !== 10}
                          className="w-full py-3.5 px-4 bg-blue hover:bg-blue-dark text-white font-bold rounded-xl text-sm transition-colors disabled:opacity-50 shadow-sm flex items-center justify-center gap-2"
                        >
                          {activateLoading ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>Verifying with Truecaller...</span>
                            </>
                          ) : (
                            <span>⚡ Verify with Truecaller & Activate →</span>
                          )}
                        </button>

                        <div className="pt-2 text-center">
                          <button
                            type="button"
                            onClick={() => { setAuthMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
                            className="text-xs text-gray-500 hover:text-blue"
                          >
                            Already have a password? <span className="text-blue font-bold">Sign In here</span>
                          </button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <div>
                      {/* Step 2: Create Password once Truecaller is Verified */}
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-lg shrink-0">
                            ✓
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide">Identity Verified via Truecaller</span>
                              <span className="text-[10px] px-1.5 py-0.5 bg-emerald-200 text-emerald-900 rounded font-bold uppercase">Authorized</span>
                            </div>
                            <h4 className="text-base font-bold text-gray-900">{activateRecord.patientName}</h4>
                            <p className="text-xs text-gray-600 font-mono">Mobile: {activateRecord.phoneMasked}</p>
                          </div>
                        </div>
                      </div>

                      <h3 className="text-xl font-bold text-gray-900 mb-1" style={{ fontFamily: 'var(--font-jakarta)' }}>Generate New Password</h3>
                      <p className="text-xs text-gray-500 mb-5">
                        Set a secure password. Once saved, your diagnostic reports dashboard will open directly!
                      </p>

                      <form onSubmit={handleCreatePassword} className="space-y-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wider">New Password *</label>
                          <input
                            type="password"
                            value={activatePassword}
                            onChange={(e) => setActivatePassword(e.target.value)}
                            placeholder="Enter minimum 10 characters"
                            required
                            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
                          />
                          {activatePassword && renderPasswordMeter(activatePassword)}
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wider">Confirm New Password *</label>
                          <input
                            type="password"
                            value={activateConfirmPassword}
                            onChange={(e) => setActivateConfirmPassword(e.target.value)}
                            placeholder="Re-enter your password"
                            required
                            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={activateLoading}
                          className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-colors disabled:opacity-50 shadow-sm flex items-center justify-center gap-2"
                        >
                          {activateLoading ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>Saving Password & Opening Reports...</span>
                            </>
                          ) : (
                            '🔐 Set Password & Open My Reports Dashboard →'
                          )}
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              )}

              {/* ══════════════════════════════════════════════════════ */}
              {/* TAB 3: FORGOT PASSWORD (Truecaller + Admin Recovery) */}
              {/* ══════════════════════════════════════════════════════ */}
              {authMode === 'forgot' && (
                <div className="max-w-xl mx-auto surface-elevated rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-sm">
                  {!recoveryPatient ? (
                    <div>
                      <div className="w-12 h-12 rounded-xl bg-blue/10 flex items-center justify-center mb-4">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2" strokeLinecap="round">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-1" style={{ fontFamily: 'var(--font-jakarta)' }}>Reset Account Password</h3>
                      <p className="text-xs text-gray-500 mb-6">Enter your registered mobile number or email to begin recovery.</p>

                      <form onSubmit={handleInitiateRecovery} className="space-y-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wider">Registered Mobile Number / Email</label>
                          <input
                            type="text"
                            value={forgotIdentifier}
                            onChange={(e) => setForgotIdentifier(e.target.value)}
                            placeholder="e.g. 7742735762"
                            required
                            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={truecallerLoading}
                          className="w-full py-2.5 px-4 bg-blue hover:bg-blue-dark text-white font-semibold rounded-lg text-sm transition-colors disabled:opacity-50 shadow-sm"
                        >
                          {truecallerLoading ? 'Finding Account...' : 'Continue to Verification →'}
                        </button>
                      </form>
                    </div>
                  ) : (
                    <div>
                      <div className="bg-blue/5 border border-blue/20 rounded-xl p-4 mb-6">
                        <span className="text-xs text-gray-500">Account Found</span>
                        <h4 className="text-sm font-bold text-gray-900">{recoveryPatient.patientName}</h4>
                        <p className="text-xs text-gray-600">Registered Number: {recoveryPatient.maskedPhone}</p>
                      </div>

                      <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">Choose Verification Method</h4>

                      <div className="space-y-3">
                        {/* Primary: Truecaller Verification */}
                        <button
                          onClick={handleTruecallerVerify}
                          disabled={truecallerLoading}
                          className="w-full p-4 rounded-xl border-2 border-blue bg-blue/5 hover:bg-blue/10 text-left transition-colors flex items-center justify-between"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-blue" />
                              <span className="text-sm font-bold text-blue">Verify with Truecaller</span>
                              <span className="text-[10px] px-1.5 py-0.5 bg-blue text-white rounded font-bold uppercase">Instant</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              Fast identity verification using your verified Truecaller mobile profile.
                            </p>
                          </div>
                          <svg className="w-5 h-5 text-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>

                        {/* Secondary: Admin Assisted */}
                        <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-700">Truecaller verification unavailable?</span>
                          </div>
                          <p className="text-xs text-gray-500">
                            Our laboratory administration team can verify your identity and issue a secure temporary password.
                          </p>

                          {adminHelpSuccess ? (
                            <div className="p-2.5 bg-emerald-100 text-emerald-800 text-xs rounded-lg font-medium">
                              Help request submitted. Please call our desk at <strong>0141-2345678</strong> or WhatsApp <strong>+91 77427 35762</strong>.
                            </div>
                          ) : (
                            <button
                              onClick={handleRequestAdminHelp}
                              disabled={truecallerLoading}
                              className="text-xs px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium"
                            >
                              Request Laboratory Password Assistance
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ══════════════════════════════════════════════════════ */}
              {/* TAB 3B: TRUECALLER SUCCESS & CREATE NEW PASSWORD */}
              {/* ══════════════════════════════════════════════════════ */}
              {authMode === 'truecaller_reset' && (
                <div className="max-w-xl mx-auto surface-elevated rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-sm">
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3">
                    <svg className="w-6 h-6 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <h4 className="text-sm font-bold text-green-900">Identity Verified ✓</h4>
                      <p className="text-xs text-green-700">Truecaller verified your phone successfully. You may now create a new password.</p>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 mb-1" style={{ fontFamily: 'var(--font-jakarta)' }}>Create New Password</h3>
                  <p className="text-xs text-gray-500 mb-4">Set your new password according to laboratory security guidelines.</p>

                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wider">New Password *</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimum 10 characters"
                        required
                        className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
                      />
                      {newPassword && renderPasswordMeter(newPassword)}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wider">Confirm New Password *</label>
                      <input
                        type="password"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        required
                        className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={resetLoading}
                      className="w-full py-2.5 px-4 bg-blue hover:bg-blue-dark text-white font-semibold rounded-lg text-sm transition-colors disabled:opacity-50 shadow-sm"
                    >
                      {resetLoading ? 'Resetting Password...' : 'Reset Password & View Reports →'}
                    </button>
                  </form>
                </div>
              )}

              {/* ══════════════════════════════════════════════════════ */}
              {/* TAB 4: EMAIL OTP (Preserved) */}
              {/* ══════════════════════════════════════════════════════ */}
              {authMode === 'otp' && (
                <div className="max-w-md mx-auto surface-elevated rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-1" style={{ fontFamily: 'var(--font-jakarta)' }}>Sign In with Email OTP</h3>
                  <p className="text-xs text-gray-500 mb-4">We will send a one-time verification code to your email.</p>

                  {!otpSent ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wider">Registered Email</label>
                        <input
                          type="email"
                          value={otpEmail}
                          onChange={(e) => setOtpEmail(e.target.value)}
                          placeholder="name@example.com"
                          className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
                          onKeyDown={(e) => e.key === 'Enter' && handleSendOTP()}
                        />
                      </div>
                      <button
                        onClick={handleSendOTP}
                        disabled={otpLoading}
                        className="w-full py-2.5 bg-blue text-white rounded-lg text-sm font-semibold hover:bg-blue-dark disabled:opacity-50 transition-colors shadow-sm"
                      >
                        {otpLoading ? 'Sending...' : 'Send Verification OTP'}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-xs text-gray-600">OTP sent to <strong>{otpEmail}</strong></p>
                      <input
                        type="text"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000"
                        maxLength={6}
                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-center tracking-[0.4em] font-mono text-base focus:outline-none focus:ring-2 focus:ring-blue"
                        onKeyDown={(e) => e.key === 'Enter' && handleVerifyOTP()}
                      />
                      <button
                        onClick={handleVerifyOTP}
                        disabled={otpLoading}
                        className="w-full py-2.5 bg-blue text-white rounded-lg text-sm font-semibold hover:bg-blue-dark disabled:opacity-50 transition-colors shadow-sm"
                      >
                        {otpLoading ? 'Verifying...' : 'Verify OTP & View Reports'}
                      </button>
                      <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                        <button onClick={() => setOtpSent(false)} className="hover:underline">Change email</button>
                        <button onClick={handleSendOTP} disabled={cooldown > 0} className="text-blue font-medium disabled:text-gray-400">
                          {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ══════════════════════════════════════════════════════ */}
              {/* TAB 5: ZENUXS SSO (Preserved) */}
              {/* ══════════════════════════════════════════════════════ */}
              {authMode === 'oauth' && (
                <div className="max-w-md mx-auto surface-elevated rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-sm">
                  <button
                    onClick={() => setAuthMode('login')}
                    className="mb-4 text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                  >
                    &larr; Back to Login
                  </button>
                  <ZenuxsAuth
                    innerRef={authRef}
                    clientId={process.env.NEXT_PUBLIC_ZENUXS_CLIENT_ID || '4874ff27aff3ed59'}
                    scope="openid profile email"
                    theme="light"
                    height="380px"
                    autoRedirect="false"
                  />
                </div>
              )}
            </div>
          )}

          {step === 'loading' && (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-3 border-blue border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════ */}
          {/* STEP 3: RESULTS (Authenticated Patient's Reports) */}
          {/* ══════════════════════════════════════════════════════════ */}
          {step === 'results' && (
            <div className="reveal">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-[var(--navy)]" style={{ fontFamily: 'var(--font-jakarta)' }}>
                    {patientName ? `${patientName}'s Reports` : 'Your Reports'} ({reports.length})
                  </h2>
                  <p className="text-xs text-gray-500">Only authorized reports for your verified account are displayed</p>
                </div>
                <button
                  onClick={reset}
                  className="text-sm font-semibold text-[var(--blue)] hover:text-[var(--blue-light)] transition-colors flex items-center gap-1"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
                  Sign Out
                </button>
              </div>

              {reports.length === 0 ? (
                <div className="text-center py-16 surface-elevated rounded-2xl border border-gray-200">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--gray-400)" strokeWidth="1.5" strokeLinecap="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">No Reports Available Yet</h3>
                  <p className="text-sm text-gray-500 mb-6">When your diagnostic tests are completed and published, they will automatically appear here.</p>
                  <button onClick={reset} className="px-5 py-2.5 bg-blue text-white rounded-xl text-sm font-medium hover:bg-blue-dark">
                    Back to Portal
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {reports.map((report) => (
                    <div key={report.id} className="surface-elevated rounded-2xl p-5 sm:p-6 border border-gray-200 flex flex-col sm:flex-row sm:items-center gap-4 justify-between shadow-sm">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-blue/10 flex items-center justify-center shrink-0">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2" strokeLinecap="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-gray-900 text-sm truncate">{report.testName}</h3>
                          <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-gray-500">
                            {report.bookingId && <span className="font-mono">#{report.bookingId}</span>}
                            <span>&bull;</span>
                            <span>{new Date(report.reportDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            <span>&bull;</span>
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getStatusColor(report.status)}`}>
                              {report.status.replace('_', ' ')}
                            </span>
                            {report.analysisData?.abnormalCount > 0 && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded">
                                {report.analysisData.abnormalCount} Abnormal
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 sm:shrink-0">
                        <button
                          onClick={async () => {
                            try {
                              const res = await fetch(`/api/reports/secure/${report.id}`, {
                                headers: sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {},
                                credentials: 'include',
                              });
                              const data = await res.json();
                              if (data.report?.tempUrl) window.open(data.report.tempUrl, '_blank');
                              else if (data.error) alert(data.error);
                            } catch { alert('Failed to open report'); }
                          }}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue/10 text-blue text-xs font-semibold hover:bg-blue/20 transition-colors"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                          View Report
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              const res = await fetch(`/api/reports/secure/${report.id}`, {
                                headers: sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {},
                                credentials: 'include',
                              });
                              const data = await res.json();
                              if (data.report?.tempUrl) {
                                const a = document.createElement('a');
                                a.href = data.report.tempUrl;
                                a.download = report.fileName || 'report.pdf';
                                a.click();
                              } else if (data.error) alert(data.error);
                            } catch { alert('Failed to download report'); }
                          }}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-50 text-teal-700 text-xs font-semibold hover:bg-teal-100 transition-colors"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                          Download
                        </button>
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
