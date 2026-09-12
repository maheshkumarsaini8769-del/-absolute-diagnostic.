'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Settings {
  site_name?: string;
  site_description?: string;
  contact_phone?: string;
  primary_phone?: string;
  contact_email?: string;
  email?: string;
  contact_address?: string;
  address?: string;
  whatsapp_number?: string;
  emergency_number?: string;
  working_hours?: string;
}

interface Branch {
  id: string;
  name: string;
  slug: string;
  address?: string;
  city?: string;
  phone?: string;
}

interface FooterData {
  settings: Settings;
  branches: Branch[];
}

const quickLinks = [
  { href: '/tests', label: 'Browse Tests' },
  { href: '/track', label: 'Track Live Sample' },
  { href: '/symptoms', label: 'AI Symptom Checker' },
  { href: '/tests/compare', label: 'Compare Tests' },
  { href: '/packages', label: 'Health Packages' },
  { href: '/corporate', label: 'Corporate Health Camps' },
  { href: '/services', label: 'Our Services' },
  { href: '/booking', label: 'Book a Test' },
  { href: '/reports', label: 'View Reports' },
  { href: '/walk-in-reports', label: 'Walk-in Reports' },
];

const serviceLinks = [
  { href: '/home-collection', label: 'Home Collection' },
  { href: '/track', label: 'Sample Tracker' },
  { href: '/corporate', label: 'Factory & B2B Wellness' },
  { href: '/night-service', label: 'Night Services' },
  { href: '/careers', label: 'Careers' },
  { href: '/blog', label: 'Health Blog' },
  { href: '/faq', label: 'FAQ' },
  { href: '/privacy-policy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms of Service' },
];

export default function Footer() {
  const [data, setData] = useState<FooterData | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [homepageRes, branchesRes] = await Promise.all([
          fetch('/api/homepage'),
          fetch('/api/branches'),
        ]);
        const homepage = await homepageRes.json();
        const branchesData = await branchesRes.json();
        setData({ settings: homepage.settings || {}, branches: branchesData.branches || [] });
      } catch {
        setData({ settings: {}, branches: [] });
      }
    }
    fetchData();
  }, []);

  const s = data?.settings || {};
  const phone = s.contact_phone || s.primary_phone || '+919876543210';
  const cleanPhone = phone.replace(/[^\d+]/g, '');
  const email = s.contact_email || s.email || 'info@absolutediagnostic.com';
  const address = s.contact_address || s.address || '123 Health Street, Medical District, Mumbai';
  const whatsapp = s.whatsapp_number || '+919876543210';
  const cleanWa = whatsapp.replace(/\D/g, '');
  const workingHours = s.working_hours || 'Mon-Sat: 7:00 AM - 9:00 PM | Sun: 8:00 AM - 2:00 PM';
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden" role="contentinfo">
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--navy)] via-[var(--navy-light)] to-[var(--navy)]" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[var(--blue)] rounded-full blur-[200px] opacity-5" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-[var(--teal)] rounded-full blur-[200px] opacity-5" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-3 mb-6 group">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[var(--blue)] to-[var(--teal)] flex items-center justify-center shadow-lg group-hover:shadow-[var(--blue-glow)] transition-shadow">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                  <path d="M12 2v4m0 12v4M2 12h4m12 0h4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
                </svg>
              </div>
              <div>
                <span className="text-sm font-bold tracking-tight text-white block" style={{ fontFamily: 'var(--font-jakarta)' }}>ABSOLUTE</span>
                <span className="text-[9px] font-semibold tracking-[0.25em] text-[var(--teal)] uppercase block">DIAGNOSTIC</span>
              </div>
            </Link>
            <p className="text-[var(--gray-400)] text-sm leading-relaxed mb-6 max-w-xs">
              {s.site_description || 'NABL accredited diagnostic lab providing accurate and timely diagnostic services with advanced technology.'}
            </p>
            <div className="flex items-center gap-3">
              <a href={`https://wa.me/${cleanWa}`} target="_blank" rel="noopener noreferrer"
                className="w-11 h-11 rounded-xl bg-white/5 hover:bg-[var(--success)] flex items-center justify-center transition-all duration-300 hover:scale-110" aria-label="WhatsApp">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--gray-400)"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
              </a>
              <a href={`tel:${cleanPhone}`}
                className="w-11 h-11 rounded-xl bg-white/5 hover:bg-[var(--blue)] flex items-center justify-center transition-all duration-300 hover:scale-110" aria-label="Call">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gray-400)" strokeWidth="2" strokeLinecap="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </a>
              <a href={`mailto:${email}`}
                className="w-11 h-11 rounded-xl bg-white/5 hover:bg-[var(--teal)] flex items-center justify-center transition-all duration-300 hover:scale-110" aria-label="Email">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gray-400)" strokeWidth="2" strokeLinecap="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-[0.2em] mb-6">Quick Links</h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-[var(--gray-400)] text-sm hover:text-[var(--teal)] transition-colors duration-300 hover:translate-x-1 inline-block">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-[0.2em] mb-6">Services</h3>
            <ul className="space-y-3">
              {serviceLinks.map((link) => (
                <li key={link.href + link.label}>
                  <Link href={link.href} className="text-[var(--gray-400)] text-sm hover:text-[var(--teal)] transition-colors duration-300 hover:translate-x-1 inline-block">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-[0.2em] mb-6">Contact</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-sm text-[var(--gray-400)]">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2" strokeLinecap="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </div>
                <a href={`tel:${cleanPhone}`} className="hover:text-[var(--teal)] transition-colors">{phone}</a>
              </li>
              <li className="flex items-start gap-3 text-sm text-[var(--gray-400)]">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2" strokeLinecap="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
                  </svg>
                </div>
                <a href={`mailto:${email}`} className="hover:text-[var(--teal)] transition-colors break-all">{email}</a>
              </li>
              <li className="flex items-start gap-3 text-sm text-[var(--gray-400)]">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2" strokeLinecap="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <span>{address}</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-[var(--gray-400)]">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <span>{workingHours}</span>
              </li>
            </ul>
          </div>
        </div>

        {data?.branches && data.branches.length > 0 && (
          <div className="mt-16 pt-10 border-t border-white/5">
            <h3 className="text-xs font-bold text-white uppercase tracking-[0.2em] mb-6">Our Branches</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {data.branches.map((branch) => (
                <Link key={branch.id} href={`/branches#${branch.slug}`}
                  className="flex items-start gap-3 p-4 rounded-xl bg-white/3 border border-white/5 hover:bg-white/6 hover:border-white/10 transition-all duration-300 group">
                  <div className="w-8 h-8 rounded-lg bg-[var(--teal)]/10 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-[var(--teal)]/20 transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2" strokeLinecap="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{branch.name}</p>
                    {branch.address && <p className="text-xs text-[var(--gray-500)] mt-0.5">{branch.address}{branch.city ? `, ${branch.city}` : ''}</p>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="mt-16 pt-8 border-t border-white/5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-[var(--gray-500)]">
              &copy; {year} {s.site_name || 'Absolute Diagnostic'}. All rights reserved.
            </p>
            <div className="flex flex-wrap items-center gap-5 text-xs text-[var(--gray-500)]">
              <Link href="/about" className="hover:text-[var(--teal)] transition-colors">About</Link>
              <Link href="/contact" className="hover:text-[var(--teal)] transition-colors">Contact</Link>
              <Link href="/privacy" className="hover:text-[var(--teal)] transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-[var(--teal)] transition-colors">Terms</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
