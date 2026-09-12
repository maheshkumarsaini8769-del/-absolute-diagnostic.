import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import HomepageAnimations from '@/components/HomepageAnimations'

export const metadata = { title: 'Home Sample Collection | Absolute Diagnostic' }
export const dynamic = 'force-dynamic'

export default async function HomeCollectionPage() {
  const settings = await prisma.websiteSetting.findMany({})
  const settingsMap = Object.fromEntries(settings.map(s => [s.key, s.value]))
  const branches = await prisma.branch.findMany({ where: { isActive: true }, orderBy: { createdAt: 'desc' } })

  return (
    <HomepageAnimations>
      {/* ═══ HERO WITH BACKGROUND IMAGE ═══ */}
      <section className="relative overflow-hidden">
        {/* Home Collection Phlebotomist Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/images/hero/hero-home-collection.jpg" 
            alt="Home Sample Collection" 
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A1628]/95 via-[#0d2818]/85 to-[#0A1628]/75" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A1628]/95 via-transparent to-[#0A1628]/60" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
          <nav className="flex items-center gap-2 text-sm text-slate-400 mb-6">
            <Link href="/" className="hover:text-teal-400 transition-colors">Home</Link>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
            <span className="text-white">Home Collection</span>
          </nav>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4" style={{ fontFamily: 'var(--font-jakarta)' }}>
            Home Sample <span className="gradient-text">Collection</span>
          </h1>
          <p className="text-slate-300 text-base sm:text-lg max-w-xl leading-relaxed">
            Get your samples collected from the comfort of your home by trained certified phlebotomists. 100% sterile, hygienic, and convenient.
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />
      </section>

      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="reveal">
              <span className="inline-block text-xs font-bold tracking-[0.2em] uppercase text-[var(--blue)] mb-3">How It Works</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-[var(--navy)] mb-6" style={{ fontFamily: 'var(--font-jakarta)' }}>
                Simple 4-Step Process
              </h2>
              <div className="space-y-6">
                {[
                  { step: '01', title: 'Book Online', desc: 'Select your tests and choose home collection as your preferred option.' },
                  { step: '02', title: 'Confirm Details', desc: 'Verify your details and confirm the appointment time slot.' },
                  { step: '03', title: 'Sample Collection', desc: 'Our trained phlebotomist visits your home at the scheduled time.' },
                  { step: '04', title: 'Get Results', desc: 'Receive your reports digitally. Download or view online anytime.' },
                ].map((item) => (
                  <div key={item.step} className="flex gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--blue)]/10 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-[var(--blue)]">{item.step}</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-[var(--navy)] mb-1">{item.title}</h3>
                      <p className="text-sm text-[var(--gray-500)]">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="reveal-right">
              <div className="surface-elevated rounded-2xl p-8">
                <h3 className="text-xl font-bold text-[var(--navy)] mb-6" style={{ fontFamily: 'var(--font-jakarta)' }}>Book Home Collection</h3>
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-[var(--gray-50)] border border-[var(--gray-100)]">
                    <p className="text-sm font-semibold text-[var(--navy)]">Collection Charge</p>
                    <p className="text-2xl font-bold text-[var(--blue)] mt-1">₹{settingsMap.home_collection_charge || '0'}</p>
                    <p className="text-xs text-[var(--gray-500)] mt-1">Additional charge per visit</p>
                  </div>
                  <div className="p-4 rounded-xl bg-[var(--gray-50)] border border-[var(--gray-100)]">
                    <p className="text-sm font-semibold text-[var(--navy)]">Availability</p>
                    <p className="text-sm text-[var(--gray-600)] mt-1">{settingsMap.home_collection_timing || 'Mon-Sat: 7:00 AM - 10:00 AM'}</p>
                  </div>
                  {settingsMap.home_collection_areas && (
                    <div className="p-4 rounded-xl bg-[var(--gray-50)] border border-[var(--gray-100)]">
                      <p className="text-sm font-semibold text-[var(--navy)]">Service Areas</p>
                      <p className="text-sm text-[var(--gray-600)] mt-1">{settingsMap.home_collection_areas}</p>
                    </div>
                  )}
                </div>
                <Link href="/booking?collection=home_collection" className="btn-primary w-full text-center mt-6">
                  <span>Schedule Home Visit</span>
                </Link>

                <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-teal-50/70 border border-teal-100">
                    <span className="text-xl">🦋</span>
                    <div>
                      <h4 className="text-xs font-bold text-teal-950">Painless Butterfly Guarantee</h4>
                      <p className="text-[11px] text-teal-800 mt-0.5">We use ultra-fine pediatric butterfly needles for smooth, zero-pain vein puncture.</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                    <span className="text-slate-600 font-medium">Already booked home sample?</span>
                    <Link href="/track" className="font-bold text-teal-700 hover:text-teal-900 underline">
                      Track Live Status →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {branches.length > 0 && (
        <section className="py-20 lg:py-28 bg-gradient-to-b from-[var(--gray-50)] to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-[var(--navy)] text-center mb-12" style={{ fontFamily: 'var(--font-jakarta)' }}>Available Locations</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {branches.filter(b => b.homeCollectionAvailable).map((branch) => (
                <div key={branch.id} className="surface-elevated rounded-2xl p-6">
                  <h3 className="font-bold text-[var(--navy)] mb-2">{branch.name}</h3>
                  {branch.address && <p className="text-sm text-[var(--gray-500)] mb-1">{branch.address}</p>}
                  {branch.city && <p className="text-sm text-[var(--gray-500)] mb-3">{branch.city}</p>}
                  {branch.phone && (
                    <a href={`tel:${branch.phone}`} className="text-sm text-[var(--blue)] font-semibold">Call: {branch.phone}</a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </HomepageAnimations>
  )
}
