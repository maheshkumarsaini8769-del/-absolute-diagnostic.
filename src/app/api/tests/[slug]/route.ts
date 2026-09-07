import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const test = await prisma.test.findFirst({
      where: { slug, isActive: true },
      include: { category: true },
    })
    if (!test) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const relatedTests = test.category?.slug
      ? await prisma.test.findMany({
          where: { isActive: true, category: { slug: test.category.slug }, slug: { not: slug } },
          include: { category: true },
          orderBy: { displayOrder: 'asc' },
          take: 4,
        })
      : []

    return NextResponse.json(JSON.parse(JSON.stringify({ test, relatedTests })))
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed' }, { status: 500 })
  }
}
