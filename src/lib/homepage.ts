import { prisma } from '@/lib/prisma'
import { getAllSettings, getAllHomepageContent } from '@/lib/settings'

export async function getHomepageData() {
  try {
    const [rawTests, rawPackages, rawServices, rawTestimonials, content, settings, rawFaqs, rawBranches] = await Promise.all([
      prisma.test.findMany({ where: { isActive: true, isFeatured: true }, orderBy: { displayOrder: 'asc' } }),
      prisma.package.findMany({ where: { isActive: true }, orderBy: { displayOrder: 'asc' } }),
      prisma.service.findMany({ where: { isActive: true }, orderBy: { displayOrder: 'asc' } }),
      prisma.testimonial.findMany({ where: { isActive: true }, orderBy: { createdAt: 'desc' } }),
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

    const normalizedSettings = {
      site_name: settings.site_name || settings.lab_name || 'Absolute Diagnostic',
      contact_phone: settings.contact_phone || settings.primary_phone || '+919876543210',
      primary_phone: settings.primary_phone || settings.contact_phone || '+919876543210',
      whatsapp_number: settings.whatsapp_number || '+919876543210',
      emergency_number: settings.emergency_number || settings.primary_phone || '+919876543210',
      email: settings.email || settings.contact_email || 'info@absolutediagnostic.com',
      address: settings.address || settings.contact_address || '123 Health Street, Medical District, Mumbai',
      working_hours: settings.working_hours || 'Mon-Sat: 7:00 AM - 9:00 PM | Sun: 8:00 AM - 2:00 PM',
      ...settings,
    }

    return JSON.parse(JSON.stringify({
      featuredTests,
      allPackages,
      services: rawServices,
      testimonials: rawTestimonials,
      content,
      settings: normalizedSettings,
      faqs: rawFaqs,
      branches: rawBranches,
    }))
  } catch (error: any) {
    console.error('getHomepageData direct error:', error)
    return null
  }
}
