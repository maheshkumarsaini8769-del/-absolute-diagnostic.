'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function CorporatePage() {
  const [formData, setFormData] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    city: 'Sikar',
    employeeCount: '50-100',
    packageType: 'Annual Employee Wellness & Health Camp',
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyName || !formData.contactPerson || !formData.phone) {
      setErrorMsg('Please fill in Company Name, Contact Person and Phone Number.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/corporate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to submit inquiry.');
      } else {
        setSuccessMsg(data.message || 'Inquiry submitted successfully!');
        setFormData({
          companyName: '',
          contactPerson: '',
          email: '',
          phone: '',
          city: 'Sikar',
          employeeCount: '50-100',
          packageType: 'Annual Employee Wellness & Health Camp',
          notes: ''
        });
      }
    } catch {
      setErrorMsg('Failed to submit form. Please contact our support team.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/60 pb-20">
      {/* Hero Header */}
      <section className="bg-gradient-to-r from-slate-950 via-teal-950 to-slate-900 text-white py-14 sm:py-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-bold uppercase tracking-wider mb-4">
              🏢 B2B & Institutional Wellness
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Corporate & Factory Health Checkups in Rajasthan
            </h1>
            <p className="text-sm sm:text-base text-teal-100/80 mt-4 leading-relaxed">
              Tailored on-site diagnostic screening camps, Factory Act compliance panels, and pre-employment health checks for organizations of 20 to 2,000+ employees.
            </p>
          </div>
        </div>
      </section>

      {/* Main Grid: Benefits + Quotation Form */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Offerings & Benefits */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Why Top Organizations Trust Us</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-100">
                  <div className="text-2xl mb-2">🚐</div>
                  <h3 className="font-bold text-slate-900 text-sm">On-Site Mobile Lab Team</h3>
                  <p className="text-xs text-slate-600 mt-1">Our certified phlebotomists set up camps directly at your factory, office, or school with zero downtime.</p>
                </div>

                <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100">
                  <div className="text-2xl mb-2">📜</div>
                  <h3 className="font-bold text-slate-900 text-sm">Factory Act Form 32/33</h3>
                  <p className="text-xs text-slate-600 mt-1">Legally compliant statutory medical examinations, audiometry, vision tests, and occupational hazard screening.</p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                  <div className="text-2xl mb-2">⚡</div>
                  <h3 className="font-bold text-slate-900 text-sm">Same-Day Digital Reports</h3>
                  <p className="text-xs text-slate-600 mt-1">Employees get password-protected PDF reports on WhatsApp/SMS. HR receives consolidated health analytics.</p>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100">
                  <div className="text-2xl mb-2">💰</div>
                  <h3 className="font-bold text-slate-900 text-sm">Wholesale Corporate Pricing</h3>
                  <p className="text-xs text-slate-600 mt-1">Save up to 60% compared to retail test rates with customized company wellness packages.</p>
                </div>
              </div>
            </div>

            {/* Popular Corporate Packages */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Available Corporate Checkup Panels</h2>
              <div className="space-y-3">
                <div className="p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Pre-Employment Health Screening</h4>
                    <p className="text-xs text-slate-500 mt-0.5">CBC, Blood Grouping, Urine Routine, Chest X-Ray / ECG, Sugar (Fasting)</p>
                  </div>
                  <span className="text-xs font-bold text-teal-700 bg-teal-50 px-3 py-1 rounded-full shrink-0">From ₹299/employee</span>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Annual Executive Wellness Checkup</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Full CBC, Lipid Profile, Liver Function (LFT), Kidney (KFT), HbA1c, Thyroid, Urine</p>
                  </div>
                  <span className="text-xs font-bold text-teal-700 bg-teal-50 px-3 py-1 rounded-full shrink-0">From ₹699/employee</span>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Factory Workers Occupational Screen</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Audiometry, Pulmonary Function (Spirometry), Heavy Metals, Routine Blood & Eye</p>
                  </div>
                  <span className="text-xs font-bold text-teal-700 bg-teal-50 px-3 py-1 rounded-full shrink-0">Custom Quotation</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Quotation Form */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-teal-600/30 shadow-xl sticky top-24">
              <div className="border-b border-slate-100 pb-4 mb-5">
                <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">Fast Quotation</span>
                <h3 className="text-xl font-black text-slate-900 mt-0.5">Request Corporate Rates</h3>
                <p className="text-xs text-slate-500 mt-1">Get customized proposal and discounted group pricing in 24 hours.</p>
              </div>

              {successMsg ? (
                <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-center space-y-3">
                  <span className="text-4xl block">🎉</span>
                  <h4 className="font-bold text-sm">Inquiry Received!</h4>
                  <p className="text-xs leading-relaxed">{successMsg}</p>
                  <button
                    type="button"
                    onClick={() => setSuccessMsg('')}
                    className="mt-2 text-xs font-bold text-emerald-700 underline"
                  >
                    Submit another inquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {errorMsg && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-medium">
                      ⚠️ {errorMsg}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Company / Institution Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sikar Marble Works / ABC Public School"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Contact Person *</label>
                      <input
                        type="text"
                        required
                        placeholder="HR / Admin Name"
                        value={formData.contactPerson}
                        onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number *</label>
                      <input
                        type="tel"
                        required
                        placeholder="10-digit Phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      placeholder="hr@company.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">City / District</label>
                      <input
                        type="text"
                        placeholder="Sikar, Jaipur, etc."
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Employee Count</label>
                      <select
                        value={formData.employeeCount}
                        onChange={(e) => setFormData({ ...formData, employeeCount: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-teal-500 bg-white"
                      >
                        <option value="20-50">20 - 50 Employees</option>
                        <option value="50-100">50 - 100 Employees</option>
                        <option value="100-300">100 - 300 Employees</option>
                        <option value="300-1000">300 - 1000+ Employees</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Interested Package</label>
                    <select
                      value={formData.packageType}
                      onChange={(e) => setFormData({ ...formData, packageType: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-teal-500 bg-white"
                    >
                      <option value="Annual Employee Wellness & Health Camp">Annual Employee Wellness & Health Camp</option>
                      <option value="Pre-Employment Health Screening">Pre-Employment Health Screening</option>
                      <option value="Factory Act Form 32/33 Compliance">Factory Act Form 32/33 Compliance</option>
                      <option value="Executive C-Suite Health Panel">Executive C-Suite Health Panel</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Special Requirements (Optional)</label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Need on-site camp on Sunday, specific tests required..."
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-xl bg-[#0d9488] hover:bg-[#0b7d73] text-white text-sm font-bold shadow-md shadow-teal-700/20 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-70 cursor-pointer"
                  >
                    {loading ? 'Submitting Quotation Request...' : 'Get Instant Corporate Quote →'}
                  </button>

                  <p className="text-center text-[11px] text-slate-400">
                    Prefer direct call? Call B2B Desk: <a href="tel:+919876543210" className="font-semibold text-teal-600 underline">+91 98765 43210</a>
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
