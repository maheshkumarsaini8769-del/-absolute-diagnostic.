import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import HomepageAnimations from '@/components/HomepageAnimations'

export const metadata = { title: 'Blog | Absolute Diagnostic' }

export default async function BlogPage() {
  const blogs = await prisma.blog.findMany({
    where: { isActive: true },
    orderBy: { publishedAt: 'desc' }
  })

  return (
    <HomepageAnimations>
      <section className="relative bg-gradient-to-br from-[var(--navy)] via-[var(--navy-light)] to-[var(--navy)] overflow-hidden">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <nav className="flex items-center gap-2 text-sm text-white/50 mb-8">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
            <span className="text-white/80">Blog</span>
          </nav>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4" style={{ fontFamily: 'var(--font-jakarta)' }}>
            Health <span className="gradient-text">Blog</span>
          </h1>
          <p className="text-white/60 text-lg max-w-xl">
            Stay informed with the latest health tips and diagnostic insights.
          </p>
        </div>
      </section>

      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {blogs.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-[var(--gray-100)] flex items-center justify-center mx-auto mb-4">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--gray-400)" strokeWidth="1.5"><path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
              </div>
              <h3 className="text-lg font-bold text-[var(--navy)] mb-2">No Blog Posts Yet</h3>
              <p className="text-sm text-[var(--gray-500)]">Check back soon for health tips and updates.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 stagger reveal">
              {blogs.map((blog) => (
                <Link key={blog.id} href={`/blog/${blog.slug}`} className="surface-elevated rounded-2xl overflow-hidden group">
                  {blog.imageUrl && (
                    <div className="aspect-[16/9] overflow-hidden">
                      <img src={blog.imageUrl} alt={blog.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      {blog.author && <span className="text-xs text-[var(--gray-500)]">By {blog.author}</span>}
                      {blog.publishedAt && (
                        <span className="text-xs text-[var(--gray-400)]">
                          {new Date(blog.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                    </div>
                    <h2 className="font-bold text-[var(--navy)] mb-2 group-hover:text-[var(--blue)] transition-colors">{blog.title}</h2>
                    {blog.excerpt && <p className="text-sm text-[var(--gray-500)] line-clamp-2">{blog.excerpt}</p>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </HomepageAnimations>
  )
}
