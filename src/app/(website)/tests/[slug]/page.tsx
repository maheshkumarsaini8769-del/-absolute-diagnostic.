import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import HomepageAnimations from '@/components/HomepageAnimations';
import TestDetailClient from './TestDetailClient';

export const dynamic = 'force-dynamic';

async function getTestData(slug: string) {
  const test = await prisma.test.findFirst({
    where: { slug, isActive: true },
  });
  if (!test) return null;

  let category = null;
  if ((test as any).categoryId) {
    category = await prisma.testCategory.findUnique({ where: { id: (test as any).categoryId } });
  }
  const testWithCategory = { ...test, category };

  const relatedTests = category?.slug
    ? await prisma.test.findMany({
        where: {
          isActive: true,
          slug: { not: slug },
        },
        orderBy: { displayOrder: 'asc' },
        take: 4,
      })
    : [];

  return { test: testWithCategory, relatedTests: JSON.parse(JSON.stringify(relatedTests)) };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getTestData(slug);
  if (!data) return { title: 'Test Not Found' };
  return {
    title: data.test.name,
    description: data.test.shortDescription || data.test.description || `${data.test.name} - diagnostic test at Absolute Diagnostic`,
  };
}

export default async function TestDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getTestData(slug);
  if (!data) notFound();

  const { test, relatedTests } = data;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://absolutediagnostic.com'

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'MedicalTest',
    name: test.name,
    description: test.shortDescription || test.description || undefined,
    url: `${baseUrl}/tests/${test.slug}`,
    usesDevice: { '@type': 'MedicalDevice', name: 'Laboratory Equipment' },
    preparation: test.preparationInstructions || undefined,
    procedure: {
      '@type': 'MedicalProcedure',
      name: test.name,
      description: test.shortDescription || test.description || undefined,
      procedureType: 'DiagnosticProcedure'
    },
    offers: {
      '@type': 'Offer',
      price: test.price,
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
      seller: { '@type': 'DiagnosticLab', name: 'Absolute Diagnostic', url: baseUrl }
    },
    provider: { '@type': 'DiagnosticLab', name: 'Absolute Diagnostic', url: baseUrl }
  }

  const safeTest = JSON.parse(JSON.stringify(test))

  return (
    <HomepageAnimations>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <TestDetailClient test={safeTest} relatedTests={relatedTests} />
    </HomepageAnimations>
  );
}
