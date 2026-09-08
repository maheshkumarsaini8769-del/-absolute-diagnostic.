import Link from 'next/link'
import HomepageAnimations from '@/components/HomepageAnimations'
import HomepageFAQs from '@/components/HomepageFAQs'

export const metadata = { title: 'FAQ | Absolute Diagnostic' }

export const dynamic = 'force-dynamic'

export default async function FAQPage() {
  let faqs: any[] = []
  try {
    const res = await fetch('/api/faqs', { cache: 'no-store' })
    if (res.ok) {
      const data = await res.json()
      faqs = data.faqs || []
    }
  } catch {}

  return (
    <HomepageAnimations>
      <section className="relative bg-gradient-to-br from-[var(--navy)] via-[var(--navy-light)] to-[var(--navy)] overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-[var(--blue)] rounded-full blur-[160px] opacity-15 animate-morph" />
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-[var(--teal)] rounded-full blur-[180px] opacity-10 animate-morph" style={{ animationDelay: '4s' }} />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <nav className="flex items-center gap-2 text-sm text-white/50 mb-8">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
            <span className="text-white/80">FAQ</span>
          </nav>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4" style={{ fontFamily: 'var(--font-jakarta)' }}>
            Frequently Asked <span className="gradient-text">Questions</span>
          </h1>
          <p className="text-white/60 text-lg max-w-xl">
            Find answers to common questions about our diagnostic services.
          </p>
        </div>
      </section>

      <section className="py-20 lg:py-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <HomepageFAQs />
        </div>
      </section>
    </HomepageAnimations>
  )
}
