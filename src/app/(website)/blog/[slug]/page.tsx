import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import HomepageAnimations from '@/components/HomepageAnimations'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const blog = await prisma.blog.findUnique({ where: { slug } })
  return { title: blog ? `${blog.title} | Absolute Diagnostic` : 'Blog Not Found' }
}

export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const blog = await prisma.blog.findUnique({ where: { slug } })
  if (!blog || !blog.isActive) notFound()

  return (
    <HomepageAnimations>
      <section className="relative bg-gradient-to-br from-[var(--navy)] via-[var(--navy-light)] to-[var(--navy)] overflow-hidden">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <nav className="flex items-center gap-2 text-sm text-white/50 mb-8">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
            <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
            <span className="text-white/80 truncate max-w-[200px]">{blog.title}</span>
          </nav>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4" style={{ fontFamily: 'var(--font-jakarta)' }}>
            {blog.title}
          </h1>
          <div className="flex items-center gap-4 text-white/60 text-sm">
            {blog.author && <span>By {blog.author}</span>}
            {blog.publishedAt && (
              <span>{new Date(blog.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            )}
          </div>
        </div>
      </section>

      <article className="py-20 lg:py-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {blog.imageUrl && (
            <div className="rounded-2xl overflow-hidden mb-8">
              <img src={blog.imageUrl} alt={blog.title} className="w-full h-auto" />
            </div>
          )}
          <div className="prose prose-lg max-w-none text-[var(--gray-600)]">
            {blog.content ? (
              <div dangerouslySetInnerHTML={{ __html: blog.content }} />
            ) : blog.excerpt ? (
              <p>{blog.excerpt}</p>
            ) : (
              <p>No content available.</p>
            )}
          </div>
          <div className="mt-12 pt-8 border-t border-[var(--gray-100)]">
            <Link href="/blog" className="inline-flex items-center gap-2 text-[var(--blue)] font-semibold hover:text-[var(--blue-light)] transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
              Back to Blog
            </Link>
          </div>
        </div>
      </article>
    </HomepageAnimations>
  )
}
