'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface TimelineStep {
  step: number;
  title: string;
  subtitle: string;
  completed: boolean;
  active: boolean;
  time: string;
}

interface TrackingData {
  booking: {
    id: string;
    bookingId: string;
    patientName: string;
    patientPhone: string;
    collectionType: string;
    preferredDate: string;
    preferredTime: string;
    status: string;
    totalAmount: number;
    createdAt: string;
    items: { name: string; price: number }[];
  };
  tracking: {
    currentStep: number;
    stepTitle: string;
    stepDescription: string;
    timeline: TimelineStep[];
    reportAvailable: boolean;
    reportId: string | null;
  };
}

function TrackContent() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get('q') || searchParams.get('id') || '';

  const [searchQuery, setSearchQuery] = useState(initialQ);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [data, setData] = useState<TrackingData | null>(null);

  const fetchTracking = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/track?q=${encodeURIComponent(q.trim())}`);
      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.error || 'No booking found');
        setData(null);
      } else {
        setData(json);
      }
    } catch {
      setErrorMsg('Failed to fetch tracking data. Please check connection.');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQ) {
      fetchTracking(initialQ);
    }
  }, [initialQ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setErrorMsg('Please enter your Booking ID (e.g. ADC-...) or 10-digit mobile number');
      return;
    }
    fetchTracking(searchQuery);
  };

  return (
    <div className="min-h-screen bg-slate-50/70 pb-20 pt-6 sm:pt-10">
      {/* Header Banner */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 mb-8 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200/80 text-[#0d9488] text-xs font-bold uppercase tracking-wider mb-3">
          <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
          Live Sample Tracking
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Track Your Lab Sample & Report
        </h1>
        <p className="text-sm sm:text-base text-slate-600 mt-2 max-w-xl mx-auto">
          Monitor your sample journey from home collection to NABL lab testing and final MD Pathologist verification.
        </p>

        {/* Search Box */}
        <form onSubmit={handleSubmit} className="mt-6 max-w-xl mx-auto">
          <div className="relative flex items-center bg-white rounded-2xl border-2 border-slate-200 shadow-sm p-1.5 focus-within:border-teal-500 focus-within:ring-3 focus-within:ring-teal-500/10 transition-all">
            <svg className="w-5 h-5 text-slate-400 ml-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter Booking ID (ADC-...) or 10-digit Phone"
              className="w-full bg-transparent px-3 py-2 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-[#0d9488] hover:bg-[#0b7d73] text-white px-5 sm:px-6 py-2.5 rounded-xl font-bold text-sm shrink-0 transition-all shadow-sm hover:shadow-md disabled:opacity-70 cursor-pointer"
            >
              {loading ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Tracking...</span>
                </span>
              ) : (
                'Track Status'
              )}
            </button>
          </div>
        </form>

        {errorMsg && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs sm:text-sm font-medium max-w-md mx-auto">
            ⚠️ {errorMsg}
          </div>
        )}
      </div>

      {/* Results View */}
      {data && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
          {/* Status Overview Card */}
          <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-slate-100">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Booking ID</span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">{data.booking.bookingId}</h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  Patient: <span className="font-semibold text-slate-800">{data.booking.patientName}</span>
                  {data.booking.patientPhone && ` (${data.booking.patientPhone})`}
                </p>
              </div>

              <div className="text-right">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-[#0d9488] text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping" />
                  {data.tracking.stepTitle}
                </div>
                <p className="text-xs text-slate-500 mt-1.5">{data.booking.collectionType}</p>
              </div>
            </div>

            {/* Stepper Progress Bar */}
            <div className="py-6 sm:py-8">
              <div className="grid grid-cols-5 gap-1 sm:gap-2 relative">
                {/* Connecting background bar */}
                <div className="absolute top-4 left-4 right-4 h-1 bg-slate-200 -z-0" />
                <div
                  className="absolute top-4 left-4 h-1 bg-teal-500 transition-all duration-700 -z-0"
                  style={{ width: `${Math.max(0, (data.tracking.currentStep - 1) * 25)}%` }}
                />

                {data.tracking.timeline.map((step) => (
                  <div key={step.step} className="flex flex-col items-center text-center relative z-10">
                    <div
                      className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all duration-300 ${
                        step.completed
                          ? 'bg-[#0d9488] text-white shadow-md shadow-teal-700/20'
                          : 'bg-white border-2 border-slate-300 text-slate-400'
                      } ${step.active ? 'ring-4 ring-teal-500/20 scale-110' : ''}`}
                    >
                      {step.completed ? (
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        step.step
                      )}
                    </div>
                    <span className={`text-[10px] sm:text-xs font-bold mt-2 leading-tight ${step.completed ? 'text-slate-900' : 'text-slate-400'}`}>
                      {step.title}
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-slate-500 mt-0.5 hidden sm:block">
                      {step.subtitle}
                    </span>
                    <span className="text-[8px] sm:text-[9px] text-teal-700 font-medium mt-0.5">
                      {step.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Current Step Description Alert */}
            <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-100 flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center shrink-0 text-base">
                🧪
              </div>
              <div className="flex-1">
                <h4 className="text-xs sm:text-sm font-bold text-teal-950">{data.tracking.stepTitle}</h4>
                <p className="text-xs text-teal-800 mt-0.5 leading-relaxed">{data.tracking.stepDescription}</p>
              </div>
              {data.tracking.reportAvailable && (
                <Link
                  href="/reports"
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shrink-0 shadow-xs transition-all"
                >
                  View Report →
                </Link>
              )}
            </div>
          </div>

          {/* Test Items & Cold-Chain Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Booked Investigations Card */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Booked Investigations</h3>
              <div className="space-y-2">
                {data.booking.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0 text-xs sm:text-sm">
                    <span className="font-semibold text-slate-800">{item.name}</span>
                    <span className="font-bold text-teal-700">₹{item.price}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs sm:text-sm font-black text-slate-900">
                <span>Total Amount:</span>
                <span className="text-emerald-700">₹{data.booking.totalAmount}</span>
              </div>
            </div>

            {/* Quality & Safety Assurance Card */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Quality & Safety Guarantee</h3>
              
              <div className="flex items-start gap-2.5 text-xs text-slate-700">
                <span className="text-emerald-600 font-bold text-base">✓</span>
                <div>
                  <span className="font-bold text-slate-900">Cold-Chain Temperature Sealed:</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">Transported in insulated 2°C–8°C ice-gel coolers to protect enzyme and cell integrity.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-xs text-slate-700">
                <span className="text-emerald-600 font-bold text-base">✓</span>
                <div>
                  <span className="font-bold text-slate-900">Gentle Butterfly Needles:</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">Ultra-thin painless needles used for comfortable vein puncture.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-xs text-slate-700">
                <span className="text-emerald-600 font-bold text-base">✓</span>
                <div>
                  <span className="font-bold text-slate-900">Dual Barcode Tracking:</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">Zero sample mix-up risk with automated NABL LIS scanner integration.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Need Assistance Bar */}
          <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-sm">Need help or want to reschedule?</h4>
              <p className="text-xs text-slate-400 mt-0.5">Our phlebotomy coordinator is available from 6:00 AM to 10:00 PM.</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <a
                href="tel:+919876543210"
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition-all"
              >
                📞 Call Lab
              </a>
              <a
                href="https://wa.me/911412345678"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm"
              >
                💬 WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <TrackContent />
    </Suspense>
  );
}
