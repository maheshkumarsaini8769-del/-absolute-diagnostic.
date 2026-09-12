'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';

export default function BloodCardPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    bloodGroup: 'B+',
    dob: '',
    emergencyContact: '',
    emergencyPhone: '',
    allergies: 'None',
    city: 'Sikar, Rajasthan',
  });

  const [downloading, setDownloading] = useState(false);

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 650;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        // Draw card background
        const grad = ctx.createLinearGradient(0, 0, 650, 400);
        grad.addColorStop(0, '#0f172a');
        grad.addColorStop(0.6, '#1e293b');
        grad.addColorStop(1, '#0f766e');
        ctx.fillStyle = grad;
        ctx.roundRect(0, 0, 650, 400, 24);
        ctx.fill();

        // Accent header bar
        ctx.fillStyle = '#0d9488';
        ctx.fillRect(0, 0, 650, 10);

        // Header Text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px system-ui, sans-serif';
        ctx.fillText('ABSOLUTE DIAGNOSTIC CENTRE', 30, 48);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '13px system-ui, sans-serif';
        ctx.fillText('EMERGENCY MEDICAL & BLOOD GROUP ID', 30, 72);

        // Blood Group Badge (Top Right)
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.roundRect(490, 30, 130, 90, 16);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px system-ui, sans-serif';
        ctx.fillText('BLOOD GROUP', 510, 55);

        ctx.font = 'bold 44px system-ui, sans-serif';
        ctx.fillText(formData.bloodGroup, 515, 102);

        // Divider
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(30, 135);
        ctx.lineTo(620, 135);
        ctx.stroke();

        // Details Column
        ctx.fillStyle = '#94a3b8';
        ctx.font = '12px system-ui, sans-serif';
        ctx.fillText('PATIENT FULL NAME', 30, 165);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px system-ui, sans-serif';
        ctx.fillText(formData.fullName.toUpperCase(), 30, 192);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '12px system-ui, sans-serif';
        ctx.fillText('EMERGENCY CONTACT', 30, 235);
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 16px system-ui, sans-serif';
        ctx.fillText(`${formData.emergencyContact || 'Family'} : +91 ${formData.emergencyPhone}`, 30, 260);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '12px system-ui, sans-serif';
        ctx.fillText('KNOWN ALLERGIES / CONDITIONS', 30, 305);
        ctx.fillStyle = '#f87171';
        ctx.font = 'bold 15px system-ui, sans-serif';
        ctx.fillText(formData.allergies || 'None Known', 30, 330);

        // Footer Note
        ctx.fillStyle = '#64748b';
        ctx.font = '11px system-ui, sans-serif';
        ctx.fillText('NABL Accredited • 24x7 Lab Helpline: +91 91141 23456 • Verified by Absolute Diagnostic', 30, 375);

        const imgData = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = imgData;
        a.download = `Medical_ID_${formData.fullName.replace(/\s+/g, '_')}_${formData.bloodGroup}.png`;
        a.click();
      }
    } catch (err) {
      console.error(err);
    }
    setDownloading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Top breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-xs text-slate-500">
          <Link href="/" className="hover:text-teal-600">Home</Link>
          <span>/</span>
          <span className="text-slate-800 font-semibold">Digital Emergency Medical ID</span>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-600 border border-rose-200 mb-2">
            <span>🩸</span> Instant Emergency Card
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight" style={{ fontFamily: 'var(--font-jakarta)' }}>
            Digital Blood Group &amp; Emergency Medical ID
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
            In emergency situations, having your verified blood group and emergency contact details readily accessible saves crucial time. Generate and download your free digital medical card in 1-click.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Form */}
          <div className="lg:col-span-6 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-500" />
              Enter Your Medical Information
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Blood Group *</label>
                <div className="grid grid-cols-4 gap-2">
                  {bloodGroups.map((bg) => (
                    <button
                      key={bg}
                      type="button"
                      onClick={() => setFormData({ ...formData, bloodGroup: bg })}
                      className={`py-2 text-xs font-extrabold rounded-xl border transition-all cursor-pointer ${
                        formData.bloodGroup === bg
                          ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {bg}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Emergency Contact Relation</label>
                  <input
                    type="text"
                    placeholder="e.g. Father / Brother / Spouse"
                    value={formData.emergencyContact}
                    onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Emergency Phone Number *</label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="9876543210"
                    value={formData.emergencyPhone}
                    onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value.replace(/\D/g, '') })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Known Allergies / Medical Conditions</label>
                <input
                  type="text"
                  placeholder="e.g. Penicillin, Asthma (or None)"
                  value={formData.allergies}
                  onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-teal-500 focus:outline-none"
                />
              </div>

            </div>
          </div>

          {/* Card Preview */}
          <div className="lg:col-span-6 flex flex-col items-center">
            <div className="w-full max-w-[420px] rounded-3xl overflow-hidden shadow-2xl border border-slate-700 bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 p-6 text-white relative">
              {/* Top Accent bar */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-teal-500 to-emerald-400" />

              <div className="flex justify-between items-start pb-4 border-b border-slate-700/80 mb-5">
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base tracking-tight text-white">
                    ABSOLUTE DIAGNOSTIC
                  </h3>
                  <p className="text-[10px] text-teal-400 font-bold uppercase tracking-wider">
                    Emergency Medical &amp; Blood ID
                  </p>
                </div>
                <div className="text-center px-3.5 py-2 rounded-2xl bg-rose-600 text-white shadow-lg border border-rose-500/50">
                  <span className="block text-[9px] uppercase font-bold tracking-wider opacity-90">Blood</span>
                  <span className="block text-2xl font-black leading-none">{formData.bloodGroup}</span>
                </div>
              </div>

              <div className="space-y-3.5">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Patient Name</span>
                  <span className="text-lg font-black text-white capitalize block">
                    {formData.fullName || 'YOUR FULL NAME'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Emergency Contact</span>
                    <span className="text-xs font-bold text-sky-300 block">
                      {formData.emergencyContact || 'Relation'}
                    </span>
                    <span className="text-xs font-mono text-white block">
                      {formData.emergencyPhone ? `+91 ${formData.emergencyPhone}` : '+91 9XXXXXXXXX'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Allergies / Alert</span>
                    <span className="text-xs font-bold text-rose-300 block truncate">
                      {formData.allergies || 'None Known'}
                    </span>
                    <span className="text-[10px] text-slate-400 block">City: Sikar, Raj</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-3.5 border-t border-slate-700/80 flex items-center justify-between text-[9px] text-slate-400">
                <span>NABL Accredited • ISO 9001</span>
                <span>Helpline: +91 91141 23456</span>
              </div>
            </div>

            {/* Action Download Buttons */}
            <div className="mt-5 w-full max-w-[420px] flex flex-col gap-2.5">
              <button
                onClick={handleDownload}
                disabled={!formData.fullName}
                className="w-full py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
              >
                <span>💾</span>
                <span>{downloading ? 'Downloading Card...' : 'Download Card (Save to Mobile)'}</span>
              </button>

              <p className="text-center text-[11px] text-slate-500">
                ✨ Save this card on your phone, set as lock screen wallpaper, or keep a copy in your wallet.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
