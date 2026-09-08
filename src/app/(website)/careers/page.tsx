'use client';

import { useState } from 'react';
import Link from 'next/link';
import HomepageAnimations from '@/components/HomepageAnimations';

interface JobPosition {
  id: string;
  title: string;
  department: string;
  type: string;
  location: string;
  experience: string;
  description: string;
  requirements: string[];
}

const POSITIONS: JobPosition[] = [
  {
    id: 'pathologist',
    title: 'Consultant Pathologist (MD / DNB)',
    department: 'Pathology & Clinical Lab',
    type: 'Full-Time / Consultant',
    location: 'Main Laboratory Hub',
    experience: '3+ Years Post-MD',
    description: 'Lead clinical verification and digital sign-off of biochemistry, hematology, and histopathology test panels. Drive laboratory quality assurance and IQC compliance.',
    requirements: [
      'MD / DNB in Pathology from an NMC-recognized institution',
      'Strong clinical acumen in critical-value escalation and smear review',
      'Familiarity with NABL ISO 15189 laboratory standards',
      'Excellent communication skills for referring physician consultation'
    ]
  },
  {
    id: 'lab-technician',
    title: 'Senior Medical Laboratory Technician',
    department: 'Laboratory Operations',
    type: 'Full-Time',
    location: 'Main Laboratory',
    experience: '2-5 Years',
    description: 'Operate automated analyzers (Sysmex, Roche Cobas, Beckman Coulter), run daily calibration and multi-level QC controls, and execute technician worklists.',
    requirements: [
      'B.Sc / M.Sc in Medical Laboratory Technology (MLT)',
      'Hands-on expertise with automated chemistry & hematology platforms',
      'Proficiency in specimen accessioning, aliquoting, and rejection triage',
      'Diligent adherence to SOPs, biosafety, and biomedical waste disposal'
    ]
  },
  {
    id: 'phlebotomist',
    title: 'Certified Phlebotomist & Field Executive',
    department: 'Home Collection Logistics',
    type: 'Full-Time (Field)',
    location: 'City Hubs & Doorstep Routes',
    experience: '1-4 Years',
    description: 'Deliver compassionate, hygienic doorstep blood collection services. Manage sample temperature integrity, barcode accessioning, and route execution.',
    requirements: [
      'DMLT or certified phlebotomy credential',
      'Impeccable aseptic technique with pediatric and geriatric venipuncture skills',
      'Valid two-wheeler driving license and smartphone familiarity',
      'Patient-first demeanor and strict cold-chain compliance'
    ]
  },
  {
    id: 'patient-care',
    title: 'Front-Desk & Patient Care Coordinator',
    department: 'Patient Services',
    type: 'Full-Time',
    location: 'Diagnostic Centre',
    experience: '1-3 Years',
    description: 'Welcome walk-in patients, assist with test selection, billing, invoice generation, appointment scheduling, and dispatching digitally verified reports.',
    requirements: [
      'Graduate in any discipline (Healthcare / Life Sciences preferred)',
      'Courteous multilingual communication skills (Hindi, English)',
      'Basic computer efficiency and familiarity with LIMS or billing systems',
      'Empathetic approach to patient care and inquiry handling'
    ]
  }
];

