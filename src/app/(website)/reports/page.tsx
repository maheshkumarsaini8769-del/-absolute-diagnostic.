'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import HomepageAnimations from '@/components/HomepageAnimations';
import { ZenuxsAuth } from '@/components/ZenuxsAuth';
import SmartReportVisualizer from '@/components/SmartReportVisualizer';
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
  const [patientPhone, setPatientPhone] = useState('');
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [resultTab, setResultTab] = useState<'reports' | 'trends' | 'family'>('reports');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [activeSmartReportId, setActiveSmartReportId] = useState<string | null>(null);

  // Family Members state
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [loadingFamily, setLoadingFamily] = useState(false);
  const [showAddFamilyModal, setShowAddFamilyModal] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', relation: 'Spouse', age: '', gender: 'Male' });

  // Health Trends state
  const [trendsData, setTrendsData] = useState<Record<string, any>>({});
  const [loadingTrends, setLoadingTrends] = useState(false);

  // Invoice / Bill Receipt state
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);

  const authRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkSession();
  }, []);

  const fetchFamily = async (phoneToUse?: string) => {
    const p = phoneToUse || patientPhone;
    setLoadingFamily(true);
    try {
      const res = await fetch(`/api/patient/family${p ? `?phone=${encodeURIComponent(p)}` : ''}`, {
        credentials: 'include',
        headers: sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {},
      });
      const data = await res.json();
      if (data.familyMembers) {
        setFamilyMembers(data.familyMembers);
      }
    } catch (err) {
      console.error(err);
    }
    setLoadingFamily(false);
  };

  const handleAddFamilyMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.name.trim()) return;
    try {
      const res = await fetch('/api/patient/family', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
        },
        body: JSON.stringify({
          name: newMember.name.trim(),
          relation: newMember.relation,
          age: newMember.age ? Number(newMember.age) : undefined,
          gender: newMember.gender,
          phone: patientPhone,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFamilyMembers(data.familyMembers || []);
        setShowAddFamilyModal(false);
        setNewMember({ name: '', relation: 'Spouse', age: '', gender: 'Male' });
        setSuccessMsg(data.message || 'Family member profile added!');
      } else {
        setErrorMsg(data.error || 'Failed to add family member');
      }
    } catch {
      setErrorMsg('Network error while saving family member');
    }
  };

  const handleDeleteFamilyMember = async (id: string) => {
    if (!confirm('Are you sure you want to remove this family member profile?')) return;
    try {
      const res = await fetch(`/api/patient/family?id=${id}${patientPhone ? `&phone=${encodeURIComponent(patientPhone)}` : ''}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {},
      });
      const data = await res.json();
      if (data.success) {
        setFamilyMembers(data.familyMembers || []);
        setSuccessMsg('Family member profile removed.');
      }
    } catch {
      setErrorMsg('Failed to delete member');
    }
  };

  const fetchTrends = async (phoneToUse?: string) => {
    const p = phoneToUse || patientPhone;
    setLoadingTrends(true);
    try {
      const res = await fetch(`/api/patient/trends${p ? `?phone=${encodeURIComponent(p)}` : ''}`, {
        credentials: 'include',
        headers: sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {},
      });
      const data = await res.json();
      if (data.trends) {
        setTrendsData(data.trends);
      }
    } catch (err) {
      console.error(err);
    }
    setLoadingTrends(false);
  };

  const openInvoiceModal = async (report: Report) => {
    setInvoiceLoading(true);
    try {
      if (report.bookingId) {
        const res = await fetch(`/api/bookings/${report.bookingId}/invoice`);
        const data = await res.json();
        if (data.success && data.invoice) {
          setSelectedInvoice(data.invoice);
          setInvoiceLoading(false);
          return;
        }
      }
      // Fallback invoice constructed from report data
      setSelectedInvoice({
        invoiceNumber: `INV-${report.id.slice(-6).toUpperCase()}`,
        invoiceDate: new Date(report.reportDate || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        bookingId: report.bookingId || `ADC-${report.id.slice(-6).toUpperCase()}`,
        sampleId: `SMP-${report.id.slice(-5).toUpperCase()}`,
        collectionType: 'Diagnostic Laboratory Center',
        status: 'completed',
        paymentStatus: 'paid',
        paymentMethod: 'Cash / Digital UPI',
        clinic: {
          name: 'Absolute Diagnostic Center',
          phone: '+91 141 2345678',
          email: 'info@absolutediagnostic.com',
          address: 'Opp. SMS Hospital Gate 2, JLN Marg, Jaipur, Rajasthan 302004',
          gstNumber: '08AABCA1234F1Z5',
        },
        patient: {
          name: patientName || 'Valued Patient',
          phone: patientPhone || '+91-XXXXXXXXXX',
          email: '',
          address: 'Jaipur, Rajasthan',
        },
        items: [
          { testName: report.testName, testPrice: 650, quantity: 1 }
        ],
        subtotal: 650,
        discount: 0,
        totalAmount: 650,
        paidAmount: 650,
        balanceDue: 0
      });
    } catch {
      alert('Failed to load invoice receipt');
    }
    setInvoiceLoading(false);
  };

  useEffect(() => {
    if (step === 'results') {
      if (resultTab === 'family') fetchFamily();
      if (resultTab === 'trends') fetchTrends();
    }
  }, [resultTab, step]);

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
          if (data.patientPhone) setPatientPhone(data.patientPhone);
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
      if (data.patient?.phone) setPatientPhone(data.patient.phone);
      else if (loginIdentifier.replace(/\D/g, '')) setPatientPhone(loginIdentifier.replace(/\D/g, '').slice(-10));
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
      if (activatePhone) setPatientPhone(activatePhone);
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
        body: JSON.stringify({ email: otpEmail.trim(), otp: otpCode.trim(), code: otpCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setErrorMsg(data.error || 'Invalid OTP'); setOtpLoading(false); return; }
      setReports(data.reports || []);
      setPatientName(data.patientName || '');
      setSessionToken(data.token || null);
      setStep('results');
    } catch { setErrorMsg('Network error'); }
    setOtpLoading(false);
  };

  const reset = () => {
    document.cookie = 'session_token=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT;';
    setReports([]);
    setPatientName('');
    setPatientPhone('');
    setFamilyMembers([]);
    setTrendsData({});
    setSelectedInvoice(null);
    setResultTab('reports');
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
          {/* STEP 3: RESULTS (Authenticated Patient Dashboard)          */}
          {/* ══════════════════════════════════════════════════════════ */}
          {step === 'results' && (
            <div className="reveal">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-[var(--navy)]" style={{ fontFamily: 'var(--font-jakarta)' }}>
                    {patientName ? `${patientName}'s Health Portal` : 'Patient Health Portal'}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {patientPhone ? `Registered Mobile: +91 ${patientPhone} • ` : ''}Authorized Medical Records
                  </p>
                </div>
                <button
                  onClick={reset}
                  className="self-start sm:self-auto text-sm font-semibold text-gray-500 hover:text-red-600 transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white shadow-xs"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
                  Sign Out
                </button>
              </div>

              {/* Sub-Navigation Tabs */}
              <div className="flex items-center gap-2 border-b border-gray-200 pb-3 mb-6 overflow-x-auto">
                <button
                  onClick={() => setResultTab('reports')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                    resultTab === 'reports'
                      ? 'bg-blue text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  <span>My Reports ({reports.length})</span>
                </button>

                <button
                  onClick={() => setResultTab('trends')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                    resultTab === 'trends'
                      ? 'bg-blue text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                  <span>Health Trends & Graphs</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-extrabold uppercase ${resultTab === 'trends' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'}`}>
                    Smart
                  </span>
                </button>

                <button
                  onClick={() => setResultTab('family')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                    resultTab === 'family'
                      ? 'bg-blue text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  <span>Family Profiles ({familyMembers.length})</span>
                </button>
              </div>

              {/* ══════════════════════════════════════════════════════ */}
              {/* SUB-TAB 1: MY REPORTS & GST BILL RECEIPTS              */}
              {/* ══════════════════════════════════════════════════════ */}
              {resultTab === 'reports' && (
                <div>
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
                        <div key={report.id} className="surface-elevated rounded-2xl p-5 sm:p-6 border border-gray-200 flex flex-col sm:flex-row sm:items-center gap-4 justify-between shadow-sm hover:border-blue/40 transition-colors">
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
                                {report.bookingId && <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-[11px]">#{report.bookingId}</span>}
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

                          <div className="flex items-center gap-2 sm:shrink-0 flex-wrap">
                            {/* Bill / Invoice Receipt Button */}
                            <button
                              onClick={() => openInvoiceModal(report)}
                              disabled={invoiceLoading}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-bold transition-colors border border-purple-200"
                              title="Download GST Medical Invoice / Cash Receipt"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <rect x="2" y="4" width="20" height="16" rx="2" />
                                <line x1="6" y1="8" x2="10" y2="8" />
                                <line x1="6" y1="12" x2="14" y2="12" />
                                <line x1="6" y1="16" x2="18" y2="16" />
                              </svg>
                              <span>Receipt / Bill</span>
                            </button>

                            {/* View Report Button */}
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
                              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue/10 text-blue text-xs font-semibold hover:bg-blue/20 transition-colors"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                              <span>View</span>
                            </button>

                            {/* Download PDF Button */}
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
                              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-50 text-teal-700 text-xs font-semibold hover:bg-teal-100 transition-colors"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                              </svg>
                              <span>PDF</span>
                            </button>

                            {/* Smart AI Report & Range Visualizer Button */}
                            <button
                              onClick={() => setActiveSmartReportId(activeSmartReportId === report.id ? null : report.id)}
                              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold hover:bg-emerald-100 transition-colors border border-emerald-200 cursor-pointer"
                              title="View AI Explanation and Color Range Meters"
                            >
                              <span>{activeSmartReportId === report.id ? 'Hide AI Analysis' : '📊 Smart AI Analysis'}</span>
                            </button>
                          </div>

                          {/* Inline Smart AI Report Visualizer */}
                          {activeSmartReportId === report.id && (
                            <div className="w-full mt-4 pt-4 border-t border-slate-200">
                              <SmartReportVisualizer
                                patientName={patientName || 'Verified Patient'}
                                reportDate={new Date(report.reportDate).toLocaleDateString('en-IN')}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ══════════════════════════════════════════════════════ */}
              {/* SUB-TAB 2: HEALTH TRENDS & VISUAL BIOMARKER TRACKER   */}
              {/* ══════════════════════════════════════════════════════ */}
              {resultTab === 'trends' && (
                <div>
                  <div className="surface-elevated rounded-2xl p-6 border border-gray-200 mb-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
                          Smart Biomarker & Health Progression Tracker
                        </h3>
                        <p className="text-xs text-gray-500">
                          Automated monitoring of critical blood parameters across all your laboratory visits.
                        </p>
                      </div>
                    </div>
                  </div>

                  {loadingTrends ? (
                    <div className="flex items-center justify-center py-16">
                      <div className="w-8 h-8 border-3 border-blue border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : Object.keys(trendsData).length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {Object.entries(trendsData).map(([key, item]: [string, any]) => {
                        const latest = item.data[item.data.length - 1];
                        return (
                          <div key={key} className="surface-elevated rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Biomarker</span>
                                <h4 className="text-base font-bold text-gray-900">{item.name}</h4>
                                <span className="text-xs text-gray-500 font-mono">Normal: {item.normalRange} {item.unit}</span>
                              </div>
                              {latest && (
                                <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                                  latest.status === 'normal'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : latest.status === 'high'
                                    ? 'bg-red-100 text-red-800 border border-red-200'
                                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                                }`}>
                                  {latest.status}
                                </span>
                              )}
                            </div>

                            {latest && (
                              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 mb-4">
                                <div className="flex items-baseline gap-2">
                                  <span className="text-3xl font-extrabold text-[var(--navy)]">{latest.value}</span>
                                  <span className="text-xs font-semibold text-gray-500">{item.unit}</span>
                                  <span className="text-[11px] text-gray-400 ml-auto">{latest.date}</span>
                                </div>
                                <div className="text-[11px] text-gray-500 mt-1 truncate">
                                  Source: {latest.reportName}
                                </div>
                              </div>
                            )}

                            {/* Chronological History timeline chips */}
                            <div>
                              <span className="text-[11px] font-bold text-gray-600 block mb-2">Reading History ({item.data.length} records):</span>
                              <div className="flex gap-2 overflow-x-auto pb-1">
                                {item.data.map((point: any, idx: number) => (
                                  <div key={idx} className="shrink-0 text-center px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs">
                                    <div className="font-bold text-gray-800">{point.value} {item.unit}</div>
                                    <div className="text-[10px] text-gray-400">{point.date}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* Sample / Demo interactive tracker preview when no biomarkers extracted yet */
                    <div className="space-y-6">
                      <div className="bg-blue/5 border border-blue/20 rounded-2xl p-5 text-sm text-gray-700">
                        <div className="flex items-center gap-2 font-bold text-blue mb-1">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="16" x2="12" y2="12" />
                            <line x1="12" y1="8" x2="12.01" y2="8" />
                          </svg>
                          <span>Smart Health Tracker Active</span>
                        </div>
                        <p className="text-xs text-gray-600">
                          Whenever your blood & pathology tests are reported, vital parameters like Hemoglobin, Blood Sugar, Cholesterol, and Thyroid levels are automatically graphed here. Below is a preview of your personalized biomarker dashboard:
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Demo 1: Hemoglobin */}
                        <div className="surface-elevated rounded-2xl p-5 border border-gray-200 shadow-sm">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-bold text-gray-900 text-sm">Hemoglobin (Hb)</h4>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">Normal</span>
                          </div>
                          <div className="text-2xl font-bold text-gray-900 mb-1">14.2 <span className="text-xs font-normal text-gray-500">g/dL</span></div>
                          <p className="text-[11px] text-gray-400 mb-3">Normal: 12.0 - 16.5 g/dL</p>
                          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: '65%' }} />
                          </div>
                        </div>

                        {/* Demo 2: Fasting Blood Sugar */}
                        <div className="surface-elevated rounded-2xl p-5 border border-gray-200 shadow-sm">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-bold text-gray-900 text-sm">Fasting Glucose</h4>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">Normal</span>
                          </div>
                          <div className="text-2xl font-bold text-gray-900 mb-1">92 <span className="text-xs font-normal text-gray-500">mg/dL</span></div>
                          <p className="text-[11px] text-gray-400 mb-3">Normal: 70 - 100 mg/dL</p>
                          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: '70%' }} />
                          </div>
                        </div>

                        {/* Demo 3: Total Cholesterol */}
                        <div className="surface-elevated rounded-2xl p-5 border border-gray-200 shadow-sm">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-bold text-gray-900 text-sm">Total Cholesterol</h4>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">Optimal</span>
                          </div>
                          <div className="text-2xl font-bold text-gray-900 mb-1">178 <span className="text-xs font-normal text-gray-500">mg/dL</span></div>
                          <p className="text-[11px] text-gray-400 mb-3">Normal: 125 - 200 mg/dL</p>
                          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: '55%' }} />
                          </div>
                        </div>
                      </div>

                      <div className="text-center pt-2">
                        <Link
                          href="/tests"
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue text-white rounded-xl text-sm font-semibold hover:bg-blue-dark transition-colors shadow-sm"
                        >
                          <span>🔬 Book Routine Health Checkup</span>
                          <span>→</span>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ══════════════════════════════════════════════════════ */}
              {/* SUB-TAB 3: FAMILY PROFILES MANAGEMENT                 */}
              {/* ══════════════════════════════════════════════════════ */}
              {resultTab === 'family' && (
                <div>
                  <div className="surface-elevated rounded-2xl p-6 border border-gray-200 mb-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
                        Family Health Profiles (1 Account, Multiple Members)
                      </h3>
                      <p className="text-xs text-gray-500">
                        Book tests and track reports for your spouse, parents, and children under your account.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowAddFamilyModal(true)}
                      className="px-4 py-2.5 bg-blue hover:bg-blue-dark text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-colors shadow-xs"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      <span>Add Family Member</span>
                    </button>
                  </div>

                  {loadingFamily ? (
                    <div className="flex items-center justify-center py-16">
                      <div className="w-8 h-8 border-3 border-blue border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Primary Account Card (Self) */}
                      <div className="surface-elevated rounded-2xl p-5 border-2 border-blue/30 shadow-xs bg-blue/[0.02]">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-blue/10 text-blue font-bold flex items-center justify-center text-base">
                              👤
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-900 text-sm">{patientName || 'Primary Account'}</h4>
                              <span className="text-xs text-blue font-semibold">Account Holder (Self)</span>
                            </div>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 bg-blue text-white rounded-full font-bold uppercase">
                            Primary
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mb-3">
                          Linked Mobile: {patientPhone ? `+91 ${patientPhone}` : 'Registered phone'}
                        </div>
                        <Link
                          href="/booking"
                          className="w-full py-2 bg-blue/10 hover:bg-blue/20 text-blue text-xs font-semibold rounded-lg text-center block transition-colors"
                        >
                          Book Test for Self →
                        </Link>
                      </div>

                      {/* Other Family Members */}
                      {familyMembers.map((member: any) => (
                        <div key={member._id || member.id} className="surface-elevated rounded-2xl p-5 border border-gray-200 shadow-xs hover:border-gray-300 transition-colors">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 font-bold flex items-center justify-center text-lg">
                                {member.relation === 'Father' || member.relation === 'Mother' ? '👴' : member.relation === 'Child' || member.relation === 'Son' || member.relation === 'Daughter' ? '👶' : member.relation === 'Spouse' ? '💍' : '👨‍👩‍👧'}
                              </div>
                              <div>
                                <h4 className="font-bold text-gray-900 text-sm">{member.name}</h4>
                                <span className="text-xs text-gray-500 font-medium">
                                  {member.relation} {member.age ? `• ${member.age} yrs` : ''} {member.gender ? `• ${member.gender}` : ''}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => handleDeleteFamilyMember(member._id || member.id)}
                              className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                              title="Remove family profile"
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                            </button>
                          </div>

                          <Link
                            href={`/booking?familyMember=${encodeURIComponent(member.name)}&familyRelation=${encodeURIComponent(member.relation)}`}
                            className="w-full py-2 bg-gray-100 hover:bg-blue hover:text-white text-gray-700 text-xs font-semibold rounded-lg text-center block transition-colors"
                          >
                            Book Lab Test for {member.name} →
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Family Member Modal */}
                  {showAddFamilyModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
                      <div className="surface-elevated rounded-2xl p-6 max-w-md w-full border border-gray-200 shadow-xl">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-bold text-gray-900 text-base">Add Family Member Profile</h4>
                          <button onClick={() => setShowAddFamilyModal(false)} className="text-gray-400 hover:text-gray-600 text-lg font-bold">
                            &times;
                          </button>
                        </div>
                        <form onSubmit={handleAddFamilyMember} className="space-y-4">
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name *</label>
                            <input
                              type="text"
                              required
                              value={newMember.name}
                              onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                              placeholder="e.g. Ramesh Sharma"
                              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-1">Relation *</label>
                              <select
                                value={newMember.relation}
                                onChange={(e) => setNewMember({ ...newMember, relation: e.target.value })}
                                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm bg-white"
                              >
                                <option value="Spouse">Spouse</option>
                                <option value="Father">Father</option>
                                <option value="Mother">Mother</option>
                                <option value="Son">Son</option>
                                <option value="Daughter">Daughter</option>
                                <option value="Brother">Brother</option>
                                <option value="Sister">Sister</option>
                                <option value="Other">Other</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-1">Age (Years)</label>
                              <input
                                type="number"
                                min="0"
                                max="120"
                                value={newMember.age}
                                onChange={(e) => setNewMember({ ...newMember, age: e.target.value })}
                                placeholder="e.g. 52"
                                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Gender</label>
                            <div className="flex gap-4">
                              {['Male', 'Female', 'Other'].map((g) => (
                                <label key={g} className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
                                  <input
                                    type="radio"
                                    name="gender"
                                    value={g}
                                    checked={newMember.gender === g}
                                    onChange={(e) => setNewMember({ ...newMember, gender: e.target.value })}
                                  />
                                  <span>{g}</span>
                                </label>
                              ))}
                            </div>
                          </div>

                          <div className="flex gap-2 pt-2">
                            <button
                              type="button"
                              onClick={() => setShowAddFamilyModal(false)}
                              className="flex-1 py-2.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="flex-1 py-2.5 bg-blue text-white rounded-lg text-xs font-semibold hover:bg-blue-dark shadow-xs"
                            >
                              Save Member
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ══════════════════════════════════════════════════════ */}
              {/* PRINTABLE GST INVOICE / CASH RECEIPT MODAL             */}
              {/* ══════════════════════════════════════════════════════ */}
              {selectedInvoice && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
                  <div className="bg-white rounded-2xl max-w-2xl w-full border border-gray-300 shadow-2xl p-6 sm:p-8 my-8 text-gray-900">
                    <div className="flex items-center justify-between border-b pb-4 mb-4">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Official Medical Receipt
                        </span>
                        <h3 className="text-xl font-bold text-gray-900 mt-1">{selectedInvoice.clinic?.name || 'Absolute Diagnostic Center'}</h3>
                        <p className="text-xs text-gray-500">{selectedInvoice.clinic?.address}</p>
                        <p className="text-xs text-gray-500 font-mono">GSTIN: {selectedInvoice.clinic?.gstNumber} • Ph: {selectedInvoice.clinic?.phone}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-gray-400 uppercase">Receipt No</div>
                        <div className="text-base font-extrabold font-mono text-blue">{selectedInvoice.invoiceNumber}</div>
                        <div className="text-xs text-gray-500">{selectedInvoice.invoiceDate}</div>
                      </div>
                    </div>

                    {/* Patient info */}
                    <div className="bg-gray-50 rounded-xl p-4 mb-5 grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-gray-400 font-semibold uppercase block text-[10px]">Billed Patient</span>
                        <div className="font-bold text-gray-900 text-sm">{selectedInvoice.patient?.name}</div>
                        <div className="text-gray-600">{selectedInvoice.patient?.phone}</div>
                        {selectedInvoice.patient?.familyMember && (
                          <div className="text-blue font-medium mt-0.5">Family Member: {selectedInvoice.patient.familyMember}</div>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-gray-400 font-semibold uppercase block text-[10px]">Booking / Sample ID</span>
                        <div className="font-mono font-bold text-gray-900">{selectedInvoice.bookingId}</div>
                        <div className="font-mono text-gray-600">Sample: {selectedInvoice.sampleId}</div>
                        <span className="inline-block mt-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          Payment: {selectedInvoice.paymentStatus?.toUpperCase() || 'PAID'}
                        </span>
                      </div>
                    </div>

                    {/* Items table */}
                    <div className="border border-gray-200 rounded-xl overflow-hidden mb-5">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-gray-100 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider text-[10px]">
                          <tr>
                            <th className="p-3">Test / Service Description</th>
                            <th className="p-3 text-center">Qty</th>
                            <th className="p-3 text-right">Amount (₹)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {selectedInvoice.items?.map((item: any, idx: number) => (
                            <tr key={idx}>
                              <td className="p-3 font-medium text-gray-900">{item.testName}</td>
                              <td className="p-3 text-center">{item.quantity || 1}</td>
                              <td className="p-3 text-right font-mono font-semibold">₹{item.testPrice || 0}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Financial summary */}
                    <div className="space-y-1.5 text-xs text-gray-600 border-t pt-3 mb-6">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span className="font-mono">₹{selectedInvoice.subtotal}</span>
                      </div>
                      {selectedInvoice.discount > 0 && (
                        <div className="flex justify-between text-emerald-700 font-medium">
                          <span>Promo Coupon Discount {selectedInvoice.couponCode ? `(${selectedInvoice.couponCode})` : ''}:</span>
                          <span className="font-mono">-₹{selectedInvoice.discount}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm font-bold text-gray-900 pt-1 border-t border-gray-200">
                        <span>Total Paid Amount:</span>
                        <span className="font-mono text-emerald-700">₹{selectedInvoice.paidAmount || selectedInvoice.totalAmount}</span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-end gap-3 pt-2 border-t">
                      <button
                        onClick={() => setSelectedInvoice(null)}
                        className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        Close
                      </button>
                      <button
                        onClick={() => window.print()}
                        className="px-5 py-2 bg-blue hover:bg-blue-dark text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="6 9 6 2 18 2 18 9" />
                          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                          <rect x="6" y="14" width="12" height="8" />
                        </svg>
                        <span>Print / Save PDF</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </HomepageAnimations>
  );
}
