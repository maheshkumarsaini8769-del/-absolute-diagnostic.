'use client';

import SymptomCheckerWidget from '@/components/SymptomCheckerWidget';
import Link from 'next/link';

export default function SymptomsPage() {
  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Breadcrumb Header */}
      <div className="bg-white border-b border-slate-200/80 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="text-xs text-slate-500 flex items-center gap-2">
            <Link href="/" className="hover:text-teal-600 transition-colors">Home</Link>
            <span>/</span>
            <span className="text-slate-900 font-semibold">Symptom-to-Test Checker</span>
          </nav>
        </div>
      </div>

      {/* Main Widget */}
      <SymptomCheckerWidget />

      {/* Clinical FAQ / Guidance */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-8">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
          <h3 className="text-lg font-bold text-slate-900 mb-4">
            How does our Diagnostic Algorithm work?
          </h3>
          <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
            <p>
              Our symptom analysis engine maps primary patient-reported health concerns to standard NABL clinical pathology panels and ICMR-recommended testing guidelines.
            </p>
            <p>
              <strong className="text-slate-800">Please Note:</strong> This tool provides educational guidance on appropriate lab investigations and is not a substitute for clinical diagnosis by a registered medical practitioner. Always share your complete report with your consulting physician.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
