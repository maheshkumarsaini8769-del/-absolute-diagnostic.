import Link from 'next/link';
import BookingForm from '@/components/BookingForm';
import HomepageAnimations from '@/components/HomepageAnimations';

export const metadata = {
  title: 'Book a Test',
  description: 'Book your diagnostic test online. Choose from lab visit, home collection, or night request. Quick and easy booking.',
};

export default async function BookingPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const collection = typeof params.collection === 'string' ? params.collection : undefined;

  return (
    <HomepageAnimations>
      <div className="pb-20 md:pb-0">
        {/* ═══ DARK HERO ═══ */}
        <section className="relative overflow-hidden gradient-hero">
          <div className="absolute inset-0">
            <div className="absolute top-10 left-1/4 w-64 h-64 bg-[var(--blue)] rounded-full blur-[160px] opacity-15" />
            <div className="absolute bottom-10 right-1/4 w-48 h-48 bg-[var(--teal)] rounded-full blur-[140px] opacity-10" />
          </div>
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
            <nav className="text-sm text-[var(--gray-400)] mb-6" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-[var(--teal)] transition-colors">Home</Link>
              <span className="mx-2">/</span>
              <span className="text-white">Book a Test</span>
            </nav>
            <h1
              className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4"
              style={{ fontFamily: 'var(--font-jakarta)' }}
            >
              Book a <span className="gradient-text">Test</span>
            </h1>
            <p className="text-[var(--gray-400)] mt-2 max-w-2xl text-lg">
              Select your tests, choose a collection method, and schedule your appointment.
            </p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />
        </section>

        {/* ═══ BOOKING FORM ═══ */}
        <section className="py-20 lg:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <BookingForm initialCollection={collection} />
          </div>
        </section>
      </div>
    </HomepageAnimations>
  );
}
