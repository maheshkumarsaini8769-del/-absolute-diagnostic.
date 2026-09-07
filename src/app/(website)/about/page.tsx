'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import HomepageAnimations from '@/components/HomepageAnimations';

interface Settings {
  [key: string]: string;
}

export default function AboutPage() {
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => setSettings(data.settings || {}))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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
            <span className="text-white/80">About Us</span>
          </nav>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4" style={{ fontFamily: 'var(--font-jakarta)' }}>
            About <span className="gradient-text">Absolute Diagnostic</span>
          </h1>
          <p className="text-white/60 text-lg max-w-xl">
            Trusted precision diagnostics with NABL accreditation and cutting-edge technology.
          </p>
        </div>
      </section>

      <section className="pb-20 md:pb-0 py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="reveal-left">
              <span className="inline-block text-xs font-bold tracking-[0.2em] uppercase text-[var(--blue)] mb-3">Our Story</span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[var(--navy)] mb-6" style={{ fontFamily: 'var(--font-jakarta)' }}>
                {settings.about_heading || 'Precision Diagnostics, Trusted Care'}
              </h2>
              <p className="text-[var(--gray-600)] leading-relaxed mb-6 text-lg">
                {settings.about_story || 'Founded with a vision to make quality diagnostics accessible to everyone, Absolute Diagnostic Centre has grown into a trusted name in healthcare. Our state-of-the-art laboratory is equipped with the latest technology and staffed by experienced professionals who are committed to delivering accurate and timely results.'}
              </p>
              <p className="text-[var(--gray-600)] leading-relaxed mb-8 text-lg">
                {settings.about_story_2 || 'We believe that accurate diagnostics are the foundation of effective healthcare. Every test we conduct reflects our unwavering commitment to quality, precision, and patient care. Our NABL accreditation is a testament to our adherence to the highest standards in diagnostic testing.'}
              </p>
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--blue)]/10 flex items-center justify-center">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                  </div>
                  <span className="text-sm font-semibold text-[var(--navy)]">NABL Accredited</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--teal)]/10 flex items-center justify-center">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                  </div>
                  <span className="text-sm font-semibold text-[var(--navy)]">ISO Certified</span>
                </div>
              </div>
            </div>
            <div className="relative reveal-right">
              <div className="w-full rounded-3xl bg-gradient-to-br from-[var(--blue)]/5 to-[var(--teal)]/5 border border-[var(--gray-100)] overflow-hidden relative">
                <div className="h-48 sm:h-64 lg:h-80 bg-gradient-to-br from-[var(--blue)]/10 via-transparent to-[var(--teal)]/10 flex items-center justify-center relative">
                  <div className="text-center relative z-10">
                    <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[var(--blue)] to-[var(--teal)] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-[var(--blue-glow)]">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round">
                        <path d="M12 2v4m0 12v4M2 12h4m12 0h4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
                      </svg>
                    </div>
                    <p className="text-[var(--navy)] font-bold text-lg" style={{ fontFamily: 'var(--font-jakarta)' }}>NABL Accredited</p>
                    <p className="text-[var(--gray-500)] text-sm mt-1">Quality Assured Diagnostics</p>
                  </div>
                  <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-2xl bg-[var(--teal)]/10 animate-float" />
                  <div className="absolute -top-4 -left-4 w-16 h-16 rounded-xl bg-[var(--blue)]/10 animate-float" style={{ animationDelay: '3s' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 lg:py-28 bg-gradient-to-b from-[var(--gray-50)] to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14 reveal">
            <span className="inline-block text-xs font-bold tracking-[0.2em] uppercase text-[var(--blue)] mb-3">Our Mission</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[var(--navy)]" style={{ fontFamily: 'var(--font-jakarta)' }}>
              Committed to Your Health
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger reveal">
            {[
              {
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                ),
                title: 'Timely Results',
                description: 'We understand the urgency of diagnostic results. Our efficient processes ensure you receive accurate reports within the promised timeframe.',
              },
              {
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                ),
                title: 'Quality Assurance',
                description: 'NABL accredited laboratory with rigorous quality control measures at every stage, ensuring the highest standards of diagnostic accuracy.',
              },
              {
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                ),
                title: 'Patient First',
                description: 'Every decision we make is centered around patient comfort, safety, and wellbeing. Your health is our topmost priority.',
              },
            ].map((item) => (
              <div key={item.title} className="p-8 rounded-2xl bg-white border border-[var(--gray-100)] hover:border-[var(--blue)]/20 hover:shadow-xl transition-all duration-500 group">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--blue)] to-[var(--teal)] flex items-center justify-center mb-6 group-hover:shadow-lg group-hover:shadow-[var(--blue-glow)] transition-shadow">
                  {item.icon}
                </div>
                <h3 className="font-bold text-[var(--navy)] text-lg mb-3" style={{ fontFamily: 'var(--font-jakarta)' }}>{item.title}</h3>
                <p className="text-sm text-[var(--gray-500)] leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14 reveal">
            <span className="inline-block text-xs font-bold tracking-[0.2em] uppercase text-[var(--blue)] mb-3">Our Values</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[var(--navy)]" style={{ fontFamily: 'var(--font-jakarta)' }}>
              Trusted by Thousands
            </h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 stagger reveal">
            {[
              { label: 'Years of Service', value: settings.trust_stat_1_value || '15+' },
              { label: 'Patients Served', value: settings.trust_stat_2_value || '1,00,000+' },
              { label: 'Tests Available', value: settings.trust_stat_3_value || '2000+' },
              { label: 'Doctor Partners', value: settings.trust_stat_4_value || '500+' },
            ].map((stat) => (
              <div key={stat.label} className="text-center p-8 rounded-2xl bg-gradient-to-b from-[var(--gray-50)] to-white border border-[var(--gray-100)] hover:border-[var(--blue)]/20 hover:shadow-xl transition-all duration-500">
                <p className="text-3xl sm:text-4xl font-bold gradient-text mb-2" style={{ fontFamily: 'var(--font-jakarta)' }}>
                  {stat.value}
                </p>
                <p className="text-sm text-[var(--gray-500)] font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 lg:py-28 relative overflow-hidden">
        <div className="absolute inset-0 gradient-section-dark" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[var(--blue)] rounded-full blur-[300px] opacity-10" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center reveal">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6" style={{ fontFamily: 'var(--font-jakarta)' }}>
            Experience the Difference
          </h2>
          <p className="text-[var(--gray-400)] mb-10 max-w-2xl mx-auto text-lg">
            Join thousands of patients who trust Absolute Diagnostic for accurate, timely, and affordable healthcare diagnostics.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/booking" className="btn-glow">
              <span className="flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                Book a Test
              </span>
            </Link>
            <Link href="/contact" className="btn-outline">
              Get in Touch
            </Link>
          </div>
        </div>
      </section>
    </HomepageAnimations>
  );
}
