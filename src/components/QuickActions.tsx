'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function QuickActions() {
  const [phone, setPhone] = useState('+919876543210');
  const [wa, setWa] = useState('+919876543210');

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

  const actions = [
    {
      href: '/booking',
      label: 'Book a Test',
      color: 'from-sky-500 to-sky-600',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      )
    },
    {
      href: '/booking?collection=home_collection',
      label: 'Home Collection',
      color: 'from-teal-500 to-teal-600',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      )
    },
    {
      href: '/reports',
      label: 'View Report',
      color: 'from-blue-600 to-indigo-600',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      )
    },
    {
      href: '/tests',
      label: 'Find a Test',
      color: 'from-amber-500 to-amber-600',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
          <line x1="11" y1="8" x2="11" y2="14" />
          <line x1="8" y1="11" x2="14" y2="11" />
        </svg>
      )
    },
    {
      href: `tel:${cleanPhone}`,
      label: 'Call Lab',
      color: 'from-cyan-600 to-sky-700',
      external: true,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
      )
    },
    {
      href: `https://wa.me/${cleanWa}`,
      label: 'WhatsApp',
      color: 'from-emerald-500 to-emerald-600',
      external: true,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      )
    },
  ];

  return (
    <section className="py-8 sm:py-12 relative z-20 bg-slate-50/60 border-y border-slate-100" aria-label="Quick actions">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 sm:gap-4">
          {actions.map((action) => {
            const Tag = action.external ? 'a' : Link;
            const props = action.external ? { href: action.href, target: action.href.startsWith('http') ? '_blank' : undefined, rel: 'noopener noreferrer' } : { href: action.href };
            return (
              <Tag
                key={action.label}
                {...props}
                className="group flex flex-col items-center gap-2 sm:gap-3 p-3.5 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-sky-300 hover:shadow-xl hover:shadow-sky-950/5 transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300 shadow-md shadow-slate-900/10`}>
                  {action.icon}
                </div>
                <span className="text-[11px] sm:text-xs font-bold text-slate-700 group-hover:text-[#071224] transition-colors text-center leading-tight">
                  {action.label}
                </span>
              </Tag>
            );
          })}
        </div>
      </div>
    </section>
  );
}
