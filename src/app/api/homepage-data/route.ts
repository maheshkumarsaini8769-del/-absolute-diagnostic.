import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAllSettings, getAllHomepageContent } from '@/lib/settings'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const [rawTests, rawPackages, rawServices, rawTestimonials, content, settings, rawFaqs, rawBranches] = await Promise.all([
      prisma.test.findMany({ where: { isActive: true, isFeatured: true }, orderBy: { displayOrder: 'asc' } }),
      prisma.package.findMany({ where: { isActive: true }, orderBy: { displayOrder: 'asc' } }),
      prisma.service.findMany({ where: { isActive: true }, orderBy: { displayOrder: 'asc' } }),
      prisma.testimonial.findMany({ where: { isActive: true } }),
      getAllHomepageContent(),
      getAllSettings(),
      prisma.fAQ.findMany({ where: { isActive: true }, orderBy: { displayOrder: 'asc' } }),
      prisma.branch.findMany({ where: { isActive: true }, orderBy: { createdAt: 'desc' } }),
    ])

    // Manually resolve category for tests
    const categoryIds = [...new Set(rawTests.map((t: any) => t.categoryId).filter(Boolean))]
    const categories = categoryIds.length > 0
      ? await prisma.testCategory.findMany({ where: { id: { in: categoryIds } } })
      : []
    const catMap: Record<string, any> = {}
    categories.forEach((c: any) => { catMap[c.id] = c })
    const featuredTests = rawTests.map((t: any) => ({ ...t, category: catMap[t.categoryId] || null }))

    // Manually resolve packageTests
    const pkgIds = rawPackages.map((p: any) => p.id)
    const allPkgTests = pkgIds.length > 0
      ? await prisma.packageTest.findMany({ where: { packageId: { in: pkgIds } } })
      : []
    const testIds = [...new Set(allPkgTests.map((pt: any) => pt.testId).filter(Boolean))]
    const pkgTests = testIds.length > 0
      ? await prisma.test.findMany({ where: { id: { in: testIds } } })
      : []
    const testMap: Record<string, any> = {}
    pkgTests.forEach((t: any) => { testMap[t.id] = t })

    const allPackages = rawPackages.map((pkg: any) => ({
      ...pkg,
      packageTests: allPkgTests
        .filter((pt: any) => pt.packageId === pkg.id)
        .map((pt: any) => ({ id: pt.id, test: testMap[pt.testId] || { name: 'Unknown', slug: '', price: 0 } }))
    }))

    return NextResponse.json(JSON.parse(JSON.stringify({
      featuredTests,
      allPackages,
      services: rawServices,
      testimonials: rawTestimonials,
      content,
      settings,
      faqs: rawFaqs,
      branches: rawBranches,
    })))
  } catch (error: any) {
    console.error('Homepage data error:', error)
    return NextResponse.json({ error: error?.message || 'Unknown error' }, { status: 500 })
  }
}
