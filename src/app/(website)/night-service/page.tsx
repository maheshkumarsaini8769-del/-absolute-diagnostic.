import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import HomepageAnimations from '@/components/HomepageAnimations'

export const metadata = { title: 'Night Service | Absolute Diagnostic' }

export default async function NightServicePage() {
  const settings = await prisma.websiteSetting.findMany({})
  const s = Object.fromEntries(settings.map(s => [s.key, s.value]))
  const nightEnabled = s.night_service_enabled !== 'false'

  return (
    <HomepageAnimations>
      <section className="relative bg-gradient-to-br from-[#1a0533] via-[#2d1052] to-[#0f0622] overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full blur-[160px] opacity-10 animate-morph" />
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-purple-400 rounded-full blur-[180px] opacity-10 animate-morph" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <nav className="flex items-center gap-2 text-sm text-white/50 mb-8">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
            <span className="text-white/80">Night Service</span>
          </nav>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4" style={{ fontFamily: 'var(--font-jakarta)' }}>
            Night Collection <span className="text-purple-400">Service</span>
          </h1>
          <p className="text-purple-200/60 text-lg max-w-xl">
            Need sample collection after hours? Our night service is available for urgent diagnostic needs.
          </p>
        </div>
      </section>

      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div className="reveal">
              <span className="inline-block text-xs font-bold tracking-[0.2em] uppercase text-purple-600 mb-3">About Night Service</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-[var(--navy)] mb-6" style={{ fontFamily: 'var(--font-jakarta)' }}>
                Emergency Diagnostics When You Need Them
              </h2>
              <p className="text-[var(--gray-600)] leading-relaxed mb-8 text-lg">
                Our night collection service provides sample collection during evening and night hours for urgent medical needs. This is a request-based service with additional charges.
              </p>

              <div className="space-y-4 mb-8">
                {[
                  { title: 'Request-Based', desc: 'Submit a request and our team will confirm availability.' },
                  { title: 'Additional Charges', desc: 'Night service includes a surcharge as configured by the lab.' },
                  { title: 'Limited Tests', desc: 'Not all tests are available for night collection. Check allowed tests.' },
                  { title: 'Admin Confirmation', desc: 'Night bookings require admin approval before confirmation.' },
                ].map((item) => (
                  <div key={item.title} className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center shrink-0 mt-0.5">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-[var(--navy)] text-sm">{item.title}</h3>
                      <p className="text-sm text-[var(--gray-500)]">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {nightEnabled ? (
                <Link href="/night-request" className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold hover:shadow-2xl hover:shadow-purple-500/30 transition-all duration-300 hover:-translate-y-1">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
                  Request Night Collection
                </Link>
              ) : (
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                  <p className="text-sm text-[var(--gray-600)]">Night service is currently unavailable. Please contact the lab for urgent requirements.</p>
                </div>
              )}
            </div>

            <div className="reveal-right">
              <div className="surface-elevated rounded-2xl p-8">
                <h3 className="text-xl font-bold text-[var(--navy)] mb-6" style={{ fontFamily: 'var(--font-jakarta)' }}>Night Service Details</h3>
                <div className="space-y-4">
                  {s.night_service_start && s.night_service_end && (
                    <div className="p-4 rounded-xl bg-[var(--gray-50)] border border-[var(--gray-100)]">
                      <p className="text-sm font-semibold text-[var(--navy)]">Service Hours</p>
                      <p className="text-lg font-bold text-purple-600 mt-1">{s.night_service_start} - {s.night_service_end}</p>
                    </div>
                  )}
                  {s.night_charge && (
                    <div className="p-4 rounded-xl bg-[var(--gray-50)] border border-[var(--gray-100)]">
                      <p className="text-sm font-semibold text-[var(--navy)]">Night Surcharge</p>
                      <p className="text-2xl font-bold text-purple-600 mt-1">₹{s.night_charge}</p>
                    </div>
                  )}
                  {s.night_min_notice && (
                    <div className="p-4 rounded-xl bg-[var(--gray-50)] border border-[var(--gray-100)]">
                      <p className="text-sm font-semibold text-[var(--navy)]">Minimum Notice</p>
                      <p className="text-sm text-[var(--gray-600)] mt-1">{s.night_min_notice} hours before collection</p>
                    </div>
                  )}
                  {s.night_allowed_tests && (
                    <div className="p-4 rounded-xl bg-[var(--gray-50)] border border-[var(--gray-100)]">
                      <p className="text-sm font-semibold text-[var(--navy)]">Allowed Tests</p>
                      <p className="text-sm text-[var(--gray-600)] mt-1">{s.night_allowed_tests}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </HomepageAnimations>
  )
}
