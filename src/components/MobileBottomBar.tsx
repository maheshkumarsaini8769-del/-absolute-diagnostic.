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
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#0d9488' : '#64748B'} strokeWidth="2.2" strokeLinecap="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      )
    },
    {
      href: '/home-collection',
      label: 'Home Sample',
      icon: (active: boolean) => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#0d9488' : '#64748B'} strokeWidth="2.2" strokeLinecap="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      )
    },
    {
      href: '/upload-prescription',
      label: 'Upload Rx',
      icon: (active: boolean) => (
        <div className={`relative p-1 rounded-full ${active ? 'bg-teal-500 text-white shadow-xs' : 'text-teal-600'}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        </div>
      )
    },
    {
      href: `https://wa.me/${cleanWa}`,
      label: 'WhatsApp',
      external: true,
      icon: (_active: boolean) => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="#10B981">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      )
    },
    {
      href: '/reports',
      label: 'Reports',
      icon: (active: boolean) => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#0d9488' : '#64748B'} strokeWidth="2.2" strokeLinecap="round">
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
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] z-40 md:hidden mobile-bottom-bar"
      aria-label="Quick actions"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="grid grid-cols-5 gap-0 py-1">
        {items.map((item) => {
          const isActive = !item.external && pathname === item.href;
          const Tag = item.external ? 'a' : Link;
          const props = item.external ? { href: item.href, target: item.href.startsWith('http') ? '_blank' : undefined, rel: 'noopener noreferrer' } : { href: item.href };
          return (
            <Tag
              key={item.label}
              {...props}
              className={`flex flex-col items-center justify-center py-2 px-0.5 transition-all duration-200 ${
                isActive ? 'text-[#0d9488] font-bold' : 'text-slate-600 font-medium hover:text-slate-900'
              }`}
              aria-label={item.label}
            >
              {item.icon(isActive)}
              <span className="text-[10px] tracking-tight mt-1 truncate max-w-full">{item.label}</span>
            </Tag>
          );
        })}
      </div>
    </nav>
  );
}
