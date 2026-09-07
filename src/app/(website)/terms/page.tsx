import Link from 'next/link'

export const metadata = { title: 'Terms of Service | Absolute Diagnostic' }

export default function TermsPage() {
  return (
    <>
      <section className="relative bg-gradient-to-br from-[var(--navy)] via-[var(--navy-light)] to-[var(--navy)] overflow-hidden">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <nav className="flex items-center gap-2 text-sm text-white/50 mb-8">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
            <span className="text-white/80">Terms of Service</span>
          </nav>
          <h1 className="text-4xl sm:text-5xl font-bold text-white" style={{ fontFamily: 'var(--font-jakarta)' }}>Terms of Service</h1>
        </div>
      </section>

      <section className="py-20 lg:py-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 prose prose-gray max-w-none">
          <p className="text-[var(--gray-500)] text-sm mb-8">Last updated: January 2024</p>

          <h2 className="text-2xl font-bold text-[var(--navy)]">1. Acceptance of Terms</h2>
          <p className="text-[var(--gray-600)]">By accessing or using the services provided by Absolute Diagnostic, you agree to be bound by these Terms of Service.</p>

          <h2 className="text-2xl font-bold text-[var(--navy)]">2. Services</h2>
          <p className="text-[var(--gray-600)]">We provide diagnostic laboratory services including but not limited to sample collection, testing, and report generation. Services may be availed through our website, phone, or in-person at our facilities.</p>

          <h2 className="text-2xl font-bold text-[var(--navy)]">3. Booking and Payments</h2>
          <p className="text-[var(--gray-600)]">Bookings are subject to availability. Payment terms are as specified at the time of booking. Prices may be updated without prior notice.</p>

          <h2 className="text-2xl font-bold text-[var(--navy)]">4. Report Delivery</h2>
          <p className="text-[var(--gray-600)]">Report turnaround times are estimates and may vary based on test requirements. We strive to deliver reports within the stated timeframe.</p>

          <h2 className="text-2xl font-bold text-[var(--navy)]">5. Home Collection</h2>
          <p className="text-[var(--gray-600)]">Home collection services are subject to availability and additional charges. Patient cooperation is required for proper sample collection.</p>

          <h2 className="text-2xl font-bold text-[var(--navy)]">6. Limitation of Liability</h2>
          <p className="text-[var(--gray-600)]">Our liability is limited to the services provided. We are not liable for delays caused by circumstances beyond our control.</p>

          <h2 className="text-2xl font-bold text-[var(--navy)]">7. Governing Law</h2>
          <p className="text-[var(--gray-600)]">These terms are governed by the laws of India. Any disputes shall be subject to the jurisdiction of courts in the applicable region.</p>
        </div>
      </section>
    </>
  )
}