export default function CareersPage() {
  const [selectedJob, setSelectedJob] = useState<JobPosition | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    experience: '',
    qualification: '',
    notes: ''
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleOpenApply = (job: JobPosition) => {
    setSelectedJob(job);
    setStatus('idle');
    setErrorMessage('');
  };

  const handleCloseModal = () => {
    setSelectedJob(null);
    setStatus('idle');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !selectedJob) return;

    setStatus('submitting');
    setErrorMessage('');

    try {
      const res = await fetch('/api/careers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          position: selectedJob.title,
          experience: formData.experience,
          qualification: formData.qualification,
          notes: formData.notes
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit application');
      }

      setStatus('success');
      setFormData({
        name: '',
        phone: '',
        email: '',
        experience: '',
        qualification: '',
        notes: ''
      });
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Error sending application');
    }
  };

  return (
    <HomepageAnimations>
      <div className="pb-20">
        {/* ═══ HERO ═══ */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #0A1628 0%, #0c2016 50%, #0A1628 100%)' }} />
          <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--teal)] rounded-full blur-[220px] opacity-10" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-[var(--blue)] rounded-full blur-[180px] opacity-10" />
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(52,211,153,0.04) 1px, transparent 0)', backgroundSize: '32px 32px' }} />

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
            <nav className="text-sm text-[var(--gray-500)] mb-6" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-[var(--teal)] transition-colors">Home</Link>
              <span className="mx-2 text-[var(--gray-600)]">/</span>
              <span className="text-white">Careers</span>
            </nav>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--teal)]/10 border border-[var(--teal)]/20 text-[var(--teal)] text-xs font-bold uppercase tracking-wider mb-4">
              Join Our Medical Mission
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold text-white mb-4 tracking-tight" style={{ fontFamily: 'var(--font-jakarta)' }}>
              Shape the Future of <span className="gradient-text">Diagnostics</span>
            </h1>
            <p className="text-[var(--gray-300)] max-w-2xl text-base sm:text-lg leading-relaxed">
              Be part of a technology-driven diagnostic laboratory committed to scientific precision, clinical excellence, and heartfelt patient care.
            </p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent" />
        </section>

        {/* ═══ CULTURE & BENEFITS ═══ */}
        <section className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  title: 'State-of-the-Art Technology',
                  desc: 'Work alongside world-class automated analyzers from Roche, Sysmex, and Beckman Coulter with integrated digital LIMS workflows.',
                  icon: (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                  )
                },
                {
                  title: 'Accreditation & Standards',
                  desc: 'Strict NABL/ISO 15189 compliance, regular inter-lab proficiency rounds, and zero-compromise diagnostic protocols.',
                  icon: (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 14 14" /></svg>
                  )
                },
                {
                  title: 'Comprehensive Benefits',
                  desc: 'Competitive salary packages, family healthcare coverage, continuous CME credits, performance incentives, and clear career ladders.',
                  icon: (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                  )
                }
              ].map((benefit, i) => (
                <div key={i} className="p-6 rounded-2xl border border-[var(--gray-100)] bg-[var(--gray-50)] hover:border-[var(--teal)]/30 transition-all">
                  <div className="w-12 h-12 rounded-xl bg-white border border-[var(--gray-200)] flex items-center justify-center text-[var(--teal)] mb-4 shadow-sm">
                    {benefit.icon}
                  </div>
                  <h3 className="font-bold text-[var(--navy)] text-lg mb-2">{benefit.title}</h3>
                  <p className="text-sm text-[var(--gray-600)] leading-relaxed">{benefit.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ OPEN POSITIONS ═══ */}
        <section className="py-12 bg-[var(--gray-50)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-bold uppercase tracking-widest text-[var(--blue)] mb-2 block">Current Openings</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-[var(--navy)]" style={{ fontFamily: 'var(--font-jakarta)' }}>
                Explore Opportunities Across Our Network
              </h2>
              <p className="text-sm text-[var(--gray-500)] mt-2">
                We are actively looking for passionate healthcare professionals to join our laboratory and field logistics teams.
              </p>
            </div>

            <div className="space-y-6">
              {POSITIONS.map((job) => (
                <div key={job.id} className="bg-white rounded-2xl border border-[var(--gray-200)] p-6 sm:p-8 shadow-sm hover:shadow-md transition-all">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-5 border-b border-[var(--gray-100)]">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--blue)]/10 text-[var(--blue)]">
                          {job.department}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                          {job.type}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--gray-100)] text-[var(--gray-600)]">
                          📍 {job.location}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-[var(--navy)]">{job.title}</h3>
                      <p className="text-xs text-[var(--gray-400)] mt-1">Experience Required: <span className="font-semibold text-[var(--gray-600)]">{job.experience}</span></p>
                    </div>

                    <button
                      onClick={() => handleOpenApply(job)}
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[var(--teal)] hover:bg-[var(--teal-dark)] text-white font-semibold text-sm transition-all shadow-md shadow-[var(--teal)]/20 hover:scale-[1.02] shrink-0"
                    >
                      Apply Now
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                    </button>
                  </div>

                  <p className="text-sm text-[var(--gray-600)] my-4 leading-relaxed">{job.description}</p>

                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--navy)] mb-2">Key Requirements:</h4>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[var(--gray-600)]">
                      {job.requirements.map((req, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-[var(--teal)] font-bold">✓</span>
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ APPLICATION MODAL ═══ */}
        {selectedJob && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-[var(--gray-200)] flex flex-col max-h-[90vh]">
              <div className="px-6 py-5 border-b border-[var(--gray-100)] flex items-center justify-between bg-[var(--gray-50)]">
                <div>
                  <h3 className="text-base font-bold text-[var(--navy)]">Submit Application</h3>
                  <p className="text-xs text-[var(--teal)] font-semibold">{selectedJob.title}</p>
                </div>
                <button onClick={handleCloseModal} className="w-8 h-8 rounded-lg bg-white border border-[var(--gray-200)] flex items-center justify-center text-[var(--gray-500)] hover:text-[var(--navy)]">
                  ✕
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                {status === 'success' ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                      ✓
                    </div>
                    <h4 className="text-lg font-bold text-[var(--navy)] mb-1">Application Submitted!</h4>
                    <p className="text-sm text-[var(--gray-500)] mb-6">
                      Thank you for applying. Our talent acquisition team will review your credentials and contact you within 2 business days.
                    </p>
                    <button
                      onClick={handleCloseModal}
                      className="px-6 py-2.5 rounded-xl bg-[var(--navy)] text-white text-sm font-semibold hover:bg-[var(--navy)]/90"
                    >
                      Close Window
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {errorMessage && (
                      <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                        {errorMessage}
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-[var(--gray-700)] mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Dr. Rajesh Sharma"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--gray-200)] text-sm focus:outline-none focus:border-[var(--teal)]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-[var(--gray-700)] mb-1">Phone Number *</label>
                        <input
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="+91 98765 43210"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--gray-200)] text-sm focus:outline-none focus:border-[var(--teal)]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[var(--gray-700)] mb-1">Email Address</label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="doctor@example.com"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--gray-200)] text-sm focus:outline-none focus:border-[var(--teal)]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-[var(--gray-700)] mb-1">Years of Experience</label>
                        <input
                          type="text"
                          value={formData.experience}
                          onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                          placeholder="e.g. 4 years"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--gray-200)] text-sm focus:outline-none focus:border-[var(--teal)]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[var(--gray-700)] mb-1">Highest Degree / Cert</label>
                        <input
                          type="text"
                          value={formData.qualification}
                          onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                          placeholder="e.g. MD Pathology / B.Sc MLT"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--gray-200)] text-sm focus:outline-none focus:border-[var(--teal)]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[var(--gray-700)] mb-1">Notes / Current Organization</label>
                      <textarea
                        rows={3}
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Brief summary of your clinical background, current notice period, or portfolio links..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--gray-200)] text-sm focus:outline-none focus:border-[var(--teal)] resize-none"
                      />
                    </div>

                    <div className="pt-2 flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={handleCloseModal}
                        className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--gray-600)] hover:bg-[var(--gray-100)]"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={status === 'submitting'}
                        className="px-6 py-2.5 rounded-xl bg-[var(--teal)] text-white text-xs font-semibold hover:bg-[var(--teal-dark)] transition-all disabled:opacity-50 flex items-center gap-2"
                      >
                        {status === 'submitting' ? 'Submitting...' : 'Submit Application'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </HomepageAnimations>
  );
}
