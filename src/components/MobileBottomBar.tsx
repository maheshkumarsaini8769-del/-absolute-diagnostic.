'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function MobileBottomBar() {
  const [phone, setPhone] = useState('+919876543210');
  const [wa, setWa] = useState('+919876543210');
  const pathname = usePathname();

  useEffect(() => {
    async function loadPhone() {
      try {
        const res = await fetch('/api/homepage');
        if (res.ok) {
          const d = await res.json();
          if (d?.settings?.contact_phone || d?.settings?.primary_phone) {
            setPhone(d.settings.contact_phone || d.settings.primary_phone);
          }
          if (d?.settings?.whatsapp_number) {
            setWa(d.settings.whatsapp_number);
          }
        }
      } catch {
        // fallback
      }
    }
    loadPhone();
  }, []);

  const cleanPhone = phone.replace(/[^\d+]/g, '');
  const cleanWa = wa.replace(/\D/g, '');

  const items = [
    {
      href: '/booking',
      label: 'Book Test',
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#0d9488' : '#64748B'} strokeWidth="2.2" strokeLinecap="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      )
    },
    {
      href: '/home-collection',
      label: 'Home Collection',
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#0d9488' : '#64748B'} strokeWidth="2.2" strokeLinecap="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      )
    },
    {
      href: '/upload-prescription',
      label: 'Upload Photo',
      icon: (active: boolean) => (
        <div className={`relative p-1 rounded-full ${active ? 'bg-teal-600 text-white shadow-xs' : 'text-[#0d9488]'}`}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        </div>
      )
    },
    {
      href: '/reports',
      label: 'Reports',
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#0d9488' : '#64748B'} strokeWidth="2.2" strokeLinecap="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      )
    },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] z-50 md:hidden mobile-bottom-bar"
      aria-label="Quick actions"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="grid grid-cols-4 gap-0 py-1">
        {items.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center justify-center py-2 px-1 transition-all duration-200 ${
                isActive ? 'text-[#0d9488] font-bold' : 'text-slate-600 font-medium hover:text-slate-900'
              }`}
              aria-label={item.label}
            >
              {item.icon(isActive)}
              <span className="text-[11px] tracking-tight mt-1 truncate max-w-full">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
