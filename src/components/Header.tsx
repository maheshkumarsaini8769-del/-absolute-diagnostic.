'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import GlobalSearchModal from '@/components/GlobalSearchModal';
import { useLanguage } from '@/context/LanguageContext';

interface HeaderSettings {
  contact_phone?: string;
  whatsapp_number?: string;
  emergency_number?: string;
  working_hours?: string;
  site_name?: string;
}

const primaryNavLinks = [
  { href: '/', label: 'Home' },
  { href: '/tests', label: 'Tests' },
  { href: '/packages', label: 'Packages' },
  { href: '/services', label: 'Services' },
  { href: '/contact', label: 'Contact' },
];

const moreNavLinks = [
  {
    href: '/home-collection',
    label: 'Home Collection',
    desc: 'Doorstep sample pickup',
    badge: 'Popular',
    icon: (
      <svg className="w-4 h-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    href: '/night-service',
    label: '24x7 Night Service',
    desc: 'Emergency after-hours lab',
    badge: '24x7',
    icon: (
      <svg className="w-4 h-4 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
      </svg>
    ),
  },
  {
    href: '/branches',
    label: 'Our Branches',
    desc: 'Find nearby centers & timings',
    icon: (
      <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    href: '/about',
    label: 'About Us',
    desc: 'NABL accreditation & story',
    icon: (
      <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    href: '/faq',
    label: 'FAQs & Guidelines',
    desc: 'Fasting instructions & FAQs',
    icon: (
      <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    href: '/blog',
    label: 'Health Blog',
    desc: 'Preventive health insights',
    icon: (
      <svg className="w-4 h-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    href: '/tests/compare',
    label: 'Compare Tests',
    desc: 'Side-by-side test comparison',
    icon: (
      <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
      </svg>
    ),
  },
  {
    href: '/careers',
    label: 'Careers',
    desc: 'Join our clinical & lab team',
    icon: (
      <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
];

const mobileNavLinks = [
  { href: '/', label: '🏠 Home' },
  { href: '/tests', label: '🔬 All Tests' },
  { href: '/packages', label: '💊 Health Packages' },
  { href: '/booking', label: '📅 Book a Test' },
  { href: '/home-collection', label: '🏡 Home Collection', badge: 'Popular' },
  { href: '/reports', label: '📄 View Reports' },
  { href: '/branches', label: '📍 Our Branches' },
  { href: '/contact', label: '📞 Contact Us' },
  { href: '/about', label: 'ℹ️ About Us' },
  { href: '/blog', label: '📝 Health Blog' },
  { href: '/faq', label: '❓ FAQs' },
];

export default function Header() {
  const { language, toggleLanguage, t } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const [settings, setSettings] = useState<HeaderSettings>({
    contact_phone: '+919876543210',
    whatsapp_number: '+919876543210',
    emergency_number: '+919876543210',
    working_hours: 'Mon-Sat: 7:00 AM - 9:00 PM',
  });
  const pathname = usePathname();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/homepage');
        if (res.ok) {
          const data = await res.json();
          if (data?.settings) {
            setSettings({
              contact_phone: data.settings.contact_phone || data.settings.primary_phone || '+919876543210',
              whatsapp_number: data.settings.whatsapp_number || '+919876543210',
              emergency_number: data.settings.emergency_number || '+919876543210',
              working_hours: data.settings.working_hours || 'Mon-Sat: 7:00 AM - 9:00 PM',
              site_name: data.settings.site_name || 'Absolute Diagnostic',
            });
          }
        }
      } catch {
        // use default fallback
      }
    }
    loadSettings();
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setMoreOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const phone = settings.contact_phone || '+919876543210';
  const cleanPhone = phone.replace(/[^\d+]/g, '');
  const wa = settings.whatsapp_number || '+919876543210';
  const cleanWa = wa.replace(/\D/g, '');

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
        <div className="bg-[#071224] text-slate-300 border-b border-white/10 hidden lg:block">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-9 text-xs">
              <div className="flex items-center gap-6">
                <div className="inline-flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-slate-200 font-medium">NABL Accredited Diagnostic Center</span>
                </div>
                <span className="text-slate-600">•</span>
                <div className="hidden lg:flex items-center gap-1.5 text-slate-300">
                  <svg className="w-3.5 h-3.5 text-[var(--teal)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{settings.working_hours || 'Mon-Sat: 7:00 AM - 9:00 PM'}</span>
                </div>
              </div>

              <div className="flex items-center gap-5">
                <a
                  href={`tel:${cleanPhone}`}
                  className="flex items-center gap-1.5 text-slate-200 hover:text-sky-300 transition-colors font-medium"
                >
                  <svg className="w-3.5 h-3.5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>{phone}</span>
                </a>
                <span className="text-slate-700">|</span>
                <a
                  href={`https://wa.me/${cleanWa}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-emerald-300 hover:text-emerald-200 transition-colors font-medium"
                >
                  <svg className="w-3.5 h-3.5 text-emerald-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        <div
          className={`transition-all duration-300 bg-white/95 backdrop-blur-md border-b ${
            scrolled ? 'border-slate-200/80 shadow-md shadow-slate-900/5' : 'border-slate-100 shadow-xs'
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 lg:h-20">
              <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group shrink-0" aria-label="Absolute Diagnostic Home">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-[var(--blue)] to-[var(--teal)] flex items-center justify-center shadow-md shadow-[var(--blue)]/20 group-hover:shadow-[var(--teal)]/30 group-hover:scale-105 transition-all duration-300">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v4m0 12v4M2 12h4m12 0h4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base sm:text-lg font-bold tracking-tight text-[#071224] leading-tight" style={{ fontFamily: 'var(--font-jakarta)' }}>
                      ABSOLUTE
                    </span>
                    <span className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-bold text-sky-700 bg-sky-50 border border-sky-200/60 rounded">
                      NABL LAB
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold tracking-[0.25em] text-[var(--blue)] uppercase leading-none mt-0.5">
                    DIAGNOSTIC
                  </span>
                </div>
              </Link>

              <nav className="hidden lg:flex items-center gap-1">
                {primaryNavLinks.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                        isActive
                          ? 'text-[var(--blue)] bg-sky-50 font-semibold shadow-xs'
                          : 'text-slate-600 hover:text-[var(--blue)] hover:bg-slate-50'
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}

                <div
                  ref={moreRef}
                  className="relative"
                  onMouseEnter={() => setMoreOpen(true)}
                  onMouseLeave={() => setMoreOpen(false)}
                >
                  <button
                    onClick={() => setMoreOpen(!moreOpen)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                      moreOpen || moreNavLinks.some((l) => pathname === l.href)
                        ? 'text-[var(--blue)] bg-sky-50 font-semibold'
                        : 'text-slate-600 hover:text-[var(--blue)] hover:bg-slate-50'
                    }`}
                    aria-expanded={moreOpen}
                    aria-haspopup="true"
                  >
                    <span>More</span>
                    <svg
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        moreOpen ? 'rotate-180 text-[var(--blue)]' : 'text-slate-400'
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {moreOpen && (
                    <div className="absolute top-full left-0 mt-1.5 w-64 rounded-2xl bg-white border border-slate-200/90 shadow-2xl shadow-slate-900/15 p-2 z-50 animate-fade-in backdrop-blur-xl">
                      <div className="space-y-1">
                        {moreNavLinks.map((item) => {
                          const isActive = pathname === item.href;
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setMoreOpen(false)}
                              className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${
                                isActive
                                  ? 'bg-sky-50 text-[var(--blue)] font-semibold'
                                  : 'text-slate-700 hover:bg-slate-50 hover:text-[var(--blue)]'
                              }`}
                            >
                              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                                {item.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <p className="text-xs font-semibold leading-tight">{item.label}</p>
                                  {item.badge && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                                      {item.badge}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-slate-400 truncate mt-0.5">{item.desc}</p>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </nav>

              <div className="flex items-center gap-2 sm:gap-3">
                {/* Language Switcher */}
                <button
                  onClick={toggleLanguage}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 hover:border-emerald-300 bg-slate-50 text-xs font-bold text-slate-700 hover:text-emerald-700 transition"
                  title={language === 'en' ? 'हिन्दी में बदलें' : 'Switch to English'}
                >
                  <span className="text-sm">🌐</span>
                  <span>{language === 'en' ? 'हिन्दी' : 'English'}</span>
                </button>

                {/* Upload Rx / Prescription Quick Link */}
                <Link
                  href="/upload-prescription"
                  className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-xs sm:text-sm font-semibold transition shadow-2xs"
                >
                  <span>📋</span>
                  <span>{language === 'hi' ? 'पर्ची भेजें' : 'Upload Rx'}</span>
                </Link>

                {/* Global Search Button */}
                <button
                  onClick={() => setSearchOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-700 hover:text-[var(--blue)] border border-slate-200 hover:border-[var(--blue)]/40 hover:bg-sky-50/50 text-xs sm:text-sm font-semibold transition-all duration-200"
                  aria-label="Search tests and services"
                  title="Search tests, packages & services (Ctrl+K)"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <span className="hidden sm:inline">Search</span>
                  <kbd className="hidden lg:inline px-1 py-0.2 text-[9px] font-mono text-slate-400 bg-slate-100 rounded border border-slate-200">⌘K</kbd>
                </button>

                <Link
                  href="/reports"
                  className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-slate-700 hover:text-[var(--blue)] border border-slate-200 hover:border-[var(--blue)]/40 hover:bg-sky-50/50 text-xs sm:text-sm font-semibold transition-all duration-200"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                  <span>View Reports</span>
                </Link>

                <Link
                  href="/booking"
                  className="hidden sm:flex items-center gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-[var(--blue)] to-[var(--teal)] text-white text-xs sm:text-sm font-semibold shadow-md shadow-[var(--blue)]/20 hover:shadow-lg hover:shadow-[var(--blue)]/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <span>Book Test</span>
                </Link>

                <button
                  onClick={() => setMobileOpen(true)}
                  className="lg:hidden p-2 rounded-xl text-slate-700 hover:text-[var(--blue)] hover:bg-slate-100 transition-colors focus:outline-none"
                  aria-label="Open navigation menu"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 transition-opacity duration-300"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div
        className={`fixed top-0 right-0 h-full w-[340px] max-w-[88vw] z-50 transform transition-transform duration-500 overflow-hidden ${
          mobileOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        <div className="h-full bg-white shadow-2xl flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--blue)] to-[var(--teal)] flex items-center justify-center text-white">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M12 2v4m0 12v4M2 12h4m12 0h4" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-[#071224] text-sm leading-tight" style={{ fontFamily: 'var(--font-jakarta)' }}>
                  ABSOLUTE
                </span>
                <span className="text-[9px] font-semibold text-[var(--blue)] tracking-wider uppercase">
                  DIAGNOSTIC LAB
                </span>
              </div>
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 transition-colors"
              aria-label="Close menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className="p-3 bg-sky-50/70 border-b border-sky-100 grid grid-cols-2 gap-2">
            <a
              href={`tel:${cleanPhone}`}
              className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-white border border-sky-200/60 text-xs font-semibold text-slate-700 hover:text-sky-600 shadow-2xs"
            >
              <svg className="w-3.5 h-3.5 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Call Lab
            </a>
            <a
              href={`https://wa.me/${cleanWa}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-emerald-50 border border-emerald-200/60 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 shadow-2xs"
            >
              <svg className="w-3.5 h-3.5 text-emerald-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              WhatsApp
            </a>
          </div>

          <div className="px-3 py-2 bg-white border-b border-slate-100 flex items-center justify-between gap-2">
            <Link
              href="/upload-prescription"
              onClick={() => setMobileOpen(false)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition"
            >
              <span>📋</span>
              <span>{language === 'hi' ? 'पर्ची (Rx) अपलोड करें' : 'Upload Prescription'}</span>
            </Link>
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1 py-2 px-3 rounded-lg border border-emerald-300 bg-emerald-50 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition"
            >
              <span>🌐</span>
              <span>{language === 'en' ? 'हिन्दी' : 'English'}</span>
            </button>
          </div>

          <nav className="flex-1 px-3 py-3 overflow-y-auto">
            <div className="space-y-1">
              {mobileNavLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center justify-between px-3 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-sky-50 text-[var(--blue)] font-semibold border border-sky-100'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-[var(--blue)]'
                    }`}
                  >
                    <span>{link.label}</span>
                    <div className="flex items-center gap-2">
                      {link.badge && (
                        <span className="px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 bg-emerald-100 rounded-full">
                          {link.badge}
                        </span>
                      )}
                      <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="pt-4 mt-3 border-t border-slate-100 flex gap-4 text-xs text-slate-400 px-1">
              <Link href="/privacy-policy" onClick={() => setMobileOpen(false)} className="hover:text-slate-600">Privacy Policy</Link>
              <span>•</span>
              <Link href="/terms" onClick={() => setMobileOpen(false)} className="hover:text-slate-600">Terms & Conditions</Link>
            </div>
          </nav>

          <div className="p-4 border-t border-slate-100 bg-white">
            <Link
              href="/booking"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-[var(--blue)] to-[var(--teal)] text-white text-sm font-semibold shadow-md shadow-[var(--blue)]/20 hover:opacity-95"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              Book Test Now
            </Link>
          </div>
        </div>
      </div>

      <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
