'use client';

import { useState } from 'react';
import Link from 'next/link';
import HomepageAnimations from '@/components/HomepageAnimations';

export default function NightRequestPage() {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    testsNeeded: '',
    preferredTime: '',
    notes: '',
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    try {
      const res = await fetch('/api/night-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setStatus('success');
        setForm({ name: '', phone: '', email: '', testsNeeded: '', preferredTime: '', notes: '' });
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <HomepageAnimations>
      <section className="relative bg-gradient-to-br from-[#1a0533] via-[#2d1052] to-[#0f0622] overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full blur-[160px] opacity-15 animate-morph" />
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-purple-400 rounded-full blur-[180px] opacity-10 animate-morph" style={{ animationDelay: '4s' }} />
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <nav className="flex items-center gap-2 text-sm text-white/50 mb-8">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
            <span className="text-white/80">Night Collection</span>
          </nav>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-purple-500/20 border border-purple-400/20 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white" style={{ fontFamily: 'var(--font-jakarta)' }}>
              Night <span className="text-purple-300">Collection</span>
            </h1>
          </div>
          <p className="text-white/60 text-lg max-w-xl">
            Need a sample collected after hours? Request our emergency night collection service.
          </p>
        </div>
      </section>

      <section className="pb-20 md:pb-0 py-20 lg:py-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {status === 'success' ? (
            <div className="text-center py-16 reveal">
              <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-6">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-[var(--navy)] mb-3" style={{ fontFamily: 'var(--font-jakarta)' }}>
                Request Submitted!
              </h2>
              <p className="text-[var(--gray-500)] text-lg mb-4 max-w-md mx-auto">
                Your night collection request has been received. Our team will contact you shortly to confirm the schedule.
              </p>
              <p className="text-sm text-[var(--gray-400)] mb-8">
                For urgent assistance, call us directly.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/" className="btn-primary text-sm px-6 py-3 rounded-xl">
                  <span>Back to Home</span>
                </Link>
                <a href="tel:+919876543210" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 border-[var(--gray-200)] text-sm font-semibold text-[var(--navy)] hover:border-[var(--blue)] hover:text-[var(--blue)] transition-all">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  Call Us Now
                </a>
              </div>
            </div>
          ) : (
            <div className="reveal">
              <div className="surface-elevated rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[var(--navy)]" style={{ fontFamily: 'var(--font-jakarta)' }}>Night Collection Request</h2>
                    <p className="text-xs text-[var(--gray-500)]">Available 9:00 PM - 6:00 AM with additional charges</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-semibold text-[var(--gray-600)] mb-2 uppercase tracking-wider">Full Name *</label>
                      <input
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        required
                        placeholder="Your full name"
                        className="w-full px-4 py-3 rounded-xl border border-[var(--gray-200)] bg-[var(--gray-50)] text-sm text-[var(--navy)] placeholder:text-[var(--gray-400)] focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/10 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[var(--gray-600)] mb-2 uppercase tracking-wider">Phone *</label>
                      <input
                        type="tel"
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        required
                        placeholder="+91 98765 43210"
                        className="w-full px-4 py-3 rounded-xl border border-[var(--gray-200)] bg-[var(--gray-50)] text-sm text-[var(--navy)] placeholder:text-[var(--gray-400)] focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/10 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--gray-600)] mb-2 uppercase tracking-wider">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      className="w-full px-4 py-3 rounded-xl border border-[var(--gray-200)] bg-[var(--gray-50)] text-sm text-[var(--navy)] placeholder:text-[var(--gray-400)] focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/10 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--gray-600)] mb-2 uppercase tracking-wider">Tests Needed *</label>
                    <textarea
                      name="testsNeeded"
                      value={form.testsNeeded}
                      onChange={handleChange}
                      required
                      rows={3}
                      placeholder="List the tests you need (e.g., CBC, Blood Sugar, Lipid Profile)"
                      className="w-full px-4 py-3 rounded-xl border border-[var(--gray-200)] bg-[var(--gray-50)] text-sm text-[var(--navy)] placeholder:text-[var(--gray-400)] focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/10 transition-all resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--gray-600)] mb-2 uppercase tracking-wider">Preferred Time *</label>
                    <select
                      name="preferredTime"
                      value={form.preferredTime}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-[var(--gray-200)] bg-[var(--gray-50)] text-sm text-[var(--navy)] focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/10 transition-all"
                    >
                      <option value="">Select preferred time</option>
                      <option value="9:00 PM - 11:00 PM">9:00 PM - 11:00 PM</option>
                      <option value="11:00 PM - 1:00 AM">11:00 PM - 1:00 AM</option>
                      <option value="1:00 AM - 3:00 AM">1:00 AM - 3:00 AM</option>
                      <option value="3:00 AM - 5:00 AM">3:00 AM - 5:00 AM</option>
                      <option value="5:00 AM - 6:00 AM">5:00 AM - 6:00 AM</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--gray-600)] mb-2 uppercase tracking-wider">Additional Notes</label>
                    <textarea
                      name="notes"
                      value={form.notes}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Any special instructions, address details, or patient condition"
                      className="w-full px-4 py-3 rounded-xl border border-[var(--gray-200)] bg-[var(--gray-50)] text-sm text-[var(--navy)] placeholder:text-[var(--gray-400)] focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/10 transition-all resize-none"
                    />
                  </div>

                  {status === 'error' && (
                    <p className="text-sm text-[var(--error)]">Something went wrong. Please try again or call us directly.</p>
                  )}

                  <div className="flex items-center gap-3 p-4 rounded-xl bg-purple-50 border border-purple-100">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" className="shrink-0">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                    <p className="text-xs text-purple-700">Night collection involves additional charges. Our team will share the exact cost when confirming your appointment.</p>
                  </div>

                  <button
                    type="submit"
                    disabled={status === 'submitting'}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold hover:shadow-2xl hover:shadow-purple-500/30 transition-all duration-300 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none"
                  >
                    {status === 'submitting' ? (
                      <>
                        <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="32" /></svg>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                        </svg>
                        Request Night Collection
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </section>
    </HomepageAnimations>
  );
}
