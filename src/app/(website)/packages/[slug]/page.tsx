import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import HomepageAnimations from '@/components/HomepageAnimations'
import PackageDetailClient from './PackageDetailClient'

export const dynamic = 'force-dynamic'

async function getPackageData(slug: string) {
  const pkg = await prisma.package.findUnique({
    where: { slug },
  })
  if (!pkg) return null

  const packageTests = await prisma.packageTest.findMany({
    where: { packageId: pkg.id },
  })

  const testIds = packageTests.map((pt: any) => pt.testId).filter(Boolean)
  const tests = testIds.length > 0
    ? await prisma.test.findMany({ where: { id: { in: testIds } } })
    : []

  const categoryIds = [...new Set(tests.map((t: any) => t.categoryId).filter(Boolean))]
  const categories = categoryIds.length > 0
    ? await prisma.testCategory.findMany({ where: { id: { in: categoryIds } } })
    : []

  const catMap: Record<string, any> = {}
  categories.forEach((c: any) => { catMap[c.id] = c })
  const testMap: Record<string, any> = {}
  tests.forEach((t: any) => { testMap[t.id] = { ...t, category: catMap[t.categoryId] || null } })

  const enrichedPackageTests = packageTests.map((pt: any) => ({
    id: pt.id,
    test: testMap[pt.testId] || { id: pt.testId, name: 'Unknown', slug: '', price: 0 },
  }))

  return JSON.parse(JSON.stringify({ ...pkg, packageTests: enrichedPackageTests }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const pkg = await getPackageData(slug)
  return { title: pkg ? `${pkg.name} | Absolute Diagnostic` : 'Package Not Found' }
}

export default async function PackageDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const pkg = await getPackageData(slug)
  if (!pkg || !pkg.isActive) notFound()

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://absolutediagnostic.com'

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'MedicalBundle',
    name: pkg.name,
    description: pkg.description || undefined,
    url: `${baseUrl}/packages/${pkg.slug}`,
    offers: {
      '@type': 'Offer',
      price: pkg.price,
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
      seller: { '@type': 'DiagnosticLab', name: 'Absolute Diagnostic', url: baseUrl }
    },
    provider: { '@type': 'DiagnosticLab', name: 'Absolute Diagnostic', url: baseUrl },
    hasPart: (pkg.packageTests || []).map((pt: any) => ({
      '@type': 'MedicalTest',
      name: pt.test.name,
      url: `${baseUrl}/tests/${pt.test.slug}`,
      offers: { '@type': 'Offer', price: pt.test.price, priceCurrency: 'INR' }
    }))
  }

  return (
    <HomepageAnimations>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <PackageDetailClient pkg={pkg} />
    </HomepageAnimations>
  )
}
