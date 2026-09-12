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

const mainNavLinks = [
  { href: '/', label: 'Home' },
  { href: '/tests', label: 'Tests' },
  { href: '/packages', label: 'Packages' },
  { href: '/home-collection', label: 'Home Collection' },
  { href: '/track', label: 'Track Sample' },
  { href: '/reports', label: 'Reports' },
  { href: '/about', label: 'About' },
];

const moreNavLinks = [
  {
    href: '/second-opinion',
    label: 'AI Report Second Opinion',
    desc: 'Upload any lab report & get plain Hindi analysis',
    badge: 'AI Free',
    icon: (
      <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    href: '/blood-card',
    label: 'Digital Blood ID Card',
    desc: 'Instant emergency medical card',
    badge: 'Free',
    icon: (
      <svg className="w-4 h-4 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
      </svg>
    ),
  },
  {
    href: '/health-risk',
    label: 'Health & Sugar Risk Score',
    desc: '1-Min diabetes & cardiac risk score',
    icon: (
      <svg className="w-4 h-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    href: '/test-guide',
    label: 'Fasting & Medicine Guide',
    desc: 'When to take medicine & fasting rules',
    icon: (
      <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
  },
  {
    href: '/symptoms',
    label: 'Symptom Checker',
    desc: 'AI test recommender by symptoms',
    badge: 'AI',
    icon: (
      <svg className="w-4 h-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    href: '/corporate',
    label: 'Corporate Checkups',
    desc: 'Factory & office on-site health camps',
    icon: (
      <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    href: '/services',
    label: 'All Services',
    desc: 'Pathology & Specialized Tests',
    icon: (
      <svg className="w-4 h-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
  },
  {
    href: '/branches',
    label: 'Our Branches',
    desc: 'Find nearby diagnostic centers',
    icon: (
      <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
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
    href: '/upload-prescription',
    label: 'Upload Prescription',
    desc: 'Doctor Rx scan & booking',
    icon: (
      <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    href: '/faq',
    label: 'FAQs & Guidelines',
    desc: 'Fasting instructions & rules',
    icon: (
      <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    href: '/contact',
    label: 'Contact Us',
    desc: 'Support & phone queries',
    icon: (
      <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    ),
  },
];

const mobileNavLinks = [
  { href: '/', label: 'Home', icon: '🏠' },
  { href: '/second-opinion', label: 'AI Report Explainer', icon: '🤖', badge: 'Free' },
  { href: '/blood-card', label: 'Digital Blood ID Card', icon: '🩸', badge: 'Free' },
  { href: '/health-risk', label: 'Health & Sugar Risk Score', icon: '🩺' },
  { href: '/test-guide', label: 'Fasting & Medicine Guide', icon: '💊' },
  { href: '/track', label: 'Track Sample', icon: '⏱️', badge: 'Live' },
  { href: '/symptoms', label: 'Symptom Checker', icon: '🔬', badge: 'AI' },
  { href: '/tests', label: 'Tests & Catalog', icon: '🧪' },
  { href: '/packages', label: 'Health Packages', icon: '💊' },
  { href: '/corporate', label: 'Corporate Checkups', icon: '🏢' },
  { href: '/home-collection', label: 'Home Collection', icon: '🏡', badge: 'Popular' },
  { href: '/reports', label: 'View Reports', icon: '📄' },
  { href: '/about', label: 'About Us', icon: 'ℹ️' },
  { href: '/branches', label: 'Our Branches', icon: '📍' },
  { href: '/upload-prescription', label: 'Upload Prescription', icon: '📋' },
  { href: '/contact', label: 'Contact Us', icon: '📞' },
  { href: '/night-service', label: '24x7 Night Lab', icon: '🌙' },
  { href: '/faq', label: 'FAQs & Guidelines', icon: '❓' },
];

export default function Header() {
  const { language, toggleLanguage, t } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState('Sikar, Rajasthan');
  const locationRef = useRef<HTMLDivElement>(null);
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
        <div
          className={`transition-all duration-300 bg-white/95 backdrop-blur-md ${
            scrolled ? 'shadow-xs border-b border-slate-100 py-2.5' : 'py-3 sm:py-3.5 border-b border-slate-100/60'
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-12 sm:h-14">
              
              {/* ═══ 1. BRAND LOGO ═══ */}
              <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group shrink-0" aria-label="Absolute Diagnostic">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-[#0284c7] via-[#0d9488] to-[#10b981] flex items-center justify-center shadow-xs shadow-teal-500/20 group-hover:scale-105 transition-transform duration-300">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
                    <line x1="12" y1="2" x2="12" y2="5" />
                    <line x1="12" y1="19" x2="12" y2="22" />
                    <line x1="2" y1="12" x2="5" y2="12" />
                    <line x1="19" y1="12" x2="22" y2="12" />
                    <line x1="4.93" y1="4.93" x2="7.05" y2="7.05" />
                    <line x1="16.95" y1="16.95" x2="19.07" y2="19.07" />
                    <line x1="4.93" y1="19.07" x2="7.05" y2="16.95" />
                    <line x1="16.95" y1="7.05" x2="19.07" y2="4.93" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-[15px] sm:text-[17px] font-extrabold tracking-tight text-[#0f172a] leading-tight" style={{ fontFamily: 'var(--font-jakarta)' }}>
                    ABSOLUTE
                  </span>
                  <span className="text-[10px] font-bold tracking-[0.22em] text-[#0d9488] uppercase leading-none">
                    DIAGNOSTIC
                  </span>
                </div>
              </Link>

              {/* ═══ 2. DESKTOP NAVIGATION ═══ */}
              <nav className="hidden lg:flex items-center gap-7 xl:gap-8">
                {mainNavLinks.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`relative text-[13.5px] font-semibold transition-colors py-1 ${
                        isActive
                          ? 'text-[#0d9488]'
                          : 'text-[#334155] hover:text-[#0f172a]'
                      }`}
                    >
                      {link.label}
                      {isActive && (
                        <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#0d9488] rounded-full" />
                      )}
                    </Link>
                  );
                })}

                {/* More dropdown */}
                <div ref={moreRef} className="relative">
                  <button
                    onClick={() => setMoreOpen(!moreOpen)}
                    onMouseEnter={() => setMoreOpen(true)}
                    className="flex items-center gap-1 text-[13.5px] font-semibold text-[#334155] hover:text-[#0f172a] py-1 cursor-pointer"
                  >
                    <span>More</span>
                    <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${moreOpen ? 'rotate-180 text-[#0d9488]' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {moreOpen && (
                    <div
                      onMouseLeave={() => setMoreOpen(false)}
                      className="absolute top-full right-0 mt-2 w-60 rounded-2xl bg-white border border-slate-100 shadow-xl shadow-slate-900/10 p-2 z-50 animate-fade-in"
                    >
                      {moreNavLinks.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMoreOpen(false)}
                          className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 group-hover:bg-teal-50 transition-colors">
                            {item.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-semibold text-slate-800">{item.label}</p>
                              {item.badge && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-200">
                                  {item.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 truncate mt-0.5">{item.desc}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </nav>

              {/* ═══ 3. RIGHT CONTROLS ═══ */}
              <div className="flex items-center gap-2 sm:gap-3">
                
                {/* Search Icon Trigger */}
                <button
                  onClick={() => setSearchOpen(true)}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 transition-colors border border-transparent hover:border-slate-200"
                  aria-label="Search tests"
                  title="Search tests & packages (Ctrl+K)"
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </button>

                {/* Location Dropdown Pill (Matches Reference: 📍 Sikar, Rajasthan ⌵) */}
                <div ref={locationRef} className="relative">
                  <button
                    onClick={() => setLocationOpen(!locationOpen)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-[12px] sm:text-[13px] font-medium text-slate-700 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5 text-[#0d9488] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="truncate max-w-[85px] sm:max-w-[130px]">
                      {selectedLocation.split(',')[0]}
                      <span className="hidden sm:inline">{selectedLocation.includes(',') ? ', ' + selectedLocation.split(',')[1] : ''}</span>
                    </span>
                    <svg className={`w-3 h-3 text-slate-400 transition-transform ${locationOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {locationOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 animate-fade-in text-xs">
                      <div className="px-2.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Select Location
                      </div>
                      {[
                        'Sikar, Rajasthan',
                        'Nechwa, Sikar',
                        'Dhod, Sikar',
                        'Fatehpur, Sikar',
                        'Laxmangarh, Sikar',
                      ].map((loc) => (
                        <button
                          key={loc}
                          onClick={() => {
                            setSelectedLocation(loc);
                            setLocationOpen(false);
                          }}
                          className={`w-full text-left px-2.5 py-2 rounded-xl transition-colors flex items-center justify-between ${
                            selectedLocation === loc
                              ? 'bg-teal-50 text-[#0d9488] font-bold'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span>{loc}</span>
                          {selectedLocation === loc && (
                            <svg className="w-3.5 h-3.5 text-[#0d9488]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Primary CTA: Book a Test → (Emerald Green Pill Button) */}
                <Link
                  href="/booking"
                  className="hidden sm:inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-full bg-[#0d9488] hover:bg-[#0b7d73] text-white text-[13px] font-semibold transition-all duration-200 shadow-sm shadow-teal-700/20 active:scale-[0.98]"
                >
                  <span>Book a Test</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </Link>

                {/* Mobile Menu Toggle */}
                <button
                  onClick={() => setMobileOpen(true)}
                  className="lg:hidden p-2 rounded-xl text-slate-700 hover:text-[#0d9488] hover:bg-slate-100 transition-colors"
                  aria-label="Open menu"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
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

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 transition-opacity duration-300"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-[320px] max-w-[85vw] bg-white z-50 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#0284c7] via-[#0d9488] to-[#10b981] flex items-center justify-center text-white shadow-xs">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <circle cx="12" cy="12" r="3" />
                <line x1="12" y1="2" x2="12" y2="5" />
                <line x1="12" y1="19" x2="12" y2="22" />
                <line x1="2" y1="12" x2="5" y2="12" />
                <line x1="19" y1="12" x2="22" y2="12" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-extrabold text-[#0f172a] leading-none" style={{ fontFamily: 'var(--font-jakarta)' }}>
                ABSOLUTE
              </span>
              <span className="text-[9px] font-bold text-[#0d9488] tracking-widest uppercase mt-0.5">
                DIAGNOSTIC
              </span>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg"
            aria-label="Close menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Quick Contact Chips */}
        <div className="p-3 bg-slate-50 border-b border-slate-100 grid grid-cols-2 gap-2">
          <a
            href={`tel:${cleanPhone}`}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs"
          >
            <svg className="w-3.5 h-3.5 text-[#0d9488]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span>Call Lab</span>
          </a>
          <a
            href={`https://wa.me/${cleanWa}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 shadow-2xs"
          >
            <svg className="w-3.5 h-3.5 text-emerald-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            <span>WhatsApp</span>
          </a>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-1">
          {mobileNavLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[13.5px] font-semibold transition-colors ${
                  isActive
                    ? 'bg-teal-50 text-[#0d9488]'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span>{link.icon}</span>
                  <span>{link.label}</span>
                </div>
                {link.badge && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-teal-100 text-teal-800">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Mobile Book CTA */}
        <div className="p-4 border-t border-slate-100">
          <Link
            href="/booking"
            onClick={() => setMobileOpen(false)}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-full bg-[#0d9488] text-white text-sm font-bold shadow-md shadow-teal-800/20 active:scale-[0.98]"
          >
            <span>Book a Test</span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
        </div>
      </div>

      <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
