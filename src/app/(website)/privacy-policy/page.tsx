import Link from 'next/link'

export const metadata = { title: 'Privacy Policy | Absolute Diagnostic' }

export default function PrivacyPolicyPage() {
  return (
    <>
      <section className="relative bg-gradient-to-br from-[var(--navy)] via-[var(--navy-light)] to-[var(--navy)] overflow-hidden">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <nav className="flex items-center gap-2 text-sm text-white/50 mb-8">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
            <span className="text-white/80">Privacy Policy</span>
          </nav>
          <h1 className="text-4xl sm:text-5xl font-bold text-white" style={{ fontFamily: 'var(--font-jakarta)' }}>Privacy Policy</h1>
        </div>
      </section>

      <section className="py-20 lg:py-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 prose prose-gray max-w-none">
          <p className="text-[var(--gray-500)] text-sm mb-8">Last updated: January 2024</p>

          <h2 className="text-2xl font-bold text-[var(--navy)]">1. Information We Collect</h2>
          <p className="text-[var(--gray-600)]">We collect personal information you provide directly, including your name, phone number, email address, and address when you book a diagnostic test or use our services.</p>

          <h2 className="text-2xl font-bold text-[var(--navy)]">2. How We Use Your Information</h2>
          <p className="text-[var(--gray-600)]">Your information is used to process bookings, collect samples, generate and deliver diagnostic reports, communicate appointment details, and improve our services.</p>

          <h2 className="text-2xl font-bold text-[var(--navy)]">3. Data Security</h2>
          <p className="text-[var(--gray-600)]">We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>

          <h2 className="text-2xl font-bold text-[var(--navy)]">4. Report Confidentiality</h2>
          <p className="text-[var(--gray-600)]">Your diagnostic reports are confidential. We do not share them with third parties without your explicit consent, except as required by law.</p>

          <h2 className="text-2xl font-bold text-[var(--navy)]">5. Data Retention</h2>
          <p className="text-[var(--gray-600)]">We retain your personal information and medical records as required by applicable laws and regulations for diagnostic laboratories.</p>

          <h2 className="text-2xl font-bold text-[var(--navy)]">6. Your Rights</h2>
          <p className="text-[var(--gray-600)]">You have the right to access, correct, or delete your personal information. You may also request a copy of your data held by us.</p>

          <h2 className="text-2xl font-bold text-[var(--navy)]">7. Contact Us</h2>
          <p className="text-[var(--gray-600)]">For any privacy-related queries, please contact us through our official channels listed on the contact page.</p>
        </div>
      </section>
    </>
  )
}
