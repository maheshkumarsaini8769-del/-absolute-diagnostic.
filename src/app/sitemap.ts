import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://absolutediagnostic.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE_URL}/tests`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/packages`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/services`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/branches`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/booking`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE_URL}/reports`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/night-request`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
  ];

  try {
    const [tests, packages, services] = await Promise.all([
      prisma.test.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
      prisma.package.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
      prisma.service.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
    ]);

    const testPages: MetadataRoute.Sitemap = tests.map((test) => ({
      url: `${BASE_URL}/tests/${test.slug}`,
      lastModified: test.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

    const packagePages: MetadataRoute.Sitemap = packages.map((pkg) => ({
      url: `${BASE_URL}/packages#${pkg.slug}`,
      lastModified: pkg.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

    const servicePages: MetadataRoute.Sitemap = services.map((service) => ({
      url: `${BASE_URL}/services/${service.slug}`,
      lastModified: service.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }));

    return [...staticPages, ...testPages, ...packagePages, ...servicePages];
  } catch {
    return staticPages;
  }
}
