import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="relative inline-block mb-8">
          <span className="text-8xl sm:text-9xl font-bold gradient-text" style={{ fontFamily: 'var(--font-jakarta)' }}>
            404
          </span>
          <div className="absolute -top-2 -right-4 w-8 h-8 rounded-full bg-teal/20 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-navy mb-3" style={{ fontFamily: 'var(--font-jakarta)' }}>
          Page Not Found
        </h1>
        <p className="text-gray-500 mb-8 leading-relaxed">
          The page you are looking for does not exist or has been moved. Please check the URL or navigate back to our homepage.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue to-blue-light text-white font-semibold hover:shadow-lg hover:shadow-blue/25 transition-all"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Back to Home
          </Link>
          <Link
            href="/booking"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-gray-200 text-sm font-medium text-navy hover:border-blue hover:text-blue transition-colors"
          >
            Book a Test
          </Link>
        </div>
        <div className="mt-10 pt-8 border-t border-gray-100">
          <p className="text-xs text-gray-400 mb-3">Quick Links</p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500">
            <Link href="/tests" className="hover:text-blue transition-colors">Tests</Link>
            <Link href="/packages" className="hover:text-blue transition-colors">Packages</Link>
            <Link href="/services" className="hover:text-blue transition-colors">Services</Link>
            <Link href="/branches" className="hover:text-blue transition-colors">Branches</Link>
            <Link href="/reports" className="hover:text-blue transition-colors">Reports</Link>
            <Link href="/contact" className="hover:text-blue transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
