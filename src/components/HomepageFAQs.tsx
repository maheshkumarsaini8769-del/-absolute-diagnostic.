'use client';

import { useState, useEffect } from 'react';

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

export default function HomepageFAQs() {
  const [openId, setOpenId] = useState<string | null>(null);
  const [faqs, setFaqs] = useState<FAQ[]>([]);

  useEffect(() => {
    fetch('/api/faqs')
      .then(r => r.json())
      .then(data => setFaqs(Array.isArray(data) ? data : data.faqs || []))
      .catch(() => {});
  }, []);

  if (faqs.length === 0) return null;

  return (
    <section className="py-20 lg:py-28 bg-gradient-to-b from-[var(--gray-50)] to-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14 reveal">
          <span className="inline-block text-xs font-bold tracking-[0.2em] uppercase text-[var(--blue)] mb-3">FAQs</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-[var(--navy)]" style={{ fontFamily: 'var(--font-jakarta)' }}>
            Frequently Asked Questions
          </h2>
          <p className="text-[var(--gray-500)] mt-2">Find answers to common questions about our services</p>
        </div>

        <div className="space-y-3 stagger reveal">
          {faqs.map((faq) => {
            const isOpen = openId === faq.id;
            return (
              <div key={faq.id} className="rounded-2xl border border-[var(--gray-100)] bg-white overflow-hidden hover:border-[var(--blue)]/15 transition-colors duration-300">
                <button
                  onClick={() => setOpenId(isOpen ? null : faq.id)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left group"
                >
                  <span className="font-semibold text-[var(--navy)] text-sm pr-4 group-hover:text-[var(--blue)] transition-colors">
                    {faq.question}
                  </span>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300 ${isOpen ? 'bg-[var(--blue)] text-white rotate-180' : 'bg-[var(--gray-50)] text-[var(--gray-500)]'}`}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9" /></svg>
                  </div>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96' : 'max-h-0'}`}>
                  <div className="px-6 pb-5 text-sm text-[var(--gray-600)] leading-relaxed whitespace-pre-wrap">
                    {faq.answer}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
