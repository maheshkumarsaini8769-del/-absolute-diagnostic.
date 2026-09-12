'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';

export function WhatsAppWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { language } = useLanguage();

  // WhatsApp support phone (Indian format without + or -)
  const WHATSAPP_PHONE = '911412345678';

  const getCustomMessage = () => {
    if (pathname.includes('/tests/')) {
      return 'Hello Absolute Diagnostic, I am viewing tests on your website and want to book home collection.';
    }
    if (pathname.includes('/packages/')) {
      return 'Hello Absolute Diagnostic, I would like to inquire about and book your health packages.';
    }
    if (pathname.includes('/reports')) {
      return 'Hello Absolute Diagnostic, I need assistance accessing my lab report.';
    }
    return 'Hello Absolute Diagnostic, I would like to book a blood test and home sample collection. Please assist me.';
  };

  const openWhatsApp = () => {
    const text = encodeURIComponent(getCustomMessage());
    window.open(`https://wa.me/${WHATSAPP_PHONE}?text=${text}`, '_blank');
  };

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-24 z-50 flex flex-col items-end print:hidden">
      {/* Quick Prompt Tooltip on Hover / Toggle */}
      {isOpen && (
        <div className="mb-3 w-72 max-w-[calc(100vw-32px)] rounded-2xl bg-white p-4 shadow-2xl border border-emerald-100 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-start justify-between pb-2 border-b border-gray-100">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <div className="h-3 w-3 rounded-full bg-emerald-500 animate-ping absolute inset-0" />
                <div className="h-3 w-3 rounded-full bg-emerald-500 relative" />
              </div>
              <span className="text-xs font-semibold text-emerald-800">
                Lab Support Online
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600 text-sm font-bold leading-none"
            >
              ×
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-600 leading-relaxed">
            Hi! Would you like to book a blood test or home sample collection?
          </p>
          <button
            onClick={openWhatsApp}
            className="mt-3 flex w-full items-center justify-center space-x-2 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-medium text-white shadow hover:bg-emerald-700 transition"
          >
            <span>Start WhatsApp Chat</span>
            <span>➔</span>
          </button>
        </div>
      )}

      {/* Main Floating Button */}
      <div className="relative flex items-center">
        {!isOpen && (
          <div
            onClick={() => setIsOpen(true)}
            className="mr-3 hidden sm:flex cursor-pointer items-center space-x-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-lg border border-emerald-200 hover:border-emerald-400 transition"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>Chat on WhatsApp</span>
          </div>
        )}

        <button
          onClick={() => {
            if (!isOpen) {
              setIsOpen(true);
            } else {
              openWhatsApp();
            }
          }}
          aria-label="Chat on WhatsApp"
          className="group relative flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-xl hover:bg-emerald-600 hover:scale-105 active:scale-95 transition-all duration-200"
        >
          {/* Pulsing ring */}
          <span className="absolute -inset-1 rounded-full bg-emerald-400 opacity-40 group-hover:opacity-75 animate-pulse" />

          {/* WhatsApp SVG Icon */}
          <svg
            className="relative h-6 w-6 sm:h-7 sm:w-7 fill-current"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
