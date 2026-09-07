'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import TiltCard from '@/components/TiltCard';

interface Service {
  id: string;
  name: string;
  slug: string;
  title?: string;
  description?: string;
  icon?: string;
}

export default function ServicesList() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/services')
      .then(r => r.json())
      .then(data => { setServices(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="rounded-2xl bg-white border border-[var(--gray-100)] p-7 animate-pulse">
                <div className="w-14 h-14 rounded-2xl bg-[var(--gray-100)] mb-5" />
                <div className="h-5 bg-[var(--gray-100)] rounded w-3/4 mb-3" />
                <div className="h-4 bg-[var(--gray-100)] rounded w-full mb-2" />
                <div className="h-4 bg-[var(--gray-100)] rounded w-2/3" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  const iconMap: Record<string, React.JSX.Element> = {
    blood: (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" /></svg>),
    imaging: (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>),
    home: (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>),
    wellness: (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>),
  };

  function getDefaultIcon(slug: string) {
    for (const key of Object.keys(iconMap)) {
      if (slug.includes(key)) return iconMap[key];
    }
    return (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>);
  }

  if (services.length === 0) {
    return (
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-20 reveal">
            <div className="w-20 h-20 rounded-2xl bg-[var(--gray-100)] flex items-center justify-center mx-auto mb-6">
              <svg className="text-[var(--gray-300)]" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
            </div>
            <p className="text-[var(--gray-700)] font-bold text-lg">No services listed</p>
            <p className="text-[var(--gray-400)] text-sm mt-1">Contact us for information about our services.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 stagger reveal">
          {services.map((service) => (
            <Link key={service.id} href={`/services/${service.slug}`} className="group flex">
              <TiltCard className="w-full">
                <div className="surface-elevated rounded-2xl p-7 relative overflow-hidden h-full">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[var(--blue)]/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--blue)]/10 to-[var(--teal)]/10 flex items-center justify-center mb-5 text-[var(--blue)] group-hover:from-[var(--blue)] group-hover:to-[var(--teal)] group-hover:text-white transition-all duration-500">
                      {service.icon && iconMap[service.icon] ? iconMap[service.icon] : getDefaultIcon(service.slug)}
                    </div>
                    <h2 className="text-lg font-bold text-[var(--navy)] mb-3 group-hover:text-[var(--blue)] transition-colors" style={{ fontFamily: 'var(--font-jakarta)' }}>
                      {service.title || service.name}
                    </h2>
                    {service.description && (
                      <p className="text-sm text-[var(--gray-500)] leading-relaxed line-clamp-3 mb-4">{service.description}</p>
                    )}
                    <div className="flex items-center gap-2 text-sm font-semibold text-[var(--blue)] opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      Learn More
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                    </div>
                  </div>
                </div>
              </TiltCard>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
