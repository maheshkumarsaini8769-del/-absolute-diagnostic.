'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/tests', label: 'Tests' },
  { href: '/packages', label: 'Packages' },
  { href: '/services', label: 'Services' },
  { href: '/booking', label: 'Book Test' },
  { href: '/branches', label: 'Branches' },
  { href: '/about', label: 'About Us' },
  { href: '/blog', label: 'Blog' },
  { href: '/faq', label: 'FAQ' },
  { href: '/night-service', label: 'Night Service' },
  { href: '/home-collection', label: 'Home Collection' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/reports', label: 'View Reports' },
  { href: '/contact', label: 'Contact' },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <>
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'glass shadow-lg shadow-black/5'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <Link href="/" className="flex items-center gap-3 group" aria-label="Home">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--blue)] to-[var(--teal)] flex items-center justify-center shadow-lg shadow-[var(--blue-glow)] group-hover:shadow-[var(--teal-glow)] transition-shadow duration-300">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v4m0 12v4M2 12h4m12 0h4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-[var(--navy)] leading-none" style={{ fontFamily: 'var(--font-jakarta)' }}>
                ABSOLUTE
              </span>
              <span className="text-[9px] font-semibold tracking-[0.25em] text-[var(--blue)] uppercase leading-none mt-0.5">
                DIAGNOSTIC
              </span>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-1" aria-label="Main">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  pathname === link.href
                    ? 'text-[var(--blue)] bg-[var(--blue)]/8'
                    : 'text-[var(--gray-600)] hover:text-[var(--navy)]'
                }`}
              >
                {link.label}
                {pathname === link.href && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-gradient-to-r from-[var(--blue)] to-[var(--teal)]" />
                )}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/booking"
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-600 to-purple-500 text-white text-sm font-semibold hover:scale-105 active:scale-95 transition-transform duration-200"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              Book Test
            </Link>
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2.5 rounded-xl hover:bg-[var(--gray-100)] transition-colors"
              aria-label="Open menu"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--navy)" strokeWidth="2" strokeLinecap="round">
                <line x1="4" y1="7" x2="20" y2="7" />
                <line x1="4" y1="12" x2="16" y2="12" />
                <line x1="4" y1="17" x2="12" y2="17" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <div
        className={`fixed top-0 right-0 h-full w-[300px] max-w-[85vw] z-50 transform transition-transform duration-500 lg:hidden overflow-hidden ${
          mobileOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        <div className="h-full bg-white shadow-2xl shadow-black/20 flex flex-col">
          <div className="flex items-center justify-between p-5 border-b border-[var(--gray-100)]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--blue)] to-[var(--teal)] flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M12 2v4m0 12v4M2 12h4m12 0h4" />
                </svg>
              </div>
              <span className="font-bold text-[var(--navy)] text-sm" style={{ fontFamily: 'var(--font-jakarta)' }}>
                ABSOLUTE
              </span>
            </div>
            <button onClick={() => setMobileOpen(false)} className="p-2 rounded-xl hover:bg-[var(--gray-100)] transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--gray-500)" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  pathname === link.href
                    ? 'text-purple-600 bg-purple-50 font-semibold'
                    : 'text-[var(--gray-700)] hover:bg-[var(--gray-50)]'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t border-[var(--gray-100)] my-2 pt-2">
              <Link href="/admin/login" className="block px-3 py-2.5 rounded-lg text-sm font-semibold text-purple-600 bg-purple-50 hover:bg-purple-100 transition-all">
                Admin Panel
              </Link>
            </div>
            <div className="pt-1">
              <Link href="/privacy-policy" className="block px-3 py-2 rounded-lg text-xs text-[var(--gray-400)] hover:bg-[var(--gray-50)]">
                Privacy Policy
              </Link>
              <Link href="/terms" className="block px-3 py-2 rounded-lg text-xs text-[var(--gray-400)] hover:bg-[var(--gray-50)]">
                Terms & Conditions
              </Link>
            </div>
          </nav>

          <div className="p-3 border-t border-[var(--gray-100)] space-y-2 shrink-0">
            <a href="tel:" className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-[var(--gray-700)] hover:text-[var(--blue)] transition-colors rounded-xl hover:bg-[var(--gray-50)]">
              <div className="w-8 h-8 rounded-lg bg-[var(--blue)]/10 flex items-center justify-center shrink-0">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2" strokeLinecap="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </div>
              Call Us
            </a>
            <a href="https://wa.me/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-[var(--gray-700)] hover:text-green-600 transition-colors rounded-xl hover:bg-[var(--gray-50)]">
              <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="var(--success)">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </div>
WhatsApp
            </a>
          </div>
        </div>
      </div>
    </header>
  </>
  );
}
