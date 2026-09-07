'use client';

import { useState, useEffect } from 'react';

export default function CinematicIntro() {
  const [visible, setVisible] = useState(true);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setHidden(true), 4300);
    return () => clearTimeout(timer);
  }, []);

  if (hidden) return null;

  return (
    <div className={`intro-overlay ${!visible ? 'hidden-intro' : ''}`} style={{ zIndex: 9999 }}>
      <div className="intro-particles">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="intro-particle" />
        ))}
      </div>

      <div className="intro-line-left" />
      <div className="intro-line-right" />

      <div className="intro-logo-wrap text-center relative z-10">
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-[var(--blue)] to-[var(--teal)] flex items-center justify-center shadow-2xl">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v4m0 12v4M2 12h4m12 0h4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
            </svg>
          </div>
        </div>

        <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-3" style={{ fontFamily: 'var(--font-jakarta)' }}>
          ABSOLUTE <span className="gradient-text">DIAGNOSTIC</span>
        </h1>

        <div className="intro-tagline">
          <p className="text-[var(--gray-400)] text-sm md:text-base tracking-[0.3em] uppercase">
            Precision Healthcare
          </p>
        </div>

        <div className="mt-8 flex justify-center">
          <div className="w-48 h-0.5 bg-gradient-to-r from-transparent via-[var(--teal)] to-transparent animate-shimmer rounded-full" />
        </div>
      </div>
    </div>
  );
}
