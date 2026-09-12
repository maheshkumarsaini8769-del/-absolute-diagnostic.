'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import HomepageAnimations from '@/components/HomepageAnimations';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [settings, setSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch('/api/homepage')
      .then((res) => res.json())
      .then((data) => {
        if (data?.settings) setSettings(data.settings);
      })
      .catch(() => {});
  }, []);

  const phone = settings.contact_phone || settings.primary_phone || '+91 98765 43210';
  const cleanPhone = phone.replace(/[^\d+]/g, '');
  const whatsapp = settings.whatsapp_number || '+91 98765 43210';
  const cleanWa = whatsapp.replace(/\D/g, '');
  const workingHours = settings.working_hours || 'Mon - Sat: 7:00 AM - 9:00 PM';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setStatus('success');
        setForm({ name: '', phone: '', email: '', message: '' });
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
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
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
            <span className="text-white/80">Contact Us</span>
          </nav>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4" style={{ fontFamily: 'var(--font-jakarta)' }}>
            Get in <span className="gradient-text">Touch</span>
          </h1>
          <p className="text-white/60 text-lg max-w-xl">
            Have questions? We&apos;re here to help. Reach out to us through any of the channels below.
          </p>
        </div>
      </section>

      <section className="pb-20 md:pb-0 py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
            <div className="lg:col-span-2 space-y-6 reveal-left">
              <div className="surface-elevated rounded-2xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[var(--blue)]/10 flex items-center justify-center shrink-0">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2" strokeLinecap="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-[var(--navy)] mb-1" style={{ fontFamily: 'var(--font-jakarta)' }}>Call Us</h3>
                    <p className="text-sm text-[var(--gray-500)] mb-3">Available during working hours</p>
                    <a href={`tel:${cleanPhone}`} className="text-sm font-semibold text-[var(--blue)] hover:text-[var(--blue-light)] transition-colors">
                      {phone}
                    </a>
                  </div>
                </div>
              </div>

              <div className="surface-elevated rounded-2xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[var(--teal)]/10 flex items-center justify-center shrink-0">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--teal)">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-[var(--navy)] mb-1" style={{ fontFamily: 'var(--font-jakarta)' }}>WhatsApp</h3>
                    <p className="text-sm text-[var(--gray-500)] mb-3">Chat with us anytime</p>
                    <a href={`https://wa.me/${cleanWa}`} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-[var(--teal)] hover:text-[var(--teal-light)] transition-colors">
                      {whatsapp}
                    </a>
                  </div>
                </div>
              </div>

              <div className="surface-elevated rounded-2xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" strokeLinecap="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-[var(--navy)] mb-1" style={{ fontFamily: 'var(--font-jakarta)' }}>Working Hours</h3>
                    <div className="space-y-1.5 text-sm text-[var(--gray-500)]">
                      <p>{workingHours}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl overflow-hidden border border-[var(--gray-100)] h-48 bg-[var(--gray-100)] flex items-center justify-center">
                <div className="text-center">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--gray-300)" strokeWidth="1.5" strokeLinecap="round" className="mx-auto mb-2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <p className="text-sm text-[var(--gray-400)]">Map</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-3 reveal-right">
              <div className="surface-elevated rounded-2xl p-8">
                <h2 className="text-2xl font-bold text-[var(--navy)] mb-2" style={{ fontFamily: 'var(--font-jakarta)' }}>
                  Send Us a Message
                </h2>
                <p className="text-sm text-[var(--gray-500)] mb-8">
                  Fill out the form below and we&apos;ll get back to you as soon as possible.
                </p>

                {status === 'success' ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" strokeLinecap="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-[var(--navy)] mb-2" style={{ fontFamily: 'var(--font-jakarta)' }}>Message Sent!</h3>
                    <p className="text-[var(--gray-500)] mb-6">Thank you for reaching out. We&apos;ll respond within 24 hours.</p>
                    <button onClick={() => setStatus('idle')} className="btn-primary text-sm px-6 py-2.5 rounded-xl">
                      <span>Send Another Message</span>
                    </button>
                  </div>
                ) : (
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
                          className="w-full px-4 py-3 rounded-xl border border-[var(--gray-200)] bg-[var(--gray-50)] text-sm text-[var(--navy)] placeholder:text-[var(--gray-400)] focus:outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/10 transition-all"
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
                          className="w-full px-4 py-3 rounded-xl border border-[var(--gray-200)] bg-[var(--gray-50)] text-sm text-[var(--navy)] placeholder:text-[var(--gray-400)] focus:outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/10 transition-all"
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
                        className="w-full px-4 py-3 rounded-xl border border-[var(--gray-200)] bg-[var(--gray-50)] text-sm text-[var(--navy)] placeholder:text-[var(--gray-400)] focus:outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/10 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[var(--gray-600)] mb-2 uppercase tracking-wider">Message *</label>
                      <textarea
                        name="message"
                        value={form.message}
                        onChange={handleChange}
                        required
                        rows={5}
                        placeholder="How can we help you?"
                        className="w-full px-4 py-3 rounded-xl border border-[var(--gray-200)] bg-[var(--gray-50)] text-sm text-[var(--navy)] placeholder:text-[var(--gray-400)] focus:outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/10 transition-all resize-none"
                      />
                    </div>
                    {status === 'error' && (
                      <p className="text-sm text-[var(--error)]">Something went wrong. Please try again.</p>
                    )}
                    <button
                      type="submit"
                      disabled={status === 'submitting'}
                      className="btn-primary w-full sm:w-auto text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="flex items-center justify-center gap-2">
                        {status === 'submitting' ? (
                          <>
                            <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="32" /></svg>
                            Sending...
                          </>
                        ) : (
                          <>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                            Send Message
                          </>
                        )}
                      </span>
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </HomepageAnimations>
  );
}
